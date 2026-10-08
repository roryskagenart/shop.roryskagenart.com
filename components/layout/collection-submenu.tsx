'use client';

import clsx from 'clsx';
import { getCollectionNavLabel } from 'lib/taxonomy';
import { Collection } from 'lib/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * The header's second row — the collection submenu.
 *
 * A client component only because the active category needs `usePathname`; the navbar above it
 * stays a server component. Same pattern as `components/layout/collections.tsx`.
 *
 * Layout: categories run from the left and **View All closes the row flush right** (`ml-auto` on
 * the last item), so it reads as an action rather than one more category. Below `sm` the row
 * scrolls instead — the parent owns the `overflow-x-auto`.
 *
 * ⚠️ The active state is an **accent underline, not accent text**. `--brand-accent` is #22d3ee;
 * against this row's `surface-accent-soft` band (~#c4e9f1) it measures ~1.4:1 — invisible. A
 * darkened accent still only reaches ~2.5:1, which fails WCAG AA (4.5:1) at 12px. So the accent
 * carries the 2px indicator and the label stays `text-brand-fg`. The border is always present and
 * transparent when inactive, so switching categories does not shift the row.
 */
export function CollectionSubmenu({
  collections,
  currency
}: {
  collections: Collection[];
  currency: string;
}) {
  const pathname = usePathname();

  return (
    <ul className="flex w-full items-center gap-x-5 py-3 sm:gap-x-8">
      {collections.map((item) => {
        const href = `/${currency}/collections/${item.handle}`;
        const active = pathname === href || pathname.endsWith(`/collections/${item.handle}`);
        const label = getCollectionNavLabel(item.handle, item.title);

        // `all` is the synthetic "everything" collection, appended last by `getCollections()`.
        if (item.handle === 'all') {
          return (
            <li key={item.handle} className="ml-auto flex-none">
              <Link
                href={href}
                prefetch={true}
                className={clsx(
                  'flex items-center whitespace-nowrap rounded-full border px-3.5 py-1 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors',
                  active
                    ? 'border-brand-accent bg-brand-accent text-brand-accent-fg'
                    : 'border-brand-accent text-brand-fg hover:bg-brand-accent hover:text-brand-accent-fg'
                )}
              >
                {label}
              </Link>
            </li>
          );
        }

        return (
          <li key={item.handle} className="flex-none">
            <Link
              href={href}
              prefetch={true}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'flex items-center whitespace-nowrap border-b-2 pb-0.5 font-mono text-[12px] uppercase tracking-[0.14em] transition-colors',
                active
                  ? 'border-brand-accent font-bold text-brand-fg'
                  : 'border-transparent font-medium text-brand-fg-muted hover:border-brand-line-strong hover:text-brand-fg'
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
