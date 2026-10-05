import clsx from 'clsx';
import Link from 'next/link';

import type { TemplateCapability } from 'lib/playground';

/**
 * badge.tsx — the capability pill.
 *
 * Its own file because `browser.tsx` and `detail.tsx` both render it, and a shared component
 * imported from one of them makes the pair a cycle.
 *
 * The tone encodes the capability, and the capability is deliberately a statement about the
 * TEMPLATE, never a prediction about whether a given artwork will print on it. → T36
 */
export function capabilityToneClass(capability: TemplateCapability): string {
  switch (capability) {
    case 'jpeg-ready':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    case 'needs-png':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300';
    case 'not-renderable':
    default:
      return 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
  }
}

export function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-medium', tone)}>
      {children}
    </span>
  );
}

/**
 * A link back to the storefront. `/playground` is a build tool sitting outside the currency-scoped
 * routes, so a shopper who lands here needs a way out that does not depend on the navbar.
 */
export function BackToStoreLink() {
  return (
    <Link
      href="/USD"
      className="text-xs text-emerald-600 underline underline-offset-4 hover:text-emerald-500 dark:text-emerald-400"
    >
      ← Back to the store
    </Link>
  );
}
