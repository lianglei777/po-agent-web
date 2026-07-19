# ChatGPT-like Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the light visual system, base controls, sidebar, chat messages, minimap, and composer look much closer to ChatGPT Web while preserving Po Agent workflows.

**Architecture:** Keep the change shallow: design tokens first, shared UI primitives second, feature CSS/classes last. Do not introduce new components unless an existing class cannot express the visual change.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS utilities, CSS Modules, Radix UI primitives, Vitest source-contract tests.

## Global Constraints

- Save generated plan artifacts under `.superpowers/plans/`.
- Read `PRODUCT.md` and `DESIGN.md` before changing product UI.
- Before any Next.js work, read the relevant installed guide in `node_modules/next/dist/docs/`; for this plan use `01-app/01-getting-started/11-css.md`.
- Use Server Components by default; keep existing client component boundaries unchanged.
- Do not import `src/server` modules into UI code.
- Keep user-visible strings in `src/i18n/dictionaries`; this plan should not add new UI copy.
- Do not add a dependency.
- Do not support or optimize dark mode in this pass.
- Do not use ChatGPT logos, brand names, proprietary assets, or trademarked visual marks.
- Keep keyboard focus visible and disabled-control tooltip behavior intact.
- Run `npm run check` before completion.

---

## File Structure

- Modify `DESIGN.md`: update palette and design language from Agent Mint to ChatGPT-like neutral light.
- Modify `src/app/globals.css`: replace light token values, shadows, selection, user/tool backgrounds, disabled tokens.
- Modify `src/components/ui/button.tsx`: make default/secondary/ghost/outline buttons match neutral ChatGPT-like states.
- Modify `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`, `src/components/ui/select.tsx`, `src/components/ui/dropdown-menu.tsx`, `src/components/ui/tooltip.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/card.tsx`, `src/components/ui/accordion.tsx`: soften borders, focus, popovers, badges, cards.
- Modify `src/layouts/agent-workspace/agent-workspace.tsx`, `src/layouts/agent-workspace/workspace-sidebar.tsx`, `src/layouts/agent-workspace/workspace-top-bar.tsx`: use the new panel/canvas roles and weaker dividers.
- Modify `src/features/sessions/session-tree.tsx`, `src/features/sessions/session-sidebar.tsx`: make project/session rows flatter and less mint-heavy.
- Modify `src/features/chat/chat-center.tsx`, `src/features/chat/chat-input.tsx`, `src/features/chat/message-view.tsx`, `src/features/chat/message-view.module.css`, `src/features/chat/code-block.tsx`, `src/features/chat/minimap/chat-minimap.tsx`: ChatGPT-like composer, message surfaces, tool process, code blocks, and weak minimap.
- Update visual contract tests in `src/app/visual-foundation.test.ts`, `src/components/ui/ui-visual-contract.test.ts`, `src/features/chat/chat-input-visual.test.ts`, `src/features/chat/message-view-visual.test.ts`, `src/layouts/agent-workspace/workspace-sidebar-visual.test.ts`, and add/update a sessions visual test only if an existing assertion breaks.

---

### Task 1: Tokens And Design Contract

**Files:**
- Modify: `DESIGN.md`
- Modify: `src/app/globals.css`
- Test: `src/app/visual-foundation.test.ts`

**Interfaces:**
- Consumes: existing semantic CSS variables such as `--bg`, `--bg-panel`, `--bg-selected`, `--border-subtle`, `--accent`.
- Produces: updated semantic CSS variables used by Tailwind `@theme inline` and all existing components.

- [ ] **Step 1: Read local docs and current sources**

Run:

```powershell
Get-Content -Raw PRODUCT.md
Get-Content -Raw DESIGN.md
Get-Content -Raw node_modules\next\dist\docs\01-app\01-getting-started\11-css.md
Get-Content -Raw src\app\globals.css
Get-Content -Raw src\app\visual-foundation.test.ts
```

Expected: files print successfully. Confirm the Next CSS doc recommends global CSS for truly global styles and CSS Modules for scoped component styles.

- [ ] **Step 2: Update the failing visual contract first**

In `src/app/visual-foundation.test.ts`, update assertions to require these exact token values:

```ts
expect(globals).toContain("--bg: #ffffff;");
expect(globals).toContain("--bg-panel: #f7f7f8;");
expect(globals).toContain("--bg-elevated: #ffffff;");
expect(globals).toContain("--bg-subtle: #f7f7f8;");
expect(globals).toContain("--bg-hover: #ececf1;");
expect(globals).toContain("--bg-selected: #ececf1;");
expect(globals).toContain("--border-subtle: #ececf1;");
expect(globals).toContain("--border-strong: #d9d9e3;");
expect(globals).toContain("--accent: #10a37f;");
expect(globals).toContain("--user-bg: #f7f7f8;");
expect(globals).toContain("--tool-bg: #f7f7f8;");
expect(globals).toContain("color-scheme: light;");
```

Also assert that `globals` does not contain the old warm/mint selected values:

```ts
expect(globals).not.toContain("--bg: #fbfbf8;");
expect(globals).not.toContain("--bg-selected: #e8f5ee;");
```

- [ ] **Step 3: Run the token test to verify it fails**

Run:

```powershell
npx vitest run src/app/visual-foundation.test.ts
```

Expected: FAIL because `globals.css` still contains the old Agent Mint token values.

- [ ] **Step 4: Update `globals.css` tokens**

Replace the `:root` visual values with:

```css
  --bg: #ffffff;
  --bg-panel: #f7f7f8;
  --bg-elevated: #ffffff;
  --bg-subtle: #f7f7f8;
  --bg-hover: #ececf1;
  --bg-selected: #ececf1;
  --border-subtle: #ececf1;
  --border-strong: #d9d9e3;
  --border-emphasis: #10a37f;
  --border: var(--border-subtle);
  --text: #0d0d0d;
  --text-muted: #565869;
  --text-dim: #8e8ea0;
  --accent: #10a37f;
  --accent-hover: #0e8f70;
  --accent-deep: #08755f;
  --accent-soft: #e6f4ef;
  --primary-foreground: #ffffff;
  --secondary: #f7f7f8;
  --secondary-foreground: #0d0d0d;
  --muted-foreground: var(--text-muted);
  --accent-foreground: #0d0d0d;
  --destructive: #d92d20;
  --destructive-foreground: #ffffff;
  --success: #12b76a;
  --warning: #b54708;
  --disabled-surface: #f4f4f4;
  --disabled-text: #b4b4b4;
  --input: var(--border);
  --ring: #0d0d0d;
  --radius: 1rem;
  --user-bg: #f7f7f8;
  --assistant-bg: #ffffff;
  --tool-bg: #f7f7f8;
  --shadow-floating: 0 8px 24px rgba(0, 0, 0, 0.10);
  --shadow-soft: 0 2px 10px rgba(0, 0, 0, 0.06);
  --shadow-card: none;
```

Keep existing motion tokens and `color-scheme: light;`.

- [ ] **Step 5: Update `DESIGN.md`**

Change the frontmatter `colors.light` values to match Step 4. In the body, replace “Agent Mint” direction with “ChatGPT-like neutral light”: white canvas, light gray sidebar, neutral selected state, mint only for status/focus. Keep the existing warnings against gradients, glassmorphism, mascots, and marketing patterns.

- [ ] **Step 6: Run token test**

Run:

```powershell
npx vitest run src/app/visual-foundation.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add DESIGN.md src/app/globals.css src/app/visual-foundation.test.ts
git commit -m "Update light visual tokens"
```

Expected: commit succeeds.

---

### Task 2: Shared UI Primitives

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/textarea.tsx`
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/ui/dropdown-menu.tsx`
- Modify: `src/components/ui/tooltip.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/accordion.tsx`
- Test: `src/components/ui/ui-visual-contract.test.ts`

**Interfaces:**
- Consumes: CSS variables from Task 1.
- Produces: unchanged component APIs; only className defaults change.

- [ ] **Step 1: Read existing primitive sources and test**

Run:

```powershell
Get-Content -Raw src\components\ui\ui-visual-contract.test.ts
Get-Content -Raw src\components\ui\button.tsx
Get-Content -Raw src\components\ui\input.tsx
Get-Content -Raw src\components\ui\textarea.tsx
Get-Content -Raw src\components\ui\select.tsx
Get-Content -Raw src\components\ui\dropdown-menu.tsx
Get-Content -Raw src\components\ui\tooltip.tsx
Get-Content -Raw src\components\ui\badge.tsx
Get-Content -Raw src\components\ui\card.tsx
Get-Content -Raw src\components\ui\accordion.tsx
```

Expected: sources print successfully.

- [ ] **Step 2: Update visual contract test**

In `src/components/ui/ui-visual-contract.test.ts`, assert:

```ts
expect(button).toContain("rounded-full");
expect(button).toContain("default: \"bg-primary text-primary-foreground hover:bg-primary/85\"");
expect(button).toContain("secondary:");
expect(button).toContain("bg-secondary text-secondary-foreground hover:bg-hover");
expect(button).toContain("ghost: \"text-muted-foreground hover:bg-hover hover:text-foreground\"");
expect(input).toContain("rounded-xl");
expect(input).toContain("bg-elevated");
expect(textarea).toContain("rounded-xl");
expect(select).toContain("rounded-full");
expect(badge).not.toContain("bg-accent text-accent-foreground");
expect(card).toContain("shadow-none");
```

Keep any existing accessibility/focus assertions.

- [ ] **Step 3: Run primitive test to verify it fails**

Run:

```powershell
npx vitest run src/components/ui/ui-visual-contract.test.ts
```

Expected: FAIL because primitives still use old rounded-md/rounded-lg and accent-heavy defaults.

- [ ] **Step 4: Update primitive classes**

Apply these minimal class changes:

- In `button.tsx`, base uses `rounded-full`, `active:scale-[0.98]`, no `active:translate-y-px`. Variants:

```ts
default: "bg-primary text-primary-foreground hover:bg-primary/85",
destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
outline: "border border-line-strong bg-elevated hover:bg-hover hover:text-foreground",
secondary: "bg-secondary text-secondary-foreground hover:bg-hover",
ghost: "text-muted-foreground hover:bg-hover hover:text-foreground",
link: "text-primary underline-offset-4 hover:underline",
```

- In `input.tsx` and `textarea.tsx`, use `rounded-xl border-line-strong bg-elevated`, hover `border-line-strong`, and focus `focus-visible:ring-ring/15`.
- In `select.tsx`, make triggers `rounded-full bg-elevated`, content `rounded-2xl border-line-subtle`, item focus `bg-hover`.
- In `dropdown-menu.tsx` and `tooltip.tsx`, soften floating surfaces to `rounded-2xl border-line-subtle`.
- In `badge.tsx`, change default to `border-line-subtle bg-secondary text-secondary-foreground`.
- In `card.tsx`, use `shadow-none`.
- In `accordion.tsx`, use `rounded-2xl border-line-subtle bg-[var(--tool-bg)]`.

- [ ] **Step 5: Run primitive test**

Run:

```powershell
npx vitest run src/components/ui/ui-visual-contract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/components/ui src/components/ui/ui-visual-contract.test.ts
git commit -m "Soften shared UI primitives"
```

Expected: commit succeeds.

---

### Task 3: Sidebar And Workspace Frame

**Files:**
- Modify: `src/layouts/agent-workspace/agent-workspace.tsx`
- Modify: `src/layouts/agent-workspace/workspace-sidebar.tsx`
- Modify: `src/layouts/agent-workspace/workspace-top-bar.tsx`
- Modify: `src/features/sessions/session-tree.tsx`
- Modify: `src/features/sessions/session-sidebar.tsx`
- Test: `src/layouts/agent-workspace/workspace-sidebar-visual.test.ts`
- Test: `src/features/sessions/session-tree-visual.test.ts`

**Interfaces:**
- Consumes: existing sidebar/session component props.
- Produces: unchanged navigation and session selection behavior.

- [ ] **Step 1: Read sources and visual tests**

Run:

```powershell
Get-Content -Raw src\layouts\agent-workspace\workspace-sidebar-visual.test.ts
Get-Content -Raw src\layouts\agent-workspace\agent-workspace.tsx
Get-Content -Raw src\layouts\agent-workspace\workspace-sidebar.tsx
Get-Content -Raw src\layouts\agent-workspace\workspace-top-bar.tsx
Get-Content -Raw src\features\sessions\session-tree.tsx
Get-Content -Raw src\features\sessions\session-sidebar.tsx
```

Expected: sources print successfully.

- [ ] **Step 2: Update visual test**

In `workspace-sidebar-visual.test.ts`, assert:

```ts
expect(sidebar).toContain("bg-panel p-2");
expect(sidebar).toContain('variant={activeView === "model-provider" ? "secondary" : "ghost"}');
expect(sidebar).not.toContain("bg-selected");
expect(agentWorkspace).toContain("bg-canvas");
expect(topBar).toContain("border-line-subtle");
```

Keep existing assertions that protect keyboard and tooltip behavior.

- [ ] **Step 3: Run sidebar test to verify current state**

Run:

```powershell
npx vitest run src/layouts/agent-workspace/workspace-sidebar-visual.test.ts src/features/sessions/session-tree-visual.test.ts
```

Expected: either PASS or FAIL only on the newly tightened visual assertions.

- [ ] **Step 4: Flatten session rows and dividers**

In `session-tree.tsx`, change row classes:

- selected row: `border-transparent bg-selected`
- non-selected row: no bottom border, use `border-transparent hover:bg-hover`
- focus: `focus-within:bg-hover focus-within:ring-2 focus-within:ring-ring/10`
- action overlay: remove `backdrop-blur-sm`, keep `bg-panel/90`.

Do not change click handlers, dialog behavior, rename, delete, or draft logic.

- [ ] **Step 5: Weaken workspace chrome**

In `workspace-top-bar.tsx`, keep the header height and buttons, but ensure it uses `bg-canvas` or `bg-elevated` with `border-line-subtle`, not strong borders or colored state. In `agent-workspace.tsx`, keep `bg-canvas` for main and `bg-panel` for sidebars.

- [ ] **Step 6: Run sidebar/session tests**

Run:

```powershell
npx vitest run src/layouts/agent-workspace/workspace-sidebar-visual.test.ts src/features/sessions/session-tree-visual.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/layouts/agent-workspace src/features/sessions/session-tree.tsx src/features/sessions/session-sidebar.tsx src/layouts/agent-workspace/workspace-sidebar-visual.test.ts src/features/sessions/session-tree-visual.test.ts
git commit -m "Make workspace sidebar more neutral"
```

Expected: commit succeeds.

---

### Task 4: Chat Composer, Messages, Code, And Minimap

**Files:**
- Modify: `src/features/chat/chat-center.tsx`
- Modify: `src/features/chat/chat-input.tsx`
- Modify: `src/features/chat/message-view.tsx`
- Modify: `src/features/chat/message-view.module.css`
- Modify: `src/features/chat/code-block.tsx`
- Modify: `src/features/chat/minimap/chat-minimap.tsx`
- Test: `src/features/chat/chat-input-visual.test.ts`
- Test: `src/features/chat/message-view-visual.test.ts`

**Interfaces:**
- Consumes: existing chat controller props and message presentation model.
- Produces: unchanged submit, stop, compact, attachment, model, thinking, fork, edit, minimap behavior.

- [ ] **Step 1: Read chat sources and visual tests**

Run:

```powershell
Get-Content -Raw src\features\chat\chat-input-visual.test.ts
Get-Content -Raw src\features\chat\message-view-visual.test.ts
Get-Content -Raw src\features\chat\chat-center.tsx
Get-Content -Raw src\features\chat\chat-input.tsx
Get-Content -Raw src\features\chat\message-view.tsx
Get-Content -Raw src\features\chat\message-view.module.css
Get-Content -Raw src\features\chat\code-block.tsx
Get-Content -Raw src\features\chat\minimap\chat-minimap.tsx
```

Expected: sources print successfully.

- [ ] **Step 2: Update chat visual tests**

In `chat-input-visual.test.ts`, assert:

```ts
expect(source).toContain("rounded-3xl border border-line-strong bg-elevated shadow-[var(--shadow-soft)]");
expect(source).toContain("focus-within:ring-2 focus-within:ring-ring/10");
expect(source).toContain("className=\"size-9 rounded-full\"");
expect(source).not.toContain("rounded-lg border bg-elevated");
```

In `message-view-visual.test.ts`, assert:

```ts
expect(source).toContain("max-w-[72%] rounded-3xl bg-[var(--user-bg)]");
expect(source).toContain("rounded-2xl border border-line-subtle bg-[var(--tool-bg)]");
expect(source).toContain("[&_code]:rounded");
expect(source).not.toContain("border border-line-subtle bg-[var(--user-bg)]");
```

- [ ] **Step 3: Run chat visual tests to verify they fail**

Run:

```powershell
npx vitest run src/features/chat/chat-input-visual.test.ts src/features/chat/message-view-visual.test.ts
```

Expected: FAIL because current composer/messages use `rounded-lg` and stronger bordered surfaces.

- [ ] **Step 4: Update composer**

In `chat-input.tsx`:

- outer fixed area remains `pointer-events-none absolute ...`.
- composer wrapper becomes:

```tsx
className={`overflow-hidden rounded-3xl border border-line-strong bg-elevated shadow-[var(--shadow-soft)] transition-[border-color,box-shadow] duration-[var(--motion-standard)] focus-within:border-line-strong focus-within:ring-2 focus-within:ring-ring/10 ${
  running ? "border-warning/50" : "border-line-strong"
}`}
```

- textarea keeps no internal border, with `px-5 pt-4`.
- toolbar uses `px-3 pb-3`.
- idle send button is icon-forward and compact:

```tsx
className="size-9 rounded-full"
size="icon"
```

Keep the visible send text only for running queue/steer controls where labels are needed.

- [ ] **Step 5: Update messages and execution process**

In `message-view.tsx`:

- user bubble: `max-w-[72%] rounded-3xl bg-[var(--user-bg)] px-4 py-2.5` and remove its border.
- assistant final text stays unframed.
- execution accordion/code/tool surfaces use `rounded-2xl border border-line-subtle bg-[var(--tool-bg)]`.
- inline code uses neutral selected gray, not accent.
- small action buttons remain accessible with labels.

In `message-view.module.css`, keep grid layout but use weaker hover `background: var(--bg-hover);`.

- [ ] **Step 6: Update code block**

In `code-block.tsx`, change the root to:

```tsx
<div className="my-3 overflow-hidden rounded-2xl border border-line-subtle bg-[var(--tool-bg)]">
```

Keep copy behavior and syntax highlighter unchanged.

- [ ] **Step 7: Weaken minimap**

In `chat-minimap.tsx`:

- root uses `w-7 border-l border-line-subtle bg-canvas/70`.
- center line uses `bg-line-subtle`.
- viewport uses `bg-[#d9d9e3]/40` or `bg-line-strong/35`.
- user node uses neutral border/background; keep role distinction with shape only.

Do not remove pointer handlers or tooltip behavior.

- [ ] **Step 8: Run chat visual tests**

Run:

```powershell
npx vitest run src/features/chat/chat-input-visual.test.ts src/features/chat/message-view-visual.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

Run:

```powershell
git add src/features/chat
git commit -m "Restyle chat surface like ChatGPT"
```

Expected: commit succeeds.

---

### Task 5: Full Verification And Browser Check

**Files:**
- No new source files unless tests reveal a missed visual contract.

**Interfaces:**
- Consumes: Tasks 1-4.
- Produces: verified implementation.

- [ ] **Step 1: Run full project check**

Run:

```powershell
npm run check
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run because this is a Next.js rendering/style change:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 3: Start dev server**

Run:

```powershell
npm run dev
```

Expected: server starts and prints a local URL, usually `http://localhost:3000`.

- [ ] **Step 4: Browser verify**

Open the local URL and check:

- 1024px width: sidebar remains usable, composer does not overlap text.
- 1440px width: chat column and composer look centered and calm.
- 1920px width: right minimap is weak and does not pull focus.
- Chinese locale: session rows and composer controls do not overflow.
- English locale: same controls remain aligned.
- Keyboard Tab: focus ring is visible on sidebar buttons, composer controls, send, compact, and menu controls.
- Disabled Compact still shows its tooltip reason on hover.

- [ ] **Step 5: Stop dev server**

Stop the server with `Ctrl+C`.

Expected: no long-running command remains.

- [ ] **Step 6: Commit any verification fixes**

If verification required fixes, run:

```powershell
git status --short
git add DESIGN.md src/app/globals.css src/components/ui src/layouts/agent-workspace src/features/sessions src/features/chat src/app/visual-foundation.test.ts src/components/ui/ui-visual-contract.test.ts
git commit -m "Fix visual verification issues"
```

Expected: if `git status --short` showed changes, commit succeeds. If it showed no changes, skip `git add` and `git commit`.
