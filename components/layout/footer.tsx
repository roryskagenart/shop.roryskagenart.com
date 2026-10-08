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
              <span className="text-xs font-bold uppercase leading-tight tracking-[0.16em] text-brand-fg transition-colors group-hover:text-brand-accent">
                {BRAND_CONFIG.name}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-fg-muted">
                {BRAND_CONFIG.tagline}
              </span>
            </div>
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:ml-auto">
          <SocialLinks />
          {/*
            Same-tab on purpose: the studio site is the other half of this brand, not an external
            resource, so it should not throw the visitor into a new tab.
          */}
          <a
            className="flex h-8 items-center gap-2 rounded-md border border-brand-border bg-brand-bg-card px-3 text-xs font-medium text-brand-fg transition hover:bg-brand-surface"
            href={BRAND_CONFIG.domains.portfolio}
          >
            <span>roryskagenart.com</span>
          </a>
          <FooterCurrencySelector />
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
              Public Docs
            </Link>
            <Link href="/docs/dev" className="text-brand-accent transition-colors hover:opacity-80">
              Dev/Build Docs
            </Link>
            {/*
              No link to /import here. The footer is a public surface, and /import is behind the
              Basic-auth gate in middleware.ts — a public link would hand visitors a browser
              password prompt. The importer is still reachable at /import by anyone who knows the
              URL and has the credentials.
            */}
          </div>
          <hr className="mx-4 hidden h-4 w-[1px] border-l border-brand-border md:inline-block" />
          <p className="md:ml-auto">
            <a href={BRAND_CONFIG.domains.shopCustomDomain} className="text-brand-fg">
              Rory Skagen Studio Archive
            </a>
          </p>
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
