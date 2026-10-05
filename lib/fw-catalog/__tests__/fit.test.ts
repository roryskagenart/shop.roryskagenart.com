/**
 * Tests for the fit rules.
 *
 * The fixture dimensions are the REAL measured ones from 2026-10-04, not invented numbers, so a
 * regression here means the catalogue or the art changed rather than the arithmetic:
 *
 * - `pro_N__f9U5XQJqcP_oCvwk2rw` Soy Wax Candle — region `default` 1191x720, PRINTED, 1 size
 * - `pro_3WAxijeHRa60iWOTsmDCeA` AS Colour Premium T-Shirt — region `label_inside_dtf` 450x336, DTFX
 * - Austin Art Garage sources: 1500x1000 (Lobedicus, Gnardred, Kelzon 5) and 830x563 (the rest)
 *
 * The three cases below are the ones that were answered wrongly during planning. Each is a
 * regression test for a specific wrong answer, which is the only kind worth writing.
 */

import { describe, expect, it } from 'vitest';

import {
  MIN_COVERS,
  MIN_RETAINED,
  distinctSizes,
  evaluateTemplate,
  findCommonTemplate,
  hasUnprobedSizes,
  measureFit,
  pickTemplates,
  requiresTransparency
} from '../fit';
import type { TemplateRegistryEntry } from '../types';

const CANDLE: TemplateRegistryEntry = {
  productId: 'pro_N__f9U5XQJqcP_oCvwk2rw',
  name: 'Soy Wax Candle In A Clear Glass Jar',
  productionMethod: 'PRINTED',
  supportsBackendRendering: true,
  regions: [
    {
      regionId: 'default',
      type: 'default',
      available: true,
      width: 1191,
      height: 720,
      dpi: 300,
      placements: []
    }
  ],
  colorVariants: [
    {
      name: 'White',
      hex: '#ffffff',
      sizeVariants: [
        { size: 'Unscented', price: { amount: 12.95, currency: 'USD' }, available: true }
      ]
    }
  ],
  priceFrom: { amount: 12.95, currency: 'USD' }
};

// Real: this is the apparel template that fits all 11 artworks — at 450x336, which is SMALLER than
// the 830px art. It is excluded from JPEG builds only by the transparency rule, not by fit.
const TEE: TemplateRegistryEntry = {
  productId: 'pro_3WAxijeHRa60iWOTsmDCeA',
  name: 'AS Colour Unisex Premium T-Shirt',
  productionMethod: 'DTFX',
  supportsBackendRendering: true,
  regions: [
    {
      regionId: 'label_inside_dtf',
      type: 'label_inside_dtf',
      available: true,
      width: 450,
      height: 336,
      dpi: 150,
      placements: []
    }
  ],
  colorVariants: [
    {
      name: 'Black',
      sizeVariants: [
        { size: 'S', price: { amount: 16.32, currency: 'USD' } },
        { size: 'M', price: { amount: 16.32, currency: 'USD' } }
      ]
    }
  ]
};

const NOT_RENDERABLE: TemplateRegistryEntry = {
  productId: 'pro_lLYMnccJTqOijMduWMT-fA',
  name: 'Area Rug',
  productionMethod: 'SUBLIMATION',
  supportsBackendRendering: false,
  regions: [
    { regionId: null, type: 'front', available: false, width: 0, height: 0, placements: [] }
  ],
  colorVariants: []
};

const REGISTRY = [CANDLE, TEE, NOT_RENDERABLE];

const big = { title: 'Lobedicus', width: 1500, height: 1000 };
const small = { title: 'Tuna 4 Cats', width: 830, height: 563 };

describe('measureFit', () => {
  it('rejects non-positive dimensions instead of returning a nonsense number', () => {
    expect(() => measureFit({ width: 0, height: 100 }, { width: 10, height: 10 })).toThrow();
    expect(() => measureFit({ width: 10, height: 10 }, { width: 10, height: -1 })).toThrow();
  });

  it('computes retention for a centre-crop, and the axes fail independently', () => {
    // 1500x1000 (1.5) into 1191x720 (1.654): the artwork is the narrower ratio, so the region is
    // cropped; 1500/1000 art into 1191x720 region retains min(1.654/1.5, 1.5/1.654) = 0.907.
    const r = measureFit(big, { width: 1191, height: 720 });
    expect(r.retained).toBeCloseTo(0.907, 2);
    expect(r.covers).toBeGreaterThan(MIN_COVERS);
    expect(r.passes).toBe(true);
  });

  it('flags an upscale rather than silently accepting it', () => {
    // 830x563 into 1191x720: covers = min(0.70, 0.78) = 0.70 < 1.0, so the pipeline must enlarge.
    const r = measureFit(small, { width: 1191, height: 720 });
    expect(r.wouldUpscale).toBe(true);
    expect(r.covers).toBeCloseTo(0.7, 2);
    expect(r.passes).toBe(false);
  });

  it('rejects a crop that would lose too much of the artwork', () => {
    // A 1:1 art into a 3:1 banner keeps only a third of the height.
    const r = measureFit({ width: 1000, height: 1000 }, { width: 3000, height: 1000 });
    expect(r.retained).toBeCloseTo(1 / 3, 2);
    expect(r.retained).toBeLessThan(MIN_RETAINED);
    expect(r.passes).toBe(false);
  });
});

describe('requiresTransparency', () => {
  it('treats the measured non-transparency methods as JPEG-safe', () => {
    for (const m of ['UV', 'SUBLIMATION', 'PRINTED', 'STICKER', 'LASER_ETCHED', 'ALL_OVER_PRINT']) {
      expect(requiresTransparency(m)).toBe(false);
    }
  });

  it('treats DTG/DTFX as requiring a cutout', () => {
    expect(requiresTransparency('DTG')).toBe(true);
    expect(requiresTransparency('DTFX')).toBe(true);
    expect(requiresTransparency(undefined)).toBe(true);
  });
});

describe('evaluateTemplate', () => {
  it('accepts big artwork on the candle', () => {
    const v = evaluateTemplate(big, CANDLE);
    expect(v).toHaveLength(1);
    expect(v[0]?.usable).toBe(true);
    expect(v[0]?.region.regionId).toBe('default');
  });

  it('refuses apparel for opaque JPEG art, and says why', () => {
    // The tee FITS dimensionally — 450x336 is smaller than 830px. It is refused on transparency
    // alone. This is the distinction that was collapsed during planning, which produced the
    // "nothing is buildable" answer.
    const v = evaluateTemplate(small, TEE);
    expect(v[0]?.fit.passes).toBe(true);
    expect(v[0]?.usable).toBe(false);
    expect(v[0]?.reason).toMatch(/transparency/i);
  });

  it('allows the same apparel once a real cutout exists', () => {
    const v = evaluateTemplate({ ...small, hasAlpha: true }, TEE);
    expect(v[0]?.usable).toBe(true);
  });

  it('refuses a template that is not backend-renderable', () => {
    const v = evaluateTemplate(big, NOT_RENDERABLE);
    expect(v).toHaveLength(0); // no measured region at all
    expect(CANDLE.supportsBackendRendering).toBe(true);
  });

  it('skips unpublished regions rather than crashing or treating them as fits', () => {
    const zeroRegion: TemplateRegistryEntry = {
      ...CANDLE,
      regions: [{ regionId: 'front', width: 0, height: 0, placements: [] }]
    };
    expect(evaluateTemplate(big, zeroRegion)).toHaveLength(0);
  });
});

describe('pickTemplates', () => {
  it('finds only the candle for 1500x1000 art', () => {
    const hits = pickTemplates(big, REGISTRY);
    expect(hits.map((h) => h.entry.productId)).toEqual(['pro_N__f9U5XQJqcP_oCvwk2rw']);
  });

  it('finds nothing for 830x563 opaque art', () => {
    expect(pickTemplates(small, REGISTRY)).toHaveLength(0);
  });

  it('finds apparel for 830x563 art when alpha is present', () => {
    const hits = pickTemplates({ ...small, hasAlpha: true }, REGISTRY);
    expect(hits.map((h) => h.entry.productId)).toContain('pro_3WAxijeHRa60iWOTsmDCeA');
  });
});

describe('findCommonTemplate', () => {
  const three = [
    { title: 'Lobedicus', width: 1500, height: 1000 },
    { title: 'Gnardred', width: 1500, height: 1000 },
    { title: 'Kelzon 5', width: 1500, height: 1000 }
  ];

  it('answers "one template for all three" with the candle', () => {
    const { found } = findCommonTemplate(three, REGISTRY);
    expect(found.map((f) => f.productId)).toEqual(['pro_N__f9U5XQJqcP_oCvwk2rw']);
  });

  it('answers no, and names the blocker per artwork', () => {
    const { found, blocked } = findCommonTemplate([...three, small], REGISTRY);
    expect(found).toHaveLength(0);
    // The diagnostic must distinguish "needs transparency" from "would upscale", because those are
    // different asks on Rory and a single vague message collapses them.
    expect(blocked['Tuna 4 Cats']).toMatch(/transparen/i);
    expect(Object.keys(blocked)).toContain('Lobedicus');
  });

  it('handles an empty artwork list without throwing', () => {
    expect(findCommonTemplate([], REGISTRY)).toEqual({ found: [], blocked: {} });
  });
});

describe('size helpers', () => {
  it('de-duplicates sizes across colour variants (12 distinct vs 36 variants)', () => {
    const multi: TemplateRegistryEntry = {
      ...CANDLE,
      colorVariants: [
        { name: 'Black', sizeVariants: [{ size: '8" x 10"' }, { size: '10" x 10"' }] },
        { name: 'Red Oak', sizeVariants: [{ size: '8" x 10"' }, { size: '10" x 10"' }] }
      ]
    };
    // Two colours x two sizes = 4 sizeVariants, but only 2 distinct sizes. Reporting "4" would
    // describe variants, not a ladder — the ambiguity the T06 correction has to make explicit.
    expect(distinctSizes(multi)).toEqual(['10" x 10"', '8" x 10"']);
    const totalVariants = multi.colorVariants.reduce((n, c) => n + c.sizeVariants.length, 0);
    expect(totalVariants).toBe(4);
  });

  it('treats one size as valid and zero sizes as unprobed — different states', () => {
    expect(distinctSizes(CANDLE)).toEqual(['Unscented']);
    expect(hasUnprobedSizes(CANDLE)).toBe(false);
    const empty: TemplateRegistryEntry = { ...CANDLE, colorVariants: [] };
    expect(hasUnprobedSizes(empty)).toBe(true);
  });
});
