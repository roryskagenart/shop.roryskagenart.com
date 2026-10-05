/**
 * index.ts — the playground's public surface.
 *
 * Pure logic only. The React components under `components/playground/` sit on top of this and hold
 * no rules of their own.
 */

export type {
  Catalog,
  CatalogFacetValue,
  CatalogTotals,
  PlaygroundRegion,
  PlaygroundTemplate
} from './types';

export {
  buildCatalog,
  categoryGroup,
  countTotals,
  normalizeFacetValue,
  toPlaygroundTemplate
} from './catalog';

export {
  activeFilterCount,
  applyFilters,
  EMPTY_FILTERS,
  filterTemplates,
  PRICE_BANDS,
  SORT_LABELS,
  sortTemplates,
  toggleFacetValue
} from './filters';
export type { FilterState, PriceBand, SortKey } from './filters';

export {
  CAPABILITY_LABEL,
  CAPABILITY_NOTE,
  evaluateUsability,
  formatPrice,
  formatRegionSummary,
  needsCutout,
  presentRegion,
  summarizeVerdicts,
  templateCapability,
  toFitEntry
} from './present';
export type { RegionPresentation, TemplateCapability, UsabilityVerdict } from './present';
