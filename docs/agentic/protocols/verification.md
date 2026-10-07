# Protocol — Verification

**Core rule: run both gates, always, and read the numbers.** Neither gate subsumes the other here, and
`next build` is not a gate at all.

---

## The gates

| Gate | Command | Baseline |
| :--- | :--- | :--- |
| Typecheck | `./node_modules/.bin/tsc --noEmit` (alias `npm run lint`) | 0 errors |
| Tests | `./node_modules/.bin/vitest run` (alias `npm test`) | **223 passed / 15 files** — the number lives in [`../scripts/baseline.env`](../scripts/baseline.env) |
| Format | `prettier --check` — **opt-in only**, see below | advisory |
| CI | `.github/workflows/ci.yml` → `npm ci`, lint, test | must be green |

One command: [`../scripts/verify.sh`](../scripts/verify.sh). Measured 2026-10-03: **3.9 s**, down from
8.0 s — it runs typecheck, tests, and the baseline count, nothing else.

The **count itself lives in exactly one place**, [`../scripts/baseline.env`](../scripts/baseline.env).
`verify.sh` sources it, and runs [`../scripts/check-baseline.sh`](../scripts/check-baseline.sh) as a third
gate: that guard fails if any document quoting the count disagrees with it. Do not inline the number in a
document — quote it if you must, and let the guard keep you honest. See **T41**.

### Format is not in the default path

`verify.sh` runs **no** prettier check unless you ask:

```bash
bash docs/agentic/scripts/verify.sh            # typecheck + tests + baseline  (3.9 s)
bash docs/agentic/scripts/verify.sh --format   # also checks formatting        (8.0 s)
```

This is a cost decision, not a correctness one. Prettier over the tree cost **~4 s — half the total gate
runtime** — to re-report a number that has been static since 2026-10-02 (91 of 103 tracked files fail). It
is not in CI, so it cannot fail a build, and its only output was a standing INFO line that nobody acted
on. Check it when you have actually touched formatting; skip it otherwise.

The rule it was documenting still stands: **`prettier --write <paths>` on the files you touched**, never a
repo-wide `--write` as a drive-by. → T31

---

## ⚠️ Trap: `vitest` passes where `tsc` fails

`vitest.config.ts` sets `globals: true` **at runtime only**. A test file that uses `describe` / `it` /
`expect` without importing them therefore runs fine under vitest and fails `tsc` with `TS2582`.

**Measured:** a session shipped a test file that vitest reported green, then `npm run lint` produced 15
errors. The test count went *up* and the build was broken.

`tsconfig.json` also sets **`noUncheckedIndexedAccess: true`**, so `array[0]` is `T | undefined` — a class
of error vitest will never surface.

**⇒ Running only `vitest` is not verification. Running only `tsc` is not verification.**

## ⚠️ Trap: `next build` is not usable here

`next build` stalls with **zero output and zero writes**, and Next suppresses its progress spinner when
stdout is not a TTY. Silence therefore proves neither success nor failure.

- Do not use it as a gate.
- Do not read a quiet build as passing.
- If a task genuinely needs a production build, do it in CI (a fresh checkout, a real TTY-less runner that
  is known to work) — not locally.

## Counts move — re-derive them

Documented test counts in this repo have been wrong repeatedly (67 vs 127; 97 vs 137; 151 vs 152). **A
count is a measurement, not a constant.** When the denominator changes, every "N of M" claim elsewhere in
the docs needs re-checking.

This happened for real: `verify.sh` carried `BASELINE_TESTS=97` while the suite ran 137, so **the gate
failed on a clean tree** and the failure text ("a DROP means a guard was deleted") pointed at the opposite
of the truth. Baseline re-derived and fixed 2026-10-03.

And again on 2026-10-04: the baseline said **137** while **HEAD ran 139** — a pre-existing 2-test
drift, nothing to do with the change that surfaced it. Confirmed by stashing all work and running
the suite at a clean `HEAD` (139), then re-running without the one new test file (139), then with it
(163). So: **137 → 139 was already wrong, and my change contributed the 139 → 163.** Derive the
number by *subtracting* what you added, not by reading your own new total — otherwise you inherit
someone else's drift and record it as yours. Baseline re-derived to 163 / 13 files **at the time**.

And again on 2026-10-06: the drift had become structural rather than incidental. **Four different counts
were live in this tree at once** — 223/15 in `verify.sh` and `stack/overview.md`, 137/11 in `AGENTS.md`,
163/13 here, and 97/6 in `preflight.md`, `preflight.sh`, `lib/fourthwall/AGENTS.md` and
`scripts/AGENTS.md`. The cause was not carelessness: the update instruction named only two of the six
carriers, so nothing could fail on the other four. **That is now fixed** — the count lives in
[`../scripts/baseline.env`](../scripts/baseline.env) and `check-baseline.sh` fails on any carrier that
disagrees. See **T41**.

Corollary: a **drop** in the test count means a guard was deleted, not that the suite got faster. Treat it
as a failure until proven otherwise — but re-derive first, because a stale baseline looks identical to a
deleted guard from the failure message alone.

---

## Verify against reality, not against a log

The highest-value habit in this repo. A script's own success message is not evidence.

| Instead of | Do |
| :--- | :--- |
| Trusting a seeding script's "created 4 products" | Re-`GET` the products and count them |
| Trusting `curl` output you fetched once | **Cache-bust** with a random query param — the CDN caches per exact URL, so a stale read is indistinguishable from a failed write |
| Trusting a CI badge | Read the commit status for the specific SHA |
| Trusting a plan document's numbers | Re-run the command that produced them |

> ⚠️ **A verification probe must not be able to destroy the thing it verifies.** See
> [`destructive-actions.md`](destructive-actions.md).

## Verification of external state

When a claim depends on a live third-party system, measure it directly and cross-check against the
authoritative docs or a second endpoint before writing it down. Record the **date** of the measurement —
an undated measurement becomes a lie the moment the vendor changes something.

---

## What "verified" means here

You may write "verified" only if you can name the command and its output. Otherwise write "not verified"
and say what would settle it. An honest gap is worth more than a confident guess — this repo's whole
release process is built on that distinction.
