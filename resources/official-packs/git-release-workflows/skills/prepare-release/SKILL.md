---
name: prepare-release
description: Use when deciding whether a repository is ready for a release and producing an evidence-based release checklist.
---

# Prepare Release

Assess readiness; do not perform the release.

1. Read repository instructions and identify the intended release version and explicit Git range. If either is missing or ambiguous, record a blocker instead of guessing.
2. Inspect the clean worktree state, including staged, unstaged, and untracked files. Treat unexplained changes as a blocker.
3. Inspect every commit and relevant diff in the release range. Identify user-visible changes, internal-only changes, dependency or configuration changes, migrations, and compatibility risk.
4. Run the repository's required validation commands. Record the exact command and result; do not claim readiness from an unrun or failing check.
5. Verify that manifests, lockfiles, changelog references, and release configuration agree on the requested version where applicable.
6. Check release risk: data loss, security, permissions, migrations, rollback difficulty, packaging, and deployment assumptions. Mark unavailable evidence as unknown.

Return exactly these sections:

## Verdict

`READY`, `NOT READY`, or `NEEDS EVIDENCE`, followed by one sentence.

## Evidence

List the Git range, worktree state, version evidence, validation results, and reviewed risks. Distinguish observed facts from inference.

## Blockers

List concrete blockers. Write `None found` only when all required evidence is present and passing.

## Next actions

List the smallest actions needed to remove blockers or complete the release.

Never commit, tag, publish, push, alter versions, or modify files without a separate explicit request.
