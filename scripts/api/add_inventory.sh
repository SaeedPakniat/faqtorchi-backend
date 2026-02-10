#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000/api/v1}
ACCESS_TOKEN=${ACCESS_TOKEN:?ACCESS_TOKEN is required}
WAREHOUSE_ID=${WAREHOUSE_ID:?WAREHOUSE_ID is required}
VARIANT_ID=${VARIANT_ID:?VARIANT_ID is required}
DELTA=${DELTA:-100}
NOTE=${NOTE:-seed}

resp=$(curl -s -X POST "$BASE_URL/inventory/adjust" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"warehouseId\":$WAREHOUSE_ID,\"variantId\":$VARIANT_ID,\"delta\":$DELTA,\"note\":\"$NOTE\"}")

printf '%s' "$resp" | python3 - <<'PY'
import json,sys
print(json.dumps(json.load(sys.stdin)))
PY
