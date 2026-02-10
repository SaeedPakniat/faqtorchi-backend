# Discounts + Customer Portal Tests

## Discount Codes (SELLER)

Create discount code (percent):
```bash
curl -s -X POST "http://localhost:3000/api/v1/discount-codes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"WELCOME10","type":"PERCENT","value":10,"maxUses":100}' | cat
```

Create discount code (fixed, variant-specific):
```bash
curl -s -X POST "http://localhost:3000/api/v1/discount-codes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"FIXED","value":"5000","variantId":1,"maxUses":1}' | cat
```

List discount codes:
```bash
curl -s "http://localhost:3000/api/v1/discount-codes?active=true" \
  -H "Authorization: Bearer $TOKEN" | cat
```

Apply discount code in warehouse invoice:
```bash
curl -s -X POST "http://localhost:3000/api/v1/invoices/warehouse" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouseId": 1,
    "currency": "IRR",
    "discountCode": "WELCOME10",
    "items": [{"variantId": 1, "quantity": 1}]
  }' | cat
```

Percent discount/tax on invoice:
```bash
curl -s -X POST "http://localhost:3000/api/v1/invoices/instant" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "IRR",
    "discountPercent": 10,
    "taxPercent": 5,
    "items": [{"description":"Consulting","quantity":1,"unitPrice":"100000"}]
  }' | cat
```

Discounts report:
```bash
curl -s "http://localhost:3000/api/v1/reports/discounts?from=2026-02-01T00:00:00.000Z&to=2026-02-28T23:59:59.999Z" \
  -H "Authorization: Bearer $TOKEN" | cat
```

## Customer Portal (USER)

Register customer:
```bash
curl -s -X POST "http://localhost:3000/api/v1/customer/register" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+989121234568","password":"Test1234!","name":"Ali Customer"}' | cat
```

Login customer:
```bash
CUSTOMER_TOKEN=$(curl -s -X POST "http://localhost:3000/api/v1/customer/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+989121234568","password":"Test1234!"}' \
  | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken")
echo $CUSTOMER_TOKEN
```

List customer invoices:
```bash
curl -s "http://localhost:3000/api/v1/customer/invoices" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | cat
```

Get customer invoice by id:
```bash
curl -s "http://localhost:3000/api/v1/customer/invoices/1" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | cat
```

## Public Invoice Access (OTP token)

Request token (SMS stub prints to server logs; token is returned in non-production):
```bash
curl -s -X POST "http://localhost:3000/api/v1/public/invoices/request-token" \
  -H "Content-Type: application/json" \
  -d '{"phone":"09121234567"}' | cat
```

List invoices using token:
```bash
curl -s "http://localhost:3000/api/v1/public/invoices?phone=09121234567&token=$TOKEN_FROM_RESPONSE" | cat
```
