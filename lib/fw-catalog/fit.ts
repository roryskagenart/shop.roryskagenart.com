/**
 * fit.ts — can this artwork print on that template?
 *
 * ⚠️ WHY THIS EXISTS
 *
 * This question was answered three times in one session and was wrong twice. Each time it was
 * answered from whatever subset of the catalogue happened to be at hand — 11 templates, then 45 —
 * and each subset was reported as if it were the whole set. That is trap **T34**: a bounded read
 * presented as a measurement of the population.
 *
 * The concrete cost: eight artworks were declared unbuildable when in fact nine apparel templates
 * fit all eleven. The subset that was missing (DTG/DTFX, 450x336 regions) is exactly the subset
 * the earlier filter had excluded for an unrelated reason.
 *
 * So the rule lives here, as a tested function over the full committed registry, rather than in a
 * docstring that gets re-derived by hand. `pickTemplates()` answers "is there a product good enough
 * for all this artwork?" once, correctly.
 */

import type { ColorVariant, SizeVariant, TemplateRegion, TemplateRegistryEntry } from './types';

/**
 * Minimum fraction of the artwork that must survive a centre-crop to the region aspect ratio.
 * Below this, the product crops through the subject and is not worth selling.
 */
export const MIN_RETAINED = 0.85;

/**
 * Minimum native coverage. `covers < 1.0` means the region is larger than the artwork, so the
 * pipeline must **upscale** — which adds no information (**T36**) and is why an 830px source can
 * never be rescued by picking a bigger template.
 */
export const MIN_COVERS = 1.0;

export interface FitResult {
  /** Fraction of the artwork surviving a centre-crop to the region aspect ratio. */
  retained: number;
  /** `min(artW/regionW, artH/regionH)`. Below 1.0 means the artwork is upscaled. */
  covers: number;
  /** retained >= MIN_RETAINED and covers >= MIN_COVERS. */
  passes: boolean;
  /** True when the pipeline would have to enlarge the artwork. Never true for a passing pair. */
  wouldUpscale: boolean;
}

/**
 * Measure one artwork against one region.
 *
 * Both axes matter and they fail independently, which is the whole point:
 * - `retained` punishes a region whose aspect ratio crops the art badly.
 * - `covers` punishes a region bigger than the source.
 *
 * A wide region and a small region each fail one axis, which is why filtering the catalogue by
 * either one alone produces a confidently wrong answer.
 */
export function measureFit(
  artwork: { width: number; height: number },
  region: { width: number; height: number }
): FitResult {
  if (artwork.width <= 0 || artwork.height <= 0 || region.width <= 0 || region.height <= 0) {
    throw new Error('measureFit: all dimensions must be positive');
  }
  const regionAspect = region.width / region.height;
  const artAspect = artwork.width / artwork.height;

  // Centre-crop: the wider ratio is cropped to the narrower one.
  const retained = artAspect > regionAspect ? regionAspect / artAspect : artAspect / regionAspect;

  const covers = Math.min(artwork.width / region.width, artwork.height / region.height);

  return {
    retained,
    covers,
    passes: retained >= MIN_RETAINED && covers >= MIN_COVERS,
    wouldUpscale: covers < MIN_COVERS
  };
}

/**
 * Does this template need cutout transparency?
 *
 * T36 measured that transparency cannot be manufactured from JPEG: background removal on a
 * full-bleed painting yields 0 transparent pixels with 99.8% of alpha at 224-255, and colour
 * keying fails because the corners are mid-tone rather than a flat background. So a JPEG source
 * is only ever buildable on a non-transparency template.
 *
 * The method allowlist is measured, not assumed — 45 of the 274 backend-renderable templates.
 */
const NON_TRANSPARENCY_METHODS = new Set([
  'UV',
  'SUBLIMATION',
  'PRINTED',
  'ALL_OVER_PRINT',
  'STICKER',
  'LASER_ETCHED'
]);

export function requiresTransparency(productionMethod: string | undefined): boolean {
  return !NON_TRANSPARENCY_METHODS.has((productionMethod ?? '').toUpperCase());
}

/** A source image with no usable alpha. Overwhelmingly the case for this artist's work. */
export interface ArtworkSource {
  title: string;
  width: number;
  height: number;
  /** Defaults to `false`. Only set true for a real cutout PNG. */
  hasAlpha?: boolean;
}

export interface TemplateVerdict {
  entry: TemplateRegistryEntry;
  region: TemplateRegion;
  fit: FitResult;
  /** False when the artwork is opaque and the template demands transparency. → T36 */
  usable: boolean;
  /** Why a region failed, in words a human can act on. */
  reason: string;
}

/** Regions of a template that a given artwork could actually be printed on. */
export function evaluateTemplate(
  artwork: ArtworkSource,
  entry: TemplateRegistryEntry
): TemplateVerdict[] {
  const out: TemplateVerdict[] = [];
  for (const region of entry.regions) {
    // A template can publish a region with no dimensions ("not published" on the live API). It is
    // not a usable print area, but it is also not an error — skipping it silently would hide how
    // many regions actually lack measurements, so it is excluded here and counted by the caller.
    if (region.width <= 0 || region.height <= 0) continue;

    const fit = measureFit(artwork, { width: region.width, height: region.height });
    const needsAlpha = requiresTransparency(entry.productionMethod);
    const hasAlpha = artwork.hasAlpha === true;

    let usable = fit.passes;
    let reason = '';

    if (!entry.supportsBackendRendering) {
      usable = false;
      reason = 'template is not backend-renderable; the design pipeline cannot place artwork on it';
    } else if (needsAlpha && !hasAlpha) {
      usable = false;
      reason =
        `${entry.productionMethod} requires cutout transparency and this source is opaque JPEG — ` +
        'not manufacturable (T36). Needs a transparent PNG master.';
    } else if (fit.wouldUpscale) {
      usable = false;
      reason =
        `would upscale: source ${artwork.width}x${artwork.height} into ` +
        `${region.width}x${region.height} (covers ${fit.covers.toFixed(2)}). Upscaling adds no detail.`;
    } else if (fit.retained < MIN_RETAINED) {
      usable = false;
      reason =
        `crop would retain only ${(fit.retained * 100).toFixed(0)}% of the artwork ` +
        `(need ${(MIN_RETAINED * 100).toFixed(0)}%)`;
    }

    out.push({ entry, region, fit, usable, reason });
  }
  return out;
}

/** Every template region this artwork can actually be printed on, across the whole registry. */
export function pickTemplates(
  artwork: ArtworkSource,
  registry: TemplateRegistryEntry[]
): TemplateVerdict[] {
  return registry.flatMap((entry) => evaluateTemplate(artwork, entry)).filter((v) => v.usable);
}

/**
 * The question asked three times, answered once: is there ONE template that suits ALL of this
 * artwork? Returns the templates whose every usable region accepts every artwork — plus a
 * diagnostic for each artwork when the answer is no, so "no" says which piece is the blocker.
 */
export function findCommonTemplate(
  artworks: ArtworkSource[],
  registry: TemplateRegistryEntry[]
): { found: TemplateRegistryEntry[]; blocked: Record<string, string> } {
  if (artworks.length === 0) return { found: [], blocked: {} };

  const perArtwork = artworks.map((a) => {
    const usable = pickTemplates(a, registry);
    const byTemplate = new Map<string, TemplateVerdict>();
    for (const v of usable) {
      // Prefer the region that retains the most, so the common answer is the best one.
      const prev = byTemplate.get(v.entry.productId);
      if (!prev || v.fit.retained > prev.fit.retained) byTemplate.set(v.entry.productId, v);
    }
    return { artwork: a, byTemplate };
  });

  const first = perArtwork[0];
  if (!first) return { found: [], blocked: {} };

  const found = registry.filter((entry) =>
    perArtwork.every((p) => p.byTemplate.has(entry.productId))
  );

  const blocked: Record<string, string> = {};
  if (found.length === 0) {
    for (const p of perArtwork) {
      if (p.byTemplate.size === 0) {
        // No region works at all. Report the most informative reasons across the registry rather
        // than a generic string — "needs transparency" and "would upscale" are different asks on
        // Rory, and a single vague message would collapse them.
        const reasons = new Set<string>();
        for (const entry of registry) {
          for (const v of evaluateTemplate(p.artwork, entry)) {
            if (!v.usable && v.reason) reasons.add(v.reason);
          }
        }
        blocked[p.artwork.title] =
          [...reasons].slice(0, 2).join(' | ') || 'no usable template region for this artwork';
      } else {
        blocked[p.artwork.title] =
          `${p.byTemplate.size} templates fit this artwork, but none is shared with the others`;
      }
    }
  }

  return { found, blocked };
}

/** Distinct `size` strings across all colour variants. Sizes are per colour, so dedupe. → T06 */
export function distinctSizes(entry: TemplateRegistryEntry): string[] {
  return [
    ...new Set(
      entry.colorVariants.flatMap((c: ColorVariant) =>
        c.sizeVariants.map((s: SizeVariant) => s.size)
      )
    )
  ].sort();
}

/**
 * True when the template published no size at all — which is NOT the same as one size.
 * A single-size template is legitimate (the candle reports `Unscented`). An empty ladder means
 * the template was never probed, and conflating the two hides a data gap as a product fact.
 */
export function hasUnprobedSizes(entry: TemplateRegistryEntry): boolean {
  return distinctSizes(entry).length === 0;
}
