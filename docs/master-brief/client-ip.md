---
title: "Client IP Register"
description: "What in this engagement is Rory Skagen's creative IP versus internal engineering scaffolding — and what actually passes to the client."
badge: "Handover"
category: "Assessment"
slug: "client-ip"
order: 6
nav: "Client IP Register"
navBadge: "Handover"
---
# Client IP Register

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
| **205 artworks** — titles, narratives, years, provenance | Studio Supabase `artworks` | **PASS TO CLIENT** |
| **168 artwork images** + 320 media assets | Supabase Storage `artwork-images` | **PASS TO CLIENT** |
| **The mural catalogue** (60 murals, 7 paintings) | Studio DB (v3.0.0 merge) | **PASS TO CLIENT** |
| **137 fine-art catalogue** (titles, dimensions, status) | Shop `lib/fourthwall/rory-artworks-data.json` | **PASS TO CLIENT** |
| **15 originals** | Shop `lib/fourthwall/originals-data.json` | **PASS TO CLIENT** |
| **Copy & taxonomy** — 7 collections, 5 buyer personas, 4 art series | `lib/taxonomy.ts`, `lib/docs-content.ts` | **PASS TO CLIENT** |
| **Brand identity** — logo, wordmark, palette, legal name | `lib/brand-config.ts`, `business/brand/` | **PASS TO CLIENT** |
| **Legacy site archives** — roryskagen.com, centraltexasmurals.com | `wayback/`, `_archive/` | **PASS TO CLIENT** |
| **Legal name** | Rory Skagen Art Studio LLC | **PASS TO CLIENT** |

> **One caution on IP:** the shop's *published* merch is currently tiny — **6 products across 3
> collections**. The 137-work JSON is a **fallback dataset**, and the 205-work studio catalogue is the
> real corpus. Do not describe the shop as "selling 137 works".

## Client-Facing Platform Work

| Asset | Why it is client-facing | Flag |
| :--- | :--- | :--- |
| **Both live sites** | The product itself | **PASS TO CLIENT** |
| **Studio CMS** (roles, plan board, backup) | Rory operates it daily | **PASS TO CLIENT** |
| **Visual history tool** (`_archive/history/`) | Provenance artefact for the artist | **PASS TO CLIENT** |
| **Hosted storefront products** (6 + 3 collections) | Live inventory on Fourthwall | **PASS TO CLIENT** |
| **Deployment log / release ledger** | Useful, and it is a record of work done | **PASS TO CLIENT** |
| **Business docs** — art registry, monetisation plan | Client strategy work | **PASS TO CLIENT** |
| `docs/releases/plans/*_DRAFT.md` | Forward-looking; share only the decided parts | **RETAIN INTERNALLY** |

## Internal Scaffolding

Not deliverables. Useful to the next engineer, invisible to the client.

| Asset | Where | Flag |
| :--- | :--- | :--- |
| Agent KB (protocols, stack, skills) | `docs/agentic/` | **RETAIN INTERNALLY** |
| **Trap register T01–T51** | `docs/agentic/traps/register.md` | **RETAIN INTERNALLY** |
| Verification gates + baseline | `docs/agentic/scripts/` | **RETAIN INTERNALLY** |
| Seeder / playground internals | `lib/fw-seeder/`, `lib/playground/` | **RETAIN INTERNALLY** |
| Migration + backup scripts | `scripts/`, `supabase/migrations/` | **RETAIN INTERNALLY** |
| Test suites | 15 files / 224 tests (shop) | **RETAIN INTERNALLY** |
| Session records, retrospectives | `docs/agentic/sessions/`, `docs/reports/` | **RETAIN INTERNALLY** |
| Cached artwork thumbnails (~120) | `.workbuddy-ai/scripts/cat-cache/` | **RETAIN INTERNALLY** |

> ⚠️ **The shop repo is public.** `docs/reports/README.md` mandates redacting any other client's or
> project's data before committing a report. Any handover pack assembled from this repo must be
> audited for that first.

## Third-Party IP

| Asset | Owner | Handling |
| :--- | :--- | :--- |
| Fourthwall templates & product mockups | Fourthwall | Vendor IP — do not redistribute |
| Product photography on templates | Fourthwall | Vendor IP |
| WordPress plugins/themes in `wayback/` | Their respective authors | **RETIRE** — do not ship forward |

| Flag | Item |
| :--- | :--- |
| **PASS TO CLIENT** | Artwork data, brand, live sites, visual history, business docs |
| **RETAIN INTERNALLY** | All agent KB, traps, tooling, tests, session records |
| **RETIRE** | Bundled WordPress theme/plugin assets inside the Wayback captures |
