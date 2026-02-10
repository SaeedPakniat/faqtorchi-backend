#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000/api/v1}
PHONE=${PHONE:-+15555550100}
PASSWORD=${PASSWORD:-password}

resp=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"password\":\"$PASSWORD\"}")

printf '%s' "$resp" | python3 - <<'PY'
import json,sys
print(json.load(sys.stdin)["accessToken"])
PY
