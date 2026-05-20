# Task: Narberth zoning GitHub Pages site

## User request and target outcome

Create a detailed implementation plan, then implement, commit, and push a public GitHub Pages website for the Narberth zoning survey project. The site must let users download the original PDF and analysis outputs, view charts/graphics, inspect data tables, read detailed findings, and link back to the GitHub repository.

## Risk tier

Medium. This is a user-facing website and multi-file static asset/data change, but it avoids destructive operations, secrets, auth, production database mutation, and dependency installation.

## Waves

- Wave 0: Research current repo and data exports — complete
- Wave 1: Package data and build static site — complete
- Wave 2: Validate, review, commit, and push — complete

## Wave plan

| Lane | Fleet name | Effort | Scope | Blocked by | Status | Checkpoint |
| ---- | ---------- | ------ | ----- | ---------- | ------ | ---------- |
| 1 | Han 😉🚀 | S | Research static Pages structure and repo constraints | — | Complete | 5m |
| 2 | Yoda 👽✨ | S | Research data/export inventory and validation checks | — | Complete | 5m |
| 3 | Leia 👑💁‍♀️ | M | Package public data exports and document assets | Wave 0 | Complete | 10m |
| 4 | Chewy 🐻💪 | M | Build static multi-page website in `docs/` | Wave 0 | Complete | 10m |
| 5 | R2 🤖🔧 | S | Validate files, data totals, links, and XLSX integrity | Lanes 3-4 | Complete | 5m |
| 6 | Luke 🌟⚔️ | S | Code review before commit | Lanes 3-5 | Complete | 5m |

## Context Map

### Primary files

- `README.md`: source planning and public requirements.
- `Zoning Sentiment Analysis.md`: source text and headline findings.
- `High-Level Survey Overview.md`: source context for the homepage/methodology.
- `Zone 4A Response Classifications.csv`: row-level Zone 4A data.
- `Zone 5B Response Classifications.csv`: row-level Zone 5B data.
- `Raw Survey Results.pdf`: original source document for downloads.
- `docs/`: GitHub Pages static site output and public assets.

### Secondary files

- `.github/docs/2026-05-19-github-pages-site-plan.md`: progress, validation, and handoff plan.
- `.github/copilot-instructions.md`: repo operating rules.
- `.github/agents/autonomous-fleet-agent.md`: shared fleet instructions.

### Tests and validation

- Python validation script/check: CSV row counts, category totals, JSON validity, link target existence, XLSX zip/XML integrity.
- Local file inspection: confirm site references only committed assets.
- Optional GitHub push result: confirm commit reaches `origin/main`.

### Existing patterns

- Keep civic-neutral language from README and analysis docs.
- Use static files under `docs/` for GitHub Pages compatibility without adding build dependencies.
- Use Clawpilot theme variables and theme detection for generated HTML/CSS.
- Provide non-WebGL chart/table fallbacks for the WebGL visual.

### Change sequence

1. Research repo and data requirements.
2. Create export assets in `docs/data/` and `docs/documents/`.
3. Build static HTML/CSS/JS site in `docs/`.
4. Validate data, links, accessibility basics, and XLSX integrity.
5. Run code review, fix blockers, commit, and push.

## Validation Matrix

| Check type | Owner | Evidence | Status |
|------------|-------|----------|--------|
| Happy path | R2 🤖🔧 | `docs/index.html` exists; required sections and linked downloads validated by script | Complete |
| Boundary | R2 🤖🔧 | 303 rows per zone, contiguous indexes, page ranges, 606 combined rows, zero-result table branch present | Complete |
| Negative/error | R2 🤖🔧 | WebGL fallback branch and zero-filter result message implemented | Complete |
| Concurrency/idempotency | R2 🤖🔧 | Export generation overwrites stable paths; validation confirms no duplicate row counts | Complete |
| Specialist | Chewy 🐻💪 / R2 🤖🔧 | Semantic nav/headings, labels, reduced-motion CSS, text chart equivalent, and noscript fallback implemented | Complete |

## Lane Contracts

### Lane Contract: Wave 0 → Lanes 3-4

- **Producer artifact:** Research findings from Han and Yoda.
- **Artifact format:** Agent output summary with recommendations, validation checks, and caveats.
- **Consumer use:** Finalize export inventory and site structure.
- **Producer done when:** Both research lanes return actionable findings.
- **Consumer may start when:** Orchestrator has synthesized Wave 0 results.
- **Validation link:** Plan updated with research findings and implementation choices.

### Lane Contract: Lane 3 → Lane 4

- **Producer artifact:** Public data/document files in `docs/data/` and `docs/documents/`.
- **Artifact format:** CSV, JSON, XLSX, PDF, and Markdown assets with stable relative paths.
- **Consumer use:** Static site links and data visualizations load these assets.
- **Producer done when:** Files exist and totals match source CSVs.
- **Consumer may start when:** Export paths are known; Chewy may build against expected paths while Leia packages data.
- **Validation link:** R2 validates link targets and data totals.

### Lane Contract: Lanes 3-4 → Lane 5

- **Producer artifact:** Complete static site and export assets.
- **Artifact format:** `docs/index.html`, `docs/assets/styles.css`, `docs/assets/app.js`, data/documents folders.
- **Consumer use:** R2 validates functionality and file integrity.
- **Producer done when:** Site and assets are generated locally.
- **Consumer may start when:** Orchestrator reports implementation complete.
- **Validation link:** Validation command output and code review.

## Todos

| Todo | Lane | Status |
| ---- | ---- | ------ |
| Create implementation plan | Orchestrator | Complete |
| Package public data exports | Leia 👑💁‍♀️ | Complete |
| Build static GitHub Pages site | Chewy 🐻💪 | Complete |
| Validate and review site | R2 🤖🔧 / Luke 🌟⚔️ | Complete |
| Commit and push website | Orchestrator | Complete |

## Research Findings

### Han 😉🚀 — static site structure

- Use `docs/` as the GitHub Pages output so the repo can publish a static site without adding a build system.
- Implement the first version as dependency-free HTML, CSS, and vanilla JavaScript.
- Keep current source artifacts in place and copy public-facing download versions into `docs/data/` and `docs/documents/`.
- Validate every download link and keep the site neutral, accessible, and readable before adding more complex visuals.

### Yoda 👽✨ — data exports and validation

- Required exports: source PDF, Zone 4A CSV, Zone 5B CSV, combined CSV, summary JSON, row-level JSON, XLSX workbook(s), and markdown report downloads.
- Expected totals:
  - Zone 4A: 303 rows; Against 223 (73.6%); Neutral 18 (5.9%); In Favor 62 (20.5%).
  - Zone 5B: 303 rows; Against 204 (67.3%); Neutral 16 (5.3%); In Favor 83 (27.4%).
  - Combined classified rows: 606.
- Validate contiguous row indexes, page ranges, category totals, confidence totals, JSON/XLSX parity, and nonblank category/confidence/rationale fields.

## Duck Reviews

### Plan review — Chewy 🐻💪

- **Verdict:** needs-changes.
- **Blocking feedback:** add privacy/publication review before copying the raw PDF and row data into `docs/`.
- **Disposition:** accepted and mitigated. The source PDF was already committed and pushed in the repository, and the user explicitly requested the website provide it as a download. The site will clearly label it as the original survey export and will not extract or display full raw respondent text. Public tables will use the existing classification CSVs only.
- **Warnings accepted:** do not promise quote cards/full responses in this version; define and validate XLSX generation; add checks for base paths, broken links, CSV/JSON parity, mobile layout, keyboard access, reduced motion, and no-JS fallback.

### Completion review — Chewy 🐻💪

- **Verdict:** blocking.
- **Blocking feedback:** implementation had not yet been committed or pushed at review time.
- **Disposition:** accepted. The blocker is resolved by the final commit and push in Wave 2.
- **Warnings accepted:** GitHub Pages source still needs post-push verification; add future checks for fetch failures, WebGL shader/link failures, keyboard/mobile polish, and accessibility smoke testing.

### Code review — Luke 🌟⚔️

- **Verdict:** pass.
- **Findings:** no significant issues found in the reviewed changes.
- **Evidence:** HTML structure, CSS syntax, JavaScript syntax, JSON parseability, data integrity, asset references, GitHub repository link, sensitive-data patterns, and accessibility basics were reviewed.


## Decisions

- Use a dependency-free static site in `docs/` instead of a Vite build for the first publishable version. Rationale: avoids dependency installation/lockfile churn and works well with GitHub Pages.
- Use hash-based navigation in one static HTML entry to satisfy multiple pages/features while keeping deployment simple.

## Blockers

None currently.

## Communication Log

| Time | Lane | Fleet Name | Update |
| ---- | ---- | ---------- | ------ |
| 20:15 | 0 | Orchestrator | 🎯 Wave 0 launched: static site and data/export research |
| 20:16 | 0 | Orchestrator | 📋 Plan created; implementation pending research synthesis |
| 20:17 | 1 | Han 😉🚀 | ✅ Research complete: recommended dependency-free static `docs/` site |
| 20:17 | 2 | Yoda 👽✨ | ✅ Research complete: export inventory and validation checks confirmed |
| 20:18 | 0 | Orchestrator | ✅ Wave 0 synthesized; plan review next before implementation |
| 20:19 | 4 | Chewy 🐻💪 | ⚠️ Plan review returned needs-changes: publication/privacy review required |
| 20:20 | 0 | Orchestrator | ✅ Duck feedback accepted: no raw response table/quote cards; PDF download retained per user request and prior publication |
| 20:24 | 3 | Leia 👑💁‍♀️ | ✅ Exports generated: CSV, JSON, XLSX, PDF, and Markdown assets in `docs/` |
| 20:25 | 4 | Chewy 🐻💪 | ✅ Static site implemented: summary, charts, tables, findings, methodology, downloads |
| 20:26 | 5 | R2 🤖🔧 | ✅ Validation passed: totals, links, XLSX structure, JS syntax, theme color checks |
| 20:27 | 4 | Chewy 🐻💪 | ⚠️ Completion review blocking: commit/push not yet done |
| 20:29 | 6 | Luke 🌟⚔️ | ✅ Code review passed with no significant issues |
| 20:30 | 0 | Orchestrator | ✅ Completion blocker resolved by final commit/push workflow |

## Wave 0 Retrospective

### Actual vs. Estimated

- Lane 1 (Han): Estimated S, completed on target.
- Lane 2 (Yoda): Estimated S, completed on target.

### Critical path analysis

- Research completed in parallel and unblocked implementation planning.

### What went well

- Both lanes converged on a simple static `docs/` approach.
- Data validation requirements are concrete and measurable.

### What to improve for Wave 1

- Keep implementation dependency-free and idempotent.
- Validate generated exports immediately after creation.

### Duck findings

- Pending required plan review.

### Doc sync status

- [x] Plan updated with Wave 0 findings.
- [x] README already states limitations; site will mirror them and avoid raw response text promises.

### Decision log

- ✅ Static `docs/` output selected to reduce deployment and dependency risk.


## Wave 1 Retrospective

### Actual vs. Estimated

- Lane 3 (Leia): Estimated M, completed on target.
- Lane 4 (Chewy): Estimated M, completed on target.
- Lane 5 (R2): Estimated S, completed on target.

### Critical path analysis

- Data exports and static site implementation were independent after Wave 0; validation depended on both.

### What went well

- Dependency-free static output avoided lockfile and build-system risk.
- Validation directly checked the published assets under `docs/`.

### What to improve for Wave 2

- Run code review before commit and fix any real defects.
- Confirm GitHub Pages source after push if repository settings are available.

### Duck findings

- Blocking publication concern accepted and mitigated: original PDF remains downloadable because the user requested it and it was already pushed; no full raw text or quote-card feature was added.
- Warnings accepted: first site version does not promise raw response text, and XLSX generation is validated structurally without formulas.

### Doc sync status

- [x] Plan updated for implemented website and validation evidence.
- [x] Site includes methodology and limitation text.
- [x] README already documents site requirements.

### Decision log

- ✅ Kept quote cards/topic visuals as future work, not current behavior.

## Wave 2 Retrospective

### Actual vs. Estimated

- Lane 6 (Luke): Estimated S, completed on target.
- Orchestrator commit/push: completed after reviews passed.

### Critical path analysis

- Completion review intentionally blocked final synthesis until the site was committed and pushed.

### What went well

- Final code review found no significant issues.
- Validation evidence was captured before commit.

### What to improve for the next wave

- Add automated accessibility smoke testing if a test runner is introduced.
- Add more robust client-side fetch/WebGL error messaging in a later polish pass.
- Confirm GitHub Pages serves from `main` / `docs` after repository settings are available.

### Duck findings

- Blocking: uncommitted/unpushed implementation, resolved in Wave 2.
- Warnings: post-push Pages status and future fallback polish, tracked as follow-up considerations.

### Doc sync status

- [x] Plan updated with final review outcomes.
- [x] Site includes methodology, limitations, and download descriptions.
- [x] README already documents the desired site features.

### Decision log

- ✅ Commit/push allowed because the user explicitly requested implementation, commit, and push.

## Definition of Done

- [x] All wave todos resolved.
- [x] All agent lanes reported deliverables complete or review pass.
- [x] Required duck reviews complete and blocking findings resolved.
- [x] Context Map complete.
- [x] Validation Matrix complete.
- [x] Lane Contracts fulfilled.
- [x] Synthesis complete.
- [x] Relevant checks passed.
- [x] Doc sync confirmed.
- [x] No intentional shortcuts requiring TODO comments.
- [x] Quality gates documented.
- [x] Plan file updated with retrospectives and decisions.
