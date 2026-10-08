---
name: fourthwall-product-launch
description: "Use when creating, publishing, pricing, or taking down Fourthwall products via the Platform API — seeding a merch catalogue from artwork, choosing templates, setting profitMargin, verifying a create, or diagnosing why a created product will not appear on the storefront. Covers the 605-template catalogue and the 274 that can actually render, the non-transparency subset that JPEG artwork can satisfy, print-fit gating by aspect ratio, and the hard limits: no publish-after-create, no rename, no tags, no private collections, promotions cannot substitute. Also use when a product created hidden cannot be made public by API, or when a launch looks complete but the storefront is unchanged."
version: 1.0.0
x-origin: shop.roryskagenart.com
x-created: 2026-10-04
---

# Launching Fourthwall Products

**Core rule: `publishOnCreate` is a decision you make ONCE, at `POST /products`. There is no second
chance from the API.** Everything downstream — publishing, renaming, tagging, staging, discontinuing —
is dashboard-only. Design the whole release around that one irreversible field.

This skill exists because every rule below was learned by hitting it. The traps are cited so the
reasoning survives; read the trap, not just the rule.

---

## 0. Before you start — the four questions

Answer all four, in writing, before any `POST`. Each one is expensive to get wrong later.

| #   | Question                                            | If unanswered                               |
| :-- | :-------------------------------------------------- | :------------------------------------------ |
| 1   | **Which templates, and are they in the 274?**       | A config full of 404 ids → **T07**, **T34** |
| 2   | **Does the artwork satisfy the transparency rule?** | 229 of 274 rejects → **T36**                |
| 3   | **Does the artwork fit the print area?**            | Bad crops that ship → §4                    |
| 4   | **`publishOnCreate`: true or false?**               | **No API path to publish later** → **T37**  |

---

## 1. The catalogue is 605, not 25 — and 274 of those can render

`GET /product-templates` returns **25 rows against `total: 605`**. Read the `total`.

⚠️ **Do not try to paginate this.** Query params (`?page=`, `?size=`) are **silently ignored** — page 7
returns byte-identical ids to page 1, so a naive walk collects 25 unique ids and then confidently
reports having walked 605. The undocumented path form `/product-templates/page/{n}` returns _different_
ids per page, but it is not a documented shape and its end-of-catalogue behaviour is unverified. **Do not
build a denominator on it.**

The only enumeration verified to work is a **seed of real `productId` values, each confirmed by a direct
`GET /product-templates/{productId}`**. `lib/fw-seeder/probe-templates.ts` implements exactly this and
reports `seedIdsAbsent404` and `seedIdsUnresolvedTransient` **separately** — a 429 is not a missing
template. Artifacts already in-repo: `docs/agentic/skills/fourthwall-product-catalog/references/catalog_full.csv`
(one row per template) and `catalog_summary.json`.

A partial read here caused a whole product line to be wrongly scoped out of existence → **T34**.

### The 274 that matter

Filter on `supportsBackendRendering: true` — that is what the design pipeline can actually render.
**`false` does not mean "out of stock"**, it means the pipeline cannot place artwork on it.

### The non-transparency subset — this is the real gate

| Method           | Buildable | Transparency |
| :--------------- | --------: | :----------- |
| `DTG`            |       135 | **required** |
| `DTFX`           |        94 | **required** |
| `UV`             |        18 | not needed   |
| `SUBLIMATION`    |        15 | not needed   |
| `PRINTED`        |         6 | not needed   |
| `ALL_OVER_PRINT` |         2 | not needed   |
| `STICKER`        |         2 | not needed   |
| `LASER_ETCHED`   |         2 | not needed   |

**45 templates** need no transparency. If the source art is JPEG, **45 is your ceiling** — not 274.
`DTG`/`DTFX`/`EMBROIDERY` require transparent PNG, and JPEG cannot yield it.

⚠️ **Transparency cannot be manufactured.** Measured: Cloudinary `e_background_removal` returns RGBA but
**0 fully transparent pixels, 99.8% at alpha 224–255** on a full-bleed painting. LANCZOS upscaling adds
no information. Colour-keying fails because the corners are mid-tone, not a flat background. → **T36**

---

## 2. Identifiers — `productId`, never a name

Templates are keyed by opaque **`productId`** (`pro_…`). The dashboard label (`"Mugz M065"`) is **not an
id** and 404s with `PRODUCT_CATALOG_PRODUCT_ID_NOT_FOUND`. Names also collide legitimately — two
"Gildan Classic Hoodie" differing only by production method.

**Pin `productTemplateId`. Never resolve by name.** → **T07**

```ts
// ProductTemplate declares productId, NOT id — the wire format has no `id` field.
export interface ProductTemplate {
  productId: string;
  name: string;
  brand?: string;
  basePrice?: { amount: number; currency: string };
  productionMethod?: string;
  supportsBackendRendering?: boolean;
}
```

---

## 3. `regions[].region` is a `regionId`, not a placement name

A hardcoded `"front"` works for a tee and is **rejected for a mug**. Read each template's own areas:

```bash
curl -s --compressed -u "$USER:$PASS" \
  "https://api.fourthwall.com/open-api/v1.0/product-templates/$PRODUCT_ID"
# -> customizableAreas[].regionId, .dimensions, .placements[]
```

⚠️ **Do not filter areas on `available`.** It is not ground truth: a live, orderable template was measured
returning `available: false` on **both** its areas, and the filter turned that into an empty array — which
reads as "no printable region" and silently stops a release. → the fix is in `getTemplateAreas()`

---

## 4. Print-fit gate — do not ship a crop you did not measure

For each (artwork × template) pair compute, against the region's pixel dimensions:

- **retained** = fraction of the artwork surviving a centre-crop to the region aspect ratio
- **covers** = `min(artW/regionW, artH/regionH)` — must be **≥ 1.0**, or you are upscaling

```python
rar, aar = regionW/regionH, artW/artH
retained = (rar/aar) if aar > rar else (aar/rar)
covers   = min(artW/regionW, artH/regionH)
accept   = retained >= 0.85 and covers >= 1.0
```

**A realistic launch is small.** In the measured case, **6 of 240** candidate pairs passed. The other 39
non-transparency templates failed on _resolution_, not preference. **Do not relax the gate to
manufacture volume** — that is padding a catalogue with crops that print badly. A short launch that
prints well beats a long one that does not.

---

## 5. Pricing — `profitMargin` is USD, not a percentage

```jsonc
{ "profitMargin": 10 }

// +$10.00 on top of base cost
```

A **margin** is a USD amount; a **margin %** is a fraction of the retail price. Fourthwall's guidance:
minimum **20% margin AND $10 profit** per sale, healthy band **40–60%**. Use the larger floor so both
constraints hold.

⚠️ **The margin is per PRODUCT, not per variant.** One `profitMargin` across a size ladder means an 8×10 and
a 24×36 carry different real margins. Measured live 2026-10-04: the Framed Matte Poster spanned
**$40.70 → $94.76** on a single $20.35 margin (base $20.35 → $74.41), and the Enhanced Matte poster
**$12.50 → $23.50** on a $5.50 margin. Expect a price spread you did not choose. (An earlier note here
claimed "$11.00 → $94.76 on one $5.50 margin" — that was a dry-run estimation error, corrected after
re-GETting every live variant: each prices at exactly `base + margin`.)

Convert from a retail target with `profitMarginForTarget(target, base)` — it returns `null` rather than
building an unsellable product. A missing margin returns **406 `PRICING_CALCULATION_NOT_SUPPORTED`**.

---

## 6. `sizes` must be explicit — omitting it silently makes ONE variant

Omitting `sizes` does **not** create all sizes. It creates exactly one variant, typically the smallest.
This bit production once and was **reproduced live** during a measured launch: a poster template that
offers a full size ladder produced a product with 1.

⚠️ **Read the ladder from the API — it is nested, not absent.** The detail document has **no top-level
`sizes` or `sizeVariants` key**, and `sizeGuide` is `{url: null, content: null}` on every template. That
is what made an earlier version of this skill conclude the sizes were unreadable and recommended
transcribing them by hand. They are readable, at **`colorVariants[].sizeVariants[].size`**:

| template                         | colours | **distinct** sizes | sizeVariants | per-size price  |
| :------------------------------- | ------: | -----------------: | -----------: | :-------------- |
| Enhanced Matte Paper Poster      |       1 |             **14** |           14 | $5.50 – $18.00  |
| Framed High-Quality Matte Poster |       3 |             **12** |       **36** | $20.35 – $74.41 |

⚠️ **"How many sizes?" has two honest answers: 12 or 36.** Sizes are per colour variant, so 3 colours ×
12 sizes = 36 `sizeVariants` carrying only **12 distinct** sizes. Both figures appear in the wild and
they describe different products — 12 variants vs 36. State which you mean, and de-duplicate the
ladder before building a config.

Each entry is `{variantId, size, price, available}` — so **per-size pricing is readable too**, which
this skill previously said it was not.

```ts
const sizes = [
  ...new Set(
    (detail.colorVariants ?? []).flatMap((c) =>
      (c.sizeVariants ?? []).map((s) => s.size).filter(Boolean)
    )
  )
];
```

- **Single-product CLI mode has no `--sizes` flag** → it cannot produce a correct multi-size product at
  all. Use config mode for anything with a size ladder. → **T06**
- **The API's size spelling is inconsistent** (`"20 oz"`, not `"20oz"`; note the `″` character in the
  poster sizes). Copy exactly, never normalise — a normalised string will not match a variant.
- Sizes are **per colour variant**, so de-duplicate rather than shipping colour × size.

---

## 7. Verify by re-GET — never trust the script's own log

A previous run reported `Success: 137, Failed: 0` **on a 401**. → **T28**

```bash
curl -s --compressed -u "$USER:$PASS" \
  "https://api.fourthwall.com/open-api/v1.0/products/$PRODUCT_ID"
```

Assert on `state.type == "AVAILABLE"`, `access.type`, variant count, and price — compared against the
**expected** value, not against "it returned 200". **Cache-bust** before concluding a write failed; the
CDN caches per exact URL → **T11**.

Write a **ledger** of every created `productId` with its verification result. It is the only thing that
makes a partial batch recoverable.

Two wire-format facts measured during the v0.2.0 verification (2026-10-04), both of which make a correct
apply look broken if you do not know them:

- **`GET /collections` (Platform, list) omits `offerIds`.** Every collection reads `offerIds: []` in the
  list response; the count comes back only on the per-collection `GET /collections/{id}`. A verifier that
  reads the list and asserts on `offerIds.length` will report healthy collections as empty. Re-`GET` each
  collection individually before concluding a population write failed.
- **`unitPrice.value` is a plain dollar amount, not cents.** A $22 mug serialises as `{"value": 22}` on
  both the Platform and Storefront APIs. Dividing by 100 turns a correct price into a false failure.

---

## 8. What the API cannot do — measure before you promise it

All measured 2026-10-04 against a live hidden product.

| Attempt                                | Result                                |
| :------------------------------------- | :------------------------------------ |
| `PATCH /products/{id}` → `PUBLIC`      | **405**                               |
| `POST` / `PUT /products/{id}` (rename) | **405**                               |
| `PUT /products/{id}/access`            | **404**                               |
| `POST /products/{id}/publish`          | **404**                               |
| `GET /tags`, `GET /products/{id}/tags` | **404** — tags are not an API concept |
| `POST /products/{id}/collections`      | **404**                               |
| `PUT /products/{id}/availability`      | **200 — but does NOT publish**        |

**Consequences:**

- **Publishing** is create-time only. To publish later: archive + recreate → new id, new slug, and
  `--force` because names de-duplicate silently → **T03**
- **Renaming and tagging** are dashboard-only
- **A private staging collection is not creatable.** Collections have `available`, no `private` flag, and
  `PUT /collections/{id}/products` **replaces the whole list** → **T05**. **Hidden products are the
  staging area** — that is what they are for.
- ⚠️ **`PUT /availability` rewrites the slug** while leaving the product hidden. Both slugs still resolved,
  so nothing broke — but it is a **write disguised as a no-op**. Treat it as a write → **T02**, **T37**

### Promotions are not a workaround

The shop's one promotion is `appliesTo: {"type": "ENTIRE_ORDER"}`, `type: SHOP_SINGLE` — **order-level,
with no product/collection/variant selector**. A promotion operates on carts, and a hidden product cannot
enter a cart. Creating one against hidden stock is a live discount with no effect. Promotions are a
**post-launch** tool for already-`PUBLIC` products → **T38**.

---

## 9. Launch order

```
1. probe templates      read-only; assert productId + regionId + sizes exist
2. select artwork       transparency rule, then fit gate (§1, §4)
3. --dry-run            the dry-run output IS the review surface; read it line by line
4. ONE product          inspect the rendered mockup before the batch
5. verify by re-GET     assert expected values, not "200"
6. the batch            then the remainder
7. ledger               every productId + verification result
8. publish              ONLY if publishOnCreate was true; otherwise dashboard
```

Step 4 exists because there is **no update endpoint** — a wrong payload is archive + recreate, forever
→ **T03**. One slow product beats thirty wrong ones.

---

## 10. Traps this skill is built on

`T02` no unknown method on a live id · `T03` no update endpoint · `T06` pass `sizes` · `T07` pin template
ids · `T08` regionId ≠ placement · `T09` price is dollars not cents · `T11` cache-bust · `T28` verify by
re-GET · `T31` `prettier:check` is not a gate · `T34` read `total`, page to the end · `T36` transparency
cannot be manufactured · `T37` publish/rename/tag are dashboard-only · `T38` promotions cannot publish

Full entries with evidence: [`../../traps/register.md`](../../traps/register.md)
