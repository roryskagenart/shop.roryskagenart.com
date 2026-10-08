import Link from 'next/link';

import LogoSquare from 'components/logo-square';
import { SocialLinks } from 'components/layout/social-links';
import { BRAND_CONFIG } from 'lib/brand-config';
import { FooterCurrencySelector } from './footer-currency';

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightDate = 1985 + (currentYear > 1985 ? `-${currentYear}` : '');

  return (
    <footer className="border-t border-brand-border text-sm text-brand-fg-muted">
      <div className="page-shell flex flex-col gap-6 py-10 sm:py-12 md:flex-row md:items-center md:gap-12">
        <div>
          <Link className="group flex items-center gap-3" href="/">
            <LogoSquare size="sm" />
            <div className="flex flex-col">
              {/*
                Hover is an ink underline, NOT `text-brand-accent` — the accent (#22d3ee) against
                this footer's canvas (#c2c9d1) is ~1.1:1, so the wordmark used to fade to nearly
                invisible on hover. Same fix as the header wordmark.
              */}
              <span className="text-xs font-bold uppercase leading-tight tracking-[0.16em] text-brand-fg transition-colors group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                {BRAND_CONFIG.name}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-fg-muted">
                {BRAND_CONFIG.tagline}
              </span>
            </div>
          </Link>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 md:ml-auto md:w-auto">
          <SocialLinks />
          {/*
            Same-tab on purpose: the studio site is the other half of this brand, not an external
            resource, so it should not throw the visitor into a new tab.

            Deliberately NOT button-shaped (owner, 2026-10-08). It used to carry a border, a card
            background and padding, which made a plain link read as a control — and put it in visual
            competition with the currency picker next to it. Only one of those two is a real
            control; the other is navigation. It now uses the footer's own link treatment.
          */}
          <a
            className="text-xs transition-colors hover:text-brand-fg"
            href={BRAND_CONFIG.domains.portfolio}
          >
            roryskagenart.com
          </a>
          {/*
            Flush right. Below `md` the cluster wraps and takes the full width, so `ml-auto` pushes
            the picker to the right edge; from `md` up the cluster is already hard against the right
            edge (`md:ml-auto` on the row above), so `md:ml-0` leaves it alone.
          */}
          <FooterCurrencySelector className="ml-auto md:ml-0" />
        </div>
      </div>
      <div className="border-t border-brand-border">
        <div className="page-shell flex flex-col items-center gap-4 py-6 md:flex-row md:gap-0">
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link href="/pages/privacy-policy" className="transition-colors hover:text-brand-fg">
              Privacy Policy
            </Link>
            <Link href="/pages/terms-of-service" className="transition-colors hover:text-brand-fg">
              Terms of Service
            </Link>
            <Link href="/pages/returns-faq" className="transition-colors hover:text-brand-fg">
              Returns & FAQ
            </Link>
            <Link href="/pages/contact" className="transition-colors hover:text-brand-fg">
              Contact
            </Link>
            <Link href="/docs" className="transition-colors hover:text-brand-fg">
              Help
            </Link>
          </div>
          <hr className="mx-4 hidden h-4 w-[1px] border-l border-brand-border md:inline-block" />
          {/*
            Build and tooling surfaces. These three used to sit inline with the customer links
            above, in the same visual group — which made "Admin" read as a peer of "Returns & FAQ".
            They now occupy the secondary slot at the end of the row, where the "Rory Skagen Studio
            Archive" link used to be. That link was removed (owner, 2026-10-08): it pointed at the
            shop's own custom domain, so it was a link from the site to itself.

            ⚠️ Dev Docs is no longer accent-coloured. `--brand-accent` (#22d3ee) against this
            footer's canvas (#c2c9d1) measures ~1.1:1 — the same hue-on-light-band failure as the
            header submenu. Position, not colour, is what separates this group now.
          */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:ml-auto md:gap-6">
            <Link href="/docs/dev" className="transition-colors hover:text-brand-fg">
              Dev Docs
            </Link>
            <Link href="/playground" className="transition-colors hover:text-brand-fg">
              Tools
            </Link>
            {/*
              ⚠️ DELIBERATE REVERSAL of the decision this block used to record (owner-approved
              2026-10-08). The previous note read: "No link to /import here. The footer is a public
              surface, and /import is behind the Basic-auth gate in middleware.ts — a public link
              would hand visitors a browser password prompt."

              The owner asked for the entry point anyway. The gate is still the protection, and the
              trade accepted is that an anonymous visitor who clicks Admin meets a browser password
              prompt. `components/__tests__/public-surfaces.test.ts` guards the old invariant and now
              carries an explicit allow-list entry for this one href. If that test fails, the guard is
              working — the failure is the signal, not a regression to silence.
            */}
            <Link href="/import" className="transition-colors hover:text-brand-fg">
              Admin
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-brand-border">
        <div className="page-shell flex flex-col items-center gap-1 py-6 md:flex-row md:gap-0">
          <p>
            &copy; {copyrightDate} {BRAND_CONFIG.legalName}. All rights reserved.
          </p>
          <hr className="mx-4 hidden h-4 w-[1px] border-l border-brand-border md:inline-block" />
          <p>
            <a href="https://github.com/FourthwallHQ/vercel-commerce" className="transition-colors hover:text-brand-fg">
              View the source
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
