import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const domainSource = readFileSync(
  fileURLToPath(new URL("../../server/domain/skill.ts", import.meta.url)),
  "utf8",
);
const providerSource = readFileSync(
  fileURLToPath(
    new URL("../../server/infrastructure/pi/pi-skill-provider.ts", import.meta.url),
  ),
  "utf8",
);
const clientTypesSource = readFileSync(
  fileURLToPath(new URL("./types.ts", import.meta.url)),
  "utf8",
);
const packRouteSource = readFileSync(
  fileURLToPath(
    new URL("../../app/api/skill-packs/route.ts", import.meta.url),
  ),
  "utf8",
);
const packInstallRouteSource = readFileSync(
  fileURLToPath(
    new URL("../../app/api/skill-packs/install/route.ts", import.meta.url),
  ),
  "utf8",
);
const packInstallSourceRouteSource = readFileSync(
  fileURLToPath(
    new URL("../../app/api/skill-packs/install-source/route.ts", import.meta.url),
  ),
  "utf8",
);
const packUpdateRouteSource = readFileSync(
  fileURLToPath(
    new URL("../../app/api/skill-packs/update/route.ts", import.meta.url),
  ),
  "utf8",
);
const packRepairRouteSource = readFileSync(
  fileURLToPath(
    new URL("../../app/api/skill-packs/repair/route.ts", import.meta.url),
  ),
  "utf8",
);

describe("skills config response contract", () => {
  it("does not expose unused load or install fields", () => {
    expect(domainSource).not.toContain("homeDir: string");
    expect(domainSource).not.toContain("output?: string");
    expect(providerSource).not.toContain("homeDir: os.homedir()");
    expect(providerSource).not.toContain("output: cleanAnsi(");
    expect(clientTypesSource).not.toContain("homeDir: string");
    expect(clientTypesSource).not.toContain("output?: string");
  });

  it("keeps Skill Pack Route Handlers thin", () => {
    expect(packRouteSource).toContain("container.skillPackService.list(cwd)");
    expect(packRouteSource).toContain("parseSkillPackRemove");
    expect(packInstallRouteSource).toContain("parseSkillPackInstall");
    expect(packInstallRouteSource).toContain(
      "container.skillPackService.install",
    );
    expect(packInstallSourceRouteSource).toContain('runtime = "nodejs"');
    expect(packInstallSourceRouteSource).toContain("readJson(request)");
    expect(packInstallSourceRouteSource).toContain(
      "parseSkillPackInstallSource",
    );
    expect(packInstallSourceRouteSource).toContain(
      "container.skillPackService.installSource",
    );
    expect(packUpdateRouteSource).toContain('runtime = "nodejs"');
    expect(packUpdateRouteSource).toContain("readJson(request)");
    expect(packUpdateRouteSource).toContain("parseSkillPackMaintain");
    expect(packUpdateRouteSource).toContain(
      "container.skillPackService.update",
    );
    expect(packRepairRouteSource).toContain('runtime = "nodejs"');
    expect(packRepairRouteSource).toContain("readJson(request)");
    expect(packRepairRouteSource).toContain("parseSkillPackMaintain");
    expect(packRepairRouteSource).toContain(
      "container.skillPackService.repair",
    );
  });
});
