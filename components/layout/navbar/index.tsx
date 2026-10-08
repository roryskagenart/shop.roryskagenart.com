import CartModal from 'components/cart/modal';
import { CollectionSubmenu } from 'components/layout/collection-submenu';
import { SocialLinks } from 'components/layout/social-links';
import LogoSquare from 'components/logo-square';
import { BRAND_CONFIG } from 'lib/brand-config';
import { getCollections } from 'lib/fourthwall';
import Link from 'next/link';

/**
 * Storefront header — a structural approximation of `roryskagenart.com`'s header, so a visitor
 * moving between the two reads them as one site.
 *
 * Row 1 — brand left; the main menu (Shop / About / Contact / Studio), the socials and the cart
 * right. Row 2 — the collection submenu, centred.
 *
 * What was matched from the studio site (measured 2026-10-07 on its rendered DOM):
 *   - a 74px first row;
 *   - a **2px** bottom border (the shop used a 1px hairline);
 *   - brand lockup left: logo, letterspaced uppercase wordmark, tiny mono tagline;
 *   - nav labels in **mono**, uppercase, letterspaced — the studio's nav is monospace;
 *   - a right-side action cluster.
 *
 * The studio's own menu reads *Catalog · About · Contact · SHOP*, with the commerce item set apart.
 * This header mirrors that order and keeps the same emphasis, but inverts the direction: **Shop** is
 * this site's home, so it leads the row and carries the accent, while **Studio** — the counterpart
 * link back to `roryskagenart.com` — sits last as a plain sibling.
 *
 * About and Contact point at the studio's `#about` / `#contact` hash routes (see
 * `BRAND_CONFIG.domains` for why the hash matters and why those are not `/about`-style paths).
 *
 * Every link here is same-tab on purpose — the shop and the studio are one destination to a visitor.
 *
 * ⚠️ The accent band is `.surface-accent-soft`, not `bg-brand-accent/20`. Tailwind emits **no CSS**
 * for an opacity modifier on a bare `var()` token, so the `/20` form would fail silently — which is
 * exactly what happened to the two classes this file used to carry. See `app/globals.css`, and
 * `docs/agentic/traps/register.md#t49`.
 */
export async function Navbar({ currency }: { currency: string }) {
  const collections = await getCollections();

  const mainNav = [
    { label: 'Shop', href: `/${currency}`, isHome: true },
    { label: 'About', href: BRAND_CONFIG.domains.portfolioAbout, isHome: false },
    { label: 'Contact', href: BRAND_CONFIG.domains.portfolioContact, isHome: false },
    { label: 'Studio', href: BRAND_CONFIG.domains.portfolio, isHome: false }
  ];

  return (
    <nav
      aria-label="Main"
      className="surface-accent-soft sticky top-0 z-30 border-b-2 border-brand-accent shadow-sm transition-colors"
    >
      <div className="page-shell">
        {/* Row 1 — brand left; menu, socials and cart right. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 sm:h-[74px] sm:flex-nowrap sm:gap-x-4 sm:py-0">
          <Link
            href={`/${currency}`}
            prefetch={true}
            className="group flex flex-none items-center gap-2.5 text-left"
          >
            <LogoSquare />
            <div className="flex flex-col justify-center">
              {/*
                Hover is an ink underline, NOT `text-brand-accent`. The accent (#22d3ee) against this
                header's `.surface-accent-soft` band (#c4e9f1) measures ~1.4:1, so the wordmark faded
                to nearly invisible when you pointed at it. The decoration defaults to
                `currentColor`, which is `brand-fg` — ~13:1 on this band.
              */}
              <span className="text-[13px] font-black uppercase leading-tight tracking-[0.18em] text-brand-fg transition-colors group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4 sm:text-sm">
                {BRAND_CONFIG.name}
              </span>
              <span className="hidden font-mono text-[9px] uppercase tracking-[0.22em] text-brand-fg-muted sm:block">
                {BRAND_CONFIG.tagline}
              </span>
            </div>
          </Link>

          {/*
            Below `sm` the menu takes its own full-width row (`order-3` + `w-full`), because the brand
            lockup plus four labels cannot share a 390px line: the row used to scroll, which clipped
            ABOUT to a mid-word "AB". Full width fits all four with no scrolling. From `sm` up it
            returns to DOM order and is pushed right by `ml-auto`, so the cart stays last.
          */}
          <ul className="no-scrollbar order-3 flex w-full items-center gap-x-1 overflow-x-auto sm:order-none sm:ml-auto sm:w-auto sm:justify-end sm:gap-x-2">
            {mainNav.map((item) => (
              <li key={item.label} className="flex-none">
                {item.isHome ? (
                  /* Shop is this site's home — carried in the accent so the commerce entry point is
                     unmistakable, and it is the only filled control in the header. */
                  <Link
                    href={item.href}
                    prefetch={true}
                    aria-current="page"
                    className="flex items-center rounded-full bg-brand-accent px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-accent-fg transition hover:opacity-90"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className="nav-link flex items-center whitespace-nowrap px-2 py-1.5"
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>

          <div className="ml-auto flex flex-none items-center gap-1.5 sm:ml-0 sm:gap-3">
            <SocialLinks className="hidden lg:flex" />
            {/* Docs moved to the footer. The internal /docs/dev link was removed from the
                customer-facing navigation entirely — it is a build tool, not a shopper surface,
                and stays reachable at /docs/dev by URL. */}
            <CartModal />
          </div>
        </div>

        {/* Row 2 — the collection submenu. Categories run from the left; **View All** closes the
            row flush right, so it reads as an action rather than one more category. The studio
            link used to live at the end of this row; it is now a sibling in the main menu above,
            so this row is purely commerce. See `CollectionSubmenu` for the active-state styling
            and why the accent is an underline rather than text colour. */}
        {collections.length ? (
          <div className="no-scrollbar overflow-x-auto border-t border-brand-border">
            <CollectionSubmenu collections={collections} currency={currency} />
          </div>
        ) : null}
      </div>
    </nav>
  );
}
