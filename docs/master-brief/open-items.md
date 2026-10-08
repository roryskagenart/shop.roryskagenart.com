---
title: "Open Items & Risks"
description: "Everything unfinished, broken, or undecided across both repos — with a recommendation where one exists."
badge: "Live"
category: "Assessment"
slug: "open-items"
order: 8
nav: "Open Items & Risks"
navBadge: "Live"
---
# Open Items & Risks

Every item below is **live and unresolved**. Nothing here is a fix — this is the register.

## Critical

| Item | Where | Why critical | Recommendation |
| :--- | :--- | :--- | :--- |
| **T01 fabricated catalogue** | `lib/fourthwall/index.ts` | Visitors can add **$28,000** of nonexistent art to a cart; every page returns 200 | **Delete the fallback JSON**, do not guard it |
| **T14 `/checkout/` is ungated** | Fourthwall | The password gate blocks *discovery*, not *purchase* | Confirm the gate's actual scope with Fourthwall |
| **60 mural artworks unpublished** | Studio DB | Half the practice is invisible in production | Owner publish pass (P-02) |
| **Supabase free plan, no PITR** | Studio | Data loss is unrecoverable | Owner declined Pro; the risk is *accepted, not resolved* |

## High

| Item | Where | Recommendation |
| :--- | :--- | :--- |
| **T37 no publish endpoint** | Fourthwall Platform API | Dashboard-only. Every launcher ends at `AWAITING_MANUAL_PUBLISH` — design accordingly |
| **T39 orphan product still listed** | Fourthwall | Remove from the collection; archiving alone does not hide it |
| **8 source artworks below the 1500px gate** | Shop JSON | Only 4 of 42 Available clear it; commission rescans |
| **"Greetings from Austin" is 576×376** | Shop JSON | The Austin-icon promise is unfulfillable from that file |
| **`artworks.year` hardcoded `'2024'`** | Studio `server/routes/artworks.ts` | 79 rows disagree with the archive — needs sign-off (Q18) |
| **Unpushed studio work** | Studio `main` | `8742f65` + `ca961bd` are local-only, no PR |

## Medium

| Item | Where | Recommendation |
| :--- | :--- | :--- |
| **T42 `/docs` palette table** | `lib/docs-content.ts` | Rewrite from `app/globals.css` — it documents retired tokens |
| **T24 `v1.x` "Release" labels** | `lib/docs-content.ts` | Reword to "Roadmap" |
| **T31 prettier never green** | repo-wide | 91 of 103 files; advisory only — keep it out of CI |
| **T41 baseline drift** | `docs/` | Fixed via `baseline.env` + `check-baseline.sh`; still **not in CI** |
| **T49 guard missing** | `register.md` | Write the `-brand-[a-z-]+/[0-9]+` scan |
| **`assetRegistry.ts` ~987 KB** | Studio bundle | Shipped to every visitor; pagination promise unfulfilled (R-20) |
| **Cache-Control 1h not 1y** | Studio storage | 604 of 1109 objects — a bandwith/perf issue |
| **Dangling `artwork_slug`** | Studio DB | 10 `media_assets` rows (`wisdom-cofee`, `kelzon-5`) |
| **`bundleSafety.test.ts` fails** | Studio | 4 tests, pre-existing, unrelated to releases |

## Cross-Repo / Convention

| Item | Detail | Recommendation |
| :--- | :--- | :--- |
| **Tag placement** | Both repos tag the **merge commit** | Never tag the pre-merge tip |
| **Squash merges** | Every studio merge is a squash | `--merged` lies; prove with a tree diff |
| **Canonical studio repo** | `roryskagenart` carries v3.2.1; `jadenblack` carries PR history | **Decide** before v3.3.0 |
| **Shop CI gap** | No baseline guard in `ci.yml` | Add `check-baseline.sh` |
| **Shop has no Release objects** | Tags exist, GitHub Releases do not | Decide whether to create them |
| **Skill duplication** | 13 skills in `docs/agentic/skills/` **and** `~/.workbuddy-ai/skills/` | No sync guard — a drift risk |

## Trap Register Status

The shop repo maintains **51 measured traps** (T01–T51). Current distribution:

| Status | Count |
| :--- | ---: |
| **OPEN** | 33 |
| **MITIGATED** | 5 |
| **RESOLVED** | 9 |
| **PARTIAL** | 1 |

> **A trap is not a bug list.** Each entry records a *measurement* that proved the behaviour, so the
> next engineer does not re-derive it. Read `docs/agentic/traps/register.md` before touching
> Fourthwall, the gates, or the release flow.

| Flag | Item |
| :--- | :--- |
| **OPEN** | 33 traps — the register is the tracking surface, not this brief |
| **PASS TO CLIENT** | Only the *business-visible* ones (T01, T14, the 60 drafts, the year question) |
