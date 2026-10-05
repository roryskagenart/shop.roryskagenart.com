# Live state review — merch release v0.2.0

**Reviewed:** 2026-10-04, after Rory renamed both collections and published all products.
**Method:** Platform API (`GET /products/{id}`, `GET /collections/{id}`) plus the Storefront API for
what a customer can actually reach. Nothing was written during this review.

---

## ✅ Working

**All 7 products are `PUBLIC` / `AVAILABLE`.** The storefront serves them:

| Collection | Slug | Offers | Storefront |
| :-- | :-- | --: | :-- |
| Wall Artwork | `wall-artwork` | 3 | 200, 3 products |
| Gifts and Goodies | `gifts-goodies` | 3 | 200, 3 products |

**The navigation picked up the renames correctly.** `getCollections()` reads live stock, so the shop nav
now reads: `All Products · Gifts and Goodies · Wall Artwork · Studio Editions · Original Artwork`. No code
change was needed for that — it is the PR #11 behaviour working as designed.

**A third collection appeared:** `studio-editions` (4 mugs) — you renamed `coffeemugs` to it. It surfaces
in nav with 4 products. Correct.

---

## 🔴 Needs attention

### 1. The defective orphan is now PUBLIC and sellable

`5f239c60-1127-40c9-8db0-8d3b84a38809` — "Today (Atomic Sunrise) — Enhanced Matte Paper Poster" — is the
product created by single-product CLI mode that got **1 variant where the template offers 14** (T06). It
was meant to be archived. It is now `PUBLIC` / `AVAILABLE`.

Consequence: a shopper reaches **two** "Today — Enhanced Matte Paper Poster" products at **different
prices**. The defective one sells only `5" x 7"`; the correct one sells 12 sizes.

```
today-atomic-sunrise-enhanced-matte-paper-poster    <- ORPHAN, 1 variant, defective
today-atomic-sunrise-enhanced-matte-paper-poster-2  <- correct, 12 variants
```

Both appear in `/collections/all/products`. **A shopper can buy the 5×7-only version today.** It is not
broken exactly — a 5×7 poster is a real product — but it is a duplicate listing with an unintended
constraint, and it was created as a mistake.

**Fix:** archive the orphan in the dashboard. Its name is taken, so any rebuild needs `--force` (T03).

### 2. The old collection slugs are dead but still listed

Renaming changed the slugs, and the old ones now 404:

```
museum-canvas-archival-prints    -> 404
kitsch-cpg-austin-pop-living     -> 404
```

But `GET /v1/collections` **still lists them**. So the storefront's collection list contains two entries
that lead nowhere. Confirmed earlier as an empty-shell symptom (T39) — this is the same thing, and
renaming did not clear it.

**Impact:** low for customers (the nav is built from stocked collections, so it is clean), but any
dashboard built on `GET /v1/collections` will show four collections where two are gone. Worth knowing
before building that.

### 3. Collection slugs still don't match `lib/taxonomy.ts`

| Live slug | Taxonomy handle |
| :-- | :-- |
| `wall-artwork` | `canvas-prints` |
| `gifts-goodies` | `kitsch-cpg` |
| `studio-editions` | *(no handle — mugs are `desk-art`/`coffeemugs`)* |

So `getCollections()` treats all three as **extra** collections rather than taxonomy matches, and the
taxonomy title will **not** override them (T04). The names you chose read better than the taxonomy's
`Museum Canvas & Archival Prints`, so this may be the right outcome — but it is an accident of
naming, not a decision the code made. `lib/taxonomy.ts` is now stale relative to production.

**Decide:** either accept Fourthwall as the source of truth for collection names and update
`taxonomy.ts` to match, or recreate the collections with taxonomy-exact handles. The first is cheaper
and, given how the names read, probably better.

### 4. Two products were published without a mockup review

I verified **fields** — variants, price, state, access — never the rendered image. The Enhanced Matte
Poster carries `today` at a 98% centre-crop fit, which should be clean, but nobody has looked at it.
Worth eyeballing all six on the storefront before they accumulate orders.

---

## Also still open

- **The 300 DPI masters.** Six products is a thin catalogue. The other 39 non-transparency templates were
  rejected on resolution, not preference — with masters, the fit gate would pass far more pairs (T36).
- **Prices were mine, not yours.** Flat ~50% margin. The Framed Poster runs **$40.70 → $94.76** across 12
  sizes on one margin, because margin is per-product not per-variant. Adjusting now means archive +
  recreate (T03) — so it is worth deciding before the first order arrives.

---

## Reproduce

```bash
set -a && . .env.local && set +a
# products
curl -s --compressed -u "$FOURTHWALL_API_USERNAME:$FOURTHWALL_API_PASSWORD" \
  "https://api.fourthwall.com/open-api/v1.0/products/$PRODUCT_ID"
# what a customer can reach
curl -s --get --data-urlencode "storefront_token=$NEXT_PUBLIC_FW_STOREFRONT_TOKEN" \
  "$NEXT_PUBLIC_FW_API_URL/collections/all/products"
```
