# Instant Invoices Tests

## Unauthorized
```bash
curl -i "http://localhost:3000/api/v1/invoices/instant"
```

## Create Instant Invoice
```bash
curl -s "http://localhost:3000/api/v1/invoices/instant" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "IRR",
    "customerName": "Walk-in",
    "discount": "1000",
    "tax": "500",
    "items": [
      { "description": "Service fee", "quantity": 2, "unitPrice": "250000000" }
    ]
  }' | cat
```

## Invalid Quantity / Negative Discount
```bash
curl -i "http://localhost:3000/api/v1/invoices/instant" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "IRR",
    "discount": -1,
    "items": [
      { "description": "Bad qty", "quantity": 0, "unitPrice": "1000" }
    ]
  }'
```

## List Invoices Includes Instant
```bash
curl -s "http://localhost:3000/api/v1/invoices" \
  -H "Authorization: Bearer $TOKEN" | cat
```

## Get Invoice By Id (Items + Payments)
```bash
curl -s "http://localhost:3000/api/v1/invoices/1" \
  -H "Authorization: Bearer $TOKEN" | cat
```
