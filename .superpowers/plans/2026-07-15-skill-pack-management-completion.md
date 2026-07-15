# Skill Pack Management Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support reviewed manual Package sources, ship one real official Pack, and add version, update, and repair controls.

**Architecture:** Extend the existing `SkillPackProvider` and Pi `DefaultPackageManager` adapter. Route Handlers stay thin; application validates Workspace context; infrastructure validates Package sources and maps Pi metadata; the existing Skills feature owns the UI.

**Tech Stack:** Next.js 16.2.1, React 19.2.4, TypeScript 5, Vitest 4, Electron 43, `@earendil-works/pi-coding-agent` 0.75.5.

## Global Constraints

- Preserve `domain <- ports <- application <- transport`.
- Reuse Pi for install, update, repair, persistence, and resolution.
- Accept npm, Git, protocol URL, and absolute local-directory sources; reject URL credentials and query strings.
- Register local Package directories with `WorkspaceRootProvider` before Pi reads them.
- Never return credentials, command output, environment values, or unsanitized sources.
- Do not hot-reload active Agent sessions.
- Add every UI string to English and Chinese dictionaries.
- Add no dependency, marketplace, progress SSE, signing, sandbox, per-resource switch, or Workflow engine.
- Before Next.js work, read the installed Route Handler and Server/Client Component guides completely.
- Before handoff run `npm run check`, `npm run build`, and `npm run desktop:prepare`.

---

### Task 1: Extend contracts and application boundary

**Files:**
- Modify: `src/contracts/skill-packs.ts`
- Modify: `src/server/domain/skill-pack.ts`
- Modify: `src/server/ports/skill-pack-provider.ts`
- Modify: `src/server/application/skill-pack-service.ts`
- Test: `src/server/application/skill-pack-service.test.ts`
- Modify: `src/server/transport/http/validators.ts`
- Test: `src/server/transport/http/validators.test.ts`
- Modify: `src/server/domain/app-error.ts`

**Interfaces:**
- Produces: `InstallSkillPackSourceRequest`, `MaintainSkillPackRequest`, lifecycle metadata, and `installSource()`, `update()`, `repair()`.

- [ ] **Step 1: Write failing tests**

Extend Pack fixtures with `version`, `availableVersion`, `updateAvailable`, and `canUpdate`. Assert the service resolves `cwd` before delegating these exact calls:

```ts
await service.installSource({
  source: "npm:@scope/release-pack",
  scope: "project",
  cwd: root,
});
await service.update({ packId: "pack_abc", cwd: root });
await service.repair({ packId: "pack_abc", cwd: root });
```

Assert validators accept those shapes and reject missing strings or invalid scopes.

- [ ] **Step 2: Confirm RED**

Run `npx vitest run src/contracts/skill-packs.test.ts src/server/application/skill-pack-service.test.ts src/server/transport/http/validators.test.ts`.

Expected: FAIL on missing fields, parsers, and methods.

- [ ] **Step 3: Implement minimum contracts**

Add:

```ts
version?: string;
availableVersion?: string;
updateAvailable: boolean;
canUpdate: boolean;

export interface InstallSkillPackSourceRequest {
  source: string;
  scope: "global" | "project";
  cwd: string;
}

export interface MaintainSkillPackRequest {
  packId: string;
  cwd: string;
}
```

Re-export domain aliases, extend the port/service, and resolve `cwd` before delegation. Add `parseSkillPackInstallSource()` and shared `parseSkillPackMaintain()`. Add `SKILL_PACK_UPDATE_FAILED` and `SKILL_PACK_REPAIR_FAILED`; invalid sources use `VALIDATION_ERROR`.

- [ ] **Step 4: Confirm GREEN and commit**

Run the Step 2 command. Expected: PASS.

Commit all Task 1 files as `feat: extend skill pack lifecycle boundary`.

---

### Task 2: Implement source validation and Pi lifecycle

**Files:**
- Create: `src/server/infrastructure/pi/package-source.ts`
- Modify: `src/server/infrastructure/pi/pi-skill-pack-provider.ts`
- Test: `src/server/infrastructure/pi/pi-skill-pack-provider.test.ts`
- Modify: `src/server/infrastructure/pi/pi-skill-provider.ts`
- Modify: `src/server/composition/container.ts`

**Interfaces:**
- Consumes: Task 1 requests, Pi `PackageManager`, and `WorkspaceRootProvider`.
- Produces: normalized/redacted sources, versions, manual install, update, and repair.

- [ ] **Step 1: Write failing tests**

Test accepted npm/Git/URL/absolute-local forms. Reject URL userinfo, query, hash, control characters, unsupported protocols, and relative paths. With a temporary Package directory assert root registration precedes Pi install, version comes from `package.json`, empty resolution rolls back, and secrets never reach Pack or Skill responses.

Assert update calls `manager.update(configured.source)`, rejects local sources, and repair calls:

```ts
manager.install(configured.source, {
  local: configured.scope === "project",
});
```

Repair requires `broken`; failed update/repair keeps the configured Pack visible.

- [ ] **Step 2: Confirm RED**

Run `npx vitest run src/server/infrastructure/pi/pi-skill-pack-provider.test.ts src/server/infrastructure/pi/pi-skill-provider.test.ts`.

Expected: FAIL on missing helper and provider methods.

- [ ] **Step 3: Add one shared source helper**

Create exactly these exports using `node:path` and `URL`:

```ts
export function normalizeManualPackageSource(source: string): string;
export function safePackageSource(source: string): string;
export function isLocalPackageSource(source: string): boolean;
export function canUpdatePackageSource(source: string): boolean;
```

Move existing redaction into it and apply it in `PiSkillProvider` for Package-owned Skill metadata.

- [ ] **Step 4: Implement provider operations**

Inject `WorkspaceRootProvider`. Register configured/new absolute local sources before resolution or install. Read `<installedPath>/package.json` with `node:fs/promises`; missing versions return `undefined` without changing health.

Implement `installSource`, `update`, and `repair` by reusing the mutation guard, opaque-ID lookup, verification, cleanup, and error wrapping. A successful mutation must resolve at least one enabled resource. Update calls Pi `update(source)`; repair calls Pi `install(source, { local })` without duplicating Settings.

- [ ] **Step 5: Confirm GREEN and commit**

Run the Step 2 command. Expected: PASS.

Commit all Task 2 files as `feat: manage manual skill pack sources`.

---

### Task 3: Add lifecycle HTTP endpoints

**Files:**
- Create: `src/app/api/skill-packs/install-source/route.ts`
- Create: `src/app/api/skill-packs/update/route.ts`
- Create: `src/app/api/skill-packs/repair/route.ts`
- Modify: `src/features/skills/skill-contract.test.ts`
- Modify: `docs/agent-api-reference.md`

**Interfaces:**
- Consumes: Task 1 validators and `container.skillPackService`.
- Produces: three POST endpoints returning `SkillPackLoadResponse`.

- [ ] **Step 1: Read the installed Next.js guide**

Read `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` completely.

- [ ] **Step 2: Write failing route contract tests**

Assert each route exports Node runtime, reads JSON with `readJson`, calls its Task 1 validator, and delegates to exactly one SkillPackService method.

- [ ] **Step 3: Confirm RED**

Run `npx vitest run src/features/skills/skill-contract.test.ts`.

Expected: FAIL because the routes are absent.

- [ ] **Step 4: Add thin POST handlers**

Follow the existing install route. The update route is:

```ts
export async function POST(request: Request) {
  return handleRoute<SkillPackLoadResponse>(async () =>
    container.skillPackService.update(
      parseSkillPackMaintain(await readJson(request)),
    ),
  );
}
```

Use `installSource`/`parseSkillPackInstallSource` and `repair`/`parseSkillPackMaintain` in sibling routes. Add no business logic.

- [ ] **Step 5: Update API docs and commit**

Document exact bodies, accepted sources, lifecycle fields, errors, local-directory behavior, credential rejection, side effects, and new-session semantics.

Run `npx vitest run src/features/skills/skill-contract.test.ts src/server/transport/http/validators.test.ts src/contracts/skill-packs.test.ts`.

Expected: PASS. Commit Task 3 files as `feat: expose skill pack lifecycle api`.

---

### Task 4: Ship Git & Release Workflows

**Files:**
- Create: `resources/official-packs/git-release-workflows/package.json`
- Create: `resources/official-packs/git-release-workflows/skills/prepare-release/SKILL.md`
- Create: `resources/official-packs/git-release-workflows/skills/write-release-notes/SKILL.md`
- Create: `src/server/infrastructure/pi/git-release-official-pack.test.ts`
- Modify: `src/server/infrastructure/pi/official-skill-packs.ts`
- Test: `src/server/infrastructure/pi/official-skill-packs.test.ts`

**Interfaces:**
- Produces: `@po-agent/git-release-workflows@1.0.0` with two verified Skills.

- [ ] **Step 1: Run baseline Skill scenarios**

Without either Skill, test a fixture repository containing an uncommitted file, failing check, ambiguous tag range, internal refactor, one user-visible fix, and no issue links. Record false readiness claims, unintended Git mutations, invented links/compatibility, and poor impact grouping.

- [ ] **Step 2: Write failing Pack tests**

Assert manifest name/version, `pi.skills: ["./skills"]`, valid frontmatter, and catalog entry:

```ts
{
  id: "git-release-workflows",
  version: "1.0.0",
  expectedSkills: ["prepare-release", "write-release-notes"],
  containsExtensions: false,
}
```

- [ ] **Step 3: Confirm RED**

Run `npx vitest run src/server/infrastructure/pi/git-release-official-pack.test.ts src/server/infrastructure/pi/official-skill-packs.test.ts`.

Expected: FAIL because the Package is absent.

- [ ] **Step 4: Write minimal Skills and manifest**

Each description starts with `Use when...`; each Skill stays under 500 words.

`prepare-release` outputs Verdict, Evidence, Blockers, and Next actions. It requires clean-state, release-range, validation, version, and risk evidence and never commits, tags, publishes, or pushes without a separate request.

`write-release-notes` requires an explicit Git range, groups only verified user impact, labels inferred wording, and never invents links, issue IDs, compatibility, or migrations.

- [ ] **Step 5: Re-run Skill scenarios**

Require correct verdicts, no mutation, no invented metadata, and stable output. Refine only observed gaps; add no scripts or references unless the scenarios prove necessary.

- [ ] **Step 6: Confirm GREEN and commit**

Run `npx vitest run src/server/infrastructure/pi/git-release-official-pack.test.ts src/server/infrastructure/pi/official-skill-packs.test.ts src/server/infrastructure/pi/pi-skill-pack-provider.test.ts`.

Expected: PASS. Commit Task 4 files as `feat: ship git release skill pack`.

---

### Task 5: Complete Skill Pack UI

**Files:**
- Create: `src/features/skills/add-skill-pack-dialog.tsx`
- Create: `src/types/desktop.d.ts`
- Modify: `src/features/sessions/project-picker.tsx`
- Modify: `src/features/skills/api.ts`
- Modify: `src/features/skills/types.ts`
- Modify: `src/features/skills/use-skill-packs.ts`
- Modify: `src/features/skills/skill-pack-list.tsx`
- Modify: `src/features/skills/skill-pack-detail.tsx`
- Modify: `src/features/skills/skill-detail.tsx`
- Modify: `src/features/skills/skills-page.tsx`
- Modify: focused Skills tests and both dictionaries

**Interfaces:**
- Consumes: Tasks 1–4 API and desktop `selectProjectDirectory()` bridge.
- Produces: manual-source Dialog, lifecycle actions, versions, and owner navigation.

- [ ] **Step 1: Read installed client documentation**

Read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` completely.

- [ ] **Step 2: Write failing frontend tests**

Assert exact API paths/bodies and require Add Dialog, version labels, Update only when `canUpdate`, Repair only when `broken`, Remove for configured Packs, one shared mutation state, `View Skill Pack`, and matching dictionary keys.

- [ ] **Step 3: Confirm RED**

Run `npx vitest run src/features/skills/skill-pack-api.test.ts src/features/skills/skill-pack-state.test.ts src/features/skills/skills-page.test.ts src/features/skills/skill-ui.test.ts src/i18n/i18n.test.ts`.

Expected: FAIL on missing lifecycle clients and UI.

- [ ] **Step 4: Add clients and one mutation runner**

Add `installSkillPackSource`, `updateSkillPack`, and `repairSkillPack`. Replace separate install/remove busy fields with:

```ts
type PackMutation = {
  operation: "install" | "install-source" | "remove" | "update" | "repair";
  packId: string | null;
} | null;
```

Use one `runMutation()` with the existing AbortController and busy guard.

- [ ] **Step 5: Implement compact UI**

Move the desktop global declaration to `src/types/desktop.d.ts`. The Add Dialog has one source Input, native Browse when available, project/global radios, security warning, Cancel, and Install. Web development users may type an absolute path.

Show current/available versions and actions: Install for available, Update for healthy remote, Refresh guidance for healthy local, Repair for broken, and Remove for every configured Pack. Reuse existing primitives and tokens.

Pass `onViewPack(source)` into `SkillDetail`; switch tabs and select the Pack whose sanitized source matches the Package-owned Skill source. Omit the action when no owner is loaded.

- [ ] **Step 6: Confirm GREEN and commit**

Run the Step 3 command. Expected: PASS.

Commit Task 5 files as `feat: complete skill pack management ui`.

---

### Task 6: End-to-end verification and handoff

**Files:**
- Modify only files required to correct failures introduced by Tasks 1–5.

**Interfaces:**
- Produces: verified branch with no temporary Package residue.

- [ ] **Step 1: Run focused checks**

Run:

```powershell
npx vitest run src/contracts/skill-packs.test.ts src/server/application/skill-pack-service.test.ts src/server/transport/http/validators.test.ts src/server/infrastructure/pi/official-skill-packs.test.ts src/server/infrastructure/pi/pi-skill-pack-provider.test.ts src/server/infrastructure/pi/pi-skill-provider.test.ts src/features/skills/skill-contract.test.ts src/features/skills/skill-pack-api.test.ts src/features/skills/skill-pack-state.test.ts src/features/skills/skills-page.test.ts src/features/skills/skill-ui.test.ts src/i18n/i18n.test.ts
```

Expected: every selected test PASS.

- [ ] **Step 2: Verify real browser workflows**

Verify Chinese and English: official Pack available at `1.0.0`; project install adds both read-only Skills; owner navigation and version render; removal removes both Skills; an absolute local Package outside the Workspace installs/removes; a missing path renders broken and failed Repair keeps it visible.

- [ ] **Step 3: Remove verification residue**

Restore project and user Pi Settings to their pre-test Package lists and delete only temporary verification directories.

- [ ] **Step 4: Run complete checks**

```powershell
npm run check
npm run build
npm run desktop:prepare
git diff --check
git status --short
```

Expected: commands exit 0; only the known Turbopack NFT tracing warning may remain.

- [ ] **Step 5: Request code review**

Review from `1be30c0` through working HEAD for source validation, redaction, root registration, rollback, update/repair state, accessibility, and stale Settings. Fix every Critical or Important finding and repeat Step 4.

- [ ] **Step 6: Commit review fixes only when needed**

Commit reviewed fixes as `fix: harden skill pack lifecycle`. Do not create an empty commit.
