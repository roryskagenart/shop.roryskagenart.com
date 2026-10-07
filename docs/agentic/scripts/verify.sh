#!/usr/bin/env bash
#
# Gate sequence — READ ONLY.
#
# Runs both gates and reports EXACT counts. See docs/agentic/protocols/verification.md.
#
# Why both, always:
#   vitest.config.ts sets `globals: true` at RUNTIME ONLY. A test file that uses
#   describe/it/expect without importing them passes vitest and fails tsc (TS2582).
#   Measured: a green vitest run hid 15 tsc errors.
#
# Why not `next build`: it stalls with zero output and zero writes here, and Next
#   suppresses its spinner on a non-TTY pipe - so silence proves nothing. It is not
#   a usable local gate.
#
# Exit code: 0 if every gate passed, 1 otherwise.

set -uo pipefail

# ---------------------------------------------------------------------------
# Working directory
# ---------------------------------------------------------------------------
#
# Everything below uses ./node_modules/.bin/*, so the script must run from the repo
# root. Re-enter it explicitly rather than trusting the caller's cwd.
#
# On Windows this is not cosmetic. git-bash can inherit a LOWERCASE drive letter in
# the cwd (`c:\...`), and Vitest derives module paths from it; the casing then
# disagrees with the paths the runner itself uses, Node caches modules by path
# *string*, and two `vitest` instances load. `vi.mock` silently stops being hoisted
# and EVERY suite fails to load - so gate 2 reports "a DROP means a guard was
# deleted" when nothing was deleted. `pwd -W` yields the canonical `C:/...` form
# under MSYS, and cd'ing to it restores the uppercase drive letter.
# See docs/agentic/traps/register.md#t44.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../../.." || exit 1
if MSYS_ROOT="$(pwd -W 2>/dev/null)"; then
  cd "$MSYS_ROOT" 2>/dev/null || true
fi
REPO_ROOT="$(pwd)"

# The baseline lives in exactly one place - do NOT inline the numbers here.
# shellcheck source=baseline.env
. "$SCRIPT_DIR/baseline.env"

FAILED=0

head_() { printf '\n== %s\n' "$*"; }
ok()    { printf '  ok    %s\n' "$*"; }
bad()   { printf '  FAIL  %s\n' "$*"; FAILED=$((FAILED + 1)); }

# ---------------------------------------------------------------------------
# 0. Toolchain
# ---------------------------------------------------------------------------

head_ "0. Toolchain"

if [ ! -d node_modules ]; then
  bad "node_modules missing - run 'npm ci' (foreground; never a background install after a wipe)"
  exit 1
fi
ok "node_modules present"

TSC=./node_modules/.bin/tsc
VITEST=./node_modules/.bin/vitest

if [ ! -x "$TSC" ]; then bad "$TSC not found"; fi
if [ ! -x "$VITEST" ]; then bad "$VITEST not found"; fi
if [ "$FAILED" -gt 0 ]; then
  printf '\n  Cannot run the gates without the toolchain. Aborting.\n'
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Typecheck  (npm run lint)
# ---------------------------------------------------------------------------

head_ "1. Typecheck - tsc --noEmit"

TSC_OUT=$("$TSC" --noEmit 2>&1)
TSC_RC=$?

if [ "$TSC_RC" -eq 0 ]; then
  ok "0 errors"
else
  bad "tsc reported errors:"
  printf '%s\n' "$TSC_OUT" | sed 's/^/         /'
fi

# ---------------------------------------------------------------------------
# 2. Tests  (npm test)
# ---------------------------------------------------------------------------

head_ "2. Tests - vitest run"

VITEST_OUT=$("$VITEST" run 2>&1)
VITEST_RC=$?

# Strip ANSI colour codes first, then match with ERE classes.
# NOTE: grep -E does NOT support \s (that is PCRE) - use [[:space:]].
# A silent parse failure here would report "count differs" on a green run.
CLEAN_OUT=$(printf '%s\n' "$VITEST_OUT" | sed 's/\x1b\[[0-9;]*m//g')

FILES_LINE=$(printf '%s\n' "$CLEAN_OUT" | grep -E '^[[:space:]]*Test Files[[:space:]]' | tail -1 || true)
TESTS_LINE=$(printf '%s\n' "$CLEAN_OUT" | grep -E '^[[:space:]]*Tests[[:space:]]' | tail -1 || true)

printf '  %s\n' "${FILES_LINE:-<could not parse Test Files>}"
printf '  %s\n' "${TESTS_LINE:-<could not parse Tests>}"
printf '  baseline: %s passed / %s files\n' "$BASELINE_TESTS" "$BASELINE_FILES"

if [ "$VITEST_RC" -eq 0 ]; then
  ok "vitest exited 0"
else
  bad "vitest exited $VITEST_RC"
  printf '%s\n' "$VITEST_OUT" | tail -40 | sed 's/^/         /'
fi

# A DROP in the count means a guard was deleted, not that the suite got faster.
if printf '%s' "$TESTS_LINE" | grep -q "${BASELINE_TESTS} passed"; then
  ok "test count matches the baseline"
else
  bad "test count DIFFERS from the baseline ($BASELINE_TESTS) - a DROP means a guard was deleted"
  printf '         Re-derive the number, edit docs/agentic/scripts/baseline.env, then run\n'
  printf '         check-baseline.sh and fix every carrier it flags.\n'
fi

# ---------------------------------------------------------------------------
# 3. Baseline consistency
# ---------------------------------------------------------------------------
#
# Every document that quotes the gate count must agree with baseline.env. This
# is what catches a carrier nobody remembered to update - the failure mode that
# left four different counts live in this tree at once (T41). Pure grep, ~50 ms.

head_ "3. Baseline consistency"

CHECK_BASELINE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/check-baseline.sh"
if [ -f "$CHECK_BASELINE" ]; then
  if CHECK_OUT=$(bash "$CHECK_BASELINE" 2>&1); then
    ok "every carrier agrees with baseline.env"
  else
    bad "documented baseline disagrees with baseline.env:"
    printf '%s\n' "$CHECK_OUT" | grep -E 'FAIL|stale|:' | sed 's/^/         /'
  fi
else
  bad "$CHECK_BASELINE not found - the baseline guard is missing"
fi

# ---------------------------------------------------------------------------
# 4. Format (advisory, OPT-IN ONLY via --format)
# ---------------------------------------------------------------------------
#
# Removed from the default path deliberately. Measured: prettier over the tree
# costs ~4s - half the total gate runtime - to re-report a number that has been
# static since 2026-10-02 (91 of 103 tracked files fail). It is not in CI, it
# cannot fail the build, and its only output was a standing INFO line nobody
# acted on. Run it when you have actually touched formatting:
#
#   bash docs/agentic/scripts/verify.sh --format
#
# The rule it was documenting still stands: format the files you touched
# (`prettier --write <paths>`), never a repo-wide --write as a drive-by. T31.

if [ "${1:-}" = "--format" ] || [ "${VERIFY_FORMAT:-0}" = "1" ]; then
  head_ "4. Format - prettier (opt-in)"

  if [ -x ./node_modules/.bin/prettier ]; then
    if ./node_modules/.bin/prettier --check --ignore-unknown . >/dev/null 2>&1; then
      ok "prettier clean"
    else
      printf '  INFO  prettier reports unformatted files. Pre-existing baseline, not your change.\n'
      printf '        Format only the files you touched: prettier --write <paths>\n'
    fi
  else
    printf '  WARN  prettier not installed - skipped\n'
  fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

head_ "Summary"

if [ "$FAILED" -gt 0 ]; then
  printf '  GATES FAILED (%s). Do not commit, do not push.\n' "$FAILED"
  exit 1
fi

printf '  All gates green.\n'
printf '  Reminder: do not commit tsconfig.json (Next rewrote it) or an unintended bun.lock change.\n'
exit 0
