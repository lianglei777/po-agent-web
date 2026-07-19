# Skill Pack Design

Date: 2026-07-14
Status: Proposed for implementation planning

## 1. Purpose

Po Agent will provide a small set of built-in Skills and a user-facing
Skill Pack feature without creating a second package runtime.

The feature has four explicit concepts:

- **Built-in Skill**: shipped with Po Agent, available without installation,
  and not removable by users.
- **Standalone Skill**: an Agent Skill installed through the existing
  `skills.sh` and Agent Skills CLI workflow.
- **Skill Pack**: a Pi Package presented as a cohesive, installable capability
  set by Po Agent.
- **Workflow**: a future execution and orchestration feature. It is not part of
  this design and is not implemented by Skill Packs.

Pi Package remains the source of truth for Package installation, persistence,
resource discovery, scope, version pinning, updates, and removal. Po Agent
adds only the product catalog, safe application boundary, and management UI.

## 2. Goals

- Ship useful Skills that require no manual installation.
- Let users install and remove official Skill Packs at project or global scope.
- Reuse Pi's `DefaultPackageManager` and `DefaultResourceLoader`.
- Preserve the existing standalone Skill marketplace and local import flows.
- Show which Skills belong to a Package and prevent invalid per-Skill mutations.
- Make executable Package content and installation scope visible before install.
- Keep package sources, command construction, and filesystem paths controlled by
  the server.

## 3. Non-goals

This version does not provide:

- Workflow or Pipeline execution, editing, retries, or run history.
- A public or community Pi Package marketplace.
- Installation from arbitrary user-provided npm, Git, or local Package sources.
- A new `pack.yaml`, Package lock file, or Package installer.
- System dependency detection for tools such as FFmpeg or LibreOffice.
- Package permission sandboxing, signing, ratings, reviews, or payments.
- Per-resource Package filters in the UI.
- Hot reload of resources into an already-running Agent session.
- Package update controls or update-available status in the first release.

These capabilities may be proposed separately after a real Pack demonstrates
the need.

## 4. Options Considered

### 4.1 Batch-install standalone Skills

The application could define a group as a list of existing Skill references and
call the current installer repeatedly. This requires partial-failure recovery,
custom ownership tracking, custom uninstall behavior, and another version model.
It is rejected because Pi already supplies a package boundary.

### 4.2 Pi Package-backed Skill Packs

This is the selected design. Pi owns installation and resource discovery; Po
Agent Web owns the trusted catalog and product presentation. It adds the least
new machinery and preserves the existing SDK boundary.

### 4.3 Custom Po Agent package runtime

A custom manifest, installer, lock file, dependency resolver, and runtime would
duplicate Pi and introduce two sources of truth. It is rejected.

## 5. Product Model

### 5.1 Skill Pack state

The public Skill Pack model contains:

```ts
interface SkillPackInfo {
  packId: string;
  catalogId?: string;
  name: string;
  description: string;
  source: string;
  scope: "user" | "project" | null;
  status: "available" | "installed" | "broken";
  resources: {
    skills: string[];
    extensions: string[];
    prompts: string[];
    themes: string[];
  };
  containsExtensions: boolean;
}
```

Rules:

- `packId` is an opaque server-generated identifier. It is not a package source
  and is not interpreted as a command argument.
- `available` means an official catalog entry exists but the Package is not
  configured for the effective workspace.
- `installed` means Pi has configured the Package and its declared resources
  resolve successfully.
- `broken` means the Package is configured but its installation or declared
  resources cannot be resolved.
- `installing` and `removing` are transient client states and are not part of the
  HTTP contract.
- `containsExtensions` is true when the Pack declares Extensions. Skills can
  still instruct the model to execute commands, so all installs retain a general
  security warning even when this value is false.
- `catalogId` lets the frontend select reviewed English and Chinese dictionary
  copy. Non-catalog Packages fall back to Package metadata.

### 5.2 Package identity

The Package provider derives identity using Pi's configured Package source and
scope. The browser never supplies a raw Package source for installation or
removal. Application requests use `packId`; the server resolves the trusted
source from the official catalog or the currently configured Package list.

### 5.3 Official catalog

The first release uses a repository-controlled TypeScript catalog. It contains
only the metadata needed before a Package is installed:

```ts
interface OfficialSkillPackDefinition {
  id: string;
  source: string;
  expectedSkills: string[];
  containsExtensions: boolean;
}
```

Official sources are version-pinned. The API exposes the matching `catalogId`;
user-visible names and descriptions live in both i18n dictionaries. The catalog
is not a second Package manifest: Pi's
`package.json` manifest remains authoritative for installed resources and
dependencies. `expectedSkills` is used only for pre-install disclosure and
post-install verification.

The first release does not fetch a remote catalog. Adding a Pack requires a
normal application release and review.

## 6. Architecture

The dependency flow follows the existing server architecture:

```text
src/app/api/skill-packs
        |
        v
transport validators
        |
        v
SkillPackService
        |
        v
SkillPackProvider
        |
        v
PiSkillPackProvider -> Pi DefaultPackageManager
```

### 6.1 Shared contracts

`src/contracts/skill-packs.ts` defines serializable requests and responses.
It does not expose Pi SDK types or installed filesystem paths.

### 6.2 Domain and port

`src/server/domain/skill-pack.ts` owns application inputs and re-exports public
contract types where appropriate.

`src/server/ports/skill-pack-provider.ts` defines the minimum Package capability:

```ts
interface SkillPackProvider {
  list(cwd: string): Promise<SkillPackLoadResult>;
  install(input: InstallSkillPackInput): Promise<SkillPackLoadResult>;
  remove(input: RemoveSkillPackInput): Promise<SkillPackLoadResult>;
}
```

The port exists to keep Pi Package types and filesystem behavior out of the
application layer.

### 6.3 Application service

`SkillPackService` validates the effective workspace through the existing
`WorkspaceRootProvider`, following `SkillService`. It resolves only registered
workspace roots for project-scoped operations.

The service delegates Package behavior to `SkillPackProvider`; it does not
construct `DefaultPackageManager`, read Package manifests, or run processes.

### 6.4 Infrastructure adapter

`PiSkillPackProvider` creates `SettingsManager` and `DefaultPackageManager` for
the requested `cwd` and Pi agent directory. It maps Pi Package and resource
metadata into project-owned contract types.

It uses:

- `listConfiguredPackages()` to find effective user and project Packages.
- `resolve()` to inspect resolved Package resources.
- `installAndPersist()` to install and record a trusted source.
- `removeAndPersist()` to remove the Package and persisted source.

Pi progress callbacks may be used for server logging but are not exposed as SSE
in this release.

### 6.5 Composition

The production container constructs `PiSkillPackProvider` and injects it into
`SkillPackService`. No infrastructure implementation is constructed in Route
Handlers or application code.

## 7. Built-in Skills

Built-in Skills live under:

```text
resources/builtin-skills/<skill-name>/SKILL.md
```

They use the normal Agent Skills format and are loaded by Pi; there is no second
Skill parser or executor.

### 7.1 Shared resource-loader construction

The infrastructure layer provides one helper for constructing a
`DefaultResourceLoader` with:

- the effective `cwd`;
- Pi's agent directory and `SettingsManager`;
- the resolved built-in Skills directory through `additionalSkillPaths`.

Both the Agent runtime and `PiSkillProvider.load()` use this helper. This ensures
the configuration page and Agent session observe the same resources.

### 7.2 Development and packaged paths

Development resolves built-ins from the repository `resources/builtin-skills`
directory. Electron packaging copies this directory explicitly through
`extraResources`; it does not rely on Next.js tracing Markdown files.

The desktop launcher passes the packaged built-in resource directory to the
server through `PO_AGENT_BUILTIN_SKILLS_DIR`. The server validates and resolves
that path during resource-loader construction.

### 7.3 Mutability

Built-in Skills are mapped with a dedicated source identifier and
`canModify: false`. They cannot be removed or edited from the Skills page.
Their model-invocation behavior is defined by the shipped `SKILL.md`.

## 8. Package-owned Skills

A Skill with `sourceInfo.origin === "package"` is managed by Pi PackageManager.
The UI and application must not treat it as a standalone installed Skill.

Rules:

- Do not call `skills remove <skill-name>` for a Package-owned Skill.
- Do not directly edit its installed `SKILL.md`.
- Do not show the per-Skill remove action.
- Do not show the existing model-invocation switch, because it edits frontmatter
  and can be overwritten by Package updates.
- Show the owning Package source and direct users to the Pack detail for removal.
- Removal is atomic at the Package boundary from the user's perspective.

Per-resource Package filters are deferred. They disable resource loading and do
not have the same meaning as the current model-invocation-only switch.

## 9. HTTP API

### 9.1 List

```text
GET /api/skill-packs?cwd=<registered-workspace>
```

Returns official available Packs and configured Packs visible in the effective
workspace. This runtime GET is not cached.

### 9.2 Install

```text
POST /api/skill-packs/install
```

```json
{
  "packId": "pack_7f9d2a",
  "scope": "project",
  "cwd": "C:\\workspace\\project"
}
```

The transport validates shape and allowed enum values. Every request requires a
registered `cwd` as the effective Package and resource-resolution context. The
application validates that workspace. Infrastructure resolves `packId` through
the official catalog; the body cannot select an arbitrary Package source.

### 9.3 Remove

```text
DELETE /api/skill-packs
```

```json
{
  "packId": "opaque-installed-pack-id",
  "cwd": "C:\\workspace\\project"
}
```

The provider reloads configured Packages and resolves the opaque ID before
removing the associated source and scope.

### 9.4 Contract documentation

All endpoint request, response, error-code, and side-effect behavior is added to
`docs/agent-api-reference.md` with the implementation.

## 10. Install and Remove Behavior

### 10.1 Install

1. Load the official definition by `packId`.
2. Reject unknown IDs and duplicate effective installations.
3. Install and persist through `DefaultPackageManager` at user or project scope.
4. Reload Package and Skill resources.
5. Verify the configured Package and expected Skills are present.
6. Return the refreshed Pack list.

If installation succeeds but verification fails, the provider attempts
`removeAndPersist()` for the source and scope. It returns
`SKILL_PACK_INSTALL_FAILED` and never reports a partial installation as success.
Cleanup failure is logged server-side without exposing command output or secrets.

### 10.2 Remove

1. Reload configured Packages.
2. Resolve `packId` to one effective source and scope.
3. Reject missing or ambiguous IDs.
4. Remove and persist through `DefaultPackageManager`.
5. Reload resources and verify the Package is absent.
6. Return the refreshed Pack list.

Expected errors use stable `AppError` codes:

- `SKILL_PACK_NOT_FOUND`
- `SKILL_PACK_INSTALL_BUSY`
- `SKILL_PACK_INSTALL_FAILED`
- `SKILL_PACK_REMOVE_FAILED`
- `SKILL_PACK_BROKEN`

Package operations use an in-process busy guard to prevent duplicate requests.
Pi's settings locking remains responsible for file-level coordination.

## 11. Session Semantics

Installing, removing, or changing Skill resources does not mutate an active
Agent session's ResourceLoader. Changes apply to newly created sessions.

The UI displays this explicitly after successful operations. Hot reload is
deferred because it requires defining behavior for streaming sessions,
in-flight tool calls, removed Extensions, and failed reloads.

## 12. UI Design

The existing Skills feature remains the owner. Add two top-level tabs:

```text
Skills | Skill Packs
```

### 12.1 Skills tab

Keep the current list and detail layout. Group resources as:

- Built-in
- Project
- Global
- From Skill Packs

Package-owned Skills show their owning Pack source. Their detail view is
read-only and links to the corresponding Pack detail. Built-in Skills are also
read-only. Existing standalone Project and Global Skill behavior remains
unchanged.

### 12.2 Skill Packs tab

Use a compact list and detail pane consistent with the current Skills page.
Each row shows:

- localized name and one-line description;
- number of known Skills;
- whether it contains Extensions;
- effective installation scope and status;
- one install or remove action.

The detail pane shows capabilities, Package source, version when installed,
contained resources, security warning, effective scope, and the install/remove
action. It does not show unverified environment-health claims.

Installation requires an explicit confirmation naming the scope and warning
that Skills can instruct command execution. Packs with Extensions additionally
state that installed code runs with the application's local permissions.

All new copy is added to English and Chinese dictionaries. Disabled actions use
reason-specific tooltips.

## 13. Security

- Package sources come from the server-owned official catalog or an existing
  configured Package, never directly from an install request.
- `cwd` is validated against registered workspace roots.
- `packId` is opaque and resolved server-side.
- Route Handlers do not construct processes, paths, or SDK adapters.
- Package command output, environment variables, API keys, and credentials are
  not returned in HTTP responses or stored in UI state.
- Installation is presented as side-effectful and globally disables duplicate
  install/remove actions while active.
- Extension presence receives a stronger executable-code warning.
- The feature does not claim sandboxing or granular permissions that Pi does not
  provide.

## 14. Testing

Focused tests cover:

### Domain and application

- Project operations reject unregistered workspaces.
- Global installation validates the effective `cwd` but persists to user scope.
- Inputs pass only opaque IDs and validated scopes to the provider.

### Infrastructure

- Official IDs resolve to the expected pinned Package source.
- Unknown IDs are rejected before PackageManager installation.
- Configured user/project Packs map to the correct effective scope.
- Resolved resources are grouped by Package source.
- Missing installed paths produce `broken` status.
- Installation is verified through a fresh resource resolution.
- Failed verification attempts cleanup.
- Removal resolves the configured Package rather than trusting client source.
- Concurrent mutations return a busy error.

### Existing Skill behavior

- Package-owned and built-in Skills are mapped as read-only.
- Standalone Skills preserve existing toggle and removal behavior.
- Agent runtime and Skills configuration use the same built-in resource path.

### Transport and UI

- Validators reject unknown IDs, scopes, missing `cwd`, and malformed bodies.
- Contracts serialize without Pi SDK types or filesystem paths.
- Package-owned Skills do not expose edit or remove controls.
- Confirmation copy distinguishes Skills-only and Extension-bearing Packs.
- English and Chinese dictionaries retain the same shape.

Before handoff, implementation must pass `npm run check`. Because this changes
Next.js Route Handlers, runtime resource loading, and Electron production
packaging, it must also pass `npm run build` and the relevant desktop packaging
preparation test.

## 15. Delivery Order

1. Correct ownership handling for Package-owned Skills so they cannot be edited
   or removed through the standalone Skill workflow.
2. Introduce shared Pi ResourceLoader construction and Built-in Skill loading.
3. Add Skill Pack contracts, port, service, Pi adapter, and composition.
4. Add list, install, and remove Route Handlers and API documentation.
5. Add the repository-controlled official catalog.
6. Add the Skills and Skill Packs tabs and confirmation flows.
7. Ship one real Built-in Skill and one pinned official Skill Pack as end-to-end
   validation; additional Packs are content additions, not architecture work.

System dependency detection is designed only when a selected real Pack requires
it. Workflow support remains a separate specification and implementation plan.
