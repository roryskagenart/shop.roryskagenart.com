/**
 * Guards the listing-price convention.
 *
 * Every listing surface used `maxVariantPrice`, which quotes the **most expensive** variant of a
 * product whose variants are priced differently — so the home page advertised $46.00 for
 * `the-martian-alive-framed-matte-poster-canvas`, whose real entry price is $33.50. Nothing failed:
 * the build was green, the page rendered, and the number was simply 37% too high on every tile.
 *
 * The invariant: a listing quotes the **entry** price, and says "From" only when the variants
 * genuinely differ.
 *
 * ⚠️ Product-page JSON-LD is deliberately *not* covered — there `maxVariantPrice` is correct, as the
 * `highPrice` of an `AggregateOffer` paired with `lowPrice`. See
 * `app/[currency]/product/[handle]/page.tsx`.
 *
 * ⚠️ `describe`/`it`/`expect` are imported explicitly. `vitest.config.ts` sets `globals: true` at
 * RUNTIME ONLY, so omitting them passes vitest and fails `tsc` (TS2582) → T15.
 */

import { describe, expect, it } from 'vitest';

import { listingPrice } from '../product-price';

const priced = (min: string, max: string) => ({
  priceRange: {
    minVariantPrice: { amount: min, currencyCode: 'USD' },
    maxVariantPrice: { amount: max, currencyCode: 'USD' }
  }
});

describe('listingPrice', () => {
  it('quotes the entry price, not the most expensive variant', () => {
    // The measured case: a framed poster whose variants run $33.50–$46.00.
    expect(listingPrice(priced('33.5', '46')).amount).toBe('33.5');
  });

  it('marks a ranged product so the figure reads "From"', () => {
    expect(listingPrice(priced('33.5', '46')).from).toBe(true);
  });

  it('does not say "From" when every variant costs the same', () => {
    expect(listingPrice(priced('25.9', '25.9')).from).toBe(false);
  });

  it('compares numerically, not lexically', () => {
    // '9' > '100' as strings, which would invert the answer for a cheap-to-expensive range.
    const ranged = listingPrice(priced('9', '100'));
    expect(ranged.amount).toBe('9');
    expect(ranged.from).toBe(true);
  });

  it('carries the currency through from the entry variant', () => {
    expect(listingPrice(priced('33.5', '46')).currencyCode).toBe('USD');
  });
});
