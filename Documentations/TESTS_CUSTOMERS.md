# Customers Tests

## Create Customer
```bash
curl -s "http://localhost:3000/api/v1/customers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone":"09121234567","name":"Ali Test","notes":"VIP"}' | cat
```

## List / Search Customers
```bash
curl -s "http://localhost:3000/api/v1/customers?page=1&pageSize=20&q=Ali" \
  -H "Authorization: Bearer $TOKEN" | cat
```

## Get Customer By Id
```bash
curl -s "http://localhost:3000/api/v1/customers/1" \
  -H "Authorization: Bearer $TOKEN" | cat
```

## Attach Customer To Invoice
```bash
curl -s "http://localhost:3000/api/v1/invoices/instant" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "IRR",
    "customerId": 1,
    "items": [
      { "description": "Consulting", "quantity": 1, "unitPrice": "50000" }
    ]
  }' | cat
```
