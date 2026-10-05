/**
 * filters.ts — pure search/filter/sort over the playground projection.
 *
 * All of it is synchronous and in-memory. The registry is imported once on the server and handed to
 * the client component as props; there is no network call per keystroke and no server fetch per
 * filter change. Kept free of React so the logic is testable without a DOM.
 *
 * ⚠️ WHAT `buildable` AND `nonTransparency` ARE NOT
 *
 * Neither flag is a verdict. `buildable` mirrors `supportsBackendRendering` — whether the design
 * pipeline can place artwork on the template at all. `nonTransparency` says the method does not
 * require a cutout alpha. Neither one says a given artwork *fits* a given region: that is per
 * region and depends on pixel geometry, which is what `evaluateTemplate()` in `lib/fw-catalog`
 * answers. So `filterTemplates()` only ever narrows the candidate set, and the UI says so.
 *
 * ⚠️ `available` IS NOT A FILTER
 *
 * A live, orderable template was measured reporting `available: false` on every area. Filtering on
 * it returns an empty list that reads as "no printable region". It is not carried into the
 * projection at all. → **T08**
 */

import { categoryGroup, normalizeFacetValue } from './catalog';
import type { PlaygroundTemplate } from './types';

/** Price bands in dollars, ascending. Boundaries are inclusive at the low end. */
export const PRICE_BANDS = [
  { value: 'any', label: 'Any price', min: 0, max: Infinity },
  { value: 'under-15', label: 'Under $15', min: 0, max: 15 },
  { value: '15-25', label: '$15 – $25', min: 15, max: 25 },
  { value: '25-40', label: '$25 – $40', min: 25, max: 40 },
  { value: '40-plus', label: '$40 and up', min: 40, max: Infinity }
] as const;

export type PriceBand = (typeof PRICE_BANDS)[number]['value'];

export type SortKey = 'name' | 'price-asc' | 'price-desc' | 'regions-desc';

export const SORT_LABELS: Record<SortKey, string> = {
  name: 'Name (A–Z)',
  'price-asc': 'Price (low to high)',
  'price-desc': 'Price (high to low)',
  'regions-desc': 'Most printable regions'
};

export interface FilterState {
  /** Free text over name, brand, category, method and productId. */
  query: string;
  /** Normalised category values (`normalizeFacetValue('Apparel/T-Shirts')`). */
  categories: string[];
  brands: string[];
  methods: string[];
  priceBand: PriceBand;
  /**
   * Backend-renderable only. A COARSE filter — a template can be buildable and still have no
   * usable region for the artwork in hand.
   */
  buildableOnly: boolean;
  /**
   * The 45 templates a JPEG source can actually use, because the method needs no cutout alpha.
   * The sharpest filter here, and still not a verdict: it says nothing about pixel fit.
   */
  nonTransparencyOnly: boolean;
  sort: SortKey;
}

export const EMPTY_FILTERS: FilterState = {
  query: '',
  categories: [],
  brands: [],
  methods: [],
  priceBand: 'any',
  buildableOnly: false,
  nonTransparencyOnly: false,
  sort: 'name'
};

/** How many filters are narrowing the list, for the "clear" affordance. */
export function activeFilterCount(f: FilterState): number {
  return (
    f.categories.length +
    f.brands.length +
    f.methods.length +
    (f.priceBand === 'any' ? 0 : 1) +
    (f.buildableOnly ? 1 : 0) +
    (f.nonTransparencyOnly ? 1 : 0)
  );
}

function matchesQuery(t: PlaygroundTemplate, needle: string): boolean {
  if (!needle) return true;
  const haystack = [t.name, t.brand, t.category, t.productionMethod, t.productId]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .join(' ')
    .toLowerCase();
  // Every whitespace-separated term must appear, so "mug tumbler" narrows rather than widens.
  return needle.split(/\s+/).every((term) => haystack.includes(term));
}

function matchesPrice(t: PlaygroundTemplate, band: PriceBand): boolean {
  const def = PRICE_BANDS.find((b) => b.value === band) ?? PRICE_BANDS[0];
  if (def.value === 'any') return true;
  // A template with no price cannot be placed in a band. Excluding it is the honest answer —
  // including it would imply a price it does not have.
  if (typeof t.priceFrom !== 'number') return false;
  return t.priceFrom >= def.min && t.priceFrom < def.max;
}

function measuredRegionCount(t: PlaygroundTemplate): number {
  return t.regions.filter((r) => r.measured).length;
}

export function filterTemplates(
  templates: PlaygroundTemplate[],
  filters: FilterState
): PlaygroundTemplate[] {
  const query = filters.query.trim().toLowerCase();
  return templates.filter((t) => {
    if (!matchesQuery(t, query)) return false;
    if (
      filters.categories.length &&
      !filters.categories.includes(normalizeFacetValue(t.category ?? ''))
    )
      return false;
    if (filters.brands.length && !filters.brands.includes(normalizeFacetValue(t.brand ?? '')))
      return false;
    if (
      filters.methods.length &&
      !filters.methods.includes(normalizeFacetValue(t.productionMethod ?? ''))
    )
      return false;
    if (!matchesPrice(t, filters.priceBand)) return false;
    if (filters.buildableOnly && !t.buildable) return false;
    if (filters.nonTransparencyOnly && !t.nonTransparency) return false;
    return true;
  });
}

export function sortTemplates(
  templates: PlaygroundTemplate[],
  sort: SortKey
): PlaygroundTemplate[] {
  const out = [...templates];
  switch (sort) {
    case 'price-asc':
      // Unpriced templates sort last in both directions rather than being treated as $0.
      out.sort((a, b) => priceSortValue(a) - priceSortValue(b) || a.name.localeCompare(b.name));
      break;
    case 'price-desc':
      out.sort((a, b) => priceSortValue(b) - priceSortValue(a) || a.name.localeCompare(b.name));
      break;
    case 'regions-desc':
      out.sort(
        (a, b) => measuredRegionCount(b) - measuredRegionCount(a) || a.name.localeCompare(b.name)
      );
      break;
    case 'name':
    default:
      out.sort((a, b) => a.name.localeCompare(b.name) || a.productId.localeCompare(b.productId));
      break;
  }
  return out;
}

function priceSortValue(t: PlaygroundTemplate): number {
  return typeof t.priceFrom === 'number' ? t.priceFrom : Number.POSITIVE_INFINITY;
}

export function applyFilters(
  templates: PlaygroundTemplate[],
  filters: FilterState
): PlaygroundTemplate[] {
  return sortTemplates(filterTemplates(templates, filters), filters.sort);
}

/** Toggle a value in one of the multi-select facet lists. */
export function toggleFacetValue(current: string[], value: string): string[] {
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}
