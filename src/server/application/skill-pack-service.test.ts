import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { SkillPackProvider } from "@/server/ports/skill-pack-provider";
import { SkillPackService } from "./skill-pack-service";

describe("SkillPackService", () => {
  it("validates cwd for every package operation", async () => {
    const provider: SkillPackProvider = {
      list: vi.fn().mockResolvedValue({ packs: [] }),
      install: vi.fn().mockResolvedValue({ packs: [] }),
      remove: vi.fn().mockResolvedValue({ packs: [] }),
    };
    const root = path.resolve("C:\\workspace");
    const service = new SkillPackService(provider, {
      listRoots: async () => [root],
      addRoot: vi.fn(),
    });

    await service.list(root);
    await service.install({
      packId: "pack_abc",
      scope: "global",
      cwd: root,
    });
    await service.remove({ packId: "pack_abc", cwd: root });

    expect(provider.list).toHaveBeenCalledWith(root);
    expect(provider.install).toHaveBeenCalledWith({
      packId: "pack_abc",
      scope: "global",
      cwd: root,
    });
    expect(provider.remove).toHaveBeenCalledWith({
      packId: "pack_abc",
      cwd: root,
    });
    await expect(service.list(path.resolve("C:\\outside"))).rejects.toMatchObject(
      { status: 403 },
    );
  });
});
