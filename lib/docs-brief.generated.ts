/**
 * lib/docs-brief.generated.ts
 *
 * ⚠️ GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Source of truth: `docs/master-brief/*.md` (markdown, rendered by GitHub).
 * Regenerate:      `npx tsx scripts/build-master-brief.ts`
 * Verify:          `npx tsx scripts/build-master-brief.ts --check`
 *
 * The table of contents and the sidebar structure are derived from the markdown,
 * so they cannot drift from the content.
 */
import type { DocCategory, DocPageContent } from './docs-content';

const LAST_UPDATED = '2026-10-08';

export const BRIEF_DOCS_STRUCTURE: DocCategory[] = [
  {
    title: "Master Brief",
    items: [
      {
        title: "Brief Home & Index",
        slug: "overview",
        badge: "Start here",
        description: "The single consolidated brief for the Rory Skagen engagement: both web properties, every version, every account, and what is worth passing to the client."
      },
      {
        title: "The Two Sites",
        slug: "estate",
        badge: "2 properties",
        description: "Two deliberately separate web properties — the studio archive/catalogue and the merch storefront — and why they must not be conflated."
      },
      {
        title: "Origins & Version History",
        slug: "origins",
        badge: "1998 → 2026",
        description: "1998 → today: Rory's predecessor websites, the Wayback recoveries, and the full release ledger for both repositories."
      },
      {
        title: "Accounts, Services & Stack",
        slug: "accounts",
        badge: "Reference",
        description: "A single reference table for every account, vendor, project id, domain, and credential owner across the engagement."
      },
      {
        title: "Visual Map",
        slug: "visual-map",
        badge: "Screens",
        description: "Every captured screen across both properties — mockups, storefront screens, admin screens, and the visual history frames — with clearly marked WIP placeholders where evidence was not captured."
      }
    ]
  },
  {
    title: "Assessment",
    items: [
      {
        title: "Client IP Register",
        slug: "client-ip",
        badge: "Handover",
        description: "What in this engagement is Rory Skagen's creative IP versus internal engineering scaffolding — and what actually passes to the client."
      },
      {
        title: "Value & Handover Flags",
        slug: "handover",
        badge: "Decisions",
        description: "Every substantive item in the engagement, flagged: pass to client, retain internally, retire, or open."
      },
      {
        title: "Open Items & Risks",
        slug: "open-items",
        badge: "Live",
        description: "Everything unfinished, broken, or undecided across both repos — with a recommendation where one exists."
      }
    ]
  }
];

export const BRIEF_PAGES: Record<string, DocPageContent> = {
  'brief/overview': {
    slug: "overview",
    title: "Master Brief — Index & Visual Map",
    description: "The single consolidated brief for the Rory Skagen engagement: both web properties, every version, every account, and what is worth passing to the client.",
    badge: "Master Brief",
    category: "Master Brief",
    scope: 'brief',
    lastUpdated: LAST_UPDATED,
    tableOfContents: [
      { id: 'purpose-scope', title: "Purpose & Scope", level: 2 },
      { id: 'the-engagement-at-a-glance', title: "The Engagement at a Glance", level: 2 },
      { id: 'visual-map', title: "Visual Map", level: 2 },
      { id: 'how-to-read-this-brief', title: "How to Read This Brief", level: 2 },
      { id: 'flag-legend', title: "Flag Legend", level: 2 }
    ],
    content: `# Master Brief — Rory Skagen Engagement

_Consolidated 2026-10-08 · covers both repositories (shop + studio) · status: reference_

## Purpose & Scope

This is the **combined client IP, project, and reference brief** for everything built for artist
**Rory Skagen** (Austin, Texas). It distills three sources that were previously scattered:

- **This repo** (\`shop.roryskagenart.com\`) — the **merch storefront**, a Next.js 15 storefront over a
  Fourthwall catalogue.
- **The sibling repo** (\`roryskagenart.com\`) — the **studio archive & catalog raisonné**, a Vite/React +
  Supabase CMS.
- **The shared client workspace** (\`clients/roryskagen/\`) — \`business/\` (brand, monetisation, art
  registry), \`fourthwall/\` (catalogue analysis), \`dashboard/\`, \`_archive/\` (Wayback captures and the
  visual history tool).

It exists so that a new contributor — human or agent — can understand the whole engagement without
re-reading ~250 commits and two agent knowledge bases.

> **This brief documents. It does not change anything.** Where it records an open defect or an
> unfinished item, that item is owned elsewhere (see *Open Items & Risks*) — nothing here is a fix.

## The Engagement at a Glance

| | Studio archive site | Merch storefront (this repo) |
| :--- | :--- | :--- |
| **Domain** | \`roryskagenart.com\` | \`shop.roryskagenart.com\` |
| **Purpose** | Catalogue raisonné + studio CMS | Sell prints, candles, mugs, editions |
| **Stack** | Vite 6 / React 19 + Express + Supabase | Next.js 15 / React 19 App Router |
| **Host** | Vercel \`prj_c8fk73LW7TWeai8uI5o86kilUM1h\` | Vercel \`prj_u3hPHBRFkibIkIkthndzS1sjvhKJ\` |
| **GitHub** | \`roryskagenart/roryskagenart.com\` | \`roryskagenart/shop.roryskagenart.com\` |
| **Data** | Supabase Postgres \`orphcusijzkxpxkzapjp\` | Fourthwall (no database) |
| **Commerce** | None (browse-only showcase) | Fourthwall — \`roryskagenart-shop.fourthwall.com\` |
| **Release scheme** | \`v2.x\` → \`v3.2.1\` (15 tags) | \`v0.x.y\` (2 tags) |
| **Commits** | 169 | see release ledger |
| **State** | Live, 205 artworks loaded | Live, 6 products + 3 collections published |

The two sites intentionally share **one visual identity** (the "Skagen" palette, logo, and wordmark) but
**no database and no deployment**. A change to one does not deploy the other.

## Visual Map

A one-glance index of the real screens captured across the engagement. Full-size images and captions
live in **Visual Map**.

![Merch storefront — gallery-first home page](/docs/master-brief/shop/storefront-home.png)
_Shop storefront: the gallery-first home page as shipped._

![Studio archive — home page](/docs/master-brief/studio/studio-home.png)
_Studio archive (roryskagenart.com): catalogue-raisonné home with the recovered mural catalogue._

![Fourthwall live storefront](/docs/master-brief/shop/fourthwall-shop-home.png)
_Fourthwall hosted storefront — The Goods · Wall Art · Studio Editions · Original Artwork._

## How to Read This Brief

| Page | What you get |
| :--- | :--- |
| **The Two Sites** | Why there are two properties and what each one is for |
| **Origins & Version History** | 1998 → today: predecessor sites, every iteration, every tag |
| **Accounts, Services & Stack** | Every account, project id, domain, and vendor |
| **Visual Map** | All screens, real where captured, marked WIP where not |
| **Client IP Register** | What is Rory's creative IP vs internal scaffolding |
| **Value & Handover Flags** | Per-item decision: pass on / retain / retire |
| **Open Items & Risks** | What is unfinished, broken, or undecided |

## Flag Legend

Every substantive item in this brief carries one of these flags:

| Flag | Meaning |
| :--- | :--- |
| **PASS TO CLIENT** | Rory's creative IP or a client-facing fact he should own |
| **RETAIN INTERNALLY** | Engineering artefact or agent scaffolding — useful, not client deliverable |
| **RETIRE** | Superseded, dead, or a trap that should not be carried forward |
| **OPEN** | Live, unfinished, or undecided — needs an owner decision |
| **WIP** | Placeholder: evidence not yet captured |
`
  },

  'brief/estate': {
    slug: "estate",
    title: "The Two Sites — Estate Overview",
    description: "Two deliberately separate web properties — the studio archive/catalogue and the merch storefront — and why they must not be conflated.",
    badge: "Estate",
    category: "Master Brief",
    scope: 'brief',
    lastUpdated: LAST_UPDATED,
    tableOfContents: [
      { id: 'why-two-sites', title: "Why Two Sites", level: 2 },
      { id: 'property-1-studio-archive', title: "Property 1 — Studio Archive", level: 2 },
      { id: 'property-2-merch-storefront', title: "Property 2 — Merch Storefront", level: 2 },
      { id: 'property-3-fourthwall-itself', title: "Property 3 — Fourthwall Itself", level: 2 },
      { id: 'the-naming-trap', title: "The Naming Trap", level: 2 }
    ],
    content: `# The Two Sites

## Why Two Sites

Rory's practice has **two commercial faces**: an artist's catalogue (fine art, murals, commissions)
and a maker's shop (prints, candles, mugs, apparel). They were built as **separate applications**
because they have genuinely different requirements:

- The **catalogue** needs a database, an admin CMS, image rendition pipelines, and role-gated access.
- The **shop** needs a commerce backend. That backend is **Fourthwall**, not a database — so the shop
  owns no product data at all.

Keeping them separate means a shop outage cannot take the catalogue down, and the catalogue's Supabase
project is never a commerce dependency.

## Property 1 — Studio Archive

_Evidence: \`roryskagenart.com\` repo · 169 commits · live_

![Studio archive home page](/docs/master-brief/studio/studio-home.png)
_Studio archive home — "Pop Surrealism from the roadside imagination"._

![Studio archive in dark theme](/docs/master-brief/studio/studio-home-dark.png)
_The same home page in the studio's Charcoal Gallery dark palette._

| Aspect | Value |
| :--- | :--- |
| Role | Catalogue raisonné, mural archive, studio CMS |
| Stack | Vite 6, React 19, Tailwind v4, Express 4, Supabase Postgres |
| Content | **205 artworks** (138 fine art + 67 murals/paintings), 168 artwork images, 142 terms |
| Admin | Admin/editor/viewer roles via Supabase Auth; plan board, changelog viewer |
| Media | Supabase Storage bucket \`artwork-images\`; sharp rendition ladder (thumb/hero/full/lqip) |
| Email | Resend (studio mailers), branded templates |
| Backup | Vercel Cron → Vercel Blob, verifiable v2 manifests |
| Flag | **PASS TO CLIENT** — this is Rory's primary public identity online |

## Property 2 — Merch Storefront

_Evidence: this repo · releases \`v0.1.0\`, \`v0.2.0\` · live_

![Storefront header](/docs/master-brief/shop/storefront-header.png)
_Storefront header — the two-tier nav with SHOP / ABOUT / CONTACT / Studio / Catalogue._

![Storefront gallery in light theme](/docs/master-brief/shop/storefront-gallery-light.png)
_Gallery surfaces with the series filter rail (Neon Americana, Pop Surrealism & Folklore)._

| Aspect | Value |
| :--- | :--- |
| Role | Sell print-on-demand merch and studio editions |
| Stack | Next.js 15 App Router, React 19, Tailwind, \`fumadocs-core\`/\`-ui\` |
| Data | **None locally** — reads Fourthwall's Storefront API |
| Catalogue | 137 works in a local JSON *fallback* (see the fabricated-catalogue trap) |
| Published | 6 products across 3 collections (v0.2.0, 2026-10-04) |
| Flag | **PASS TO CLIENT** — the revenue surface |

## Property 3 — Fourthwall Itself

_Evidence: \`fourthwall/\` analysis dir · 605-template catalogue_

![Fourthwall product templates](/docs/master-brief/shop/fw-product-templates.png)
_Fourthwall's product-template gallery — 605 templates, only 274 backend-renderable._

Fourthwall is a **third-party print-on-demand + storefront vendor**. Rory owns the account; the shop
talks to its API. Three facts matter repeatedly:

- The **Storefront API** (read) and the **Platform API** (write) are different hosts with different auth.
- The catalogue is **605 templates**, but only **274** can be rendered by the backend, and only **45**
  accept a JPEG source without a transparent PNG.
- **Publishing is dashboard-only.** No API endpoint publishes a product (trap **T37**).

| Flag | Item |
| :--- | :--- |
| **RETAIN INTERNALLY** | API behaviour notes, template ceilings, trap register |
| **PASS TO CLIENT** | The live storefront URL and what is currently purchasable |

## The Naming Trap

The same project answers to **four different names**. Never infer one from another.

| Thing | Value |
| :--- | :--- |
| Local folder | \`shop.roryskagenart.com\` |
| Vercel project | \`roryskagenart/shop.roryskagenart.com\` |
| Fourthwall project | \`roryskagenart-shop.fourthwall.com\` |
| Custom domain | \`shop.roryskagenart.com\` |
| GitHub remote | \`roryskagenart/shop.roryskagenart.com\` |

> ⚠️ \`git remote -v\` still prints the **stale** \`.com\` URL and only resolves because GitHub
> redirects renamed repos. Treat \`git remote -v\` as untrusted for identity (trap **T23**).

Also note the older studio repo path \`roryskagen/roryskagenart\` in aging docs is **404** — the real
repo is \`roryskagenart/roryskagenart.com\`, and \`roryskagenart\` is a **User** account, not an org.

| Flag | Item |
| :--- | :--- |
| **RETIRE** | The stale \`git remote -v\` URL (a human decision, rule 4 in \`AGENTS.md\`) |
| **RETIRE** | \`roryskagen/roryskagenart\` references in old docs |
`
  },

  'brief/origins': {
    slug: "origins",
    title: "Origins & Version History",
    description: "1998 → today: Rory's predecessor websites, the Wayback recoveries, and the full release ledger for both repositories.",
    badge: "1998 → 2026",
    category: "Master Brief",
    scope: 'brief',
    lastUpdated: LAST_UPDATED,
    tableOfContents: [
      { id: 'predecessor-web-presence', title: "Predecessor Web Presence", level: 2 },
      { id: 'the-wayback-recovery', title: "The Wayback Recovery", level: 2 },
      { id: 'studio-site-release-ledger', title: "Studio Site — Release Ledger", level: 2 },
      { id: 'shop-release-ledger', title: "Shop — Release Ledger", level: 2 },
      { id: 'architecture-phases', title: "Architecture Phases", level: 2 },
      { id: 'the-visual-history-tool', title: "The Visual History Tool", level: 2 }
    ],
    content: `# Origins & Version History

## Predecessor Web Presence

Rory's online presence predates this engagement by decades. Three predecessor properties were
recovered and mined for content:

| Site | Era | Type | What it held |
| :--- | :--- | :--- | :--- |
| **roryskagen.com** | WordPress "Berlin" theme | Fine-art portfolio, 11 series; a PayPal merch shop frozen c. 2016 | 144 artwork pages |
| **centraltexasmurals.com** | WordPress "Modularity" | Mural projects — business, restaurant, museum, retail, signage, event | Mural portfolio |
| **centraltexasmuralsbyroryskagen** | **WP 6.4.2 live export**, timestamped 2023-12-17 | Full DB export (\`vio_wp_centexmurals\`), not a scrape | 63 posts, ~350 originals |

> The studio's mural practice is as significant as its fine art. The v3.0.0 merge is what finally put
> murals on the site — before that, the catalogue was fine art only (**T-adjacent**: the site described
> only half the practice).

## The Wayback Recovery

_Evidence: \`wayback/\`, \`plan/PRD_V3_WAYBACK_DATA_MIGRATION.md\`, \`plan/RECON_V3_0_0_RECOVERED_SOURCE.md\`_

The studio site's v3.0.0 release was built on a **recovered-source ingest**: the old WordPress export
was parsed into 67 artworks (60 murals + 7 paintings), 168 media objects, 168 \`artwork_images\` rows,
142 \`artwork_terms\`, and 10 taxonomies — taking the studio database from **307 → 862 rows**.

A verified comparison of the old and new catalogues found:

- **144** artwork URLs on the legacy \`roryskagen.com\` vs **138** on the rebuilt site.
- **132 matched**, 1 duplicate, **11 genuinely missing** (e.g. *Stewed Gorilla*, *Jimmy's Dilemma*, 4
  monsters, *Lobedicus*).
- **15 renames** (e.g. \`ISSY\` → *Issy: The Atomic Companion*, \`regador-5\` → *Regador V*).
- 9 of the 11 missing items already had images staged in the new bundle.

**Catalog numbers — use these, in this order of authority:**

| Number | Meaning | Status |
| :--- | :--- | :--- |
| **205** | Current \`artworks\` rows (studio DB) | **Authoritative** |
| **138** | The v2 fine-art catalogue | Canonical for v2 era |
| **144** | Legacy roryskagen.com artwork URLs | Historical |
| **137** | Cloudinary-era count | **Historical only** — do not quote as current |

| Flag | Item |
| :--- | :--- |
| **PASS TO CLIENT** | The 11 missing artworks + 15 renames — a content decision for Rory |
| **OPEN** | \`artworks.year\` is hardcoded \`'2024'\` on all 138 legacy rows; 79 disagree with the archive (Q18) |

## Studio Site — Release Ledger

_Evidence: \`CHANGELOG.md\`, \`DEPLOYMENT_LOG.md\`, \`git tag\` — 15 tags_

| Version | Date | Shipped |
| :--- | :--- | :--- |
| v1.0.0 – v1.2.0 | 2026-08-18 → 08-25 | Monolithic SPA (pre-CHANGELOG) |
| **2.0.0** | 2026-09-10 | Supabase Postgres client + Resend email |
| 2.1.0 | 2026-09-11 | Supabase Storage + sharp rendition pipeline |
| 2.2.0 | 2026-09-11 | Bundled Express serverless API |
| 2.3.0 | 2026-09-12 | CMS Admin Dashboard (shadcn/ui) |
| 2.5.0 | 2026-09-12 | Supabase as single source of truth |
| **2.9.0** | 2026-09-13 | Cloudinary exit, RLS hardening, drafts/autosave |
| 2.10.0 | 2026-09-14 | Baseline schema migration + backup/restore runbook |
| 2.11.0 | 2026-09-14 | Studio ops: staff console, branded email, role-gated nav |
| 2.12.0 / 2.12.1 | 2026-09-14 | Public SELECT excludes drafts; RLS helper |
| 2.13.0 / 2.14.0 | 2026-09-14 | Off-site backup (Cron → Blob); smoke guard |
| 2.16.0 / 2.17.0 | 2026-09-15 | Media rendition ladder; recovered-source ingest tooling |
| **3.0.0** | 2026-09-15 | **The mural load** — 67 artworks, 168 media (307→862 rows) |
| **3.1.0** | 2026-09-15 | **"Capture"** — feedback & planning board |
| **3.2.0** | 2026-09-16 | **"Group"** — plan releases, triage, digest cron |
| **3.2.1** | 2026-10-06 | Navbar: Shop link, icon-only Home/Dashboard |

**Planned, not started:** v3.3.0 "Close the loop" · v3.4.0 = mural Phase 5.

## Shop — Release Ledger

_Evidence: \`docs/releases/RELEASES.md\` · tags go on the **merge commit**_

| Version | Date | Commit | Shipped |
| :--- | :--- | :--- | :--- |
| **v0.1.0** | 2026-10-01 | \`31e47f2\` | Truthful import surface, admin gate, Fourthwall write path removed |
| **v0.2.0** | 2026-10-06 | \`42786bb7\` | "Staged Catalogue" — nav from live stock, KB 1.4.1, merch launch, read-only \`/playground\`, theme sync |

> **\`v1.1.0\`–\`v1.5.0\` are NOT releases.** They are a **product roadmap** in \`lib/brand-config.ts\` and
> \`lib/docs-content.ts\` (omnichannel header, cross-domain SSO, palette sync, AR preview). Nothing is or
> will be tagged with them (trap **T24**). The public \`/docs\` still words them "Release v1.x" — **open**.

**\`v0.3.0\` "Launch Playground"** is a DRAFT, not started. Its blocker (**OQ1**) is *which Supabase
project* — and by design it **cannot launch anything**, because no API endpoint publishes a product.

## Architecture Phases

_Evidence: \`DEPLOYMENT_LOG.md\` — nine phases of the studio site_

| Phase | Window | Change |
| :--- | :--- | :--- |
| I | Aug 18–25 | Monolithic SPA |
| II | Sep 9–11 | Supabase data + media |
| III | Sep 11 | Serverless Express |
| IV | Sep 12 | Admin CMS |
| V | Sep 12 | Design system |
| VI | Sep 14 | Release engineering + schema-as-code |
| VII | Sep 14 | Studio ops |
| VIII | Sep 14 | Recoverability |
| IX | Sep 14–15 | Backup durability |

## The Visual History Tool

_Evidence: \`_archive/history/\` — a self-contained, generated visual changelog_

![Studio site at v3.1.0 — full home page](/docs/master-brief/archive/studio-v3.1.0-home.jpg)
_Studio site captured at v3.1.0 — a frame in the generated visual history._

![Studio admin — planning board](/docs/master-brief/archive/studio-v3.1.0-admin-planning.jpg)
_The studio's authenticated planning board ("Capture", v3.1.0)._

There is a **\`/history\` side project** — a frame-by-frame, image-first archive of every shipping
version, with a no-dependency generator (\`build-visual-log.mjs\`) and a Playwright capture tool. It was
built to be merged into the studio app as a \`#/about/history\` page.

| Flag | Item |
| :--- | :--- |
| **PASS TO CLIENT** | The visual history tool — a genuinely valuable provenance artefact |
| **OPEN** | It covers only \`v3.1.0\` so far; earlier versions are uncaptured |
`
  },

  'brief/accounts': {
    slug: "accounts",
    title: "Accounts, Services & Stack",
    description: "A single reference table for every account, vendor, project id, domain, and credential owner across the engagement.",
    badge: "Reference",
    category: "Master Brief",
    scope: 'brief',
    lastUpdated: LAST_UPDATED,
    tableOfContents: [
      { id: 'github', title: "GitHub", level: 2 },
      { id: 'vercel', title: "Vercel", level: 2 },
      { id: 'supabase', title: "Supabase", level: 2 },
      { id: 'fourthwall', title: "Fourthwall", level: 2 },
      { id: 'other-vendors', title: "Other Vendors", level: 2 },
      { id: 'stack-comparison', title: "Stack Comparison", level: 2 },
      { id: 'credential-handling', title: "Credential Handling", level: 2 }
    ],
    content: `# Accounts, Services & Stack

Every account below was created or is used by this engagement. **Identifiers only — no secret values
belong in any document.**

## GitHub

| | Value |
| :--- | :--- |
| Owner account | **\`roryskagenart\`** — a **User** account (not an org); owns 3 repos |
| Access actor | \`jadenblack\` — pull / push / triage ✓, **admin ✗** |
| Studio repo | \`roryskagenart/roryskagenart.com\` |
| Shop repo | \`roryskagenart/shop.roryskagenart.com\` — **public**; renamed 2026-10-03 from \`…shop.roryskagen.com\` |
| Superseded | \`jadenblack/roryskagenart.com\` — contractor fork holding PRs #1–#41 |
| Flag | **RETAIN INTERNALLY** — \`admin: false\` blocks branch protection; only the owner can add it |

> ⚠️ \`main\` on the shop repo **is protected** (verified 2026-10-06). \`admin: false\` also means
> \`GET /branches/main/protection\` returns **404** for the agent — indistinguishable from "not
> configured". Read the \`protected\` boolean instead.

## Vercel

| Project | Team / Account | Project id |
| :--- | :--- | :--- |
| \`roryskagenart.com\` (vite) | \`roryskagenart\` / \`roryskagen\` | \`prj_c8fk73LW7TWeai8uI5o86kilUM1h\` |
| \`shop.roryskagenart.com\` (nextjs) | \`roryskagenart\` / \`roryskagen\` | \`prj_u3hPHBRFkibIkIkthndzS1sjvhKJ\` |
| \`roryskagen\` (**legacy**) | \`ventureio\` (retired) | \`prj_6CRLwZ6q6TvSOKHUtpbMPKGWbkWS\` |
| Team id | — | \`team_lD7ZSbm44CpPmByF9eN22dJT\` |

- The shop project is **git-connected** and **push-to-deploy** — a push to \`main\` *is* a production deploy.
- **Domains.** \`shop.roryskagenart.com\` → DNS A \`64.29.17.65\`, \`216.198.79.65\`.
- **Legacy alias.** The retired project name \`roryskagen-5713/shop-roryskagen-com\` still has its
  \`.vercel.app\` alias attached, so the old name still resolves. **Compare \`prj_…\` ids, not names** (T43).
- **Env vars.** The studio project carries ~**28** env vars (12 sensitive + 16 legacy). The shop repo's
  \`.env.local\` holds \`VERCEL_PAT_SECRET\` and the Fourthwall tokens.

## Supabase

| | Value |
| :--- | :--- |
| Project ref | \`orphcusijzkxpxkzapjp\` |
| Used by | **Studio site only** — the shop has **no database** |
| Plan | **FREE** — no PITR, pauses after 7 days idle |
| Tables | 12 (incl. \`artworks\`, \`artwork_images\`, \`artwork_terms\`, \`media_assets\`, \`taxonomies\`, \`plan_items\`, \`plan_releases\`, \`profiles\`) |
| Storage | Bucket \`artwork-images\` — 1,109 objects after the mural load |
| Migrations | 18 files, runner \`scripts/run-migrations.ts\` (CLI migrations disabled) |
| Auth | Supabase Auth (email + password); roles admin/editor/viewer |

> ⚠️ The **shop repo must not be described as having a Supabase backend.** A common confusion: the
> Supabase project belongs to the *studio* site. The shop stores nothing.

| Flag | Item |
| :--- | :--- |
| **RETAIN INTERNALLY** | Backup/restore runbook, migration ledger |
| **OPEN** | Free plan has no PITR; owner declined Pro — a durability risk (**B1** on the shop plan) |
| **PASS TO CLIENT** | The account is Rory's |

## Fourthwall

| | Value |
| :--- | :--- |
| Storefront | \`https://roryskagenart-shop.fourthwall.com\` |
| Read API | \`https://storefront-api.fourthwall.com/v1\` — public token |
| Write API | \`https://api.fourthwall.com/open-api/v1.0\` — Basic auth or Bearer |
| Templates | 605 total · **274 backend-renderable** · **45 accept JPEG source** |
| Flag | **RETAIN INTERNALLY** — the measured API surface and its traps |

## Other Vendors

| Vendor | Role | Status |
| :--- | :--- | :--- |
| **Resend** | Transactional + studio email | Live (studio) |
| **Vercel Blob** | Off-site backup target | Live (studio) |
| **Cloudinary** | Legacy image host, \`res.cloudinary.com/xjilp2pq\` | **RETIRED** — exit shipped in v2.9.0 |
| **Wayback / archive.org** | Source of the recovered catalogue | Historical reference |
| Cloudflare · Shopify · Printful · Gelato · Klaviyo | Considered and **rejected** | **RETIRE** from planning docs |

## Stack Comparison

| Layer | Studio site | Shop |
| :--- | :--- | :--- |
| Framework | Vite 6 + React 19 SPA | Next.js 15 App Router |
| Server | Express 4 (serverless) | Next.js route handlers |
| Database | Supabase Postgres | none |
| Media | Supabase Storage + sharp | Fourthwall CDN |
| Docs | — | \`fumadocs-core\` + custom renderer |
| Tests | vitest | vitest (15 files, 224 tests) |
| CI | none | GitHub Actions \`ci.yml\` only |
| Installer | npm | **npm** (\`.npmrc\` \`legacy-peer-deps\`) — not bun/pnpm (T46) |

## Credential Handling

| Rule | Detail |
| :--- | :--- |
| **Never commit a secret** | \`.env.local\` holds live credentials; \`.env*\` is gitignored |
| Copy names, never values | Variable *names* may be documented; values may not |
| Shop repo is **public** | Reports must be redacted before commit — other clients' data is prohibited |

| Flag | Item |
| :--- | :--- |
| **RETAIN INTERNALLY** | All credential names, hosts, and traps |
| **PASS TO CLIENT** | Account ownership and access-recovery facts |
`
  },

  'brief/visual-map': {
    slug: "visual-map",
    title: "Visual Map",
    description: "Every captured screen across both properties — mockups, storefront screens, admin screens, and the visual history frames — with clearly marked WIP placeholders where evidence was not captured.",
    badge: "Screens",
    category: "Master Brief",
    scope: 'brief',
    lastUpdated: LAST_UPDATED,
    tableOfContents: [
      { id: 'capture-status', title: "Capture Status", level: 2 },
      { id: 'shop-storefront', title: "Shop — Storefront", level: 2 },
      { id: 'shop-playground-product', title: "Shop — Playground & Product", level: 2 },
      { id: 'fourthwall-hosted-surfaces', title: "Fourthwall Hosted Surfaces", level: 2 },
      { id: 'studio-archive', title: "Studio Archive", level: 2 },
      { id: 'brand-assets', title: "Brand Assets", level: 2 },
      { id: 'wip-placeholders', title: "WIP Placeholders", level: 2 }
    ],
    content: `# Visual Map

## Capture Status

This is the visual validation surface for the engagement. **Real screenshots where they exist; clearly
marked WIP placeholders where they do not.** Nothing here is a mockup pretending to be a screen.

> **Note on full-page captures.** Several sources are full-page screenshots many thousands of pixels
> tall (one studio capture is 3243 × 17987). They are stored here **cropped to the top region and
> downscaled to 1400px wide** — which is the part the card actually displays — so the asset set stays
> ~2.4 MB instead of ~85 MB. The uncropped originals remain in the sibling workspace
> (\`business/\`, \`roryskagenart.com/.shots/\`, \`_archive/history/\`).

| Surface | Status |
| :--- | :--- |
| Shop storefront (home, header, gallery) | ✅ Captured |
| Shop \`/playground\` | ✅ Captured |
| Fourthwall hosted storefront | ✅ Captured |
| Studio archive (light + dark home) | ✅ Captured |
| Studio admin (planning board) | ✅ Captured |
| Studio visual history (\`v3.1.0\`) | ✅ Captured |
| Brand assets (logo, profile, mural) | ✅ Captured |
| Studio admin — full surface set | ⚠️ **WIP** — 23 frames exist in \`_archive/history/v3.1.0/\`; only 3 inlined here |
| Shop \`/docs\` before this brief | ⚠️ **WIP** — no capture committed |
| Excalidraw / architecture diagrams | ⚠️ **WIP** — only ASCII diagrams exist in-repo |

## Shop — Storefront

![Storefront home — top section](/docs/master-brief/shop/storefront-home.png)
_Home page, top region: hero focus-pull, "Works For Sale", artist statement._

![Storefront header](/docs/master-brief/shop/storefront-header.png)
_The two-tier header. Live counters read "73 Works Catalogued / 28 Available Now"._

![Storefront gallery — light theme](/docs/master-brief/shop/storefront-gallery-light.png)
_Gallery surfaces with the series rail and a real filter row._

## Shop — Playground & Product

![Template Playground — read-only](/docs/master-brief/shop/playground.png)
_\`/playground\`: a read-only template explorer. Note the fidelity banner — only 45 of 605 templates accept
a JPEG source, and 229 need a transparent PNG the artist cannot produce._

![Product purchase surface — dark](/docs/master-brief/shop/product-purchase.png)
_A purchasable product page in the Skagen dark palette._

## Fourthwall Hosted Surfaces

![Fourthwall hosted storefront home](/docs/master-brief/shop/fourthwall-shop-home.png)
_The vendor-hosted storefront — The Goods · Wall Art · Studio Editions · Original Artwork._

![Fourthwall product templates gallery](/docs/master-brief/shop/fw-product-templates.png)
_The 605-template gallery that constrains all merch work._

## Studio Archive

![Studio archive home](/docs/master-brief/studio/studio-home.png)
_Studio archive home — fine art, murals, individual works, curated series._

![Studio archive home in dark theme](/docs/master-brief/studio/studio-home-dark.png)
_The same page in the Charcoal Gallery palette._

![Studio v3.1.0 home — archived frame](/docs/master-brief/archive/studio-v3.1.0-home.jpg)
_Frame from the generated visual history at v3.1.0._

![Studio v3.1.0 navbar region](/docs/master-brief/archive/studio-v3.1.0-navbar.jpg)
_Element-clipped region: the navbar as captured by the history tool._

![Studio admin planning board](/docs/master-brief/archive/studio-v3.1.0-admin-planning.jpg)
_The authenticated planning board ("Capture") — the studio's own feedback loop._

## Brand Assets

![Rory Skagen Art logo](/docs/master-brief/brand/logo.jpg)
_The wordmark and identity used across both properties._

![Rory Skagen — portrait](/docs/master-brief/brand/profile.jpg)
_Portrait asset for the About surface._

![Greetings from Austin — 1998 mural](/docs/master-brief/brand/greetings-mural.jpg)
_*Greetings from Austin* (1998) — the artist's best-known landmark mural, and a Sold piece._

> ⚠️ **"Greetings from Austin" is a structural constraint, not just a nice image.** It is *Sold*, and its
> source file is 576×376 — below the local 1500px merch gate. Any "Austin Iconic" merchandise promise is
> currently **unfulfillable** from that artwork.

## WIP Placeholders

The following are **deliberately left as placeholders** rather than filled with invented content:

\`\`\`text
┌─────────────────────────────────────────────────────┐
│  WIP — STUDIO ADMIN FULL SURFACE SET                │
│  Source: _archive/history/v3.1.0/**/*.jpg (23 files)│
│  Missing: catalog, inquiries, pages, media,         │
│           taxonomies, users, settings, design,      │
│           trash, changelog, dashboard               │
│  Action: inline on request, or host the generated   │
│          index.html as a route                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  WIP — ARCHITECTURE DIAGRAM                         │
│  No Excalidraw / SVG / draw.io file exists in       │
│  either repo. Only ASCII diagrams in README.md and  │
│  the roadmaps.                                      │
│  Action: author a real diagram of the two-property  │
│          estate + the Fourthwall data flow          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  WIP — MOBILE / RESPONSIVE CAPTURES                 │
│  Desktop-only captures exist. No 390px frame was    │
│  committed for either property.                     │
└─────────────────────────────────────────────────────┘
\`\`\`

| Flag | Item |
| :--- | :--- |
| **PASS TO CLIENT** | The storefront + studio screens — this is the visual validation they asked for |
| **WIP** | Architecture diagram, admin surface set, mobile frames |
`
  },

  'brief/client-ip': {
    slug: "client-ip",
    title: "Client IP Register",
    description: "What in this engagement is Rory Skagen's creative IP versus internal engineering scaffolding — and what actually passes to the client.",
    badge: "Handover",
    category: "Assessment",
    scope: 'brief',
    lastUpdated: LAST_UPDATED,
    tableOfContents: [
      { id: 'what-counts-as-client-ip', title: "What Counts as Client IP", level: 2 },
      { id: 'rory-s-creative-ip', title: "Rory's Creative IP", level: 2 },
      { id: 'client-facing-platform-work', title: "Client-Facing Platform Work", level: 2 },
      { id: 'internal-scaffolding', title: "Internal Scaffolding", level: 2 },
      { id: 'third-party-ip', title: "Third-Party IP", level: 2 }
    ],
    content: `# Client IP Register

## What Counts as Client IP

Three distinct categories exist in this engagement, and they must not be blended when handing over:

1. **Rory's creative IP** — the artwork, the writing, the brand. Owned by Rory.
2. **Client-facing platform work** — the software built for him. Yours/his per contract; he should own
   the accounts.
3. **Internal engineering scaffolding** — agent knowledge bases, trap registers, verification tooling.
   Yours. Not a deliverable and not Rory's property.

## Rory's Creative IP

| Asset | Where it lives | Flag |
| :--- | :--- | :--- |
| **205 artworks** — titles, narratives, years, provenance | Studio Supabase \`artworks\` | **PASS TO CLIENT** |
| **168 artwork images** + 320 media assets | Supabase Storage \`artwork-images\` | **PASS TO CLIENT** |
| **The mural catalogue** (60 murals, 7 paintings) | Studio DB (v3.0.0 merge) | **PASS TO CLIENT** |
| **137 fine-art catalogue** (titles, dimensions, status) | Shop \`lib/fourthwall/rory-artworks-data.json\` | **PASS TO CLIENT** |
| **15 originals** | Shop \`lib/fourthwall/originals-data.json\` | **PASS TO CLIENT** |
| **Copy & taxonomy** — 7 collections, 5 buyer personas, 4 art series | \`lib/taxonomy.ts\`, \`lib/docs-content.ts\` | **PASS TO CLIENT** |
| **Brand identity** — logo, wordmark, palette, legal name | \`lib/brand-config.ts\`, \`business/brand/\` | **PASS TO CLIENT** |
| **Legacy site archives** — roryskagen.com, centraltexasmurals.com | \`wayback/\`, \`_archive/\` | **PASS TO CLIENT** |
| **Legal name** | Rory Skagen Art Studio LLC | **PASS TO CLIENT** |

> **One caution on IP:** the shop's *published* merch is currently tiny — **6 products across 3
> collections**. The 137-work JSON is a **fallback dataset**, and the 205-work studio catalogue is the
> real corpus. Do not describe the shop as "selling 137 works".

## Client-Facing Platform Work

| Asset | Why it is client-facing | Flag |
| :--- | :--- | :--- |
| **Both live sites** | The product itself | **PASS TO CLIENT** |
| **Studio CMS** (roles, plan board, backup) | Rory operates it daily | **PASS TO CLIENT** |
| **Visual history tool** (\`_archive/history/\`) | Provenance artefact for the artist | **PASS TO CLIENT** |
| **Hosted storefront products** (6 + 3 collections) | Live inventory on Fourthwall | **PASS TO CLIENT** |
| **Deployment log / release ledger** | Useful, and it is a record of work done | **PASS TO CLIENT** |
| **Business docs** — art registry, monetisation plan | Client strategy work | **PASS TO CLIENT** |
| \`docs/releases/plans/*_DRAFT.md\` | Forward-looking; share only the decided parts | **RETAIN INTERNALLY** |

## Internal Scaffolding

Not deliverables. Useful to the next engineer, invisible to the client.

| Asset | Where | Flag |
| :--- | :--- | :--- |
| Agent KB (protocols, stack, skills) | \`docs/agentic/\` | **RETAIN INTERNALLY** |
| **Trap register T01–T51** | \`docs/agentic/traps/register.md\` | **RETAIN INTERNALLY** |
| Verification gates + baseline | \`docs/agentic/scripts/\` | **RETAIN INTERNALLY** |
| Seeder / playground internals | \`lib/fw-seeder/\`, \`lib/playground/\` | **RETAIN INTERNALLY** |
| Migration + backup scripts | \`scripts/\`, \`supabase/migrations/\` | **RETAIN INTERNALLY** |
| Test suites | 15 files / 224 tests (shop) | **RETAIN INTERNALLY** |
| Session records, retrospectives | \`docs/agentic/sessions/\`, \`docs/reports/\` | **RETAIN INTERNALLY** |
| Cached artwork thumbnails (~120) | \`.workbuddy-ai/scripts/cat-cache/\` | **RETAIN INTERNALLY** |

> ⚠️ **The shop repo is public.** \`docs/reports/README.md\` mandates redacting any other client's or
> project's data before committing a report. Any handover pack assembled from this repo must be
> audited for that first.

## Third-Party IP

| Asset | Owner | Handling |
| :--- | :--- | :--- |
| Fourthwall templates & product mockups | Fourthwall | Vendor IP — do not redistribute |
| Product photography on templates | Fourthwall | Vendor IP |
| WordPress plugins/themes in \`wayback/\` | Their respective authors | **RETIRE** — do not ship forward |

| Flag | Item |
| :--- | :--- |
| **PASS TO CLIENT** | Artwork data, brand, live sites, visual history, business docs |
| **RETAIN INTERNALLY** | All agent KB, traps, tooling, tests, session records |
| **RETIRE** | Bundled WordPress theme/plugin assets inside the Wayback captures |
`
  },

  'brief/handover': {
    slug: "handover",
    title: "Value & Handover Flags",
    description: "Every substantive item in the engagement, flagged: pass to client, retain internally, retire, or open.",
    badge: "Decisions",
    category: "Assessment",
    scope: 'brief',
    lastUpdated: LAST_UPDATED,
    tableOfContents: [
      { id: 'flag-summary', title: "Flag Summary", level: 2 },
      { id: 'highest-value-items', title: "Highest-Value Items", level: 2 },
      { id: 'retire-list', title: "Retire List", level: 2 },
      { id: 'dormant-assets', title: "Dormant Assets", level: 2 }
    ],
    content: `# Value & Handover Flags

## Flag Summary

| Flag | Count | Meaning |
| :--- | ---: | :--- |
| **PASS TO CLIENT** | 21 | Rory's IP or a client-facing fact he should own |
| **RETAIN INTERNALLY** | 17 | Engineering artefact; useful to the next engineer |
| **RETIRE** | 9 | Superseded, dead, or a trap not worth carrying forward |
| **OPEN** | 24 | Live / unfinished / undecided — needs an owner |
| **WIP** | 5 | Evidence not yet captured |

## Highest-Value Items

Ranked by what genuinely matters if this engagement is handed over tomorrow.

| # | Item | Why it matters | Flag |
| :-- | :--- | :--- | :--- |
| 1 | **The 205-work catalogue in Supabase** | The studio's entire digital asset | PASS |
| 2 | **The recovered mural catalogue** (v3.0.0) | Took the site from half the practice to the whole practice | PASS |
| 3 | **The 11 missing + 15 renamed artworks** | A concrete content gap only Rory can resolve | PASS |
| 4 | **The visual history tool** | Rare provenance artefact, already built | PASS |
| 5 | **The Fourthwall integration + trap register** | The hard-won knowledge that makes merch work | RETAIN |
| 6 | **The studio CMS** (roles, plan board, backup) | Rory operates it every day | PASS |
| 7 | **Business docs** — art registry, monetisation plan | Strategy work already done | PASS |
| 8 | **The verification gates + baseline** | What keeps both repos from regressing | RETAIN |
| 9 | **The two-property naming reference** | Prevents a whole class of mistake | RETAIN |
| 10 | **The brand assets** (logo, palette, mural imagery) | Reused across every surface | PASS |

## Retire List

Items that are dead, superseded, or actively misleading. **Retire from the *current* narrative — keep
the historical record where it is genuinely provenance.**

| Item | Why retire | Note |
| :--- | :--- | :--- |
| \`git remote -v\` stale \`.com\` URL | Resolves only via GitHub's rename redirect | Human decision; rule 4 |
| \`roryskagen/roryskagenart\` repo references | The path **404s** | Real repo is \`roryskagenart/roryskagenart.com\` |
| \`v1.x\` in \`brand-config.ts\` / \`docs-content.ts\` | A roadmap, **not** releases | **T24** — still mislabelled "Release v1.x" publicly |
| \`/docs\` palette table rows | Documents retired tokens ("Gallery Stone", "Charcoal Gallery") | **T42** — \`app/globals.css\` is truth |
| Cloudinary references | Host retired in v2.9.0 | Keep in the changelog as *history* |
| \`FOURTHWALL_WEBHOOK_SECRET\`, \`GITHUB_KEY\` | Dead config that looks live | **T26** |
| \`@google/genai\` dependency | Nothing imports it | Dead dependency |
| Bundled WordPress theme/plugin assets | Third-party, only present inside Wayback captures | Do not ship forward |
| Cloudflare / Shopify / Printful / Gelato / Klaviyo | Considered and rejected | Keep as a decision record only |

## Dormant Assets

Built, working, but not currently surfaced or linked. Worth a decision rather than a deletion.

| Asset | State |
| :--- | :--- |
| \`_archive/history/\` visual history tool | Complete for v3.1.0; never merged into a route |
| \`/collections/fine-art-originals\` | Live, reachable, **unlinked from any menu** — and fabricated (**T01**) |
| \`studio-editions\` collection (4 mugs) | Live in nav; renamed from \`coffeemugs\`; \`taxonomy.ts\` now stale |
| 60 mural artworks | Loaded but **draft/unpublished** — not in the sitemap |
| \`docs/reports/\` (1 report) | Written; not surfaced anywhere |
| \`dashboard/\` sibling dir | Separate program; unrelated to this engagement |

| Flag | Item |
| :--- | :--- |
| **OPEN** | Decide each dormant asset: surface it, retain it, or retire it |
`
  },

  'brief/open-items': {
    slug: "open-items",
    title: "Open Items & Risks",
    description: "Everything unfinished, broken, or undecided across both repos — with a recommendation where one exists.",
    badge: "Live",
    category: "Assessment",
    scope: 'brief',
    lastUpdated: LAST_UPDATED,
    tableOfContents: [
      { id: 'critical', title: "Critical", level: 2 },
      { id: 'high', title: "High", level: 2 },
      { id: 'medium', title: "Medium", level: 2 },
      { id: 'cross-repo-convention', title: "Cross-Repo / Convention", level: 2 },
      { id: 'trap-register-status', title: "Trap Register Status", level: 2 }
    ],
    content: `# Open Items & Risks

Every item below is **live and unresolved**. Nothing here is a fix — this is the register.

## Critical

| Item | Where | Why critical | Recommendation |
| :--- | :--- | :--- | :--- |
| **T01 fabricated catalogue** | \`lib/fourthwall/index.ts\` | Visitors can add **$28,000** of nonexistent art to a cart; every page returns 200 | **Delete the fallback JSON**, do not guard it |
| **T14 \`/checkout/\` is ungated** | Fourthwall | The password gate blocks *discovery*, not *purchase* | Confirm the gate's actual scope with Fourthwall |
| **60 mural artworks unpublished** | Studio DB | Half the practice is invisible in production | Owner publish pass (P-02) |
| **Supabase free plan, no PITR** | Studio | Data loss is unrecoverable | Owner declined Pro; the risk is *accepted, not resolved* |

## High

| Item | Where | Recommendation |
| :--- | :--- | :--- |
| **T37 no publish endpoint** | Fourthwall Platform API | Dashboard-only. Every launcher ends at \`AWAITING_MANUAL_PUBLISH\` — design accordingly |
| **T39 orphan product still listed** | Fourthwall | Remove from the collection; archiving alone does not hide it |
| **8 source artworks below the 1500px gate** | Shop JSON | Only 4 of 42 Available clear it; commission rescans |
| **"Greetings from Austin" is 576×376** | Shop JSON | The Austin-icon promise is unfulfillable from that file |
| **\`artworks.year\` hardcoded \`'2024'\`** | Studio \`server/routes/artworks.ts\` | 79 rows disagree with the archive — needs sign-off (Q18) |
| **Unpushed studio work** | Studio \`main\` | \`8742f65\` + \`ca961bd\` are local-only, no PR |

## Medium

| Item | Where | Recommendation |
| :--- | :--- | :--- |
| **T42 \`/docs\` palette table** | \`lib/docs-content.ts\` | Rewrite from \`app/globals.css\` — it documents retired tokens |
| **T24 \`v1.x\` "Release" labels** | \`lib/docs-content.ts\` | Reword to "Roadmap" |
| **T31 prettier never green** | repo-wide | 91 of 103 files; advisory only — keep it out of CI |
| **T41 baseline drift** | \`docs/\` | Fixed via \`baseline.env\` + \`check-baseline.sh\`; still **not in CI** |
| **T49 guard missing** | \`register.md\` | Write the \`-brand-[a-z-]+/[0-9]+\` scan |
| **\`assetRegistry.ts\` ~987 KB** | Studio bundle | Shipped to every visitor; pagination promise unfulfilled (R-20) |
| **Cache-Control 1h not 1y** | Studio storage | 604 of 1109 objects — a bandwith/perf issue |
| **Dangling \`artwork_slug\`** | Studio DB | 10 \`media_assets\` rows (\`wisdom-cofee\`, \`kelzon-5\`) |
| **\`bundleSafety.test.ts\` fails** | Studio | 4 tests, pre-existing, unrelated to releases |

## Cross-Repo / Convention

| Item | Detail | Recommendation |
| :--- | :--- | :--- |
| **Tag placement** | Both repos tag the **merge commit** | Never tag the pre-merge tip |
| **Squash merges** | Every studio merge is a squash | \`--merged\` lies; prove with a tree diff |
| **Canonical studio repo** | \`roryskagenart\` carries v3.2.1; \`jadenblack\` carries PR history | **Decide** before v3.3.0 |
| **Shop CI gap** | No baseline guard in \`ci.yml\` | Add \`check-baseline.sh\` |
| **Shop has no Release objects** | Tags exist, GitHub Releases do not | Decide whether to create them |
| **Skill duplication** | 13 skills in \`docs/agentic/skills/\` **and** \`~/.workbuddy-ai/skills/\` | No sync guard — a drift risk |

## Trap Register Status

The shop repo maintains **51 measured traps** (T01–T51). Current distribution:

| Status | Count |
| :--- | ---: |
| **OPEN** | 33 |
| **MITIGATED** | 5 |
| **RESOLVED** | 9 |
| **PARTIAL** | 1 |

> **A trap is not a bug list.** Each entry records a *measurement* that proved the behaviour, so the
> next engineer does not re-derive it. Read \`docs/agentic/traps/register.md\` before touching
> Fourthwall, the gates, or the release flow.

| Flag | Item |
| :--- | :--- |
| **OPEN** | 33 traps — the register is the tracking surface, not this brief |
| **PASS TO CLIENT** | Only the *business-visible* ones (T01, T14, the 60 drafts, the year question) |
`
  }
};
