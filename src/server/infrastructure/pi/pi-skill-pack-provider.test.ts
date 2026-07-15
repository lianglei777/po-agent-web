import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type {
  PackageManager,
  ResolvedPaths,
} from "@earendil-works/pi-coding-agent";
import { describe, expect, it, vi } from "vitest";
import type { OfficialSkillPackDefinition } from "./official-skill-packs";
import {
  canUpdatePackageSource,
  isLocalPackageSource,
  normalizeManualPackageSource,
  safePackageSource,
} from "./package-source";
import { PiSkillPackProvider } from "./pi-skill-pack-provider";

const source = path.resolve("C:\\app\\developer-workflows");
const catalog: OfficialSkillPackDefinition[] = [
  {
    id: "developer-workflows",
    version: "1.0.0",
    source,
    name: "Developer Workflows",
    description: "Focused developer workflows",
    expectedSkills: ["investigate-failure", "prepare-change"],
    containsExtensions: false,
  },
];

describe("PiSkillPackProvider", () => {
  it("validates and classifies manual package sources", () => {
    const local = path.resolve("C:\\packs\\release");
    expect(normalizeManualPackageSource(local)).toBe(local);
    expect(normalizeManualPackageSource("npm:@scope/release-pack")).toBe(
      "npm:@scope/release-pack",
    );
    expect(normalizeManualPackageSource("npm:release-pack@^1.2.3")).toBe(
      "npm:release-pack@^1.2.3",
    );
    expect(normalizeManualPackageSource("git:git@github.com:org/release.git")).toBe(
      "git:git@github.com:org/release.git",
    );
    expect(
      normalizeManualPackageSource("https://github.com/org/release.git"),
    ).toBe("https://github.com/org/release.git");
    expect(isLocalPackageSource(local)).toBe(true);
    expect(canUpdatePackageSource(local)).toBe(false);
    expect(canUpdatePackageSource("npm:@scope/release-pack")).toBe(true);
    expect(canUpdatePackageSource("git:git@github.com:org/release.git")).toBe(
      true,
    );
    expect(canUpdatePackageSource("git:org/release")).toBe(true);
    expect(canUpdatePackageSource("git@github.com:org/release.git")).toBe(
      false,
    );

    for (const invalid of [
      "./relative-pack",
      "../relative-pack",
      "@scope/release-pack",
      "git@github.com:org/release.git",
      "git+https://github.com/org/release.git",
      "git:https://user:secret@github.com/org/release.git",
      "npm:release-pack@https://user:secret@example.com/a.tgz",
      "npm:release-pack@file:C:\\secret",
      "npm:release-pack@npm:other@1.0.0",
      "https://user:secret@example.com/pack.git",
      "https://example.com/pack.git?token=secret",
      "https://example.com/pack.git#main",
      "ftp://example.com/pack.tgz",
      "npm:pack\nother",
    ]) {
      expect(() => normalizeManualPackageSource(invalid)).toThrowError();
    }
    expect(
      safePackageSource(
        "https://user:secret@example.com/pack.git?token=hidden#fragment",
      ),
    ).toBe("https://example.com/pack.git");
    expect(safePackageSource("token@example.com:org/pack.git")).toBe(
      "example.com:org/pack.git",
    );
    expect(safePackageSource("git:git@example.com:org/pack.git")).toBe(
      "git:example.com:org/pack.git",
    );
  });

  it("discloses expected skills before installation", async () => {
    const manager = fakePackageManager();
    const provider = new PiSkillPackProvider(() => manager, catalog);

    const result = await provider.list("C:\\work");

    expect(result.packs[0]).toMatchObject({
      status: "available",
      resources: {
        skills: ["investigate-failure", "prepare-change"],
      },
    });
  });

  it("marks a configured package without resolved resources as broken", async () => {
    const manager = fakePackageManager();
    vi.mocked(manager.listConfiguredPackages).mockReturnValue([
      configuredPackage(),
    ]);
    const provider = new PiSkillPackProvider(() => manager, catalog);

    const result = await provider.list("C:\\work");

    expect(result.packs[0]).toMatchObject({
      status: "broken",
      scope: "project",
    });
  });

  it("keeps an installed filtered package healthy when all resources are disabled", async () => {
    const manager = fakePackageManager();
    vi.mocked(manager.listConfiguredPackages).mockReturnValue([
      { ...configuredPackage(), filtered: true },
    ]);
    const provider = new PiSkillPackProvider(() => manager, []);

    const result = await provider.list("C:\\work");

    expect(result.packs[0]).toMatchObject({
      status: "installed",
      resources: { skills: [], extensions: [], prompts: [], themes: [] },
    });
  });

  it("marks an installed third-party package as broken when resolution fails", async () => {
    const manager = fakePackageManager();
    vi.mocked(manager.listConfiguredPackages).mockReturnValue([
      configuredPackage(),
    ]);
    vi.mocked(manager.resolve).mockRejectedValue(new Error("invalid package"));
    const provider = new PiSkillPackProvider(() => manager, []);

    const result = await provider.list("C:\\work");

    expect(result.packs[0]?.status).toBe("broken");
  });

  it("redacts credentials from configured package sources", async () => {
    const manager = fakePackageManager();
    vi.mocked(manager.listConfiguredPackages).mockReturnValue([
      {
        source:
          "https://user:secret@example.com/org/pack.git?token=hidden#fragment",
        scope: "project",
        filtered: false,
        installedPath: "C:\\cache\\pack",
      },
    ]);
    const provider = new PiSkillPackProvider(() => manager, []);

    const result = await provider.list("C:\\work");

    expect(result.packs[0]?.source).toBe(
      "https://example.com/org/pack.git",
    );
    expect(JSON.stringify(result)).not.toMatch(/secret|hidden/);
  });

  it("matches Pi-normalized local sources back to the official catalog", async () => {
    const manager = fakePackageManager();
    const normalizedSource = path.relative(path.join("C:\\work", ".pi"), source);
    vi.mocked(manager.listConfiguredPackages).mockReturnValue([
      {
        ...configuredPackage(),
        source: normalizedSource,
      },
    ]);
    vi.mocked(manager.resolve).mockResolvedValue(
      resolvedOfficialPack(normalizedSource),
    );
    const provider = new PiSkillPackProvider(
      () => manager,
      catalog,
      "C:\\agent",
    );

    const result = await provider.list("C:\\work");

    expect(result.packs).toHaveLength(1);
    expect(result.packs[0]).toMatchObject({
      catalogId: "developer-workflows",
      status: "installed",
      scope: "project",
      resources: {
        skills: ["investigate-failure", "prepare-change"],
      },
    });
  });

  it("installs only a server-catalogued source", async () => {
    const manager = fakePackageManager();
    vi.mocked(manager.listConfiguredPackages)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([])
      .mockReturnValueOnce([configuredPackage()]);
    vi.mocked(manager.resolve)
      .mockResolvedValueOnce(emptyResolvedPaths())
      .mockResolvedValueOnce(resolvedOfficialPack());
    const provider = new PiSkillPackProvider(() => manager, catalog);
    const packId = (await provider.list("C:\\work")).packs[0]!.packId;

    const result = await provider.install({
      packId,
      scope: "project",
      cwd: "C:\\work",
    });

    expect(manager.installAndPersist).toHaveBeenCalledWith(source, {
      local: true,
    });
    expect(result.packs[0]).toMatchObject({
      catalogId: "developer-workflows",
      status: "installed",
      scope: "project",
    });
  });

  it("rejects an unknown opaque id before installation", async () => {
    const manager = fakePackageManager();
    const provider = new PiSkillPackProvider(() => manager, catalog);

    await expect(
      provider.install({
        packId: "npm:evil",
        scope: "global",
        cwd: "C:\\work",
      }),
    ).rejects.toMatchObject({ code: "SKILL_PACK_NOT_FOUND", status: 404 });
    expect(manager.installAndPersist).not.toHaveBeenCalled();
  });

  it("rejects another version or ref of an already configured package", async () => {
    const manager = fakePackageManager();
    vi.mocked(manager.listConfiguredPackages).mockReturnValue([
      {
        source: "npm:@scope/release-pack@1.0.0",
        scope: "project",
        filtered: false,
        installedPath: "C:\\cache\\release-pack",
      },
      {
        source: "https://github.com/org/release.git@main",
        scope: "user",
        filtered: false,
        installedPath: "C:\\cache\\release-git",
      },
    ]);
    const provider = new PiSkillPackProvider(() => manager, []);

    for (const duplicate of [
      "npm:@scope/release-pack@2.0.0",
      "git:git@github.com:org/release.git@v2",
      "git:org/release@v2",
    ]) {
      await expect(
        provider.installSource({
          source: duplicate,
          scope: "project",
          cwd: "C:\\work",
        }),
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 409 });
    }
    expect(manager.installAndPersist).not.toHaveBeenCalled();
  });

  it("cleans up when fresh resolution cannot verify expected skills", async () => {
    const manager = fakePackageManager();
    vi.mocked(manager.listConfiguredPackages)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([])
      .mockReturnValueOnce([configuredPackage()]);
    vi.mocked(manager.resolve).mockResolvedValue(emptyResolvedPaths());
    const provider = new PiSkillPackProvider(() => manager, catalog);
    const packId = (await provider.list("C:\\work")).packs[0]!.packId;

    await expect(
      provider.install({ packId, scope: "project", cwd: "C:\\work" }),
    ).rejects.toMatchObject({ code: "SKILL_PACK_INSTALL_FAILED" });
    expect(manager.removeAndPersist).toHaveBeenCalledWith(source, {
      local: true,
    });
  });

  it("removes the configured source resolved from an opaque id", async () => {
    const manager = fakePackageManager();
    vi.mocked(manager.listConfiguredPackages)
      .mockReturnValueOnce([configuredPackage()])
      .mockReturnValueOnce([configuredPackage()])
      .mockReturnValueOnce([]);
    vi.mocked(manager.resolve)
      .mockResolvedValueOnce(resolvedOfficialPack())
      .mockResolvedValueOnce(emptyResolvedPaths());
    const provider = new PiSkillPackProvider(() => manager, catalog);
    const packId = (await provider.list("C:\\work")).packs[0]!.packId;

    const result = await provider.remove({ packId, cwd: "C:\\work" });

    expect(manager.removeAndPersist).toHaveBeenCalledWith(source, {
      local: true,
    });
    expect(result.packs[0]).toMatchObject({ status: "available", scope: null });
  });

  it("removes a project-local package using its canonical directory", async () => {
    const cwd = path.resolve("C:\\work");
    const relativeSource = "release";
    const installedPath = path.resolve(cwd, ".pi", relativeSource);
    const configured: ReturnType<PackageManager["listConfiguredPackages"]> = [{
      source: relativeSource,
      scope: "project",
      filtered: false,
      installedPath,
    }];
    const manager = fakePackageManager();
    vi.mocked(manager.listConfiguredPackages).mockImplementation(() => configured);
    vi.mocked(manager.resolve).mockImplementation(async () =>
      configured.length > 0
        ? resolvedSingleSkill(relativeSource, installedPath)
        : emptyResolvedPaths(),
    );
    vi.mocked(manager.removeAndPersist).mockImplementation(async (removeSource) => {
      if (removeSource !== installedPath) return false;
      configured.splice(0);
      return true;
    });
    const provider = new PiSkillPackProvider(() => manager, []);
    const packId = (await provider.list(cwd)).packs[0]!.packId;

    await expect(provider.remove({ packId, cwd })).resolves.toEqual({ packs: [] });
    expect(manager.removeAndPersist).toHaveBeenCalledWith(installedPath, {
      local: true,
    });
  });

  it("repairs a project-local package using its canonical directory", async () => {
    const cwd = path.resolve("C:\\work");
    const relativeSource = "release";
    const installedPath = path.resolve(cwd, ".pi", relativeSource);
    const configured = [{
      source: relativeSource,
      scope: "project" as const,
      filtered: false,
      installedPath,
    }];
    const manager = fakePackageManager();
    let resolved = emptyResolvedPaths();
    vi.mocked(manager.listConfiguredPackages).mockReturnValue(configured);
    vi.mocked(manager.resolve).mockImplementation(async () => resolved);
    vi.mocked(manager.install).mockImplementation(async (installSource) => {
      if (installSource === installedPath) {
        resolved = resolvedSingleSkill(relativeSource, installedPath);
      }
    });
    const provider = new PiSkillPackProvider(() => manager, []);
    const packId = (await provider.list(cwd)).packs[0]!.packId;

    const result = await provider.repair({ packId, cwd });

    expect(manager.install).toHaveBeenCalledWith(installedPath, { local: true });
    expect(result.packs[0]?.status).toBe("installed");
  });

  it("removes duplicate user and project configurations for one pack id", async () => {
    const manager = fakePackageManager();
    const configured = [
      { ...configuredPackage(), scope: "user" as const },
      { ...configuredPackage(), scope: "project" as const },
    ];
    vi.mocked(manager.listConfiguredPackages).mockImplementation(() => configured);
    vi.mocked(manager.resolve).mockImplementation(async () =>
      configured.length > 0 ? resolvedOfficialPack() : emptyResolvedPaths(),
    );
    vi.mocked(manager.removeAndPersist).mockImplementation(
      async (_removeSource, options) => {
        const scope = options?.local ? "project" : "user";
        const index = configured.findIndex((item) => item.scope === scope);
        if (index < 0) return false;
        configured.splice(index, 1);
        return true;
      },
    );
    const provider = new PiSkillPackProvider(() => manager, catalog);
    const packId = (await provider.list("C:\\work")).packs[0]!.packId;

    const result = await provider.remove({ packId, cwd: "C:\\work" });

    expect(manager.removeAndPersist).toHaveBeenCalledTimes(2);
    expect(result.packs[0]).toMatchObject({ status: "available", scope: null });
  });

  it("installs an absolute local package after registering its root", async () => {
    const localSource = await fs.mkdtemp(path.join(os.tmpdir(), "skill-pack-"));
    await fs.writeFile(
      path.join(localSource, "package.json"),
      JSON.stringify({ name: "local-release", version: "1.2.3" }),
    );
    const manager = fakePackageManager();
    const configured: ReturnType<PackageManager["listConfiguredPackages"]> = [];
    vi.mocked(manager.listConfiguredPackages).mockImplementation(() => configured);
    vi.mocked(manager.installAndPersist).mockImplementation(async () => {
      configured.push({
        source: localSource,
        scope: "project",
        filtered: false,
        installedPath: localSource,
      });
    });
    vi.mocked(manager.resolve).mockImplementation(async () =>
      configured.length > 0
        ? resolvedSingleSkill(localSource, localSource)
        : emptyResolvedPaths(),
    );
    const roots = { listRoots: vi.fn(), addRoot: vi.fn() };
    const provider = new PiSkillPackProvider(
      () => manager,
      [],
      "C:\\agent",
      roots,
    );

    try {
      const result = await provider.installSource({
        source: localSource,
        scope: "project",
        cwd: "C:\\work",
      });

      expect(roots.addRoot).toHaveBeenCalledWith(localSource);
      expect(vi.mocked(roots.addRoot).mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(manager.installAndPersist).mock.invocationCallOrder[0]!,
      );
      expect(result.packs[0]).toMatchObject({
        name: "local-release",
        source: localSource,
        status: "installed",
        version: "1.2.3",
        canUpdate: false,
      });
    } finally {
      await fs.rm(localSource, { recursive: true, force: true });
    }
  });

  it("rejects a missing local source or a source that is not a directory", async () => {
    const localFile = path.join(
      await fs.mkdtemp(path.join(os.tmpdir(), "skill-pack-file-")),
      "package.json",
    );
    await fs.writeFile(localFile, "{}");
    const manager = fakePackageManager();
    const roots = { listRoots: vi.fn(), addRoot: vi.fn() };
    const provider = new PiSkillPackProvider(
      () => manager,
      [],
      "C:\\agent",
      roots,
    );

    try {
      for (const source of [localFile, `${localFile}.missing`]) {
        await expect(
          provider.installSource({ source, scope: "project", cwd: "C:\\work" }),
        ).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
      }
      expect(manager.installAndPersist).not.toHaveBeenCalled();
      expect(roots.addRoot).not.toHaveBeenCalled();
    } finally {
      await fs.rm(path.dirname(localFile), { recursive: true, force: true });
    }
  });

  it("rolls back a manual install without enabled resources", async () => {
    const manager = fakePackageManager();
    const configured: ReturnType<PackageManager["listConfiguredPackages"]> = [];
    vi.mocked(manager.listConfiguredPackages).mockImplementation(() => configured);
    vi.mocked(manager.installAndPersist).mockImplementation(async () => {
      configured.push({
        source: "npm:@scope/empty-pack",
        scope: "user",
        filtered: false,
        installedPath: "C:\\cache\\empty-pack",
      });
    });
    const provider = new PiSkillPackProvider(() => manager, []);

    await expect(
      provider.installSource({
        source: "npm:@scope/empty-pack",
        scope: "global",
        cwd: "C:\\work",
      }),
    ).rejects.toMatchObject({ code: "SKILL_PACK_INSTALL_FAILED" });
    expect(manager.removeAndPersist).toHaveBeenCalledWith(
      "npm:@scope/empty-pack",
      { local: false },
    );
  });

  it("updates remote packages and repairs only broken packages", async () => {
    const installedPath = await fs.mkdtemp(path.join(os.tmpdir(), "remote-pack-"));
    await fs.writeFile(
      path.join(installedPath, "package.json"),
      JSON.stringify({ name: "remote-release", version: "2.0.0" }),
    );
    const remoteSource = "npm:@scope/release-pack";
    const manager = fakePackageManager();
    const configured: ReturnType<PackageManager["listConfiguredPackages"]> = [{
      source: remoteSource,
      scope: "project" as const,
      filtered: false,
      installedPath,
    }];
    vi.mocked(manager.listConfiguredPackages).mockReturnValue(configured);
    vi.mocked(manager.resolve).mockResolvedValue(
      resolvedSingleSkill(remoteSource, installedPath),
    );
    const provider = new PiSkillPackProvider(() => manager, []);

    try {
      const packId = (await provider.list("C:\\work")).packs[0]!.packId;
      await provider.update({ packId, cwd: "C:\\work" });
      expect(manager.update).toHaveBeenCalledWith(remoteSource);

      configured[0]!.installedPath = undefined;
      vi.mocked(manager.resolve).mockResolvedValue(emptyResolvedPaths());
      vi.mocked(manager.install).mockImplementation(async () => {
        configured[0]!.installedPath = installedPath;
        vi.mocked(manager.resolve).mockResolvedValue(
          resolvedSingleSkill(remoteSource, installedPath),
        );
      });
      await provider.repair({ packId, cwd: "C:\\work" });
      expect(manager.install).toHaveBeenCalledWith(remoteSource, { local: true });
    } finally {
      await fs.rm(installedPath, { recursive: true, force: true });
    }
  });

  it("rejects updates for local packages and does not leak operation errors", async () => {
    const manager = fakePackageManager();
    vi.mocked(manager.listConfiguredPackages).mockReturnValue([
      configuredPackage(),
    ]);
    vi.mocked(manager.resolve).mockResolvedValue(resolvedOfficialPack());
    const provider = new PiSkillPackProvider(() => manager, []);
    const packId = (await provider.list("C:\\work")).packs[0]!.packId;

    await expect(provider.update({ packId, cwd: "C:\\work" })).rejects.toMatchObject(
      { code: "VALIDATION_ERROR" },
    );

    vi.mocked(manager.listConfiguredPackages).mockReturnValue([{
      source: "npm:@scope/private-pack",
      scope: "user",
      filtered: false,
      installedPath: "C:\\cache\\private-pack",
    }]);
    vi.mocked(manager.resolve).mockResolvedValue(
      resolvedSingleSkill("npm:@scope/private-pack", "C:\\cache\\private-pack"),
    );
    const remoteId = (await provider.list("C:\\work")).packs[0]!.packId;
    vi.mocked(manager.update).mockRejectedValue(
      new Error("command failed with TOKEN=super-secret"),
    );
    const error = await provider
      .update({ packId: remoteId, cwd: "C:\\work" })
      .catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code: "SKILL_PACK_UPDATE_FAILED" });
    expect(JSON.stringify(error)).not.toContain("super-secret");
  });
});

function fakePackageManager(): PackageManager {
  return {
    resolve: vi.fn().mockResolvedValue(emptyResolvedPaths()),
    install: vi.fn(),
    installAndPersist: vi.fn(),
    remove: vi.fn(),
    removeAndPersist: vi.fn().mockResolvedValue(true),
    update: vi.fn(),
    listConfiguredPackages: vi.fn().mockReturnValue([]),
    resolveExtensionSources: vi.fn(),
    addSourceToSettings: vi.fn(),
    removeSourceFromSettings: vi.fn(),
    setProgressCallback: vi.fn(),
    getInstalledPath: vi.fn(),
  };
}

function configuredPackage() {
  return {
    source,
    scope: "project" as const,
    filtered: false,
    installedPath: source,
  };
}

function emptyResolvedPaths(): ResolvedPaths {
  return { extensions: [], skills: [], prompts: [], themes: [] };
}

function resolvedOfficialPack(metadataSource = source): ResolvedPaths {
  return {
    ...emptyResolvedPaths(),
    skills: ["investigate-failure", "prepare-change"].map((name) => ({
      path: path.join(source, "skills", name, "SKILL.md"),
      enabled: true,
      metadata: {
        source: metadataSource,
        scope: "project" as const,
        origin: "package" as const,
        baseDir: source,
      },
    })),
  };
}

function resolvedSingleSkill(metadataSource: string, baseDir: string): ResolvedPaths {
  return {
    ...emptyResolvedPaths(),
    skills: [{
      path: path.join(baseDir, "skills", "release", "SKILL.md"),
      enabled: true,
      metadata: {
        source: metadataSource,
        scope: "project",
        origin: "package",
        baseDir,
      },
    }],
  };
}
