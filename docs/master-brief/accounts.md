---
title: "Accounts, Services & Stack"
description: "A single reference table for every account, vendor, project id, domain, and credential owner across the engagement."
badge: "Reference"
category: "Master Brief"
slug: "accounts"
order: 4
nav: "Accounts, Services & Stack"
navBadge: "Reference"
---
# Accounts, Services & Stack

Every account below was created or is used by this engagement. **Identifiers only — no secret values
belong in any document.**

## GitHub

| | Value |
| :--- | :--- |
| Owner account | **`roryskagenart`** — a **User** account (not an org); owns 3 repos |
| Access actor | `jadenblack` — pull / push / triage ✓, **admin ✗** |
| Studio repo | `roryskagenart/roryskagenart.com` |
| Shop repo | `roryskagenart/shop.roryskagenart.com` — **public**; renamed 2026-10-03 from `…shop.roryskagen.com` |
| Superseded | `jadenblack/roryskagenart.com` — contractor fork holding PRs #1–#41 |
| Flag | **RETAIN INTERNALLY** — `admin: false` blocks branch protection; only the owner can add it |

> ⚠️ `main` on the shop repo **is protected** (verified 2026-10-06). `admin: false` also means
> `GET /branches/main/protection` returns **404** for the agent — indistinguishable from "not
> configured". Read the `protected` boolean instead.

## Vercel

| Project | Team / Account | Project id |
| :--- | :--- | :--- |
| `roryskagenart.com` (vite) | `roryskagenart` / `roryskagen` | `prj_c8fk73LW7TWeai8uI5o86kilUM1h` |
| `shop.roryskagenart.com` (nextjs) | `roryskagenart` / `roryskagen` | `prj_u3hPHBRFkibIkIkthndzS1sjvhKJ` |
| `roryskagen` (**legacy**) | `ventureio` (retired) | `prj_6CRLwZ6q6TvSOKHUtpbMPKGWbkWS` |
| Team id | — | `team_lD7ZSbm44CpPmByF9eN22dJT` |

- The shop project is **git-connected** and **push-to-deploy** — a push to `main` *is* a production deploy.
- **Domains.** `shop.roryskagenart.com` → DNS A `64.29.17.65`, `216.198.79.65`.
- **Legacy alias.** The retired project name `roryskagen-5713/shop-roryskagen-com` still has its
  `.vercel.app` alias attached, so the old name still resolves. **Compare `prj_…` ids, not names** (T43).
- **Env vars.** The studio project carries ~**28** env vars (12 sensitive + 16 legacy). The shop repo's
  `.env.local` holds `VERCEL_PAT_SECRET` and the Fourthwall tokens.

## Supabase

| | Value |
| :--- | :--- |
| Project ref | `orphcusijzkxpxkzapjp` |
| Used by | **Studio site only** — the shop has **no database** |
| Plan | **FREE** — no PITR, pauses after 7 days idle |
| Tables | 12 (incl. `artworks`, `artwork_images`, `artwork_terms`, `media_assets`, `taxonomies`, `plan_items`, `plan_releases`, `profiles`) |
| Storage | Bucket `artwork-images` — 1,109 objects after the mural load |
| Migrations | 18 files, runner `scripts/run-migrations.ts` (CLI migrations disabled) |
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
| Storefront | `https://roryskagenart-shop.fourthwall.com` |
| Read API | `https://storefront-api.fourthwall.com/v1` — public token |
| Write API | `https://api.fourthwall.com/open-api/v1.0` — Basic auth or Bearer |
| Templates | 605 total · **274 backend-renderable** · **45 accept JPEG source** |
| Flag | **RETAIN INTERNALLY** — the measured API surface and its traps |

## Other Vendors

| Vendor | Role | Status |
| :--- | :--- | :--- |
| **Resend** | Transactional + studio email | Live (studio) |
| **Vercel Blob** | Off-site backup target | Live (studio) |
| **Cloudinary** | Legacy image host, `res.cloudinary.com/xjilp2pq` | **RETIRED** — exit shipped in v2.9.0 |
| **Wayback / archive.org** | Source of the recovered catalogue | Historical reference |
| Cloudflare · Shopify · Printful · Gelato · Klaviyo | Considered and **rejected** | **RETIRE** from planning docs |

## Stack Comparison

| Layer | Studio site | Shop |
| :--- | :--- | :--- |
| Framework | Vite 6 + React 19 SPA | Next.js 15 App Router |
| Server | Express 4 (serverless) | Next.js route handlers |
| Database | Supabase Postgres | none |
| Media | Supabase Storage + sharp | Fourthwall CDN |
| Docs | — | hand-rolled Markdown renderer |
| Tests | vitest | vitest (15 files, 224 tests) |
| CI | none | GitHub Actions `ci.yml` only |
| Installer | npm | **npm** (`.npmrc` `legacy-peer-deps`) — not bun/pnpm (T46) |

## Credential Handling

| Rule | Detail |
| :--- | :--- |
| **Never commit a secret** | `.env.local` holds live credentials; `.env*` is gitignored |
| Copy names, never values | Variable *names* may be documented; values may not |
| Shop repo is **public** | Reports must be redacted before commit — other clients' data is prohibited |

| Flag | Item |
| :--- | :--- |
| **RETAIN INTERNALLY** | All credential names, hosts, and traps |
| **PASS TO CLIENT** | Account ownership and access-recovery facts |
