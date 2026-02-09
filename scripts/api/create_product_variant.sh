#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000/api/v1}
ACCESS_TOKEN=${ACCESS_TOKEN:?ACCESS_TOKEN is required}
NAME=${NAME:-Test Product}
DESCRIPTION=${DESCRIPTION:-Big money variant}
SKU=${SKU:-SKU-001}
PRICE=${PRICE:-250000000}

product_resp=$(curl -s -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$NAME\",\"description\":\"$DESCRIPTION\"}")

product_id=$(printf '%s' "$product_resp" | python3 - <<'PY'
import json,sys
print(json.load(sys.stdin)["product"]["id"])
PY
)

variant_resp=$(curl -s -X POST "$BASE_URL/products/$product_id/variants" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sku\":\"$SKU\",\"price\":\"$PRICE\"}")

printf '%s' "$variant_resp" | python3 - <<'PY'
import json,sys
v=json.load(sys.stdin)["variant"]
print(json.dumps({"productId": v["productId"], "variantId": v["id"], "price": v["price"]}))
PY
