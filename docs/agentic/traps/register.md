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
**Status:** OPEN
**Bites:** The GitHub remote is **not** derivable from the folder name, the Vercel project, or the custom
domain. Inferring it points work at the wrong repository.
**Evidence:** Local folder `shop.roryskagenart.com`; Vercel `roryskagen-5713/shop-roryskagen-com`; domain
`shop.roryskagenart.com`; **GitHub `roryskagenart/shop.roryskagen.com`** (`.com`).
**Do instead:** Use the table in [`/AGENTS.md`](../../../AGENTS.md#2-read-this-before-you-name-anything).
**Source:** 2026-10-01.

<a id="t24"></a>
### T24 — Two version spaces disagree
**Status:** OPEN
**Bites:** Naming a release from the wrong scheme produces two contradictory plans, and the repo follows
the wrong one.
**Evidence:** `lib/brand-config.ts:66-101` calls **`v1.1.0` "Step 1 (Current Release)"** (mirrored at
`lib/docs-content.ts:1178-1190`), but `git tag` shows **only `v0.1.0`**. The current plan uses `v0.2.0`.
**Do instead:** Check `git tag` and the plan directory before naming anything. Pick one scheme explicitly.
**Source:** 2026-10-01.

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
**Status:** MITIGATED (`.gitattributes` pins LF for `*.sh` and `*.py`)
**Bites:** `core.autocrlf = true` rewrites the **working tree** to CRLF on checkout. TypeScript, Markdown
and JSON do not care. **An executable script does**: the shebang becomes `#!/usr/bin/env bash\r` and
`./preflight.sh` dies with *bad interpreter*; a CR inside a `case`, heredoc or `[[ ]]` construct produces
`$'\r': command not found`. It presents as "the script is broken", not "the checkout is broken", which is
what makes it expensive.
**Evidence:** `git config --get core.autocrlf` → `true`. No `.gitattributes` existed.
`git check-attr text eol -- docs/agentic/scripts/preflight.sh` → **`unspecified`** for both. Scope measured
with `git ls-files --eol | awk '{print $1,$2}' | sort | uniq -c` → **107 files `i/lf w/crlf`**, i.e. the
worktree is already being rewritten repo-wide.
**Do instead:** `.gitattributes` at the repo root pins `*.sh` and `*.py` to `eol=lf`. **If you add a new
executable script language, add it there too.** Note the fix is deliberately narrow — the 107 CRLF files
are cosmetic; only executables are a defect.
**Source:** 2026-10-02.

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
