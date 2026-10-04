'use client';

import { usePathname } from 'next/navigation';

import { CURRENCIES, CurrencySelector } from './navbar/currency';

const KNOWN = new Set<string>(CURRENCIES);

/**
 * Footer-hosted instance of the currency selector. It reads the active currency from
 * the URL rather than from a prop, so `footer.tsx` can stay a server component — it is
 * rendered by four routes that already thread `currency` through `<Wrapper>`, and a
 * prop would have meant widening all four for a single control.
 */
export function FooterCurrencySelector() {
  const pathname = usePathname();
  const segment = pathname?.split('/')[1] ?? '';
  const currency = KNOWN.has(segment) ? segment : 'USD';

  return <CurrencySelector currency={currency} />;
}