# Release record

What has actually shipped, and where each tag sits. **`git tag` is authoritative for what exists**; this
file explains what each tag contains and why it is placed where it is.

Created 2026-10-06, because the repo had gone **four merged PRs and two live feature releases without a
single tag** and no document recording it. Session logs stop at `../agentic/sessions/2026-10-01.md`.

---

## The convention

| | |
| :--- | :--- |
| Scheme | **`v0.x.y`** — the only space that has tags. See [`/AGENTS.md` §2](../../AGENTS.md#2-read-this-before-you-name-anything) and **T24**. |
| Tag placement | the **merge commit** of the PR that delivered the release. |
| Plan | `docs/releases/plans/pr-<slug>-v0.x.y_DRAFT.md`, registered in [`plans/README.md`](plans/README.md). |

**Tag placement is verified, not assumed.** `v0.1.0` → `31e47f2`, which the GitHub API confirms is PR #1's
`merge_commit_sha`. Tags are **immutable once pushed** — never move one to "fix" it; cut a new release.

⚠️ Note that this repo's merges are **squash merges**, so a release branch's tip is never an ancestor of
`main`. Do not prune a merged branch on `git branch --merged` alone — prove content equality with a
two-dot tree diff (`git diff origin/main origin/<branch>`).

---

## Shipped

| Version | Tag | Tagged commit | Delivered by | Contains |
| :--- | :--- | :--- | :--- | :--- |
| `v0.1.0` | `v0.1.0` | `31e47f2` — PR #1 merge commit | PR #1 `release/v0.1.0`, merged 2026-10-01 | Truthful import surface, admin gate, Fourthwall write path removed |
| `v0.2.0` "Staged Catalogue" | `v0.2.0` | `42786bb7` — PR #14 merge commit | PRs #11–#14, merged 2026-10-04 → 2026-10-06 | Nav from live stock, the executed merch catalogue, read-only `/playground`, Skagen theme sync |

> **`v0.2.0` is a retroactive tag.** Nothing was tagged between `v0.1.0` and `42786bb7`, so PRs #11–#14
> shipped through the Vercel Git integration with no tag, no release note and no session record. The tag
> was cut on 2026-10-06 in the same change that created this ledger. It is an **annotated** tag, pushed by
> object SHA (`870d2748`), and it dereferences to `42786bb7` — a commit on `main`'s history.

---

## What `v0.2.0` covers

| PR | Merge commit | Shipped |
| :--- | :--- | :--- |
| #11 | `b2ee46a2` | Nav built from live Fourthwall stock; storefront chrome tightened |
| #12 | `95ebc41c` | KB 1.4.1; the measured merch launch codified (T34–T39, 4 code fixes) |
| #13 | `bc59be6c` | `/playground` — registry browse and template detail, read-only |
| #14 | `42786bb7` | Skagen Light/Dark palette synced from the studio design panel |

The catalogue side of this release **executed on 2026-10-04 and is live** — 6 products created, verified,
then published `PUBLIC`; collections renamed to `wall-artwork` and `gifts-goodies`; the nav picks them up
with no code change. Records: [`created-products.v0.2.0.md`](created-products.v0.2.0.md),
[`live-state-review.v0.2.0.md`](live-state-review.v0.2.0.md).

**Two items remain open from it:** the T06 orphan is `ARCHIVED` but still appears in collection listings
(**T39** — archiving is not enough; it must be removed from the collection), and a pricing re-check is
backlogged.

> **Why one catch-up tag and not two.** No release process ran on 10-04 or 10-05, so tagging `v0.2.0` at
> `95ebc41c` *and* `v0.3.0` at `42786bb7` would manufacture a history that never happened — and would
> spend `v0.3.0`, which the Launch Playground plan needs.
>
> **No GitHub Release object was created.** `v0.1.0` has none, so the repo's convention is a tag alone.
> Introducing Release objects would be a new convention — say the word and it is a one-command change.

---

## Next

`v0.3.0` "Launch Playground" — [`plans/pr-launch-playground-v0.3.0_DRAFT.md`](plans/pr-launch-playground-v0.3.0_DRAFT.md),
**DRAFT, not started**. Blocker **OQ1** is which Supabase project. Its first slice (read-only registry
browse) already shipped in #13.
