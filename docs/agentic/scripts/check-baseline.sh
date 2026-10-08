#!/usr/bin/env bash
#
# Baseline consistency guard — READ ONLY.
#
# The gate baseline lives in exactly one place: `baseline.env`. Every document
# that quotes it must agree with it, and this script fails when one does not.
#
# Why it exists: on 2026-10-06 four different test counts were live in this tree
# at once — 223/15 in `verify.sh` and `stack/overview.md`, 137/11 in `AGENTS.md`,
# 163/13 in `protocols/verification.md`, and 97/6 in four more files. The root
# cause was not carelessness: the update instruction in `AGENTS.md` §5 named only
# two of the six carriers, so the rest drifted silently and nothing could fail.
# This is the guard that can. See traps/register.md#t41.
#
# Exit code: 0 if every carrier agrees, 1 otherwise.

set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
cd "$ROOT" || { printf 'cannot cd to the repo root\n'; exit 1; }

# shellcheck source=baseline.env
. "$HERE/baseline.env"

FAILED=0
ok()  { printf '  ok    %s\n' "$*"; }
bad() { printf '  FAIL  %s\n' "$*"; FAILED=$((FAILED + 1)); }

printf '\n== Baseline\n'
printf '  %s passed / %s files (verified %s)\n' \
  "$BASELINE_TESTS" "$BASELINE_FILES" "$BASELINE_VERIFIED"

# ---------------------------------------------------------------------------
# 1. Every carrier must quote the baseline count
# ---------------------------------------------------------------------------
#
# A carrier is a document that states the gate count to a reader. Add the path
# here in the same change that adds the document - an unlisted carrier is a
# carrier nothing checks.

CARRIERS="
AGENTS.md
docs/agentic/protocols/preflight.md
docs/agentic/protocols/verification.md
docs/agentic/stack/overview.md
lib/fourthwall/AGENTS.md
scripts/AGENTS.md
"

printf '\n== 1. Carriers quote the baseline\n'
for f in $CARRIERS; do
  if [ ! -f "$f" ]; then
    bad "$f is missing"
  elif grep -qE "(^|[^0-9])${BASELINE_TESTS} (passed|passing)" "$f"; then
    ok "$f"
  else
    bad "$f does not quote '${BASELINE_TESTS} passed' / '${BASELINE_TESTS} passing'"
  fi
done

# ---------------------------------------------------------------------------
# 2. Nothing else may quote a different count
# ---------------------------------------------------------------------------
#
# Exempted, with a reason each - exempting a NEW file requires editing this
# script, so the decision is visible in a PR rather than made silently:
#
#   docs/reports/               dated process reports. The KB says explicitly they
#                               are not a rule source and may be superseded, so they
#                               legitimately quote the number true when written.
#   docs/releases/plans/        a `_DRAFT` plan is frozen at execution; its "gates
#                               green at" row is a record of a past measurement.
#   docs/agentic/sessions/      dated session records - same class as docs/reports/.
#                               Each is a snapshot of what was measured that day.
#   docs/agentic/CHANGELOG.md   dated release entries. An entry describes the tree as
#                               it stood at that version, not as it stands now.
#   docs/agentic/traps/register.md
#                               trap EVIDENCE is a dated measurement by definition.
#                               T41's entry reads "Measured 2026-10-06 ... Tests 223
#                               passed (223)". Rewriting that to the current count
#                               would falsify the evidence of the trap that documents
#                               this exact failure mode - the number a reader trusts
#                               depending on which file they open.
#
# Added 2026-10-08 when the baseline moved 223 -> 224 (a new test, not a lost one).
# Before this, a baseline bump forced a choice between two wrong answers: falsify
# eight dated measurements, or leave the guard red. A dated record is not a stale
# claim, and the two are not the same failure.
#
# Nothing else is exempt. If a file quotes an old count, FIX THE FILE - do not
# add it here.

EXEMPT_RE='^(docs/reports/|docs/releases/plans/|docs/agentic/sessions/|docs/agentic/CHANGELOG.md|docs/agentic/traps/register.md)'

printf '\n== 2. No other document quotes a stale count\n'
STALE=$(git grep -nE '[0-9]{2,} (passed|passing)' -- '*.md' '*.sh' 2>/dev/null \
  | grep -vE "[^0-9]${BASELINE_TESTS} (passed|passing)" \
  | grep -vE "$EXEMPT_RE" || true)

if [ -z "$STALE" ]; then
  ok "no document quotes a count other than ${BASELINE_TESTS}"
else
  bad "stale test count(s) — fix these files:"
  printf '%s\n' "$STALE" | sed 's/^/         /'
fi

# ---------------------------------------------------------------------------
# 3. The file count must match reality, and the list must match the count
# ---------------------------------------------------------------------------
#
# Two derived claims, both of which drifted on 2026-10-06: `overview.md`
# claimed 15 test files while listing 14, and its list had a literal `\n`
# joining three entries onto one line.

printf '\n== 3. Test-file inventory\n'

ON_DISK=$(git ls-files | grep -cE '(__tests__/|\.test\.tsx?$)' || true)
if [ "$ON_DISK" = "$BASELINE_FILES" ]; then
  ok "git ls-files finds $ON_DISK test file(s), matching the baseline"
else
  bad "git ls-files finds $ON_DISK test file(s) but the baseline says $BASELINE_FILES"
fi

OVERVIEW='docs/agentic/stack/overview.md'
LISTED=$(awk '/^Test files:$/{f=1;next} f&&/^>/{exit} f&&/^- /{n++} END{print n+0}' "$OVERVIEW")
if [ "$LISTED" = "$BASELINE_FILES" ]; then
  ok "$OVERVIEW lists $LISTED test file(s)"
else
  bad "$OVERVIEW lists $LISTED test file(s) but the baseline says $BASELINE_FILES"
fi

printf '\n== Summary\n'
if [ "$FAILED" -gt 0 ]; then
  printf '  %s check(s) FAILED. The documented baseline disagrees with baseline.env.\n' "$FAILED"
  printf '  Fix the documents — do not relax the guard.\n'
  exit 1
fi
printf '  Baseline consistent across every carrier.\n'
exit 0
