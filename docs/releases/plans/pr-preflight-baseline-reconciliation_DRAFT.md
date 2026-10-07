# Plan — Preflight & baseline reconciliation

**Status:** DRAFT · implementation on `fix/preflight-and-baseline-reconciliation` · **PR #15** open as a
draft, CI green. **OQ1 answered and executed**; OQ2–OQ4 open, and **each one's recommendation is *no change
inside this PR***.
**Target release:** `v0.2.0` (catch-up — see [`../RELEASES.md`](../RELEASES.md)) · **KB:** 1.7.1
**Author:** Buddy, for Jaden · **Opened:** 2026-10-06

---

## 1. Why

A session preflight on 2026-10-06 turned up **four different test counts live in the same tree**. The
number was right in two files and wrong in four. That is not a typo — it is a guard that could not fail.

The consequence is worse than a wrong number. `verify.sh` fails a clean tree with *"a DROP means a guard
was deleted"* when in fact nothing was deleted, and the number a reader trusts depends on which file they
happen to open. An agent can therefore "verify" a change against a baseline that was never true.

Alongside it, two smaller drifts: a test-file list that claimed 15 entries and held 14, and a public
`/docs` page describing a design-token set that has not existed since PR #14.

## 2. Scope

**In.** Make the gate baseline single-sourced and machine-checked. Reconcile every carrier. Declare the
release version scheme. Record the four untagged releases in a ledger. Register **six** defects — **T41–T46**
— and fix the three that were fixable here: a dead public footer link (**T45**), install instructions that
named a package manager this repo does not use (**T46**), and the gate's own Windows failure mode
(**T44**).

**Out — deliberately.**

| Not done | Why |
| :--- | :--- |
| Rewording the public `/docs` `v1.x` "Release" labels | User-visible product copy is a product decision. Surfaced as **T24** residual. |
| Fixing the `/docs` palette table | Same reason. Registered as **T42**. |
| Any application behaviour change | The only `lib/` edit renames an unread field. |

**Held out of scope, then approved separately — and done:** *tagging `v0.2.0`*. A tag is a remote write
needing explicit approval, and the target had to be chosen against merged `main`, so it was excluded here
and executed on Jaden's explicit word later in the same session. **Result:** annotated tag object
`870d2748`, dereferencing to `42786bb7` — OQ1's recommendation, followed.

## 3. What changes

| # | Change | Files |
| :--- | :--- | :--- |
| 1 | **Single source of truth** for the gate baseline | `docs/agentic/scripts/baseline.env` (new) |
| 2 | **A guard that can fail** — disagrees → FAIL; also checks the on-disk test-file count and `overview.md`'s list length | `docs/agentic/scripts/check-baseline.sh` (new) |
| 3 | `verify.sh` **sources** the baseline and runs the guard as a third gate; `preflight.sh` sources it too | `docs/agentic/scripts/{verify,preflight}.sh` |
| 4 | Six carriers reconciled to **223 passed / 15 files** | `AGENTS.md`, `docs/agentic/protocols/{preflight,verification}.md`, `docs/agentic/stack/overview.md`, `lib/fourthwall/AGENTS.md`, `scripts/AGENTS.md` |
| 5 | The update rule now names **every** carrier plus the guard | `AGENTS.md` §5 |
| 6 | `v0.x.y` declared the release scheme; `v1.x` relabelled a roadmap | `AGENTS.md` §2, `lib/brand-config.ts`, `docs/agentic/stack/overview.md` |
| 7 | **T41** (RESOLVED), **T42** (OPEN), **T24** → MITIGATED; T40's missing anchor and `Source` restored | `docs/agentic/traps/register.md` |
| 8 | Release ledger + session record | `docs/releases/RELEASES.md` (new), `docs/agentic/sessions/2026-10-06.md` (new) |
| 9 | KB **1.4.1 → 1.5.0** (two new traps = MINOR) | `docs/agentic/{VERSION,CHANGELOG.md,README.md}`, `docs/agentic/scripts/README.md` |
| 10 | The Vercel team slug and project name corrected; **T43** registered, cross-linked from T23 | `docs/agentic/stack/environments.md`, `docs/agentic/traps/register.md` |
| 11 | KB **1.5.0 → 1.6.0** (T43, T44 = MINOR) | `docs/agentic/{VERSION,CHANGELOG.md,README.md}` |
| 12 | **T44 — `vi.mock` hoisting restored on Windows, fixed in `verify.sh`.** An earlier attempt canonicalised Vitest's `root` in `vitest.config.ts` and is **reverted**: it only appeared to work because `node_modules` was bun-installed at the time. `verify.sh` now re-enters the repo root via `pwd -W` before any gate runs | `docs/agentic/scripts/verify.sh`, `vitest.config.ts` |
| 13 | KB **1.6.0 → 1.6.1** (PATCH — the reconciliation skill now says to confirm a gate actually ran) | `docs/agentic/{VERSION,CHANGELOG.md,README.md}`, `docs/agentic/skills/docs-reconciliation-release/SKILL.md` |
| 14 | **T45** — the footer's *"Rory Skagen Studio Archive"* link pointed at `shop.roryskagen.com` (**NXDOMAIN**, on every public page). Now reads `BRAND_CONFIG.domains.shopCustomDomain` | `components/layout/footer.tsx` |
| 15 | **T46** — three package managers referenced, only npm real. README `pnpm install` / `pnpm dev` → `npm ci` / `npm run dev`; `AGENTS.md` §3 now warns that the installer changes test behaviour, and says to run the gate through `verify.sh` on Windows | `README.md`, `AGENTS.md` §3 |
| 16 | KB **1.6.1 → 1.7.0** (T45, T46 = MINOR) | `docs/agentic/{VERSION,CHANGELOG.md,README.md}` |
| 17 | **Record corrections** — the session record's reverted-fix claim and its "residual" struck; this plan's registry row and entry 12 corrected | `docs/agentic/sessions/2026-10-06.md`, `docs/releases/plans/README.md`, this file |
| 18 | KB **1.7.0 → 1.7.1** (PATCH) — the reconciliation skill's step 8 still prescribed the **reverted** `vitest.config.ts` fix. Corrected, plus the T46 install-method lesson and two pitfalls on writing a fix's record | `docs/agentic/skills/docs-reconciliation-release/SKILL.md`, `docs/agentic/{VERSION,CHANGELOG.md,README.md}` |

## 4. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| R1 | The new guard is too broad and fails on a legitimate historical count, so someone disables it | Medium | High — a disabled guard is worse than none | Exemption list is explicit, documented with a reason per entry, printed by the script, and **editing it shows up in a PR**. Only `docs/reports/**` and `docs/releases/plans/**` are exempt. |
| R2 | The guard is too narrow and misses a future carrier | Medium | Medium | Check 2 is **repo-wide** (`git grep` over all tracked `*.md`/`*.sh`), not a list — a new carrier is caught on the day it drifts. |
| R3 | `grep -c` exits 1 on a zero count and breaks an `&&` chain | High if written naively | Medium | Every `grep -c` in the new script is followed by `|| true`. Known trap in the project memory. |
| R4 | Renaming `version` → `roadmapId` breaks a consumer | **Low — verified** | Low | `grep -rn '\.roadmap\b\|\.version\b'` over `*.ts`/`*.tsx`: **zero consumers**. `BRAND_CONFIG.roadmap` is read by nothing; `tsc` is run anyway. |
| R5 | The guard adds latency to the gate | Low | Low | Pure `git grep` + `awk`; the gate sequence is ~15 s dominated by vitest. Measured in the run recorded below. |
| R6 | Reconciling a number "upward" hides a deleted guard | Low | High | The baseline was **re-derived from a real run**, not read from a document. The drop-means-deleted rule is preserved verbatim in `baseline.env`. |

## 5. Evidence appendix

Claim → the command or `file:line` that proves it. All measured 2026-10-06 at `main` = `42786bb7`.

| Claim | Evidence |
| :--- | :--- |
| The real baseline is 223 / 15 | `./node_modules/.bin/vitest run` → `Test Files 15 passed (15)` / `Tests 223 passed (223)` |
| Typecheck is clean | `./node_modules/.bin/tsc --noEmit` → 0 errors |
| Four counts were live at once | `git grep -nE '[0-9]{2,} (passed\|passing)' -- '*.md' '*.sh'` |
| `AGENTS.md` said 137/11 | `AGENTS.md:55`, `:103` (pre-change) |
| `verification.md` said 163/13 | `docs/agentic/protocols/verification.md:13` (pre-change) |
| Four files said 97/6 | `docs/agentic/protocols/preflight.md:56`, `docs/agentic/scripts/preflight.sh:26-27`, `lib/fourthwall/AGENTS.md:54`, `scripts/AGENTS.md:48-49` (pre-change) |
| `overview.md` listed 14 against a claimed 15 | `docs/agentic/stack/overview.md:97` vs `:103-114` (pre-change); the missing entry was `lib/fourthwall/__tests__/merch-catalog.test.ts` |
| A literal `\n` joined three entries | `docs/agentic/stack/overview.md:106` (pre-change) |
| The update rule named two of six carriers | `AGENTS.md:105-108` (pre-change) |
| `BRAND_CONFIG.roadmap` has no consumers | `grep -rn 'BRAND_CONFIG' --include='*.ts' --include='*.tsx' .` → 6 files, none touching `.roadmap` |
| Tags go on merge commits | `git rev-parse v0.1.0^{commit}` = `31e47f2`; `gh api repos/…/pulls/1 --jq .merge_commit_sha` = `31e47f2` |
| The three pruned branches held nothing unique | `git diff --diff-filter=A --name-only origin/main origin/<branch>` → empty for all three |
| `/docs` documents retired tokens | `lib/docs-content.ts:1159-1170` vs `app/globals.css:12-51` vs `lib/brand-config.ts:34-72` |
| The guard fails before it passes | `check-baseline.sh` run pre-fix → **6 FAILs**; post-fix → **0** |
| The Vercel project is `roryskagenart/shop.roryskagenart.com`, not `roryskagen-5713/shop-roryskagen-com` | `GET /v9/projects/prj_u3hPHBRFkibIkIkthndzS1sjvhKJ` → `name: shop.roryskagenart.com`; `GET /v2/teams/team_lD7ZSbm44CpPmByF9eN22dJT` → `slug: roryskagenart`, `name: roryskagen`; `GET /v2/teams` → that team only. Both ids are **unchanged** from the 2026-10-01 record ⇒ a rename, not a different project |
| The retired `.vercel.app` alias still resolves | `GET /v9/projects/…/domains` → `shop.roryskagenart.com` **and** `shop-roryskagen-com.vercel.app`, both `verified: true` |
| The rename landed 2026-10-03 | project `link.createdAt` = `1790895069955` → 2026-10-01 22:51 UTC; `link.updatedAt` = `1791060791369` → 2026-10-03 20:53 UTC |
| The tag dereferences to a commit on `main` | `gh api repos/…/git/refs/tags/v0.2.0` → `type=tag` → `870d2748` → `42786bb7`; `git merge-base --is-ancestor 42786bb7 origin/main` → true |
| A lowercase drive letter in the cwd silently disables `vi.mock` | `vitest run` → banner `c:/…`, 4 files / 23 tests fail; `vitest run --root <abs>` → banner `C:/…`, all 223 pass. Probe: `vi.mock('./lib/utils', …)` + `import { sentinel }` → `undefined` |
| The 4 failing test files are unmodified | `git hash-object lib/fw-seeder/__tests__/collection.test.ts` = `b454abc…` = `git rev-parse HEAD:…` |
| The gate is green after the `verify.sh` fix | `bash docs/agentic/scripts/verify.sh` → `tsc` 0 errors, 223 tests / 15 files, all gates green, exit 0 |
| `npm test` is green on an npm tree | `npm test` → 223 passed / 15 files, exit 0. The earlier all-suites *"Vitest failed to find the current suite"* failure had been recorded on a **bun** tree |
| The `vitest.config.ts` workaround is gone | `git diff origin/main -- vitest.config.ts` → empty |
| The tree is npm-installed, not bun | `ls node_modules/.bin` → 28 extension-less + 28 `.cmd`, **0** `.exe`. The earlier bun tree: 28 `.exe` + 28 `.bunx`, 0 npm shims |
| `shop.roryskagen.com` does not exist | `curl -sS "https://dns.google/resolve?name=shop.roryskagen.com&type=A"` → **`Status: 3`** (NXDOMAIN); `shop.roryskagenart.com` → `Status: 0` |
| Every relative link and anchor resolves | `python docs/agentic/scripts/check-links.py` → 54 files, **182** relative links resolved, 0 broken |

## 6. Gates

```bash
bash docs/agentic/scripts/check-baseline.sh   # new guard — must be green
bash docs/agentic/scripts/verify.sh           # typecheck + tests + the guard
python docs/agentic/scripts/check-links.py --root .
```

**Test count must not drop** — 223 is the baseline, and a drop means a guard was deleted.

## 7. Open questions

Each carries a recommendation. A question without one is a stall.

**OQ1 — Where does the `v0.2.0` tag go?**
*Recommendation: `42786bb7`, on the merged `main`.* It is PR #14's `merge_commit_sha`, so it matches the
verified `v0.1.0` convention (tag the merge commit), and it is the last commit of the four untagged PRs —
the state that was actually live. The alternative, tagging *this* PR's merge commit, would label a
docs/tooling change "Staged Catalogue", which it is not.
**Answered and executed 2026-10-06** — tagged at exactly `42786bb7`, on Jaden's explicit approval.

**OQ2 — Fix the `/docs` palette table now, or hold it?**
*Recommendation: hold it, as done.* It is a real defect (T42) and the fix is mechanical — derive the table
from `app/globals.css`. But it rewrites public copy, and bundling it here would make this diff harder to
review against its stated purpose. A separate `docs/` change, with a guard that derives the table from the
CSS, is the better shape.

**OQ3 — Should `check-baseline.sh` be a CI step, not just a local gate?**
*Recommendation: yes, and it is cheap.* CI currently runs `npm ci` → `npm run lint` → `npm test`; the guard
is `git grep` over the tree and needs no toolchain. **Not done in this plan** because it edits
`.github/workflows/ci.yml`, a separate concern. Flagged so it is not lost.

**OQ4 — Is `verify.sh` the right home for a docs guard?**
*Recommendation: yes, for now.* `verify.sh` is described as "the gate sequence", and a guard nobody runs is
not a guard. If the sequence grows further, the docs guard should split into a `verify-docs.sh` that
`verify.sh` calls — the invocation stays one command either way.

---

> **None of OQ2–OQ4 changes anything inside this PR.** OQ2's recommendation is to *hold*, OQ3's is to do it
> as a **separate change**, and OQ4's is to *keep the current arrangement*. All three therefore resolve to
> "nothing to do here" — accepting them as written is what clears the draft flag, and no further work is
> implied. OQ3 does leave one follow-up item (`.github/workflows/ci.yml`), tracked separately.
