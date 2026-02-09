#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000/api/v1}
ACCESS_TOKEN=${ACCESS_TOKEN:?ACCESS_TOKEN is required}
NAME=${NAME:-Main Warehouse}
LOCATION=${LOCATION:-Tehran}

resp=$(curl -s -X POST "$BASE_URL/warehouses" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$NAME\",\"location\":\"$LOCATION\"}")

printf '%s' "$resp" | python3 - <<'PY'
import json,sys
w=json.load(sys.stdin)["warehouse"]
print(json.dumps({"warehouseId": w["id"], "name": w["name"]}))
PY
