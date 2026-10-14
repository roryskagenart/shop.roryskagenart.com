import Grid from 'components/grid';
import { GridTileImage } from 'components/grid/tile';
import { listingPrice } from 'lib/product-price';
import { Product } from 'lib/types';
import Link from 'next/link';

export default function ProductGridItems({ products, currency }: { products: Product[]; currency: string }) {
  return (
    <>
      {products.map((product) => (
        <Grid.Item key={product.handle} className="animate-fadeIn">
          <Link
            className="relative inline-block h-full w-full"
            href={`/${currency}/product/${product.handle}`}
            prefetch={true}
          >
            <GridTileImage
              alt={product.title}
              label={{
                title: product.title,
                ...listingPrice(product)
              }}
              src={product.featuredImage?.url}
              transformedSrc={product.featuredImage?.transformedUrl}
              fill
              sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          </Link>
        </Grid.Item>
      ))}
    </>
  );
}
