/**
 * Guards for the template-probe defects found on 2026-10-04 (task t_012d4119).
 *
 * Each test here exists because the corresponding bug was live and would have silently
 * produced a wrong reference file rather than an error.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildAuthHeader,
  FourthwallApiError,
  getTemplate,
  getTemplateAreas,
  listTemplates,
  resolveAuthMode
} from '../client';
import type { FourthwallCredentials } from '../types';

const CREDS: FourthwallCredentials = { apiUsername: 'u', apiPassword: 'p' };

function mockFetchOnce(body: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status }))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('listTemplates', () => {
  it('returns only the rows the API gave, without claiming to be the catalogue', async () => {
    // The list endpoint returns 25 rows against total: 605, and ignores ?page=/?size=.
    // The client must pass through what it got and nothing more — the cap is documented
    // on the function so nobody later "fixes" this into a catalogue size. → T34
    mockFetchOnce({ results: [{ productId: 'pro_a', name: 'A' }], total: 605 });
    const rows = await listTemplates(CREDS);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.productId).toBe('pro_a');
  });

  it('returns an empty array rather than throwing when results is absent', async () => {
    mockFetchOnce({ total: 605 });
    await expect(listTemplates(CREDS)).resolves.toEqual([]);
  });
});

describe('getTemplateAreas', () => {
  it('keeps areas that report available: false', async () => {
    // Both areas of the Coozie report available:false while the template is live and
    // orderable. Filtering them out returned [] and read as "no printable region". → T34
    mockFetchOnce({
      customizableAreas: [
        { regionId: 'front', available: false },
        { regionId: 'back', available: false }
      ]
    });
    const areas = await getTemplateAreas(CREDS, 'pro_DaDG_vA9Qc2o00poXQM-ww');
    expect(areas).toHaveLength(2);
    expect(areas.map((a) => a.regionId)).toEqual(['front', 'back']);
  });

  it('keeps an area whose regionId is null', async () => {
    // Measured on Area Rug and Canvas (in): regionId null, type "front". A null regionId
    // is a valid orderable template, so dropping it would be a false negative. → T08
    mockFetchOnce({ customizableAreas: [{ regionId: null, type: 'front', available: true }] });
    const areas = await getTemplateAreas(CREDS, 'pro_lLYMnccJTqOijMduWMT-fA');
    expect(areas).toHaveLength(1);
    expect(areas[0]?.regionId).toBeNull();
    expect(areas[0]?.type).toBe('front');
  });

  it('preserves mixed availability rather than normalising it', async () => {
    mockFetchOnce({
      customizableAreas: [
        { regionId: 'front', available: true },
        { regionId: 'sleeve_left', available: false }
      ]
    });
    const areas = await getTemplateAreas(CREDS, 'pro_x');
    expect(areas.map((a) => a.available)).toEqual([true, false]);
  });
});

describe('getTemplate', () => {
  it('requests the template by productId, URL-encoding it', async () => {
    const urls: string[] = [];
    const fetchMock = vi.fn(async (input: unknown) => {
      urls.push(String(input));
      return new Response(JSON.stringify({ productId: 'pro_a/b', name: 'X' }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    await getTemplate(CREDS, 'pro_a/b');
    expect(urls[0]).toContain('/product-templates/pro_a%2Fb');
  });

  it('surfaces a 404 as FourthwallApiError so absence can be told from a transient failure', async () => {
    // This distinction is load-bearing: the probe counts 404 as "genuinely absent" and
    // retries everything else. Conflating them silently shrank the catalogue to 426/605. → T34
    mockFetchOnce({ detail: 'nope' }, 404);
    await expect(getTemplate(CREDS, 'pro_missing')).rejects.toBeInstanceOf(FourthwallApiError);
  });

  it('reports the status on the error so a 429 can be retried rather than believed', async () => {
    mockFetchOnce({ detail: 'rate limited' }, 429);
    await expect(getTemplate(CREDS, 'pro_x')).rejects.toMatchObject({ status: 429 });
  });
});

describe('auth resolution', () => {
  it('prefers bearer when a token is present', () => {
    expect(resolveAuthMode({ accessToken: 't' })).toBe('bearer');
  });

  it('falls back to basic only when both halves are present', () => {
    expect(resolveAuthMode({ apiUsername: 'u', apiPassword: 'p' })).toBe('basic');
    expect(resolveAuthMode({ apiUsername: 'u' })).toBe('none');
  });

  it('returns null for an unusable credential set instead of an empty bearer header', () => {
    expect(buildAuthHeader({})).toBeNull();
  });
});
