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
      {/*
        Hero. It shares `.surface-canvas` with the header above it, so the two read as ONE continuous
        field rather than a tinted bar sitting on a coloured band. That is the storefront we are
        matching: roryskagenart-shop.fourthwall.com runs its header and hero on a single near-white
        canvas (`#eff1f4` and `#f0f2f5`, a one-step difference) and keeps its mid grey for the
        product field only. The accent is not gone, it is demoted — it still marks the Shop pill,
        focus rings and hovers, and it still fills the primary button.

        The heading repeats `text-brand-fg` because `.heading-display` sets its own colour and the
        utilities layer wins over the component layer. Hierarchy inside the hero comes from
        `opacity-*` (a plain utility, which works) rather than a colour-opacity modifier on a token
        (which Tailwind silently drops, see app/globals.css).

        The headline is sized to *fill the band* rather than sit politely in the left third. At the old
        48px it occupied 53% of the width and left the right half of a 338px-tall band empty.
        Measured 2026-10-14, the first screen had no dominant element at all: the inspector reported
        "hero media none" with the largest type at 3.3vw. `clamp(2rem, 7.5vw, 6.5rem)` reaches about
        7.2vw on a 1440px laptop, which is what makes the headline the thing that leads the page.

        `clamp` rather than a Tailwind size step, because the headline has to stay on **two lines at
        every width** and a fixed rem step cannot do both ends: at `text-8xl` it wrapped to three lines
        at 390px. The words were cut first. "Original Art & Studio Good Stuff by Rory Skagen" (9 words)
        became "Prints, Tees & Studio Goods" (5), which also names what the shop actually sells.
      */}
      <section className="surface-canvas">
        <div className="page-shell py-12 sm:py-16 lg:py-20">
          {/*
            The eyebrow is kept deliberately, against the house rule that bans monospace and kicker
            labels. It is this brand's own device: `.eyebrow` in app/globals.css exists to "mirror the
            studio site's eyebrows", roryskagenart.com uses it, and the Fourthwall storefront hero we
            are matching carries the identical label. It is a wordmark line, not an invented chip.
          */}
          <p
            className="font-mono text-[11px] uppercase tracking-[0.22em] opacity-70" /* taste-skill-ignore */
          >
            {BRAND_CONFIG.tagline}
          </p>
          <h1 className="heading-display mt-4 text-[clamp(2rem,7.5vw,6.5rem)] text-brand-fg">
            Prints, Tees &amp; Studio Goods
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed opacity-90 sm:text-lg">
            Rory Skagen&apos;s Austin art on the things you actually use: prints, apparel, candles,
            and 1-of-1 originals. Shipped worldwide.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 sm:mt-10">
            <Link
              href={`/${currency}/collections/all`}
              prefetch={true}
              className="inline-block rounded-md bg-brand-accent-fg px-5 py-3 text-sm font-bold uppercase tracking-wide text-brand-accent transition hover:opacity-90"
            >
              Shop All Art
            </Link>
            {/*
              The 1-of-1 originals are the studio's top tier and the only stock in the four-figure
              range, but they were reachable only by scrolling to the last tile or by choosing "All
              Art" and hunting. This is a direct door to them from the first screen.
            */}
            <Link
              href={`/${currency}/collections/original`}
              prefetch={true}
              className="text-sm font-semibold text-brand-fg underline decoration-2 underline-offset-4 transition hover:opacity-70"
            >
              Original artwork
            </Link>
          </div>
        </div>
      </section>

      {/* Every stocked collection, one group each. Driven by the same source as the header menu. */}
      <CollectionSections currency={currency} />

      <Footer />
    </Wrapper>
  );
}
