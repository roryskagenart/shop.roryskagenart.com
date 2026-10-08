import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Footer from 'components/layout/footer';
import { Gallery } from 'components/product/gallery';
import { ProductProvider } from 'components/product/product-context';
import { ProductDescription } from 'components/product/product-description';
import { ProductViewTracker } from 'components/product/product-view-tracker';
import { Wrapper } from 'components/wrapper';
import { HIDDEN_PRODUCT_TAG } from 'lib/constants';
import { getProduct, getShop, getShopOgImage } from 'lib/fourthwall';
import { Suspense } from 'react';

export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ currency: string; handle: string }>;
}): Promise<Metadata> {
  const { currency, handle } = await params;
  const [product, shopOgImage, shop] = await Promise.all([
    getProduct({ handle, currency }),
    getShopOgImage(),
    getShop()
  ]);

  if (!product) return notFound();

  const { url, width, height, altText: alt } = product.featuredImage || {};
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);

  // Priority: product featured image, then shop OG image
  const ogImageUrl = url || shopOgImage;

  return {
    title: `${product.title} | ${shop.name}`,
    description: product.description,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable
      }
    },
    openGraph: ogImageUrl
      ? {
          images: [
            {
              url: ogImageUrl,
              ...(url ? { width, height, alt } : {})
            }
          ]
        }
      : undefined,
    twitter: {
      card: 'summary_large_image',
      images: ogImageUrl ? [ogImageUrl] : undefined
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ currency: string; handle: string }> }) {
  const { currency, handle } = await params;

  const [product, shop] = await Promise.all([
    getProduct({ handle, currency }),
    getShop()
  ]);

  if (!product) return notFound();

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.featuredImage.url,
    offers: {
      '@type': 'AggregateOffer',
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      highPrice: product.priceRange.maxVariantPrice.amount,
      lowPrice: product.priceRange.minVariantPrice.amount
    }
  };

  return (
    <Wrapper currency={currency} shop={shop}>
      <Suspense fallback={null}>
        <ProductProvider>
        <ProductViewTracker product={product} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productJsonLd)
          }}
        />
        {/*
          Spacing note. This block used to be `mx-auto max-w-screen-2xl px-4` with no vertical
          padding, so the card sat flush against the header and the page had no top or bottom
          rhythm. It now uses the shared shell + a real vertical scale.
        */}
        <div className="page-shell py-8 sm:py-10 lg:py-14">
          <div className="flex flex-col gap-8 rounded-lg border border-brand-border bg-brand-bg-card p-5 sm:p-8 lg:flex-row lg:gap-12 lg:p-10">
            <div className="w-full basis-full lg:basis-1/2">
              <Suspense
                fallback={
                  <div className="relative aspect-square h-full max-h-[600px] w-full overflow-hidden" />
                }
              >
                <Gallery
                  product={product}
                />
              </Suspense>
            </div>

            <div className="basis-full lg:basis-1/2">
              <Suspense fallback={null}>
                <ProductDescription product={product} />
              </Suspense>
            </div>
          </div>
        </div>
        <Footer />
        </ProductProvider>
      </Suspense>
    </Wrapper>
  );
}
