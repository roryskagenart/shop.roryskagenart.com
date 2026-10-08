---
title: "Origins & Version History"
description: "1998 → today: Rory's predecessor websites, the Wayback recoveries, and the full release ledger for both repositories."
badge: "1998 → 2026"
category: "Master Brief"
slug: "origins"
order: 3
nav: "Origins & Version History"
navBadge: "1998 → 2026"
---
# Origins & Version History

## Predecessor Web Presence

Rory's online presence predates this engagement by decades. Three predecessor properties were
recovered and mined for content:

| Site | Era | Type | What it held |
| :--- | :--- | :--- | :--- |
| **roryskagen.com** | WordPress "Berlin" theme | Fine-art portfolio, 11 series; a PayPal merch shop frozen c. 2016 | 144 artwork pages |
| **centraltexasmurals.com** | WordPress "Modularity" | Mural projects — business, restaurant, museum, retail, signage, event | Mural portfolio |
| **centraltexasmuralsbyroryskagen** | **WP 6.4.2 live export**, timestamped 2023-12-17 | Full DB export (`vio_wp_centexmurals`), not a scrape | 63 posts, ~350 originals |

> The studio's mural practice is as significant as its fine art. The v3.0.0 merge is what finally put
> murals on the site — before that, the catalogue was fine art only (**T-adjacent**: the site described
> only half the practice).

## The Wayback Recovery

_Evidence: `wayback/`, `plan/PRD_V3_WAYBACK_DATA_MIGRATION.md`, `plan/RECON_V3_0_0_RECOVERED_SOURCE.md`_

The studio site's v3.0.0 release was built on a **recovered-source ingest**: the old WordPress export
was parsed into 67 artworks (60 murals + 7 paintings), 168 media objects, 168 `artwork_images` rows,
142 `artwork_terms`, and 10 taxonomies — taking the studio database from **307 → 862 rows**.

A verified comparison of the old and new catalogues found:

- **144** artwork URLs on the legacy `roryskagen.com` vs **138** on the rebuilt site.
- **132 matched**, 1 duplicate, **11 genuinely missing** (e.g. *Stewed Gorilla*, *Jimmy's Dilemma*, 4
  monsters, *Lobedicus*).
- **15 renames** (e.g. `ISSY` → *Issy: The Atomic Companion*, `regador-5` → *Regador V*).
- 9 of the 11 missing items already had images staged in the new bundle.

**Catalog numbers — use these, in this order of authority:**

| Number | Meaning | Status |
| :--- | :--- | :--- |
| **205** | Current `artworks` rows (studio DB) | **Authoritative** |
| **138** | The v2 fine-art catalogue | Canonical for v2 era |
| **144** | Legacy roryskagen.com artwork URLs | Historical |
| **137** | Cloudinary-era count | **Historical only** — do not quote as current |

| Flag | Item |
| :--- | :--- |
| **PASS TO CLIENT** | The 11 missing artworks + 15 renames — a content decision for Rory |
| **OPEN** | `artworks.year` is hardcoded `'2024'` on all 138 legacy rows; 79 disagree with the archive (Q18) |

## Studio Site — Release Ledger

_Evidence: `CHANGELOG.md`, `DEPLOYMENT_LOG.md`, `git tag` — 15 tags_

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

_Evidence: `docs/releases/RELEASES.md` · tags go on the **merge commit**_

| Version | Date | Commit | Shipped |
| :--- | :--- | :--- | :--- |
| **v0.1.0** | 2026-10-01 | `31e47f2` | Truthful import surface, admin gate, Fourthwall write path removed |
| **v0.2.0** | 2026-10-06 | `42786bb7` | "Staged Catalogue" — nav from live stock, KB 1.4.1, merch launch, read-only `/playground`, theme sync |

> **`v1.1.0`–`v1.5.0` are NOT releases.** They are a **product roadmap** in `lib/brand-config.ts` and
> `lib/docs-content.ts` (omnichannel header, cross-domain SSO, palette sync, AR preview). Nothing is or
> will be tagged with them (trap **T24**). The public `/docs` still words them "Release v1.x" — **open**.

**`v0.3.0` "Launch Playground"** is a DRAFT, not started. Its blocker (**OQ1**) is *which Supabase
project* — and by design it **cannot launch anything**, because no API endpoint publishes a product.

## Architecture Phases

_Evidence: `DEPLOYMENT_LOG.md` — nine phases of the studio site_

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

_Evidence: `_archive/history/` — a self-contained, generated visual changelog_

![Studio site at v3.1.0 — full home page](../../public/docs/master-brief/archive/studio-v3.1.0-home.jpg)
_Studio site captured at v3.1.0 — a frame in the generated visual history._

![Studio admin — planning board](../../public/docs/master-brief/archive/studio-v3.1.0-admin-planning.jpg)
_The studio's authenticated planning board ("Capture", v3.1.0)._

There is a **`/history` side project** — a frame-by-frame, image-first archive of every shipping
version, with a no-dependency generator (`build-visual-log.mjs`) and a Playwright capture tool. It was
built to be merged into the studio app as a `#/about/history` page.

| Flag | Item |
| :--- | :--- |
| **PASS TO CLIENT** | The visual history tool — a genuinely valuable provenance artefact |
| **OPEN** | It covers only `v3.1.0` so far; earlier versions are uncaptured |
