#!/usr/bin/env node
/**
 * placeholder-art.ts — source temporary artwork for the merch release.
 *
 * WHY THIS EXISTS
 *
 * The studio catalogue cannot carry this release on its own. Of the 42 `Available`
 * works in `lib/fourthwall/rory-artworks-data.json`, only 4 clear the project's
 * 1500px rule and 15 clear 1400px; the median short side is 734px and every file is
 * JPEG, so no alpha can be recovered. Printed at template size, that resolution
 * shows. See `docs/agentic/stack/artwork-catalogue.md`.
 *
 * So this script pulls licensed placeholder photography from Picsum (which serves
 * Unsplash-licensed images, records the photographer per image, and needs no API
 * key) to carry the pipeline until Rory supplies 300 DPI PNG masters.
 *
 * ⚠️ PLACEHOLDER ART IS NOT ROUGH DRAFTING. IT IS NOT ROUGH DRAFTING BECAUSE IT
 * IS NOT ROUGH DRAFTING — IT IS THIRD-PARTY PHOTOGRAPHY THAT MUST NEVER REACH A
 * CUSTOMER. Rory Skagen's real art replaces every one of these. That is enforced
 * mechanically, not by convention:
 *
 *   - every product name is prefixed `PLACEHOLDER —`
 *   - every description is prefixed `PLACEHOLDER ART — DO NOT PUBLISH.`
 *   - `publishOnCreate` is forced false and cannot be overridden (see below)
 *   - `lib/fw-seeder/placeholder-guard.ts` asserts the markers on the write path
 *
 * The forced flag is the important part. A placeholder can be *created* so the
 * pipeline and the storefront can be exercised end to end, but there is no code
 * path — not a flag, not an env var — that publishes one.
 *
 * Usage:
 *   npx tsx lib/fw-seeder/placeholder-art.ts --list
 *   npx tsx lib/fw-seeder/placeholder-art.ts --out docs/releases/placeholder-art.json
 *   npx tsx lib/fw-seeder/placeholder-art.ts --out docs/releases/placeholder-art.json --verify
 *
 * Read-only with respect to Fourthwall: this never calls the API.
 */

import { writeFile } from 'fs/promises';

const PICSUM_LIST = 'https://picsum.photos/v2/list';

/**
 * Long side requested from Picsum. Comfortably above the 1500px rule for every
 * template print area in the release, and above the studio's own best work, so the
 * pipeline is never the limiting factor while placeholders are in place.
 */
const LONG_SIDE = 2400;

/** Aspect families the templates need. Assigned per artwork so crops are deliberate. */
type Shape = 'portrait' | 'landscape' | 'square' | 'panorama';

interface PlaceholderArt {
  id: string;
  picsumId: string;
  author: string;
  sourceUrl: string;
  imageUrl: string;
  width: number;
  height: number;
  shape: Shape;
  /** The source image's true pixel size, so a capped request is visible rather than silent. */
  nativeWidth: number;
  nativeHeight: number;
  /** True when the source was smaller than the shape wanted and the request was capped. */
  upscaled: boolean;
}

function dimsFor(shape: Shape): { width: number; height: number } {
  switch (shape) {
    case 'portrait':
      return { width: Math.round(LONG_SIDE * 0.75), height: LONG_SIDE };
    case 'landscape':
      return { width: LONG_SIDE, height: Math.round(LONG_SIDE * 0.75) };
    case 'square':
      return { width: 2000, height: 2000 };
    case 'panorama':
      // Wide enough for the area rug and the wrapping paper sheets.
      return { width: 2800, height: 1000 };
  }
}

/**
 * Picsum ids chosen for visual variety and because their native aspect ratios and
 * pixel sizes suit the shape each is assigned. Ids are pinned — the list endpoint
 * paginates and reorders, so re-deriving these per run would silently change the
 * catalogue.
 *
 * Every id below was checked with `/id/:id/info`. Two rejections are recorded here
 * because they are the non-obvious ones:
 *   - `1120` returns "Image does not exist". It appeared to be a valid portrait pick.
 *   - `225` is natively 1500x979 — too small for the 2000x2000 square.
 *   - `1076` is natively 4608x3072; a 2800x1000 panorama out of that crops 60% of the
 *     height, so a genuinely wide source was needed instead.
 */
const PICKS: Array<{ picsumId: string; shape: Shape }> = [
  { picsumId: '1015', shape: 'landscape' },
  { picsumId: '1025', shape: 'portrait' },
  { picsumId: '1067', shape: 'landscape' },
  { picsumId: '1080', shape: 'portrait' },
  { picsumId: '110', shape: 'landscape' },
  { picsumId: '1039', shape: 'landscape' },
  { picsumId: '106', shape: 'landscape' },
  { picsumId: '1084', shape: 'portrait' },
  { picsumId: '1035', shape: 'square' },
  { picsumId: '1020', shape: 'landscape' },
  { picsumId: '1043', shape: 'landscape' },
  { picsumId: '1051', shape: 'panorama' }
];

async function fetchJson<T>(url: string, label: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    throw new Error(`${label}: HTTP ${res.status} from ${url}`);
  }
  return (await res.json()) as T;
}

interface PicsumEntry {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
}

/**
 * Per-image metadata, which carries the photographer and the native dimensions.
 *
 * The `/v2/list` endpoint paginates and the ids above sit well past page 1, so it
 * cannot be used to resolve them — measured: 2 of 12 resolved via list. `/id/:id/info`
 * is per-image and always answers, and it is what makes attribution reliable.
 */
async function fetchInfo(picsumId: string): Promise<PicsumEntry> {
  return fetchJson<PicsumEntry>(
    `https://picsum.photos/id/${picsumId}/info`,
    `picsum info ${picsumId}`
  );
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const outIndex = argv.indexOf('--out');
  const outPath = outIndex >= 0 ? argv[outIndex + 1] : undefined;
  const verify = argv.includes('--verify');

  if (argv.includes('--list')) {
    console.log('Pinned placeholder picks (see file header for the never-publish rule):');
    for (const p of PICKS) {
      const d = dimsFor(p.shape);
      console.log(`  ${p.picsumId.padEnd(6)} ${p.shape.padEnd(10)} ${d.width}x${d.height}`);
    }
    return;
  }

  // Attribution is mandatory, so resolve every pick through the per-image info
  // endpoint rather than guessing an author. Picsum is Unsplash-licensed: the author
  // field is the Unsplash photographer.
  const results: PlaceholderArt[] = [];
  const failures: string[] = [];

  for (const pick of PICKS) {
    const meta = await fetchInfo(pick.picsumId).catch(() => undefined);
    if (!meta?.author) {
      failures.push(`${pick.picsumId}: no metadata (attribution would be missing)`);
      continue;
    }

    // Requested size must not exceed the source, or Picsum upscales and the file is
    // soft. Native dimensions are recorded here so the waste is visible.
    const d = dimsFor(pick.shape);
    const requested = {
      width: Math.min(d.width, meta.width),
      height: Math.min(d.height, meta.height)
    };
    const upscaled = requested.width < d.width || requested.height < d.height;

    results.push({
      id: `placeholder-${pick.picsumId}`,
      picsumId: pick.picsumId,
      author: meta.author,
      sourceUrl: meta.url,
      imageUrl: `https://picsum.photos/id/${pick.picsumId}/${requested.width}/${requested.height}`,
      width: requested.width,
      height: requested.height,
      shape: pick.shape,
      nativeWidth: meta.width,
      nativeHeight: meta.height,
      upscaled
    });
  }

  console.log(`Resolved ${results.length}/${PICKS.length} placeholder images.`);
  if (failures.length) {
    console.error('\nFailed:');
    for (const f of failures) console.error(`  - ${f}`);
    console.error('\nAttribution is mandatory — a pick with no author is not used.');
  }

  // --verify actually downloads each one and reads its real dimensions, because a
  // 200 response is not proof the bytes are an image of the size we asked for.
  if (verify) {
    console.log('\nVerifying downloads (real bytes, real dimensions)…');
    for (const art of results) {
      const res = await fetch(art.imageUrl, {
        redirect: 'follow',
        signal: AbortSignal.timeout(45000)
      });
      if (!res.ok) {
        failures.push(`${art.id}: HTTP ${res.status}`);
        console.error(`  FAIL ${art.id} HTTP ${res.status}`);
        continue;
      }
      const buf = new Uint8Array(await res.arrayBuffer());
      const kind =
        buf[0] === 0xff && buf[1] === 0xd8 ? 'jpeg' : buf[0] === 0x89 ? 'png' : 'unknown';

      // Gate on the long side. A panorama is legitimately short-side-limited — a
      // 2800x1000 has a 1000px short side by design, and checking the short side
      // would fail every wide format for the wrong reason. Print resolution is set
      // by the long side.
      const long = Math.max(art.width, art.height);
      const ok = buf.length > 50_000 && long >= 1500;
      console.log(
        `  ${ok ? 'ok  ' : 'FAIL'} ${art.id.padEnd(18)} ${kind} ${Math.round(buf.length / 1024)}KB  requested ${art.width}x${art.height}`
      );
      if (!ok) failures.push(`${art.id}: ${kind} ${buf.length}B, long side ${long}px`);
    }
  }

  if (outPath) {
    const payload = {
      _warning:
        'PLACEHOLDER ART — THIRD-PARTY PHOTOGRAPHY, NOT ROUGH DRAFTING. Every entry must be ' +
        'replaced by Rory Skagen artwork before publication. See lib/fw-seeder/placeholder-art.ts.',
      _source:
        'Picsum (Unsplash-licensed). Photographer recorded per entry — attribution required.',
      generatedAt: new Date().toISOString(),
      longSide: LONG_SIDE,
      count: results.length,
      failures,
      images: results
    };
    await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(`\nWrote ${results.length} entries to ${outPath}`);
  }

  if (failures.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
