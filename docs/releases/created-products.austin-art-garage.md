# Created product ledger — Austin Art Garage works (v0.3.0)

**Created:** 2026-10-04 · **Execution ID:** `bf545857-70ca-4e8d-a58b-2fa2441eec4f`
**Config:** `docs/releases/seed-config.austin-art-garage.json` · **Result:** 3 products, 1 collection, **0 errors**

Every row was verified by **re-`GET`** against the Platform API after creation — the seeder's own log
was **not** accepted as evidence (**T28**).

## ⚠️ All three are HIDDEN — nothing is on sale

`publishOnCreate` was `false` for every product, and **publishing has no API path at all** (**T37**):
`PATCH`/`PUT /products/{id}` → 405, `/access` → 404, `/publish` → 404. `PUT /availability` answers 200
but **does not publish**. So each of these needs a **manual click in the Fourthwall dashboard**, and
that is a one-way door: this is the only moment `publishOnCreate` can be set.

## Products

| # | Product | productId | Template | Region | Variants | Unit price | Unit cost | State |
| :-- | :-- | :-- | :-- | :-- | --: | --: | --: | :-- |
| 1 | Lobedicus — Soy Wax Candle In A Clear Glass Jar | `7cac2da1-9a59-42b0-968b-583911415238` | `pro_N__f9U5XQJqcP_oCvwk2rw` | `default` | 1 | **$25.90** | $12.95 | HIDDEN / AVAILABLE |
| 2 | Gnardred — Soy Wax Candle In A Clear Glass Jar | `ed7be472-8d2c-45e1-b9f6-dfc374360da5` | `pro_N__f9U5XQJqcP_oCvwk2rw` | `default` | 1 | **$25.90** | $12.95 | HIDDEN / AVAILABLE |
| 3 | Kelzon 5 — Soy Wax Candle In A Clear Glass Jar | `35f8ea54-85bb-4bfe-88f2-0f833f6c27e9` | `pro_N__f9U5XQJqcP_oCvwk2rw` | `default` | 1 | **$25.90** | $12.95 | HIDDEN / AVAILABLE |

All three carry 3 rendered images at **1536×2048**, 1 variant `White, Unscented`, `UNLIMITED` stock.
`profitMargin` 12.95 on a $12.95 base → $25.90 retail, matching the three existing candles exactly.

> ⚠️ **Read `unitPrice.value`, not `price`.** A verification pass that reads `variants[].price`
> reports an empty set and looks like the products are unpriced. The wire field is
> `unitPrice: {value, currency}` and the value is in **dollars** (**T09**). Cost is `unitCost`.

## Collection

| Collection | collectionId | Slug | Offers | State |
| :-- | :-- | :-- | --: | :-- |
| Candles | `col_RnvWzdSNThWQBVyMoE-lQA` | `candles` | 3 | PUBLIC / available |

The slug came back as **`candles`**, matching the config `handle` — because the handle and the derived
name coincide here. That is luck, not behaviour: Fourthwall mints the slug from the **display name**,
which is how the previous release produced `museum-canvas-archival-prints` from "Museum Canvas &
Archival Prints" and lost the taxonomy override (**T04**). Verify, don't assume.

⚠️ The collection is `PUBLIC` while its three products are `HIDDEN`. Verified on the storefront that
hidden products are absent from every listing, so the collection is an **empty shell** — it appears,
and it has nothing in it (**T39**).

## The 8 deferred works, and why

All eight are **830×563**. Measured against all 605 templates, **no** JPEG-safe region is small
enough — the smallest is 900×900 — so a create would **upscale**, which adds no detail (**T36**) and
cannot be undone (**T03**).

Tuna 4 Cats · Tiger · Going to HEB · Fridge · Cold Beer (830×623) · Biere Larue · Monster 7 · Monster 1

**Ask for Rory:** masters at **≥1500px long side** for the print templates, or **cutout-transparent
PNG** for apparel. His Cloudinary originals are 2100–2697px, so the size ask is already satisfiable.

## Two corrections made in this session, both of which had been told to him

1. **"No template fits any of these"** — wrong. That came from filtering to the 45 non-transparency
   templates and reporting the fit as if it were the whole catalogue. Across all 605, **nine apparel
   templates fit all eleven artworks** at 450×336. They are excluded by the transparency rule, not by
   geometry. → **T34**
2. **"The AAG images are higher res"** — wrong. Reading the JPEG headers: 830×563 and 1500×1000. The
   `_2048x` in Shopify's filenames is a naming convention, not a dimension; the unsuffixed master
   returns identical bytes. The shop's existing Cloudinary originals (2100–2697px) are better.

Both are now answered by committed, tested code: `lib/fw-catalog/` with 19 tests, and a regenerated
605-entry registry that `--check`s against the live API.

## Open items for a human

1. **Publish these three** — dashboard only (**T37**).
2. **The T06 orphan** (`5f239c60-1127-40c9-8db0-8d3b84a38809`) is `ARCHIVED` but **still appears in
   collection listings** (**T39**). Archiving does not remove it from a listing; it must be taken out
   of the collection, and that call **replaces the whole list** (**T05**).
3. **The other 8 AAG works** — blocked on masters.
4. **Per-size price ladders** are not expressible on create: `profitMargin` is one number for the whole
   product. The `$20 → $400` gallery ladder needs dashboard work.
