---
name: ci-check
description: Run the same checks the PR CI pipeline runs, locally, in order, and report pass/fail. Use before pushing or opening a PR, when a CI job is failing and you want to reproduce it locally, or when the user says "run CI", "check CI", "will CI pass", "run the pipeline". Mirrors .github/workflows/ci.yml.
---

# ci-check

Reproduce the GitHub Actions CI pipeline (`.github/workflows/ci.yml`) locally so failures surface before push. Run gates in the same order as CI, stop-report on each failure, and give the exact fix.

## Source of truth

CI is defined in `.github/workflows/ci.yml`. If that file changed, re-read it before running — the gate list below may be stale. The gates as of last sync:

| CI job | Step | Local command | Needs infra |
|---|---|---|---|
| quality | Lint | `pnpm run lint` | no |
| quality | Type check | `pnpm run check:types` | no |
| quality | Dead code | `pnpm run check:deadcode` | no |
| quality | Build | `pnpm run build` | no |
| test | Unit tests | `pnpm run test:cov` | no |
| database | Migrations | `pnpm prisma migrate deploy` | postgres + `DATABASE_URL` |
| database | Schema drift | `pnpm prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` | postgres + `DATABASE_URL` |
| secret-scan | Gitleaks | `gitleaks detect` (if installed) | gitleaks binary |
| zap-scan | OWASP ZAP | — | runs on main PRs only; skip locally |

`pnpm run lint` uses `--fix` — it mutates files. CI runs the same script, so a clean local run leaves the tree formatted the way CI expects. Note any files it changed.

## Procedure

1. **Default run — no-infra gates only.** Run in CI order: lint → check:types → check:deadcode → build → test:cov. These need no database or external tools and cover the two jobs (`quality`, `test`) that gate every PR.

2. **Report per gate.** For each: PASS or FAIL. On FAIL, show the relevant output (tail it — don't dump thousands of lines) and stop the sequence unless the user asked to run all gates regardless. Fix the failure, then re-run from that gate forward.

3. **Database gates — only if asked or if the diff touches `prisma/`.** They need Postgres. Check `DATABASE_URL` is set (or start local db with `pnpm run db:up`). If no DB available, report the gate as SKIPPED with the reason — never report it PASS when it didn't run.

4. **secret-scan** — run `gitleaks detect --no-banner` only if `gitleaks` is on PATH; otherwise SKIP with a note. **zap-scan** — CI runs it only on PRs targeting `main` and it needs a running app + ZAP; do not attempt locally, report SKIPPED.

5. **Final summary.** One line per gate: PASS / FAIL / SKIPPED (reason). If everything runnable passed, say the PR-gating jobs (quality + test) are green.

## Rules

- Never claim a gate passed if it was skipped or errored on setup. SKIPPED ≠ PASS.
- Run gates in CI order so the first failure a developer hits locally matches the first failure CI reports.
- Keep output terse: tail long logs, surface the actual error lines.
- If a fix is obvious and low-risk (unused export, format), apply it and re-run. If it's a judgment call, surface it and ask.
