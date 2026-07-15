import { afterEach, describe, expect, it, vi } from "vitest";
import {
  installSkillPack,
  loadSkillPacks,
  removeSkillPack,
} from "./api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Skill Pack API client", () => {
  it("loads, installs, and removes packs with opaque ids", async () => {
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
  });
});
