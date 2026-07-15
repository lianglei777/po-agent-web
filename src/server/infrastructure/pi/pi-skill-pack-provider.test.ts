import path from "node:path";
import type {
  PackageManager,
  ResolvedPaths,
} from "@earendil-works/pi-coding-agent";
import { describe, expect, it, vi } from "vitest";
import type { OfficialSkillPackDefinition } from "./official-skill-packs";
import { PiSkillPackProvider } from "./pi-skill-pack-provider";

const source = path.resolve("C:\\app\\developer-workflows");
const catalog: OfficialSkillPackDefinition[] = [
  {
    id: "developer-workflows",
    source,
    name: "Developer Workflows",
    description: "Focused developer workflows",
    expectedSkills: ["investigate-failure", "prepare-change"],
    containsExtensions: false,
  },
];

describe("PiSkillPackProvider", () => {
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
