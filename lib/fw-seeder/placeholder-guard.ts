/**
 * placeholder-guard.ts — makes placeholder artwork impossible to publish.
 *
 * ⚠️ WHY THIS EXISTS
 *
 * The merch release is being carried by third-party placeholder photography until
 * Rory supplies 300 DPI PNG masters (see `docs/agentic/stack/artwork-catalogue.md`:
 * only 4 of 42 available works clear 1500px, all files are JPEG, no alpha).
 *
 * That art is licensed to *other photographers*. Selling it on Rory Skagen's store
 * would be passing off someone else's work as his, and it would ship. A convention
 * that says "don't publish these" is not sufficient protection for that, so the rule
 * is enforced in code on the only path that can publish.
 *
 * THE RULE: a product is placeholder art if its name or description carries the
 * marker. A placeholder product can be created — that is how the pipeline and the
 * storefront get exercised — but `createProduct` will refuse to set
 * `publishOnCreate: true` on it, and `assertNotPlaceholder` throws before any write.
 *
 * Deliberately a hard throw rather than a warning: a warning is a thing you scroll
 * past, and the failure mode here is irreversible (there is no update endpoint and
 * no way to unpublish a product that reached a customer → T03).
 */

const NAME_MARKER = 'PLACEHOLDER';
const DESCRIPTION_MARKER = 'DO NOT PUBLISH';

export function isPlaceholderProduct(input: { name?: string; description?: string }): boolean {
  const name = (input.name ?? '').toUpperCase();
  const desc = (input.description ?? '').toUpperCase();
  return name.includes(NAME_MARKER) || desc.includes(DESCRIPTION_MARKER);
}

export class PlaceholderPublishError extends Error {
  constructor(name: string) {
    super(
      `Refusing to publish placeholder artwork: "${name}".\n\n` +
        `This product uses third-party placeholder photography standing in for Rory ` +
        `Skagen's real work. It must never reach a customer.\n\n` +
        `To publish merch, replace the artwork in the seed config with a real ` +
        `artworkId from lib/fourthwall/rory-artworks-data.json and re-run.`
    );
    this.name = 'PlaceholderPublishError';
  }
}

/**
 * Gate the publish decision. Returns the value that is safe to send.
 *
 * Placeholder art is forced to `false` and warns. Real art passes through unchanged,
 * including an explicit `true` — this guard exists to stop one specific mistake, and
 * a guard that silently blocked all publishing would just get bypassed.
 */
export function resolvePublishOnCreate(input: {
  name?: string;
  description?: string;
  requested?: boolean;
}): boolean {
  if (!isPlaceholderProduct(input)) {
    return input.requested ?? false;
  }
  if (input.requested) {
    console.warn(
      `[placeholder-guard] publishOnCreate=true was requested for "${input.name}" but the ` +
        `product carries placeholder markers. Forcing false.`
    );
  }
  return false;
}

/** Throw if a caller is about to write a placeholder product to production. */
export function assertNotPlaceholder(input: {
  name?: string;
  description?: string;
  operation?: string;
}): void {
  if (!isPlaceholderProduct(input)) return;
  throw new PlaceholderPublishError(input.name ?? '(unnamed)');
}
