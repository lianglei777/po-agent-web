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
