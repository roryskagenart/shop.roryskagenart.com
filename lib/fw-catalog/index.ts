/**
 * fw-catalog — can this artwork print on that template?
 *
 * A committed, regenerable projection of the Fourthwall template catalogue plus the fit rules that
 * decide whether an artwork fits a printable region.
 *
 * ⚠️ WHY THIS EXISTS, AND WHY IT IS ITS OWN PACKAGE
 *
 * "Will this artwork print on that template?" was asked and answered three times in one planning
 * session, and **two of the three answers were wrong**. Each was derived by hand from whatever
 * subset of the catalogue was at hand — first 11 templates, then the 45 non-transparency ones —
 * and each subset was reported as though it were the whole set. That is trap **T34**: a bounded
 * read presented as a measurement of the population.
 *
 * The concrete damage: eight artworks were declared unbuildable, and a scope decision nearly rested
 * on it, when in fact nine apparel templates fit all eleven of them. The subset that was missing is
 * exactly the one an unrelated filter had excluded — a different axis (transparency) had been
 * silently applied to a question about pixel geometry.
 *
 * Three separate causes, all addressed here:
 *
 * 1. **The data was not in the repo.** The 605-template detail pull (12 MB, with every region's
 *    pixel dimensions and every size ladder) existed only in an untracked sibling repo, while six
 *    documents here described it as integrated. The committed `catalog_full.csv` carries no
 *    dimensions. So the question had no committed answer and had to be re-derived by hand. →
 *    `template-registry.json` is that answer, committed and checkable.
 * 2. **The rule lived in prose.** The 85% retention / 1.0 coverage gate was written in a docstring,
 *    then re-implemented slightly differently three times. It is now `measureFit()`, tested.
 * 3. **Separation from the writer.** `lib/fw-seeder/` writes to Fourthwall's Platform API and is
 *    irreversible (no update endpoint → T03). This package is **read-only** and touches nothing.
 *    Keeping them apart means a fit calculation can never become an accidental write. → T02, T05.
 *
 * Usage:
 *   import { measureFit, pickTemplates, findCommonTemplate } from 'lib/fw-catalog';
 *
 *   npx tsx lib/fw-catalog/build-registry.ts                      # regenerate (network)
 *   npx tsx lib/fw-catalog/build-registry.ts --check              # exit 1 on drift
 *   npx tsx lib/fw-catalog/build-registry.ts --from lib/fw-catalog/template-registry.json \
 *       --fit "Tuna 4 Cats:830x563,Cold Beer:830x623"   # answer a fit question, no network
 *
 * ⚠️ `build-registry.ts` is GET-only and must stay that way. It enumerates by verifying a seed of
 * real `productId`s against `GET /product-templates/{productId}` rather than trusting the list
 * endpoint, which is capped at 25 and silently ignores `?page=`/`?size=` → T34. A failed request is
 * not a missing template: only a real 404 counts, everything else is retried and then reported as
 * unresolved, so a 429 cannot quietly shrink the catalogue.
 */

export type {
  ColorVariant,
  SizeVariant,
  TemplateRegion,
  TemplateRegistry,
  TemplateRegistryEntry
} from './types';

export {
  MIN_COVERS,
  MIN_RETAINED,
  distinctSizes,
  evaluateTemplate,
  findCommonTemplate,
  hasUnprobedSizes,
  measureFit,
  pickTemplates,
  requiresTransparency
} from './fit';

export type { ArtworkSource, FitResult, TemplateVerdict } from './fit';
