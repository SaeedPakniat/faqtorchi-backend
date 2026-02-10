#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000/api/v1}
TOKEN=${TOKEN:?TOKEN is required}
STATUS=${STATUS:-}
TYPE=${TYPE:-}
FROM=${FROM:-}
TO=${TO:-}
PAGE=${PAGE:-}
PAGESIZE=${PAGESIZE:-}

query=""
if [ -n "$STATUS" ]; then query="${query}status=$STATUS&"; fi
if [ -n "$TYPE" ]; then query="${query}type=$TYPE&"; fi
if [ -n "$FROM" ]; then query="${query}from=$FROM&"; fi
if [ -n "$TO" ]; then query="${query}to=$TO&"; fi
if [ -n "$PAGE" ]; then query="${query}page=$PAGE&"; fi
if [ -n "$PAGESIZE" ]; then query="${query}pageSize=$PAGESIZE&"; fi
if [ -n "$query" ]; then query="?${query%&}"; fi

curl -s "$BASE_URL/invoices${query}" \
  -H "Authorization: Bearer $TOKEN" | cat
