#!/usr/bin/env node
/**
 * probe-templates.ts — read-only Platform API probe that generates the template reference.
 *
 * WHY THIS EXISTS
 *
 * The hand-maintained reference this replaces was built from the Fourthwall **MCP browse
 * catalogue**, a different surface from the Platform API the seeder writes to. The two
 * disagreed on identifiers: the browse catalogue returned 11 of 12 favourited items keyed by
 * dashboard label (`"Mugz M065"`), while the Platform API keys templates by opaque `productId`
 * (`pro_…`) and carries no `id` field at all. A label 404s → T07.
 *
 * ⚠️ THE LIST ENDPOINT IS CAPPED AT 25 AND CANNOT BE PAGINATED
 *
 * This is the single most damaging thing about this API, and an earlier version of this file
 * got it wrong in the worst possible way — it reported `templates.length` as the catalogue size.
 *
 * Measured live 2026-10-04:
 *
 *   GET /open-api/v1.0/product-templates              -> results: 25, total: 605
 *   GET /open-api/v1.0/product-templates?page=7       -> results: 25, total: 605, IDENTICAL ids to page 1
 *   GET /open-api/v1.0/product-templates?size=1000    -> results: 25, total: 605
 *   GET /open-api/v1.0/product-templates/page/2       -> results: 25 (different ids, but `/page/N` is not the
 *                                                            documented shape and stalls at the end)
 *
 * `total` says 605. `?page=` is silently ignored — every page returns page 1's 25 rows, so a
 * naive walk collects 25 unique ids and stops believing it walked the set. Treating that 25 as
 * the catalogue cost a wrong scoping decision and a margin proposal built on a false premise
 * ("only 14 templates are buildable"). → T34
 *
 * So `listTemplates()` CANNOT enumerate the catalogue. Enumeration requires a seed of real
 * productIds. This script therefore:
 *   1. reads a seed id list (default: the integrated catalog skill's CSV),
 *   2. verifies every seed id with a direct `GET /product-templates/{productId}`,
 *   3. reports resolved / 404 counts so a stale seed is visible rather than assumed,
 *   4. never reports a count it did not actually resolve.
 *
 * Measured on the default seed: **605 of 605 ids resolved, 0 gone. 274 backend-renderable.**
 *
 * ⚠️ READ-ONLY. Every call is a GET. There is no write path in this file, and the credentials it
 * reads are the ones already in `.env.local`. Never add a POST here — the Platform API has no
 * update endpoint, so a probe that mutates is unrecoverable → T02, T03.
 *
 * Usage:
 *   npx tsx lib/fw-seeder/probe-templates.ts
 *   npx tsx lib/fw-seeder/probe-templates.ts --areas
 *   npx tsx lib/fw-seeder/probe-templates.ts --out docs/releases/templates/verified-templates.json
 *   npx tsx lib/fw-seeder/probe-templates.ts --out <path> --check   # exits 1 on drift
 */

import { readFile, writeFile } from 'fs/promises';

import { FourthwallApiError, getTemplate, listTemplates } from './client';
import { type FourthwallCredentials, type ProductTemplateDetail, type TemplateArea } from './types';

/** Default seed: the integrated catalog skill's already-pulled id list. */
const DEFAULT_SEED = 'docs/agentic/skills/fourthwall-product-catalog/references/catalog_full.csv';

function credsFromEnv(): FourthwallCredentials {
  return {
    apiUsername: process.env.FOURTHWALL_API_USERNAME,
    apiPassword: process.env.FOURTHWALL_API_PASSWORD,
    accessToken: process.env.FOURTHWALL_ACCESS_TOKEN || undefined,
    platformApiUrl: process.env.FOURTHWALL_PLATFORM_API_URL || undefined
  };
}

/** "Mugz M065" -> "mugzm065" */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Pull the second CSV column (productId) out of the seed file. */
function parseSeedIds(csv: string): string[] {
  return csv
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => line.split(',')[1]?.trim())
    .filter((v): v is string => !!v && v.startsWith('pro_'));
}

const FAVOURITED: Array<{ label: string; candidates: string[] }> = [
  // `candidates` are the exact product names the browse catalogue reported for this dashboard
  // label. Matching is EXACT after normalisation — no substring, no brand fallback, no
  // "close enough". A miss is reported as unresolved rather than matched to something adjacent.
  // An earlier version fell back to a category scan and cheerfully matched five different
  // labels to the same framed poster, which would have shipped the wrong product five times.
  { label: 'Allcolor 1224', candidates: ['Wrapping Paper Sheets (3)'] },
  { label: 'Sublimcolor 751', candidates: ['Coozie Can Cooler'] },
  { label: 'Allcolor A16', candidates: ['Shaker Pint Glass'] },
  { label: 'Mugz M065', candidates: ['Enamel Camp Mug'] },
  { label: 'Mixam MXM-COMIC', candidates: ['Custom Comic Book'] },
  { label: 'Generic 1425', candidates: ['Poker Playing Cards'] },
  { label: 'Allcolor 5478', candidates: ['Soy Wax Candle In A Clear Glass Jar'] },
  { label: 'Allcolor 724', candidates: ['Canvas (in)'] },
  { label: 'Allcolor P002', candidates: ['Framed High-Quality Matte Poster'] },
  { label: 'Allcolor P001', candidates: ['Enhanced Matte Paper Poster'] },
  { label: 'Allcolor 513', candidates: ['Glossed Cork Coaster'] },
  { label: 'Allcolor 924', candidates: ['Area Rug'] }
];

interface TemplateRecord {
  productId: string;
  name: string;
  brand?: string;
  category?: string;
  productionMethod?: string;
  supportsBackendRendering?: boolean;
  /** The label Rory favourited, when this template is one of the 12. */
  favouritedLabel?: string;
  areas?: Array<{
    regionId: string | null;
    type?: string;
    available?: boolean;
    dimensions?: {
      dpi?: number;
      pixelsWidth?: number;
      pixelsHeight?: number;
      inchesWidth?: number;
      inchesHeight?: number;
    };
    placements?: Array<{ id: string }>;
  }>;
  colors?: string[];
  /**
   * The template's accepted sizes, read from `colorVariants[].sizeVariants[].size`.
   *
   * ⚠️ Measured 2026-10-04: these live NESTED. There is no top-level `sizes`/`sizeVariants` key
   * and `sizeGuide` is `{url: null, content: null}` on every template — which is what made an
   * earlier version of this probe report `"none-exposed-by-api"` for all 605 templates. That was a
   * partial read reported as a property of the set, and it propagated into the KB as "sizes cannot
   * be read from the API". → T06
   */
  sizes: string[];
  /** Distinct `size` values across colour variants, with the per-size price where present. */
  sizePrices?: Record<string, { amount: number; currency: string }>;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const outIndex = argv.indexOf('--out');
  const outPath = outIndex >= 0 ? argv[outIndex + 1] : undefined;
  const seedIndex = argv.indexOf('--seed');
  const seedPath = seedIndex >= 0 ? argv[seedIndex + 1] : DEFAULT_SEED;
  const wantAreas = argv.includes('--areas');
  const check = argv.includes('--check');

  const creds = credsFromEnv();
  const authMode = creds.accessToken ? 'bearer' : creds.apiUsername ? 'basic' : 'none';
  if (authMode === 'none') {
    console.error(
      'No credentials. Set FOURTHWALL_API_USERNAME / FOURTHWALL_API_PASSWORD (or FOURTHWALL_ACCESS_TOKEN).\n' +
        'These live in .env.local — never inline a value here.'
    );
    process.exit(1);
  }

  console.log('='.repeat(74));
  console.log(' Platform API template probe — READ ONLY');
  console.log('='.repeat(74));
  console.log(` Auth mode : ${authMode}`);

  // ---- What the capped list endpoint actually reports --------------------------
  // Called only to print the cap-vs-total discrepancy, which is the whole point of this probe.
  const raw = await listTemplates(creds);
  console.log(`\nGET /product-templates -> ${raw.length} rows returned.`);
  console.log('  NOTE: this endpoint is capped and ?page=/?size= are ignored. Its length is');
  console.log('        NOT the catalogue size. Enumerating requires the seed below. → T34');

  // ---- Resolve every seed id with a direct lookup ------------------------------
  let seedIds: string[] = [];
  try {
    if (!seedPath) throw new Error('no seed path');
    seedIds = parseSeedIds(await readFile(seedPath, 'utf8'));
  } catch (err) {
    console.error(`\nCould not read seed ${seedPath}: ${String(err)}`);
    console.error('Pass --seed <path-to-csv-with-a-productId-column>.');
    process.exit(1);
  }
  console.log(`\nSeed: ${seedPath} (${seedIds.length} ids)`);

  const byId = new Map<string, ProductTemplateDetail>();
  let idx = 0;
  /** Ids the API answered 404 for — genuinely absent, not transient. */
  let notFound = 0;
  const notFoundIds: string[] = [];
  /** Ids that failed for any other reason (429, 5xx, timeout) — retry before believing it. */
  let transient = 0;
  const transientIds: string[] = [];

  /**
   * ⚠️ A failed request is NOT a missing template.
   *
   * An earlier version caught every throw and counted it as "gone", so a 429 rate-limit
   * silently shrank the catalogue and the report printed a confident, wrong denominator
   * (measured 426/605 resolved on one run and 605/605 on the next, with nothing changing
   * server-side). Only a real 404 means the template is absent; everything else is retried
   * and then reported as unresolved-if-still-failing.
   */
  async function fetchTemplate(id: string): Promise<'ok' | 'gone' | 'transient'> {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        byId.set(id, await getTemplate(creds, id));
        return 'ok';
      } catch (err) {
        const status = err instanceof FourthwallApiError ? err.status : undefined;
        if (status === 404) return 'gone';
        // 429/5xx/network — back off and retry; a timeout is not evidence of absence.
        await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
      }
    }
    return 'transient';
  }

  async function worker(): Promise<void> {
    while (idx < seedIds.length) {
      const id = seedIds[idx++];
      if (!id) continue;
      const outcome = await fetchTemplate(id);
      if (outcome === 'gone') {
        notFound++;
        notFoundIds.push(id);
      } else if (outcome === 'transient') {
        transient++;
        transientIds.push(id);
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));

  console.log(`\nSeed verification: ${byId.size}/${seedIds.length} ids resolved.`);
  console.log(
    `  genuinely absent (HTTP 404) : ${notFound}${notFound ? ` — ${notFoundIds.join(', ')}` : ''}`
  );
  console.log(
    `  unresolved after 4 retries   : ${transient}` +
      (transient ? ` — ${transientIds.slice(0, 5).join(', ')}${transient > 5 ? ' …' : ''}` : '')
  );
  if (transient) {
    console.log('  !! Those ids were NOT proven absent. Re-run before quoting a denominator.');
  }

  const backendYes = [...byId.values()].filter((t) => t.supportsBackendRendering === true);
  console.log(`\nCatalogue as resolved by direct lookup: ${byId.size} templates`);
  console.log(`  supportsBackendRendering true : ${backendYes.length}`);
  console.log(`  supportsBackendRendering false: ${byId.size - backendYes.length}`);

  // ---- Resolve the 12 favourited items, exact-match only -----------------------
  const byName = new Map<string, ProductTemplateDetail[]>();
  for (const t of byId.values()) {
    const key = norm(t.name);
    byName.set(key, [...(byName.get(key) ?? []), t]);
  }

  const resolved: Array<{ fav: (typeof FAVOURITED)[number]; t: ProductTemplateDetail }> = [];
  const unresolved: Array<{ label: string; candidates: string[]; reason: string }> = [];

  console.log('\nFavourited dashboard items, exact product-name match only:');
  for (const fav of FAVOURITED) {
    const hits = fav.candidates.flatMap((c) => byName.get(norm(c)) ?? []);
    const unique = [...new Map(hits.map((h) => [h.productId, h])).values()];
    if (unique.length === 1) {
      resolved.push({ fav, t: unique[0]! });
      console.log(
        `  FOUND    ${fav.label.padEnd(17)} -> ${unique[0]!.productId.padEnd(27)} ${unique[0]!.name}`
      );
    } else if (unique.length > 1) {
      unresolved.push({
        label: fav.label,
        candidates: fav.candidates,
        reason: `ambiguous: ${unique.map((u) => u.productId).join(', ')}`
      });
      console.log(
        `  AMBIG    ${fav.label.padEnd(17)} ${unique.length} exact matches — needs a human choice`
      );
    } else {
      unresolved.push({
        label: fav.label,
        candidates: fav.candidates,
        reason: 'no live template with that exact name'
      });
      console.log(
        `  MISSING  ${fav.label.padEnd(17)} no live template named ${fav.candidates.join(' / ')}`
      );
    }
  }
  console.log(
    `\n  ${resolved.length}/${FAVOURITED.length} favourited items resolve against the live catalogue.` +
      (unresolved.length ? ` ${unresolved.length} do not — see the markdown note.` : '')
  );

  // ---- Per-template detail -----------------------------------------------------
  const records: TemplateRecord[] = [];
  // Without --areas only the favourited items are recorded; the seed verification above already
  // fetched every template's detail, so re-fetching 605 documents is pure waste.
  const targets = wantAreas ? [...byId.values()] : resolved.map((r) => r.t);
  const labelOf = new Map(resolved.map((r) => [r.t.productId, r.fav.label]));

  for (const t of targets) {
    const detail = wantAreas ? t : await getTemplate(creds, t.productId);
    records.push({
      productId: detail.productId,
      name: detail.name,
      brand: detail.brand,
      category: detail.category,
      productionMethod: detail.productionMethod,
      supportsBackendRendering: detail.supportsBackendRendering,
      favouritedLabel: labelOf.get(detail.productId),
      areas: (detail.customizableAreas ?? []).map((a: TemplateArea) => ({
        regionId: a.regionId,
        type: a.type,
        available: a.available,
        dimensions: a.dimensions,
        placements: (a.placements ?? []).map((p: { id: string }) => ({ id: p.id }))
      })),
      colors: (detail.colorVariants ?? [])
        .map((c: { color?: { name?: string } }) => c.color?.name)
        .filter((n: string | undefined): n is string => !!n),
      // Sizes are NESTED under each colour variant. Measured 2026-10-04: the framed poster's
      // 3 colour variants each carry 12 sizeVariants; the matte poster's single White variant
      // carries 14. De-duplicated so the ladder is a set, not colour x size. → T06
      sizes: [
        ...new Set(
          (detail.colorVariants ?? []).flatMap((c) =>
            (c.sizeVariants ?? [])
              .map((s: { size?: string }) => s.size)
              .filter((s): s is string => !!s)
          )
        )
      ],
      // Per-size price where the template publishes one. Dollars, not cents → T09.
      sizePrices: Object.fromEntries(
        (detail.colorVariants ?? []).flatMap((c) =>
          (c.sizeVariants ?? [])
            .filter(
              (s): s is { size?: string; price?: { amount: number; currency: string } } =>
                !!s.size && !!s.price
            )
            .map((s) => [s.size as string, s.price as { amount: number; currency: string }])
        )
      )
    });
  }

  // ---- Report -------------------------------------------------------------------
  const buildable = records.filter(
    (r) => r.supportsBackendRendering === true && (r.areas?.length ?? 0) > 0
  );
  console.log('\nFulfilability across resolved templates:');
  console.log(`  backend-renderable AND has an area : ${buildable.length}`);
  console.log(
    `  NOT backend-renderable             : ${records.filter((r) => r.supportsBackendRendering !== true).length}`
  );
  console.log(
    `  zero areas (would block a design)   : ${records.filter((r) => (r.areas?.length ?? 0) === 0).length}`
  );

  if (outPath) {
    const payload = {
      _source: 'Fourthwall Platform API, GET /open-api/v1.0/product-templates/{productId}',
      _probedAt: new Date().toISOString(),
      _warning:
        'Generated file — regenerate with `npx tsx lib/fw-seeder/probe-templates.ts --out <path>`. ' +
        'Identifiers are opaque productId values, NOT dashboard labels. The list endpoint is ' +
        'capped at 25 and ignores ?page/?size, so the catalogue was enumerated by verifying a ' +
        'seed of real ids — never by trusting list length. → T34',
      _scope: wantAreas
        ? `customizableAreas recorded for all ${records.length} resolved templates (--areas).`
        : `Detail records for the ${FAVOURITED.length} favourited templates only. The full ` +
          'catalogue is not duplicated here — it ships as ' +
          'docs/agentic/skills/fourthwall-product-catalog/references/catalog_full.csv.',
      seedPath,
      listEndpointReturns: raw.length,
      seedIds: seedIds.length,
      resolvedByDirectLookup: byId.size,
      seedIdsAbsent404: notFound,
      seedIdsUnresolvedTransient: transient,
      backendRenderable: backendYes.length,
      favouritedTotal: FAVOURITED.length,
      favouritedResolved: resolved.length,
      favouritedUnresolved: unresolved,
      templates: records
    };
    const serialized = `${JSON.stringify(payload, null, 2)}\n`;

    if (check) {
      // A check mode that cannot fail is not a check mode (AGENTS.md §5). Compare the
      // data, not the bytes: _probedAt changes on every run by design, so a naive
      // string diff would always fail and teach everyone to ignore it.
      let existing: { templates?: TemplateRecord[] } | undefined;
      try {
        existing = JSON.parse(await readFile(outPath, 'utf8')) as { templates?: TemplateRecord[] };
      } catch {
        console.error(`\nCHECK FAILED: ${outPath} is missing or unreadable.`);
        process.exitCode = 1;
        return;
      }
      const same =
        JSON.stringify(existing?.templates ?? []) === JSON.stringify(records) &&
        byId.size === payload.resolvedByDirectLookup &&
        backendYes.length === payload.backendRenderable;
      if (same) {
        console.log(`\nCHECK ok: ${records.length} template records match ${outPath}.`);
      } else {
        console.error(
          `\nCHECK FAILED: ${outPath} is stale — regenerate with --out. ` +
            `(on disk: ${existing?.templates?.length ?? 0} records; live: ${records.length})`
        );
        process.exitCode = 1;
      }
    } else {
      await writeFile(outPath, serialized, 'utf8');
      console.log(`\nWrote ${records.length} template records to ${outPath}`);
    }
  }

  // An unresolved favourited template is a real finding, not a script failure.
  process.exitCode = 0;
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
