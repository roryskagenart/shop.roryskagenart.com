# DRAFT — PRD: v0.3.0 "Launch Playground"

| | |
| :--- | :--- |
| **Status** | DRAFT — not approved, not started. **Blocked on OQ1–OQ7** |
| **Created** | 2026-10-04 |
| **Supersedes** | nothing. **Successor to** `pr-merch-catalog-v0.2.0_DRAFT.md`, which is superseded *in execution* — v0.2.0 built 6 hidden products and stopped |
| **Scope** | A local playground for composing, previewing and approving new Fourthwall products, with async status and a Supabase-backed audit trail |
| **Release** | `v0.3.0` — see **OQ7**; the version scheme is still contested (**T24**) |

> This is a **draft**. Nothing here is implemented. No route, table, migration or product has been
> created by this document. It changes no production state.

---

## 0. What this is, and what it is not

### The one-sentence goal

> **After this release, Rory can compose a product from a locally cached template registry, see its
> readiness resolve asynchronously, and route it through an approval gate — with every decision
> recorded — and nothing becomes publicly visible without a human acting in the Fourthwall dashboard.**

### The load-bearing constraint

**There is no publish endpoint** (**T37**). `publishOnCreate` is a create-time-only boolean; `PATCH`,
`/access`, `/publish` are 405/404. So this release **cannot** launch anything. "Launch approval" here
means *a human clicks publish in the dashboard*. Any UI implying otherwise will be lying.

### In scope

- **Local template-registry cache** generated from the existing `probe-templates.ts`, with `--check`.
- **Async status** for a composed product: the request returns immediately, state resolves over
  polling or server action, status is durable in Supabase.
- **Selection paths**: user search over the cached registry, plus a recommendation / random pick.
- **Approval wizard**: draft → review → approved → *awaiting manual dashboard publish*.
- **Administration dashboard**: list drafts, inspect the audit trail, surface failures.

### Explicitly NOT in scope

| Not this release | Why |
| :-- | :-- |
| Publishing, or any publish-path code | **T37** — no API path exists. Dashboard-only, always. |
| Renaming or tagging a created product | **T37** — dashboard-only. |
| Size enumeration from the API | **RESOLVED** — readable at `colorVariants[].sizeVariants[].size`. See **OQ4**. |
| Originals / one-off priced pieces | **T12** — structurally impossible via API. Dashboard-only, permanently. |
| Removing the fabricated-catalogue fallback | **T01** — still the defect this release does not fix. Tracked separately. |
| Touching the studio site's code or content | **AGENTS.md** rule 3. This release reads a database; it does not modify that project. |

---

## 1. Verified starting state

Measured 2026-10-04 on branch `kb/1.4.0-merch-launch-codification`, HEAD `5f065ba`.

| Fact | Value | Where |
| :-- | :-- | :-- |
| Tagged releases | **only `v0.1.0`** | `git tag -l` |
| `brand-config.ts` claims | `v1.1.0`…`v1.5.0` roadmap | `lib/brand-config.ts:69-96` |
| KB version | `1.4.1` | `docs/agentic/VERSION` |
| Gates green at | `tsc` 0 errors, **163 passed / 13 files** | `bash docs/agentic/scripts/verify.sh` |
| Seeder modules | 10 files incl. `probe-templates.ts`, `placeholder-guard.ts` | `lib/fw-seeder/` |
| App routes | no admin/playground route exists | `find app -maxdepth 2 -type d` |
| Shop-side Supabase code | **none** | grep `supabase` across `lib/`, `app/` |
| Shop-side Supabase env vars | **none** | grep `process.env` across `lib/` |
| Catalogue | 605 templates, 274 backend-renderable | `docs/releases/templates/verified-templates.json` |
| Products created in v0.2.0 | 6, **all `PUBLIC`** (published 2026-10-04) | `docs/releases/created-products.v0.2.0.md` |
| Known orphan | 1 product, 1 variant — **now `ARCHIVED`**, still listed (**T39**) | same, "Orphan" table |

---

## 2. Design decisions

### D1 — The registry is a file first, a database second

The 605-template catalogue already ships as `catalog_full.csv` (150 KB) and is regenerable offline
with `probe-templates.ts --check`. **The cache is a derived file, not a database table.** Supabase
stores *playground state* — drafts, approvals, audit — never a second copy of the catalogue.

**Why:** a cache you cannot verify offline is a cache you cannot trust. `probe-templates.ts --check`
fails on drift; a DB row does not.

### D2 — Async status resolves in the database, not in memory

The T01 lesson is specific: an in-process `Map` cart produced a real $28,000 cart because nothing
persisted and nothing threw. Status that lives in a serverless instance's memory dies with the
instance and is indistinguishable from "still working". Every composed product gets a durable row
the moment it is accepted.

### D3 — "Ready" means *ready for a human to publish*, and the UI says so

Status vocabulary is fixed and cannot imply automation:

```
draft → composing → ready_for_review → approved → AWAITING_MANUAL_PUBLISH
                                     ↘ rejected → draft
```

There is deliberately no `published` state this release can reach. The terminal state is
`AWAITING_MANUAL_PUBLISH`, and the dashboard renders the slug and productId to paste into
Fourthwall. **OQ2** puts this to you.

### D4 — Approval is a record, not a gate on the API

Because publishing cannot be automated (**T37**), the approval wizard's value is **the audit trail**:
who approved what, with which template, artwork, region and payload hash. It makes the irreversible
create deliberate. It does not prevent the create — `placeholder-guard.ts` does that.

### D5 — Selection search is over the cached registry; recommendation is seeded random

Search is a client-side filter over the cached file (605 rows is trivial). "Surprise me" is a seeded
random pick restricted to templates that pass the buildable predicate — `supportsBackendRendering`
true **and** at least one area — so a random choice never dead-ends. **OQ3** asks whether
recommendation should rank instead of sample.

---

## 3. Task inventory

Ordered by dependency. Every task is checkable.

### Phase A — Registry cache (no database, no UI)

| # | Task | Done when |
| :-- | :-- | :-- |
| A1 | Generate `template-cache.json` from `catalog_full.csv` + a new probe run | `probe-templates.ts --out` writes it; `--check` passes |
| A2 | Add `--check` coverage for the cache | stale cache exits 1 (**T-pattern**: compare data, not bytes) |
| A3 | Record `buildable` predicate per template | `supportsBackendRendering === true && areas.length > 0` |
| A4 | Tests for A1–A3 with a 3-row fixture | vitest **and** tsc green — both (**T15**) |
| A5 | Update `BASELINE_TESTS`/`BASELINE_FILES` + `overview.md` in the same change | `verify.sh` passes |

### Phase B — Supabase (blocked on **OQ1**, gated on backup)

| # | Task | Done when |
| :-- | :-- | :-- |
| B1 | **Take and verify a dump of the target database** | dump written + `verify-backup.ts` passes. **Nothing proceeds without this.** |
| B2 | Migration: `playground_drafts`, `approval_events` | applied to a scratch DB first, then live |
| B3 | RLS policies, scoped to shop read + service-role write | a `viewer`-role session sees zero draft rows (studio precedent: roles carry no claim) |
| B4 | Server-only client; no key reaches the browser | `NEXT_PUBLIC_*` set only for the publishable key, if any |
| B5 | Env vars added to `.env.example` by **name only** | no values in the repo (**AGENTS.md** rule 6) |
| B6 | Tests: every query path mocked, no network | vitest + tsc green |

### Phase C — Async status API

| # | Task | Done when |
| :-- | :-- | :-- |
| C1 | `POST /api/playground/drafts` → durable row, returns id | 201 + row readable after the response |
| C2 | `GET /api/playground/drafts/{id}` → status poll | 200 with one of the D3 states |
| C3 | Server action to advance a transition | invalid transition → 409, not a silent no-op |
| C4 | Readiness computation: buildable + artwork fits region + **sizes resolved** | refuses `ready_for_review` while sizes are unresolved (**OQ4**) |
| C5 | Idempotency key on create | a retried POST does not create a second draft |

### Phase D — UI

| # | Task | Done when |
| :-- | :-- | :-- |
| D1 | Playground page: search the cached registry | search + filter over 605 rows, no network |
| D2 | Recommendation / random picker | never returns a non-buildable template |
| D3 | Composer form: artwork, template, region, sizes | sizes cannot be silently omitted (**T06**) |
| D4 | Live status panel, polls C2 | shows terminal `AWAITING_MANUAL_PUBLISH` copy verbatim |
| D5 | Approval wizard: draft → review → approve/reject | every transition written to `approval_events` |
| D6 | Admin dashboard: drafts, audit, failures | a failed draft is visible, not just absent |

### Phase E — Docs and gates

| # | Task | Done when |
| :-- | :-- | :-- |
| E1 | New skill or extend the launch skill with the playground procedure | cited `file:line` |
| E2 | Trap entries for anything new this release proves | with evidence |
| E3 | `bash docs/agentic/scripts/verify.sh` | both gates green |
| E4 | `prettier --write` on touched files only | not repo-wide (**T31**) |

---

## 4. Sequencing and critical path

```
OQ1 (which database?) ──► B1 (dump+verify) ──► B2/B3 ──► C1 ──► D1–D6 ──► E1–E4
                                    │
                                    └─ blocked if OQ1 = shared project and no dump yet

A1─A5 (registry cache) ──► D1, D2, D3     ← independent of Supabase entirely
```

**A and B can run in parallel.** Phase A needs no database and no answer to OQ1, so the cache work
should not wait on the database decision. That is the single biggest scheduling win here.

**The critical path is B1.** It is a dump on a Free-plan database with no platform backup and no
PITR (`docs/runbooks/database-backup-restore.md:218` in the studio repo). Everything downstream is
gated on it.

---

## 5. Risk register

| Risk | Severity | Mitigation |
| :-- | :-- | :-- |
| A write to a database whose only backup is a file on one machine | **High** | **B1 first.** Free plan: no platform backups, no PITR. |
| "Ready to launch" misread as "published" | **High** | D3 vocabulary is fixed and terminal state is `AWAITING_MANUAL_PUBLISH` (**OQ2**) |
| Hidden products are readable by slug | **Medium** | **T39** — staging is *not listed*, not *unreachable*. Never put anything sensitive in a staged product. |
| Sizes read from the wrong depth → silent 1-variant products | **Medium** | Read `colorVariants[].sizeVariants[].size`, not `sizeGuide` (**OQ4**). Do not relax (**T06**) |
| Placeholder art published | **Low** | `placeholder-guard.ts` — structural, on the only publish path |
| RLS regression in the studio project | **Medium** | B3 + B6; read-only shop access preferred (**OQ1**) |
| Test count drift | **Low** | A5 in the same change; `verify.sh` fails loudly |

---

## 6. Do not do yet

- **Do not** publish anything, or write a "publish" button that implies capability (**T37**).
- **Do not** read sizes from `sizeGuide` or `minimumOrdersNumber` — both are empty/scalar (**OQ4**).
  Read `colorVariants[].sizeVariants[].size`. Inventing a `sizes` array is how the mugs got 1 variant (**T06**).
- **Do not** store the catalogue in Supabase (D1).
- **Do not** fix **T01** (fabricated products) inside this release. It is a separate defect with a
  different blast radius, and the fix is deletion, not guarding.
- **Do not** create a private staging collection — collections have no `private` flag and
  `PUT /collections/{id}/products` replaces the whole list (**T05**).
- **Do not** attempt a publish via a promotion — promotions act on carts and hidden products cannot
  enter one (**T38**).

---

## 7. Open questions

**A question without a recommendation is a stall. Each carries one.**

### OQ1 — Which Supabase project?

The shop has **no Supabase code and no Supabase env vars today**, and its own KB says *"Supabase
belongs to the separate Studio site project, not this shop. Do not conflate them."*
(`docs/agentic/mcp/README.md:72`, `plugins/registry.md:28`). That is a documented default, not one of
the six hard prohibitions — overridable, but a reversal that should be written down.

**Recommendation: a separate project, same account.** The playground needs ~4 tables, not the studio's
205-artwork catalogue. A shared project inherits a hardened RLS posture, a `profiles` schema with a
known recursion history, and a `profiles` table of 5 rows — none of which is worth the coupling. If
you want the shared project instead, B1 becomes non-optional and the RLS work in B3 widens.

### OQ2 — Is `AWAITING_MANUAL_PUBLISH` the right terminal state name?

**Recommendation: yes**, and keep it verbose. The whole value of this release is not implying
automation that does not exist. If it reads too long in the UI, render "Ready to publish" as the
label and keep the machine state verbose.

### OQ3 — Recommendation: sample or rank?

**Recommendation: seeded random among buildable templates.** Ranking needs a quality signal nobody
has. Sampling is honest, reproducible from a seed, and never dead-ends. Revisit when real sales data
exists.

### OQ4 — Where do sizes come from?

**RESOLVED 2026-10-04 — readable from the API.** `GET /product-templates/{productId}` returns sizes
**nested** at `colorVariants[].sizeVariants[].size`. Measured: **14** on `pro_15bc29bc8a324d449d`
(Enhanced Matte Paper Poster), **36** on `pro_kRSsoYjwSoyyTEmWko5o0A` (Framed Matte Poster), **1**
(`"Unscented"`) on `pro_N__f9U5XQJqcP_oCvwk2rw` (Soy Wax Candle). The top-level `sizeGuide` is
`{url: null, content: null}` and `minimumOrdersNumber` is a scalar — neither carries sizes, which is
almost certainly how the earlier "no sizes field exists" claim was reached.

**The launch already proved this**: it read sizes from this endpoint to avoid exactly the hand-transcription
this question proposed, and caught that `5" x 7"` exists on one poster template but not the other.

> ⚠️ **Corrected:** this document previously said sizes were unreadable and recommended per-template
> config transcription. That was wrong, and it would have built a maintenance burden around a capability
> the API already has. The false claim also sat in the `ProductTemplateDetail` docstring
> (`lib/fw-seeder/types.ts`) and has been corrected there. → **T06**, **T34**

**Recommendation: read sizes live, cache them in the registry, and intersect across templates when one
config spans several.** `C4` should refuse `ready_for_review` if `colorVariants` is absent or empty —
a template that reports no sizes has not been probed, which is different from a template with one size.

### OQ5 — Auth for the playground and admin dashboard?

The shop has a Basic-auth gate and a documented `/import` password-prompt issue (**T29**). This
release adds two surfaces that mutate state.

**Recommendation: reuse the existing Basic-auth gate for v0.3.0** and do not build GitHub OAuth here.
A separate PR for OAuth is already contemplated (`pr-gh-oauth_DRAFT.md`, PR #2).

### OQ6 — Do the 6 hidden products become playground drafts?

**Recommendation: no — leave them.** They exist and are verified. Migrating them into draft rows
invites a re-create against **T03**. Reference them read-only by `productId`.

### OQ7 — Which version number?

`git tag` shows only `v0.1.0`; `lib/brand-config.ts:69-96` claims a `v1.x` roadmap; the previous plan
used `v0.2.0` (**T24**).

**Recommendation: `v0.3.0`**, continuing the tag line, and relabel the `v1.x` roadmap entries in the
same change so the two stop contradicting each other. **This is your call and I have not decided it.**

---

## 8. Release mechanics

- **Branch:** `docs/launch-playground-v0.3.0` for this document alone; `feat/launch-playground` for
  implementation. Open as a **draft** while OQ1–OQ7 are open.
- **Register** this plan in [`README.md`](README.md) in the same PR.
- **Do not** edit `CHANGELOG.md` or a canonical context file from a plan — those change when the work
  executes.
- **Gates:** `tsc --noEmit` and `vitest run`, both always (**T15**). Not `prettier:check` (**T31**).
- **Never stage:** `.env*`, `tsconfig.tsbuildinfo`. Do not commit `tsconfig.json` (Next rewrites it).
- **No deploy. No push without explicit per-release approval.**
- **Before any Supabase write:** B1, and **OQ1** answered.

---

## Appendix A — Claim → evidence

| Claim | Evidence |
| :-- | :-- |
| Only `v0.1.0` is tagged | `git tag -l` → `v0.1.0` |
| `brand-config.ts` claims a `v1.x` roadmap | `lib/brand-config.ts:69-96` |
| KB is at `1.4.1` | `docs/agentic/VERSION` |
| Gates green: 163 tests / 13 files | `bash docs/agentic/scripts/verify.sh` |
| Shop has **no** Supabase code | grep `supabase` over `lib/`, `app/` → docs prose only |
| Shop has **no** Supabase env vars | grep `process.env` over `lib/` → `FOURTHWALL_*`, `NEXT_PUBLIC_FW_*`, `NEXT_PUBLIC_GTM_ID` only |
| Catalogue: 605 templates, 274 backend-renderable | `docs/releases/templates/verified-templates.json`; re-derivable via `probe-templates.ts --check` |
| Full catalogue already ships as a 150 KB CSV | `docs/agentic/skills/fourthwall-product-catalog/references/catalog_full.csv` |
| 6 products created, all `PUBLIC` | `docs/releases/created-products.v0.2.0.md` |
| One orphan product, 1 variant, now `ARCHIVED` | same, "Orphan" table |
| No publish/rename/tag path | **T37**; `lib/fw-seeder/client.ts` has no publish call |
| Sizes readable, nested | **OQ4**; `colorVariants[].sizeVariants[].size` — measured 14 / 36 / 1 across three templates, 2026-10-04 |
| Hidden **and archived** products still listed | **T39**, measured 2026-10-04 |
| Placeholder art cannot be published | `lib/fw-seeder/placeholder-guard.ts`, enforced at `lib/fw-seeder/product.ts` |
| Supabase-conflation rule is documented | `docs/agentic/mcp/README.md:72`; `docs/agentic/plugins/registry.md:28` |
| No admin/playground route exists | `find app -maxdepth 2 -type d` |

> ⚠️ **Unverifiable from this checkout.** The rows below describe the **separate Studio project**
> (`roryskagenart.com`), which is **not present in this working tree** — `/…/roryskagenart/` holds only
> `IDEA.md`, `roryskagenart.com/` and `shop.roryskagenart.com/`. They were copied from a prior session and
> **could not be re-derived here**, so treat them as **dated hearsay, not evidence**. Re-measure from the
> Studio checkout before relying on any of them — especially the Free-plan / no-PITR claim, which gates B1.
>
> | Claim (UNVERIFIED) | Cited source |
> | :-- | :-- |
> | Studio DB is Free plan, no backups, no PITR | studio `docs/runbooks/database-backup-restore.md:218` |
> | Studio env vars are `VRCL_SUPA_*`, not `SUPABASE_*` | studio `AGENTS.md:101-112` |
> | Studio live schema is 12 tables, artwork-shaped | studio `data/archive/schema_introspection.md:8-21` — dated 2026-09-16 |
> | `profiles` has 5 rows | same, `:598-610` |
>
> Also unresolved: **OQ5** cites `pr-gh-oauth_DRAFT.md` / PR #2, which live on the **unmerged**
> `docs/gh-oauth-plan` branch and are **not in this checkout**. The link in
> [`README.md`](README.md) points at a GitHub blob for that reason.

## Appendix B — Documentation to update when this executes

| Doc | Why | When |
| :-- | :-- | :-- |
| `docs/releases/plans/README.md` | register this plan, mark v0.2.0 executed | Phase E |
| `lib/brand-config.ts` | resolve **OQ7** version split | Phase E |
| `docs/agentic/mcp/README.md`, `plugins/registry.md` | if **OQ1** reverses the conflation rule | after B1 |
| `docs/agentic/traps/register.md` | new traps this release proves | Phase E |
| `docs/agentic/scripts/verify.sh`, `stack/overview.md` | test-count baseline (**T24**-style drift guard) | Phase A |