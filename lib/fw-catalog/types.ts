/**
 * types.ts — the shape of the committed template registry.
 *
 * ⚠️ This is a PROJECTION, not the raw detail document.
 *
 * The full `GET /product-templates/{productId}` response for all 605 templates is 12 MB and lives
 * only in an untracked sibling repo. It was missing from this repo entirely while six documents
 * described it as integrated — which is how a question about print fit was answered three times
 * from partial data (**T34**).
 *
 * So the registry keeps exactly the fields that answer "can this artwork print here?" and drops the
 * rest. Regenerate with `build-registry.ts`; verify with `--check`, which fails on drift.
 */

/** One printable region on a template. */
export interface TemplateRegion {
  /**
   * `customizableAreas[].regionId`. Nullable — measured `null` on live, orderable templates.
   * Never hardcode, never filter out nulls: → **T08**.
   */
  regionId: string | null;
  type?: string;
  /**
   * NOT a ground-truth signal. A live, orderable template was measured returning `available: false`
   * on every area, and filtering on it yields an empty array that reads as "no printable region".
   * Kept for the record; do not gate on it.
   */
  available?: boolean;
  width: number;
  height: number;
  dpi?: number;
  placements: string[];
}

/** One size within one colour variant. Sizes are per colour, so dedupe before counting. → T06 */
export interface SizeVariant {
  variantId?: string;
  size: string;
  /** Dollars, not cents → **T09**. */
  price?: { amount: number; currency: string };
  available?: boolean;
}

export interface ColorVariant {
  name?: string;
  hex?: string;
  /** Nested — this is where a template's size ladder lives. → **T06** */
  sizeVariants: SizeVariant[];
}

/**
 * One template. Deliberately minimal: the fields a fit decision needs, and nothing that would make
 * the file large enough to discourage regeneration.
 */
export interface TemplateRegistryEntry {
  productId: string;
  name: string;
  brand?: string;
  category?: string;
  productionMethod?: string;
  supportsBackendRendering: boolean;
  regions: TemplateRegion[];
  colorVariants: ColorVariant[];
  priceFrom?: { amount: number; currency: string };
  priceTo?: { amount: number; currency: string };
  minimumOrdersNumber?: number;

  /**
   * Denormalised by `build-registry.ts` so a UI can filter the JSON without importing `fit.ts`.
   *
   * ⚠️ **This is a coarse filter, not a verdict.** It mirrors `supportsBackendRendering`; real
   * usability is per *region* and also depends on the artwork — a buildable template can have a
   * region with no dimensions, and `nonTransparency` says nothing about whether the chosen artwork
   * actually fits. Call `evaluateTemplate()` for the answer that matters.
   */
  buildable?: boolean;
  /** True when this template needs no cutout transparency, so a JPEG source can print on it (T36). */
  nonTransparency?: boolean;
}

export interface TemplateRegistry {
  _source: string;
  _generatedAt: string;
  _provenance: string;
  _warning: string;
  total: number;
  backendRenderable: number;
  nonTransparency: number;
  entries: TemplateRegistryEntry[];
}
