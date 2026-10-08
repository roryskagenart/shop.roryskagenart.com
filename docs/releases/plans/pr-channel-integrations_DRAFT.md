# PR — Fourthwall channel integrations: operator onboarding + reference documentation

**Status:** DRAFT · not started · opened as a draft PR while **OQ1–OQ5** are unanswered
**Authored:** 2026-10-08 · agent session · **based on `main` @ `73bb0de`**
**Branch:** `docs/channel-integrations` (planned)

---

## 1. What this is / is not

**Is** — a documentation change. It adds an **operator onboarding guide** and a **reference** for the three
Fourthwall **channel integrations** — TikTok Shop, Instagram & Facebook Shopping, YouTube Merch Shelf —
plus the measured vendor behaviour behind them.

**Is not**

- Not a code change. No route, component, API client, or test changes.
- Not the connection of any channel. Connecting them is Fourthwall-dashboard work by the account owner.
- Not the **Channel API** (`docs.fourthwall.com/channel-api/…`) — an invite-only beta for building a
  third-party platform. Different product, different audience (**D5**).
- Not the storefront's own social links (`lib/brand-config.ts:59-75`) — that is header/footer chrome.
- Not a marketing or content plan for the channels.

---

## 2. Verified starting state

Every claim carries the command or `file:line` that produced it. **Provenance is stated**: `local` =
read or measured in this repo; `vendor` = quoted from Fourthwall's own documentation, fetched
**2026-10-08**, and *not* independently reproduced.

### 2.1 What the documentation covers today

| Claim | Evidence | Provenance |
| :--- | :--- | :--- |
| **Zero documentation exists for Fourthwall's channel integrations.** Not one of the integration terms appears anywhere in the repo. | `grep -rInE "TikTok Shop\|Instagram Shopping\|Merch Shelf\|channel integration\|platform integration" docs/ \| wc -l` → **0**; the same pattern over the whole tree (excluding `node_modules`, `.git`) → **0** | local |
| The Fourthwall KB is deep on the **API / product** surface only. | `docs/agentic/stack/fourthwall.md` (189 lines) · 51 traps in `docs/agentic/traps/register.md` · two skills under `docs/agentic/skills/fourthwall-product-*` | local |
| The only IG / FB / YouTube references in the repo are storefront social links, not integrations. | `lib/brand-config.ts:59-75` · `components/layout/social-links.tsx:14-27` | local |
| There is **no onboarding document** for a new operator — no prerequisites table, no setup steps, no troubleshooting. | `docs/README.md` index · `docs/master-brief/*.md` (8 pages, none operational) · `docs/agentic/skills/` (agent-facing procedures) | local |
| The docs surface has three scopes — `public`, `dev`, `brief` — and **none has a channel/social category**. | `lib/docs-content.ts:21` · `PUBLIC_DOCS_STRUCTURE` `:27-65` · `DEV_DOCS_STRUCTURE` `:67-124` | local |
| The Master Brief is **Markdown-first and already on `main`** — `docs/master-brief/*.md` is the source of truth, generated into `lib/docs-brief.generated.ts`. | PR **#21** merged 2026-10-08, squash commit `73bb0de` · `gh api repos/roryskagenart/shop.roryskagenart.com/contents/docs/master-brief?ref=main` → **8 files** | local (API) |
| The KB is at **1.9.1**; the gate baseline is **224 tests / 15 files**. | `docs/agentic/VERSION` · `docs/agentic/scripts/baseline.env` | local |

### 2.2 The naming collision — there is no "Fourthwall Max"

⚠️ **The request names "Fourthwall Max channel integrations". No Max tier exists.**

| Claim | Evidence | Provenance |
| :--- | :--- | :--- |
| Fourthwall's plans are **Free ($0)** and **Pro ($15/mo)**, plus "enterprise options" on request. No plan called **Max**. | `fourthwall.com/pricing`, fetched 2026-10-08 | vendor |
| Channel integrations are **on the Free plan**: *"Sell on YouTube, Instagram, and TikTok with our apps and integrations"* is listed under Free, and the feature matrix puts *"Showcase products on YouTube Merch Shelf, Instagram/Facebook Shopping, and TikTok Shopping"* in the Free column. | same | vendor |
| A **different** product *is* called "Channel API" — an **invite-only beta** for platforms that provision shops on a creator's behalf. | `docs.fourthwall.com/channel-api/platform-integration`, fetched 2026-10-08 — *"requires special access — it is invite only and currently in beta"* | vendor |

**⇒ Recommendation: title the work "channel & platform integrations" and drop "Max" (OQ1).** "Max" is not
a tier name, so a reader sent looking for it in the vendor's UI finds nothing.

### 2.3 What the integrations actually require

All **vendor**-documented, fetched 2026-10-08 from
`help.fourthwall.com/manage-my-shop/apps-features-and-integrations/setting-up-platform-integrations`
(updated 2026-04-29).

| Channel | Prerequisites | Where checkout happens |
| :--- | :--- | :--- |
| **TikTok Shop** | TikTok account **≥ 1,000 followers**; a **TikTok Seller** account (separate from the creator account); **≥ 1 published** Fourthwall product | **On TikTok** (native) |
| **Instagram & Facebook Shopping** | Instagram **Business or Creator** account; a **Facebook Page linked** to it; the Facebook account must be **admin of a Commerce Manager catalog**; **≥ 1 published** product | Links out to the **Fourthwall product page** |
| **YouTube Merch Shelf** | YouTube channel **≥ 500 subscribers**; **YouTube Partner Program** membership with monetization enabled; **≥ 1 published** product | Links out to the **Fourthwall product page** |

Common behaviour, same source: all three connect from **Apps** in the Fourthwall dashboard; each is
independent (all three can be live at once); only **published** products sync — hidden, archived and
out-of-stock are excluded; initial sync takes **up to 24 h** (Meta approval **24–48 h**).

⚠️ **The domain-change trap (vendor-documented, not yet reproduced here):** *"If you change your
Fourthwall shop domain, product feed URLs change and integrations stop working. Disconnect and reconnect
each integration after any domain change."* This shop carries **both** a custom domain and a
`*.fourthwall.com` host (`docs/master-brief/accounts.md:72`), so it is directly exposed. **Promote to a
⚠️ in `stack/`; do not open a trap until it has actually bitten** (**D4**).

### 2.4 Readiness — where this shop actually stands

| Gate | Requirement | This shop | Verdict |
| :--- | :--- | :--- | :--- |
| Published products | ≥ 1 | **6 published** across 3 collections | ✅ met |
| TikTok followers | ≥ 1,000 | **no TikTok account recorded** (`lib/brand-config.ts:59-75` has IG, FB, X only) | ❌ blocked |
| TikTok Seller account | required | not recorded | ❌ blocked |
| YouTube subscribers | ≥ 500 | not recorded | ❓ unknown |
| YouTube Partner Program | required | not recorded | ❓ unknown |
| Instagram account type | Business / Creator | not recorded | ❓ unknown |
| FB Page linked + Commerce Manager admin | required | Page exists, but as a **`profile.php?id=…` URL with no username** (`lib/brand-config.ts:52-54,66-69`) | ⚠️ friction |
| Shop reachable by a tagged buyer | product page must load | shop is **`PASSWORD_PROTECTED`**; `/products/<slug>` → **302 → `/password`** (`docs/agentic/stack/fourthwall.md:113-124`) | ⚠️ **blocker — see below** |

⚠️ **The password gate is a functional blocker for two of the three channels.** Instagram and YouTube both
*link the buyer to the Fourthwall product page* — and that page sits behind the password gate, so a tagged
product lands on `/password`. TikTok is unaffected: its checkout is native. `/checkout/` is **ungated**
(`docs/agentic/stack/fourthwall.md:123`, **T14**) — that is a purchase path, not a discovery path.

> **Not yet verified:** which host a channel product tag resolves to — the Fourthwall-hosted shop or the
> custom domain. Both are gated today so the conclusion holds either way, but the finished doc must name
> the host it was measured against. → **T-06**.

---

## 3. The product, decomposed

| # | Capability | Home | Audience |
| :-- | :--- | :--- | :--- |
| **C1** | **Channel readiness matrix** — the prerequisite gates, this shop's status, what is blocked | master-brief page | owner |
| **C2** | **Per-channel onboarding** — dashboard → Apps → Connect → authorize → verify, for each of the three | master-brief page | owner |
| **C3** | **General reference** — what each channel does, where checkout happens, sync rules, timings | master-brief page | owner |
| **C4** | **Troubleshooting** — products not appearing, authorization failures, domain-change reconnection, product rejection | master-brief page | owner |
| **C5** | **Measured vendor behaviour** — prereqs, sync exclusions, the domain-change rule, each with provenance | `docs/agentic/stack/channel-integrations.md` **(new)** | engineer / agent |
| **C6** | **Pointer** from the existing Fourthwall stack doc | one line in `stack/fourthwall.md` | engineer / agent |

---

## 4. Design decisions

| # | Decision | Rationale |
| :-- | :--- | :--- |
| **D1** | Title it **"Channel & platform integrations"** — never "Max" | No such tier (§2.2). A doc naming a thing the vendor's UI does not contain cannot be followed. |
| **D2** | Split **operator steps** (master-brief) from **vendor behaviour** (agentic `stack/`) | KB rule: a measured behaviour of an external system lives in `stack/`; a client-facing fact lives in the brief. One fact, one home. |
| **D3** | Add the operator guide as a **new master-brief page**, not a `/docs/dev` page | `/docs/dev` is the *engineering* scope; the audience here is the owner doing dashboard work. |
| **D4** | Ship the domain-change rule as a **⚠️ in `stack/`**, not as a new trap | The trap register holds things **this project measured**. This is vendor-documented and has not bitten here. Promote it the day it does. |
| **D5** | Keep the **Channel API** out of scope; one disambiguating line only | Invite-only beta, different product, different audience. Documenting it implies an access path this shop does not have. |
| **D6** | Mark every claim's **provenance** (`local` / `vendor`) in the evidence table | The repo's rule is that a claim is checkable. A vendor quote is checkable *as a quote* and must not be dressed as our measurement. |

---

## 5. Release plan

Docs-only. No code, no route, no test changes. Gates, in order:

```bash
npm run docs:brief:build                      # regenerate lib/docs-brief.generated.ts from docs/master-brief/*.md
npm run docs:brief:check                      # must exit 0 — proves the generated file matches the markdown
python docs/agentic/scripts/check-links.py    # every new relative link + #anchor resolves
bash docs/agentic/scripts/verify.sh           # tsc --noEmit + vitest, against baseline.env (224 / 15)
bash docs/agentic/scripts/check-baseline.sh   # no document disagrees with baseline.env
```

⚠️ **`docs:brief:check` fails until `docs:brief:build` is run** — a new master-brief page changes the
generated file by construction. That is the guard working, not a defect.

⚠️ **`check-links.py` runs as a gate** (`docs/README.md:46-47`). Every link the new page adds must resolve.

---

## 6. Task inventory

| # | Task | Output |
| :-- | :--- | :--- |
| **T-01** | Write `docs/master-brief/channel-integrations.md` — C1–C4; frontmatter `order: 9`, `nav`, `navBadge` | new file |
| **T-02** | Write `docs/agentic/stack/channel-integrations.md` — C5, with a provenance column | new file |
| **T-03** | Add a one-line pointer from `stack/fourthwall.md` to the new stack doc | edit |
| **T-04** | Register this plan in `docs/releases/plans/README.md` | edit |
| **T-05** | Bump KB `VERSION` 1.9.1 → **1.10.0** (MINOR: new stack doc) + `CHANGELOG.md` entry | edit |
| **T-06** | **Measure** which host a channel product tag resolves to, and whether the gate intercepts it | measurement note |
| **T-07** | Confirm owner-side facts: TikTok account? YouTube subs / YPP? IG account type? Commerce Manager admin? | owner answer |
| **T-08** | Re-fetch the three vendor pages at execution time and re-date the quotes | evidence refresh |
| **T-09** | Add the new page to the brief's own index (`docs/master-brief/overview.md`, "How to Read This Brief") | edit |

---

## 7. Sequencing / critical path

1. **T-07 (owner facts)** blocks the readiness matrix's verdict column. Everything else proceeds in
   parallel; the matrix ships with `❓ unknown` until answered.
2. **No structural blocker remains.** The Master Brief is Markdown-first on `main` as of 2026-10-08
   (PR **#21**, squash commit `73bb0de`), so a new `docs/master-brief/*.md` page lands in the current
   model. *This was checked against the GitHub API, not a local ref — see the note below.*
3. T-01 → T-09 → `docs:brief:build` → gates.

> ⚠️ **Verified the hard way.** The first pass of this plan asserted a blocker on the grounds that
> `git ls-tree -r --name-only origin/main -- docs/master-brief` returned **empty** and
> `git merge-base --is-ancestor 47300c6 origin/main` returned **NO**. Both were **stale local refs** —
> `origin/main` had not been fetched since PR #21 merged a minute earlier. `gh api …/contents/docs/master-brief?ref=main`
> returned the **8 files**. The lesson is the KB's own: **`FETCH_HEAD` and the API are authoritative, a
> local remote-tracking ref is not.** Related: because every merge here is a **squash**, `47300c6` is
> *not* an ancestor of `main` even though its tree is identical — `--is-ancestor` and the compare API
> both report a fully-merged branch as diverged.

---

## 8. Risk register

| Risk | Mitigation |
| :--- | :--- |
| **The doc ships with "Max" in the title and is unfindable** | D1 + OQ1. Confirm the name before writing a heading. |
| **Vendor behaviour changes under us** | Every vendor claim is dated and carries a URL; T-08 re-fetches at execution. An undated measurement becomes false silently. |
| **A vendor quote is presented as our measurement** | D6 — provenance column. |
| **The readiness matrix reads as "TikTok is ready"** | Explicit `❌ blocked`; the gate is 1,000 followers, not documentation. |
| **IG / YouTube buyers hit the password gate** | Documented as a functional blocker in C1 and OQ3. The doc must not promise a working path while the gate is on. |
| **Scope creep into the Channel API** | D5 + the "Is not" fence. |
| **A stale local ref produces a false blocker, as it did here** | Query the API or `FETCH_HEAD` before asserting anything about a remote branch (§7). |

---

## 9. Do not do yet

- Do not connect any channel. Dashboard work, owner's call, and TikTok's gate is unmet.
- Do not write a trap for the domain-change rule — it has not bitten here (**D4**).
- Do not document the Channel API beyond one disambiguating line.
- Do not change the shop's password-gate state to "fix" IG / YouTube. That is a separate decision
  (**T14**, `docs/master-brief/open-items.md:20`) with a commercial consequence.
- Do not add the page to `PUBLIC_DOCS_STRUCTURE` — it is not customer-facing copy.

---

## 10. Open questions

**OQ1 — What is this called?**
Options: "channel integrations" · "platform integrations" · "Max integrations".
**Recommendation: "Channel & platform integrations".** Fourthwall's own help page is titled *"Platform
Integrations (TikTok, Instagram, YouTube)"*, and "Max" is not a tier (§2.2).

**OQ2 — Where does the operator guide live?**
Options: a new `docs/master-brief/` page · a new `docs/agentic/skills/` procedure · a `/docs/dev` page.
**Recommendation: master-brief page.** The audience is the account owner doing dashboard work; the brief
is the client-facing tree. A `skills/` entry would be agent-facing and a human would not find it.

**OQ3 — Do we document the integrations as usable while the shop is password-protected?**
**Recommendation: document them, but state plainly that Instagram and YouTube will send buyers to a gated
page until the gate is lifted** (§2.4). A guide that omits this produces a support ticket, not a sale.

**OQ4 — How is TikTok handled when no account exists and the 1,000-follower gate is unmet?**
**Recommendation: include it, marked `❌ blocked — prerequisites unmet`, with the gate stated.** Omitting
it invites "where is TikTok?"; claiming it works is worse.

**OQ5 — Does this get a release tag?**
**Recommendation: no app tag.** It is docs-only and no product behaviour changes. Bump the **KB** MINOR
(1.9.1 → 1.10.0) and leave `v0.3.0` reserved for Launch Playground. If a docs-only tag is wanted,
`v0.2.1` is the correct space.

**OQ6 — What is the base?** → **ANSWERED 2026-10-08.**
Options were: land the markdown-first migration first · author against the TS model on `main` · hold.
**Answer: `main` @ `73bb0de`.** PR #21 squash-merged the Markdown-first Master Brief on 2026-10-08, so
`main` carries `docs/master-brief/*.md` and `lib/docs-brief.generated.ts`, and this plan is based there.
No blocker. *The original draft of this plan asserted the opposite from a stale local ref — see §7.*

---

## 11. Release mechanics

| | |
| :--- | :--- |
| **Base** | `main` @ `73bb0de` |
| **Branch** | `docs/channel-integrations` |
| **PR** | draft while OQ1–OQ5 are open |
| **Gate** | `verify.sh` + `docs:brief:check` + `check-links.py` + `check-baseline.sh` |
| **Deploy** | none. Docs-only; `main` is push-to-deploy but nothing here is deployed code. |
| **Tag** | none recommended (**OQ5**) |
| **KB version** | 1.9.1 → 1.10.0 (MINOR — new stack doc) |
| **Push** | **requires explicit per-release approval** (`AGENTS.md` rule 2) |

---

## Appendix A — Claim → evidence

| Claim | Evidence | Provenance |
| :--- | :--- | :--- |
| No channel-integration documentation exists | `grep -rInE "TikTok Shop\|Instagram Shopping\|Merch Shelf\|channel integration\|platform integration" docs/ \| wc -l` → 0; whole tree → 0 | local |
| Fourthwall has no "Max" plan; plans are Free and Pro | `fourthwall.com/pricing` (fetched 2026-10-08) | vendor |
| Channel integrations are included on the Free plan | same | vendor |
| Channel API is invite-only beta — a different product | `docs.fourthwall.com/channel-api/platform-integration` (fetched 2026-10-08) | vendor |
| TikTok needs ≥ 1,000 followers + a Seller account | `help.fourthwall.com/…/setting-up-platform-integrations` (updated 2026-04-29; fetched 2026-10-08) | vendor |
| YouTube needs ≥ 500 subs + YPP with monetization | same | vendor |
| IG needs a Business/Creator account, a linked FB Page, Commerce Manager admin | same | vendor |
| TikTok checks out natively; IG and YouTube link out to the product page | same | vendor |
| Only published products sync; hidden / archived / out-of-stock excluded; up to 24 h | same | vendor |
| A shop-domain change breaks feed URLs and needs a reconnect | same | vendor |
| Shop is password-protected; `/products/<slug>` → 302 → `/password` | `docs/agentic/stack/fourthwall.md:113-124` | local |
| `/checkout/` is ungated | `docs/agentic/stack/fourthwall.md:123` · `docs/master-brief/open-items.md:20` (**T14**) | local |
| 6 published products across 3 collections | `docs/master-brief/estate.md:63` | local |
| Social links are IG, FB, X — no TikTok, no YouTube | `lib/brand-config.ts:59-75` · `components/layout/social-links.tsx:14-27` | local |
| The FB Page has no username (`profile.php?id=…`) | `lib/brand-config.ts:52-54,66-69` | local |
| `main` carries the Markdown-first brief (8 `.md` pages + `lib/docs-brief.generated.ts`) | PR **#21** merged 2026-10-08 → `73bb0de` · `gh api repos/roryskagenart/shop.roryskagenart.com/contents/docs/master-brief?ref=main` → 8 files | local (API) |
| Docs scopes are `public` / `dev` / `brief`; no channel category | `lib/docs-content.ts:21,27-124` | local |
| KB 1.9.1; baseline 224 tests / 15 files | `docs/agentic/VERSION` · `docs/agentic/scripts/baseline.env` | local |

---

## Appendix B — Documentation to update

| Document | Change | When |
| :--- | :--- | :--- |
| `docs/master-brief/channel-integrations.md` | **new** — the operator guide (C1–C4) | with this plan |
| `docs/master-brief/overview.md` | add the page to "How to Read This Brief" | with this plan (**T-09**) |
| `docs/agentic/stack/channel-integrations.md` | **new** — measured vendor behaviour (C5) | with this plan |
| `docs/agentic/stack/fourthwall.md` | one-line pointer to the new stack doc | with this plan (**T-03**) |
| `docs/agentic/VERSION` + `CHANGELOG.md` | 1.9.1 → 1.10.0, MINOR | **on execution**, not from the plan |
| `docs/releases/plans/README.md` | register this plan | with this plan (**T-04**) |
| `docs/master-brief/accounts.md` | add a channel-integrations row under Fourthwall | on execution |
| `docs/master-brief/open-items.md` | the password-gate vs IG/YouTube blocker | on execution |
