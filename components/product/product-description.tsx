import { AddToCart } from 'components/cart/add-to-cart';
import Price from 'components/price';
import Prose from 'components/prose';
import { listingPrice } from 'lib/product-price';
import { Product } from 'lib/types';
import { VariantSelector } from './variant-selector';

export function ProductDescription({ product }: { product: Product }) {
  const price = listingPrice(product);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex flex-col gap-3 border-b border-brand-border pb-6">
        {/*
          `text-5xl font-medium` was a fixed 48px with no responsive step, so the product title was
          larger on a 390px phone than the page's own hero. Now it scales.
        */}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{product.title}</h1>
        <div className="mr-auto w-auto rounded-full bg-brand-accent px-3.5 py-1.5 text-sm text-brand-accent-fg">
          <Price
            amount={price.amount}
            currencyCode={price.currencyCode}
            prefix={price.from ? 'From' : undefined}
          />
        </div>
      </div>
      <VariantSelector options={product.options} variants={product.variants} />
      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-relaxed text-brand-fg-muted"
          html={product.descriptionHtml}
        />
      ) : null}
      <AddToCart product={product} />
    </div>
  );
}
