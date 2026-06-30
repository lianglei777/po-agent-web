# Manual Project Path Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make absolute-path entry the default add-project workflow while retaining the existing directory browser as an on-demand secondary view.

**Architecture:** Keep the workflow inside the existing client-side `ProjectPicker` boundary. Reuse the existing `POST /api/projects` validation and browse API; add no dependency, endpoint, or desktop abstraction.

**Tech Stack:** Next.js 16 Client Components, React 19, TypeScript, existing UI primitives, Vitest source-contract tests.

---

### Task 1: Lock the manual-first interaction contract

**Files:**
- Create: `src/features/session-sidebar/project-picker.test.ts`

- [ ] **Step 1: Write the failing source-contract test**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const picker = readFileSync(
  `${root}/src/features/session-sidebar/project-picker.tsx`,
  "utf8",
);
const english = readFileSync(
  `${root}/src/i18n/dictionaries/en.ts`,
  "utf8",
);
const chinese = readFileSync(
  `${root}/src/i18n/dictionaries/zh.ts`,
  "utf8",
);

describe("project picker interaction contract", () => {
  it("defaults to absolute-path entry and loads browsing only on demand", () => {
    expect(picker).toContain('useState<"input" | "browse">("input")');
    expect(picker).toContain("<Input");
    expect(picker).toContain("autoFocus");
    expect(picker).toContain('type="submit"');
    expect(picker).toContain('setMode("browse")');
    expect(picker).toContain("if (!result) void navigate()");
  });

  it("provides matching English and Chinese copy", () => {
    for (const dictionary of [english, chinese]) {
      expect(dictionary).toContain("projectPath:");
      expect(dictionary).toContain("projectPathHint:");
      expect(dictionary).toContain("browseDirectories:");
      expect(dictionary).toContain("backToPathEntry:");
      expect(dictionary).toContain("addProject:");
    }
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/features/session-sidebar/project-picker.test.ts`

Expected: FAIL because the input-mode state, `Input`, and new dictionary keys do not exist.

### Task 2: Implement the single-dialog two-view workflow

**Files:**
- Modify: `src/features/session-sidebar/project-picker.tsx`
- Modify: `src/i18n/dictionaries/en.ts`
- Modify: `src/i18n/dictionaries/zh.ts`

- [ ] **Step 1: Add the bilingual copy**

Add these keys under `sessions`:

```ts
// en.ts
projectPath: "Project absolute path",
projectPathHint: "Enter an absolute path or browse this computer.",
browseDirectories: "Browse directories",
backToPathEntry: "Back to path entry",
addProject: "Add project",

// zh.ts
projectPath: "项目绝对路径",
projectPathHint: "输入项目的绝对路径，或浏览此电脑上的目录。",
browseDirectories: "浏览目录",
backToPathEntry: "返回路径输入",
addProject: "添加项目",
```

- [ ] **Step 2: Make manual entry the default view**

In `ProjectPicker`, add `mode` and `pathInput` state. Opening the trigger only opens the Dialog. Render a form in input mode using the existing `Input`, `Button`, `DialogHeader`, and `DialogFooter` primitives. Submit `pathInput.trim()` through the existing `addProject()` client and disable submission for blank or saving input.

The input form must contain:

```tsx
<form className="space-y-4" onSubmit={(event) => void submitProject(event)}>
  <DialogHeader>
    <DialogTitle>{t.sessions.openProject}</DialogTitle>
    <DialogDescription>{t.sessions.projectPathHint}</DialogDescription>
  </DialogHeader>
  <div className="space-y-1.5">
    <label className="text-xs font-medium" htmlFor="project-path">
      {t.sessions.projectPath}
    </label>
    <Input
      aria-invalid={Boolean(error)}
      autoFocus
      className="font-ui-mono text-xs"
      id="project-path"
      onChange={(event) => setPathInput(event.target.value)}
      value={pathInput}
    />
    {error ? <p className="text-xs text-destructive">{error}</p> : null}
  </div>
  <DialogFooter>
    <Button onClick={closePicker} type="button" variant="outline">
      {t.common.cancel}
    </Button>
    <Button
      onClick={() => {
        setError("");
        setMode("browse");
        if (!result) void navigate();
      }}
      type="button"
      variant="outline"
    >
      {t.sessions.browseDirectories}
    </Button>
    <Button disabled={saving || !pathInput.trim()} type="submit">
      {saving ? t.common.saving : t.sessions.addProject}
    </Button>
  </DialogFooter>
</form>
```

- [ ] **Step 3: Reuse the existing browser as the secondary view**

Keep the current roots, breadcrumbs, directory list, loading, and error UI. Change “选择此文件夹” so it stores `result.current` in `pathInput`, clears the error, and returns to input mode without calling `addProject`. Add a “返回路径输入” action that changes only the mode, preserving the draft path.

- [ ] **Step 4: Reset state on cancel and success**

Use one local `closePicker()` function to close the Dialog, clear `pathInput` and errors, and restore input mode. Call it on visible cancel, Dialog close, and after successful `addProject`; retain the cached browse result so a later browse can resume without another initial request.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm test -- src/features/session-sidebar/project-picker.test.ts`

Expected: 1 test file and 2 tests pass.

### Task 3: Verify the completed workflow

**Files:**
- Verify: `src/features/session-sidebar/project-picker.tsx`
- Verify: `src/i18n/dictionaries/en.ts`
- Verify: `src/i18n/dictionaries/zh.ts`

- [ ] **Step 1: Run repository checks**

Run: `npm run check`

Expected: ESLint, TypeScript, and all Vitest tests pass.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: Next.js production compilation succeeds. Record any existing NFT tracing warning separately; it is outside this UI change.

- [ ] **Step 3: Verify in the browser when available**

Check that opening the picker shows the focused path input without a browse request; Enter submits a non-empty path; “浏览目录” opens the current browser in the same Dialog; selecting a folder returns to the input view; cancel and successful submission reset the draft.

- [ ] **Step 4: Commit the implementation**

```bash
git add src/features/session-sidebar/project-picker.tsx src/features/session-sidebar/project-picker.test.ts src/i18n/dictionaries/en.ts src/i18n/dictionaries/zh.ts
git commit -m "feat(projects): add manual path entry"
```
