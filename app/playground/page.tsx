import type { Metadata } from 'next';
import { BackToStoreLink } from 'components/playground/badge';
import { PlaygroundBrowser } from 'components/playground/browser';
import { buildCatalog } from 'lib/playground';
import registry from 'lib/fw-catalog/template-registry.json';

export const metadata: Metadata = {
  title: 'Template Playground',
  description:
    'Read-only browser for the Fourthwall template registry: search, filter, and inspect every printable region with its pixel dimensions and DPI.',
  // A build tool, not a shopper surface. Keep it out of the index.
  robots: { index: false, follow: false }
};

/**
 * /playground — browse the template registry. Read and render only.
 *
 * ⚠️ THE REGISTRY IS IMPORTED ONCE, HERE, ON THE SERVER
 *
 * `template-registry.json` is 3.13 MB. It is imported in this server component and trimmed to the
 * fields the UI renders (372 KB) before being handed to the client. Search and filtering then run
 * entirely in the browser against that projection — no fetch on mount, no fetch per keystroke, no
 * filter endpoint. Keeping the import here also means the 3 MB document never reaches the client
 * bundle.
 *
 * ⚠️ NO PUBLISH AFFORDANCE, AND THAT IS NOT AN OMISSION
 *
 * There is no Fourthwall publish endpoint (→ T37). `publishOnCreate` is create-time-only, and this
 * route creates nothing. So there is no "Publish" button, no "Make live" control, and no copy
 * suggesting the app can list a product. Publishing happens by hand in the Fourthwall dashboard; a
 * flow that gets that far ends at `AWAITING_MANUAL_PUBLISH`. A button that implied otherwise would
 * be lying to the user.
 */
export default function PlaygroundPage() {
  const catalog = buildCatalog(registry);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <header className="mb-8 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
              Build tool · read-only
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-black dark:text-white">
              Template Playground
            </h1>
          </div>
          <BackToStoreLink />
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {catalog.totals.templates} Fourthwall templates. Search and filter them here, then open
          any one to see every printable region with its pixel dimensions and DPI. This page only
          reads the committed registry — it creates nothing, and it cannot publish anything.
        </p>
      </header>

      <PlaygroundBrowser catalog={catalog} />
    </div>
  );
}
