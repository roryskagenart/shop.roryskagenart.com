/**
 * present.ts — turn registry facts into the words the UI shows.
 *
 * Every string a human reads about a template's usability is derived here, so the rules are
 * testable without rendering anything. The components call these functions; they do not re-derive
 * the same rules inline, which is how "buildable" quietly became "will print" in a previous
 * attempt.
 *
 * ⚠️ THE LINE THIS FILE EXISTS TO HOLD
 *
 * `buildable` and `nonTransparency` are COARSE FILTERS, not verdicts. Usability is per region and
 * depends on the artwork. So every label produced here says what was *measured* ("backend-renderable",
 * "needs a cutout PNG") and never predicts an outcome ("will print", "ready to sell"). The per-region
 * answer comes from `evaluateTemplate()` in `lib/fw-catalog`, which this module wraps — it does not
 * reimplement the fit rule.
 */

import { evaluateTemplate, requiresTransparency } from 'lib/fw-catalog';
import type { ArtworkSource, FitResult, TemplateVerdict } from 'lib/fw-catalog';
import type { TemplateRegion, TemplateRegistryEntry } from 'lib/fw-catalog';

import type { PlaygroundRegion, PlaygroundTemplate } from './types';

/**
 * Rebuild a `TemplateRegistryEntry`-shaped object from the projection so the tested fit rules can
 * be reused verbatim.
 *
 * `buildable` / `nonTransparency` are carried across because `evaluateTemplate()` reads
 * `supportsBackendRendering` and `productionMethod` — the projection keeps both under the
 * registry's own field names for exactly this reason.
 */
export function toFitEntry(t: PlaygroundTemplate): TemplateRegistryEntry {
  return {
    productId: t.productId,
    name: t.name,
    brand: t.brand,
    category: t.category,
    productionMethod: t.productionMethod,
    supportsBackendRendering: t.buildable,
    regions: t.regions.map((r: PlaygroundRegion) => ({
      regionId: r.regionId,
      type: r.type,
      width: r.width,
      height: r.height,
      dpi: r.dpi,
      placements: []
    })),
    colorVariants: [],
    priceFrom:
      typeof t.priceFrom === 'number' && t.currency
        ? { amount: t.priceFrom, currency: t.currency }
        : undefined,
    priceTo:
      typeof t.priceTo === 'number' && t.currency
        ? { amount: t.priceTo, currency: t.currency }
        : undefined,
    buildable: t.buildable,
    nonTransparency: t.nonTransparency
  };
}

/** True when this template's production method demands a cutout alpha channel. → T36 */
export function needsCutout(t: PlaygroundTemplate): boolean {
  return requiresTransparency(t.productionMethod);
}

/**
 * The headline usability statement for a template, WITHOUT an artwork.
 *
 * This is the honest maximum: what is known about the template itself. It never says the artwork
 * will print — that requires a source and `evaluateTemplate()`.
 */
export type TemplateCapability = 'jpeg-ready' | 'needs-png' | 'not-renderable';

export function templateCapability(t: PlaygroundTemplate): TemplateCapability {
  if (!t.buildable) return 'not-renderable';
  return needsCutout(t) ? 'needs-png' : 'jpeg-ready';
}

export const CAPABILITY_LABEL: Record<TemplateCapability, string> = {
  'jpeg-ready': 'JPEG source can use this',
  'needs-png': 'Needs a cutout PNG',
  'not-renderable': 'Not backend-renderable'
};

export const CAPABILITY_NOTE: Record<TemplateCapability, string> = {
  'jpeg-ready':
    'Production method does not require transparency, so an opaque JPEG source is usable. Whether the artwork fits a region is still per-region.',
  'needs-png':
    'This method requires a transparent background. A JPEG source cannot print on it — background removal on a full-bleed painting does not produce usable alpha (T36). Needs a cutout PNG master.',
  'not-renderable':
    'supportsBackendRendering is false, so the design pipeline cannot place artwork on this template at all.'
};

/** One region row: the measurements, and what they do and do not imply. */
export interface RegionPresentation {
  region: PlaygroundRegion;
  label: string;
  /** e.g. `4488 × 4488 px` */
  dimensions: string;
  /** e.g. `300 DPI`, or `DPI not published` when the template omitted it. */
  dpi: string;
  /** e.g. `1.24` — a megapixel-ish scale hint, or null when unmeasured. */
  megapixels: string | null;
  /** Landscape / portrait / square / unknown aspect, for a human scanning the list. */
  orientation: 'landscape' | 'portrait' | 'square' | 'unknown';
  /** False when the region published no usable dimensions. Mirrors `fit.ts`, visibly. */
  usable: boolean;
  note: string;
}

const ORIENTATION_TOLERANCE = 0.02;

export function presentRegion(region: PlaygroundRegion): RegionPresentation {
  const label = region.regionId ?? region.type ?? 'unnamed region';
  if (!region.measured) {
    return {
      region,
      label,
      dimensions: 'no measurements published',
      dpi: region.dpi === undefined ? 'DPI not published' : `${region.dpi} DPI`,
      megapixels: null,
      orientation: 'unknown',
      usable: false,
      note: 'This area carries no width/height, so it is not a usable print area. It is a data gap in the template, not a product feature.'
    };
  }
  const ratio = region.width / region.height;
  const orientation =
    Math.abs(ratio - 1) <= ORIENTATION_TOLERANCE ? 'square' : ratio > 1 ? 'landscape' : 'portrait';
  return {
    region,
    label,
    dimensions: `${region.width} × ${region.height} px`,
    dpi: region.dpi === undefined ? 'DPI not published' : `${region.dpi} DPI`,
    megapixels: `${((region.width * region.height) / 1_000_000).toFixed(1)} MP`,
    orientation,
    usable: true,
    note: ''
  };
}

/** Human price string. Dollars, not cents. → T09 */
export function formatPrice(amount: number | undefined, currency = 'USD'): string {
  if (typeof amount !== 'number') return 'Price not published';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/** `4488 × 4488 px · 300 DPI` — the one-line summary used in the list. */
export function formatRegionSummary(region: PlaygroundRegion): string {
  const p = presentRegion(region);
  return p.usable ? `${p.dimensions} · ${p.dpi}` : 'no measurements published';
}

export interface UsabilityVerdict {
  regionLabel: string;
  usable: boolean;
  reason: string;
  retained: number;
  covers: number;
  wouldUpscale: boolean;
}

/**
 * Run the tested fit rules for one artwork against one template's regions.
 *
 * This is the only place the playground produces a per-region yes/no, and it delegates to
 * `evaluateTemplate()` rather than reimplementing the 85%-retained / 100%-coverage rule. Regions
 * with no measurements are dropped by `evaluateTemplate()` itself, so they do not appear here.
 */
export function evaluateUsability(
  template: PlaygroundTemplate,
  artwork: ArtworkSource
): UsabilityVerdict[] {
  const entry = toFitEntry(template);
  return evaluateTemplate(artwork, entry).map((v: TemplateVerdict) => ({
    regionLabel: v.region.regionId ?? v.region.type ?? 'unnamed region',
    usable: v.usable,
    reason: v.reason,
    retained: v.fit.retained,
    covers: v.fit.covers,
    wouldUpscale: v.fit.wouldUpscale
  }));
}

export function summarizeVerdicts(verdicts: UsabilityVerdict[]): string {
  if (verdicts.length === 0) return 'No measured print area on this template.';
  const usable = verdicts.filter((v) => v.usable).length;
  if (usable === 0)
    return `No region of this template accepts the artwork. ${verdicts[0]?.reason ?? ''}`.trim();
  return `${usable} of ${verdicts.length} measured regions accept this artwork.`;
}

export { measureFit, MIN_COVERS, MIN_RETAINED } from 'lib/fw-catalog';
export type { ArtworkSource, FitResult, TemplateRegion };
