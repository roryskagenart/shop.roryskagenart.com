#!/usr/bin/env node
/**
 * build-registry.ts — generate `template-registry.json`, the committed answer to "can this artwork
 * print on this template?"
 *
 * ⚠️ WHY THIS IS COMMITTED AT ALL
 *
 * The full 605-template detail dump is 12 MB and lived ONLY in an untracked sibling repo, while six
 * documents in this repo described it as integrated. The committed `catalog_full.csv` has no
 * pixel dimensions and no size ladders. So a print-fit question had no committed answer, and it was
 * answered by hand three times from whatever subset was at hand — 11 templates, then 45 — each
 * reported as if it were the whole catalogue. Two of those three answers were wrong (**T34**).
 *
 * This projects the fit-relevant fields out of the full catalogue and commits them, so the question
 * is answered from one artifact, in one pass, by tested code.
 *
 * Usage:
 *   npx tsx lib/fw-catalog/build-registry.ts                    # regenerate + write
 *   npx tsx lib/fw-catalog/build-registry.ts --check            # exit 1 on drift (needs network)
 *   npx tsx lib/fw-catalog/build-registry.ts --from <details.json>   # no network
 *
 * ⚠️ `--check` is only meaningful against an INDEPENDENT source. `--from <this same file> --check`
 * compares the registry to itself and therefore always passes — verified, and it is a trap worth
 * naming. Use `--check` against the live API, or against a separate raw detail pull.
 *   npx tsx lib/fw-catalog/build-registry.ts --from lib/fw-catalog/template-registry.json \
 *       --fit "Tuna 4 Cats:830x563,Cold Beer:830x623"
 *
 * ⚠️ READ-ONLY. Every API call is a GET. This file must never contain a POST, PUT, PATCH or DELETE:
 * the Platform API has no update endpoint, so a probe that mutates is unrecoverable → T02, T03.
 */

import { readFile, writeFile } from 'fs/promises';

import type {
  ColorVariant,
  SizeVariant,
  TemplateRegion,
  TemplateRegistry,
  TemplateRegistryEntry
} from './types';
import { requiresTransparency } from './fit';
import { findCommonTemplate, pickTemplates, type ArtworkSource } from './fit';

const PLATFORM = 'https://api.fourthwall.com/open-api/v1.0';
const DEFAULT_OUT = 'lib/fw-catalog/template-registry.json';
const DEFAULT_SEED = 'docs/agentic/skills/fourthwall-product-catalog/references/catalog_full.csv';

function credsFromEnv(): { user?: string; pass?: string } {
  return {
    user: process.env.FOURTHWALL_API_USERNAME,
    pass: process.env.FOURTHWALL_API_PASSWORD
  };
}

/** Project one raw detail document down to the fields a fit decision needs. */
function project(detail: Record<string, unknown>): TemplateRegistryEntry {
  // A registry entry already IS the projection; re-projecting it must be a no-op rather than
  // silently dropping its regions. The two shapes use different keys for the same fact
  // (`customizableAreas[].dimensions` vs `regions[].width`), so reading only the wire-format key
  // yields zero regions — which makes every fit check fail and looks like "nothing is buildable".
  if (Array.isArray(detail.regions) && !Array.isArray(detail.customizableAreas)) {
    return detail as unknown as TemplateRegistryEntry;
  }

  const areas = (detail.customizableAreas ?? []) as Array<Record<string, unknown>>;
  const regions: TemplateRegion[] = [];
  for (const a of areas) {
    const dm = (a.dimensions ?? {}) as Record<string, unknown>;
    const width = typeof dm.pixelsWidth === 'number' ? dm.pixelsWidth : 0;
    const height = typeof dm.pixelsHeight === 'number' ? dm.pixelsHeight : 0;
    regions.push({
      regionId: (a.regionId as string | null) ?? null,
      type: a.type as string | undefined,
      // Recorded, never gated on: a live orderable template returns false on every area. → T08
      available: a.available as boolean | undefined,
      width,
      height,
      dpi: typeof dm.dpi === 'number' ? dm.dpi : undefined,
      placements: ((a.placements ?? []) as Array<{ id?: string }>)
        .map((p) => p.id ?? '')
        .filter(Boolean)
    });
  }

  const colorVariants: ColorVariant[] = (
    (detail.colorVariants ?? []) as Array<Record<string, unknown>>
  ).map((c) => ({
    name: (c.color as { name?: string } | undefined)?.name,
    hex: (c.color as { hex?: string } | undefined)?.hex,
    // Nested: this is the only place a template's size ladder exists. → T06
    sizeVariants: ((c.sizeVariants ?? []) as Array<Record<string, unknown>>).map(
      (s): SizeVariant => ({
        variantId: s.variantId as string | undefined,
        size: String(s.size ?? ''),
        price: s.price as { amount: number; currency: string } | undefined,
        available: s.available as boolean | undefined
      })
    )
  }));

  return {
    productId: String(detail.productId ?? ''),
    name: String(detail.name ?? ''),
    brand: detail.brand as string | undefined,
    category: detail.category as string | undefined,
    productionMethod: detail.productionMethod as string | undefined,
    supportsBackendRendering: detail.supportsBackendRendering === true,
    regions,
    colorVariants,
    priceFrom: detail.priceFrom as { amount: number; currency: string } | undefined,
    priceTo: detail.priceTo as { amount: number; currency: string } | undefined,
    minimumOrdersNumber: detail.minimumOrdersNumber as number | undefined
  };
}

/**
 * Fetch every seed id by direct lookup.
 *
 * ⚠️ NOT the list endpoint. `GET /product-templates` returns 25 rows against `total: 605` and
 * silently ignores `?page=`/`?size=` — page 7 is byte-identical to page 1, so a naive walk collects
 * 25 ids and confidently reports having walked 605. → **T34**
 *
 * A seed of real ids is the only enumeration verified to work. And a failed request is NOT a
 * missing template: only a real 404 counts as absent; anything else is retried and then reported
 * as unresolved. Retrying is what stops a 429 silently shrinking the catalogue.
 */
async function fetchDetails(seedIds: string[]): Promise<Record<string, unknown>> {
  const { user, pass } = credsFromEnv();
  if (!user || !pass) {
    throw new Error(
      'No credentials. Set FOURTHWALL_API_USERNAME / FOURTHWALL_API_PASSWORD in .env.local — ' +
        'never inline a value in a script (AGENTS.md rule 6). Or use --from <details.json>.'
    );
  }
  const auth = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
  const out: Record<string, unknown> = {};
  let idx = 0;
  let absent = 0;
  let transient = 0;

  async function get(pid: string): Promise<'ok' | 'gone' | 'transient'> {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res = await fetch(`${PLATFORM}/product-templates/${encodeURIComponent(pid)}`, {
          headers: { Authorization: auth, 'Accept-Encoding': 'identity' },
          signal: AbortSignal.timeout(45_000)
        });
        if (res.status === 404) return 'gone';
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return 'ok';
      } catch (err) {
        const status = (err as { message?: string }).message ?? '';
        if (status.includes('404')) return 'gone';
        await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
      }
    }
    return 'transient';
  }

  async function worker(): Promise<void> {
    while (idx < seedIds.length) {
      const pid = seedIds[idx++];
      if (!pid) continue;
      const outcome = await get(pid);
      if (outcome === 'ok') {
        const res = await fetch(`${PLATFORM}/product-templates/${encodeURIComponent(pid)}`, {
          headers: { Authorization: auth, 'Accept-Encoding': 'identity' },
          signal: AbortSignal.timeout(45_000)
        });
        out[pid] = await res.json();
      } else if (outcome === 'gone') {
        absent++;
      } else {
        transient++;
      }
    }
  }

  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`  resolved ${Object.keys(out).length}/${seedIds.length}`);
  console.log(`  absent (HTTP 404): ${absent} | unresolved after 4 retries: ${transient}`);
  if (transient) {
    console.log('  !! Those ids were NOT proven absent. Re-run before quoting a denominator.');
  }
  return out;
}

function parseSeedIds(csv: string): string[] {
  return csv
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => line.split(',')[1]?.trim())
    .filter((v): v is string => !!v && v.startsWith('pro_'));
}

/** Strip volatile fields so a regen at a different time compares equal. */
function comparable(reg: TemplateRegistry): string {
  return JSON.stringify({
    total: reg.total,
    backendRenderable: reg.backendRenderable,
    nonTransparency: reg.nonTransparency,
    entries: reg.entries
  });
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const outIdx = argv.indexOf('--out');
  // `noUncheckedIndexedAccess` is on, so an index into argv is `string | undefined` even when the
  // flag is present. `--out` with no value must not silently become `undefined` and write to a path
  // named "undefined".
  const outArg = outIdx >= 0 ? argv[outIdx + 1] : undefined;
  if (outIdx >= 0 && !outArg) {
    console.error('--out requires a path');
    process.exit(1);
  }
  const outPath = outArg ?? DEFAULT_OUT;
  const check = argv.includes('--check');
  const fromIdx = argv.indexOf('--from');
  const fromPath = fromIdx >= 0 ? argv[fromIdx + 1] : undefined;
  const seedIdx = argv.indexOf('--seed');
  const seedPath = (seedIdx >= 0 ? argv[seedIdx + 1] : undefined) ?? DEFAULT_SEED;

  console.log('fw-catalog — build template registry' + (check ? ' (CHECK)' : ''));
  console.log('  read-only: every call is a GET. → T02, T03');

  let details: Record<string, unknown>;
  if (fromPath) {
    console.log(`\nReading details from ${fromPath} (no network)`);
    const parsed = JSON.parse(await readFile(fromPath, 'utf8')) as unknown;
    // Accept either the raw detail pull (keyed by productId) or a previously built registry
    // ({ entries: [...] }). Without this branch, passing a registry back in silently projected
    // zero templates — the same shape mismatch that made the API look like it had no sizes.
    if (
      parsed &&
      typeof parsed === 'object' &&
      'entries' in parsed &&
      Array.isArray((parsed as { entries?: unknown }).entries)
    ) {
      const list = (parsed as TemplateRegistry).entries;
      details = Object.fromEntries(list.map((e) => [e.productId, e]));
      console.log(`  (registry format — ${list.length} entries)`);
    } else {
      details = parsed as Record<string, unknown>;
    }
  } else {
    const seedIds = parseSeedIds(await readFile(seedPath, 'utf8'));
    console.log(
      `\nSeed: ${seedPath} (${seedIds.length} ids) — direct lookup, not the capped list → T34`
    );
    details = await fetchDetails(seedIds);
  }

  const entries = Object.values(details)
    .map((d) => project(d as Record<string, unknown>))
    .filter((e) => !!e.productId)
    .sort((a, b) => a.productId.localeCompare(b.productId));

  const registry: TemplateRegistry = {
    _source: 'Fourthwall Platform API, GET /open-api/v1.0/product-templates/{productId}',
    _generatedAt: new Date().toISOString(),
    _provenance: 'Projected from the full catalogue detail pull; fit-relevant fields only.',
    _warning:
      'Generated file. Regenerate: `npx tsx lib/fw-catalog/build-registry.ts`. Verify: ' +
      '`--check` (exits 1 on drift). Identifiers are opaque productId values, NOT dashboard ' +
      'labels → T07. The list endpoint is capped at 25 and ignores ?page/?size, so the catalogue ' +
      'was enumerated by verifying a seed of real ids → T34. `available` is recorded but is NOT a ' +
      'usability signal → T08. Sizes are nested under colorVariants[].sizeVariants[] → T06.',
    total: entries.length,
    backendRenderable: entries.filter((e) => e.supportsBackendRendering).length,
    nonTransparency: entries.filter(
      (e) => e.supportsBackendRendering && !requiresTransparency(e.productionMethod)
    ).length,
    entries: entries.map((e) => ({
      ...e,
      /**
       * Denormalised so a UI can filter the JSON without importing `fit.ts`.
       *
       * ⚠️ This mirrors — it does not replace — `evaluateTemplate()`. **Usability is per region**:
       * a buildable template can still have a region with no dimensions, and a non-transparent
       * requirement depends on the *artwork*, not the template. Treat this as the cheapest
       * possible filter (274 / 45) and let `evaluateTemplate()` produce the real verdict.
       */
      buildable: e.supportsBackendRendering,
      /** The 45 that a JPEG source can satisfy without cutout transparency (T36). */
      nonTransparency:
        e.supportsBackendRendering && !requiresTransparency(e.productionMethod),
    }))
  };

  console.log(`\nRegistry: ${registry.total} templates`);
  console.log(`  backend-renderable: ${registry.backendRenderable}`);
  console.log(`  non-transparency:   ${registry.nonTransparency}`);

  // ---- Optional fit query, so the answer to "will this print?" is one command ------------
  const fitIdx = argv.indexOf('--fit');
  if (fitIdx >= 0) {
    const specs = ((fitIdx >= 0 ? argv[fitIdx + 1] : undefined) ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const m = /^(.*):(\d+)x(\d+)$/.exec(s);
        if (!m) throw new Error(`--fit expects "Title:WxH", got "${s}"`);
        return { title: m[1] as string, width: Number(m[2]), height: Number(m[3]) };
      });
    const artworks: ArtworkSource[] = specs;
    for (const a of artworks) {
      const usable = pickTemplates(a, registry.entries);
      console.log(`\n  ${a.title} (${a.width}x${a.height}) → ${usable.length} usable regions`);
      for (const v of usable.slice(0, 6)) {
        console.log(
          `     ${v.entry.name.slice(0, 42).padEnd(44)} ${v.region.width}x${v.region.height} ` +
            `retained ${(v.fit.retained * 100).toFixed(0)}%`
        );
      }
    }
    if (artworks.length > 1) {
      const { found, blocked } = findCommonTemplate(artworks, registry.entries);
      console.log(
        `\n  A single template for all ${artworks.length}: ${found.length ? 'YES' : 'NO'}`
      );
      for (const f of found.slice(0, 10)) console.log(`     ${f.name}`);
      for (const [title, why] of Object.entries(blocked)) console.log(`     ${title}: ${why}`);
    }
  }

  if (check) {
    let existing: TemplateRegistry | undefined;
    try {
      existing = JSON.parse(await readFile(outPath, 'utf8')) as TemplateRegistry;
    } catch {
      console.error(`\nCHECK FAILED: ${outPath} missing or unreadable.`);
      process.exitCode = 1;
      return;
    }
    // Compare data, not bytes: _generatedAt changes every run, so a byte diff always fails and
    // teaches everyone to ignore the check.
    if (comparable(existing) === comparable(registry)) {
      console.log(`\nCHECK ok: ${registry.total} entries match ${outPath}.`);
    } else {
      console.error(`\nCHECK FAILED: ${outPath} is stale — regenerate with --out.`);
      process.exitCode = 1;
    }
    return;
  }

  await writeFile(outPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${registry.total} entries to ${outPath}`);
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
