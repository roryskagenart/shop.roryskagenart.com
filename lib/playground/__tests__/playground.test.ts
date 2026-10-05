/**
 * Tests for the playground's pure logic: projection, facets, filtering and usability presentation.
 *
 * Two jobs:
 *
 * 1. **Fixture tests** on hand-built templates that reproduce the traps this UI is most likely to
 *    fall into — a null `regionId`, a region with no dimensions, a live template reporting
 *    `available: false`, two spellings of one brand.
 * 2. **Registry assertions** against the real committed 605-entry document, so a regeneration that
 *    changes the shape of the data fails here rather than rendering an empty table.
 *
 * ⚠️ `describe`/`it`/`expect` are imported explicitly. `vitest.config.ts` sets `globals: true` at
 * RUNTIME ONLY, so omitting them passes vitest and fails `tsc` (TS2582) → T15.
 *
 * Nothing here asserts on rendered markup or source text. The rules are the subject; the JSX is not.
 */

import { describe, expect, it } from 'vitest';

import registry from 'lib/fw-catalog/template-registry.json';
import type { TemplateRegistryEntry } from 'lib/fw-catalog';

import {
  buildCatalog,
  CAPABILITY_LABEL,
  categoryGroup,
  countTotals,
  EMPTY_FILTERS,
  evaluateUsability,
  filterTemplates,
  formatPrice,
  normalizeFacetValue,
  presentRegion,
  summarizeVerdicts,
  templateCapability,
  toPlaygroundTemplate,
  toggleFacetValue
} from '../index';
import type { FilterState, PlaygroundTemplate } from '../index';

// Real measured values from lib/fw-catalog/__tests__/fit.test.ts, not invented ones.
const CANDLE: TemplateRegistryEntry = {
  productId: 'pro_N__f9U5XQJqcP_oCvwk2rw',
  name: 'Soy Wax Candle In A Clear Glass Jar',
  brand: 'Generic',
  category: 'Home & Living/Candles',
  productionMethod: 'PRINTED',
  supportsBackendRendering: true,
  regions: [
    {
      regionId: 'default',
      type: 'default',
      // A live, orderable template measured reporting `available: false` → T08. The playground must
      // not care, so this fixture carries it deliberately.
      available: false,
      width: 1191,
      height: 720,
      dpi: 300,
      placements: []
    }
  ],
  colorVariants: [{ name: 'Clear', sizeVariants: [{ size: 'Unscented' }] }],
  priceFrom: { amount: 28, currency: 'USD' },
  priceTo: { amount: 34, currency: 'USD' },
  buildable: true,
  nonTransparency: true
};

/** DTG/DTFX apparel: the transparency-blocked case → T36. */
const TEE: TemplateRegistryEntry = {
  productId: 'pro_3WAxijeHRa60iWOTsmDCeA',
  name: 'AS Colour Premium T-Shirt',
  brand: 'AS Colour',
  category: 'Apparel/T-Shirts',
  productionMethod: 'DTG',
  supportsBackendRendering: true,
  regions: [
    {
      regionId: 'label_inside_dtf',
      type: 'label_inside_dtf',
      available: false,
      width: 450,
      height: 336,
      dpi: 300,
      placements: []
    }
  ],
  colorVariants: [{ name: 'Black', sizeVariants: [{ size: 'S' }, { size: 'M' }] }],
  priceFrom: { amount: 20.95, currency: 'USD' },
  buildable: true,
  nonTransparency: false
};

/** A template that published an area with no dimensions, and a null `regionId`. → T08 */
const UNMEASURED: TemplateRegistryEntry = {
  productId: 'pro_unmeasured',
  name: 'Mystery Item',
  brand: 'Generic',
  category: 'Accessories/Flags',
  productionMethod: 'EMBROIDERY',
  supportsBackendRendering: true,
  regions: [
    { regionId: null, type: 'default', width: 0, height: 0, placements: [] },
    { regionId: 'front', type: 'front', width: 1500, height: 0, placements: [] }
  ],
  colorVariants: [],
  buildable: true,
  nonTransparency: false
};

const NOT_RENDERABLE: TemplateRegistryEntry = {
  productId: 'pro_not_renderable',
  name: 'Unrenderable Mug',
  brand: 'Generic',
  category: 'Drinkware/Coffee Mugs',
  productionMethod: 'UV',
  supportsBackendRendering: false,
  regions: [
    { regionId: 'default', type: 'default', width: 2475, height: 1733, dpi: 300, placements: [] }
  ],
  colorVariants: [{ name: 'Black', sizeVariants: [{ size: '11oz' }] }],
  priceFrom: { amount: 18, currency: 'USD' },
  buildable: false,
  nonTransparency: true
};

const FIXTURES: PlaygroundTemplate[] = [
  toPlaygroundTemplate(CANDLE),
  toPlaygroundTemplate(TEE),
  toPlaygroundTemplate(UNMEASURED),
  toPlaygroundTemplate(NOT_RENDERABLE)
];

function filters(overrides: Partial<FilterState> = {}): FilterState {
  return { ...EMPTY_FILTERS, ...overrides };
}

describe('projection', () => {
  it('keeps productId as the only identifier and does not assume name is unique', () => {
    // 605 entries carry 436 distinct names, so a UI keyed on name would merge different templates.
    // This asserts the fact rather than the UI, so the assumption is re-checked on regeneration.
    const names = new Set(registry.entries.map((e) => e.name));
    expect(registry.entries.length).toBe(605);
    expect(names.size).toBeLessThan(registry.entries.length);

    const projected = toPlaygroundTemplate(CANDLE);
    expect(projected.productId).toBe(CANDLE.productId);
    expect(projected.productId.startsWith('pro_')).toBe(true);
  });

  it('marks a region with width <= 0 as unmeasured instead of dropping it', () => {
    // fit.ts skips these silently. The UI must not, or "no measurements" reads as "no print area".
    const zero = presentRegion({ regionId: 'a', width: 0, height: 100, measured: false });
    const negativeHeight = presentRegion({
      regionId: 'b',
      width: 100,
      height: -5,
      measured: false
    });
    expect(zero.usable).toBe(false);
    expect(negativeHeight.usable).toBe(false);
    expect(zero.dimensions).toBe('no measurements published');
    expect(zero.orientation).toBe('unknown');
  });

  it('labels a region with a null regionId from its type rather than showing "null"', () => {
    const p = presentRegion({
      regionId: null,
      type: 'default',
      width: 100,
      height: 100,
      measured: true
    });
    expect(p.label).toBe('default');
  });

  it('reports DPI as unpublished rather than guessing a value', () => {
    const p = presentRegion({ regionId: 'front', width: 100, height: 200, measured: true });
    expect(p.dpi).toBe('DPI not published');
  });

  it('ignores region `available` entirely', () => {
    // CANDLE's only region reports available:false, and it is a live, orderable template. The
    // projection must carry it as a measured, usable region anyway → T08.
    const candle = toPlaygroundTemplate(CANDLE);
    expect(candle.regions).toHaveLength(1);
    expect(candle.regions[0]?.measured).toBe(true);
  });

  it('classifies aspect ratio into orientation, tolerating near-square', () => {
    const shape = (w: number, h: number) =>
      presentRegion({ regionId: 'r', width: w, height: h, measured: true }).orientation;
    expect(shape(4488, 4488)).toBe('square');
    expect(shape(4450, 4488)).toBe('square');
    expect(shape(2700, 1050)).toBe('landscape');
    expect(shape(900, 1200)).toBe('portrait');
  });
});

describe('capability presentation', () => {
  it('reports template-level capability without predicting a print outcome', () => {
    expect(templateCapability(toPlaygroundTemplate(CANDLE))).toBe('jpeg-ready');
    expect(templateCapability(toPlaygroundTemplate(TEE))).toBe('needs-png');
    expect(templateCapability(toPlaygroundTemplate(NOT_RENDERABLE))).toBe('not-renderable');
  });

  it('never describes a coarse flag as a verdict', () => {
    // The wording is the guard. "Buildable" and "nonTransparency" are coarse filters; the labels
    // must stay on the template, and must not promise the artwork will print.
    for (const t of FIXTURES) {
      const label = CAPABILITY_LABEL[templateCapability(t)];
      expect(label).not.toMatch(/will print|ready to sell|ready to ship|publishes automatically/i);
    }
  });
});

describe('facets', () => {
  it('collapses two spellings of one brand into a single facet', () => {
    // The registry really does carry both "Bella + Canvas" and "Bella+Canvas", and "AllColor" and
    // "Allcolor". Raw-string facets would render two identical rows that each drop half the results.
    const catalog = buildCatalog([
      { ...TEE, brand: 'Bella + Canvas' },
      { ...TEE, productId: 'pro_second', brand: 'Bella+Canvas' }
    ]);
    expect(catalog.facets.brands).toHaveLength(1);
    expect(catalog.facets.brands[0]?.count).toBe(2);
    expect(normalizeFacetValue('Bella + Canvas')).toBe(normalizeFacetValue('Bella+Canvas'));
  });

  it('labels a facet with its most common spelling, not a minority one', () => {
    const catalog = buildCatalog([
      { ...TEE, brand: 'Allcolor' },
      { ...TEE, productId: 'pro_b', brand: 'Allcolor' },
      { ...TEE, productId: 'pro_c', brand: 'AllColor' }
    ]);
    expect(catalog.facets.brands[0]?.label).toBe('Allcolor');
    expect(catalog.facets.brands[0]?.count).toBe(3);
  });

  it('merging a brand spelling does not merge the templates', () => {
    const catalog = buildCatalog([
      { ...TEE, brand: 'Bella + Canvas' },
      { ...TEE, productId: 'pro_second', brand: 'Bella+Canvas' }
    ]);
    // Both entries still exist; only the filter key is shared.
    expect(catalog.templates).toHaveLength(2);
    expect(catalog.facets.brands[0]?.value).toBe('bella canvas');
  });

  it('groups categories on the segment before the slash', () => {
    expect(categoryGroup('Apparel/T-Shirts')).toBe('Apparel');
    expect(categoryGroup('Drinkware/Coffee Mugs')).toBe('Drinkware');
    expect(categoryGroup('Flags')).toBe('Flags');
    expect(categoryGroup(undefined)).toBe('Uncategorised');
  });
});

describe('filtering', () => {
  it('returns everything when no filter is set', () => {
    expect(filterTemplates(FIXTURES, filters())).toHaveLength(4);
  });

  it('searches across name, brand, category, method and productId', () => {
    const byName = filterTemplates(FIXTURES, filters({ query: 'candle' }));
    expect(byName.map((t) => t.productId)).toEqual([CANDLE.productId]);

    expect(filterTemplates(FIXTURES, filters({ query: 'AS Colour' }))).toHaveLength(1);
    expect(filterTemplates(FIXTURES, filters({ query: 'dtg' }))).toHaveLength(1);
    expect(filterTemplates(FIXTURES, filters({ query: CANDLE.productId }))).toHaveLength(1);
  });

  it('requires every search term to match, so extra words narrow', () => {
    expect(filterTemplates(FIXTURES, filters({ query: 'candle jar' }))).toHaveLength(1);
    expect(filterTemplates(FIXTURES, filters({ query: 'candle mug' }))).toHaveLength(0);
  });

  it('is case-insensitive and whitespace-tolerant', () => {
    expect(filterTemplates(FIXTURES, filters({ query: '  CANDLE  ' }))).toHaveLength(1);
  });

  it('the non-transparency filter selects exactly the JPEG-buildable set', () => {
    const jpeg = filterTemplates(FIXTURES, filters({ nonTransparencyOnly: true }));
    expect(jpeg.map((t) => t.productId)).toEqual([CANDLE.productId, NOT_RENDERABLE.productId]);
  });

  it('the buildable filter is a coarse filter and still returns a template with no measured area', () => {
    // UNMEASURED is buildable, so it survives this filter — which is exactly why the flag cannot be
    // presented as "will print". The measured-area fact lives on the regions, not the flag.
    const buildable = filterTemplates(FIXTURES, filters({ buildableOnly: true }));
    expect(buildable).toHaveLength(3);
    expect(buildable.map((t) => t.productId)).toContain(UNMEASURED.productId);
    expect(toPlaygroundTemplate(UNMEASURED).regions.some((r) => r.measured)).toBe(false);
  });

  it('applies a price band on priceFrom, in dollars', () => {
    // $20.95 tee, $18 mug, $28 candle, and one template with no price at all.
    expect(filterTemplates(FIXTURES, filters({ priceBand: 'under-15' }))).toHaveLength(0);
    expect(
      filterTemplates(FIXTURES, filters({ priceBand: '15-25' })).map((t) => t.productId)
    ).toEqual([TEE.productId, NOT_RENDERABLE.productId]);
    expect(
      filterTemplates(FIXTURES, filters({ priceBand: '25-40' })).map((t) => t.productId)
    ).toEqual([CANDLE.productId]);
  });

  it('excludes an unpriced template from a price band rather than assuming $0', () => {
    const unpriced = toPlaygroundTemplate({
      ...CANDLE,
      productId: 'pro_unpriced',
      priceFrom: undefined
    });
    expect(filterTemplates([unpriced], filters({ priceBand: 'under-15' }))).toHaveLength(0);
    expect(filterTemplates([unpriced], filters({ priceBand: 'any' }))).toHaveLength(1);
  });

  it('combines flags conjunctively', () => {
    const both = filterTemplates(
      FIXTURES,
      filters({ buildableOnly: true, nonTransparencyOnly: true })
    );
    expect(both.map((t) => t.productId)).toEqual([CANDLE.productId]);
  });

  it('toggles a facet value on and off', () => {
    expect(toggleFacetValue([], 'dtg')).toEqual(['dtg']);
    expect(toggleFacetValue(['dtg', 'uv'], 'dtg')).toEqual(['uv']);
  });
});

describe('per-region usability via the tested fit rules', () => {
  const candle = toPlaygroundTemplate(CANDLE);
  const tee = toPlaygroundTemplate(TEE);
  const unmeasured = toPlaygroundTemplate(UNMEASURED);
  const unrenderable = toPlaygroundTemplate(NOT_RENDERABLE);

  it('rejects a template the design pipeline cannot render, whatever the geometry says', () => {
    // 2475x1733 comfortably accepts a 1500x1000 source, yet the verdict is still "not usable" —
    // because supportsBackendRendering is false. Pixel fit alone would say yes.
    const verdicts = evaluateUsability(unrenderable, {
      title: 'Art',
      width: 1500,
      height: 1000
    });
    expect(verdicts[0]?.usable).toBe(false);
    expect(verdicts[0]?.reason).toMatch(/not backend-renderable/i);
  });

  it('blocks an opaque JPEG on a transparency-requiring method, with the reason (T36)', () => {
    const verdicts = evaluateUsability(tee, { title: 'Art', width: 1500, height: 1000 });
    expect(verdicts[0]?.usable).toBe(false);
    expect(verdicts[0]?.reason).toMatch(/requires cutout transparency/i);
    expect(verdicts[0]?.reason).toMatch(/JPEG/i);
  });

  it('accepts the same template once the source is a transparent PNG', () => {
    // 450x336 region, 1500x1000 source: covers fine, retained 0.896 >= 0.85. This is the pair that
    // the earlier planning pass wrongly excluded, and the reason T34 exists.
    const verdicts = evaluateUsability(tee, {
      title: 'Art',
      width: 1500,
      height: 1000,
      hasAlpha: true
    });
    expect(verdicts[0]?.usable).toBe(true);
    expect(verdicts[0]?.retained).toBeGreaterThanOrEqual(0.85);
  });

  it('refuses to upscale a source smaller than the region', () => {
    // 830x563 into a 1191x720 candle region: covers 0.70 < 1.0.
    const verdicts = evaluateUsability(candle, { title: 'Small', width: 830, height: 563 });
    expect(verdicts[0]?.usable).toBe(false);
    expect(verdicts[0]?.wouldUpscale).toBe(true);
    expect(verdicts[0]?.reason).toMatch(/upscale/i);
  });

  it('accepts a large enough source on the same region', () => {
    const verdicts = evaluateUsability(candle, { title: 'Big', width: 1500, height: 1000 });
    expect(verdicts[0]?.usable).toBe(true);
  });

  it('drops regions with no measurements rather than scoring them', () => {
    const verdicts = evaluateUsability(unmeasured, { title: 'Art', width: 1500, height: 1000 });
    expect(verdicts).toHaveLength(0);
    expect(summarizeVerdicts(verdicts)).toMatch(/no measured print area/i);
  });

  it('summarises a partial pass as a count, not a yes', () => {
    const verdicts = evaluateUsability(candle, { title: 'Small', width: 830, height: 563 });
    expect(summarizeVerdicts(verdicts)).toMatch(/no region/i);
  });
});

describe('price formatting', () => {
  it('formats dollars, and says so when no price was published', () => {
    expect(formatPrice(29.95)).toBe('$29.95');
    expect(formatPrice(undefined)).toBe('Price not published');
  });
});

describe('against the real committed registry', () => {
  const catalog = buildCatalog(registry);

  it('projects all 605 entries', () => {
    expect(catalog.templates).toHaveLength(605);
  });

  it('reproduces the counts the brief states', () => {
    expect(catalog.totals.templates).toBe(605);
    expect(catalog.totals.buildable).toBe(274);
    expect(catalog.totals.nonTransparency).toBe(45);
    expect(catalog.totals.buildableNeedingCutout).toBe(229);
  });

  it('has no buildable template that is also non-transparency-flagged inconsistently', () => {
    // Every nonTransparency template must be buildable, or the "JPEG can use this" filter would
    // offer templates the pipeline cannot render.
    const bad = catalog.templates.filter((t) => t.nonTransparency && !t.buildable);
    expect(bad).toHaveLength(0);
  });

  it('accounts for the templates with no measured print area', () => {
    expect(catalog.totals.withNoMeasuredRegion).toBe(108);
    expect(catalog.totals.withUnmeasuredRegions).toBe(141);
  });

  it('preserves productId uniqueness', () => {
    const ids = new Set(catalog.templates.map((t) => t.productId));
    expect(ids.size).toBe(catalog.templates.length);
  });

  it('filters down to the 45 a JPEG source can use', () => {
    const jpeg = filterTemplates(catalog.templates, filters({ nonTransparencyOnly: true }));
    expect(jpeg).toHaveLength(45);
  });

  it('filters to the 274 backend-renderable templates', () => {
    expect(filterTemplates(catalog.templates, filters({ buildableOnly: true }))).toHaveLength(274);
  });

  it('never loses a template to an empty-result filter combination being miscounted', () => {
    // The 45 are all inside the 274, so the conjunction equals the 45.
    const both = filterTemplates(
      catalog.templates,
      filters({ buildableOnly: true, nonTransparencyOnly: true })
    );
    expect(both).toHaveLength(45);
  });

  it('reports every facet with a non-zero count that matches a direct filter', () => {
    for (const facet of catalog.facets.methods) {
      const matched = filterTemplates(catalog.templates, filters({ methods: [facet.value] }));
      expect(matched).toHaveLength(facet.count);
    }
  });

  it('builds facets covering every value present in the data', () => {
    const methodTotal = catalog.facets.methods.reduce((a, f) => a + f.count, 0);
    const categoryTotal = catalog.facets.categories.reduce((a, f) => a + f.count, 0);
    const brandTotal = catalog.facets.brands.reduce((a, f) => a + f.count, 0);
    // Every entry lands in exactly one facet value per axis — no template silently dropped.
    expect(methodTotal).toBe(catalog.templates.length);
    expect(categoryTotal).toBe(catalog.templates.length);
    expect(brandTotal).toBe(catalog.templates.length);
    // 47 distinct category strings, and none of them differ only by punctuation or case.
    expect(catalog.facets.categories).toHaveLength(47);
    // 44 raw brand strings collapse to 42: "Allcolor"/"AllColor" and "Bella+Canvas"/"Bella + Canvas".
    expect(catalog.facets.brands).toHaveLength(42);
  });
});

describe('totals', () => {
  it('counts templates with no published price', () => {
    // Measured: exactly one of the 605 has no priceFrom.
    expect(countTotals(buildCatalog(registry).templates).withoutPrice).toBe(1);
  });
});
