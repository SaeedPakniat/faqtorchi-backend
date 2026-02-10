#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000/api/v1}
TOKEN=${TOKEN:?TOKEN is required}
INVOICE_ID=${INVOICE_ID:?INVOICE_ID is required}
AMOUNT=${AMOUNT:-1000}
METHOD=${METHOD:-CASH} # CASH|CARD|TRANSFER
NOTE=${NOTE:-""}
PAID_AT=${PAID_AT:-""}

payload="{\"amount\":$AMOUNT,\"method\":\"$METHOD\""
if [ -n "$NOTE" ]; then
  payload+=",\"note\":\"$NOTE\""
fi
if [ -n "$PAID_AT" ]; then
  payload+=",\"paidAt\":\"$PAID_AT\""
fi
payload+="}"

curl -s -X POST "$BASE_URL/invoices/$INVOICE_ID/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$payload" | cat
