import CartModal from 'components/cart/modal';
import LogoSquare from 'components/logo-square';
import { BRAND_CONFIG } from 'lib/brand-config';
import { getCollections } from 'lib/fourthwall';
import { getCollectionNavLabel } from 'lib/taxonomy';
import Link from 'next/link';

/**
 * Merchandise header.
 *
 * Row 1 — brand on the left; the one non-collection link (back to the studio site,
 * roryskagenart.com) plus the cart, right-justified.
 * Row 2 — the collection menu, read from `getCollections()` so it stays synced with the
 * storefront (curated taxonomy + any stocked Fourthwall collections). It scrolls
 * horizontally on narrow screens, so the same markup works at every width with no JS.
 *
 * Labels prefer the taxonomy `shortTitle` when one exists — the full collection titles
 * ("Fine Art Originals ($4,000 – $28,000)") are hero copy, not nav labels. Collections
 * Fourthwall owns that are not in the taxonomy keep their own name.
 */
export async function Navbar({ currency }: { currency: string }) {
  const collections = await getCollections();

  return (
    <nav className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur-md transition-colors dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto max-w-screen-2xl px-4 lg:px-6">
        {/* Row 1 — brand + right-justified actions */}
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href={`/${currency}`}
            prefetch={true}
            className="group flex flex-none items-center gap-2.5 text-left"
          >
            <LogoSquare />
            <div className="flex flex-col justify-center">
              <span className="text-sm font-black uppercase leading-tight tracking-[0.18em] text-black transition-colors group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
                {BRAND_CONFIG.name}
              </span>
              <span className="hidden font-mono text-[9px] uppercase tracking-[0.22em] text-neutral-500 sm:inline-block">
                {BRAND_CONFIG.tagline}
              </span>
            </div>
          </Link>

          <div className="flex flex-none items-center justify-end gap-3">
            {/* Static, non-collection link back to the studio website. */}
            <a
              href={BRAND_CONFIG.domains.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 sm:inline-flex"
            >
              <span>roryskagenart.com</span>
              <span className="text-[10px] text-neutral-400">↗</span>
            </a>
            {/* Docs moved to the footer. The internal /docs/dev link was removed from the
                customer-facing navigation entirely — it is a build tool, not a shopper surface,
                and stays reachable at /docs/dev by URL. */}
            <CartModal />
          </div>
        </div>

        {/* Row 2 — collection menu, synced from the storefront */}
        {collections.length ? (
          <div className="-mx-4 overflow-x-auto border-t border-neutral-200/70 lg:-mx-6 dark:border-neutral-800/70">
            <ul className="flex items-center gap-6 px-4 py-2.5 lg:px-6">
              {collections.map((item) => (
                <li key={item.handle} className="flex-none">
                  <Link
                    href={`/${currency}/collections/${item.handle}`}
                    prefetch={true}
                    className="whitespace-nowrap text-xs font-medium text-neutral-600 underline-offset-4 transition-colors hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-white"
                  >
                    {getCollectionNavLabel(item.handle, item.title)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
