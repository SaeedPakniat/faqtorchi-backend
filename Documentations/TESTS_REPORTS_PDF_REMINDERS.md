# Reports, PDF, Reminders, Exchange Rates

## Exchange rates

Get rate (stub provider):

```bash
curl -s "http://localhost:3000/api/v1/exchange-rates?base=USD&quote=IRR" \
  -H "Authorization: Bearer $TOKEN" | cat
```

## PDF generation

Generate PDF for invoice:

```bash
curl -s -X POST "http://localhost:3000/api/v1/invoices/1/pdf" \
  -H "Authorization: Bearer $TOKEN" | cat
```

Fetch seller PDF stream:

```bash
curl -i "http://localhost:3000/api/v1/invoices/1/pdf" \
  -H "Authorization: Bearer $TOKEN"
```

Fetch public PDF by token:

```bash
curl -i "http://localhost:3000/api/v1/public/invoices/<TOKEN>/pdf"
```

## Reminders

Create reminders for an invoice:

```bash
curl -s -X POST "http://localhost:3000/api/v1/invoices/1/reminders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"installments":[{"dueAt":"2026-02-15T10:00:00.000Z","remindDaysBefore":2,"channel":"NOTIF","message":"payment due"}]}' | cat
```

List reminders:

```bash
curl -s "http://localhost:3000/api/v1/invoices/1/reminders" \
  -H "Authorization: Bearer $TOKEN" | cat
```

Cancel reminder:

```bash
curl -s -X POST "http://localhost:3000/api/v1/reminders/1/cancel" \
  -H "Authorization: Bearer $TOKEN" | cat
```

If `ENABLE_REMINDER_WORKER=true`, reminders with `remindAt <= now` will be marked `SENT` and logged.

## Reports

Sales report:

```bash
curl -s "http://localhost:3000/api/v1/reports/sales?from=2026-02-01T00:00:00.000Z&to=2026-02-28T23:59:59.000Z" \
  -H "Authorization: Bearer $TOKEN" | cat
```

Accounts receivable:

```bash
curl -s "http://localhost:3000/api/v1/reports/accounts-receivable" \
  -H "Authorization: Bearer $TOKEN" | cat
```

Top products:

```bash
curl -s "http://localhost:3000/api/v1/reports/top-products?limit=10" \
  -H "Authorization: Bearer $TOKEN" | cat
```

Low stock:

```bash
curl -s "http://localhost:3000/api/v1/reports/low-stock?threshold=5&warehouseId=1" \
  -H "Authorization: Bearer $TOKEN" | cat
```
