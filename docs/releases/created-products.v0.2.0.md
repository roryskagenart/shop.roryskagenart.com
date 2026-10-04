# Created product ledger — merch release v0.2.0

**Created:** 2026-10-04 · **Execution ID:** `a1967bc6-6892-4a0a-b813-61b0520216e7`
**Config:** `docs/releases/seed-config.v0.2.0.json` · **Result:** 6 products, 2 collections, **0 errors**

Every row was verified by re-`GET` against the Platform API after creation. The seeder's own log was
**not** accepted as evidence — that is trap **T28** (a previous run reported `Success: 137, Failed: 0`
on a 401).

## ⚠️ All products are HIDDEN — nothing is on sale

`publishOnCreate` was false for every product and publishing remains a separate, explicit human
decision. Verified: the storefront still returns only `coffeemugs`, `original`, `all` — the two new
collections do **not** appear, which is the correct behaviour for hidden products.

## Products

| # | Product | productId | Template | Region | Variants | Price | State |
| :-- | :-- | :-- | :-- | :-- | --: | --: | :-- |
| 1 | Today (Atomic Sunrise) — Enhanced Matte Paper Poster | `f2cf7bc0-80be-4708-8141-1d2421bb18df` | `pro_15bc29bc8a324d449d` | `default` | 12 | $11.00–$94.76 | HIDDEN / AVAILABLE |
| 2 | Today (Atomic Sunrise) — Poker Playing Cards | `1b4dc40e-f3c8-42e9-ab69-4a53eca3c53a` | `pro_ZUOYt-04ToOgL7V03qNIYg` | `front` | 1 | $27.38 | HIDDEN / AVAILABLE |
| 3 | Today (Atomic Sunrise) — Framed Matte Poster | `4645e044-53e3-4622-a4ce-dd1f93c6150b` | `pro_kRSsoYjwSoyyTEmWko5o0A` | `default` | 12 | $40.70–$94.76 | HIDDEN / AVAILABLE |
| 4 | Gondoleu — Soy Wax Candle | `0925beec-5e64-4147-bf1c-4d1ad2cdd125` | `pro_N__f9U5XQJqcP_oCvwk2rw` | `default` | 1 | $25.90 | HIDDEN / AVAILABLE |
| 5 | Gianondor — Soy Wax Candle | `82a6b1e8-0f79-40c5-b575-ca1b4c1704f6` | `pro_N__f9U5XQJqcP_oCvwk2rw` | `default` | 1 | $25.90 | HIDDEN / AVAILABLE |
| 6 | Austin Skyline 2019 — Soy Wax Candle | `88e949fc-c358-4628-b4d9-e39a9aca6586` | `pro_N__f9U5XQJqcP_oCvwk2rw` | `default` | 1 | $25.90 | HIDDEN / AVAILABLE |

### Orphan — created before the size fix, cannot be corrected

| Product | productId | Why it exists |
| :-- | :-- | :-- |
| Today (Atomic Sunrise) — Enhanced Matte Paper Poster | `5f239c60-1127-40c9-8db0-8d3b84a38809` | **Defective: 1 variant where the template offers many.** Created by single-product CLI mode, which has no `--sizes` flag, so `sizes` was never sent. (The exact size count is **not readable from the Platform API** — the detail document exposes no `sizes` array; see **T06**/**T13**. The 1-vs-many comparison is what matters and is measured from the created product.) |

This is trap **T06** reproduced live. It is **hidden**, so it is not sellable, and there is **no update
endpoint** (**T03**) — the only remedy is archive + recreate, which is what product #1 above is. The
orphan should be archived from the dashboard; its name is taken, so a rebuild needs `--force`.

## Collections

| Collection | collectionId | Slug | Offers |
| :-- | :-- | :-- | --: |
| Museum Canvas & Archival Prints | `col_NsMoq0SMTCekthNSqklDwg` | `museum-canvas-archival-prints` | 3 |
| Kitsch, CPG & Austin Pop Living | `col_NIvGTHCLQGOQByOcB-iS4A` | `kitsch-cpg-austin-pop-living` | 3 |

⚠️ **These slugs do not match `lib/taxonomy.ts`.** The taxonomy handles are `canvas-prints` and
`kitsch-cpg`, but Fourthwall minted `museum-canvas-archival-prints` and `kitsch-cpg-austin-pop-living`
from the display names. `ensureCollection` derives the slug from the name, so passing the handle does
not control it. Consequence: `getCollections()` will surface these as **extra** collections rather than
matching a taxonomy entry, so the taxonomy title will **not** override them (**T04**). Fix by creating
them with taxonomy-exact names, or by archiving and recreating.

## Pricing

`profitMargin` is a **USD amount added to base cost**, not a percentage. Set to `base` in every case,
i.e. a flat **~50% margin**, which clears Fourthwall's minimums (20% and $10 profit) on all six.

| Template | Base | Margin | Lowest variant | Highest variant |
| :-- | ---: | ---: | ---: | ---: |
| Enhanced Matte Paper Poster | $5.50 | $5.50 | $11.00 | $94.76 |
| Poker Playing Cards | $13.69 | $13.69 | $27.38 | $27.38 |
| Framed Matte Poster | $20.35 | $20.35 | $40.70 | $94.76 |
| Soy Wax Candle | $12.95 | $12.95 | $25.90 | $25.90 |

Poster prices span a range because **the margin is per product, not per variant** — the same $20.35 sits
on top of every size's differing base cost. A 5×7 and a 24×36 therefore carry very different margins
despite identical `profitMargin`. This is the same issue recorded as OQ6 in the v0.2.0 draft.

## Scope: why only 6 products

Six of 240 candidate (artwork × template) pairs passed the print-fit gate — **≥85% of the artwork
retained after centre-crop, and the artwork must cover the region at native resolution**. The other 39
non-transparency templates failed on resolution, not preference. 229 of the 274 backend-renderable
templates additionally require **transparent PNG**, which JPEG sources cannot provide and which no
upscaling or matting chain can manufacture (**T36**). The fix is 300 DPI PNG masters from Rory.
