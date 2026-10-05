/**
 * types.ts — the projection the playground renders.
 *
 * ⚠️ WHY A PROJECTION AND NOT `lib/fw-catalog` DIRECTLY
 *
 * The committed registry is 3.13 MB. A list view of 605 rows needs a name, a brand, a method, a
 * price and a region count; it does not need every size ladder. So `catalog.ts` trims the entry to
 * the fields a human reads and drops the rest, which measures 372 KB — 8x smaller, and the detail
 * view still has every region with its pixel dimensions and DPI.
 *
 * `productId` is the only key. `name` is for humans and is NOT unique: 605 entries carry 436
 * distinct names, so keying or de-duplicating on it would silently merge different templates.
 * → **T07**
 */

export interface PlaygroundRegion {
  /** `customizableAreas[].regionId`. Nullable on live templates — never hardcode, never filter. → T08 */
  regionId: string | null;
  type?: string;
  width: number;
  height: number;
  dpi?: number;
  /**
   * A region with `width <= 0` (or `height <= 0`) has no measurements and is not a usable print
   * area. `fit.ts` skips these silently; the UI must not — it marks them, so "no measurements"
   * reads as a data gap rather than a product with no print area. 108 of 605 templates have no
   * measured region at all.
   */
  measured: boolean;
}

export interface PlaygroundTemplate {
  /** `pro_…` — the only identifier. Dashboard labels are not identifiers. → T07 */
  productId: string;
  /** Display name. NOT unique (436 distinct across 605 entries). */
  name: string;
  brand?: string;
  /** `Apparel/T-Shirts`. Split on `/` for grouping. */
  category?: string;
  productionMethod?: string;
  buildable: boolean;
  nonTransparency: boolean;
  regions: PlaygroundRegion[];
  /** Dollars, not cents. → T09 */
  priceFrom?: number;
  priceTo?: number;
  currency?: string;
  minimumOrdersNumber?: number;
}

export interface CatalogFacetValue {
  /** Stable value used in filter state — normalised, so `Bella + Canvas` and `Bella+Canvas` are one. */
  value: string;
  /** The most common raw spelling in the registry, shown to humans. */
  label: string;
  count: number;
}

export interface Catalog {
  templates: PlaygroundTemplate[];
  /** Unfiltered totals, for the header. Never derived from a filtered slice. */
  totals: CatalogTotals;
  facets: {
    categories: CatalogFacetValue[];
    brands: CatalogFacetValue[];
    methods: CatalogFacetValue[];
  };
}

export interface CatalogTotals {
  templates: number;
  buildable: number;
  nonTransparency: number;
  /** Backend-renderable templates that still demand a cutout PNG — unusable from a JPEG source. */
  buildableNeedingCutout: number;
  /** Templates with at least one region published without dimensions. */
  withUnmeasuredRegions: number;
  /** Templates where NO region has dimensions. */
  withNoMeasuredRegion: number;
  /** Templates with no `priceFrom` at all, so a price-band filter cannot classify them. */
  withoutPrice: number;
}
