# Trap register

Every entry follows the format in [`../protocols/knowledge.md`](../protocols/knowledge.md#2-trap-entry-format).
**No evidence, no entry.**

Status: `OPEN` (still true) · `MITIGATED` (worked around, root cause remains) · `RESOLVED` (fixed — kept as
a regression test).

---

## Data integrity

<a id="t01"></a>
### T01 — The storefront fabricates purchasable products
**Status:** OPEN
**Bites:** A visitor can assemble a **$28,000 cart** for products that exist only in a local JSON file and
in one serverless instance's memory. **Nothing throws and every page returns 200**, so no monitoring will
ever surface it.
**Evidence:** `lib/fourthwall/index.ts:385-397` (`getCollectionProducts`) and `:451-465` (`getProduct`) fall
back to local JSON whenever Fourthwall returns nothing. `components/cart/actions.ts:22-36` (`addItem`)
then fails at Fourthwall, and `lib/fourthwall/index.ts:481-484` falls back to an **in-process `Map` cart**.
`redirectToCheckout` sends that cart id to the **ungated** `/checkout/`. Verified: `/USD/collections/fine-art-originals`
renders 15 originals at $5.5k–$28k with no corresponding Fourthwall product, each with a working
add-to-cart.
**Do instead:** This is the defect the next release exists to remove. Until then, do not describe the
originals as purchasable. Fix = delete the fallback, not guard it.
**Source:** 2026-10-01.

<a id="t02"></a>
### T02 — A `DELETE` probe archived a live product
**Status:** OPEN (the product is still archived)
**Bites:** An unknown HTTP method sent at a live resource **silently mutated production**. `DELETE` returned
`204` — a *soft* delete — so the failure looked like a success.
**Evidence:** A `DELETE /open-api/v1.0/products/{id}` against `the-martian-white-glossy-mug` left
`state: SOLD_OUT`, `access: ARCHIVED`. A re-`GET` showed an archived duplicate in the catalogue, which
cannot be removed (no update path — T03).
**Do instead:** [`../protocols/destructive-actions.md`](../protocols/destructive-actions.md). Probe a
scratch record. Read the docs first.
**Source:** 2026-10-01.

<a id="t03"></a>
### T03 — There is no update endpoint
**Status:** OPEN (vendor constraint)
**Bites:** Any correction requires **archive + recreate**, which permanently leaves an archived duplicate.
**Evidence:** `PATCH`/`PUT /open-api/v1.0/products/{id}` → **405**. `PUT /products/{id}/availability`
`{available:true}` → 200 but **does not reverse an archive**.
**Do instead:** Get the create payload right the first time. Rebuilds are safe on the URL front (archiving
releases the slug) — use the seeding script's **`--force`**, since an archived product keeps its name and
name-based de-duplication would silently skip it.
**Source:** 2026-10-01.

<a id="t04"></a>
### T04 — A collection cannot be renamed; recreating leaves a public orphan
**Status:** OPEN
**Bites:** A renamed collection leaves a **PUBLIC orphan** that still renders in the site nav.
**Evidence:** Only `PUT /collections/{id}/products` is updatable. `getCollections()`
(`lib/fourthwall/index.ts:353-356`) appends any Fourthwall collection not present in the taxonomy.
**Do instead:** Change the display name in `lib/taxonomy.ts` — the taxonomy title wins over a colliding
Fourthwall name (asserted in `lib/fourthwall/__tests__/collections.test.ts`).
**Source:** 2026-10-01.

<a id="t05"></a>
### T05 — `PUT /collections/{id}/products` replaces the whole list
**Status:** OPEN
**Bites:** It reads like an append and is not. Omitting an id **removes** that product.
**Evidence:** API docs: *"Sets the full list of product IDs in the collection."* Scope `offer_write`.
**Do instead:** Always send the complete intended list, and re-read the collection afterwards.
**Source:** 2026-10-01.

<a id="t06"></a>
### T06 — Omitting `sizes` creates exactly one variant
**Status:** OPEN (already live in production). **Mitigation added 2026-10-04** — see below.
**Bites:** The shop's four mugs each have **only** a `White, 11oz` variant. The intent was a size range.
**Evidence:** `GET /open-api/v1.0/products` → each mug has one variant, `attributes.size: "11oz"`.
**Sizes ARE readable from the API — the earlier claim that they are not was wrong.** There is no
top-level `sizes`/`sizeVariants` key and `sizeGuide` is `{url: null, content: null}`, which is exactly
what made that false conclusion. The ladder is **nested** at `colorVariants[].sizeVariants[].size`, and
each entry also carries `price` and `available`. Re-measured live 2026-10-04: 14 sizes on
`pro_15bc29bc8a324d449d` ($5.50–$18.00); on `pro_kRSsoYjwSoyyTEmWko5o0A` **12 distinct sizes across
3 colours = 36 `sizeVariants`** ($20.35–$74.41) — so "how many sizes" is ambiguous unless you say
whether you mean the ladder or the variants. `probe-templates.ts` now records de-duplicated `sizes`
and `sizePrices` instead of writing
`"none-exposed-by-api"`. **So this trap is fully avoidable: read the ladder, do not transcribe it, and
never omit it.**
**Do instead:** Pass `sizes` explicitly, read from the detail endpoint. Note the API's inconsistent
spelling (`"20 oz"`, not `"20oz"`; and the `″` character in poster sizes) — copy exactly, never
normalise, or the string will not match a variant. Sizes are per colour variant: de-duplicate.
**Source:** 2026-10-01; corrected 2026-10-04.

---

## Fourthwall API mechanics

<a id="t07"></a>
### T07 — The template list is mutable
**Status:** OPEN
**Bites:** A template resolved by name at run time can silently become a **different product**.
**Evidence:** `GET /product-templates` returned 25 for this shop. Mid-session the set changed: a Comfort
Colors tee present in one call was a Drawstring Bag in the next. `total: 601` is the platform-wide count
and does not respond to `size`/`page`.
**Do instead:** **Pin template ids in config and assert at apply time.** Never resolve a template by name.
**Source:** 2026-10-01.

<a id="t08"></a>
### T08 — `regions[].region` is a per-template regionId, not a placement
**Status:** OPEN
**Bites:** A hardcoded `"front"` works for a t-shirt and is **rejected for a mug** — the same code path
fails only on some products.
**Evidence:** A mug template exposes exactly one `customizableAreas[]` entry with `regionId: "default"`
(placements `front`/`back`, 2700×1050 @300 DPI). Apparel exposes many.
**Do instead:** Resolve the region from the template's `customizableAreas`, per template.
**Source:** 2026-10-01.

<a id="t09"></a>
### T09 — `unitPrice.value` is dollars, not cents
**Status:** OPEN
**Bites:** Reading it as cents makes every price off by 100×.
**Evidence:** `gondeoleu` returns `{"value": 4500.00, "currency": "USD"}` and the storefront serves
**$4,500 USD**.
**Do instead:** Treat it as a decimal dollar amount.
**Source:** 2026-10-01.

<a id="t10"></a>
### T10 — The list endpoint 404s while the detail endpoint works
**Status:** OPEN
**Bites:** Conflating them makes a **local-only slug indistinguishable from a slug that never existed** —
which is how T01 stayed invisible.
**Evidence:** `GET /v1/products` → 404 `No static resource api/public/v1.0/products`. But
`GET /v1/products/{handle}` → **200** with the token, 401 without, 404 `OFFER_SLUG_NOT_FOUND_ERROR` for an
unknown slug (probed against a real slug, a real-but-absent slug, and a nonsense slug).
**Do instead:** Use the detail endpoint to prove a product exists. Never conclude "the API 404s" from the
list endpoint alone.
**Source:** 2026-10-01.

<a id="t11"></a>
### T11 — The CDN caches per exact URL
**Status:** OPEN
**Bites:** **A stale read looks exactly like a failed write.** This sends you debugging a write that
succeeded.
**Evidence:** Re-`GET` of a collection after a successful `PUT` returned the previous product list until a
random query param was appended.
**Do instead:** **Cache-bust before concluding anything about a write.**
**Source:** 2026-10-01.

<a id="t12"></a>
### T12 — The Platform API cannot create priced physical products
**Status:** OPEN (structural)
**Bites:** The originals — which need their own price, own SKU, stock of 1, and self-fulfilment — **cannot
be created by the API at all**. Any plan that assumes otherwise is unbuildable.
**Evidence:** `POST /products` with `type: "design"` requires `productTemplateId` + `regions[]` and accepts
no `price`, `variants`, `slug`, `stock` or `images`; pricing is a `profitMargin` over base cost. Manual
products are dashboard-only; no bulk/CSV import is documented.
**Do instead:** Plan originals as **dashboard-only manual products**. This is why an earlier sync feature
was fixed by deletion rather than repair.
**Source:** 2026-10-01.

<a id="t13"></a>
### T13 — There is no wall-art template
**Status:** **RESOLVED — the conclusion held, the stated cause was wrong.** Reworded 2026-10-04.
**Bites:** **Wall art IS available.** The original claim generalised from a 25-template page-1 read. The
real catalogue is 605, and it contains **two buildable wall-art templates**. Planning that
`canvas-prints` was structurally unfulfillable would have removed a revenue line that works.
**Evidence (original):** the 25-template list contained no poster, canvas or metal entry. **Corrected:**
`GET /product-templates` returns 25 rows against `total: 605`, and `?page=` is ignored → **T34**. Live
`GET /product-templates/{productId}`, 2026-10-04, both `supportsBackendRendering: true` with real
regions:
- `pro_15bc29bc8a324d449d` **Enhanced Matte Paper Poster** — `regionId: "default"`, 1500×2100 @300 DPI, $5.50
- `pro_kRSsoYjwSoyyTEmWko5o0A` **Framed High-Quality Matte Poster** — `regionId: "default"`, 2400×3000 @300 DPI, $20.35

Plus buildable `Desk Mat 12"x18"` / `15.5"x31.5"` / mouse pads, `All-Over Print Basic Pillow`, and
`Soy Wax Candle`. A measured launch shipped products on the first two.

**Correction to this entry, 2026-10-04:** the size counts quoted here ("14 sizes", "36 sizes") came
from the MCP *browse* catalogue — a different surface from the Platform API the seeder writes to — and
were initially recorded as unverifiable. **They are in fact readable from the API, nested:** the detail
document has no top-level `sizes`/`sizeVariants` key and `sizeGuide` is `{url: null, content: null}`,
but `colorVariants[].sizeVariants[].size` carries the ladder. Re-measured live against
`GET /open-api/v1.0/product-templates/{productId}`:

| productId | colour variants | sizes | per-size price |
| :-- | --: | --: | :-- |
| `pro_15bc29bc8a324d449d` (Enhanced Matte Paper Poster) | 1 | **14** | $5.50 – $18.00 |
| `pro_kRSsoYjwSoyyTEmWko5o0A` (Framed High-Quality Matte Poster) | 3 | **12 each** | $20.35 – $74.41 |

So the original figures were right by coincidence of the right source, and the "not readable" claim
was a **partial read reported as a property of the set** — the same error class as **T33**/**T34**, and
the third time it has appeared. Each `sizeVariants[]` entry also carries its own `price` and
`available`, so per-size pricing *is* readable, which this entry previously said it was not. The risk
in **T06** is unchanged: omitting `sizes` from a create payload still yields exactly one variant → now
avoidable entirely, by reading them.

A third, sharper correction: `Home & Living/Wall Art` has **five**
backend-renderable* rather than *absent*.
**Do instead:** **Never infer a capability from a partial read** → **T34**. Before declaring a category
impossible, enumerate the whole catalogue by direct `productId` lookup and probe the specific
templates. And when a figure comes from a surface the writer does not use, label it unverified
instead of folding it into a measurement.
**Source:** 2026-10-01; corrected 2026-10-04.

<a id="t14"></a>
### T14 — The password gate blocks discovery, not purchase
**Status:** OPEN
**Bites:** Assuming "the shop is private" leads to wrong conclusions about risk. `/checkout/` is **open**.
**Evidence:** Browser-UA probes: `/`, `/products/<slug>`, `/collections/<slug>`, `/cart` → 302 → `/password`;
**`/checkout` → 301 → `/checkout/` → 200** with `<title>Checkout – Fourthwall</title>`.
**Do instead:** Describe the gate accurately. An earlier project note claimed the shop "cannot be bought
from" — **too strong, corrected after measurement.**
**Source:** 2026-10-01 (corrected same day).

---

## Tooling and environment

<a id="t15"></a>
### T15 — `vitest` passes where `tsc` fails
**Status:** OPEN
**Bites:** A green test run hides a broken typecheck. Measured: a test file reported green by vitest then
produced **15 errors** under `npm run lint`.
**Evidence:** `vitest.config.ts` sets `globals: true` at runtime only, so a test omitting its
`describe`/`it`/`expect` imports passes vitest and fails `tsc` (`TS2582`). `tsconfig.json` also sets
`noUncheckedIndexedAccess: true`.
**Do instead:** **Run both gates, always.**
**Source:** 2026-10-01.

<a id="t16"></a>
### T16 — `next build` is not a usable gate here
**Status:** OPEN
**Bites:** It stalls with zero output and zero writes, and Next suppresses its spinner on a non-TTY pipe —
so **silence proves nothing** in either direction.
**Evidence:** Repeated observation; no artifacts written, no completion.
**Do instead:** Use `tsc` + `vitest` locally; use CI for a real build.
**Source:** 2026-10-01.

<a id="t17"></a>
### T17 — The Vercel CLI does not read `.gitignore`
**Status:** MITIGATED (`.vercelignore` added, `b7b3a51`)
**Bites:** A local deploy ships **untracked local files** into the deployment — including agent memory and
build artifacts.
**Evidence:** `vercel deploy --dry --json` showed the upload set containing `.workbuddy-ai/memory/MEMORY.md`,
`.workbuddy-ai/backups/…` and `tsconfig.tsbuildinfo`. Vercel honours only `.vercelignore` plus its built-in
defaults.
**Do instead:** Keep `.vercelignore` current, and **re-run `vercel deploy --dry --json` and inspect the file
list** before any local deploy. Costs nothing, creates no deployment. CI is immune (fresh checkout).
**Source:** 2026-10-01.

<a id="t18"></a>
### T18 — `taskkill /PID $!` addresses the wrong process
**Status:** OPEN
**Bites:** In Git Bash `$!` is an **MSYS pid**, not a Windows pid. `taskkill` resolves the number as a
Windows PID and hits an unrelated process. Measured: it **killed the calling shell**.
**Evidence:** A cleanup trap's `taskkill /PID $! /T /F` returned exit 128 on the wrapper it meant to kill
and SIGTERM'd the agent's own command.
**Do instead:** Use bash's builtin `kill "$PID"` (it understands MSYS pids), or take a real Windows pid from
`netstat -ano | grep LISTENING | grep ":$PORT "`. **Never use `/T`** on a pid you did not get from netstat.
**Source:** 2026-09-22.

<a id="t19"></a>
### T19 — Killing the npm wrapper leaves the server running
**Status:** OPEN
**Bites:** The port stays held, and the next start fails with `Port … is already in use` — which reads
exactly like a broken script.
**Evidence:** `npm run dev &` → killing `$!` killed the wrapper; the `next`/`node` child kept the port.
**Do instead:** Sweep the **listener** pid from `netstat`, not just the wrapper.
**Source:** 2026-10-01.

<a id="t20"></a>
### T20 — `vercel env` traps
**Status:** OPEN
**Bites:** Several, all silent. See the table in
[`../stack/environments.md`](../stack/environments.md#traps).
**Evidence:** Most notably: `env add NAME preview` is **interactive**, so a piped value is eaten by the
first prompt and the call **fails silently**; and piping through `tail -1` made a partial run look
successful while only 3 of 6 entries existed.
**Do instead:** Pass `--yes`/`--git-branch` and `--type`; **confirm with `vercel env ls` and count.**
**Source:** 2026-10-01.

<a id="t21"></a>
### T21 — `NEXT_PUBLIC_GTM_ID` placeholder is worse than unset
**Status:** OPEN
**Bites:** Setting the placeholder **overrides a working fallback** and disables analytics.
**Evidence:** `lib/analytics.ts:30` — `cleanEnv(process.env.NEXT_PUBLIC_GTM_ID) || 'GTM-PV2BBNN'`.
**Do instead:** Unset it, or set a real id.
**Source:** 2026-10-01.

<a id="t22"></a>
### T22 — Destructured `process.env` is invisible to a dotted grep
**Status:** OPEN
**Bites:** `grep 'process\.env\.X'` misses `const { X } = process.env`, so required vars look absent.
**Evidence:** `app/layout.tsx:9` destructures `{ TWITTER_CREATOR, TWITTER_SITE, SITE_NAME }`; `SITE_NAME` is
also used at `components/icons/logo.tsx:7` and `components/opengraph-image.tsx:11`. Unset ⇒ the OG title
and logo aria-label render `undefined`.
**Do instead:** Grep for `process\.env` **and** destructuring patterns.
**Source:** 2026-10-01.

---

## Repo and process

<a id="t23"></a>
### T23 — Four names for one project
**Status:** MITIGATED — the GitHub repo has been renamed to match the folder, and the local remote URL is
knowingly stale.
**Bites:** The GitHub remote is **not** derivable from the folder name, the Vercel project, or the custom
domain. Inferring it points work at the wrong repository — and the local URL is not evidence either, since
GitHub redirects renamed repos, so a stale `git remote -v` keeps working and looks correct.
**Evidence:** Local folder `shop.roryskagenart.com`; Vercel `roryskagenart/shop.roryskagenart.com`
(it was `roryskagen-5713/shop-roryskagen-com` until the 2026-10-03 rename — **T43**);
custom domain `shop.roryskagenart.com`. On 2026-10-01 the GitHub repo was
**`roryskagenart/shop.roryskagen.com`** (`.com`) — *not* the folder name, which is why this trap exists.
**Renamed 2026-10-06 to `roryskagenart/shop.roryskagenart.com`**, confirmed twice: `git push` reported
`remote: This repository moved. Please use the new location`, and `gh api repos/…/shop.roryskagen.com`
resolves with **`full_name: roryskagenart/shop.roryskagenart.com`**. The local `origin` URL was
**deliberately not changed** (rule 4 — repointing the remote is a human decision), so `git remote -v` still
prints the old name and still works.
**Do instead:** Use the table in [`/AGENTS.md`](../../../AGENTS.md#2-read-this-before-you-name-anything),
which is authoritative, and treat `git remote -v` as untrusted for identity. The lesson generalises: the
mapping between these names has changed once already, so **re-verify it rather than pattern-matching it**.
**Source:** 2026-10-01; rename confirmed 2026-10-06.

<a id="t24"></a>
### T24 — Two version spaces disagree
**Status:** MITIGATED — the scheme is now declared and enforced; one piece of public copy still uses the
old wording.
**Bites:** Naming a release from the wrong scheme produces two contradictory plans, and the repo follows
the wrong one.
**Evidence:** `lib/brand-config.ts:104-144` (was `:66-101`) called **`v1.1.0` "Step 1 (Current Release)"**
and listed `v1.2.0`–`v1.5.0`, mirrored at `lib/docs-content.ts:1174-1192` — while `git tag` showed **only
`v0.1.0`** and every plan was named `v0.x.y`. No `v1.x` tag has ever existed.
**Fixed by:** 2026-10-06, `fix/preflight-and-baseline-reconciliation`. `/AGENTS.md` §2 now declares
`v0.x.y` the release scheme and states that a tag goes on the **merge commit**;
`lib/brand-config.ts` renamed the field `version` → **`roadmapId`** and documents that the array is a
roadmap, not a release record; `stack/overview.md#versions` carries the same policy. The `v1.x` phase
names are left in place — they are real roadmap labels, and deleting them would lose information.
**Residual (why MITIGATED, not RESOLVED):** the **public `/docs` page** (`lib/docs-content.ts:1174-1192`)
still renders them as *"Release v1.2.0"*. Rewording user-visible product copy is a product decision, not
a docs-reconciliation one, so it was surfaced rather than changed. **Owner: Jaden.**
**Do instead:** `git tag` and `docs/releases/plans/` are the release record. Never name a release from
the `v1.x` roadmap space.
**Source:** 2026-10-01; re-scoped 2026-10-06.

<a id="t25"></a>
### T25 — A stale checkout inflates `git diff` catastrophically
**Status:** OPEN
**Bites:** A tiny change reads as a whole-file rewrite — measured: a **4-line change reported as 891
changed lines** — which looks like catastrophic whitespace damage and is not.
**Evidence:** With a stale `HEAD` the index holds an old tree. `git status` and `git diff --cached <base>`
also disagree, producing phantom entries including files reading as deleted that were not.
**Do instead:** Diff against the **intended base SHA** (`git diff <base-sha> --stat`) and build new content
from `git show <base>:<path>`.
**Source:** 2026-09-15.

<a id="t26"></a>
### T26 — Dead configuration that looks live
**Status:** OPEN
**Bites:** Time spent chasing a config that nothing reads.
**Evidence:** `FOURTHWALL_WEBHOOK_SECRET` — `GET /open-api/v1.0/webhooks` → `{"results":[]}`, so **nothing
invalidates ISR**. `GITHUB_KEY` — provisioned in Vercel, read nowhere.
**Do instead:** Confirm a variable is read before debugging it. A var set in the platform and read by no
code is not "configured".
**Source:** 2026-10-01.

<a id="t27"></a>
### T27 — `admin: false` blocks branch protection, and the read is ambiguous
**Status:** OPEN
**Bites:** You cannot add branch protection, and you cannot tell from the API whether it exists.
**Evidence:** `GET /branches/main/protection` → **404** for a non-admin, which is *indistinguishable* from
"not configured". `admin: false` does **not** block repo secrets/variables (`gh secret set` succeeds).
**Do instead:** Read the `protected` boolean from `GET /branches/main`. **Current state: `main` is
UNPROTECTED.** Only the owner can change it.
**Source:** 2026-10-01.

---

## Resolved — kept as regression tests

<a id="t28"></a>
### T28 — Auth failures were reported as successes
**Status:** RESOLVED (`4661d3a`, PR #1)
**Bites:** `syncArtworksToFourthwall()` incremented `createdCount` on a non-2xx response, so a **401
reported `Success/Ready: 137, Failed: 0`**.
**Evidence:** Code inspection plus a live 401.
**Do instead:** The write path was **deleted, not repaired** — the endpoint now returns 501 and never reads
credentials from the request body. **A false-success error path is a data-integrity bug, not a logging
bug.**
**Source:** 2026-10-01.

<a id="t29"></a>
### T29 — `/import` was linked from four public surfaces
**Status:** RESOLVED (`13dba2f`, PR #4)
**Bites:** A public link to a Basic-auth route produces a **browser password prompt**, not a crash — so it
is easy to miss.
**Evidence:** Grepping `href="/import"` across `components/**` found **four** links (footer, docs header,
docs sidebar ×2), not the one a note had recorded.
**Do instead:** **Grep the count; never trust a remembered count.** A guard now covers `components/**` —
see its documented blind spots in [`../stack/overview.md`](../stack/overview.md#the-public-surfaces-guard).
**Source:** 2026-10-01.

<a id="t30"></a>
### T30 — `NEXT_PUBLIC_FW_API_URL` pointed at the webhook URL
**Status:** RESOLVED
**Bites:** The app called the wrong host entirely.
**Evidence:** Config inspection; corrected to the Storefront host.
**Do instead:** The two Fourthwall hosts are not interchangeable — see
[`../stack/fourthwall.md`](../stack/fourthwall.md#1-two-apis-two-hosts).
**Source:** 2026-10-01.

---

## Added after the initial migration

<a id="t31"></a>
### T31 — `npm run prettier:check` was never a green gate
**Status:** OPEN
**Bites:** It looks like a formatting gate and is not one. A contributor runs it, sees ~91 files failing,
and either assumes they broke something or runs a repo-wide `prettier --write` — which rewrites most of
the tree and buries their real change in a formatting diff.
**Evidence:** `prettier --check --ignore-unknown $(git ls-files)` at `87cf568` → **"Code style issues found
in 91 files"** out of **103 tracked files** (measured 2026-10-02). Sanity-checked on files untouched by the
measurement: `lib/utils.ts` and `app/page.tsx` both fail. `prettier:check` is **not** referenced by
`.github/workflows/ci.yml`, so it has never blocked anything.
**Do instead:** Treat it as advisory. Format **only the files you touched**
(`prettier --write <paths>`). If the repo ever wants a real formatting gate, the fix is one deliberate
`prettier --write .` commit that touches nothing else — recorded here so nobody mistakes that commit for
damage.
**Source:** 2026-10-02.

<a id="t32"></a>

### T32 — A CRLF checkout breaks the shell scripts
**Status:** MITIGATED (`.gitattributes` pins LF for `*.sh`, `*.py` and `*.env`)
**Bites:** `core.autocrlf = true` rewrites the **working tree** to CRLF on checkout. TypeScript, Markdown
and JSON do not care. **An executable script does**: the shebang becomes `#!/usr/bin/env bash\r` and
`./preflight.sh` dies with *bad interpreter*; a CR inside a `case`, heredoc or `[[ ]]` construct produces
`$'\r': command not found`. It presents as "the script is broken", not "the checkout is broken", which is
what makes it expensive. **A *sourced* file is the same class as an executable** — and was missed:
`BASELINE_TESTS=223\r` is a different value from `223`, so every comparison in `check-baseline.sh` fails
and the guard reports stale counts on a clean tree.
**Evidence:** `git config --get core.autocrlf` → `true`. No `.gitattributes` existed.
`git check-attr text eol -- docs/agentic/scripts/preflight.sh` → **`unspecified`** for both. Scope measured
with `git ls-files --eol | awk '{print $1,$2}' | sort | uniq -c` → **107 files `i/lf w/crlf`**, i.e. the
worktree is already being rewritten repo-wide.
**And again 2026-10-06:** adding `docs/agentic/scripts/baseline.env` produced
`warning: LF will be replaced by CRLF` on `git add`, and `git check-attr text eol -- …/baseline.env` →
**`unspecified`** — the policy covered `*.sh` and `*.py` but not `.env`. `*.env text eol=lf` added.
**Do instead:** `.gitattributes` at the repo root pins `*.sh`, `*.py` and `*.env` to `eol=lf`. **If you add
a new executable — or sourced — file type, add it there too.** A `git add` warning about LF/CRLF is the
signal; do not scroll past it. Note the fix is deliberately narrow — the 107 CRLF files are cosmetic; only
executables and sourced files are a defect.
**Source:** 2026-10-02; extended 2026-10-06.

<a id="t33"></a>

### T33 — A negative probe is not a universal negative
**Status:** OPEN (habit trap)
**Bites:** `command -v codebuddy` returning nothing proves *`codebuddy` is not installed*. It does **not**
prove *no agent CLI is installed*. Generalising the first into the second writes a false statement into a
published document — and a false negative is the most expensive kind, because the reader stops looking. This
one was made and published in this repo's own report before it was caught.
**Evidence:** The first version of
[`../../reports/2026-10-02-agent-usage-insights.md`](../../reports/2026-10-02-agent-usage-insights.md)
asserted **"No such CLI is installed on this machine."** Re-probing a *wider* set found
`claude` → `~/.local/bin/claude`, **Claude Code `2.0.35`**. The original claim was
defensible about `codebuddy` and wrong about the machine.
**Do instead:** State the scope you measured, not the conclusion you inferred — *"no WorkBuddy CLI is
installed"* rather than *"no CLI is installed"*. When the assertion is a **negative about a category**,
probe the category (loop over candidate names), and prefer a byte-level check on a known artifact
(`grep -c` on the binary) over a PATH lookup when the question is *what does this tool read*.
**Source:** 2026-10-02.

<a id="t34"></a>
### T34 — the catalogue list endpoint is capped and cannot be paginated
**Status:** OPEN — **evidence corrected 2026-10-04, see below**
**Bites:** An agent concluded the merch release could only ever use 14 templates, told the owner the
other 11 were unavailable, and built a margin proposal on that false premise. **The real catalogue is
605, of which 274 are backend-renderable.** A whole product line was scoped out of existence by an
unread `total` field. The same defect then reappeared in the *fix*: a probe that counted every
thrown request as "template gone" reported 426/605 on one run and 605/605 on the next, with nothing
changing server-side.
**Evidence:** `GET /open-api/v1.0/product-templates` returns **`results: 25, total: 605`**. The
pagination parameter is honoured in **neither** the query string nor the path in a usable way.
Measured live 2026-10-04:

| call | result |
| :-- | :-- |
| `/product-templates` | `results: 25, total: 605` |
| `/product-templates?page=7` | `results: 25, total: 605` — **byte-identical ids to page 1** |
| `/product-templates?size=1000` | `results: 25, total: 605` |
| `/product-templates?page=1&size=100` | `results: 25, total: 605` |
| `/product-templates/page/2` | `results: 25` — *different* ids, but undocumented |
| `/product-templates/page/25` | `results: 25` — **not the 5 rows an earlier draft of this entry claimed** |

Page-overlap check: `p1∩p2 = 25`, `p1∩p3 = 25`, and `p1` is `===`-identical to `p2` and `p3`. So a
`?page=N` walk collects 25 unique ids and then confidently reports having walked 605.

**The only working enumeration is a seed of real `productId` values plus
`GET /product-templates/{productId}` per id.** Verified 2026-10-04: all **605** ids in
`references/catalog_full.csv` resolved, **0 absent (404), 0 transient**. `lib/fw-seeder/probe-templates.ts`
implements exactly this and reports `seedIdsAbsent404` and `seedIdsUnresolvedTransient` separately.
The full catalog pull and artifacts already exist in-repo at
[`../skills/fourthwall-product-catalog/`](../skills/fourthwall-product-catalog/) — including
`references/catalog_full.csv`, which was **already integrated** before this trap was recorded.
**Do instead:** **Read `total`, and never treat a list endpoint's length as the size of the set.**
When you must enumerate, seed from known ids and verify each one, and **distinguish a real `404`
from a `429`/timeout** — a failed request is not a missing resource. This is the same class of error
as T33: a measurement of *one page* reported as a measurement of *the set*.
**Source:** 2026-10-04.

<a id="t35"></a>
### T35 — a vendored project in `lib/` can hold the answer you are missing
**Status:** OPEN — **evidence NOT reproducible 2026-10-04, see below**
**Bites:** Reported: `lib/fw-revops/` held a complete, measured API profile (605-template catalog,
create-payload schema, Postman collections, rate limits) plus its own `.git` and a `.env.local` with
live credentials — **untracked by the parent repo, and therefore invisible to `git status`, to every
KB search, and to review.** An agent reported "the API exposes 25 templates" while the answer sat in
the repo it was working in.
**Evidence — and its limit:** the *lesson* reproduces; the *cited tree* does not. Re-checked live
2026-10-04 in `shop.roryskagenart.com`:

```
$ du -sh lib/*
  lib/analytics.ts 4.0K   lib/brand-config.ts 4.0K   lib/constants.ts 4.0K
  lib/docs-content.ts 52K  lib/fourthwall 364K  lib/fw-seeder 108K
  lib/taxonomy.ts 12K  lib/types.ts 4.0K  lib/utils.ts 4.0K

$ find . -maxdepth 4 -name .git -not -path './node_modules/*'
./.git
```

**There is no `lib/fw-revops/`, and no nested `.git` anywhere but the root.** So the 13M tree and
its 17-key `.env.local` were either removed since the entry was written or were never in this
checkout; `git ls-files lib/fw-revops` returning empty is equally consistent with "does not
exist". Do not cite this entry as proof that a credential-bearing nested repo is present.
What *is* verifiable and is the real point: `docs/agentic/skills/fourthwall-product-catalog/`
holds the material, and its `references/catalog_full.csv` (605 ids) was already integrated and
answering T34 — while an agent asserted 25 templates from the API. The duplication concern is real;
the specific tree is not.
**Do instead:** **Inventory untracked and nested-repo directories before asserting that something is
unavailable.** `git status --ignored`, `find . -name .git -maxdepth 4`, and a plain `du -sh lib/*` cost
seconds. If a nested project is kept, its credentials must never travel with it — and a vendored tree
that duplicates an integrated skill is a deletion, not a dependency. **And when re-checking an
existing trap entry, run the cited command before restating the evidence:** a trap whose evidence
does not reproduce is worse than a missing trap, because it teaches the next agent to trust a
measurement nobody took.
**Source:** 2026-10-04; evidence re-checked 2026-10-04.

<a id="t36"></a>
### T36 — Upscaling and background-removal cannot manufacture what JPEG destroyed
**Status:** OPEN
**Bites:** The merch release needs 300 DPI masters and transparent PNGs. It is tempting to read
"Cloudinary has `super_resolution` and `background_removal`, and ffmpeg and PIL are installed" as
"the missing masters can be generated." **They cannot.** Upscaling adds no detail, and background
removal on a full-bleed painting produces an opaque image with an alpha channel that is 99.8% `255`.
Either path produces a file that *looks* processed and fails at the printer.
**Evidence:** Measured 2026-10-04 on `today` (2697×3851 JPEG, Cloudinary `xjilp2pq`):
- `e_background_removal/f_png` on `trisaurusmouth-lg` → HTTP 200, **colortype 6 (RGBA)**, but a full
  histogram of all 3,677,184 pixels gives **0 fully transparent pixels; 99.8% at alpha 224–255.** The
  alpha channel exists and carries no cutout.
- PIL `LANCZOS` 2× → 5394×7702 with identical information; `convert('RGBA')` on the JPEG yields alpha
  extrema **(255, 255)** — fully opaque, as every JPEG does.
- Colour-keying is also out: the four corner pixels of `today` are **(114,132,108), (142,172,164),
  (163,168,148), (172,165,155)** — mid-tone green-grey. There is no flat background to key against,
  so a white/green key would eat the painting.
- `ffmpeg` 9.0.1, Ghostscript 10.02.1 and PIL 12.3.0 (webp: yes) are installed. None of them infer
  detail or alpha that is not in the file.
**Do instead:** **Only 45 of the 274 backend-renderable templates avoid the transparency requirement**
(UV 18, SUBLIMATION 15, PRINTED 6, ALL_OVER_PRINT 2, STICKER 2, LASER_ETCHED 2). Scope merchandise to
those, or get real 300 DPI PNG masters from Rory. Treat AI upscaling and matting as **preview tools for
mockups only**, never as a production asset path — and say so when the release is scoped.
**Source:** 2026-10-04.

<a id="t37"></a>
### T37 — Publishing, renaming and tagging are dashboard-only; only `publishOnCreate` exists
**Status:** OPEN
**Bites:** A release that created products hidden has **no API path to publish them.** The obvious
assumption — that you can PATCH a product to make it public — is wrong, and so is renaming or tagging
one. Measured 2026-10-04 against a live hidden product
(`f2cf7bc0-80be-4708-8141-1d2421bb18df`):

| Attempt | Result |
| :-- | :-- |
| `PATCH /products/{id}` `{"access":{"type":"PUBLIC"}}` | **405** Method Not Allowed |
| `POST /products/{id}` / `PUT /products/{id}` (rename) | **405** Method Not Allowed |
| `PUT /products/{id}/access` | **404** no such endpoint |
| `POST /products/{id}/publish` | **404** no such endpoint |
| `GET /products/{id}/tags`, `POST /products/{id}/collections` | **404** |
| `GET /tags` | **404** — tags are not an API concept at all |
| `PUT /products/{id}/availability` `{"available":true}` | **200 but does NOT publish** — `access` stayed `HIDDEN` |

`publishOnCreate` is a **create-time-only** boolean (docs: *"Publish the product immediately on
creation. Defaults to false"*). There is no post-hoc publish, no rename, no retag, and no per-product
collection assignment on the Platform API.

⚠️ **`PUT /availability` has a side effect: it rewrites the slug.** Calling it on the product above
changed `…-enhanced-matte-paper-poster` → `…-enhanced-matte-paper-poster-2` while leaving `access`
`HIDDEN`. Both slugs still resolve on the storefront (verified 200 on each), so nothing broke — but it
is a mutation disguised as a no-op, and it was found by probing, not by reading. Treat
`PUT /availability` as a write (**T02**), not a status check.

**Do instead:** Decide `publishOnCreate` **before** `POST /products`. To publish after the fact, archive
+ recreate — which mints a new id, a new slug, and (because names are de-duplicated silently) needs
`--force` → **T03**. Renaming and tagging are **dashboard-only**. A private staging collection is also
**not creatable via the API**: collections have `available` but no `private` flag, and
`PUT /collections/{id}/products` replaces the entire list → **T05**. Staging must be done by leaving
products hidden.
**Source:** 2026-10-04.

<a id="t38"></a>
### T38 — Promotions cannot publish, target, or reveal a hidden product
**Status:** OPEN
**Bites:** With no publish endpoint (T37), the obvious next idea is a promotion — a discount code that
makes the new products visible or reachable. It does not. A promotion operates on **carts**, and a hidden
product cannot enter a cart, so a promotion over hidden products has nothing to act on. Creating one
would be a live discount with no effect.
**Evidence:** Measured 2026-10-04. The shop's one promotion is `prm_66-jM6bQQQuA12XcdchJIQ`
(`LASTCHANCE_5_CK`, 5% `PERCENTAGE`, `shippingOption: Excluded`, `status: Live`, `usageCount: 0`).
Its scope is **`appliesTo: {"type": "ENTIRE_ORDER"}`** with `type: "SHOP_SINGLE"` — order-level, with no
product, collection, or variant selector anywhere in the payload. `/discounts` and `/coupons` → 404;
promotions are the only such endpoint.
Independently confirmed on the read path: storefront `GET /v1/collections/all/products` returns **10
products, 0 of them non-public** — the hidden products are absent from the storefront entirely, so there
is no listing for a promotion to attach to.
**Do instead:** Do not treat promotions as a publishing or staging mechanism. They are a **post-launch
discount tool**, applied to products that are already `PUBLIC`. Staging = hidden products (**T37**).
If a launch needs a timed discount, the order is fixed: publish first (dashboard), then create the
promotion — never the reverse, and never create a live promotion against hidden stock.
**Source:** 2026-10-04.

<a id="t39"></a>
### T39 — a hidden product is still readable by direct slug
**Status:** OPEN
**Bites:** "Hidden" reads like "inaccessible", and it is not. A product with `access: HIDDEN` is absent
from every collection listing and from the storefront nav, so it looks completely gone — yet
`GET /v1/products/{slug}` on the **Storefront** API still returns **200** with the full record. Two
consequences pull in opposite directions: `publishOnCreate: false` **is** a sound staging mechanism
(browsing cannot reach it), **and** staging is **not** access control (anyone with the slug can read it,
so it must never carry anything sensitive).
**Evidence:** Measured 2026-10-04. `GET /v1/products/gondoleu-soy-wax-candle` with the storefront token →
**200**, `access: HIDDEN`. `GET /v1/collections/col_NIvGTHCLQGOQByOcB-iS4A/products` (the collection that
holds it) → **404**. Also verified: the two new collections appear in `GET /v1/collections` while
returning 404 on their own product list, so **an available collection can appear in the listing while
being an empty shell** — do not infer sellable stock from a collection appearing → **T04**.
**Do instead:** Treat hidden as *not listed*, not *not reachable*. Verify by slug as well as by listing —
it is a legitimate second path when the Platform API is unavailable (**T28**), and it is the cheapest way
to confirm a product exists without publishing it.

⚠️ **This applies to `ARCHIVED` too, and it is the same trap.** Archiving the defective orphan
(`5f239c60-…`, the T06 single-variant poster) on 2026-10-04 correctly moved it to
`access: ARCHIVED` / `state: SOLD_OUT` — but `GET /v1/collections/all/products` **still lists its slug**.
An archived product is removed from purchase but **not** from the storefront listing, so a duplicate
listing survives the archive. Confirmed by slug after archiving: still present in the collection payload.
To actually remove a duplicate from a listing it must be taken out of the collection, not merely
archived. Archive + `PUT /collections/{id}/products` → **T05** (that call replaces the entire list, so
send the complete intended list).
**Source:** 2026-10-04.

<a id="t40"></a>
### T40 — `npm run dev` silently loses the port race; the studio site answers on 3000
**Symptom:** `npm run dev` prints its usual banner and then every localhost:3000 request returns pages
**from a different project**. Requests to `/playground` returned the studio homepage — a totally
different site — with HTTP 200 and no error anywhere.
**Cause:** the studio project (`roryskagenart.com`, the OTHER repo) runs a long-lived Express server on
port 3000. `npm run dev` binds 0.0.0.0:3000; when the port is taken Next.js fails to bind and exits, but
in this shell the failure did not surface — the caller saw a healthy return code and proceeded to test
**the wrong server**. Every check then passed against the studio's HTML.
**Cost:** three tool calls spent verifying the wrong app, plus one false "redirect" conclusion — the page
had not redirected; it was never this app's server at all.
**Evidence:** 2026-10-05. `ss -tlnp | grep :3000` → `pid=1498959, "node-MainThread"` — a process this
repo did not start. `curl -sI localhost:3000` → `X-Powered-By: Express` (studio); the shop answers
`X-Powered-By: Next.js`.
**Do instead:** Before verifying any served page, **confirm the server identity**, not just the status
code: `curl -sI http://localhost:<port>/ | grep -i x-powered-by`. Expect `Next.js`. On collision, start
on a free port explicitly — `npm run dev -- -p 3111` — and re-confirm the header before trusting any
rendered output. Server identity is part of verification; a 200 from the wrong process proves nothing.
**Source:** 2026-10-05.

<a id="t41"></a>
### T41 — The gate baseline was duplicated in six places, and four of them drifted
**Status:** RESOLVED
**Bites:** A stale baseline **fails the gate on a clean tree**, and the failure text points at the
opposite of the truth: `verify.sh` prints *"a DROP means a guard was deleted"* when in fact nothing was
deleted and the documented number was simply old. Worse, the number a reader trusts depends on which file
they happen to open — so an agent can "verify" a change against a baseline that was never true.
**Evidence:** Measured 2026-10-06 at `main` = `42786bb7`. `./node_modules/.bin/vitest run` →
**`Test Files 15 passed (15)` / `Tests 223 passed (223)`**. The tree simultaneously claimed:

| Carrier | Claimed |
| :--- | :--- |
| `docs/agentic/scripts/verify.sh:20-21` (now `baseline.env`) | 223 / 15 ✓ |
| `docs/agentic/stack/overview.md:98` (now `:103`) | 223 passing ✓ (but its file list held 14 entries against a claimed 15, with a literal `\n` joining three of them) |
| `AGENTS.md:55,103` | **137 / 11** |
| `docs/agentic/protocols/verification.md:13` | **163 / 13** |
| `docs/agentic/protocols/preflight.md:56`, `scripts/preflight.sh:26-27`, `lib/fourthwall/AGENTS.md:54`, `scripts/AGENTS.md:48-49` | **97 / 6** |

Line numbers are as measured **before** the fix — every carrier was rewritten by it.

**Root cause — and it was not carelessness:** `AGENTS.md` §5 instructed a contributor to update exactly
**two** files when the count changed (`verify.sh`, `stack/overview.md`). Four carriers were never named,
so nothing could fail on them. **A guard that does not know a file exists cannot fail on it.**
**Fixed by:** 2026-10-06, `fix/preflight-and-baseline-reconciliation`. The count now lives in one place,
[`../scripts/baseline.env`](../scripts/baseline.env); `verify.sh` and `preflight.sh` **source** it rather
than inlining it; `AGENTS.md` §5 names every carrier; and
[`../scripts/check-baseline.sh`](../scripts/check-baseline.sh) is a new gate that fails if any document
quoting the count disagrees with it, if the on-disk test-file count moves, or if `overview.md`'s list
stops matching. **Observed red first** — 6 FAILs — then green, which is the point.
**Do instead:** Never inline the baseline. Change `baseline.env`, run `check-baseline.sh`, fix what it
flags. Add any new document that quotes the count to the `CARRIERS` list in the same change.
**Source:** 2026-10-06.

<a id="t42"></a>
### T42 — The `/docs` palette table documents tokens and colours that no longer exist
**Status:** OPEN — **found 2026-10-06, not fixed.** Deliberately left out of a docs-reconciliation
release, because rewording public product copy is a product decision.
**Bites:** `lib/docs-content.ts:1159-1170` tells a reader the design tokens are `--background`,
`--card`, `--foreground`, `--border`, `--line-strong`, `--accent` with values `#e3e1da` / `#17171b` /
`#1c1c20` / `#d2cfc6` / `#3a3a40` / `#b45309`. **None of that is live.** `app/globals.css:12-51` defines
`--brand-bg`, `--brand-fg`, `--brand-bg-card`, `--brand-surface`, `--brand-surface-deep`,
`--brand-border`, `--brand-line-strong`, `--brand-fg-muted`, `--brand-accent`. Live values, light →
dark: `--brand-bg` `#c2c9d1`→`#464e58`, `--brand-fg` `#16202b`→`#eef2f6`, `--brand-bg-card`
`#edeff2`→`#2f353c`, `--brand-border` `#c3c9d0`→`#515761`, `--brand-line-strong` `#bcc2c8`→`#828e9b`,
`--brand-accent` `#22d3ee` in both. Both the **names** and the **values** in the docs table are wrong,
and it still calls the palettes "Gallery Stone" / "Charcoal Gallery" — names `lib/brand-config.ts:34-72`
now keeps only as *legacy migration aliases* (`galleryStoneLight`, `charcoalGalleryDark`).
**Evidence:** 2026-10-06. `app/globals.css:12-51` (live) vs `lib/docs-content.ts:1159-1170` (documented)
vs `lib/brand-config.ts:34-72` (Skagen Light/Dark). PR #14 "sync Skagen Light/Dark palette from studio
design panel" changed the CSS and the config but not the `/docs` copy.
**Do instead:** Treat `app/globals.css` as the token source of truth; it and `brand-config.ts` are
asserted together by hand today, and nothing checks the `/docs` table. A guard that derives the table
from the CSS would close it — see **T41** for the shape of that fix.
**Source:** 2026-10-06.

<a id="t43"></a>
### T43 — A renamed Vercel project keeps its old `*.vercel.app` alias, so the retired name still resolves
**Status:** RESOLVED — the documents were corrected 2026-10-06; the *mechanism* is permanent.
**Bites:** A stale project identifier **keeps working**, so it never announces itself. After the Vercel
project was renamed `shop-roryskagen-com` → `shop.roryskagenart.com`, the old alias
`shop-roryskagen-com.vercel.app` stayed **attached and verified**, and deployments still answer on it. So
*"the old name resolves"* is not evidence that the old name is current — the same shape as **T23**, where
a renamed GitHub repo keeps serving through a redirect.
**Evidence:** Measured 2026-10-06. `GET /v9/projects/prj_u3hPHBRFkibIkIkthndzS1sjvhKJ/domains` returns
**both** `shop.roryskagenart.com` (`verified: true`) **and** `shop-roryskagen-com.vercel.app`
(`verified: true`). The project id and the team id are the *same* as in the 2026-10-01 record
(`team_lD7ZSbm44CpPmByF9eN22dJT` = `shop-roryskagen-com`), but the names now read
`name: shop.roryskagenart.com` and team `slug: roryskagenart` — equal ids, different names, which is what
proves a rename rather than a different project. `stack/environments.md` carried the old pair for five
days; `link.updatedAt` = **2026-10-03** marks the change. The team slug is `roryskagenart` and the team
*name* is `roryskagen` — the two are not the same string, and neither was ever `roryskagen-5713`.
**Do instead:** Treat a Vercel identifier as **untrusted** until re-read from the API, and compare the
**id**, not the name — `prj_…` and `team_…` are immutable, so equal ids prove the same object while the
display names drift. Never conclude "it still resolves, so it is current".
[`../stack/environments.md`](../stack/environments.md)
**Source:** 2026-10-06.

<a id="t44"></a>
### T44 — A lowercase drive letter in the cwd silently disables `vi.mock`
**Status:** MITIGATED — the gate re-enters the repo root with a canonical path. The casing sensitivity
itself is upstream and unfixed.
**Bites:** On Windows, `process.cwd()` returns a **lowercase drive letter** (`c:\…`) when the shell
inherited one — which is not exotic here: it is how this machine's agent shell starts. Vitest derives
module paths from that string, they disagree in case with the paths the runner itself uses, and Node
caches modules by **path string** — so two `vitest` instances load. The failure is **silent, selective and
gate-destroying**: `vi.spyOn` keeps working while `vi.mock` stops being hoisted, so only the files using
`vi.mock` fail (4 files, 23 tests) with `TypeError: vi.mocked(...).mockResolvedValue is not a function` —
which reads like a broken test, not a broken runner. On a full run every suite can fail to load instead,
and then [`../scripts/verify.sh`](../scripts/verify.sh) reports **"a DROP means a guard was deleted"** and
*"GATES FAILED"* — a false accusation that invites someone to "fix" the baseline.
**Evidence:** Measured 2026-10-06. The lowercase cwd is reproducible on demand:
`node -e "process.chdir('c:/…'); console.log(process.cwd())"` → `c:\…`. With it,
`bash docs/agentic/scripts/verify.sh` → 15 files failed, *"no tests"*, **GATES FAILED (2)**, exit 1. From
an uppercase cwd — or after the fix below — the same script → 223 tests / 15 files and *"All gates
green"*, exit 0. A 3-line probe (`vi.mock('./lib/utils', …)` then `import { sentinel }`) returns
`undefined`, proving hoisting is skipped rather than the factory throwing. Ruled out by measurement:
CRLF (the probe was pure LF), the transform cache, the config loader (`.ts` vs an equivalent `.mjs`), four
pool modes, a duplicate `node_modules` above the repo, the esbuild platform binary, the injected
`NODE_OPTIONS` shim, and the pre-change config. The affected test files are **byte-identical to `HEAD`**
(`git hash-object` matches `HEAD:<path>`) and CI on ubuntu is green — environmental, not a regression.
**Do instead:** Run the gate through [`../scripts/verify.sh`](../scripts/verify.sh), which `cd`s to the
repo root via `pwd -W` so the drive letter is canonical. If you invoke `vitest` yourself, **read the
`RUN v…` banner** — `c:/…` is the defect, `C:/…` is healthy.
**Tried and reverted — do not repeat:** `root: fs.realpathSync.native(__dirname)` in `vitest.config.ts`.
It appeared to fix this, but only because `node_modules` was bun-installed at the time; Bun **symlinks**
its packages, so realpath canonicalisation happened anyway. Against an npm-installed tree it changes
nothing. See **T46** for why the install method matters.
**Source:** 2026-10-06.

<a id="t45"></a>
### T45 — A public footer link pointed at a domain that does not exist
**Status:** PARTIALLY RESOLVED — the footer link is fixed 2026-10-06; two more references are **OPEN**
because their correct value is a product decision.
**Bites:** [`../../../components/layout/footer.tsx`](../../../components/layout/footer.tsx) rendered a
link labelled *"Rory Skagen Studio Archive"* at `https://shop.roryskagen.com` — on **every public page**.
That domain is **NXDOMAIN**: it does not resolve, so every visitor who clicked it got a browser error.
Nothing in CI, and no test, looks at a link *target*, so a dead link is invisible to the gate. The string
was also a **hardcoded duplicate** of a domain that already lives in `BRAND_CONFIG.domains`.
**Evidence:** Measured 2026-10-06. `curl -sS "https://dns.google/resolve?name=shop.roryskagen.com&type=A"`
→ **`Status: 3` (NXDOMAIN)**; `shop.roryskagenart.com` → `Status: 0` with Vercel A records and HTTP 200
→ `/USD`; `roryskagenart.com` → `Status: 0`. `lib/brand-config.ts:16-18` already defines
`portfolio: 'https://roryskagenart.com'` and `shopCustomDomain: 'https://shop.roryskagenart.com'`, and the
footer already imports `BRAND_CONFIG`. The string arrived in `f1a1c8f` (the initial catalogue commit).
**Do instead:** Use `BRAND_CONFIG.domains.*` — never a hardcoded domain. **Fixed:** the footer link now
reads `BRAND_CONFIG.domains.shopCustomDomain`, preserving the original self-link intent. **Still open:**
`lib/fourthwall/index.ts:170-171,754` (`MOCK_SHOP.domain` / `publicDomain`, a fallback used only when
`NEXT_PUBLIC_FW_CHECKOUT` is unset) and the public `/docs` copy at `lib/docs-content.ts:723,944` — the
correct value there is a product decision, so it is surfaced rather than guessed. A guard that resolves
every external link target would close the class; see **T41** for the shape of that fix.
**Source:** 2026-10-06.

<a id="t46"></a>
### T46 — Three package managers are referenced; only npm is real, and the choice changes test behaviour
**Status:** OPEN — the README is fixed; `bun.lock` is still tracked.
**Bites:** `package-lock.json` is the lockfile CI uses (`npm ci`), a `bun.lock` is committed, and the
README told you to run `pnpm install`. Nothing in `package.json` says which is authoritative — there is
no `packageManager` field and no `name`. So an agent picks one, and **the choice is not cosmetic**: on
2026-10-06 this machine's `node_modules` had been installed by **bun** (`node_modules/.bin` held 28 `.exe`
+ 28 `.bunx` and **zero** npm shims), and Bun's symlinked layout **masked T44** — the test suite passed
there and failed identically on a fresh `npm ci`. A tree that is green under one installer and red under
another is worse than no tree. `bun install` also rewrites `react`/`react-dom` inside `bun.lock`, which
then reads as a real dependency change.
**Evidence:** Measured 2026-10-06. `ls node_modules/.bin | grep -c '\.exe$'` → 28 and
`grep -c '^[^.]+$'` → 0 on the bun tree; after `npm ci` → 28 extension-less + 28 `.cmd`, 0 `.exe`. Same
`vitest` 4.1.11 / `vite` 8.3.1 / `esbuild` 0.28.2 in both. `npm ci --dry-run` exits 0, so the npm
lockfile is the one that matches `package.json`. CI (`.github/workflows/ci.yml`) runs `npm ci`.
**Do instead:** **npm.** `npm ci` (foreground — never a background install after a wipe), then
`npm run dev`. Do not run `bun install`; if it happens, `git checkout HEAD -- bun.lock` and re-install
with npm. Read [`../stack/overview.md`](../stack/overview.md#package-manager).
**Source:** 2026-10-06.

<a id="t47"></a>
### T47 — The home page's featured sections read a collection handle that does not exist
**Status:** RESOLVED for the home page 2026-10-07 — the underlying fallback (**T01**) is still OPEN.
**Bites:** "Featured Works" and the product carousel on `/USD` looked like live storefront content and
were not. Both read one handle from `NEXT_PUBLIC_FW_COLLECTION`, which is set to `fine-art-originals` — a
collection that **does not exist in the shop**. The storefront API answers `404`, `getCollectionProducts`
catches it and falls through to the **local JSON catalogue**, so the home page served 15 hardcoded
originals with a working add-to-cart while the real catalogue never appeared on it. **Nothing throws, the
page returns 200, and the products look plausible** — the same defect as T01, reached by a different road:
a fallback that is indistinguishable from success, and a config value that reads as correct because it is
a name from `lib/taxonomy.ts`.
**Evidence:** Measured 2026-10-07.
`GET https://storefront-api.fourthwall.com/v1/collections/fine-art-originals/products?storefront_token=…`
→ **HTTP 404** `{"code":"COLLECTION_NOT_FOUND_BY_SHOP_ID_AND_SHOP_ERROR","slug":"fine-art-originals"}`. The
token is valid — `GET /collections` on the same host returns **5** collections, and per-collection product
counts are **6 / 2 / 4 / 1 / 10**:

| slug | Fourthwall name | products |
| :-- | :-- | --: |
| `gifts-goodies` | The Goods | 6 |
| `wall-artwork` | `" Wall Art"` — note the leading space | 2 |
| `studio-editions` | Studio Editions | 4 |
| `original` | Original Artwork | 1 |
| `all` | All Products | 10 |

None of the four real slugs is in `PRODUCT_COLLECTIONS`, so `getCollections()` returns them as *extras* and
every one of them labels from Fourthwall's own name. `lib/fourthwall/index.ts:448` is the fallback branch
`fine-art-originals` hits.
**Do instead:** Drive the home page from `getCollections()` — the same source as the header menu — so the
two surfaces cannot disagree, and stop treating `NEXT_PUBLIC_FW_COLLECTION` as a home-page input.
`components/grid/collection-sections.tsx` renders one group per stocked collection, `all` excluded because
it is a superset. **Still open:** the fallback itself (T01) — the 15 originals remain add-to-cart-able at
`/collections/fine-art-originals`, a live URL that no menu links to. **Also open:** `lib/taxonomy.ts` no
longer matches the live catalogue at all (T04's "taxonomy title wins" rule now applies to zero live
collections).
**Source:** 2026-10-07.

<a id="t48"></a>
### T48 — The storefront API ignores `limit` on a collection's products
**Status:** OPEN (vendor behaviour)
**Bites:** `getCollectionProducts({ limit: n })` reads as a cap and is not one on the live path. A caller
that trusts it renders the whole collection. It caps **only** the local JSON fallback
(`ORIGINALS.slice(0, limit)`), so the defect is invisible in exactly the environment where the fallback
runs, and appears the moment real stock exists.
**Evidence:** Measured 2026-10-07 against the storefront API, collection `gifts-goodies` (6 products):
`?limit=4` → **6**, `?limit=2` → **6**, no `limit` → **6**. The param is passed correctly
(`lib/fourthwall/index.ts:435-437`) and simply not honoured. Caught in the wild the same day: the first
build of the grouped home page rendered 13 products instead of the intended 11.
**Do instead:** Slice at the call site — `components/grid/collection-sections.tsx` does
`.slice(0, PER_GROUP)`. Same class as **T34**: the length of a list endpoint is not something you can
negotiate with a query param, so read what you got and cut it yourself.
**Source:** 2026-10-07.

<a id="t49"></a>
### T49 — A Tailwind opacity modifier on a `var()` colour token silently emits no CSS
**Status:** MITIGATED 2026-10-08 — the three instances are fixed; nothing yet stops the next one.
**Bites:** Any `<utility>-<token>/<n>` class whose token value is a bare `var(--…)` — here
`bg-brand-accent/20`, `bg-brand-bg-card/95`, `border-brand-border/60` — compiles to **nothing**. There is
no build error, no warning, and no rule in the output: the class is simply absent from the stylesheet, so
the element keeps `transparent` or its inherited border. It reads as a styling choice that did not take,
which is exactly why it survives review.
**Evidence:** Measured 2026-10-08 by compiling this repo's own config with the Tailwind CLI
(`./node_modules/.bin/tailwindcss -c tailwind.config.js`). A probe document carrying
`bg-brand-accent/15`, `bg-brand-accent/30`, `bg-brand-bg-card/95` and `border-brand-border/60` produced
three rules — **none** of them an opacity-modified class. `.bg-brand-bg-card`, `.border-brand-border` and
`.border-brand-line-strong` all emitted; every `/n` variant emitted nothing.

Found in the wild rather than by a test: the sticky header had been rendering with **no background colour
at all** — `getComputedStyle(nav).backgroundColor` → `rgba(0, 0, 0, 0)` — and the collection submenu's top
divider was missing. Both classes were written in the previous change and both read as correct in source.
**Do instead:** Use `color-mix` in a component class, which reads the live token and stays theme-aware:

```css
.surface-accent-soft {
  background-color: color-mix(in srgb, var(--brand-accent) 20%, var(--brand-bg-card));
}
```

For hierarchy *inside* a coloured band, a plain `opacity-*` utility on the element works — it is the
colour-opacity modifier that does not. See `app/globals.css` (`.surface-accent`, `.surface-accent-soft`).
**Recommended follow-up:** a guard that scans `app/**` and `components/**` for `-brand-[a-z-]+/[0-9]+` and
fails. Not written yet, which is why this is MITIGATED rather than RESOLVED.
**Source:** 2026-10-08.

<a id="t50"></a>
### T50 — A container's max-width equal to its breakpoint makes the gutter stop growing
**Status:** RESOLVED 2026-10-08 — replaced by `.page-shell`.
**Bites:** `mx-auto max-w-screen-2xl px-4` reads as "a wide container with padding" and is not one.
`max-w-screen-2xl` is **1536px** and Tailwind's `screen-2xl` breakpoint is **also 1536px** — the same number
doing two unrelated jobs — so the container reaches its cap at exactly the viewport width where the layout
is meant to be at its most spacious. Between roughly 1440px and 1536px the container is pinned at its max
width while the gutter stays a flat **16px**, i.e. the desktop gutter is byte-for-byte the mobile gutter.
Nothing errors and nothing warns, and the page looks *plausible* — the content is simply too close to the
edges — which is why it survives review as "the design" rather than as a bug.
**Evidence:** Measured 2026-10-07 on the storefront. `max-w-screen-2xl` = 1536px (this repo's
`tailwind.config.js` does not override `screens`, so it is Tailwind's default) and `screens['2xl']` =
1536px. At a 1440px viewport the container measured 1440px wide with `px-4` gutters of **16px** — identical
to the gutter at 390px. Reported by the owner as *"The desktop layout is max wide with no padding like it's
mobile"*, which is precisely what it was.
**Do instead:** Keep the container cap strictly **above** the largest gutter breakpoint, and let the gutter
grow with the viewport. `.page-shell` in `app/globals.css` uses `max-w-[1560px]` with
`px-5 sm:px-8 lg:px-12 xl:px-16` → 20 / 32 / 48 / 64px. Then assert the **computed** padding at two or three
widths instead of reading the class list — the class list is where the intent lives, and the intent here was
satisfied by a number that meant something else.
**Source:** 2026-10-08.

<a id="t51"></a>
### T51 — An option group with an empty `values` array renders a label over nothing
**Status:** RESOLVED 2026-10-08 — filtered before the guard.
**Bites:** `components/product/variant-selector.tsx` rendered one `<dl>` per product option
**unconditionally**, so an option carrying no values printed a bare `<dt>` label above an empty `<dd>`: two
headings floating over nothing, followed by a dead gap before Add To Cart. It presents as a **spacing** bug
and is actually a **data** bug — and the guard meant to prevent it tested `options.length`, which counts the
empty groups too, so it could never fire.
**Evidence:** Measured 2026-10-07 against live stock. The Fourthwall product `gondeoleu` declares a `COLOR`
option and a `SIZE` option whose `values` arrays are both **empty**; the rendered page showed the `COLOR`
and `SIZE` labels with no swatches under either. `options.length` was non-zero, so
`hasNoOptionsOrJustOneOption` returned `false` and both blocks rendered. Reported from a screenshot as
*"all the product individual pages have spacing issues"* — the reported symptom was two steps away from the
cause.
**Do instead:** Filter **before** the guard, never after:

```ts
const visibleOptions = options.filter((option) => option.values.length > 0);
const hasNoOptionsOrJustOneOption =
  !visibleOptions.length || (visibleOptions.length === 1 && visibleOptions[0]?.values.length === 1);
```

Filtering afterwards leaves the guard counting the empty groups and the void comes straight back. An option
a shopper cannot choose is not an option.
**Source:** 2026-10-08.
