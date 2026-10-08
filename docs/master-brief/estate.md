---
title: "The Two Sites — Estate Overview"
description: "Two deliberately separate web properties — the studio archive/catalogue and the merch storefront — and why they must not be conflated."
badge: "Estate"
category: "Master Brief"
slug: "estate"
order: 2
nav: "The Two Sites"
navBadge: "2 properties"
---
# The Two Sites

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

_Evidence: `roryskagenart.com` repo · 169 commits · live_

![Studio archive home page](../../public/docs/master-brief/studio/studio-home.png)
_Studio archive home — "Pop Surrealism from the roadside imagination"._

![Studio archive in dark theme](../../public/docs/master-brief/studio/studio-home-dark.png)
_The same home page in the studio's Charcoal Gallery dark palette._

| Aspect | Value |
| :--- | :--- |
| Role | Catalogue raisonné, mural archive, studio CMS |
| Stack | Vite 6, React 19, Tailwind v4, Express 4, Supabase Postgres |
| Content | **205 artworks** (138 fine art + 67 murals/paintings), 168 artwork images, 142 terms |
| Admin | Admin/editor/viewer roles via Supabase Auth; plan board, changelog viewer |
| Media | Supabase Storage bucket `artwork-images`; sharp rendition ladder (thumb/hero/full/lqip) |
| Email | Resend (studio mailers), branded templates |
| Backup | Vercel Cron → Vercel Blob, verifiable v2 manifests |
| Flag | **PASS TO CLIENT** — this is Rory's primary public identity online |

## Property 2 — Merch Storefront

_Evidence: this repo · releases `v0.1.0`, `v0.2.0` · live_

![Storefront header](../../public/docs/master-brief/shop/storefront-header.png)
_Storefront header — the two-tier nav with SHOP / ABOUT / CONTACT / Studio / Catalogue._

![Storefront gallery in light theme](../../public/docs/master-brief/shop/storefront-gallery-light.png)
_Gallery surfaces with the series filter rail (Neon Americana, Pop Surrealism & Folklore)._

| Aspect | Value |
| :--- | :--- |
| Role | Sell print-on-demand merch and studio editions |
| Stack | Next.js 15 App Router, React 19, Tailwind |
| Data | **None locally** — reads Fourthwall's Storefront API |
| Catalogue | 137 works in a local JSON *fallback* (see the fabricated-catalogue trap) |
| Published | 6 products across 3 collections (v0.2.0, 2026-10-04) |
| Flag | **PASS TO CLIENT** — the revenue surface |

## Property 3 — Fourthwall Itself

_Evidence: `fourthwall/` analysis dir · 605-template catalogue_

![Fourthwall product templates](../../public/docs/master-brief/shop/fw-product-templates.png)
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
| Local folder | `shop.roryskagenart.com` |
| Vercel project | `roryskagenart/shop.roryskagenart.com` |
| Fourthwall project | `roryskagenart-shop.fourthwall.com` |
| Custom domain | `shop.roryskagenart.com` |
| GitHub remote | `roryskagenart/shop.roryskagenart.com` |

> ⚠️ `git remote -v` still prints the **stale** `.com` URL and only resolves because GitHub
> redirects renamed repos. Treat `git remote -v` as untrusted for identity (trap **T23**).

Also note the older studio repo path `roryskagen/roryskagenart` in aging docs is **404** — the real
repo is `roryskagenart/roryskagenart.com`, and `roryskagenart` is a **User** account, not an org.

| Flag | Item |
| :--- | :--- |
| **RETIRE** | The stale `git remote -v` URL (a human decision, rule 4 in `AGENTS.md`) |
| **RETIRE** | `roryskagen/roryskagenart` references in old docs |
