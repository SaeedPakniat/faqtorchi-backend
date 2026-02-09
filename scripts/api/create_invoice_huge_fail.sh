#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000/api/v1}
ACCESS_TOKEN=${ACCESS_TOKEN:?ACCESS_TOKEN is required}
WAREHOUSE_ID=${WAREHOUSE_ID:?WAREHOUSE_ID is required}
VARIANT_ID=${VARIANT_ID:?VARIANT_ID is required}
QTY=${QTY:-9999}
CURRENCY=${CURRENCY:-IRR}
DISCOUNT=${DISCOUNT:-0}
TAX=${TAX:-0}

resp=$(curl -s -w "\n%{http_code}\n" -X POST "$BASE_URL/invoices/warehouse" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"warehouseId\":$WAREHOUSE_ID,\"currency\":\"$CURRENCY\",\"discount\":\"$DISCOUNT\",\"tax\":\"$TAX\",\"items\":[{\"variantId\":$VARIANT_ID,\"quantity\":$QTY}]}" )

body=$(printf '%s' "$resp" | sed '$d')
status=$(printf '%s' "$resp" | tail -n 1)

echo "status=$status"
printf '%s\n' "$body"
