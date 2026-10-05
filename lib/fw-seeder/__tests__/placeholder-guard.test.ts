import { describe, expect, it } from 'vitest';

import {
  assertNotPlaceholder,
  isPlaceholderProduct,
  PlaceholderPublishError,
  resolvePublishOnCreate
} from '../placeholder-guard';

/**
 * Guards the rule that placeholder photography can never be published.
 *
 * This is a safety mechanism, not a convention: the merch release runs on
 * third-party placeholder art until Rory supplies 300 DPI PNG masters, and publishing
 * it would sell another photographer's work as his. The failure is irreversible
 * (no update endpoint, no way to recall a shipped product -> T03), so these tests
 * assert the refusal rather than the happy path.
 */

const REAL_ART = {
  name: 'The Martian — Glossy White Mug',
  description: 'Enamel on steel, hand-signed Certificate of Authenticity.'
};

const PLACEHOLDER_ART = {
  name: 'PLACEHOLDER — Glossy White Mug',
  description: 'PLACEHOLDER ART — DO NOT PUBLISH. Temporary Unsplash-licensed photography.'
};

describe('isPlaceholderProduct', () => {
  it('does not flag real studio artwork', () => {
    expect(isPlaceholderProduct(REAL_ART)).toBe(false);
  });

  it('flags placeholder art by name', () => {
    expect(isPlaceholderProduct({ name: 'PLACEHOLDER — Area Rug' })).toBe(true);
  });

  it('flags placeholder art by description alone', () => {
    // The name could be clean while the description still carries the marker.
    expect(isPlaceholderProduct({ name: 'Area Rug', description: 'DO NOT PUBLISH' })).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isPlaceholderProduct({ name: 'placeholder — mug' })).toBe(true);
  });

  it('treats missing fields as not placeholder rather than throwing', () => {
    expect(isPlaceholderProduct({})).toBe(false);
  });
});

describe('resolvePublishOnCreate', () => {
  it('FORCES placeholder art to stay hidden even when publish is requested', () => {
    // The whole point. No flag, no env var, no argument gets past this.
    expect(resolvePublishOnCreate({ ...PLACEHOLDER_ART, requested: true })).toBe(false);
  });

  it('forces hidden for placeholder art even on a name-only match', () => {
    expect(resolvePublishOnCreate({ name: 'PLACEHOLDER — Canvas', requested: true })).toBe(false);
  });

  it('lets real artwork publish when explicitly requested', () => {
    // A guard that blocked all publishing would just get bypassed.
    expect(resolvePublishOnCreate({ ...REAL_ART, requested: true })).toBe(true);
  });

  it('keeps real artwork hidden by default', () => {
    expect(resolvePublishOnCreate(REAL_ART)).toBe(false);
  });
});

describe('assertNotPlaceholder', () => {
  it('throws on placeholder art', () => {
    expect(() => assertNotPlaceholder(PLACEHOLDER_ART)).toThrow(PlaceholderPublishError);
  });

  it('names the product so the failure is diagnosable', () => {
    expect(() => assertNotPlaceholder(PLACEHOLDER_ART)).toThrow(/PLACEHOLDER — Glossy White Mug/);
  });

  it('points at the real fix — swap in a real artworkId', () => {
    expect(() => assertNotPlaceholder(PLACEHOLDER_ART)).toThrow(/rory-artworks-data\.json/);
  });

  it('does not throw on real artwork', () => {
    expect(() => assertNotPlaceholder(REAL_ART)).not.toThrow();
  });
});
