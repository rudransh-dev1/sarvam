#!/usr/bin/env bash
# Real-browser smoke test: catches things Node hides, like Buffer or browser-only APIs.
# Usage: ./test/browser.sh            (checks the local build on :8095)
set -u
BASE="${1:-http://localhost:8095}"
pass=0; fail=0
check() { # name, url, needle
  local dom
  dom=$(google-chrome-stable --headless --disable-gpu --no-sandbox --virtual-time-budget=9000 --dump-dom "$BASE/$2" 2>/dev/null | tr -d '\n')
  if printf '%s' "$dom" | grep -q "$3"; then
    pass=$((pass+1))
  else
    fail=$((fail+1)); echo "  ✗ $1 :: missing '$3'"
  fi
}
check "map renders levels"        "#/"            "PHASE 01"
check "today shows 24 steps"      "#/today"       "Concept 1"
check "today shows remaining"     "#/today"       "Remaining"
check "drills page 1"             "#/drills/1"    "1-10 of 1386"
check "drills page 2"             "#/drills/2"    "11-20 of 1386"
check "remaining page"            "#/remaining/1" "Nothing waiting"
check "week lab renders"          "#/lesson/w01"  "Boss lab"
check "drills last page"          "#/drills/139" "1381-1386 of 1386"
echo "$pass browser checks passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
