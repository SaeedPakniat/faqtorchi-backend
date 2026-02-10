# Payments + Invoices API Tests

Assumes:
- `TOKEN` is a valid SELLER access token
- `INVOICE_ID` is an existing invoice id for that seller
- `PAYMENT_ID` is an existing payment id for that seller

## Record payment

```bash
curl -i -X POST "http://localhost:3000/api/v1/invoices/$INVOICE_ID/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":"5000","method":"CASH","note":"first payment"}'
```

## Void payment

```bash
curl -i -X POST "http://localhost:3000/api/v1/payments/$PAYMENT_ID/void" \
  -H "Authorization: Bearer $TOKEN"
```

## Fetch invoice detail

```bash
curl -s "http://localhost:3000/api/v1/invoices/$INVOICE_ID" \
  -H "Authorization: Bearer $TOKEN" | cat
```

## List invoices (default pagination)

```bash
curl -s "http://localhost:3000/api/v1/invoices?page=1&pageSize=20" \
  -H "Authorization: Bearer $TOKEN" | cat
```

## Status progression example

```bash
# 1) initial status should be ISSUED
curl -s "http://localhost:3000/api/v1/invoices/$INVOICE_ID" \
  -H "Authorization: Bearer $TOKEN" | cat

# 2) record a partial payment -> PARTIALLY_PAID
curl -s -X POST "http://localhost:3000/api/v1/invoices/$INVOICE_ID/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":"1000","method":"CASH"}' | cat

# 3) record the remaining payment -> PAID
curl -s -X POST "http://localhost:3000/api/v1/invoices/$INVOICE_ID/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":"9000","method":"CASH"}' | cat
```
