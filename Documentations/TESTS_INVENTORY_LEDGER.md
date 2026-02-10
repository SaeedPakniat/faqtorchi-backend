# Inventory Ledger API Tests

Unauthorized:

```bash
curl -i "http://localhost:3000/api/v1/inventory/ledger?inventoryId=1"
# expect 401
```

Authorized seller:

```bash
curl -s "http://localhost:3000/api/v1/inventory/ledger?inventoryId=1" \
  -H "Authorization: Bearer $TOKEN" | cat
# expect 200 + ledger array
```

Not found:

```bash
curl -i "http://localhost:3000/api/v1/inventory/ledger?inventoryId=999999" \
  -H "Authorization: Bearer $TOKEN"
# expect 404
```

Forbidden (requires another seller's inventory):

```bash
curl -i "http://localhost:3000/api/v1/inventory/ledger?inventoryId=OTHER_SELLER_INVENTORY_ID" \
  -H "Authorization: Bearer $TOKEN"
# expect 403
```
