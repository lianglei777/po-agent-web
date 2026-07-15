---
name: investigate-failure
description: Diagnose a reproducible test, build, or runtime failure before proposing a fix. Use when a command fails or behavior is unexpected.
---

# Investigate Failure

1. Capture the exact failure and the smallest reproducing command.
2. Trace the failing path through its callers, implementation, and tests.
3. Form one evidence-backed root-cause hypothesis at a time.
4. Run the smallest check that can disprove the hypothesis.
5. Report the root cause and evidence before changing code.
