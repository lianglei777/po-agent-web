# Feature Branch Workflow Design

## Decision

Complex changes use a normal `feature/*` branch checked out in the current
project directory. Agents must not create a Git worktree unless the user
explicitly requests parallel work or a worktree.

Before switching branches, agents check for uncommitted changes and preserve
them. This rule belongs in a short `Git Branch Workflow` section in the root
`AGENTS.md` so later agents can find it without interpreting unrelated change
discipline rules.

## Scope

This is a documentation-only development convention. It does not add scripts,
Git hooks, branch automation, or tests.
