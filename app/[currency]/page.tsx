import type { Metadata } from 'next';
import { CollectionSections } from 'components/grid/collection-sections';
import Footer from 'components/layout/footer';
import { Wrapper } from 'components/wrapper';
import { BRAND_CONFIG } from 'lib/brand-config';
import { getShop, getShopOgImage } from 'lib/fourthwall';
import Link from 'next/link';

export function generateStaticParams() {
  return [{ currency: 'USD' }, { currency: 'EUR' }, { currency: 'GBP' }, { currency: 'CAD' }, { currency: 'AUD' }];
}

export async function generateMetadata(): Promise<Metadata> {
  const [ogImageUrl, shop] = await Promise.all([
    getShopOgImage(),
    getShop()
  ]);

  return {
    title: `${shop.name} | Fine Art Originals & Austin Pop Culture`,
    description: '1-of-1 Original Enamel-on-Steel Masterworks ($4,000–$28,000), B2B Corporate Gifting, Metal Lithos & Archival Editions by Austin Legend Rory Skagen.',
    openGraph: {
      type: 'website',
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined
    },
    twitter: {
      card: 'summary_large_image',
      images: ogImageUrl ? [ogImageUrl] : undefined
    }
  };
}

export default async function HomePage({ params }: { params: Promise<{ currency: string }> }) {
  const currency = (await params).currency;
  const shop = await getShop();

  return (
    <Wrapper currency={currency} shop={shop}>
      {/* Hero */}
      <section className="border-b border-brand-border bg-brand-surface">
        <div className="page-shell py-12 sm:py-16 lg:py-24">
          <p className="eyebrow">{BRAND_CONFIG.tagline}</p>
          <h1 className="heading-display mt-3 max-w-3xl">
            Original Art &amp; Studio Editions by Rory Skagen
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-brand-fg-muted sm:text-base">
            Museum-quality archival prints, gallery canvas, and studio merchandise, shipped worldwide
            from Austin, Texas.
          </p>
          <div className="mt-8 sm:mt-10">
            <Link
              href={`/${currency}/collections/all`}
              prefetch={true}
              className="inline-block rounded-md bg-brand-fg px-5 py-3 text-xs font-bold uppercase tracking-wider text-brand-bg transition hover:opacity-90"
            >
              Shop All Art
            </Link>
          </div>
        </div>
      </section>

      {/* Every stocked collection, one group each — driven by the same source as the header menu. */}
      <CollectionSections currency={currency} />

      <Footer />
    </Wrapper>
  );
}
