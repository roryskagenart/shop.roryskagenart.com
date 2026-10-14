import type { Product } from './types';

export type ListingPrice = {
  /** The entry price — the cheapest variant. */
  amount: string;
  currencyCode: string;
  /** True when the variants are priced differently, so the figure is a starting price. */
  from: boolean;
};

/**
 * The price a *listing* should quote.
 *
 * Every listing surface used `maxVariantPrice`, which quotes the **most expensive** variant of a
 * product whose variants are priced differently. On the home page that advertised $46.00 for
 * `the-martian-alive-framed-matte-poster-canvas`, whose real entry price is $33.50 — a 37%
 * overstatement of the cheapest way in, repeated on every tile.
 *
 * A listing answers "what does it cost to start", so it quotes the minimum and says "From" when the
 * variants genuinely differ.
 *
 * ⚠️ The product page's JSON-LD is the one place `maxVariantPrice` is correct: there it is the
 * `highPrice` of a real `AggregateOffer`, paired with `lowPrice`. See
 * `app/[currency]/product/[handle]/page.tsx`. Do not "fix" that one.
 */
export function listingPrice(product: Pick<Product, 'priceRange'>): ListingPrice {
  const { minVariantPrice, maxVariantPrice } = product.priceRange;

  return {
    amount: minVariantPrice.amount,
    currencyCode: minVariantPrice.currencyCode,
    from: Number(maxVariantPrice.amount) > Number(minVariantPrice.amount)
  };
}
