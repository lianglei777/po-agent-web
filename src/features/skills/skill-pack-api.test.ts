import { afterEach, describe, expect, it, vi } from "vitest";
import {
  installSkillPack,
  installSkillPackSource,
  loadSkillPacks,
  repairSkillPack,
  removeSkillPack,
  updateSkillPack,
} from "./api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Skill Pack API client", () => {
  it("loads and mutates packs with exact endpoints and bodies", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ packs: [] }), { status: 200 }),
      );

    await loadSkillPacks("C:\\work");
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/skill-packs?cwd=C%3A%5Cwork",
      expect.any(Object),
    );

    await installSkillPack({
      packId: "pack_abc",
      scope: "project",
      cwd: "C:\\work",
    });
    expect(JSON.parse(fetchMock.mock.calls[1][1]!.body as string)).toEqual({
      packId: "pack_abc",
      scope: "project",
      cwd: "C:\\work",
    });

    await removeSkillPack({ packId: "pack_abc", cwd: "C:\\work" });
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: "DELETE" });

    await installSkillPackSource({
      source: "D:\\packs\\release",
      scope: "project",
      cwd: "C:\\work",
    });
    expect(fetchMock.mock.calls[3][0]).toBe("/api/skill-packs/install-source");
    expect(JSON.parse(fetchMock.mock.calls[3][1]!.body as string)).toEqual({
      source: "D:\\packs\\release",
      scope: "project",
      cwd: "C:\\work",
    });

    await updateSkillPack({ packId: "pack_abc", cwd: "C:\\work" });
    expect(fetchMock.mock.calls[4][0]).toBe("/api/skill-packs/update");
    expect(JSON.parse(fetchMock.mock.calls[4][1]!.body as string)).toEqual({
      packId: "pack_abc",
      cwd: "C:\\work",
    });

    await repairSkillPack({ packId: "pack_abc", cwd: "C:\\work" });
    expect(fetchMock.mock.calls[5][0]).toBe("/api/skill-packs/repair");
    expect(JSON.parse(fetchMock.mock.calls[5][1]!.body as string)).toEqual({
      packId: "pack_abc",
      cwd: "C:\\work",
    });
  });
});
