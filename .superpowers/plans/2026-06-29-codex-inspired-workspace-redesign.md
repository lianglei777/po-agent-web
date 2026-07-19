# Codex-Inspired Workspace Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Po Agent as a project-centered desktop workspace inspired by Codex while preserving all current Chat, session, model, skill, and file behavior.

**Architecture:** Keep `AgentWorkspace` as the client-side composition root and add one explicit active-view state for Chat, Model Provider, and Skills. Keep Chat mounted while configuration views are visible, move file browsing into the file-panel feature, and let layout components coordinate features only through props and callbacks. No backend, HTTP-contract, SSE, or dependency changes are required.

**Tech Stack:** Next.js 16.2.1 App Router, React 19, TypeScript, Tailwind CSS 4, Radix UI, Vitest, existing source-contract tests.

---

## Constraints verified before implementation

- Read the installed Next.js guides:
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`
  - `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`
  - `node_modules/next/dist/docs/03-architecture/accessibility.md`
- Keep the interactive boundary in the existing client workspace; do not add `"use client"` above non-interactive entry points.
- Continue using Tailwind for component styles, `globals.css` only for semantic tokens and truly global desktop constraints, and the existing CSS Module for execution-process layout.
- Keep Vitest focused on pure logic and synchronous client/source contracts. Use browser verification for integrated interaction and visual behavior.
- Do not add dependencies.

## Target file structure

### Create

- `src/layouts/agent-workspace/workspace-sidebar.tsx` — global left navigation that composes the session feature.
- `src/layouts/agent-workspace/workspace-navigation.ts` — active-view type and small pure guard for Model Provider dirty navigation.
- `src/layouts/agent-workspace/workspace-navigation.test.ts` — navigation-guard regression tests.
- `src/layouts/agent-workspace/workspace-sidebar-visual.test.ts` — sidebar placement and accessibility contract.
- `src/features/models-config/components/model-provider-page.tsx` — embeddable central Model Provider page.
- `src/features/models-config/model-provider-page.test.ts` — page-shell contract.
- `src/features/skills-config/skills-page.tsx` — embeddable project Skills page.
- `src/features/skills-config/skills-page.test.ts` — page-shell contract.
- `src/features/file-panel/api.ts` — existing file list/read client calls owned by the file feature.
- `src/features/file-panel/types.ts` — `FileEntry` and `OpenFile` contracts.
- `src/features/file-panel/path.ts` — file-tree path helpers moved out of the session feature.
- `src/features/file-panel/path.test.ts` — Windows/POSIX path helper tests.
- `src/features/file-panel/file-tree.tsx` — moved directory tree and `@` mention behavior.
- `src/features/file-panel/file-tree-visual.test.ts` — file-tree interaction and no-search contract.

### Modify

- `src/layouts/agent-workspace/agent-workspace.tsx` — active view, navigation guard, mounted Chat, desktop shell, and feature composition.
- `src/layouts/agent-workspace/workspace-top-bar.tsx` — only sidebar toggle, view/session context, and file toggle.
- `src/layouts/agent-workspace/workspace-settings-placement.test.ts` — new navigation and top-bar contract.
- `src/layouts/agent-workspace/panel-sizing.ts` — desktop-only minimum width assumptions.
- `src/layouts/agent-workspace/panel-sizing.test.ts` — 1024px minimum-width cases.
- `src/features/session-sidebar/session-sidebar.tsx` — projects and nested sessions only.
- `src/features/session-sidebar/cwd-picker.tsx` — icon-triggered open-project popover.
- `src/features/session-sidebar/session-utils.ts` — group sessions by project without duplicating tree logic.
- `src/features/session-sidebar/session-utils.test.ts` — grouping and ordering tests.
- `src/features/session-sidebar/api.ts` — remove file-list ownership.
- `src/features/session-sidebar/types.ts` — remove `FileEntry` ownership.
- `src/features/file-panel/file-panel.tsx` — compose preview and right-side file tree.
- `src/features/file-panel/file-panel-visual.test.ts` — split workspace contract.
- `src/features/models-config/index.ts` — export `ModelProviderPage`.
- `src/features/chat/chat-center.tsx` — desktop-only spacing and Welcome visuals without behavior changes.
- `src/features/chat/chat-input.tsx` — approved composer visual hierarchy only.
- `src/features/chat/chat-input-visual.test.ts` — preserve all controls and new visual contract.
- `src/features/chat/message-view.tsx` — approved user/assistant message treatment only.
- `src/features/chat/message-view.module.css` — execution-process visual tuning while retaining stable columns.
- `src/features/chat/message-view-visual.test.ts` — preserve presentation behavior.
- `src/features/chat/minimap/chat-minimap.tsx` — visual tokens and localized label.
- `src/app/globals.css` — 1024px desktop floor and approved semantic token usage.
- `src/i18n/dictionaries/en.ts` — English navigation and tooltip copy.
- `src/i18n/dictionaries/zh.ts` — matching Chinese copy.
- `src/i18n/i18n.test.ts` — dictionary parity and exact navigation labels.
- `PRODUCT.md` — desktop project-centered product scope.
- `DESIGN.md` — accepted optional-file-workspace and theme rules.

### Delete after callers migrate

- `src/features/session-sidebar/file-explorer.tsx`
- `src/features/session-sidebar/session-panel-layout.ts`
- `src/features/session-sidebar/session-panel-layout.test.ts`
- `src/features/models-config/components/modal-overlay.tsx`
- `src/features/models-config/components/models-config-dialog.tsx`
- `src/features/skills-config/skills-config-dialog.tsx`

Do not delete nested credential, OAuth, model removal, provider removal, session deletion, or dirty-discard Dialogs.

---

### Task 1: Project grouping and localized navigation contracts

**Files:**
- Modify: `src/features/session-sidebar/session-utils.ts`
- Modify: `src/features/session-sidebar/session-utils.test.ts`
- Modify: `src/i18n/dictionaries/en.ts`
- Modify: `src/i18n/dictionaries/zh.ts`
- Modify: `src/i18n/i18n.test.ts`

- [ ] **Step 1: Write failing project-group tests**

Add this case to `session-utils.test.ts` using the existing `SessionInfo` fixture shape:

```ts
it("groups recent projects and builds each session tree once", () => {
  const sessions = [
    session({ id: "a", cwd: "C:\\work\\alpha", modified: "2026-06-29T03:00:00.000Z" }),
    session({ id: "b", cwd: "C:\\work\\beta", modified: "2026-06-29T02:00:00.000Z" }),
    session({
      id: "a-child",
      cwd: "C:\\work\\alpha",
      modified: "2026-06-29T01:00:00.000Z",
      parentSessionId: "a",
    }),
  ];

  expect(groupSessionsByCwd(sessions)).toEqual([
    {
      cwd: "C:\\work\\alpha",
      nodes: [expect.objectContaining({
        session: expect.objectContaining({ id: "a" }),
        children: [expect.objectContaining({
          session: expect.objectContaining({ id: "a-child" }),
        })],
      })],
    },
    {
      cwd: "C:\\work\\beta",
      nodes: [expect.objectContaining({
        session: expect.objectContaining({ id: "b" }),
      })],
    },
  ]);
});

it("uses the final path segment as the project name", () => {
  expect(getProjectName("C:\\work\\po-agent-web")).toBe("po-agent-web");
  expect(getProjectName("/work/po-agent-web/")).toBe("po-agent-web");
});

it("does not cap the project sidebar to the five-item picker history", () => {
  const sessions = Array.from({ length: 6 }, (_, index) =>
    session({
      id: `session-${index}`,
      cwd: `C:\\work\\project-${index}`,
      modified: `2026-06-29T0${index}:00:00.000Z`,
    }),
  );

  expect(groupSessionsByCwd(sessions)).toHaveLength(6);
});
```

Import `getProjectName` and `groupSessionsByCwd` beside the existing utilities.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npx vitest run src/features/session-sidebar/session-utils.test.ts
```

Expected: FAIL because `groupSessionsByCwd` is not exported.

- [ ] **Step 3: Implement the minimal grouping helper**

Replace the current `getRecentCwds` implementation with the shared ordering helper below, then add project grouping and project-name extraction:

```ts
function getProjectCwds(sessions: SessionInfo[]) {
  const latestByCwd = new Map<string, string>();
  for (const session of sessions) {
    if (!session.cwd) continue;
    const previous = latestByCwd.get(session.cwd);
    if (!previous || session.modified > previous) {
      latestByCwd.set(session.cwd, session.modified);
    }
  }
  return [...latestByCwd]
    .sort((left, right) => right[1].localeCompare(left[1]))
    .map(([cwd]) => cwd);
}

export function getRecentCwds(sessions: SessionInfo[]) {
  return getProjectCwds(sessions).slice(0, 5);
}

export function groupSessionsByCwd(sessions: SessionInfo[]) {
  return getProjectCwds(sessions).map((cwd) => ({
    cwd,
    nodes: buildSessionTree(
      sessions.filter((session) => session.cwd === cwd),
    ),
  }));
}

export function getProjectName(cwd: string) {
  const segments = cwd.split(/[\\/]+/).filter(Boolean);
  return segments[segments.length - 1] ?? cwd;
}
```

Do not create a second tree builder or project model.

- [ ] **Step 4: Add exact bilingual navigation keys**

Extend `workspace` in both dictionaries with matching keys:

```ts
// en.ts
newChat: "New chat",
modelProvider: "Model Provider",
projects: "Projects",
openProject: "Open project",
selectProjectForSkills: "Select a project before opening Skills",
conversationMinimap: "Conversation minimap",

// zh.ts
newChat: "新对话",
modelProvider: "模型供应商",
projects: "项目",
openProject: "打开项目",
selectProjectForSkills: "请先选择项目，再打开技能",
conversationMinimap: "对话导航",
```

Keep the existing `workspace.skills` value (`Skills` / `技能`). Remove obsolete close-only top-level model/skill strings only after Task 6 removes every caller.

- [ ] **Step 5: Lock label parity in `i18n.test.ts`**

Add:

```ts
it("uses the approved workspace navigation labels", () => {
  expect(en.workspace.modelProvider).toBe("Model Provider");
  expect(zh.workspace.modelProvider).toBe("模型供应商");
  expect(en.workspace.skills).toBe("Skills");
  expect(zh.workspace.skills).toBe("技能");
});
```

- [ ] **Step 6: Run focused tests and verify GREEN**

Run:

```powershell
npx vitest run src/features/session-sidebar/session-utils.test.ts src/i18n/i18n.test.ts
```

Expected: both files PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/features/session-sidebar/session-utils.ts src/features/session-sidebar/session-utils.test.ts src/i18n/dictionaries/en.ts src/i18n/dictionaries/zh.ts src/i18n/i18n.test.ts
git commit -m "feat: add project navigation contracts"
```

---

### Task 2: Desktop workspace sidebar and project/session navigation

**Files:**
- Create: `src/layouts/agent-workspace/workspace-sidebar.tsx`
- Create: `src/layouts/agent-workspace/workspace-navigation.ts`
- Create: `src/layouts/agent-workspace/workspace-sidebar-visual.test.ts`
- Modify: `src/features/session-sidebar/session-sidebar.tsx`
- Modify: `src/features/session-sidebar/cwd-picker.tsx`
- Delete: `src/features/session-sidebar/session-panel-layout.ts`
- Delete: `src/features/session-sidebar/session-panel-layout.test.ts`

- [ ] **Step 1: Write the failing sidebar source contract**

Create `workspace-sidebar-visual.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./workspace-sidebar.tsx", import.meta.url)),
  "utf8",
);

describe("workspace sidebar", () => {
  it("orders global actions before project sessions", () => {
    expect(source.indexOf("t.workspace.newChat")).toBeLessThan(
      source.indexOf("t.workspace.modelProvider"),
    );
    expect(source.indexOf("t.workspace.modelProvider")).toBeLessThan(
      source.indexOf("t.workspace.skills"),
    );
    expect(source.indexOf("t.workspace.skills")).toBeLessThan(
      source.indexOf("<SessionSidebar"),
    );
  });

  it("keeps theme and locale as bottom icon controls", () => {
    expect(source).toContain("mt-auto");
    expect(source).toContain("onToggleTheme");
    expect(source).toContain("setLocale(nextLocale)");
    expect(source).toContain("<TooltipContent");
  });

  it("explains why Skills is disabled", () => {
    expect(source).toContain("disabled={!selectedCwd}");
    expect(source).toContain("t.workspace.selectProjectForSkills");
    expect(source).toContain('className="inline-flex"');
  });
});
```

- [ ] **Step 2: Run the contract and verify RED**

Run:

```powershell
npx vitest run src/layouts/agent-workspace/workspace-sidebar-visual.test.ts
```

Expected: FAIL because `workspace-sidebar.tsx` does not exist.

- [ ] **Step 3: Create the layout-owned sidebar shell**

Create `workspace-sidebar.tsx` with this public contract and structure:

```tsx
import { Cpu, MessageSquarePlus, Moon, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SessionSidebar } from "@/features/session-sidebar/session-sidebar";
import type { SessionInfo } from "@/features/session-sidebar/types";
import { useI18n } from "@/i18n/use-i18n";
import type { WorkspaceView } from "./workspace-navigation";

export type WorkspaceSidebarProps = {
  activeView: WorkspaceView;
  dark: boolean;
  selectedCwd: string | null;
  selectedSessionId: string | null;
  onNewChat: () => void;
  onOpenModelProvider: () => void;
  onOpenSkills: () => void;
  onToggleTheme: () => void;
  sessionProps: {
    initialSessionId?: string | null;
    refreshKey: number;
    draftSession?: { id: string; cwd: string; created: string } | null;
    onSelectSession: (session: SessionInfo, isRestore?: boolean) => void;
    onNewSession: (temporaryId: string, cwd: string) => void;
    onSessionDeleted: (session: SessionInfo) => void;
    onCwdChange: (cwd: string) => void;
    onInitialRestoreDone: () => void;
  };
};
```

Create `workspace-navigation.ts` initially with the shared type:

```ts
export type WorkspaceView = "chat" | "model-provider" | "skills";
```

Render the three top buttons in the approved order, then `<SessionSidebar>`, then a `mt-auto` bottom row with theme and locale Icon Buttons. Use the existing Button and Tooltip primitives. The disabled Skills trigger must be wrapped in `className="inline-flex"` so Hover still reaches its Tooltip.

- [ ] **Step 4: Refactor `SessionSidebar` to projects and sessions only**

Make these exact structural changes:

```tsx
const navigableSessions = useMemo(() => {
  if (!draftSession) return sessions;
  return [
    ...sessions,
    createDraftSession({
      temporaryId: draftSession.id,
      cwd: draftSession.cwd,
      label: t.sessions.draft,
      now: draftSession.created,
    }),
  ];
}, [draftSession, sessions, t.sessions.draft]);

const projectGroups = useMemo(
  () => groupSessionsByCwd(navigableSessions),
  [navigableSessions],
);

const displayedGroups = useMemo(() => {
  if (!selectedCwd || projectGroups.some((group) => group.cwd === selectedCwd)) {
    return projectGroups;
  }
  return [{ cwd: selectedCwd, nodes: [] }, ...projectGroups];
}, [projectGroups, selectedCwd]);
```

Render one collapsible project row per group and render `SessionTree` below expanded projects. Default the selected project to expanded and keep other projects independently collapsible. Do not mutate the session array.

Remove all `FileExplorer`, vertical `ResizeHandle`, `sessionPanelHeight`, and `ResizeObserver` code. Keep loading, restore-from-URL, default-cwd fallback, refresh feedback, rename, delete, Draft, and session fork trees.

- [ ] **Step 5: Convert `CwdPicker` to the project-header Icon Button**

Keep its existing popover behavior and default/custom-path operations, but replace the full-width cwd button with:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      aria-expanded={open}
      aria-label={t.workspace.openProject}
      onClick={() => setOpen((current) => !current)}
      size="icon-sm"
      type="button"
      variant="ghost"
    >
      <Plus />
    </Button>
  </TooltipTrigger>
  <TooltipContent>{t.workspace.openProject}</TooltipContent>
</Tooltip>
```

Anchor the existing popover to the projects header. Do not add project search. Recent projects are the visible project list; the popover keeps default directory and custom absolute path.

- [ ] **Step 6: Delete obsolete vertical split helpers**

Delete `session-panel-layout.ts` and its test after `SessionSidebar` no longer imports them. Do not leave dead exports or comments.

- [ ] **Step 7: Run focused tests**

Run:

```powershell
npx vitest run src/layouts/agent-workspace/workspace-sidebar-visual.test.ts src/features/session-sidebar/session-utils.test.ts src/features/session-sidebar/session-tree-visual.test.ts src/features/session-sidebar/session-draft.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/layouts/agent-workspace/workspace-sidebar.tsx src/layouts/agent-workspace/workspace-sidebar-visual.test.ts src/layouts/agent-workspace/workspace-navigation.ts src/features/session-sidebar/session-sidebar.tsx src/features/session-sidebar/cwd-picker.tsx src/features/session-sidebar/session-panel-layout.ts src/features/session-sidebar/session-panel-layout.test.ts
git commit -m "feat: add project-centered workspace sidebar"
```

---

### Task 3: Embeddable Model Provider page

**Files:**
- Create: `src/features/models-config/components/model-provider-page.tsx`
- Create: `src/features/models-config/model-provider-page.test.ts`
- Modify: `src/features/models-config/index.ts`

- [ ] **Step 1: Write the failing page-shell contract**

Create `model-provider-page.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(
    new URL("./components/model-provider-page.tsx", import.meta.url),
  ),
  "utf8",
);

describe("Model Provider page", () => {
  it("reuses model configuration behavior without a top-level modal", () => {
    expect(source).toContain("useModelsConfig");
    expect(source).toContain("ModelsConfigSidebar");
    expect(source).toContain("onDirtyChange");
    expect(source).not.toContain("ModalOverlay");
    expect(source).not.toContain("<Dialog open");
  });

  it("keeps save feedback and nested detail components", () => {
    expect(source).toContain("modelConfig.save");
    expect(source).toContain("ProviderDetail");
    expect(source).toContain("ModelDetail");
    expect(source).toContain("OAuthDetail");
    expect(source).toContain("ApiKeyDetail");
  });
});
```

- [ ] **Step 2: Run the contract and verify RED**

```powershell
npx vitest run src/features/models-config/model-provider-page.test.ts
```

Expected: FAIL because the page file does not exist.

- [ ] **Step 3: Extract the page from the current dialog**

Create this public component contract:

```tsx
export function ModelProviderPage({
  onDirtyChange,
  onSaved,
}: {
  onDirtyChange: (dirty: boolean) => void;
  onSaved?: () => void;
}) {
  const modelConfig = useModelsConfig(onSaved);
  const { t } = useI18n();

  useEffect(() => {
    onDirtyChange(modelConfig.dirty);
    return () => onDirtyChange(false);
  }, [modelConfig.dirty, onDirtyChange]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      {modelConfig.loading ? (
        <div className="grid min-h-0 flex-1 place-items-center text-sm text-dim">
          {t.common.loading}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <ModelsConfigSidebar
            apiKeyProviders={modelConfig.apiKeyProviders}
            config={modelConfig.config}
            onAddModel={modelConfig.addModel}
            onAddProvider={modelConfig.addCustomProvider}
            onSelect={modelConfig.setSelection}
            selection={modelConfig.selection}
          />
          <main className="min-w-0 flex-1 overflow-y-auto p-5">
            {modelConfig.loadError ? (
              <p className="text-[13px] text-destructive">
                {modelConfig.loadError}
              </p>
            ) : (
              <ModelsConfigDetail modelConfig={modelConfig} />
            )}
          </main>
        </div>
      )}
      <footer className="flex min-h-12 items-center justify-end gap-2 border-t border-line-strong px-[18px]">
        {modelConfig.saveError ? (
          <span className="mr-auto text-xs text-destructive">
            {modelConfig.saveError}
          </span>
        ) : null}
        <Button
          disabled={modelConfig.loading || Boolean(modelConfig.loadError) || modelConfig.saving || modelConfig.savedOk}
          onClick={modelConfig.save}
          size="sm"
          type="button"
        >
          {modelConfig.savedOk
            ? t.common.saved
            : modelConfig.saving
              ? t.common.saving
              : t.common.save}
        </Button>
      </footer>
    </div>
  );
}
```

Move `ModelsConfigDetail` and `EmptySelection` into the new file unchanged. Keep every nested destructive/credential Dialog inside existing detail components.

- [ ] **Step 4: Export the page without changing the current caller**

Export `ModelProviderPage` from `index.ts`. Leave `ModelsConfigDialog` unchanged until Task 6 switches `AgentWorkspace`; this keeps every intermediate commit compiling and preserves the current dialog while the page is not yet reachable.

- [ ] **Step 5: Run focused model tests**

```powershell
npx vitest run src/features/models-config/model-provider-page.test.ts src/features/models-config/dialog-safety.test.ts src/features/models-config/api/models-config-api.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/models-config/components/model-provider-page.tsx src/features/models-config/model-provider-page.test.ts src/features/models-config/index.ts
git commit -m "feat: add central model provider page"
```

---

### Task 4: Embeddable project Skills page

**Files:**
- Create: `src/features/skills-config/skills-page.tsx`
- Create: `src/features/skills-config/skills-page.test.ts`

- [ ] **Step 1: Write the failing page-shell contract**

Create `skills-page.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./skills-page.tsx", import.meta.url)),
  "utf8",
);

describe("Skills page", () => {
  it("reuses project skill behavior without a top-level Dialog", () => {
    expect(source).toContain("useSkillsConfig(cwd)");
    expect(source).toContain("SkillList");
    expect(source).toContain("SkillDetail");
    expect(source).toContain("AddSkillPanel");
    expect(source).not.toContain("<Dialog open");
    expect(source).not.toContain("onClose");
  });
});
```

- [ ] **Step 2: Run the contract and verify RED**

```powershell
npx vitest run src/features/skills-config/skills-page.test.ts
```

Expected: FAIL because `skills-page.tsx` does not exist.

- [ ] **Step 3: Extract the central page**

Copy `skills-config-dialog.tsx` to `skills-page.tsx`, rename the exported component to the following signature, and remove `onClose`:

```tsx
export function SkillsPage({ cwd }: { cwd: string }) {
```

Apply these mechanical edits to the copied JSX:

1. Remove the outer `<Dialog open>` and its `<DialogContent>` wrapper, then wrap the two-pane content with `<div className="flex min-h-0 flex-1 bg-canvas">`.
2. Delete the header containing `DialogTitle`, `DialogDescription`, and the close Button.
3. Move the existing refresh Button beside the existing Add Skill Button in the left pane.
4. Keep the existing loading/list/empty/diagnostics branches as the children of the left `<aside>`.
5. Keep the existing error/add/detail/empty branches as the children of the right `<main>`.
6. Replace the two closing Dialog tags with the single closing `</div>`.
7. Remove only the unused Dialog imports and `X`; keep `AlertTriangle`, `LoaderCircle`, `Plus`, and `RefreshCw`.

The resulting page must still contain the exact calls `skills.refresh()`, `skills.toggleModelInvocation()`, `skills.setSelectedSkillId(skillId)`, and `<AddSkillPanel cwd={cwd}>`. Do not alter installation, diagnostics, busy, retry, or model-invocation branches.

- [ ] **Step 4: Leave the current dialog caller intact**

Do not change `SkillsConfigDialog` yet. Task 6 will switch the only production caller to `SkillsPage` and then delete the old top-level dialog file.

- [ ] **Step 5: Run focused skills tests**

```powershell
npx vitest run src/features/skills-config/skills-page.test.ts src/features/skills-config/skill-ui.test.ts src/features/skills-config/skill-state.test.ts src/features/skills-config/api.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/skills-config/skills-page.tsx src/features/skills-config/skills-page.test.ts
git commit -m "feat: add central skills page"
```

---

### Task 5: File Workspace owns file tree and preview

**Files:**
- Create: `src/features/file-panel/api.ts`
- Create: `src/features/file-panel/types.ts`
- Create: `src/features/file-panel/path.ts`
- Create: `src/features/file-panel/path.test.ts`
- Create: `src/features/file-panel/file-tree.tsx`
- Create: `src/features/file-panel/file-tree-visual.test.ts`
- Modify: `src/features/file-panel/file-panel.tsx`
- Modify: `src/features/file-panel/file-panel-visual.test.ts`
- Modify: `src/features/session-sidebar/api.ts`
- Modify: `src/features/session-sidebar/types.ts`
- Delete: `src/features/session-sidebar/file-explorer.tsx`

- [ ] **Step 1: Write failing file-workspace contracts**

Create `file-tree-visual.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./file-tree.tsx", import.meta.url)),
  "utf8",
);

describe("file tree", () => {
  it("keeps existing file operations without adding search", () => {
    expect(source).toContain("loadDirectory");
    expect(source).toContain("onOpenFile");
    expect(source).toContain("onAtMention");
    expect(source).toContain("t.files.refreshFiles");
    expect(source).not.toContain("<Input");
    expect(source).not.toContain("placeholder=");
  });
});
```

Update `file-panel-visual.test.ts` to require `FileTree`, `file`, `cwd`, `PanelRightClose`, preview-left/tree-right layout, and to reject tabs, editor controls, and search input.

- [ ] **Step 2: Run and verify RED**

```powershell
npx vitest run src/features/file-panel/file-tree-visual.test.ts src/features/file-panel/file-panel-visual.test.ts
```

Expected: FAIL because file ownership has not moved.

- [ ] **Step 3: Move file client contracts into the file feature**

Create `types.ts`:

```ts
export type FileEntry = {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modified: string;
};

export type OpenFile = {
  name: string;
  path: string;
};
```

Create `api.ts` with the existing request helper and these exports:

```ts
export function loadDirectory(path: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ path, type: "list" });
  return requestJson<FileEntry[]>(`/api/files/_?${params}`, { signal });
}

export function loadFile(path: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ path, type: "read" });
  return requestJson<{ content?: string }>(`/api/files/_?${params}`, { signal });
}
```

Move `loadDirectory` out of `session-sidebar/api.ts` and `FileEntry` out of `session-sidebar/types.ts`.

Move `joinPath` and `relativePath` unchanged from `session-utils.ts` to `file-panel/path.ts`. Move their existing Windows/POSIX assertions from `session-utils.test.ts` to `file-panel/path.test.ts`; do not leave file helpers owned by the session feature.

- [ ] **Step 4: Move the tree implementation**

Create `file-tree.tsx` from the existing `FileExplorer` behavior with this prop contract:

```tsx
export type FileTreeProps = {
  cwd: string;
  onAtMention?: (path: string) => void;
  onOpenFile: (path: string, name: string) => void;
  refreshKey?: number;
};
```

Move the existing `roots`, `expanded`, `children`, `loading`, and `error` state declarations; `load`; both refresh effects; `toggleDirectory`; and `FileNodes` into this file without changing their branches. Remove only the old collapsible Explorer section header and `open/onOpenChange` props. Add one fixed header containing the existing Refresh Button above the tree. The returned component must retain `load(cwd)`, `toggleDirectory(path)`, `onOpenFile(path, entry.name)`, and `onAtMention(relativePath(cwd, path))` exactly once.

- [ ] **Step 5: Compose preview-left and tree-right**

Change `FilePanel` to accept:

```ts
{
  cwd: string;
  file: OpenFile | null;
  onAtMention?: (path: string) => void;
  onClose: () => void;
  onOpenFile: (path: string, name: string) => void;
  refreshKey?: number;
}
```

Render the preview as `min-w-0 flex-1`, then `<FileTree>` in a fixed `w-[210px] shrink-0 border-l`. Replace the inline fetch with `loadFile(file.path, controller.signal)`. Keep the existing loading, error, empty, and plain read-only `<pre>` states.

- [ ] **Step 6: Delete old file explorer and run tests**

Delete `session-sidebar/file-explorer.tsx`, then run:

```powershell
npx vitest run src/features/file-panel/path.test.ts src/features/file-panel/file-tree-visual.test.ts src/features/file-panel/file-panel-visual.test.ts src/features/session-sidebar/session-utils.test.ts
```

Expected: PASS and no import references to `session-sidebar/file-explorer`.

- [ ] **Step 7: Commit**

```powershell
git add src/features/file-panel src/features/session-sidebar/api.ts src/features/session-sidebar/types.ts src/features/session-sidebar/file-explorer.tsx
git commit -m "feat: move file browsing into file workspace"
```

---

### Task 6: Integrate central views, mounted Chat, and dirty-navigation guard

**Files:**
- Modify: `src/layouts/agent-workspace/workspace-navigation.ts`
- Create: `src/layouts/agent-workspace/workspace-navigation.test.ts`
- Modify: `src/layouts/agent-workspace/agent-workspace.tsx`
- Modify: `src/layouts/agent-workspace/workspace-top-bar.tsx`
- Modify: `src/layouts/agent-workspace/workspace-settings-placement.test.ts`
- Modify: `src/features/models-config/index.ts`
- Delete: `src/features/models-config/components/models-config-dialog.tsx`
- Delete: `src/features/skills-config/skills-config-dialog.tsx`
- Delete: `src/features/models-config/components/modal-overlay.tsx`

- [ ] **Step 1: Write failing navigation-guard tests**

Create `workspace-navigation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { shouldConfirmWorkspaceNavigation } from "./workspace-navigation";

describe("workspace navigation guard", () => {
  it("guards only dirty Model Provider navigation", () => {
    expect(shouldConfirmWorkspaceNavigation("model-provider", true)).toBe(true);
    expect(shouldConfirmWorkspaceNavigation("model-provider", false)).toBe(false);
    expect(shouldConfirmWorkspaceNavigation("chat", true)).toBe(false);
    expect(shouldConfirmWorkspaceNavigation("skills", true)).toBe(false);
  });
});
```

- [ ] **Step 2: Run and verify RED**

```powershell
npx vitest run src/layouts/agent-workspace/workspace-navigation.test.ts
```

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Add the minimal guard helper**

Extend the existing file created in Task 2:

```ts
export function shouldConfirmWorkspaceNavigation(
  activeView: WorkspaceView,
  modelProviderDirty: boolean,
) {
  return activeView === "model-provider" && modelProviderDirty;
}
```

- [ ] **Step 4: Replace modal-open state with active-view state**

In `AgentWorkspace`, replace `modelsOpen` and `skillsOpen` with:

```ts
const [activeView, setActiveView] = useState<WorkspaceView>("chat");
const [modelProviderDirty, setModelProviderDirty] = useState(false);
const [confirmingDiscard, setConfirmingDiscard] = useState(false);
const pendingNavigationRef = useRef<(() => void) | null>(null);

const requestNavigation = useCallback((action: () => void) => {
  if (shouldConfirmWorkspaceNavigation(activeView, modelProviderDirty)) {
    pendingNavigationRef.current = action;
    setConfirmingDiscard(true);
    return;
  }
  action();
}, [activeView, modelProviderDirty]);
```

Wrap new-chat, project, session, Model Provider, and Skills navigation actions with `requestNavigation`. On confirmed discard, close the confirmation, clear dirty state, run `pendingNavigationRef.current`, then clear the ref. Keep the safe “continue editing” action focused by default.

- [ ] **Step 5: Keep Chat mounted and switch only visibility**

Render the central area in this shape:

```tsx
<section className="relative flex min-w-0 flex-1 flex-col bg-canvas">
  <WorkspaceTopBar
    activeView={activeView}
    filePanelOpen={filePanelOpen}
    onToggleFilePanel={() => setFilePanelOpen((open) => !open)}
    onToggleSidebar={() => setSidebarOpen((open) => !open)}
    projectName={activeCwd ? getProjectName(activeCwd) : null}
    sessionTitle={selectedSession ? getSessionTitle(selectedSession) : null}
    sidebarOpen={sidebarOpen}
  />
  <div className={activeView === "chat" ? "flex min-h-0 flex-1" : "hidden"}>
    <ChatCenter
      key={chatInstanceKey}
      modelsRevision={modelsRevision}
      newSessionCwd={newSessionCwd}
      onAgentEnd={handleAgentEnd}
      onSessionCreated={handleSessionCreated}
      onSessionForked={handleSessionForked}
      session={selectedSession}
    />
  </div>
  {activeView === "model-provider" ? (
    <ModelProviderPage
      onDirtyChange={setModelProviderDirty}
      onSaved={() => setModelsRevision((current) => current + 1)}
    />
  ) : null}
  {activeView === "skills" && activeCwd ? <SkillsPage cwd={activeCwd} /> : null}
</section>
```

The Chat wrapper must use `hidden`, not conditional rendering. Keep `ChatCenter` mounted across configuration views. A session change may still intentionally change `chatInstanceKey` exactly as it does today.

Delete the now-unused `topPanel`, branch-tree, active-leaf, system-prompt, session-stats, and context-usage state from `AgentWorkspace`; their only visible top-bar consumer is being removed. Omit the corresponding optional ChatCenter callback props rather than replacing them with no-op callbacks.

- [ ] **Step 6: Compose the approved left and right regions**

Replace the direct `SessionSidebar` render with `WorkspaceSidebar`. Remove mobile backdrop/slide-over classes. Set the workspace root to `min-w-[1024px]`.

Render the file ResizeHandle and FilePanel only when `activeView === "chat" && filePanelOpen`; do not mutate `filePanelOpen`, `openFile`, or stored width when entering a configuration page.

- [ ] **Step 7: Reduce `WorkspaceTopBar` to approved context**

Its props become:

```ts
type WorkspaceTopBarProps = {
  activeView: WorkspaceView;
  filePanelOpen: boolean;
  onToggleFilePanel: () => void;
  onToggleSidebar: () => void;
  projectName: string | null;
  sessionTitle: string | null;
  sidebarOpen: boolean;
};
```

Render only the sidebar Icon Button, localized view/session title, project name, and file-panel Icon Button for Chat. Remove model, skills, theme, locale, branches, system, and dormant top-panel props from this component.

- [ ] **Step 8: Remove top-level config dialogs and obsolete overlay**

After `AgentWorkspace` uses the page components, remove `ModelsConfigDialog`, `SkillsConfigDialog`, and `ModalOverlay` callers/exports. Delete `modal-overlay.tsx`. Keep nested detail Dialogs and the new workspace dirty-discard Dialog.

- [ ] **Step 9: Update and run workspace contracts**

Rewrite `workspace-settings-placement.test.ts` to assert:

```ts
expect(sidebarSource).toContain("t.workspace.modelProvider");
expect(sidebarSource).toContain("t.workspace.skills");
expect(topBarSource).not.toContain("Cpu");
expect(topBarSource).not.toContain("Sparkles");
expect(topBarSource).not.toContain("Moon");
expect(workspaceSource).toContain('activeView === "chat" ? "flex min-h-0 flex-1" : "hidden"');
expect(workspaceSource).toContain('activeView === "model-provider"');
expect(workspaceSource).toContain('activeView === "skills"');
expect(workspaceSource).toContain('min-w-[1024px]');
```

Run:

```powershell
npx vitest run src/layouts/agent-workspace/workspace-navigation.test.ts src/layouts/agent-workspace/workspace-sidebar-visual.test.ts src/layouts/agent-workspace/workspace-settings-placement.test.ts src/layouts/agent-workspace/panel-sizing.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit**

```powershell
git add src/layouts/agent-workspace src/features/models-config src/features/skills-config
git commit -m "feat: integrate desktop workspace views"
```

---

### Task 7: Approved Chat visuals, theme usage, and desktop-only layout

**Files:**
- Modify: `src/features/chat/chat-center.tsx`
- Modify: `src/features/chat/chat-input.tsx`
- Modify: `src/features/chat/chat-input-visual.test.ts`
- Modify: `src/features/chat/message-view.tsx`
- Modify: `src/features/chat/message-view.module.css`
- Modify: `src/features/chat/message-view-visual.test.ts`
- Modify: `src/features/chat/minimap/chat-minimap.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/layouts/agent-workspace/panel-sizing.ts`
- Modify: `src/layouts/agent-workspace/panel-sizing.test.ts`

- [ ] **Step 1: Tighten failing visual contracts before styling**

Add assertions that preserve behavior while defining the approved presentation:

```ts
// chat-input-visual.test.ts
expect(source).toContain("focus-within:border-ring");
expect(source).toContain("border-t border-line-subtle bg-subtle");
expect(source).toContain("t.chat.input.queue");
expect(source).toContain("t.chat.input.steer");
expect(source).toContain("t.chat.input.stopAgent");
expect(source).toContain("t.chat.input.compact");
expect(source).not.toContain("backdrop-blur");

// message-view-visual.test.ts
expect(source).toContain("buildMessagePresentation");
expect(source).toContain("<AssistantTurnView");
expect(source).toContain("styles.stepStatus");
expect(styles).toContain("grid-template-columns: 14px minmax(0, 1fr) 56px 14px;");
expect(source).not.toContain("aggregateUsage");
expect(source).not.toContain("StreamingSpeed");
```

Add a source assertion that `ChatMinimap` uses `t.workspace.conversationMinimap`, not hard-coded English.

- [ ] **Step 2: Run visual contracts and verify failures are limited to new expectations**

```powershell
npx vitest run src/features/chat/chat-input-visual.test.ts src/features/chat/message-view-visual.test.ts src/features/chat/minimap/minimap-logic.test.ts
```

Expected: new localization/visual assertions FAIL; all existing behavior assertions remain PASS.

- [ ] **Step 3: Apply the approved Chat hierarchy without changing controller code**

In `chat-center.tsx`:

- Keep `useChatController`, drop handling, message refs, minimap entries, composer measurement, MessageList props, and ChatInput props unchanged.
- Keep `max-w-[820px]` readable content width.
- Remove `max-[640px]` and `max-[560px]` branches from Welcome.
- Keep four Starter Prompts and `controller.setDraft(prompt)` behavior.
- Use quiet `bg-panel`/`bg-canvas` separation and approved desktop spacing.

In `message-view.tsx` and its CSS Module:

- Keep user messages right-aligned with `var(--user-bg)`.
- Keep assistant final content unboxed.
- Preserve the single ExecutionProcess accordion and stable four-column step grid.
- Change only tokens, padding, radii, and hover/focus treatment.

In `chat-input.tsx`:

- Keep the existing textarea, image queue, model selector, Queue/Steer/Stop/Send branches, Thinking/Tools/Compact row, notices, and errors.
- Apply the approved two-row visual hierarchy with `rounded-lg`, `border-line-strong`, `bg-elevated`, no wide decorative shadow, and unchanged focus ring.

- [ ] **Step 4: Localize and visually tune Minimap**

Add `const { t } = useI18n();` and change:

```tsx
aria-label={t.workspace.conversationMinimap}
```

Keep all geometry, pointer capture, tooltip windowing, scroll mapping, and node visibility logic unchanged. Only replace hard-coded colors with semantic tokens and keep the existing 36px rail width.

- [ ] **Step 5: Enforce the desktop floor globally**

In `globals.css`:

```css
html,
body {
  min-width: 1024px;
}

body {
  overflow-x: auto;
  overflow-y: hidden;
}
```

Keep `prefers-reduced-motion`. Remove only obsolete mobile-specific component classes; do not add mobile replacements.

Replace the obsolete 700px narrow-layout case with this desktop-floor assertion:

```ts
it("fits both panels at the 1024px desktop floor", () => {
  expect(
    fitPanelWidths(
      1024,
      { filePanel: 480, sidebar: 260 },
      { filePanelOpen: true, sidebarOpen: true },
    ),
  ).toEqual({ filePanel: 402, sidebar: 260 });
});
```

Keep the existing usable-chat-width and file-panel maximum-60-percent tests.

- [ ] **Step 6: Run all Chat and layout tests**

```powershell
npx vitest run src/features/chat src/layouts/agent-workspace src/features/file-panel src/features/session-sidebar
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/features/chat src/app/globals.css src/layouts/agent-workspace/panel-sizing.ts src/layouts/agent-workspace/panel-sizing.test.ts
git commit -m "style: align chat with desktop workspace"
```

---

### Task 8: Product docs, full verification, and browser acceptance

**Files:**
- Modify: `PRODUCT.md`
- Modify: `DESIGN.md`
- Verify: all files changed in Tasks 1–7

- [ ] **Step 1: Update product and design sources of truth**

Change `PRODUCT.md` so the product is explicitly a desktop Web workspace with project-centered navigation and an optional file workspace. Remove statements that require a permanently visible dense three-panel workspace.

Change `DESIGN.md` to record:

```md
- Left navigation owns New chat, Model Provider, Skills, projects, sessions, theme, and locale.
- The central workspace switches views while Chat remains mounted.
- The right File Workspace is user-opened, resizable, and hidden on configuration views without losing state.
- The minimum supported viewport width is 1024px; there is no mobile-specific layout.
- Keep the existing light/dark semantic palette and use accent only for focus, selection, primary action, and live state.
```

Do not update `docs/agent-api-reference.md`; no public endpoint changes are planned.

- [ ] **Step 2: Run the full repository check**

```powershell
npm run check
```

Expected: ESLint, TypeScript, and every Vitest test PASS.

- [ ] **Step 3: Run the production build**

```powershell
npm run build
```

Expected: Next.js 16.2.1 production build completes successfully with no type, CSS-order, hydration, or route errors.

- [ ] **Step 4: Browser-verify the accepted matrix**

Run the app and inspect 1024px, 1440px, and 1920px widths in both themes and both locales. Verify:

```text
Navigation: New chat -> Model Provider -> Skills -> projects/sessions -> theme/locale
State: Chat continues running while config page is visible
Guard: dirty Model Provider navigation opens discard confirmation
Files: icon opens/closes; width and selected file restore; tree has refresh/open/@ but no search
Chat: Message, execution process, Input controls, drag/drop, Minimap, Welcome prompts
Desktop: no mobile drawer or file replacement flow; 1024px remains usable
A11y: keyboard focus, localized aria-labels, disabled Skills tooltip, reduced motion
```

- [ ] **Step 5: Inspect the final diff for scope and generated files**

```powershell
git status --short
git diff --check
git diff --stat
```

Expected: no generated `next-env.d.ts`, no API contract changes, no new dependency, no unrelated refactor, and no whitespace errors.

- [ ] **Step 6: Commit docs and final verification fixes**

```powershell
git add PRODUCT.md DESIGN.md src
git commit -m "docs: align workspace design guidance"
```

If Step 2–5 required implementation corrections, include only those directly related fixes in this commit and rerun both `npm run check` and `npm run build` before committing.

---

## Final completion criteria

- The left sidebar matches the approved order and supports project/session management without a file explorer.
- Model Provider and Skills render in the central workspace with existing behavior preserved.
- Chat remains mounted across configuration views.
- Dirty Model Provider navigation is guarded.
- File Workspace is manual, optional, resizable, state-preserving, and owns the file tree without search.
- Chat Message, Input, Minimap, streaming, compaction, attachments, queue/steer/stop, edit, and fork behavior remain intact.
- Light/dark and English/Chinese behavior remains intact.
- The app has a 1024px desktop floor and no mobile-specific layout.
- `npm run check` and `npm run build` pass.
