import CartModal from 'components/cart/modal';
import { SocialLinks } from 'components/layout/social-links';
import LogoSquare from 'components/logo-square';
import { BRAND_CONFIG } from 'lib/brand-config';
import { getCollections } from 'lib/fourthwall';
import { getCollectionNavLabel } from 'lib/taxonomy';
import Link from 'next/link';

/**
 * Storefront header — a structural approximation of `roryskagenart.com`'s header, so a visitor
 * moving between the two reads them as one site.
 *
 * What was matched from the studio site (measured 2026-10-07 on its rendered DOM):
 *   - a 74px first row;
 *   - sticky, `bg-card/95` + `backdrop-blur-md`, with a **2px** bottom border in the strong line
 *     token (`border-b-2 border-line-strong`) — the shop used a 1px hairline;
 *   - brand lockup left: logo, letterspaced uppercase wordmark, tiny mono tagline;
 *   - nav labels in **mono**, uppercase, letterspaced — the studio's nav is monospace;
 *   - a right-side action cluster (the studio has an icon button; here: socials + cart).
 *
 * What deliberately differs: the studio is a single-page site, so its nav items are in-page anchors
 * (Catalog / About / Contact) and it has no submenu. The shop's nav is commerce, so the collection
 * menu is a **second, centred row** and the studio link sits at the end of it as a plain sibling of
 * the collection links rather than a bordered button.
 *
 * Every link here is same-tab on purpose — the shop and the studio are one destination to a visitor.
 */
export async function Navbar({ currency }: { currency: string }) {
  const collections = await getCollections();

  return (
    <nav className="sticky top-0 z-30 border-b-2 border-brand-line-strong bg-brand-bg-card/95 shadow-sm backdrop-blur-md transition-colors">
      <div className="page-shell">
        {/* Row 1 — brand left, actions right. */}
        <div className="flex h-[74px] items-center justify-between gap-4">
          <Link
            href={`/${currency}`}
            prefetch={true}
            className="group flex flex-none items-center gap-2.5 text-left"
          >
            <LogoSquare />
            <div className="flex flex-col justify-center">
              <span className="text-[13px] font-black uppercase leading-tight tracking-[0.18em] text-brand-fg transition-colors group-hover:text-brand-accent sm:text-sm">
                {BRAND_CONFIG.name}
              </span>
              <span className="hidden font-mono text-[9px] uppercase tracking-[0.22em] text-brand-fg-muted sm:block">
                {BRAND_CONFIG.tagline}
              </span>
            </div>
          </Link>

          <div className="flex flex-none items-center gap-2 sm:gap-3">
            <SocialLinks className="hidden sm:flex" />
            {/* Docs moved to the footer. The internal /docs/dev link was removed from the
                customer-facing navigation entirely — it is a build tool, not a shopper surface,
                and stays reachable at /docs/dev by URL. */}
            <CartModal />
          </div>
        </div>

        {/* Row 2 — the collection submenu, centred, with the studio link as its last sibling.
            `w-max` + `mx-auto` centres the row when it fits and keeps the first item reachable
            when it does not (plain `justify-center` would clip the start of a scrolling row). */}
        {collections.length ? (
          <div className="no-scrollbar overflow-x-auto border-t border-brand-border/60">
            <ul className="mx-auto flex w-max items-center gap-x-6 py-3 sm:gap-x-8">
              {collections.map((item) => (
                <li key={item.handle} className="flex-none">
                  <Link
                    href={`/${currency}/collections/${item.handle}`}
                    prefetch={true}
                    className="nav-link whitespace-nowrap"
                  >
                    {getCollectionNavLabel(item.handle, item.title)}
                  </Link>
                </li>
              ))}
              <li aria-hidden="true" className="h-4 w-px flex-none bg-brand-border" />
              <li className="flex-none">
                <Link href={BRAND_CONFIG.domains.portfolio} className="nav-link whitespace-nowrap">
                  Studio
                </Link>
              </li>
            </ul>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
