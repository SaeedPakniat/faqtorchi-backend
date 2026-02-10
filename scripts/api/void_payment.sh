#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000/api/v1}
TOKEN=${TOKEN:?TOKEN is required}
PAYMENT_ID=${PAYMENT_ID:?PAYMENT_ID is required}

curl -s -X POST "$BASE_URL/payments/$PAYMENT_ID/void" \
  -H "Authorization: Bearer $TOKEN" | cat
