import { describe, expect, it } from "vitest";
import type { SkillPackLoadResponse } from "./skill-packs";

describe("Skill Pack contracts", () => {
  it("contain only serializable product data", () => {
    const response: SkillPackLoadResponse = {
      packs: [
        {
          packId: "pack_abc",
          catalogId: "developer-workflows",
          name: "Developer Workflows",
          description: "Focused developer workflows",
          source: "bundled:developer-workflows",
          scope: null,
          status: "available",
          resources: {
            skills: ["investigate-failure"],
            extensions: [],
            prompts: [],
            themes: [],
          },
          containsExtensions: false,
        },
      ],
    };

    expect(JSON.parse(JSON.stringify(response))).toEqual(response);
  });
});
