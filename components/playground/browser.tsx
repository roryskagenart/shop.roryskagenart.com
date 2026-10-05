'use client';

import { useDeferredValue, useMemo, useState } from 'react';

import {
  activeFilterCount,
  applyFilters,
  CAPABILITY_LABEL,
  categoryGroup,
  EMPTY_FILTERS,
  formatPrice,
  formatRegionSummary,
  PRICE_BANDS,
  SORT_LABELS,
  templateCapability,
  toggleFacetValue
} from 'lib/playground';
import type { Catalog, CatalogFacetValue, FilterState, SortKey } from 'lib/playground';

import { Badge, capabilityToneClass } from './badge';
import { TemplateDetail } from './detail';

/** Rows rendered before the "show more" control appears. Keeps 605 entries off the critical path. */
const PAGE_SIZE = 50;

export function PlaygroundBrowser({ catalog }: { catalog: Catalog }) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  // The text input stays responsive while the (synchronous) filter pass runs against 605 entries
  // on a deferred value. No debounce timer, no fetch — the work is local either way.
  const deferredQuery = useDeferredValue(filters.query);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const effective = useMemo<FilterState>(
    () => ({ ...filters, query: deferredQuery }),
    [filters, deferredQuery]
  );

  const results = useMemo(
    () => applyFilters(catalog.templates, effective),
    [catalog.templates, effective]
  );
  const shown = useMemo(() => results.slice(0, visible), [results, visible]);
  const selected = useMemo(
    () => catalog.templates.find((t) => t.productId === selectedId) ?? null,
    [catalog.templates, selectedId]
  );
  const activeCount = activeFilterCount(filters);

  function update(patch: Partial<FilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setVisible(PAGE_SIZE);
  }

  function clearAll() {
    setFilters((prev) => ({ ...EMPTY_FILTERS, sort: prev.sort }));
    setVisible(PAGE_SIZE);
  }

  return (
    <div className="@container">
      {/* The transparency constraint, stated before the filters rather than buried in a tooltip:
          it is the fact that decides 560 of the 605 templates. */}
      <TransparencyNotice
        totals={catalog.totals}
        nonTransparencyOnly={filters.nonTransparencyOnly}
      />

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="lg:w-72 lg:flex-none">
          <div className="lg:sticky lg:top-20">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Search
              </span>
              <input
                type="search"
                value={filters.query}
                onChange={(e) => update({ query: e.target.value })}
                placeholder="name, brand, method, pro_…"
                className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:border-emerald-600 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
              />
            </label>

            <fieldset className="mt-5">
              <legend className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Source compatibility
              </legend>
              <div className="mt-2 space-y-2">
                <Check
                  checked={filters.nonTransparencyOnly}
                  onChange={(v) => update({ nonTransparencyOnly: v })}
                  label="JPEG source can use this"
                  hint={`${catalog.totals.nonTransparency} templates — no cutout transparency required`}
                />
                <Check
                  checked={filters.buildableOnly}
                  onChange={(v) => update({ buildableOnly: v })}
                  label="Backend-renderable only"
                  hint={`${catalog.totals.buildable} templates the design pipeline can place artwork on`}
                />
              </div>
            </fieldset>

            <FacetGroup
              title="Category"
              values={catalog.facets.categories}
              selected={filters.categories}
              onToggle={(v) => update({ categories: toggleFacetValue(filters.categories, v) })}
              groupBy={categoryGroup}
            />
            <FacetGroup
              title="Brand"
              values={catalog.facets.brands}
              selected={filters.brands}
              onToggle={(v) => update({ brands: toggleFacetValue(filters.brands, v) })}
            />
            <FacetGroup
              title="Production method"
              values={catalog.facets.methods}
              selected={filters.methods}
              onToggle={(v) => update({ methods: toggleFacetValue(filters.methods, v) })}
            />

            <fieldset className="mt-5">
              <legend className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Base price
              </legend>
              <select
                value={filters.priceBand}
                onChange={(e) => update({ priceBand: e.target.value as FilterState['priceBand'] })}
                className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
              >
                {PRICE_BANDS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Sort
              </legend>
              <select
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value as SortKey })}
                className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <option key={k} value={k}>
                    {SORT_LABELS[k]}
                  </option>
                ))}
              </select>
            </fieldset>

            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="mt-5 text-xs text-emerald-600 underline underline-offset-4 hover:text-emerald-500 dark:text-emerald-400"
              >
                Clear {activeCount} filter{activeCount === 1 ? '' : 's'}
              </button>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <span className="font-mono font-semibold text-black dark:text-white">
              {results.length}
            </span>{' '}
            of {catalog.totals.templates} templates
            {deferredQuery !== filters.query && (
              <span className="ml-2 text-xs text-neutral-400">filtering…</span>
            )}
          </p>

          {results.length === 0 ? (
            <p className="mt-6 rounded-md border border-neutral-200 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
              No template matches these filters. Note that a price band excludes the{' '}
              {catalog.totals.withoutPrice} template
              {catalog.totals.withoutPrice === 1 ? '' : 's'} that publish no base price at all.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-200 border-t border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {shown.map((t) => {
                const capability = templateCapability(t);
                const measured = t.regions.filter((r) => r.measured);
                return (
                  <li key={t.productId}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.productId)}
                      aria-expanded={selectedId === t.productId}
                      className="w-full py-3 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <span className="text-sm font-semibold text-black dark:text-white">
                          {t.name}
                        </span>
                        <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                          {formatPrice(t.priceFrom, t.currency ?? 'USD')}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500">
                        <span>{t.brand ?? 'Brand not published'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{t.category ?? 'Uncategorised'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{t.productionMethod ?? 'method not published'}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {measured.length} of {t.regions.length} regions measured
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge tone={capabilityToneClass(capability)}>
                          {CAPABILITY_LABEL[capability]}
                        </Badge>
                        {measured[0] && (
                          <span className="font-mono text-[11px] text-neutral-400">
                            largest{' '}
                            {formatRegionSummary(
                              measured.reduce((a, b) =>
                                a.width * a.height >= b.width * b.height ? a : b
                              )
                            )}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-neutral-400">
                          {t.productId}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {visible < results.length && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="mt-4 w-full rounded-md border border-neutral-200 py-2 text-sm transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
            >
              Show {Math.min(PAGE_SIZE, results.length - visible)} more ({results.length - visible}{' '}
              remaining)
            </button>
          )}
        </div>
      </div>

      {selected && <TemplateDetail template={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function Check({
  checked,
  onChange,
  label,
  hint
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-600 dark:border-neutral-700 dark:bg-neutral-950"
      />
      <span>
        <span className="block text-sm text-black dark:text-white">{label}</span>
        <span className="block text-[11px] text-neutral-500">{hint}</span>
      </span>
    </label>
  );
}

function FacetGroup({
  title,
  values,
  selected,
  onToggle,
  groupBy
}: {
  title: string;
  values: CatalogFacetValue[];
  selected: string[];
  onToggle: (value: string) => void;
  /** Optional second-level grouping — categories nest under `Apparel`, `Drinkware`, etc. */
  groupBy?: (value: string) => string;
}) {
  // Collapsed by default: 44 brands and 48 categories is a wall of checkboxes that buries the
  // two flags that actually decide what is buildable.
  const [open, setOpen] = useState(false);
  const grouped = new Map<string, CatalogFacetValue[]>();
  for (const v of values) {
    const key = groupBy ? groupBy(v.label) : '';
    const list = grouped.get(key) ?? [];
    list.push(v);
    grouped.set(key, list);
  }

  return (
    <fieldset className="mt-5">
      <legend className="flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        {title}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-[10px] normal-case"
        >
          {open ? 'hide' : `show (${values.length})`}
        </button>
      </legend>
      {open && (
        <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
          {[...grouped.entries()].map(([group, items]) => (
            <div key={group || '__flat'}>
              {group && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-neutral-400 first:mt-0">
                  {group}
                </p>
              )}
              {items.map((v) => (
                <label key={v.value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(v.value)}
                    onChange={() => onToggle(v.value)}
                    className="h-3.5 w-3.5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-600 dark:border-neutral-700 dark:bg-neutral-950"
                  />
                  <span className="flex-1 truncate text-xs text-black dark:text-white">
                    {v.label}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-400">{v.count}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
    </fieldset>
  );
}

function TransparencyNotice({
  totals,
  nonTransparencyOnly
}: {
  totals: Catalog['totals'];
  nonTransparencyOnly: boolean;
}) {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      <p className="font-semibold">
        {totals.nonTransparency} of {totals.templates} templates accept a JPEG source. The other{' '}
        {totals.templates - totals.nonTransparency} need a transparent PNG.
      </p>
      <p className="mt-2 leading-relaxed">
        {totals.buildableNeedingCutout} of the {totals.buildable} backend-renderable templates
        demand a cutout background. Transparency cannot be manufactured from JPEG: background
        removal on a full-bleed painting yields no usable alpha, and colour keying fails because the
        corners are mid-tone rather than a flat background (T36). Those templates need a transparent
        PNG master before they can be built.
      </p>
      {totals.withNoMeasuredRegion > 0 && (
        <p className="mt-2 leading-relaxed">
          {totals.withNoMeasuredRegion} templates publish no measured print area at all, and{' '}
          {totals.withUnmeasuredRegions} have at least one area without dimensions. Those are data
          gaps in the catalogue, shown as such rather than hidden.
        </p>
      )}
      {!nonTransparencyOnly && (
        <p className="mt-2 text-[11px] text-amber-800 dark:text-amber-300/80">
          Tick &ldquo;JPEG source can use this&rdquo; in the sidebar to see only the{' '}
          {totals.nonTransparency} that do not need a cutout.
        </p>
      )}
    </div>
  );
}
