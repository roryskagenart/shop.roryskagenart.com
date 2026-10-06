# Plan — Preflight & baseline reconciliation

**Status:** DRAFT · implementation on `fix/preflight-and-baseline-reconciliation` · **no PR open yet**
**Target release:** `v0.2.0` (catch-up — see [`../RELEASES.md`](../RELEASES.md)) · **KB:** 1.5.0
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
release version scheme. Record the four untagged releases in a ledger. Register the two defects found and
not fixed.

**Out — deliberately.**

| Not done | Why |
| :--- | :--- |
| Rewording the public `/docs` `v1.x` "Release" labels | User-visible product copy is a product decision. Surfaced as **T24** residual. |
| Fixing the `/docs` palette table | Same reason. Registered as **T42**. |
| Tagging `v0.2.0` | A tag is a remote write needing explicit approval, and the target should be chosen against merged `main`. |
| Any application behaviour change | The only `lib/` edit renames an unread field. |

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
