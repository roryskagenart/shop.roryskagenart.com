'use client';

import { useMemo, useState } from 'react';

import {
  CAPABILITY_LABEL,
  CAPABILITY_NOTE,
  evaluateUsability,
  formatPrice,
  presentRegion,
  summarizeVerdicts,
  templateCapability
} from 'lib/playground';
import type { PlaygroundTemplate, UsabilityVerdict } from 'lib/playground';

import { Badge, capabilityToneClass } from './badge';

/**
 * Template detail — identity, price, and every region with its measurements.
 *
 * ⚠️ THE OPTIONAL ARTWORK BOX RUNS THE TESTED FIT RULES; IT IS NOT A NEW RULE
 *
 * `evaluateUsability()` delegates to `evaluateTemplate()` in `lib/fw-catalog` — the 85%-retained
 * and 100%-coverage gate that is covered by `lib/fw-catalog/__tests__/fit.test.ts`. This component
 * only renders the verdicts. It does not decide usability, and with no artwork entered it does not
 * claim any: the capability badge reports what is known about the *template*, which is a different
 * and much weaker claim than "this artwork will print here".
 */
export function TemplateDetail({
  template,
  onClose
}: {
  template: PlaygroundTemplate;
  onClose: () => void;
}) {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [hasAlpha, setHasAlpha] = useState(false);

  const capability = templateCapability(template);
  const regions = useMemo(() => template.regions.map(presentRegion), [template.regions]);
  const measured = regions.filter((r) => r.usable);
  const unmeasured = regions.filter((r) => !r.usable);

  const artwork = useMemo(() => {
    const w = Number.parseInt(width, 10);
    const h = Number.parseInt(height, 10);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
    return { title: template.name, width: w, height: h, hasAlpha };
  }, [width, height, hasAlpha, template.name]);

  const verdicts: UsabilityVerdict[] | null = useMemo(
    () => (artwork ? evaluateUsability(template, artwork) : null),
    [template, artwork]
  );

  return (
    <div className="mt-10 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-black dark:text-white">
            {template.name}
          </h2>
          <p className="mt-1 font-mono text-[11px] text-neutral-500">{template.productId}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-neutral-200 px-3 py-1 text-xs transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          Close
        </button>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        <Field label="Brand" value={template.brand ?? 'Not published'} />
        <Field label="Category" value={template.category ?? 'Not published'} />
        <Field label="Production method" value={template.productionMethod ?? 'Not published'} />
        <Field
          label="Base price"
          value={formatPrice(template.priceFrom, template.currency ?? 'USD')}
        />
      </dl>

      {/* The template-level constraint, in words. Deliberately not a prediction about any artwork. */}
      <div className="mt-5 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
        <Badge tone={capabilityToneClass(capability)}>{CAPABILITY_LABEL[capability]}</Badge>
        <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          {CAPABILITY_NOTE[capability]}
        </p>
        <p className="mt-2 text-[11px] text-neutral-500">
          This badge describes the template only. Whether a given artwork fits a given region is a
          separate, per-region question — measure it below.
        </p>
      </div>

      {/* Optional artwork measurement. Omit it and nothing here claims a verdict. */}
      <div className="mt-5 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Check an artwork against this template
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <label className="text-xs">
            <span className="block text-neutral-500">Width px</span>
            <input
              type="number"
              min={1}
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="mt-1 w-28 rounded-md border border-neutral-200 bg-white px-2 py-1.5 font-mono text-sm dark:border-neutral-800 dark:bg-neutral-900"
            />
          </label>
          <label className="text-xs">
            <span className="block text-neutral-500">Height px</span>
            <input
              type="number"
              min={1}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="mt-1 w-28 rounded-md border border-neutral-200 bg-white px-2 py-1.5 font-mono text-sm dark:border-neutral-800 dark:bg-neutral-900"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 pb-2 text-xs">
            <input
              type="checkbox"
              checked={hasAlpha}
              onChange={(e) => setHasAlpha(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-600 dark:border-neutral-700 dark:bg-neutral-900"
            />
            <span>Source is a transparent PNG</span>
          </label>
        </div>
        {verdicts ? (
          <p className="mt-3 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
            {summarizeVerdicts(verdicts)}
          </p>
        ) : (
          <p className="mt-3 text-xs text-neutral-500">
            Enter both dimensions to run the fit rules (85% of the artwork must survive a
            centre-crop, and the artwork must cover the region natively — upscaling adds no detail).
          </p>
        )}
      </div>

      <h3 className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        Printable regions — {measured.length} measured of {regions.length} published
      </h3>

      {measured.length === 0 ? (
        <p className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          This template published no area with width and height, so it has no measurable print area
          in the registry. That is a gap in the catalogue data, not a claim that the product cannot
          be printed on.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-neutral-200 border-t border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {measured.map((r) => {
            const verdict = verdicts?.find((v) => v.regionLabel === r.label);
            return (
              <li key={r.label} className="py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="font-mono text-xs text-black dark:text-white">{r.label}</span>
                  <span className="font-mono text-[11px] text-neutral-500">{r.dimensions}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500">
                  <span>{r.dpi}</span>
                  {r.megapixels && <span>{r.megapixels}</span>}
                  <span>{r.orientation}</span>
                  {verdict && (
                    <span
                      className={
                        verdict.usable
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }
                    >
                      {verdict.usable
                        ? `accepts this artwork (retains ${(verdict.retained * 100).toFixed(0)}%)`
                        : verdict.reason}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {unmeasured.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-[11px] text-neutral-500">
            {unmeasured.length} area{unmeasured.length === 1 ? '' : 's'} published without
            measurements
          </summary>
          <ul className="mt-2 space-y-1">
            {unmeasured.map((r) => (
              <li key={r.label} className="font-mono text-[11px] text-neutral-500">
                {r.label} — {r.note}
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="mt-6 border-t border-neutral-200 pt-4 text-[11px] leading-relaxed text-neutral-500 dark:border-neutral-800">
        This page reads a committed registry. It does not call Fourthwall, create products, or
        publish anything. Products are published by hand in the Fourthwall dashboard.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-black dark:text-white">{value}</dd>
    </div>
  );
}
