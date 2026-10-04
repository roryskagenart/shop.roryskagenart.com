# Fourthwall — Product Meta & Config Schema (measured 2026-10-02)

> **Correction (same day):** the sellable template catalog is **605**, not 25. `GET /product-templates`
> returns 25/page and is **path-paginated** (`/product-templates/page/{n}`, 1-indexed, 25 pages for 605).
> The earlier "25 for this shop" line below was page 1. Full breakdown + facet map:
> **`fourthwall-full-catalog.md`**. The schema below is otherwise unchanged.

All facts below were produced by **live read-only API calls** against the `roryskagenart` shop
(Platform API `api.fourthwall.com/open-api/v1.0`, Storefront API `storefront-api.fourthwall.com/v1`)
plus the local `scripts/publish-merch-to-fourthwall.ts` + `lib/fourthwall/merch.ts`. No writes were
made. Secrets were sourced from `.env.local` and never printed.

---

## 0. What "a sellable product" actually is

Fourthwall exposes **two product classes**, and only one is reachable from the API:

| Class | Created by | Reachable via API? | Used for |
| :-- | :-- | :-- | :-- |
| **Design product** (POD) | `POST /products` `type:"design"` → appears as `type:"STANDARD"` | ✅ Yes | Merch printed on a template (mug, tee, …) with artwork |
| **Manual / "Sell your own"** | Dashboard only | ❌ **No endpoint, no CSV import** | Originals: your own price, own SKU/variants, inventory stock 1, self-fulfilment |

> ⚠️ **The API cannot create a priced, self-fulfilled physical product.** `POST /products` is a
> print-on-demand **design** pipeline only. Originals (e.g. `gondeoleu` @ $4,500) are **dashboard-only
> manual products** and must stay that way.

> ⚠️ **No wall-art template exists** (no poster / canvas / metal print) in the 25. So `canvas-prints`
> and `metal-litho` are **structurally unfulfillable** through the API — a product decision, not a config gap.

> ⚠️ **Type-enum mismatch (flagged):** the create call sends `type:"design"`, the Platform read returns
> `type:"STANDARD"`, the Storefront read returns `type:"PRODUCT"`. Same object, three labels. Don't assert
> on the string across the two APIs.

---

## 1. Sellable template inventory (this shop = 25)

`GET /product-templates` returns **25 for this shop** (`total: 601` is platform-wide and does **not**
move with `size`/`page`). **The set is MUTABLE** — it changed mid-session before. **Pin template IDs in
config and assert at apply time; never resolve by name.**

| # | Template | Category | Method | Base cost | Template ID |
| :-- | :-- | :-- | :-- | :-- | :-- |
| 1 | All-Over Print Backpack | Accessories/Bags | ALL_OVER_PRINT | $32.95 | `pro_149a5b8d86ae4219aa` |
| 2 | All-Over Print Fanny Pack | Accessories/Bags | ALL_OVER_PRINT | $21.37 | `pro_22456d0504af4ae38f` |
| 3 |  AS Colour Surf Cap | Accessories/Hats | DTFX | $20.84 | `pro_tm8d4qRXTX-v8IX-TAlbYg` |
| 4 | Flexfit Visor | Accessories/Hats | EMBROIDERY | $18.50 | `pro_79afd248d4ff4f6da4` |
| 5 | Hardcover Bound Notebook | JournalBook® | Accessories/Notebooks | UV | $12.71 | `pro_SJmfUn0YSOOwCATTBEoQKw` |
| 6 | Hardcover Journal - Blank | Accessories/Notebooks | UV | $15.50 | `pro_-wHFTR2xRbO-5bYAvLSVng` |
| 7 | Snap Case for iPhone® | Accessories/Phone Accessories | SUBLIMATION | $12.95 | `pro_fur0cz31TDC0tRUiYzJXXw` |
| 8 | Men's High Top Canvas Shoes | Accessories/Shoes | SUBLIMATION | $43.00 | `pro_y9TCXB9rQRizgS4WXaHHtg` |
| 9 | Men's Slides | Accessories/Shoes | SUBLIMATION | $32.50 | `pro_qNudZcUDRb6bwV4IK3GxBA` |
| 10 | Bella+Canvas Unisex Midweight Sweatpants | Apparel/Bottoms | DTFX | $36.50 | `pro_V7qS5M2SQheH2blj_fACEQ` |
| 11 | Bella+Canvas Women's Garment Dye Shorts | Apparel/Bottoms | DTFX | $24.75 | `pro_1BGgRpFrQCSYM5ErNQXkkA` |
| 12 | Bella+Canvas Women's Micro Rib Raglan Baby Tee | Apparel/Crop Tops | DTG | $16.95 | `pro_ax_jlOVKTk--CLvnuKupgw` |
| 13 | Bella+Canvas Supersoft Hoodie | Apparel/Hoodies | DTG | $31.06 | `pro_Tt13ahLqQmOs0lgYd-uRgw` |
| 14 | Gildan Classic Hoodie | Apparel/Hoodies | EMBROIDERY | $23.43 | `pro_955a8fc6bc9b4b068f` |
| 15 | Gildan Classic Hoodie | Apparel/Hoodies | DTG | $22.20 | `pro_gUu4CvXsRm-BxogjB89KzA` |
| 16 | Bella+Canvas Baby Jersey Short Sleeve Tee | Apparel/Kids Clothing | EMBROIDERY | $14.21 | `pro_zq1WLUHfRSC2G8L6BNWZVA` |
| 17 | Bella+Canvas Supersoft Long Sleeve T-Shirt | Apparel/Long Sleeve Tees | DTFX | $18.29 | `pro_6z4GUurATC2-mwQ_hms_5g` |
| 18 | Gildan Ultra Cotton Long Sleeve T-Shirt | Apparel/Long Sleeve Tees | DTG | $14.79 | `pro_6ae602fcb22447bfbc` |
| 19 | Gildan Classic Crewneck Sweatshirt | Apparel/Sweatshirts | DTFX | $18.79 | `pro_60zZalF0S_qvXk3of8Sfeg` |
| 20 | Stanley/Stella Women's Organic Crew Neck Sweatshirt | Apparel/Sweatshirts | DTG | $32.88 | `pro_EfhZQjDdRDqvrbXEc6r9wA` |
| 21 | AS Colour Unisex Premium T-Shirt | Apparel/T-Shirts | DTFX | $16.32 | `pro_3WAxijeHRa60iWOTsmDCeA` |
| 22 | AS Colour Unisex Premium T-Shirt | Apparel/T-Shirts | DTG | $16.32 | `pro_EJBSRKhJSd2unv4ZnGKwdQ` |
| 23 | Comfort Colors Garment-Dyed Heavyweight T-Shirt | Apparel/T-Shirts | DTG | $15.45 | `pro_8be1acca2fe7403f89` |
| 24 | White Glossy Mug | Drinkware/Coffee Mugs | SUBLIMATION | $5.95 | `pro_4v5OfYhyRx62KW5b7Oj6Uw` |
| 25 | Sherpa Vacuum Tumbler & Insulator | Drinkware/Tumblers | UV | $18.95 | `pro_tC5lJsKHR_qTF1VlrNpsoQ` |

Methods present: `DTG`×7, `DTFX`×6, `SUBLIMATION`×4, `EMBROIDERY`×3, `ALL_OVER_PRINT`×2, `UV`×3.
Note the two **identically-named** "Gildan Classic Hoodie" (EMBROIDERY vs DTG) and two "AS Colour
Unisex Premium T-Shirt" (DTFX vs DTG) — names collide, so **IDs are the only safe key**.

---

## 2. Template CONFIG schema — `GET /product-templates/{productId}`

This is the **configuration surface** for a sellable type. Example = White Glossy Mug
(`pro_4v5OfYhyRx62KW5b7Oj6Uw`):

```jsonc
{
  "productId": "pro_...", "slug": "white-glossy-mug-sublimation",
  "name": "White Glossy Mug", "description": "<p>…HTML…</p>",
  "category": "Drinkware/Coffee Mugs", "brand": "Mugz",
  "productionMethod": "SUBLIMATION",
  "minimumOrdersNumber": 0,
  "priceFrom": { "amount": 5.95, "currency": "USD" },   // base-cost range across sizes
  "priceTo":   { "amount": 10.5, "currency": "USD" },
  "colorVariants": [
    {
      "color": { "name": "White", "hex": "#ffffff" },
      "photos": [ { "url": "…", "designOverlay": null } ],
      "sizeVariants": [
        { "variantId": "prv_…", "size": "11oz", "price": {"amount":5.95,"currency":"USD"}, "available": true },
        { "variantId": "prv_…", "size": "15oz", "price": {"amount":8.5,"currency":"USD"},  "available": true },
        { "variantId": "prv_…", "size": "20 oz", "price": {"amount":10.5,"currency":"USD"}, "available": true } // note "20 oz" spelling
      ],
      "status": "AVAILABLE", "available": true
    }
  ],
  "customizableAreas": [                 // ← the regions[] you target at create time
    {
      "regionId": "default", "name": "Default", "type": "default", "available": true,
      "productionMethod": "SUBLIMATION", "supportsBackendRendering": true,
      "dimensions": { "dpi": 300, "pixelsWidth": 2700, "pixelsHeight": 1050, "inchesWidth": 9, "inchesHeight": 3.5 },
      "placements": [ { "id": "front", "name": "Front" }, { "id": "back", "name": "Back" } ]
    }
  ],
  "sizeGuide": { "url": null, "content": null },
  "supportsBackendRendering": true
}
```

**Config knobs you actually use**

- `customizableAreas[].regionId` — the value you put in `regions[].region` on create. **Not** a
  placement id. A mug has one area `default` (placements `front`/`back`); apparel has many areas
  (`front`, `back`, `sleeve_left` …). Hardcoding `"front"` works for a tee and is **rejected for a mug**.
- `customizableAreas[].dimensions` — required artwork resolution (e.g. 2700×1050 @ 300 DPI).
- `colorVariants[].sizeVariants[].size` — the exact size strings the template accepts
  (**`"20 oz"`**, not `"20oz"`). Omitting `sizes` on create does **not** create all sizes — it created
  a single `White, 11oz` variant in production.
- `priceFrom`/`priceTo` — base-cost band; your `profitMargin` is added **on top of base cost**, not a final price.

---

## 3. Product META schema (a created product)

### 3a. Storefront read — `GET /v1/products/{slug}` (token via `?storefront_token=`)
```jsonc
{
  "id": "uuid", "name": "…", "slug": "…", "description": "…",
  "state":  { "type": "AVAILABLE" },          // AVAILABLE | SOLD_OUT
  "access": { "type": "PUBLIC" },             // PUBLIC | HIDDEN | ARCHIVED
  "images": [ { "id","url","transformedUrl","width","height" } ],
  "variants": [ /* see 3c */ ],
  "additionalInformation": [                   // editorial blocks
    { "type":"MORE_DETAILS"|"SIZE_AND_FIT"|"GUARANTEE_AND_RETURNS", "title":"…", "bodyHtml":"…" }
  ],
  "sizeGuide": null,
  "createdAt": "…Z", "updatedAt": "…Z",
  "type": "PRODUCT"
}
```

### 3b. Platform read — `GET /products` / `GET /products/{id}` (extra fields vs storefront)
Adds, on the product: `thumbnailImage`, `customsInformation: { hsCode, countryOfOrigin }`.
Adds, **per variant**: `unitCost: {value,currency}`, `creatorDeclaredCost`, and a variant-level
`thumbnailImage`. `type` here is **`STANDARD`**.

### 3c. Variant object (both APIs)
```jsonc
{
  "id": "uuid", "name": "Artwork - White Glossy Mug - White, 11oz", "sku": "EQ7A-T1VV011",
  "unitPrice": { "value": 22.0, "currency": "USD" },   // ⚠️ DOLLARS, not cents
  "compareAtPrice": null,                                // platform also: unitCost, creatorDeclaredCost
  "attributes": {
    "description": "White, 11oz",
    "color": { "name": "White", "swatch": "#ffffff" },
    "size":  { "name": "11oz" }
  },
  "stock": { "type": "UNLIMITED" },                      // UNLIMITED | LIMITED (+ inStock?)
  "weight": { "value": 16.0, "unit": "oz" },
  "dimensions": { "length":0.0, "width":0.0, "height":0.0, "unit":"in" },
  "images": [ … ]
}
```

**Meta you can READ but NOT set at create:** `slug` (derived from `name`), `sku`, `unitPrice`,
`compareAtPrice`, `stock`, `weight`, `dimensions`, `unitCost`, `customsInformation`, `additionalInformation`,
`sizeGuide`. These are **derived or dashboard-only**.

---

## 4. CREATE payload — `POST /products` (the config you submit)

From `lib/fourthwall/merch.ts` → `DesignProductRequest`:

```jsonc
{
  "type": "design",                 // literal
  "productTemplateId": "pro_…",     // from §1
  "name": "Artwork - White Glossy Mug",   // slug is derived from this
  "description": "…",
  "regions": [
    {
      "region": "default",          // MUST equal a customizableArea.regionId (§2), NOT a placement
      "imageId": "<registered media id>",
      "placementStrategy": "AUTO",  // AUTO | FILL_ALL | FULL_REGION | PLACEMENT_ID
      "placementId": null           // required only when placementStrategy = PLACEMENT_ID
    }
  ],
  "colors": ["White"],              // optional; omit ⇒ template default
  "sizes":  ["11oz","15oz","20 oz"],// optional BUT must be explicit; omit ⇒ one size only
  "profitMargin": 16.05,            // USD added OVER base cost, PER PRODUCT (not per variant)
  "publishOnCreate": false          // false = HIDDEN; true = PUBLIC immediately
}
```

**Media flow before create (so `imageId` exists):**
1. `POST /media/upload-url` `{ fileName, contentType, size }` → `{ uploadUrl, fileUrl }`
2. `PUT <uploadUrl>` (direct to GCS — **Fourthwall creds are NOT sent here**) with
   `x-goog-content-length-range: 0,<size>` (must equal exact byte length or GCS 403s)
3. `POST /media/images` `{ fileUrl, width, height }` → `{ id }` (this is your `imageId`)

**Create-response:** `{ productId, customizationId }` (and the product becomes `STANDARD`).

---

## 5. Hard constraints (re-stated from live measurement)

- **No update endpoint.** `PATCH`/`PUT /products/{id}` → **405**. Anything wrong ⇒ archive + recreate.
- **`DELETE /products/{id}` is a soft delete** (`state:SOLD_OUT`, `access:ARCHIVED`); archiving
  **releases the slug**, so a rebuild lands on the same URL (hence the script's `--force`).
- **`profitMargin` is USD-over-base, per product** — one margin cannot yield one price across sizes.
- **`unitPrice.value` is dollars** (`gondeoleu` = `4500.00` = $4,500). Reading it as cents is a 100× error.
- **CDN caches per exact URL** — cache-bust (random query param) before declaring a read stale.
- **No public OpenAPI doc** (`/swagger.json`, `/api-docs`, `/openapi.json`, `/api/schema` all 404).
- Two APIs, two hosts, **never derive one from the other** (Storefront read = publishable token in
  client bundle; Platform write = Basic `FOURTHWALL_API_USERNAME`/`_PASSWORD`). Invalid token ⇒ **401**,
  not 404.

---

## 6. Evidence files (gitignored, in `.workbuddy-ai/tmp/`)
`fw_templates.json` (25 templates), `fw_template_mug.json` (full mug config), `fw_products_list.json`
(10 platform products), `fw_sf_product.json` (storefront detail), `fw_sf_collections.json`,
`fw_shop.json`.
