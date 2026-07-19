# Skill Pack Management Completion Design

Date: 2026-07-15
Status: Approved

## 1. Goal

Complete the first usable Skill Pack workflow by adding:

1. manual installation from npm, Git, HTTPS, or a local directory;
2. one real official `Git & Release Workflows` Pack;
3. Package version display, update, and broken-install repair.

Pi Package remains the only installer and resource runtime. This work does not
add a marketplace, Workflow engine, permission sandbox, or second manifest.

## 2. Decisions

### 2.1 Installation sources

The existing official catalog continues to install by opaque `packId`. Manual
installation adds a separate request containing `source`, `scope`, and `cwd`.

Accepted manual sources are:

- `npm:<package>` with an optional version;
- `git:<repository>` with an optional ref;
- `https://`, `http://`, `ssh://`, or `git://` repository URLs;
- an absolute local directory selected or entered by the user.

Local Package directories may be outside the current Workspace. Before Pi reads
one, the resolved directory is registered with the existing
`WorkspaceRootProvider`. This preserves the repository rule that filesystem
access stays inside registered roots while honoring the explicit product
decision to allow arbitrary user-selected Package directories.

The application does not add an authorization token. The desktop process
already runs with the user's filesystem permissions; the meaningful controls
are explicit selection, validation, confirmation, and a local-only server.

### 2.2 Rejected approaches

- The frontend does not edit `.pi/settings.json` directly because that bypasses
  validation, rollback, and resource verification.
- Po Agent does not implement another PackageManager because Pi already
  owns installation, updates, persistence, and resolution.
- Local Packs are not copied into the Workspace because copies become stale and
  break the expected live-directory development workflow.

## 3. Official Pack

Ship `Git & Release Workflows` as a real repository-controlled Pi Package:

```text
resources/official-packs/git-release-workflows/
├── package.json
└── skills/
    ├── prepare-release/SKILL.md
    └── write-release-notes/SKILL.md
```

Package identity:

- catalog id: `git-release-workflows`;
- package name: `@po-agent/git-release-workflows`;
- version: `1.0.0`;
- source: the bundled local Package directory;
- resources: Skills only; no executable Extension.

`prepare-release` checks repository state, release range, validation evidence,
version consistency, and release risks before producing a concise checklist.
It does not commit, tag, publish, or push unless the user separately requests
those actions.

`write-release-notes` converts a user-selected Git range into user-facing
release notes grouped by impact. It distinguishes verified repository facts
from inferred wording and does not invent issue links or compatibility claims.

Each Skill is concise, self-contained, and tested with scenario-based contract
tests before it is accepted into the Pack.

## 4. Public Contract

Extend `SkillPackInfo` with optional lifecycle metadata:

```ts
interface SkillPackInfo {
  // existing fields
  version?: string;
  availableVersion?: string;
  updateAvailable: boolean;
  canUpdate: boolean;
}
```

Rules:

- `version` comes from the installed Package's `package.json` when readable.
- `availableVersion` comes from the official catalog.
- `updateAvailable` is true only when both versions are known and differ.
- `canUpdate` is true for installed npm and Git Packages. Bundled local Packs
  and user local-directory Packs update in place and use Refresh instead.
- Missing version metadata does not make an otherwise valid Package broken.

Add requests:

```ts
interface InstallSkillPackSourceRequest {
  source: string;
  scope: "global" | "project";
  cwd: string;
}

interface MaintainSkillPackRequest {
  packId: string;
  cwd: string;
}
```

Add endpoints:

- `POST /api/skill-packs/install-source`;
- `POST /api/skill-packs/update`;
- `POST /api/skill-packs/repair`.

Update and repair accept only opaque IDs. The server reloads current Pi Settings
and resolves the real source and scope before performing any mutation.

## 5. Validation

Transport validates JSON shape, required strings, and scope enums. Application
validates `cwd` through the existing registered Workspace flow.

Infrastructure normalizes and validates manual sources:

- reject empty values, control characters, unsupported schemes, and URL
  credentials or query strings;
- require npm and Git sources to match Pi-supported source forms;
- require local sources to be absolute existing directories;
- register a validated local source as an allowed root before reading it;
- require the directory to expose at least one Pi resource through its manifest
  or conventional Package directories.

The browser never receives embedded credentials. Errors use stable `AppError`
codes and do not include command output, environment values, or secret-bearing
source strings.

## 6. Provider Behavior

### 6.1 Manual install

1. Validate and normalize the source.
2. Reject an already configured effective source.
3. Register a local directory root when applicable.
4. Call `installAndPersist(source, { local })`.
5. Resolve resources again.
6. Require at least one enabled Skill, Extension, Prompt, or Theme.
7. On verification failure, call `removeAndPersist()` and return a stable
   installation error.

### 6.2 Update

1. Resolve the opaque ID to one configured Package.
2. Reject local-directory Packages with a reason-specific validation error.
3. Call Pi `update(source)`.
4. Resolve resources and version again.
5. Keep existing settings if update or verification fails.

Pinned npm versions and pinned Git refs remain pinned according to Pi behavior.
The UI labels the action `Check and update`; a successful no-op is valid.

### 6.3 Repair

1. Resolve a configured `broken` Package by opaque ID.
2. Call Pi `install(source, { local })` without duplicating its Settings entry.
3. Resolve resources again.
4. Return `installed` only when an installed path and at least one Package
   resource resolve.
5. Keep the configuration visible as `broken` when repair fails.

The existing in-process mutation guard covers install, remove, update, and
repair.

## 7. UI

The existing Skills feature remains the owner.

### 7.1 Add flow

The Skill Packs tab gains one `Add Skill Pack` action. Its Dialog contains:

- one source input;
- a local-directory browse action using the existing directory browser;
- project/global scope radios;
- the existing Package execution warning;
- a specific Install action.

The Dialog does not introduce a source-type wizard. Source type is inferred by
the server, keeping the flow compact.

### 7.2 List and detail

Rows display name, installed version when known, scope, status, and Skill count.
The detail view shows current version and official available version.

Actions are state-driven:

- `available`: Install;
- healthy installed remote Package: Check and update, Remove;
- healthy local Package: Refresh hint, Remove;
- `broken`: Repair, Remove.

Busy actions prevent every Package mutation and show an understandable loading
label. Errors remain in the existing alert surface.

Package-owned Skill detail adds `View Skill Pack`, switching to the Pack tab and
selecting the owner when it is present in the effective Package list.

All new strings are added to English and Chinese dictionaries. The UI uses
existing Buttons, Dialogs, inputs, badges, tokens, and focus patterns.

## 8. Session Semantics

Package list and Skills configuration refresh immediately after a successful
mutation. Active Agent sessions are not hot-reloaded; newly created or restored
sessions receive the new resource set. The UI continues to state this explicitly.

## 9. Testing and Delivery

Focused tests cover:

- accepted and rejected manual source forms;
- arbitrary absolute local directories being registered before Pi access;
- duplicate-source rejection and failed-install cleanup;
- version extraction without leaking credentials;
- update and repair opaque-ID resolution;
- local update rejection and broken repair behavior;
- official Pack manifest and both Skill contracts;
- API clients, validators, routes, selection, and UI action states;
- English and Chinese dictionary parity.

Browser verification uses the real official Pack and performs:

1. list available Pack;
2. install at project scope;
3. confirm both Skills appear and are Package-managed;
4. confirm version metadata;
5. remove the Pack and confirm its Skills disappear;
6. install a local Package selected outside the Workspace and remove it again.

The final gate is `npm run check`, `npm run build`, and the desktop standalone
asset preparation test. Test installations are removed from Pi Settings before
handoff.

## 10. Non-goals

This increment does not add:

- a remote catalog or marketplace;
- Package ratings, signing, or sandboxing;
- system dependency detection;
- per-resource enable/disable controls;
- install progress streaming or server-side cancellation;
- Workflow or Pipeline execution;
- active-session hot reload.
