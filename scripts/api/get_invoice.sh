#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000/api/v1}
TOKEN=${TOKEN:?TOKEN is required}
INVOICE_ID=${INVOICE_ID:?INVOICE_ID is required}

curl -s "$BASE_URL/invoices/$INVOICE_ID" \
  -H "Authorization: Bearer $TOKEN" | cat
