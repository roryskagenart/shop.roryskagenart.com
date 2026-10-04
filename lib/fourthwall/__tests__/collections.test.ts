import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression tests for storefront navigation.
 *
 * Both bugs below were live on the deployed site and both are silent: nothing throws, the pages
 * render fine, they just render the wrong thing. That is exactly why they survived — so these
 * assertions are on the *contents* of the navigation, not on whether the call succeeded.
 *
 * The storefront token is read once at module load, so it must be set before the dynamic import.
 */
process.env.NEXT_PUBLIC_FW_STOREFRONT_TOKEN = 'ptkn_unit_test_token';
process.env.NEXT_PUBLIC_FW_API_URL = 'https://storefront-api.fourthwall.com/v1';

const TAXONOMY_HANDLES = [
  'fine-art-originals',
  'b2b-corporate-gifts',
  'metal-litho',
  'canvas-prints',
  'desk-art',
  'kitsch-cpg',
  'apparel',
];

/** What Fourthwall actually answers with: its two built-in collections. */
const FOURTHWALL_BUILTINS = {
  results: [
    { id: 'col_1', name: 'featured', slug: 'featured', description: '', updatedAt: '' },
    { id: 'col_2', name: 'All Products', slug: 'all', description: 'Everything', updatedAt: '' },
  ],
};

/**
 * A Fourthwall product, minimal but shaped like the real response.
 *
 * `state.type` / `access.type` are what make a product purchasable, so a fixture without them
 * asserts nothing — which is why `getCollections` treats an absent field as "not asserted".
 */
function fwProduct(slug: string, extra: Record<string, unknown> = {}) {
  return {
    id: `p_${slug}`,
    name: slug,
    slug,
    description: '',
    images: [],
    variants: [],
    state: { type: 'AVAILABLE' },
    access: { type: 'PUBLIC' },
    updatedAt: '',
    ...extra,
  };
}

/**
 * Routes the stub by request path, because `getCollections` now makes TWO kinds of call:
 * `/collections` (the menu) and `/collections/<slug>/products` (does it have stock?). A stub
 * that answers every URL with one payload would feed collection records into the stock probe.
 */
function stubFourthwall(routes: {
  collections: unknown;
  products?: Record<string, unknown[]>;
}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const productsMatch = url.pathname.match(/\/collections\/([^/]+)\/products$/);
      if (productsMatch) {
        const slug = decodeURIComponent(productsMatch[1] as string);
        return new Response(
          JSON.stringify({ results: routes.products?.[slug] ?? [] }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify(routes.collections), { status: 200 });
    })
  );
}

function stubFetch(payload: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 }))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getCollections', () => {
  it('lists a curated collection only once Fourthwall actually stocks it', async () => {
    // Measured live 2026-10-03: Fourthwall has three collections, and none of them is a
    // curated taxonomy handle. The nav must therefore be built from the stocked set, not
    // from `PRODUCT_COLLECTIONS`.
    stubFourthwall({
      collections: FOURTHWALL_BUILTINS,
      products: { all: [fwProduct('anything')] },
    });
    const { getCollections } = await import('../index');

    const handles = (await getCollections()).map((c) => c.handle);

    // `all` is always offered; nothing else qualifies when only `all` has stock.
    expect(handles).toContain('all');
    // A collection with no purchasable product is not advertised — a shopper who follows a
    // nav link to an empty page is a worse outcome than a shorter menu.
    for (const handle of TAXONOMY_HANDLES) {
      expect(handles).not.toContain(handle);
    }
  });

  it('keeps a stocked curated handle, and only that one', async () => {
    stubFourthwall({
      collections: FOURTHWALL_BUILTINS,
      products: { 'kitsch-cpg': [fwProduct('a-mug')], apparel: [fwProduct('a-tee')] },
    });
    const { getCollections } = await import('../index');

    const handles = (await getCollections()).map((c) => c.handle);

    expect(handles).toContain('kitsch-cpg');
    expect(handles).toContain('apparel');
    expect(handles).not.toContain('metal-litho');
    expect(handles).toContain('all');
  });

  it('prefers the taxonomy title over a colliding Fourthwall collection', async () => {
    stubFourthwall({
      collections: {
        results: [
          { id: 'col_3', name: 'Kitsch CPG', slug: 'kitsch-cpg', description: 'Remote copy', updatedAt: '' },
        ],
      },
      products: { 'kitsch-cpg': [fwProduct('a-mug')] },
    });
    const { getCollections } = await import('../index');

    const collections = await getCollections();
    const kitsch = collections.filter((c) => c.handle === 'kitsch-cpg');

    // One entry, and the taxonomy's designed title wins — not Fourthwall's raw name.
    expect(kitsch).toHaveLength(1);
    expect(kitsch[0]?.title).toBe('Kitsch, CPG & Austin Pop Living');
  });

  it('still surfaces a stocked collection that only exists in Fourthwall', async () => {
    stubFourthwall({
      collections: {
        results: [
          { id: 'col_4', name: 'Winter Drop', slug: 'winter-drop', description: '', updatedAt: '' },
        ],
      },
      products: { 'winter-drop': [fwProduct('a-scarf')] },
    });
    const { getCollections } = await import('../index');

    const handles = (await getCollections()).map((c) => c.handle);

    expect(handles).toContain('winter-drop');
  });

  it('hides a Fourthwall collection whose only product is sold out or archived', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(String(input));
        const productSlug = url.pathname.match(/\/collections\/([^/]+)\/products$/);
        if (productSlug) {
          const slug = decodeURIComponent(productSlug[1] as string);
          const products =
            slug === 'winter-drop'
              ? [fwProduct('a-scarf', { state: { type: 'SOLD_OUT' } })]
              : slug === 'private-drop'
                ? [fwProduct('a-ring', { access: { type: 'ARCHIVED' } })]
                : [];
          return new Response(JSON.stringify({ results: products }), { status: 200 });
        }
        return new Response(
          JSON.stringify({
            results: [
              { id: 'c1', name: 'Winter Drop', slug: 'winter-drop', description: '', updatedAt: '' },
              { id: 'c2', name: 'Private Drop', slug: 'private-drop', description: '', updatedAt: '' },
            ],
          }),
          { status: 200 }
        );
      })
    );

    const { getCollections } = await import('../index');
    const handles = (await getCollections()).map((c) => c.handle);

    // Not advertised: a sold-out and an archived product are not something to send a shopper to.
    expect(handles).not.toContain('winter-drop');
    expect(handles).not.toContain('private-drop');
  });

  it('returns the full taxonomy when Fourthwall is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );
    const { getCollections } = await import('../index');

    const handles = (await getCollections()).map((c) => c.handle);

    // Losing the storefront must not empty the navigation — the taxonomy still carries the
    // designed categories, badges and copy.
    for (const handle of TAXONOMY_HANDLES) {
      expect(handles).toContain(handle);
    }
  });
});

describe('getCollectionProducts', () => {
  it('returns nothing for a category with no products, instead of the fine-art originals', async () => {
    stubFetch({ results: [] });
    const { getCollectionProducts } = await import('../index');

    // The bug: every unmatched handle returned the 15 originals, so `apparel` claimed to stock
    // $4k–$28k paintings and the designed empty state could never render.
    const products = await getCollectionProducts({ collection: 'apparel', currency: 'USD' });

    expect(products).toEqual([]);
  });

  it('still returns the fifteen originals for fine-art-originals', async () => {
    stubFetch({ results: [] });
    const { getCollectionProducts } = await import('../index');

    const products = await getCollectionProducts({ collection: 'fine-art-originals', currency: 'USD' });

    expect(products).toHaveLength(15);
  });

  it('still returns the full archive for all', async () => {
    stubFetch({ results: [] });
    const { getCollectionProducts } = await import('../index');

    const products = await getCollectionProducts({ collection: 'all', currency: 'USD' });

    // 15 originals + 137 artworks
    expect(products).toHaveLength(152);
  });

  it('prefers Fourthwall products when the collection exists there', async () => {
    stubFetch({
      results: [
        {
          id: 'p1',
          name: 'Odoroita Sakana - White Glossy Mug',
          slug: 'odoroita-sakana-white-glossy-mug',
          description: '',
          images: [],
          variants: [],
          updatedAt: '',
        },
      ],
    });
    const { getCollectionProducts } = await import('../index');

    const products = await getCollectionProducts({ collection: 'kitsch-cpg', currency: 'USD' });

    expect(products).toHaveLength(1);
    expect(products[0]?.handle).toBe('odoroita-sakana-white-glossy-mug');
  });
});
