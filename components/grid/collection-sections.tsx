import { GridTileImage } from 'components/grid/tile';
import { getCollectionProducts, getCollections } from 'lib/fourthwall';
import { getCollectionNavLabel } from 'lib/taxonomy';
import type { Product } from 'lib/types';
import Link from 'next/link';

/** How many products to surface per collection on the home page. */
const PER_GROUP = 4;

function ProductRow({ products, currency }: { products: Product[]; currency: string }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.handle} className="aspect-square">
          <Link
            className="relative block h-full w-full"
            href={`/${currency}/product/${product.handle}`}
            prefetch={true}
          >
            <GridTileImage
              alt={product.title}
              label={{
                title: product.title,
                amount: product.priceRange.maxVariantPrice.amount,
                currencyCode: product.priceRange.maxVariantPrice.currencyCode
              }}
              src={product.featuredImage?.url}
              transformedSrc={product.featuredImage?.transformedUrl}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Home page body: the storefront's collections, one group each.
 *
 * The groups come from `getCollections()`, so the home page and the header menu cannot disagree
 * about what the shop sells. `all` is excluded — it is a superset of every other group, so
 * rendering it would repeat every product a second time. A group with no products is dropped
 * rather than rendered as an empty heading.
 *
 * This replaces a single hardcoded grid + carousel that both read one collection handle from
 * `NEXT_PUBLIC_FW_COLLECTION`. That handle (`fine-art-originals`) does not exist in Fourthwall —
 * the storefront API answers `404 COLLECTION_NOT_FOUND_BY_SHOP_ID_AND_SHOP_ERROR` — so both
 * sections silently served the local JSON fallback and the home page never showed live stock.
 */
export async function CollectionSections({ currency }: { currency: string }) {
  const collections = await getCollections();

  const groups = await Promise.all(
    collections
      .filter((collection) => collection.handle !== 'all')
      .map(async (collection) => ({
        collection,
        // `.slice` rather than trusting `limit`: the storefront API ignores a `limit` query param
        // on `/collections/{slug}/products` — measured 2026-10-07, `limit=2` still returns all 6 of
        // `gifts-goodies`. `getCollectionProducts`'s `limit` only caps the local JSON fallback.
        products: (
          await getCollectionProducts({
            collection: collection.handle,
            currency,
            limit: PER_GROUP
          })
        ).slice(0, PER_GROUP)
      }))
  );

  const populated = groups.filter((group) => group.products.length > 0);

  if (!populated.length) return null;

  return (
    <div className="mx-auto max-w-screen-2xl space-y-12 px-4 py-12">
      {populated.map(({ collection, products }) => (
        <section key={collection.handle}>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold uppercase tracking-tight text-black dark:text-white sm:text-xl">
                {getCollectionNavLabel(collection.handle, collection.title)}
              </h2>
              {collection.description ? (
                <p className="mt-1 line-clamp-1 max-w-2xl text-xs text-neutral-500">
                  {collection.description}
                </p>
              ) : null}
            </div>
            <Link
              href={`/${currency}/collections/${collection.handle}`}
              prefetch={true}
              className="whitespace-nowrap text-xs font-semibold text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
            >
              View All →
            </Link>
          </div>
          <ProductRow products={products} currency={currency} />
        </section>
      ))}
    </div>
  );
}
