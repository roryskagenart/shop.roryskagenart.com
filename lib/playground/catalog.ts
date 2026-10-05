/**
 * catalog.ts — trim the committed registry to what the playground renders, and derive the facets.
 *
 * Read-only. Takes entries in, returns a projection and facet counts. It never fetches, never
 * writes, and has no opinion about usability — see `filters.ts` for filtering and `fit.ts` for the
 * per-region verdict.
 *
 * ⚠️ BRAND NORMALISATION IS A REAL FIX, NOT COSMETIC
 *
 * The registry carries both `Bella + Canvas` and `Bella+Canvas`, and both `AllColor` and
 * `Allcolor` — four raw strings, two brands. A facet list built on raw strings renders two
 * identical-looking rows that each silently drop half their templates. So facets are keyed on a
 * normalised value and labelled with the most common raw spelling. Nothing is merged away: both
 * entries still appear in the result list.
 */

import type { TemplateRegistry, TemplateRegistryEntry } from 'lib/fw-catalog';

import type {
  Catalog,
  CatalogFacetValue,
  CatalogTotals,
  PlaygroundRegion,
  PlaygroundTemplate
} from './types';

/** Strip punctuation and case so `Bella + Canvas` and `Bella+Canvas` share one facet key. */
export function normalizeFacetValue(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** `Apparel/T-Shirts` → `Apparel`. A template with no `/` is its own group. */
export function categoryGroup(category: string | undefined): string {
  if (!category) return 'Uncategorised';
  const idx = category.indexOf('/');
  return idx === -1 ? category : category.slice(0, idx);
}

function toRegion(region: TemplateRegistryEntry['regions'][number]): PlaygroundRegion {
  return {
    regionId: region.regionId,
    type: region.type,
    width: region.width,
    height: region.height,
    dpi: region.dpi,
    // `fit.ts` skips width<=0 or height<=0 regions. Mirror that, but keep them in the data so the
    // UI can say "no measurements published" instead of rendering an empty table.
    measured: region.width > 0 && region.height > 0
  };
}

export function toPlaygroundTemplate(entry: TemplateRegistryEntry): PlaygroundTemplate {
  return {
    productId: entry.productId,
    name: entry.name,
    brand: entry.brand,
    category: entry.category,
    productionMethod: entry.productionMethod,
    buildable: entry.buildable === true,
    nonTransparency: entry.nonTransparency === true,
    regions: entry.regions.map(toRegion),
    priceFrom: entry.priceFrom?.amount,
    priceTo: entry.priceTo?.amount,
    currency: entry.priceFrom?.currency,
    minimumOrdersNumber: entry.minimumOrdersNumber
  };
}

function buildFacets(
  templates: PlaygroundTemplate[],
  pick: (t: PlaygroundTemplate) => string | undefined
): CatalogFacetValue[] {
  const labels = new Map<string, Map<string, number>>();
  for (const t of templates) {
    const raw = pick(t);
    if (!raw) continue;
    const key = normalizeFacetValue(raw);
    const perLabel = labels.get(key) ?? new Map<string, number>();
    perLabel.set(raw, (perLabel.get(raw) ?? 0) + 1);
    labels.set(key, perLabel);
  }

  return [...labels.entries()]
    .map(([value, perLabel]) => {
      // Label = the spelling that appears most often, so a single entry's odd casing cannot
      // become the name of a facet holding hundreds of templates.
      let label = value;
      let best = -1;
      for (const [raw, count] of perLabel) {
        if (count > best) {
          best = count;
          label = raw;
        }
      }
      const count = [...perLabel.values()].reduce((a, b) => a + b, 0);
      return { value, label, count };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function countTotals(templates: PlaygroundTemplate[]): CatalogTotals {
  return {
    templates: templates.length,
    buildable: templates.filter((t) => t.buildable).length,
    nonTransparency: templates.filter((t) => t.nonTransparency).length,
    buildableNeedingCutout: templates.filter((t) => t.buildable && !t.nonTransparency).length,
    withUnmeasuredRegions: templates.filter((t) => t.regions.some((r) => !r.measured)).length,
    withNoMeasuredRegion: templates.filter((t) => !t.regions.some((r) => r.measured)).length,
    withoutPrice: templates.filter((t) => typeof t.priceFrom !== 'number').length
  };
}

export function buildCatalog(registry: TemplateRegistry | TemplateRegistryEntry[]): Catalog {
  const entries = Array.isArray(registry) ? registry : registry.entries;
  const templates = entries.map(toPlaygroundTemplate);
  return {
    templates,
    totals: countTotals(templates),
    facets: {
      categories: buildFacets(templates, (t) => t.category),
      brands: buildFacets(templates, (t) => t.brand),
      methods: buildFacets(templates, (t) => t.productionMethod)
    }
  };
}
