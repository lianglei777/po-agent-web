import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { SkillProvider } from "@/server/ports/skill-provider";
import { SkillService } from "./skill-service";

describe("SkillService", () => {
  it("passes only registered cwd values to the provider", async () => {
    const load = vi.fn().mockResolvedValue({
      skills: [],
      diagnostics: [],
    });
    const provider = { load } as unknown as SkillProvider;
    const root = path.resolve("C:\\workspace");
    const service = new SkillService(provider, {
      listRoots: async () => [root],
      addRoot: vi.fn(),
    });

    await service.load(root);
    expect(load).toHaveBeenCalledWith(root);
    await service.load(path.join(root, "nested"));
    await expect(service.load(path.resolve("C:\\outside"))).rejects.toMatchObject(
      { status: 403 },
    );
  });

  it("resolves toggles by cwd and skillId rather than a client path", async () => {
    const setModelInvocationDisabled = vi.fn().mockResolvedValue({
      skills: [],
      diagnostics: [],
    });
    const root = path.resolve("C:\\workspace");
    const service = new SkillService(
      { setModelInvocationDisabled } as unknown as SkillProvider,
      { listRoots: async () => [root], addRoot: vi.fn() },
    );

    await service.setModelInvocationDisabled({
      cwd: root,
      skillId: "opaque-id",
      disabled: true,
      expectedVersion: "v1",
    });
    expect(setModelInvocationDisabled).toHaveBeenCalledWith({
      cwd: root,
      skillId: "opaque-id",
      disabled: true,
      expectedVersion: "v1",
    });
  });

  it("resolves remove by cwd and skillId through the provider", async () => {
    const remove = vi.fn().mockResolvedValue({
      skills: [],
      diagnostics: [],
    });
    const root = path.resolve("C:\\workspace");
    const service = new SkillService(
      { remove } as unknown as SkillProvider,
      { listRoots: async () => [root], addRoot: vi.fn() },
    );

    await service.remove({
      cwd: root,
      skillId: "opaque-id",
    });
    expect(remove).toHaveBeenCalledWith({
      cwd: root,
      skillId: "opaque-id",
    });
    await expect(
      service.remove({ cwd: path.resolve("C:\\outside"), skillId: "x" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("resolves importLocal cwd through the workspace root check", async () => {
    const importLocal = vi.fn().mockResolvedValue({ created: true, skills: [] });
    const root = path.resolve("C:\\workspace");
    const service = new SkillService(
      { importLocal } as unknown as SkillProvider,
      { listRoots: async () => [root], addRoot: vi.fn() },
    );

    await service.importLocal({
      sourceFilePath: "D:\\my-skills\\review\\SKILL.md",
      scope: "project",
      cwd: root,
    });
    expect(importLocal).toHaveBeenCalledWith({
      sourceFilePath: "D:\\my-skills\\review\\SKILL.md",
      scope: "project",
      cwd: root,
    });

    // global scope 不校验 cwd
    await service.importLocal({
      sourceFilePath: "D:\\my-skills\\review\\SKILL.md",
      scope: "global",
    });
    expect(importLocal).toHaveBeenLastCalledWith({
      sourceFilePath: "D:\\my-skills\\review\\SKILL.md",
      scope: "global",
      cwd: undefined,
    });

    // 非注册根拒绝
    await expect(
      service.importLocal({
        sourceFilePath: "D:\\my-skills\\review\\SKILL.md",
        scope: "project",
        cwd: path.resolve("C:\\outside"),
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
