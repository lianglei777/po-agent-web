---
name: write-release-notes
description: Use when drafting release notes from a verified Git range without inventing product impact or metadata.
---

# Write Release Notes

Draft notes from repository evidence, not commit titles alone.

1. Require an explicit Git range with resolvable start and end revisions. Stop and request it when missing or ambiguous.
2. Read every commit and relevant diff in the range, plus existing release-note conventions.
3. Include only verified user impact supported by the diff, tests, documentation, or an explicit user statement. Omit internal refactors unless they affect users or operators.
4. Group verified changes under the smallest useful headings such as Added, Changed, Fixed, Security, and Migration. Omit empty headings.
5. Write concise outcome-focused bullets. Label inferred wording as `Inferred` on the same bullet and state the evidence.
6. Call out breaking changes, required migrations, and compatibility limits only when directly supported.

Return:

## Release range

State the exact revisions reviewed.

## Release notes

Provide grouped, publication-ready bullets.

## Verification gaps

List uncertain user impact or missing evidence. Write `None` only when every statement is verified.

Never invent links, issue IDs, pull-request numbers, compatibility claims, migrations, contributors, dates, or version numbers. Do not modify Git state or publish anything.
