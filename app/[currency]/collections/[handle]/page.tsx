import type { Metadata } from "next";
import Grid from "components/grid";
import Collections from "components/layout/collections";
import Footer from "components/layout/footer";
import ProductGridItems from "components/layout/product-grid-items";
import { Wrapper } from "components/wrapper";
import { getCollectionProducts, getCollections, getShop, getShopOgImage } from "lib/fourthwall";
import { getCollectionByHandle } from "lib/taxonomy";
import Link from "next/link";

export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ currency: string; handle: string }>;
}): Promise<Metadata> {
  const { currency, handle } = await params;
  const [products, shopOgImage, shop] = await Promise.all([
    getCollectionProducts({ collection: handle, currency, limit: 1 }),
    getShopOgImage(),
    getShop()
  ]);

  const tax = getCollectionByHandle(handle);
  const title = tax ? tax.title : handle.charAt(0).toUpperCase() + handle.slice(1);
  const firstProduct = products[0];
  const ogImageUrl = firstProduct?.featuredImage?.url || shopOgImage;

  return {
    title: `${title} | ${shop.name}`,
    description: tax?.description || `Explore ${title} from Rory Skagen Art Studio.`,
    openGraph: ogImageUrl
      ? {
          images: [{ url: ogImageUrl }]
        }
      : undefined,
    twitter: {
      card: 'summary_large_image',
      images: ogImageUrl ? [ogImageUrl] : undefined
    }
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ currency: string; handle: string }>;
}) {
  const { currency, handle } = await params;
  const [products, shop, collections] = await Promise.all([
    getCollectionProducts({ collection: handle, currency, limit: 50 }),
    getShop(),
    getCollections()
  ]);

  const tax = getCollectionByHandle(handle);

  return (
    <Wrapper currency={currency} shop={shop}>
      {/* Collection Hero Header */}
      <div className="border-b border-brand-border bg-brand-surface">
        <div className="page-shell py-10 sm:py-12 lg:py-14">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">
              Collection Taxonomy
            </span>
            {tax?.badge && (
              <span className="rounded-full bg-amber-500/10 px-3 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {tax.badge}
              </span>
            )}
            {tax?.priceRange && (
              <span className="rounded-md bg-neutral-200/80 px-2 py-0.5 text-xs font-mono font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                {tax.priceRange}
              </span>
            )}
            {tax?.b2bEligible && (
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                B2B & Corporate Eligible
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-black dark:text-white">
            {tax ? tax.title : handle.replace(/-/g, ' ')}
          </h1>

          <p className="mt-2 max-w-3xl text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {tax?.heroTagline || tax?.description || `Authentic fine art and specialized merchandise created with Rory Skagen's iconic art.`}
          </p>

          {tax?.targetAudience && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <span className="font-semibold text-neutral-700 dark:text-neutral-400">Target Audiences:</span>
              {tax.targetAudience.map((aud) => (
                <span key={aud} className="rounded bg-white px-2 py-0.5 border border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
                  {aud}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="page-shell flex flex-col gap-8 py-8 text-brand-fg sm:gap-10 sm:py-10 md:flex-row lg:gap-12 lg:py-14">
        {/* Left Sidebar Collections Navigation */}
        <div className="order-first w-full flex-none md:max-w-[220px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 px-2">
            Browse Collections
          </h3>
          <Collections collections={collections} />
        </div>

        {/* Product Grid Area */}
        <div className="order-last w-full flex-1 md:order-none">
          <section>
            {products.length > 0 ? (
              <div>
                <div className="mb-4 flex items-center justify-between text-xs text-neutral-500">
                  <span>Showing {products.length} {handle === 'fine-art-originals' ? 'Original Masterworks ($4,000 – $28,000)' : 'Artworks & Products'}</span>
                  {handle === 'fine-art-originals' && (
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      ● 15 Certified Studio Originals Available
                    </span>
                  )}
                </div>
                <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <ProductGridItems products={products} currency={currency} />
                </Grid>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800 p-8 text-center max-w-2xl mx-auto my-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xl font-bold">
                  ★
                </div>
                <h3 className="mt-4 text-xl font-bold text-black dark:text-white">
                  {tax?.title || 'Collection in Production'}
                </h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {tax?.description}
                </p>

                {tax?.productTypes && (
                  <div className="mt-6 text-left border-t border-neutral-200 dark:border-neutral-800 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Planned Products in this Category:
                    </p>
                    <ul className="space-y-1 text-xs text-neutral-600 dark:text-neutral-300 list-disc list-inside">
                      {tax.sampleProducts.map((sp, idx) => (
                        <li key={idx}>{sp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    href={`/${currency}/collections/fine-art-originals`}
                    className="rounded-md bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition"
                  >
                    View Fine Art Originals ($4k–$28k) →
                  </Link>
                  <Link
                    href="/pages/contact"
                    className="rounded-md border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900 transition"
                  >
                    Request B2B / Custom Run
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      {/*
        Studio invitation — deliberately at the foot of the page, below the grid.

        This used to be a "Corporate & HR Advisory" card wedged into the sidebar, sitting above the
        fold next to the category list. That was the wrong slot and the wrong voice: it competed
        with navigation a shopper had not finished using, and "advisory / volume tiering" is
        procurement language aimed at a buying committee, not at someone browsing Rory's work.
        Same intent — larger orders, gifts, commissions — but addressed to a person, and placed
        after the products rather than before them.
      */}
      <section className="border-t border-brand-border bg-brand-surface">
        <div className="page-shell page-section">
          <div className="mx-auto flex max-w-3xl flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
            <div>
              <p className="eyebrow">Beyond the shop</p>
              <h2 className="heading-section mt-2">Planning something bigger?</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-fg-muted">
                Gift boxes for a whole team, a run of prints for a lobby, or one piece for a
                particular wall — tell Rory&apos;s studio what you have in mind and we&apos;ll work
                it out with you. No forms to fill in, just a conversation.
              </p>
            </div>
            <Link
              href="/pages/contact"
              className="flex-none rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-brand-accent-fg transition hover:opacity-90"
            >
              Talk to Rory&apos;s team
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </Wrapper>
  );
}
