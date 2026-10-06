# Changelog — Agentic Ops KB

All notable changes to this knowledge base. Format follows [Keep a Changelog](https://keepachangelog.com/);
versioning follows the policy in [`README.md`](README.md#4-bump-version-and-write-a-changelogmd-entry).

This file tracks the **KB**, not the application. The application's release record lives in
[`docs/releases/`](../releases/).

---

## [1.6.1] — 2026-10-06

### Changed

- **[`skills/docs-reconciliation-release`](skills/docs-reconciliation-release/SKILL.md), step 8
  (Validate):** added the rule that a gate must be confirmed to have *actually run* before its
  result is trusted. A runner that silently mis-runs reports a real number that is not about your
  change, and the failure reads as a broken test rather than a broken runner — the T44 case, where
  a lowercase drive letter in `process.cwd()` silently disabled `vi.mock` and the identical command
  passed or failed depending on how the directory had been entered. Carries two transferable
  habits: prove a failure's source is unmodified (`git hash-object` vs `git rev-parse HEAD:<path>`)
  before debugging the test, and read the runner's own banner — it names the root it resolved.
  Links to **T44**.

---

## [1.6.0] — 2026-10-06

Follow-on to 1.5.0, same session. A Vercel check on PR #15 printed a project path that contradicted the
KB — and the contradiction turned out to be real.

### Added

- **T43 — a renamed Vercel project keeps its old `*.vercel.app` alias, so the retired name still
  resolves.** The project *and* the team were renamed after the 2026-10-01 migration, and the old alias
  stayed attached and `verified: true`, so nothing ever failed and nothing looked wrong. Same shape as
  **T23**, where a renamed GitHub repo keeps serving through a redirect: *"it still resolves"* is **not**
  evidence that a name is current. The generalisable rule is to compare **ids** — `prj_…` and `team_…` are
  immutable — rather than display names.
- **T44 — `vi.mock` silently stops working when Vitest's root carries a lowercase drive letter.** On
  Windows, `process.cwd()` returns `c:\…` when the shell was entered as `/c/…`. Vitest derives its `root`
  from that string, the module paths that follow then differ in case from the runner's, and Node caches
  modules by path *string* — so two `vitest` instances load. `vi.spyOn` keeps working and `vi.mock` stops
  being hoisted, so only the 4 files that use `vi.mock` fail, with an error that reads like a broken test
  rather than a broken runner. **RESOLVED**, with a known residual: `npm test` still fails on Windows for
  a separate npm-shim reason; CI is unaffected.

### Changed

- **`vitest.config.ts`:** `root` is now `fs.realpathSync.native(__dirname)` and both aliases resolve from
  it, so a lowercase drive letter in `process.cwd()` can no longer silently disable `vi.mock`. A no-op on
  Linux/macOS. Measured before/after: the `RUN v…` banner goes `c:/…` → `C:/…` and the suite goes from 4
  files / 23 tests failing to **all 223 passing**.

- **`stack/environments.md`:** the Vercel project row and account row corrected from
  `roryskagen-5713/shop-roryskagen-com` to **`roryskagenart/shop.roryskagenart.com`**, with the team
  **slug** (`roryskagenart`) distinguished from the team **name** (`roryskagen`) — they are different
  strings, and neither was ever `roryskagen-5713`. Both ids are unchanged from the 2026-10-01 record,
  which is what makes this a rename rather than a different project.
- **T23's evidence** now cites the current Vercel identifier instead of the retired one.
- **The dated `sessions/2026-10-01.md` record was deliberately left alone** — it documents what was true
  then, and rewriting it would erase the evidence that the rename happened.

---

## [1.5.0] — 2026-10-06

Produced by a preflight that measured the gate baseline and found **four different test counts live in the
tree at once**. The count was right in two files and wrong in four.

### Added

- **T41 — the gate baseline was duplicated in six carriers, and four of them drifted.** Measured
  `main` = `42786bb7`: `vitest run` → **`223 passed / 15 files`**, while `AGENTS.md` said **137/11**,
  `protocols/verification.md` said **163/13**, and `protocols/preflight.md`, `scripts/preflight.sh`,
  `lib/fourthwall/AGENTS.md` and `scripts/AGENTS.md` all said **97/6**. **Root cause, and it was not
  carelessness:** `AGENTS.md` §5 named only *two* files to update when the count changed, so nothing
  could fail on the other four. **RESOLVED** by the single source of truth below.
- **T42 — the `/docs` palette table documents tokens and colours that no longer exist.**
  `lib/docs-content.ts:1159-1170` still advertises `--background` / `--card` / `--accent` at the retired
  Gallery Stone values, while `app/globals.css:12-51` defines `--brand-bg` / `--brand-fg` / … at the
  Skagen values. PR #14 changed the CSS and the config but not the copy. **OPEN — deliberately not fixed
  here**, because rewording public product copy is a product decision. Owner: Jaden.
- [`scripts/baseline.env`](scripts/baseline.env) — **the gate baseline, in one place.** `verify.sh` and
  `preflight.sh` source it; nothing inlines the number any more.
- [`scripts/check-baseline.sh`](scripts/check-baseline.sh) — a guard that **can actually fail**: it fails
  if any document that quotes the count disagrees with `baseline.env`, if the on-disk test-file count
  moves, or if `stack/overview.md`'s file list stops matching the count. Observed **red first** (6 FAILs)
  and then green — a guard nobody has watched fail is not a guard.

### Changed

- **The GitHub repository name was reconciled: `roryskagenart/shop.roryskagen.com` →
  `roryskagenart/shop.roryskagenart.com`.** Found at push time — `git push` reported
  `remote: This repository moved. Please use the new location`, and
  `gh api repos/…/shop.roryskagen.com` resolves with that `full_name`. `/AGENTS.md` §2 already documented
  the rename and was right; `stack/environments.md`, `plugins/registry.md`, `protocols/preflight.md`,
  `scripts/preflight.sh` and the `plans/README.md` blob link still used the old name. **T23 updated to
  MITIGATED.** The local `origin` URL was deliberately **not** changed — repointing the remote is a human
  decision (rule 4), and GitHub's redirect keeps it working.
- `verify.sh` now runs the baseline guard as a **third gate**, and its failure text points at
  `baseline.env` instead of at two named documents.
- Every carrier reconciled to the measured baseline; the measured counts are recorded with the command
  that produced them.
- `/AGENTS.md` §2 now **declares `v0.x.y` the release scheme** (the only space with tags; tags go on the
  **merge commit**), and §5 names every carrier plus the guard rather than two of six.
- `/AGENTS.md` §5's drift anecdote updated — the count has been 67, then 97, then 137, then 163, and is
  now 223.
- `lib/brand-config.ts` — the roadmap field **`version` renamed to `roadmapId`**, with the array's header
  stating that it is a roadmap and not a release record. The array is read by no component.
- **T24 → MITIGATED** (was OPEN). The scheme is now declared and enforced, but the public `/docs` page
  still words the `v1.x` roadmap phases as *"Release v1.2.0"* — surfaced rather than silently reworded.

### Fixed

- **`stack/environments.md` claimed `main` was UNPROTECTED.** Measured 2026-10-06:
  `gh api repos/…/branches/main --jq .protected` → **`true`**. The owner added protection after that note
  was written. **T27**'s point about `admin: false` blocking the *write* still holds — only the state had
  changed.
- **`.gitattributes` did not cover `.env`** — so `baseline.env`, a file bash *sources*, was exposed to
  `core.autocrlf = true`. `BASELINE_TESTS=223\r` is a different value from `223`, which would have made
  every comparison in the new guard fail and report stale counts on a clean tree. Caught by the
  `warning: LF will be replaced by CRLF` on `git add`, and by `git check-attr` returning `unspecified`.
  `*.env text eol=lf` added; **T32** extended.
- `stack/overview.md` test-file list: a **literal `\n`** joined three entries onto one line, and the list
  held **14 entries against a claimed 15** — `lib/fourthwall/__tests__/merch-catalog.test.ts` was missing.
- `lib/fourthwall/AGENTS.md` and `scripts/AGENTS.md` both undercounted the test files in
  `lib/fourthwall/__tests__/` (three named; four exist).
- `traps/register.md` — T40 was missing its `<a id="t40"></a>` anchor and its `**Source:**` line.

## [1.4.1] — 2026-10-04

### Added

- **T39 — a hidden product is still readable by direct slug.** `GET /v1/products/{slug}` on the
  **Storefront** API returns **200** with the full product for an `access: HIDDEN` product, while the
  collection listing omits it entirely. Measured on `gondoleu-soy-wax-candle`: storefront → 200,
  `access: HIDDEN`; `GET /v1/collections/{id}/products` for the same collection → 404.
  **Hidden means "not listed", not "not reachable."** Two consequences: `publishOnCreate: false` is a
  reasonable staging mechanism (**T37**) because nothing surfaces it in browsing, **and** staging is not
  access control — anyone with the slug can read it, so it must never carry anything sensitive. Also
  means a slug re-check is a valid verification path (**T28**) when the Platform API is unavailable.

## [1.4.0] — 2026-10-04

Produced by a measured merch launch: 6 Fourthwall products created and verified. Every entry below was
learned by hitting it, and **three of them correct claims this KB previously asserted.**

### Added

- **New skill [`skills/fourthwall-product-launch/SKILL.md`](skills/fourthwall-product-launch/SKILL.md)** —
  the full create-and-ship procedure, written from a launch that actually ran: the 605/274 catalogue
  split, the 45-template non-transparency subset, print-fit gating by aspect ratio, `profitMargin` as a
  USD amount, the `sizes` requirement, verify-by-re-`GET`, and a table of what the API **cannot** do.
- **T34 — "25 templates" was page 1.** `GET /product-templates` returns **25 rows against
  `total: 605`**; `?page=`/`?size=` are **silently ignored** (page 7 is byte-identical to page 1). The
  `total` field was in the response body that was read and ignored. A partial read here caused a product
  line to be wrongly scoped out of existence — the same error class as T33, one layer up. Enumeration
  requires a seed of real ids verified by direct lookup; `lib/fw-seeder/probe-templates.ts` does this.
- **T35 — a vendored project in `lib/` can hold the answer you are missing.** *Reported:* a
  `lib/fw-revops/` tree carried a complete measured API profile plus its own `.git` and a `.env.local`
  with 17 live credentials, **untracked by the parent repo**, so invisible to `git status`, to KB
  search, and to review. ⚠️ **Re-checked 2026-10-04 and the cited tree does not reproduce** — there is
  no `lib/fw-revops/` and no nested `.git` in this checkout. The *lesson* holds (the integrated
  `skills/fourthwall-product-catalog/` was answering T34 while an agent asserted 25 templates from the
  API); the *specific tree* does not, so do not cite it as proof of a credential-bearing nested repo.
- **T36 — upscaling and background-removal cannot manufacture what JPEG destroyed.** Cloudinary
  `e_background_removal` returns RGBA with **0 transparent pixels, 99.8% at alpha 224–255**; LANCZOS adds
  no information; colour-keying fails because the corners are mid-tone. Only **45 of 274** buildable
  templates avoid the transparency requirement.
- **T37 — publishing, renaming and tagging are dashboard-only.** `PATCH /products/{id}` → 405;
  `/access`, `/publish`, `/tags`, `/products/{id}/collections` → 404. `publishOnCreate` is create-time
  only. `PUT /availability` returns **200 but does not publish**, and **rewrites the slug** — a write
  disguised as a no-op.
- **T38 — promotions cannot publish, target, or reveal a hidden product.** The shop's promotion is
  `appliesTo: ENTIRE_ORDER` with no product selector; a promotion acts on carts, and a hidden product
  cannot enter one.
- **Three code defects fixed**, each measured before the fix:
  - `ProductTemplate.id` → **`productId`** — the wire format has no `id` field at all
  - `getTemplateAreas()` no longer filters on `available` — it turned a **live, orderable** template into
    an empty array, which reads as "no printable region" and silently stops a release
  - added the real `brand`, `supportsBackendRendering` and `slug` fields
- **`lib/fw-seeder/` gained `probe-templates.ts`** (read-only, GET-only catalogue probe that generates the
  template reference), **`placeholder-art.ts`** + **`placeholder-guard.ts`** — the guard makes third-party
  placeholder photography **structurally impossible to publish** via `createProduct`, with 13 tests.

### Changed

- **T13 — "There is no wall-art template" → RESOLVED, and the conclusion was wrong.** Wall art **is**
  available: `pro_15bc29bc8a324d449d` (Enhanced Matte Paper Poster, $5.50) and
  `pro_kRSsoYjwSoyyTEmWko5o0A` (Framed Matte Poster, $20.35), both verified live against the Platform API. The original
  entry generalised from a page-1 read — the exact failure T34 now names. Two products were shipped on
  these templates.
- **T03 — "there is no update endpoint" needs one addition.** `PATCH`/`PUT` on a product are indeed 405,
  but **`PUT /products/{id}/availability` does respond (200)** — it just does not change `access`. Worth
  recording because its side effect (slug rewrite) is not obvious from a 200.

### Removed

- **A vendored `lib/fw-revops/` tree (22M, untracked)** — *reported as removed; **not reproducible in
  this checkout**, see T35 above.* Its unique content was integrated into
  `skills/fourthwall-product-catalog/references/` (`product-create-schema.md`,
  `catalog-pull-notes.md`). Any tree removed for shipping live credentials must have been confirmed
  deleted with the credential file, not assumed.

---

## [1.3.0] — 2026-10-02

### Added

- **`stack/environments.md` → "Agent entry points — how a session actually starts."** The KB previously had
  no answer to *"how do I start a session?"* — which meant the agent answered it from memory instead of
  from a file. Now measured and written down: **the application UI is the only way to start a WorkBuddy
  session**; the integrated terminal is a command surface *inside* a running session, not a launcher.
- **The bundled-runtime inventory**, so nobody mistakes it for a CLI: `.workbuddy-ai/binaries/` holds
  `PortableGit`, `node/22.22.2-3`, `python/3.13.12` — they serve the agent's Bash tool.
- **A redaction protocol** — [`protocols/documentation.md`](protocols/documentation.md#5-redaction--this-repository-is-public)
  section 5. The KB had no rule for what may be committed out of a shell session, and this repository is
  **public**. The protocol states what to remove (other clients' names, internal hosts, foreign release
  versions, machine account names and absolute home paths) versus what to keep (public infrastructure names
  — naming a public SaaS is not client data, and runnable examples need real tool names), and adds the two
  sweeps to run before pushing any document that quotes shell output.

  Its most important part is the part that is easy to miss: **redacting the tip does not clean the history.**
  Every commit that ever held the terms still holds them and `git log -p` is public. While a branch is
  **unmerged**, a **squash merge** collapses it to one commit whose diff is the *net* change — clean if the
  tip is already redacted. Verify with `git diff <base>..HEAD | grep -cIE "<term>"` **before** merging;
  afterwards the only options are rewriting shared history or accepting the exposure.

### Changed

- **`skills/windows-app-not-found-diagnose` re-synced to `1.2.0`.** The source skill gained a **Failure D**
  row and a new **Step 0 — "Is there a CLI to find?"**, because that is the failure mode that produces a
  *false statement* rather than a failed command. It now covers: probing a **category** of names before
  asserting a negative about the category; recognising a GUI-only app from its install layout
  (`app.asar`, `resources/vendor/*.zip` = runtimes for the agent's Bash tool, not a user CLI); and the
  byte-level probe (`grep -c "CLAUDE.md" <binary>`) that decides which config files a CLI reads.

  Re-synced by copying the source over the ported copy and running
  [`scripts/normalize-skill-frontmatter.py`](scripts/normalize-skill-frontmatter.py) — **exactly one file
  changed, the other ten reported `unchanged`, and a second run reported `unchanged` too**, which is the
  idempotence the skills contract promises.

### Fixed

- **A false negative published in this repo's own report.** `docs/reports/2026-10-02-agent-usage-insights.md`
  asserted **"No such CLI is installed on this machine."** Re-probing a wider set of names found
  `claude` → **Claude Code `2.0.35`** on PATH. The claim was true about `codebuddy` and false about the
  machine. Corrected in place, and the corrected scope is now *"no WorkBuddy CLI exists here, but Claude
  Code does."* → [T33](traps/register.md#t33)

  The report's Verification-status table gained a third verified row for the probe.

### Documented — a known gap, not a surprise
- **Claude Code reads `CLAUDE.md`, not `AGENTS.md`.** Byte-level probe of the `2.0.35` binary:
  `grep -c "CLAUDE.md"` → **82**, `grep -c "AGENTS.md"` → **0**. A `claude` session opened in this repo
  therefore sees **neither** the root `AGENTS.md` **nor** anything under `docs/agentic/` — the whole KB is
  invisible to it. The bridge would be a one-line `CLAUDE.md` pointing at `AGENTS.md`; **deliberately not
  created**, and recorded so the gap is known.
- **Skill directories do not interoperate.** WorkBuddy reads `~/.workbuddy-ai/skills/` and
  `<repo>/.workbuddy-ai/skills/`; Claude Code reads `.claude/`. Moving a skill between them is a
  migration — which is the reason the ported skills live in `docs/agentic/skills/` as the vendor-neutral
  copy.

---

## [1.2.0] — 2026-10-02

### Fixed

- **A CRLF checkout would break the KB's own shell scripts.** `core.autocrlf = true` and there was **no
  `.gitattributes`**, so git rewrites the working tree to CRLF on checkout. Harmless for TypeScript,
  Markdown and JSON — but fatal for an executable: the shebang becomes `#!/usr/bin/env bash\r` and
  `./preflight.sh` fails with *bad interpreter*.

  Measured scope: `git ls-files --eol` → **107 files `i/lf w/crlf`**, and
  `git check-attr text eol` → **`unspecified`** for the new scripts. → [T32](traps/register.md#t32)

  Fixed with a **narrow** `.gitattributes`: `*.sh` and `*.py` pinned to `eol=lf`. The 107 CRLF files are
  cosmetic and deliberately left alone — repo-wide normalisation (`* text=auto eol=lf`) is a larger
  decision that would touch every file's worktree, and is **not** taken here.

---

## [1.1.0] — 2026-10-02

### Added

- **`docs/reports/` — the dev-report pattern, and its first entry.** A third document type, alongside
  `docs/releases/plans/` (forward-looking) and `docs/agentic/sessions/` (per-day record): a **retrospective
  analysis of how the project is being developed**, aimed at a human reviewing the process rather than an
  agent changing code.
  - [`docs/reports/README.md`](../reports/README.md) — the pattern: naming, five required sections
    (Provenance, Scope, Findings, Recommendations, Verification status), and the rules.
  - [`docs/reports/2026-10-02-agent-usage-insights.md`](../reports/2026-10-02-agent-usage-insights.md) —
    the first entry, converted from a generated HTML usage report.
- **A cross-project rule for reports.** Reports built from machine-wide telemetry describe **other projects
  and other clients**, and this repository is **public**. The pattern requires a report to be either scoped
  to this project or not committed, with the decision recorded either way.

### Changed

- **`/AGENTS.md`** and [`README.md`](README.md) routing tables now point at `docs/reports/`, marked as
  **not a rule source** — a report is dated and may be superseded, so it must never be cited as a rule.

### Notes

- **The first report carries machine-wide data, and it has been redacted** (recommendation R1 in the
  report, resolved 2026-10-02 as option **(b)**). It described an unrelated marketing site, a media/archive
  pipeline, and an unrelated release — none of which is this repository. Client, project, host and release
  names were removed; public infrastructure names were kept so the tooling examples stay runnable. The
  figures remain **machine-wide** and are labelled as such.
- **Two figures in the first report are flagged as unreliable** rather than reproduced as fact: the
  generator's "312 active hours" contradicts its own session-duration data, and most headline numbers are
  the generator's arithmetic, not re-derived. The report marks exactly two figures as verified — this
  repo's own gate baseline and its prettier baseline, both measured locally on 2026-10-02.
- The report's "verification gates" recommendation is **explicitly not adopted verbatim** — it is generic
  and partly wrong here (`next build` is not a usable local gate; `prettier:check` is not a gate at all).
  See [T31](traps/register.md#t31).

---

## [1.0.0] — 2026-10-02

Initial migration. The KB is created and populated from an agent runtime's local memory directory
(`.workbuddy-ai/`), which is gitignored and therefore invisible to collaborators and to review.

### Added

- **`/AGENTS.md`** — root agent contract: the six non-negotiable rules, the four-name collision table, the
  gate commands, and a routing table into this KB.
- **`protocols/`** — `preflight.md`, `verification.md`, `destructive-actions.md`, `release.md`,
  `documentation.md`, `knowledge.md`.
- **`stack/`** — `overview.md`, `environments.md`, `fourthwall.md`, `artwork-catalogue.md`.
- **`traps/register.md`** — the trap register, each entry with the measurement that proved it.
- **`skills/`** — 11 procedures ported from the runtime's skill directory, frontmatter normalised to the
  portable subset (`name`, `description`, `version`) plus provenance (`x-origin`, `x-migrated`).
- **`plugins/registry.md`**, **`mcp/README.md`**, **`mcp/mcp.example.json`** — extension surface, documented
  rather than assumed.
- **`scripts/`** — `preflight.sh`, `verify.sh`, `check-links.py`, `normalize-skill-frontmatter.py`.
- **`sessions/2026-10-01.md`** — distilled record of the first full working day on this repo.

### Changed

- **`.workbuddy-ai/memory/MEMORY.md` reduced 12,730 → 6,008 bytes.** It had exceeded the runtime's
  injection limit and was being silently truncated, which meant the bottom of the file — the release
  record — was never actually read by an agent. It is now a thin index: standing instructions, the name
  collision, access notes, the local verification commands, and pointers here. Domain knowledge moved
  into this KB (canonical) and `.workbuddy-ai/memory/DETAIL.md` (local overflow).

### Not migrated

Deliberate omissions, so the gap is explicit:

| Left behind | Why | Where it stays |
| :--- | :--- | :--- |
| Live credentials (`VERCEL_PAT_SECRET`, `IMPORT_ADMIN_PASSWORD`, Fourthwall API keys) | Secrets never belong in a public repo. The repo is **public**. | `.env.local`, Vercel project env |
| Runtime caches, session transcripts, telemetry | Not knowledge; machine-local and irreproducible. | Runtime storage |
| Third-party marketplace skills (`airbnb`, `obsidian`, `github`, `github-ai-trends`) | Not relevant to this project; they are vendored from a marketplace and are not ours to redistribute. | Runtime skill directory |
| `static-prototype-page-duplication`, `github-docs-mirror-readonly` | No static prototype and no docs-mirror surface exists in this repo. | Runtime skill directory |
| Vendor-specific persona files (`SOUL.md`, `IDENTITY.md`, `USER.md`) | Personal to one operator, not project knowledge. | User home directory |

### Known gaps

- Session history is **incomplete by design**. Only 2026-10-01 has a distilled record; earlier work exists
  only as git history. Future sessions should be appended as they happen rather than reconstructed.
- `mcp/mcp.example.json` is a template. No MCP server is currently configured for this project — the
  runtime's MCP config was empty at migration time.

### Found during the migration

Two things the migration itself surfaced, both recorded as traps:

- **[T31](traps/register.md#t31) — `npm run prettier:check` was never a green gate.** Measured:
  **91 of 103 tracked files fail at `87cf568`**, and the check is not referenced by CI. It had been
  described as a gate in the release protocol. Corrected there, in
  [`stack/overview.md`](stack/overview.md), and in [`protocols/documentation.md`](protocols/documentation.md).
- **`\s` in `grep -E` is a silent failure.** The first version of `verify.sh` used `grep -E '^\s+Tests\s+'`
  to parse the vitest summary. `\s` is PCRE, not ERE, so the match never fired — and because the miss was
  handled, a **fully green test run reported "test count DIFFERS from the baseline"**. Fixed by stripping
  ANSI escapes and using `[[:space:]]`. The failure path was observed failing, so it is known to work.
- **`check-links.py` was added because the KB needed a guard, and it failed on first run.** It found
  **5 missing link targets and 8 broken anchors** in this migration's own output — the `#t01`-style trap
  anchors did not exist as headings, and four `AGENTS.md` links were one directory level short. Fixed, then
  green. A guard that has never been seen failing is not a guard.

### Secret scan

Every file added by this migration was scanned against **all 17 values in `.env.local`** and against
credential patterns (`ghp_`, `github_pat_`, `sk-`, `AKIA`, `xox[baprs]-`, PEM headers). No secret leaked.

Three hits were returned and are **expected**: the values of `NEXT_PUBLIC_FW_API_URL`,
`NEXT_PUBLIC_FW_COLLECTION` and `NEXT_PUBLIC_VERCEL_URL`. `NEXT_PUBLIC_*` variables are **inlined into the
client bundle at build time**, so their values are public by design — they are configuration, not
credentials. The distinction is worth stating because it is exactly the kind of thing that gets
over-corrected later: **do not treat a `NEXT_PUBLIC_*` value as a secret, and do not treat the absence of
one from this repo as a gap.**
