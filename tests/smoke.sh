#!/usr/bin/env bash
# DueDash API smoke test — calls Express only (no Supabase keys needed).
# Usage: BASE_URL=http://localhost:3001 bash tests/smoke.sh
BASE_URL="${BASE_URL:-http://localhost:3001}"
fail=0; pass=0

check() { # name  expected_code  method  path  [json_body]
  local name="$1" want="$2" method="$3" path="$4" body="$5"
  local args=(-s -o /tmp/smoke_body.json -w '%{http_code}' -X "$method")
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' -d "$body")
  local code; code=$(curl "${args[@]}" "$BASE_URL$path")
  if [ "$code" = "$want" ]; then
    echo "PASS  $method $path -> $code  ($name)"; pass=$((pass+1))
  else
    echo "FAIL  $method $path -> $code (wanted $want)  ($name)"; fail=$((fail+1))
    sed 's/^/      /' /tmp/smoke_body.json | head -3
  fi
}

echo "== DueDash smoke test against $BASE_URL =="

# --- liveness (no DB needed) ---
check "liveness"            200 GET /health

# --- reads (need seeded schema) ---
check "db health"           200 GET /api/db/health
check "demo identity"       200 GET /api/me
check "list courses"        200 GET '/api/courses?include_archived=true'
check "list assignments"    200 GET /api/assignments
check "list weekly plans"   200 GET /api/weekly-plans
check "list commitments"    200 GET /api/commitments
check "list alerts"         200 GET /api/alerts

# --- input validation (4xx — no valid write should be needed for these) ---
check "missing fields"      400 POST /api/assignments '{}'
check "negative estimate"   400 POST /api/assignments \
  '{"title":"x","course_id":"00000000-0000-4000-8000-000000000011","due_at":"2030-01-01T00:00:00Z","estimated_minutes":-5}'
check "missing course"      400 POST /api/assignments \
  '{"title":"x","due_at":"2030-01-01T00:00:00Z","estimated_minutes":30}'
check "foreign course"      403 POST /api/assignments \
  '{"title":"x","course_id":"00000000-0000-4000-8000-000000000999","due_at":"2030-01-01T00:00:00Z","estimated_minutes":30}'
check "plan-item both refs" 400 POST /api/plan-items \
  '{"weekly_plan_id":"x","assignment_id":"a","subtask_id":"b","planned_date":"2030-01-01","planned_minutes":10}'
check "plan bad week_start" 400 POST /api/weekly-plans '{"week_start":"not-a-date"}'
check "plan-item bad patch" 400 PATCH /api/plan-items/00000000-0000-4000-8000-000000000001 \
  '{"planned_minutes":-1}'
check "missed-alert scan"   200 POST /api/alerts/generate-missed '{}'
check "bad commitment time" 400 POST /api/commitments \
  '{"kind":"work","title":"x","starts_at":"2030-01-02T10:00:00Z","ends_at":"2030-01-02T09:00:00Z"}'

# --- valid write (201) — uses the FIRST seeded course of the demo student ---
COURSE_ID=$(curl -s "$BASE_URL/api/courses" | grep -oE '"course_id":"[^"]+"' | head -1 | cut -d'"' -f4)
if [ -n "$COURSE_ID" ]; then
  check "create assignment" 201 POST /api/assignments \
    "{\"title\":\"smoke-test item\",\"course_id\":\"$COURSE_ID\",\"due_at\":\"2030-01-01T00:00:00Z\",\"estimated_minutes\":15}"
else
  echo "SKIP  create assignment (no course_id parsed — is the DB seeded?)"; fail=$((fail+1))
fi

echo "== $pass passed, $fail failed =="
[ "$fail" -eq 0 ]
