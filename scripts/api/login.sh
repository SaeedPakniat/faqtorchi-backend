#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000/api/v1}
PHONE=${PHONE:-+15555550100}
PASSWORD=${PASSWORD:-password}

resp=$(curl -sS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"password\":\"$PASSWORD\"}")

printf '%s' "$resp" | python3 - <<'PY'
import json,sys
data = sys.stdin.read()
if not data.strip():
  print("Empty response from server", file=sys.stderr)
  sys.exit(1)
try:
  obj = json.loads(data)
except json.JSONDecodeError:
  print("Non-JSON response:", data, file=sys.stderr)
  sys.exit(1)
token = obj.get("accessToken")
if not token:
  print("No accessToken in response:", obj, file=sys.stderr)
  sys.exit(1)
print(token)
PY
