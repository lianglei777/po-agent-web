# Skill Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add immutable built-in Skills and first-class, Pi Package-backed Skill Packs while preserving the existing standalone Skill workflow.

**Architecture:** Built-in Skills are injected through one shared Pi `DefaultResourceLoader`. Skill Packs use a new application port backed by Pi `DefaultPackageManager`; the browser sends opaque Pack IDs, and the server resolves trusted sources. Existing `skills.sh` installation remains responsible only for standalone Skills.

**Tech Stack:** Next.js 16.2.1 App Router, React 19.2.4, TypeScript 5, Vitest 4, Electron 43, `@earendil-works/pi-coding-agent` 0.75.5.

## Global Constraints

- Follow `domain <- ports <- application <- transport`; infrastructure implements ports and composition is the only production construction root.
- Read the owning implementation, callers, tests, `PRODUCT.md`, `DESIGN.md`, `docs/architecture.md`, and installed Next.js/Pi documentation before changing behavior.
- Do not add dependencies, a second Package manifest, a Package lock file, arbitrary Package-source installation, Workflow execution, hot reload, system dependency detection, or update controls.
- Validate every `cwd` against registered workspace roots and resolve every Package source from server-owned data.
- Never expose command output, environment variables, API keys, credentials, or unrestricted filesystem paths in HTTP responses.
- New code comments are Chinese; user-visible copy is added to both English and Chinese dictionaries.
- Package-owned and built-in Skills are read-only and cannot use standalone Skill removal or frontmatter mutation.
- Package resource changes apply to newly created Agent sessions only.
- Run `npm run check` once before handoff and `npm run build` because Route Handlers, runtime resource loading, and production packaging change.

---

## File Map

### Existing files to modify

- `src/server/infrastructure/pi/pi-skill-provider.ts`: mark Package/built-in Skills immutable and reject Package-owned standalone mutations.
- `src/server/infrastructure/pi/pi-agent-runtime.ts`: construct Agent sessions with the shared ResourceLoader.
- `src/server/composition/container.ts`: compose the Skill Pack service and provider.
- `src/server/transport/http/validators.ts`: parse Pack install/remove bodies.
- `src/features/skills/skills-page.tsx`: switch between Skills and Skill Packs.
- `src/features/skills/skill-list.tsx`: group built-in and Package-owned Skills accurately.
- `src/features/skills/skill-detail.tsx`: present managed Skills as read-only.
- `src/features/skills/api.ts`: add Pack HTTP client functions.
- `src/i18n/dictionaries/en.ts`, `src/i18n/dictionaries/zh.ts`: add Pack and managed-Skill copy.
- `desktop/desktop-runtime.mjs`, `desktop/main.mjs`, `package.json`: expose and package application resources.
- `docs/agent-api-reference.md`: document Pack endpoints and changed Skill mutability.

### New production files

- `src/server/infrastructure/pi/pi-resource-loader.ts`: single constructor for Pi resources and built-in Skills.
- `src/contracts/skill-packs.ts`: serializable Pack HTTP contracts.
- `src/server/domain/skill-pack.ts`: application inputs and contract aliases.
- `src/server/ports/skill-pack-provider.ts`: Package capability required by the application.
- `src/server/application/skill-pack-service.ts`: workspace validation and Pack use cases.
- `src/server/infrastructure/pi/official-skill-packs.ts`: reviewed bundled Pack catalog.
- `src/server/infrastructure/pi/pi-skill-pack-provider.ts`: Pi PackageManager adapter.
- `src/app/api/skill-packs/route.ts`: list and remove Route Handlers.
- `src/app/api/skill-packs/install/route.ts`: install Route Handler.
- `src/features/skills/use-skill-packs.ts`: Pack loading and mutations.
- `src/features/skills/skill-pack-list.tsx`: compact Pack selector.
- `src/features/skills/skill-pack-detail.tsx`: Pack resources, risk, scope, and action.
- `src/features/skills/confirm-skill-pack-dialog.tsx`: explicit install/remove confirmation.
- `resources/builtin-skills/review-changes/SKILL.md`: first immutable built-in Skill.
- `resources/official-packs/developer-workflows/package.json`: bundled local Pi Package.
- `resources/official-packs/developer-workflows/skills/investigate-failure/SKILL.md`: Pack Skill.
- `resources/official-packs/developer-workflows/skills/prepare-change/SKILL.md`: Pack Skill.

### New test files

- `src/server/infrastructure/pi/pi-resource-loader.test.ts`
- `src/contracts/skill-packs.test.ts`
- `src/server/application/skill-pack-service.test.ts`
- `src/server/infrastructure/pi/pi-skill-pack-provider.test.ts`
- `src/features/skills/skill-pack-api.test.ts`
- `src/features/skills/skill-pack-state.test.ts`

---

### Task 1: Protect Package-owned Skills

**Files:**
- Modify: `src/server/infrastructure/pi/pi-skill-provider.ts`
- Modify: `src/server/infrastructure/pi/pi-skill-provider.test.ts`
- Modify: `src/features/skills/skill-state.ts`
- Modify: `src/features/skills/skill-state.test.ts`
- Modify: `src/features/skills/skill-list.tsx`
- Modify: `src/features/skills/skill-detail.tsx`
- Modify: `src/features/skills/skill-ui.test.ts`
- Modify: `src/i18n/dictionaries/en.ts`
- Modify: `src/i18n/dictionaries/zh.ts`

**Interfaces:**
- Consumes: existing `SkillInfo.sourceInfo.origin` and `SkillInfo.canModify`.
- Produces: `isManagedSkill(skill: SkillInfo): boolean`; Package-owned Skills map to `canModify: false` and cannot enter standalone mutation paths.

- [ ] **Step 1: Add failing infrastructure regression tests**

Export `mapSkill` for focused mapping tests and add these cases to `pi-skill-provider.test.ts`:

```ts
it("maps package-owned skills as immutable", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "pack-skill-"));
  const filePath = path.join(root, "SKILL.md");
  await fs.writeFile(filePath, "---\nname: packed\ndescription: Packed\n---\n");

  await expect(
    mapSkill(
      {
        name: "packed",
        description: "Packed",
        filePath,
        baseDir: root,
        disableModelInvocation: false,
        sourceInfo: {
          path: filePath,
          source: "npm:@po-agent/developer-workflows@1.0.0",
          scope: "project",
          origin: "package",
        },
      },
      root,
    ),
  ).resolves.toMatchObject({ canModify: false });
});

it("rejects standalone removal for a package-owned skill", async () => {
  const provider = new PiSkillProvider({ run: vi.fn() } as ProcessRunner);
  vi.spyOn(provider, "load").mockResolvedValue({
    diagnostics: [],
    skills: [{ ...skillFixture, canModify: false, sourceInfo: {
      ...skillFixture.sourceInfo,
      origin: "package",
    }}],
  });

  await expect(provider.remove({ cwd: "C:\\work", skillId: skillFixture.skillId }))
    .rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 403 });
});
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `npx vitest run src/server/infrastructure/pi/pi-skill-provider.test.ts`

Expected: FAIL because `mapSkill` is not exported and Package ownership does not force immutability.

- [ ] **Step 3: Implement the minimum ownership guard**

In `pi-skill-provider.ts`:

```ts
export async function mapSkill(skill: Skill, cwd: string): Promise<SkillInfo> {
  const resolvedFilePath = path.resolve(skill.filePath);
  const realFilePath = await fs.realpath(skill.filePath);
  const content = await fs.readFile(realFilePath);
  const managed = skill.sourceInfo.origin === "package";
  return {
    skillId: skillIdForPath(realFilePath),
    name: skill.name,
    description: skill.description,
    filePath: realFilePath,
    displayPath: displaySkillPath(realFilePath, cwd, os.homedir()),
    baseDir: await fs.realpath(skill.baseDir),
    sourceInfo: { ...skill.sourceInfo },
    canModify: !managed && samePath(resolvedFilePath, realFilePath),
    disableModelInvocation: skill.disableModelInvocation,
    version: versionForContent(content),
  };
}
```

Immediately after resolving the selected Skill in `remove()`:

```ts
if (skill.sourceInfo.origin === "package") {
  throw new AppError(
    "VALIDATION_ERROR",
    "Package-managed skills must be removed with their Skill Pack.",
    403,
  );
}
```

`setModelInvocationDisabled()` already routes through `updateSkillFile()`, which rejects `canModify: false`; keep that single shared guard.

- [ ] **Step 4: Add failing UI/state tests**

Add to `skill-state.test.ts`:

```ts
it("identifies package-owned skills as managed", () => {
  expect(isManagedSkill({
    ...base,
    sourceInfo: { ...base.sourceInfo, origin: "package" },
  })).toBe(true);
  expect(isManagedSkill(base)).toBe(false);
});
```

Add to `skill-ui.test.ts`:

```ts
it("does not offer standalone mutations for package-owned skills", () => {
  expect(detailSource).toContain("isManagedSkill(skill)");
  expect(detailSource).toContain("t.skills.managedByPack");
  expect(detailSource).toContain("!managed &&");
});
```

- [ ] **Step 5: Implement read-only UI behavior**

In `skill-state.ts`:

```ts
export function isManagedSkill(skill: SkillInfo): boolean {
  return skill.sourceInfo.origin === "package";
}
```

In `skill-detail.tsx`, compute `const managed = isManagedSkill(skill)`, replace the switch with a compact read-only explanation when `managed`, and render the remove button only when `!managed`. Add `managedByPack` copy to both dictionaries. In `skill-list.tsx`, label Package groups with `sourceInfo.source`; do not classify them only as generic project/global rows.

- [ ] **Step 6: Run all focused Skill tests**

Run:

```powershell
npx vitest run src/server/infrastructure/pi/pi-skill-provider.test.ts src/features/skills/skill-state.test.ts src/features/skills/skill-ui.test.ts
```

Expected: all selected test files PASS.

- [ ] **Step 7: Commit the ownership fix**

```powershell
git add src/server/infrastructure/pi/pi-skill-provider.ts src/server/infrastructure/pi/pi-skill-provider.test.ts src/features/skills/skill-state.ts src/features/skills/skill-state.test.ts src/features/skills/skill-list.tsx src/features/skills/skill-detail.tsx src/features/skills/skill-ui.test.ts src/i18n/dictionaries/en.ts src/i18n/dictionaries/zh.ts
git commit -m "fix: protect package-managed skills"
```

---

### Task 2: Load and Package Built-in Skills

**Files:**
- Create: `src/server/infrastructure/pi/pi-resource-loader.ts`
- Create: `src/server/infrastructure/pi/pi-resource-loader.test.ts`
- Create: `resources/builtin-skills/review-changes/SKILL.md`
- Modify: `src/server/infrastructure/pi/pi-skill-provider.ts`
- Modify: `src/server/infrastructure/pi/pi-agent-runtime.ts`
- Modify: `src/server/infrastructure/pi/pi-agent-runtime-factory.test.ts`
- Modify: `desktop/desktop-runtime.mjs`
- Modify: `desktop/desktop-runtime.test.mjs`
- Modify: `desktop/main.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `createPiResourceLoader(options: { cwd: string; agentDir?: string; builtinSkillsDir?: string }): Promise<DefaultResourceLoader>` and `resolveBuiltinSkillsDir(env?, cwd?): string`.
- Consumers: `PiSkillProvider.load()` and `PiAgentRuntimeFactory.create()`.

- [ ] **Step 1: Write the failing ResourceLoader integration test**

Create `pi-resource-loader.test.ts`:

```ts
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createPiResourceLoader } from "./pi-resource-loader";

describe("createPiResourceLoader", () => {
  it("loads built-in skills with immutable source metadata", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "po-builtins-"));
    const cwd = path.join(root, "workspace");
    const agentDir = path.join(root, "agent");
    const builtinSkillsDir = path.join(root, "builtins");
    await fs.mkdir(path.join(builtinSkillsDir, "review-changes"), { recursive: true });
    await fs.mkdir(cwd, { recursive: true });
    await fs.writeFile(
      path.join(builtinSkillsDir, "review-changes", "SKILL.md"),
      "---\nname: review-changes\ndescription: Review changes\n---\n",
    );

    const loader = await createPiResourceLoader({ cwd, agentDir, builtinSkillsDir });
    expect(loader.getSkills().skills).toEqual([
      expect.objectContaining({
        name: "review-changes",
        sourceInfo: expect.objectContaining({ source: "po-agent-builtin" }),
      }),
    ]);
  });
});
```

- [ ] **Step 2: Run the test and confirm the missing module failure**

Run: `npx vitest run src/server/infrastructure/pi/pi-resource-loader.test.ts`

Expected: FAIL because `pi-resource-loader.ts` does not exist.

- [ ] **Step 3: Implement one shared loader**

Create `pi-resource-loader.ts`:

```ts
import path from "node:path";
import {
  DefaultResourceLoader,
  getAgentDir,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";

const BUILTIN_SOURCE = "po-agent-builtin";

export function resolveBuiltinSkillsDir(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): string {
  return path.resolve(
    env.PO_AGENT_BUILTIN_SKILLS_DIR ?? path.join(cwd, "resources", "builtin-skills"),
  );
}

export async function createPiResourceLoader({
  cwd,
  agentDir = getAgentDir(),
  builtinSkillsDir = resolveBuiltinSkillsDir(),
}: {
  cwd: string;
  agentDir?: string;
  builtinSkillsDir?: string;
}) {
  const loader = new DefaultResourceLoader({
    cwd,
    agentDir,
    settingsManager: SettingsManager.create(cwd, agentDir),
  });
  await loader.reload();
  loader.extendResources({
    skillPaths: [{
      path: builtinSkillsDir,
      metadata: {
        source: BUILTIN_SOURCE,
        scope: "temporary",
        origin: "top-level",
      },
    }],
  });
  return loader;
}
```

Change `PiSkillProvider.load()` to call this helper. Change `PiAgentRuntimeFactory.create()` to await the same helper and pass its result as `resourceLoader` to `createAgentSession()`.

Extend Task 1's `mapSkill` guard:

```ts
const managed =
  skill.sourceInfo.origin === "package" ||
  skill.sourceInfo.source === "po-agent-builtin";
```

- [ ] **Step 4: Add the first built-in Skill**

Create `resources/builtin-skills/review-changes/SKILL.md`:

```markdown
---
name: review-changes
description: Review current workspace changes for correctness, regressions, security issues, and missing tests. Use when the user asks for a code review or pre-commit review.
---

# Review Changes

1. Read the applicable repository instructions.
2. Inspect `git status`, the complete diff, owning code, callers, and tests.
3. Report actionable findings first, ordered by severity, with precise file locations.
4. Focus on correctness, security, data loss, regressions, and missing behavioral tests.
5. Do not modify files unless the user explicitly asks for fixes.
6. If there are no findings, say so and name any verification gap.
```

- [ ] **Step 5: Add failing desktop resource-path tests**

Extend `desktop-runtime.test.mjs`:

```js
test("passes the built-in skills directory to the server", () => {
  const env = buildServerEnvironment({
    baseEnv: {},
    builtinSkillsDir: "C:\\Program Files\\Po Agent Web\\resources\\builtin-skills",
    piAgentDir: "C:\\agent",
    port: 53123,
  });
  assert.equal(
    env.PO_AGENT_BUILTIN_SKILLS_DIR,
    "C:\\Program Files\\Po Agent Web\\resources\\builtin-skills",
  );
});
```

- [ ] **Step 6: Package and pass the resource directory**

Add `builtinSkillsDir` to `buildServerEnvironment()` and return
`PO_AGENT_BUILTIN_SKILLS_DIR: builtinSkillsDir`. In `desktop/main.mjs`, pass:

```js
const builtinSkillsDir = app.isPackaged
  ? path.join(process.resourcesPath, "resources", "builtin-skills")
  : path.join(appRoot, "resources", "builtin-skills");
```

Add this Electron resource entry to `package.json`:

```json
{
  "from": "resources",
  "to": "resources",
  "filter": ["**/*"]
}
```

- [ ] **Step 7: Run focused runtime and desktop tests**

Run:

```powershell
npx vitest run src/server/infrastructure/pi/pi-resource-loader.test.ts src/server/infrastructure/pi/pi-agent-runtime-factory.test.ts src/server/infrastructure/pi/pi-skill-provider.test.ts
node --test desktop/desktop-runtime.test.mjs desktop/prepare-standalone.test.mjs
```

Expected: all selected tests PASS.

- [ ] **Step 8: Commit built-in resource loading**

```powershell
git add src/server/infrastructure/pi/pi-resource-loader.ts src/server/infrastructure/pi/pi-resource-loader.test.ts src/server/infrastructure/pi/pi-skill-provider.ts src/server/infrastructure/pi/pi-agent-runtime.ts src/server/infrastructure/pi/pi-agent-runtime-factory.test.ts resources/builtin-skills/review-changes/SKILL.md desktop/desktop-runtime.mjs desktop/desktop-runtime.test.mjs desktop/main.mjs package.json
git commit -m "feat: load built-in skills"
```

---

### Task 3: Define Skill Pack Contracts and Application Boundary

**Files:**
- Create: `src/contracts/skill-packs.ts`
- Create: `src/contracts/skill-packs.test.ts`
- Create: `src/server/domain/skill-pack.ts`
- Create: `src/server/ports/skill-pack-provider.ts`
- Create: `src/server/application/skill-pack-service.ts`
- Create: `src/server/application/skill-pack-service.test.ts`
- Modify: `src/server/transport/http/validators.ts`
- Modify: `src/server/transport/http/validators.test.ts`

**Interfaces:**
- Produces: `SkillPackInfo`, `SkillPackLoadResponse`, `InstallSkillPackRequest`, `RemoveSkillPackRequest`, `SkillPackProvider`, `SkillPackService`, `parseSkillPackInstall()`, and `parseSkillPackRemove()`.
- Consumes: `WorkspaceRootProvider` and existing `AppError` behavior.

- [ ] **Step 1: Write failing contract and validator tests**

Create `skill-packs.test.ts` with a compile-time shape fixture:

```ts
import { describe, expect, it } from "vitest";
import type { SkillPackLoadResponse } from "./skill-packs";

describe("Skill Pack contracts", () => {
  it("contain only serializable product data", () => {
    const response: SkillPackLoadResponse = {
      packs: [{
        packId: "pack_abc",
        catalogId: "developer-workflows",
        name: "Developer Workflows",
        description: "Focused developer workflows",
        source: "C:\\app\\resources\\official-packs\\developer-workflows",
        scope: null,
        status: "available",
        resources: { skills: ["investigate-failure"], extensions: [], prompts: [], themes: [] },
        containsExtensions: false,
      }],
    };
    expect(JSON.parse(JSON.stringify(response))).toEqual(response);
  });
});
```

Add validator assertions:

```ts
expect(parseSkillPackInstall({
  packId: "pack_abc",
  scope: "project",
  cwd: "C:\\work",
})).toEqual({ packId: "pack_abc", scope: "project", cwd: "C:\\work" });
expect(() => parseSkillPackInstall({ packId: "x", scope: "bad", cwd: "C:\\work" }))
  .toThrow("scope must be global or project");
expect(() => parseSkillPackRemove({ packId: "x", cwd: "" }))
  .toThrow("cwd must be a non-empty string");
```

- [ ] **Step 2: Run tests and confirm missing symbols**

Run:

```powershell
npx vitest run src/contracts/skill-packs.test.ts src/server/transport/http/validators.test.ts
```

Expected: FAIL because Pack contracts and validators do not exist.

- [ ] **Step 3: Add exact public contracts**

Create `src/contracts/skill-packs.ts`:

```ts
export type SkillPackStatus = "available" | "installed" | "broken";
export type SkillPackScope = "user" | "project" | null;

export interface SkillPackResources {
  skills: string[];
  extensions: string[];
  prompts: string[];
  themes: string[];
}

export interface SkillPackInfo {
  packId: string;
  catalogId?: string;
  name: string;
  description: string;
  source: string;
  scope: SkillPackScope;
  status: SkillPackStatus;
  resources: SkillPackResources;
  containsExtensions: boolean;
}

export interface SkillPackLoadResponse { packs: SkillPackInfo[] }
export interface InstallSkillPackRequest {
  packId: string;
  scope: "global" | "project";
  cwd: string;
}
export interface RemoveSkillPackRequest { packId: string; cwd: string }
```

Create domain aliases and inputs in `src/server/domain/skill-pack.ts`, then define the minimal port in `src/server/ports/skill-pack-provider.ts`:

```ts
export interface SkillPackProvider {
  list(cwd: string): Promise<SkillPackLoadResponse>;
  install(input: InstallSkillPackRequest): Promise<SkillPackLoadResponse>;
  remove(input: RemoveSkillPackRequest): Promise<SkillPackLoadResponse>;
}
```

- [ ] **Step 4: Write failing service workspace tests**

Create `skill-pack-service.test.ts` following `skill-service.test.ts`:

```ts
it("validates cwd for list, project install, global install, and remove", async () => {
  const provider = {
    list: vi.fn().mockResolvedValue({ packs: [] }),
    install: vi.fn().mockResolvedValue({ packs: [] }),
    remove: vi.fn().mockResolvedValue({ packs: [] }),
  };
  const root = path.resolve("C:\\workspace");
  const service = new SkillPackService(provider, {
    listRoots: async () => [root],
    addRoot: vi.fn(),
  });

  await service.install({ packId: "pack_abc", scope: "global", cwd: root });
  expect(provider.install).toHaveBeenCalledWith({
    packId: "pack_abc", scope: "global", cwd: root,
  });
  await expect(service.list(path.resolve("C:\\outside")))
    .rejects.toMatchObject({ status: 403 });
});
```

- [ ] **Step 5: Implement `SkillPackService` and validators**

Implement the same `path.resolve` plus `path.relative` workspace check used by `SkillService`, for every method including global installs. Add:

```ts
export function parseSkillPackInstall(value: unknown): InstallSkillPackRequest {
  const object = asObject(value);
  const scope = requiredString(object, "scope");
  if (scope !== "global" && scope !== "project") {
    invalid("scope must be global or project");
  }
  return {
    packId: requiredString(object, "packId"),
    scope,
    cwd: requiredString(object, "cwd"),
  };
}

export function parseSkillPackRemove(value: unknown): RemoveSkillPackRequest {
  const object = asObject(value);
  return {
    packId: requiredString(object, "packId"),
    cwd: requiredString(object, "cwd"),
  };
}
```

- [ ] **Step 6: Run boundary tests**

Run:

```powershell
npx vitest run src/contracts/skill-packs.test.ts src/server/application/skill-pack-service.test.ts src/server/transport/http/validators.test.ts
```

Expected: all selected tests PASS.

- [ ] **Step 7: Commit contracts and service**

```powershell
git add src/contracts/skill-packs.ts src/contracts/skill-packs.test.ts src/server/domain/skill-pack.ts src/server/ports/skill-pack-provider.ts src/server/application/skill-pack-service.ts src/server/application/skill-pack-service.test.ts src/server/transport/http/validators.ts src/server/transport/http/validators.test.ts
git commit -m "feat: define skill pack boundary"
```

---

### Task 4: Implement the Pi Package Adapter and Official Pack

**Files:**
- Create: `src/server/infrastructure/pi/official-skill-packs.ts`
- Create: `src/server/infrastructure/pi/pi-skill-pack-provider.ts`
- Create: `src/server/infrastructure/pi/pi-skill-pack-provider.test.ts`
- Create: `resources/official-packs/developer-workflows/package.json`
- Create: `resources/official-packs/developer-workflows/skills/investigate-failure/SKILL.md`
- Create: `resources/official-packs/developer-workflows/skills/prepare-change/SKILL.md`
- Modify: `src/server/composition/container.ts`

**Interfaces:**
- Consumes: Task 3 `SkillPackProvider` and contracts; Pi `PackageManager`, `ConfiguredPackage`, and `ResolvedPaths`.
- Produces: `PiSkillPackProvider`, `OFFICIAL_SKILL_PACKS`, and `container.skillPackService`.

- [ ] **Step 1: Create the real bundled Pi Package**

Create `resources/official-packs/developer-workflows/package.json`:

```json
{
  "name": "@po-agent/developer-workflows",
  "version": "1.0.0",
  "description": "Focused workflows for investigating failures and preparing safe changes.",
  "private": true,
  "keywords": ["pi-package", "po-agent-skill-pack"],
  "pi": { "skills": ["./skills"] }
}
```

Create `investigate-failure/SKILL.md`:

```markdown
---
name: investigate-failure
description: Diagnose a reproducible test, build, or runtime failure before proposing a fix. Use when a command fails or behavior is unexpected.
---

# Investigate Failure

1. Capture the exact failure and the smallest reproducing command.
2. Trace the failing path through its callers, implementation, and tests.
3. Form one evidence-backed root-cause hypothesis at a time.
4. Run the smallest check that can disprove the hypothesis.
5. Report the root cause and evidence before changing code.
```

Create `prepare-change/SKILL.md`:

```markdown
---
name: prepare-change
description: Prepare a focused code change by locating ownership, callers, tests, and repository constraints. Use before implementing a non-trivial feature or fix.
---

# Prepare Change

1. Read repository instructions and relevant product or architecture documents.
2. Identify the owning module, callers, contracts, and focused tests.
3. Reuse the existing implementation pattern and choose the smallest coherent change.
4. State required validation commands before implementation.
5. Do not create speculative abstractions or unrelated refactors.
```

- [ ] **Step 2: Write failing Package adapter tests**

Create a fake `PackageManager` with `vi.fn()` methods and assert:

```ts
it("installs only a server-catalogued source", async () => {
  const manager = fakePackageManager();
  const provider = new PiSkillPackProvider(() => manager, [{
    id: "developer-workflows",
    source: "C:\\app\\developer-workflows",
    name: "Developer Workflows",
    description: "Focused developer workflows",
    expectedSkills: ["investigate-failure", "prepare-change"],
    containsExtensions: false,
  }]);
  const packId = provider.packIdForCatalog("developer-workflows");

  await provider.install({ packId, scope: "project", cwd: "C:\\work" });
  expect(manager.installAndPersist).toHaveBeenCalledWith(
    "C:\\app\\developer-workflows",
    { local: true },
  );
});

it("rejects an unknown opaque id before installation", async () => {
  const manager = fakePackageManager();
  const provider = new PiSkillPackProvider(() => manager, []);
  await expect(provider.install({ packId: "npm:evil", scope: "global", cwd: "C:\\work" }))
    .rejects.toMatchObject({ code: "SKILL_PACK_NOT_FOUND", status: 404 });
  expect(manager.installAndPersist).not.toHaveBeenCalled();
});

it("cleans up when fresh resolution cannot verify expected skills", async () => {
  const manager = fakePackageManager();
  manager.listConfiguredPackages.mockReturnValue([{ source: "C:\\app\\pack", scope: "project", filtered: false, installedPath: "C:\\app\\pack" }]);
  manager.resolve.mockResolvedValue(emptyResolvedPaths());
  const provider = providerWithOnePack(manager);
  await expect(provider.install(installInput(provider))).rejects.toMatchObject({
    code: "SKILL_PACK_INSTALL_FAILED",
  });
  expect(manager.removeAndPersist).toHaveBeenCalled();
});
```

- [ ] **Step 3: Run the adapter test and confirm failure**

Run: `npx vitest run src/server/infrastructure/pi/pi-skill-pack-provider.test.ts`

Expected: FAIL because the adapter and catalog do not exist.

- [ ] **Step 4: Implement the reviewed catalog**

In `official-skill-packs.ts`, resolve the Package path from the sibling of the built-in directory so development and Electron use the same resource root:

```ts
import path from "node:path";
import { resolveBuiltinSkillsDir } from "./pi-resource-loader";

export interface OfficialSkillPackDefinition {
  id: string;
  source: string;
  name: string;
  description: string;
  expectedSkills: string[];
  containsExtensions: boolean;
}

export function getOfficialSkillPacks(): OfficialSkillPackDefinition[] {
  const resourcesDir = path.dirname(resolveBuiltinSkillsDir());
  return [{
    id: "developer-workflows",
    source: path.join(resourcesDir, "official-packs", "developer-workflows"),
    name: "Developer Workflows",
    description: "Focused workflows for investigating failures and preparing safe changes.",
    expectedSkills: ["investigate-failure", "prepare-change"],
    containsExtensions: false,
  }];
}
```

- [ ] **Step 5: Implement `PiSkillPackProvider` minimally**

Use constructor injection only for tests:

```ts
type PackageManagerFactory = (cwd: string) => PackageManager;

export class PiSkillPackProvider implements SkillPackProvider {
  private running = false;

  constructor(
    private readonly createManager: PackageManagerFactory = createDefaultManager,
    private readonly catalog = getOfficialSkillPacks(),
  ) {}

  packIdForCatalog(catalogId: string): string {
    return opaqueId(`catalog:${catalogId}`);
  }

  async list(cwd: string): Promise<SkillPackLoadResponse> {
    const manager = this.createManager(cwd);
    const configured = manager.listConfiguredPackages();
    const resolved = await manager.resolve(async () => "skip");
    return { packs: mapPacks(this.catalog, configured, resolved) };
  }

  async install(input: InstallSkillPackRequest): Promise<SkillPackLoadResponse> {
    return this.withMutation("SKILL_PACK_INSTALL_BUSY", async () => {
      const definition = this.catalog.find(
        (item) => this.packIdForCatalog(item.id) === input.packId,
      );
      if (!definition) throw new AppError("SKILL_PACK_NOT_FOUND", "Skill Pack was not found.", 404);
      const manager = this.createManager(input.cwd);
      await manager.installAndPersist(definition.source, { local: input.scope === "project" });
      const result = await this.list(input.cwd);
      const installed = result.packs.find((pack) => pack.catalogId === definition.id);
      if (installed?.status !== "installed" ||
          !definition.expectedSkills.every((name) => installed.resources.skills.includes(name))) {
        await manager.removeAndPersist(definition.source, { local: input.scope === "project" });
        throw new AppError("SKILL_PACK_INSTALL_FAILED", "Installed Skill Pack could not be verified.", 500);
      }
      return result;
    });
  }
}
```

Implement `remove()` by rebuilding the effective list, resolving `packId` to exactly one configured source/scope, calling `removeAndPersist(source, { local: scope === "project" })`, and verifying absence. `mapPacks()` groups `ResolvedPaths` entries by `metadata.source`, derives Skill names from `SKILL.md` parent directories, and marks a configured Pack `broken` when `installedPath` is absent or no declared resources resolve. `opaqueId()` is `pack_` plus the first 16 hex characters of SHA-256 over server-owned identity text.

Wrap unknown Pi errors in stable `AppError` codes and never attach process output to error details.

- [ ] **Step 6: Compose the service**

In `container.ts`:

```ts
const skillPacks = new PiSkillPackProvider();
// ...
skillPackService: new SkillPackService(skillPacks, roots),
```

- [ ] **Step 7: Run adapter and service tests**

Run:

```powershell
npx vitest run src/server/infrastructure/pi/pi-skill-pack-provider.test.ts src/server/application/skill-pack-service.test.ts
```

Expected: all selected tests PASS, including install verification cleanup and opaque-ID removal.

- [ ] **Step 8: Commit the Package adapter and first Pack**

```powershell
git add src/server/infrastructure/pi/official-skill-packs.ts src/server/infrastructure/pi/pi-skill-pack-provider.ts src/server/infrastructure/pi/pi-skill-pack-provider.test.ts src/server/composition/container.ts resources/official-packs/developer-workflows
git commit -m "feat: manage official skill packs"
```

---

### Task 5: Expose Skill Pack HTTP Endpoints

**Files:**
- Create: `src/app/api/skill-packs/route.ts`
- Create: `src/app/api/skill-packs/install/route.ts`
- Modify: `docs/agent-api-reference.md`
- Modify: `src/features/skills/skill-contract.test.ts`

**Interfaces:**
- Consumes: Task 3 validators/contracts and `container.skillPackService`.
- Produces: `GET /api/skill-packs`, `POST /api/skill-packs/install`, and `DELETE /api/skill-packs`.

- [ ] **Step 1: Add failing route contract assertions**

Extend `skill-contract.test.ts` to read both new route files and assert:

```ts
expect(packRouteSource).toContain("container.skillPackService.list(cwd)");
expect(packRouteSource).toContain("parseSkillPackRemove");
expect(packInstallRouteSource).toContain("parseSkillPackInstall");
expect(packInstallRouteSource).toContain("container.skillPackService.install");
```

- [ ] **Step 2: Run the route contract test and confirm failure**

Run: `npx vitest run src/features/skills/skill-contract.test.ts`

Expected: FAIL because the new Route Handler files do not exist.

- [ ] **Step 3: Add thin Route Handlers**

Create `src/app/api/skill-packs/route.ts`:

```ts
import type { SkillPackLoadResponse } from "@/contracts/skill-packs";
import { container } from "@/server/composition/container";
import { handleRoute, readJson } from "@/server/transport/http/api-response";
import { parseSkillPackRemove } from "@/server/transport/http/validators";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleRoute<SkillPackLoadResponse>(() => {
    const cwd = new URL(request.url).searchParams.get("cwd") ?? "";
    return container.skillPackService.list(cwd);
  });
}

export async function DELETE(request: Request) {
  return handleRoute<SkillPackLoadResponse>(async () =>
    container.skillPackService.remove(parseSkillPackRemove(await readJson(request))),
  );
}
```

Create `src/app/api/skill-packs/install/route.ts` with the same imports and a `POST` that parses with `parseSkillPackInstall()` and delegates to `skillPackService.install()`.

- [ ] **Step 4: Document exact contracts and side effects**

Add all three endpoints to the API table and detailed sections in `docs/agent-api-reference.md`. Document:

- required `cwd`, opaque `packId`, and scope values;
- `available`, `installed`, and `broken` status meanings;
- stable error codes from the specification;
- installation/removal side effects;
- newly created sessions requirement;
- absence of sandbox or granular Pi Package permissions;
- no arbitrary source input.

Also amend the existing Skill PATCH/DELETE sections: Package-owned and built-in Skills reject direct mutation with HTTP 403.

- [ ] **Step 5: Run route, validator, and contract tests**

Run:

```powershell
npx vitest run src/features/skills/skill-contract.test.ts src/server/transport/http/validators.test.ts src/contracts/skill-packs.test.ts
```

Expected: all selected tests PASS.

- [ ] **Step 6: Commit the HTTP surface**

```powershell
git add src/app/api/skill-packs/route.ts src/app/api/skill-packs/install/route.ts docs/agent-api-reference.md src/features/skills/skill-contract.test.ts
git commit -m "feat: expose skill pack api"
```

---

### Task 6: Add the Skill Packs UI

**Files:**
- Create: `src/features/skills/use-skill-packs.ts`
- Create: `src/features/skills/skill-pack-list.tsx`
- Create: `src/features/skills/skill-pack-detail.tsx`
- Create: `src/features/skills/confirm-skill-pack-dialog.tsx`
- Create: `src/features/skills/skill-pack-api.test.ts`
- Create: `src/features/skills/skill-pack-state.test.ts`
- Modify: `src/features/skills/api.ts`
- Modify: `src/features/skills/types.ts`
- Modify: `src/features/skills/skills-page.tsx`
- Modify: `src/features/skills/skills-page.test.ts`
- Modify: `src/features/skills/skill-state.ts`
- Modify: `src/features/skills/skill-list.tsx`
- Modify: `src/i18n/dictionaries/en.ts`
- Modify: `src/i18n/dictionaries/zh.ts`
- Modify: `src/i18n/i18n.test.ts`

**Interfaces:**
- Consumes: Task 5 Pack HTTP endpoints and Task 3 contracts.
- Produces: `loadSkillPacks()`, `installSkillPack()`, `removeSkillPack()`, `useSkillPacks(cwd)`, and Skills/Skill Packs tabs.

- [ ] **Step 1: Write failing API client tests**

Create `skill-pack-api.test.ts`:

```ts
it("loads, installs, and removes packs with opaque ids", async () => {
  const fetchMock = vi.spyOn(global, "fetch")
    .mockResolvedValue(new Response(JSON.stringify({ packs: [] }), { status: 200 }));

  await loadSkillPacks("C:\\work");
  expect(fetchMock).toHaveBeenNthCalledWith(
    1,
    "/api/skill-packs?cwd=C%3A%5Cwork",
    expect.any(Object),
  );
  await installSkillPack({ packId: "pack_abc", scope: "project", cwd: "C:\\work" });
  expect(JSON.parse(fetchMock.mock.calls[1][1]!.body as string)).toEqual({
    packId: "pack_abc", scope: "project", cwd: "C:\\work",
  });
  await removeSkillPack({ packId: "pack_abc", cwd: "C:\\work" });
  expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: "DELETE" });
});
```

- [ ] **Step 2: Run the API test and confirm missing functions**

Run: `npx vitest run src/features/skills/skill-pack-api.test.ts`

Expected: FAIL because Pack client functions are missing.

- [ ] **Step 3: Add API functions and the Pack hook**

Re-export Pack contract types from `types.ts`. Add to `api.ts`:

```ts
export function loadSkillPacks(cwd: string, signal?: AbortSignal) {
  return requestJson<SkillPackLoadResponse>(
    `/api/skill-packs?cwd=${encodeURIComponent(cwd)}`,
    { signal },
  );
}

export function installSkillPack(input: InstallSkillPackRequest, signal?: AbortSignal) {
  return requestJson<SkillPackLoadResponse>("/api/skill-packs/install", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
}

export function removeSkillPack(input: RemoveSkillPackRequest, signal?: AbortSignal) {
  return requestJson<SkillPackLoadResponse>("/api/skill-packs", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
}
```

Implement `useSkillPacks(cwd)` with one `AbortController`, selected Pack reconciliation, `loading`, `installingPackId`, `removingPackId`, `error`, and the same interruption cleanup pattern used by `useSkills`. `install(packId, scope)` and `remove(packId)` apply the returned list and expose success to the page.

- [ ] **Step 4: Write failing UI/state contract tests**

Add to `skills-page.test.ts`:

```ts
expect(source).toContain('"skills"');
expect(source).toContain('"packs"');
expect(source).toContain("useSkillPacks(cwd)");
expect(source).toContain("SkillPackList");
expect(source).toContain("SkillPackDetail");
expect(source).toContain("ConfirmSkillPackDialog");
```

Create `skill-pack-state.test.ts` to assert selection survives refresh and falls back to the first Pack, using a small `SkillPackInfo` fixture.

- [ ] **Step 5: Implement the compact Pack UI**

In `skills-page.tsx`, add:

```ts
const [view, setView] = useState<"skills" | "packs">("skills");
const packs = useSkillPacks(cwd);
```

Render a two-button `role="tablist"` above the sidebar actions. Keep the existing Skills tree unchanged inside the Skills branch. The Packs branch renders `SkillPackList` in the sidebar and `SkillPackDetail` in the main pane.

`SkillPackList` rows contain localized catalog title/description, status, scope, and Skill count. `SkillPackDetail` shows Package source, resource names, status, scope, the general command-execution warning, and a stronger Extension warning when `containsExtensions` is true.

`ConfirmSkillPackDialog` uses the existing Dialog and Button primitives. Install confirmation requires a project/global radio selection and names the scope. Remove confirmation names the Pack. Both dialogs remain open on backdrop and Escape through existing Dialog behavior.

After success, show the localized message that changes apply to new sessions. Do not add environment-health badges, ratings, images, update buttons, arbitrary source inputs, or per-resource switches.

Add dictionary keys under `skills.packs` in both locales. For `catalogId === "developer-workflows"`, use dictionary copy; non-catalog configured Packages use `name` and `description` from the response.

- [ ] **Step 6: Group managed Skills accurately**

Update `groupId()` in `skill-state.ts` before project/global checks:

```ts
if (skill.sourceInfo.source === "po-agent-builtin") return "builtin";
if (skill.sourceInfo.origin === "package") {
  return `package:${skill.sourceInfo.source}`;
}
```

Update `groupRank()` to order built-in, project, global, Package, then other paths. Update `skill-list.tsx` labels with new localized `builtIn` and `fromSkillPack` copy.

- [ ] **Step 7: Run all focused frontend tests**

Run:

```powershell
npx vitest run src/features/skills/skill-pack-api.test.ts src/features/skills/skill-pack-state.test.ts src/features/skills/skills-page.test.ts src/features/skills/skill-state.test.ts src/features/skills/skill-ui.test.ts src/i18n/i18n.test.ts
```

Expected: all selected tests PASS.

- [ ] **Step 8: Verify the browser workflow**

Run `npm run dev`, open a registered project, and verify at 1024px and 1440px in English and Chinese:

1. Built-in Skills appear read-only.
2. Package-owned Skills do not show toggle or remove controls.
3. Skill Packs tab lists Developer Workflows as available.
4. Install confirmation shows scope and security copy.
5. Project install returns both Pack Skills after refresh.
6. Existing session remains unchanged and the new-session notice appears.
7. A new session sees Pack Skills.
8. Removing the Pack removes its Skills from a newly created session.
9. Keyboard focus and visible focus remain intact.

Expected: all nine checks succeed with no console error.

- [ ] **Step 9: Commit the UI**

```powershell
git add src/features/skills src/i18n/dictionaries/en.ts src/i18n/dictionaries/zh.ts src/i18n/i18n.test.ts
git commit -m "feat: add skill pack management ui"
```

---

### Task 7: Full Verification and Handoff

**Files:**
- Modify only files required to fix failures introduced by Tasks 1-6.

**Interfaces:**
- Consumes: the complete feature.
- Produces: verified repository state; no new product capability.

- [ ] **Step 1: Run the complete required check**

Run: `npm run check`

Expected: ESLint exits 0, TypeScript exits 0, all Vitest tests pass, and both desktop Node test files pass.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: Next.js production compilation exits 0 and includes `/api/skill-packs` and `/api/skill-packs/install` Route Handlers.

- [ ] **Step 3: Verify standalone asset preparation**

Run: `npm run desktop:prepare`

Expected: command exits 0; `.next/standalone` contains the production server assets, and Electron `extraResources` remains configured to copy `resources/**/*` during packaging.

- [ ] **Step 4: Inspect the final diff and generated-file safety**

Run:

```powershell
git status --short
git diff --check
git diff --stat HEAD~6..HEAD
git diff --name-only HEAD~6..HEAD | Select-String -Pattern "next-env.d.ts|package-lock.json"
```

Expected: no whitespace errors; `next-env.d.ts` and `package-lock.json` are absent; only feature, resource, test, API documentation, and packaging files are changed.
