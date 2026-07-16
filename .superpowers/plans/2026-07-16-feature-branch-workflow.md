# Feature Branch Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved feature-branch convention to the root `AGENTS.md`.

**Architecture:** This is one documentation-only change. Add a dedicated section near the required workflow so later agents find the rule before starting implementation.

**Tech Stack:** Markdown, Git

## Global Constraints

- Complex changes use a normal `feature/*` branch in the current project directory.
- Do not create a Git worktree unless the user explicitly requests one or requests parallel work.
- Preserve uncommitted changes before switching branches.
- Do not add scripts, hooks, automation, or tests.

---

### Task 1: Add the Git branch workflow

**Files:**
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: the approved workflow decision in `.superpowers/specs/2026-07-15-feature-branch-workflow-design.md`
- Produces: a repository-wide instruction for later agents

- [ ] **Step 1: Insert the section after Required Workflow**

```markdown
## Git Branch Workflow

- For complex changes, create and use a normal `feature/*` branch in the
  current project directory.
- Do not create a Git worktree unless the user explicitly requests a worktree
  or parallel branch work.
- Before switching branches, check for uncommitted changes and preserve them.
```

- [ ] **Step 2: Verify the documentation diff**

Run: `git diff --check && git diff -- AGENTS.md`

Expected: no whitespace errors; only the approved `Git Branch Workflow` section is added.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: require feature branches for complex changes"
```
