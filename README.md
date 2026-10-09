# AIDEL demo – Medication Order screen

Demo app for Jira epic **AIDEL-57** (Healthcare example H1: maximum-dose alerts).
Fictional patients and placeholder dose values only – Pharmacy owns the real dose reference table.

| Requirement | Story | Where |
|---|---|---|
| REQ-001 Retrieve patient weight | AIDEL-58 | `app.js` evaluate() |
| REQ-002 Calculate maximum daily dose | AIDEL-59 | `app.js` maxDailyDose() |
| REQ-003 Maximum-dose alert | AIDEL-60 | `app.js` evaluate() |
| REQ-004 Justification to override | AIDEL-61 | `app.js` evaluate() |
| REQ-005 Log alerts and justifications | AIDEL-62 | `app.js` submit() |

## How it fits the AIDEL workflow
1. A story moves to **In Development** → the coding agent opens a PR on a branch named after the story (e.g. `AIDEL-60-hard-stop`).
2. Vercel deploys a **preview** for the PR.
3. GitHub Actions runs the Playwright tests (titles carry `[AIDEL-xx][REQ-xxx]`), takes screenshots, and
   `scripts/report-to-jira.js` posts pass/fail + screenshots to each story and labels it `tests-passed` / `tests-failed`.
4. BA reviews preview + results at the **Approve Build** gate, then the PR is merged.

## Repo secrets needed
`JIRA_BASE` (https://chaledodge.atlassian.net), `JIRA_EMAIL`, `JIRA_API_TOKEN`.

## Run locally
```
npm install && npx playwright test
```
