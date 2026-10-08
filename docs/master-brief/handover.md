---
title: "Value & Handover Flags"
description: "Every substantive item in the engagement, flagged: pass to client, retain internally, retire, or open."
badge: "Decisions"
category: "Assessment"
slug: "handover"
order: 7
nav: "Value & Handover Flags"
navBadge: "Decisions"
---
# Value & Handover Flags

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
| `git remote -v` stale `.com` URL | Resolves only via GitHub's rename redirect | Human decision; rule 4 |
| `roryskagen/roryskagenart` repo references | The path **404s** | Real repo is `roryskagenart/roryskagenart.com` |
| `v1.x` in `brand-config.ts` / `docs-content.ts` | A roadmap, **not** releases | **T24** — still mislabelled "Release v1.x" publicly |
| `/docs` palette table rows | Documents retired tokens ("Gallery Stone", "Charcoal Gallery") | **T42** — `app/globals.css` is truth |
| Cloudinary references | Host retired in v2.9.0 | Keep in the changelog as *history* |
| `FOURTHWALL_WEBHOOK_SECRET`, `GITHUB_KEY` | Dead config that looks live | **T26** |
| `@google/genai` dependency | Nothing imports it | Dead dependency |
| Bundled WordPress theme/plugin assets | Third-party, only present inside Wayback captures | Do not ship forward |
| Cloudflare / Shopify / Printful / Gelato / Klaviyo | Considered and rejected | Keep as a decision record only |

## Dormant Assets

Built, working, but not currently surfaced or linked. Worth a decision rather than a deletion.

| Asset | State |
| :--- | :--- |
| `_archive/history/` visual history tool | Complete for v3.1.0; never merged into a route |
| `/collections/fine-art-originals` | Live, reachable, **unlinked from any menu** — and fabricated (**T01**) |
| `studio-editions` collection (4 mugs) | Live in nav; renamed from `coffeemugs`; `taxonomy.ts` now stale |
| 60 mural artworks | Loaded but **draft/unpublished** — not in the sitemap |
| `docs/reports/` (1 report) | Written; not surfaced anywhere |
| `dashboard/` sibling dir | Separate program; unrelated to this engagement |

| Flag | Item |
| :--- | :--- |
| **OPEN** | Decide each dormant asset: surface it, retain it, or retire it |
