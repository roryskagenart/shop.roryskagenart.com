---
title: "Master Brief — Index & Visual Map"
description: "The single consolidated brief for the Rory Skagen engagement: both web properties, every version, every account, and what is worth passing to the client."
badge: "Master Brief"
category: "Master Brief"
slug: "overview"
order: 1
nav: "Brief Home & Index"
navBadge: "Start here"
---
# Master Brief — Rory Skagen Engagement

_Consolidated 2026-10-08 · covers both repositories (shop + studio) · status: reference_

## Purpose & Scope

This is the **combined client IP, project, and reference brief** for everything built for artist
**Rory Skagen** (Austin, Texas). It distills three sources that were previously scattered:

- **This repo** (`shop.roryskagenart.com`) — the **merch storefront**, a Next.js 15 storefront over a
  Fourthwall catalogue.
- **The sibling repo** (`roryskagenart.com`) — the **studio archive & catalog raisonné**, a Vite/React +
  Supabase CMS.
- **The shared client workspace** (`clients/roryskagen/`) — `business/` (brand, monetisation, art
  registry), `fourthwall/` (catalogue analysis), `dashboard/`, `_archive/` (Wayback captures and the
  visual history tool).

It exists so that a new contributor — human or agent — can understand the whole engagement without
re-reading ~250 commits and two agent knowledge bases.

> **This brief documents. It does not change anything.** Where it records an open defect or an
> unfinished item, that item is owned elsewhere (see *Open Items & Risks*) — nothing here is a fix.

## The Engagement at a Glance

| | Studio archive site | Merch storefront (this repo) |
| :--- | :--- | :--- |
| **Domain** | `roryskagenart.com` | `shop.roryskagenart.com` |
| **Purpose** | Catalogue raisonné + studio CMS | Sell prints, candles, mugs, editions |
| **Stack** | Vite 6 / React 19 + Express + Supabase | Next.js 15 / React 19 App Router |
| **Host** | Vercel `prj_c8fk73LW7TWeai8uI5o86kilUM1h` | Vercel `prj_u3hPHBRFkibIkIkthndzS1sjvhKJ` |
| **GitHub** | `roryskagenart/roryskagenart.com` | `roryskagenart/shop.roryskagenart.com` |
| **Data** | Supabase Postgres `orphcusijzkxpxkzapjp` | Fourthwall (no database) |
| **Commerce** | None (browse-only showcase) | Fourthwall — `roryskagenart-shop.fourthwall.com` |
| **Release scheme** | `v2.x` → `v3.2.1` (15 tags) | `v0.x.y` (2 tags) |
| **Commits** | 169 | see release ledger |
| **State** | Live, 205 artworks loaded | Live, 6 products + 3 collections published |

The two sites intentionally share **one visual identity** (the "Skagen" palette, logo, and wordmark) but
**no database and no deployment**. A change to one does not deploy the other.

## Visual Map

A one-glance index of the real screens captured across the engagement. Full-size images and captions
live in **Visual Map**.

![Merch storefront — gallery-first home page](../../public/docs/master-brief/shop/storefront-home.png)
_Shop storefront: the gallery-first home page as shipped._

![Studio archive — home page](../../public/docs/master-brief/studio/studio-home.png)
_Studio archive (roryskagenart.com): catalogue-raisonné home with the recovered mural catalogue._

![Fourthwall live storefront](../../public/docs/master-brief/shop/fourthwall-shop-home.png)
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
