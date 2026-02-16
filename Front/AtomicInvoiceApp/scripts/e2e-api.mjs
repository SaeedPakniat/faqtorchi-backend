#!/usr/bin/env node
/* eslint-disable no-console */

const baseUrl =
  process.env.E2E_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "http://localhost:3000/api/v1";

const sellerPhone = process.env.E2E_SELLER_PHONE;
const sellerPass = process.env.E2E_SELLER_PASS;
const userPhone = process.env.E2E_USER_PHONE;
const userPass = process.env.E2E_USER_PASS;

const required = [
  ["E2E_SELLER_PHONE", sellerPhone],
  ["E2E_SELLER_PASS", sellerPass],
  ["E2E_USER_PHONE", userPhone],
  ["E2E_USER_PASS", userPass],
];

const missing = required.filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  console.error("Example:");
  console.error(
    "E2E_BASE_URL=http://localhost:3000/api/v1 E2E_SELLER_PHONE=0912... E2E_SELLER_PASS=... E2E_USER_PHONE=... E2E_USER_PASS=... node scripts/e2e-api.mjs"
  );
  process.exit(1);
}

let cookieJar = "";

function toUrl(path, query) {
  const base = path.startsWith("http")
    ? path
    : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  if (!query) return base;
  const url = new URL(base);
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    url.searchParams.set(k, String(v));
  });
  return url.toString();
}

async function http(path, { method = "GET", body, token, query, headers } = {}) {
  const url = toUrl(path, query);
  const finalHeaders = new Headers(headers || {});
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  if (cookieJar) finalHeaders.set("Cookie", cookieJar);

  let payload;
  if (body !== undefined) {
    if (typeof body === "string" || body instanceof FormData) {
      payload = body;
    } else {
      payload = JSON.stringify(body);
      if (!finalHeaders.has("Content-Type")) {
        finalHeaders.set("Content-Type", "application/json");
      }
    }
  }

  const res = await fetch(url, { method, headers: finalHeaders, body: payload });

  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    cookieJar = setCookie.split(";")[0];
  }

  const contentType = res.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json") || contentType.includes("+json")) {
    try {
      data = await res.json();
    } catch {
      data = await res.text();
    }
  } else {
    data = await res.text();
  }

  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

let failures = 0;
async function step(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    failures += 1;
    console.error(`✗ ${name}`);
    console.error(err?.message || err);
  }
}

const ids = {
  warehouseId: undefined,
  productId: undefined,
  variantId: undefined,
  inventoryId: undefined,
  customerId: undefined,
  invoiceId: undefined,
  paymentId: undefined,
  reminderId: undefined,
  publicToken: undefined,
};

let sellerToken = "";
let userToken = "";

const randomSuffix = Date.now().toString().slice(-6);
const discountCode = `E2E${randomSuffix}`;

console.log("Base URL:", baseUrl);

await step("Seller login", async () => {
  const res = await http("/auth/login", {
    method: "POST",
    body: { phone: sellerPhone, password: sellerPass },
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.data)}`);
  sellerToken = res.data?.accessToken;
  if (!sellerToken) throw new Error("Missing access token");
});

await step("/me", async () => {
  const res = await http("/me", { token: sellerToken });
  if (!res.ok) throw new Error(`/me failed: ${res.status}`);
});

await step("Create warehouse", async () => {
  const res = await http("/warehouses", {
    method: "POST",
    token: sellerToken,
    body: { name: `E2E Warehouse ${randomSuffix}`, location: "Test" },
  });
  if (!res.ok) throw new Error(`Warehouse failed: ${res.status}`);
  ids.warehouseId = res.data?.warehouse?.id ?? res.data?.id;
});

await step("List warehouses", async () => {
  const res = await http("/warehouses", { token: sellerToken });
  if (!res.ok) throw new Error(`List warehouses failed: ${res.status}`);
});

await step("Create product", async () => {
  const res = await http("/products", {
    method: "POST",
    token: sellerToken,
    body: { name: `E2E Product ${randomSuffix}` },
  });
  if (!res.ok) throw new Error(`Product failed: ${res.status}`);
  ids.productId = res.data?.product?.id ?? res.data?.id;
});

await step("List products", async () => {
  const res = await http("/products", { token: sellerToken });
  if (!res.ok) throw new Error(`List products failed: ${res.status}`);
});

await step("Create variant", async () => {
  if (!ids.productId) throw new Error("Missing productId");
  const res = await http(`/products/${ids.productId}/variants`, {
    method: "POST",
    token: sellerToken,
    body: { sku: `E2E-SKU-${randomSuffix}`, price: 120000, attributes: { color: "black" } },
  });
  if (!res.ok) throw new Error(`Variant failed: ${res.status}`);
  ids.variantId = res.data?.variant?.id ?? res.data?.id;
});

await step("Adjust inventory", async () => {
  if (!ids.warehouseId || !ids.variantId) throw new Error("Missing warehouseId/variantId");
  const res = await http("/inventory/adjust", {
    method: "POST",
    token: sellerToken,
    body: {
      warehouseId: ids.warehouseId,
      variantId: ids.variantId,
      delta: 5,
      note: "E2E stock",
    },
  });
  if (!res.ok) throw new Error(`Inventory adjust failed: ${res.status}`);
});

await step("List inventory", async () => {
  if (!ids.warehouseId) throw new Error("Missing warehouseId");
  const res = await http("/inventory", {
    token: sellerToken,
    query: { warehouseId: ids.warehouseId },
  });
  if (!res.ok) throw new Error(`List inventory failed: ${res.status}`);
  ids.inventoryId = res.data?.inventory?.[0]?.id;
});

await step("Inventory ledger", async () => {
  if (!ids.inventoryId) return;
  const res = await http("/inventory/ledger", {
    token: sellerToken,
    query: { inventoryId: ids.inventoryId },
  });
  if (!res.ok) throw new Error(`Ledger failed: ${res.status}`);
});

await step("Create customer", async () => {
  const res = await http("/customers", {
    method: "POST",
    token: sellerToken,
    body: { phone: userPhone, name: "E2E Customer", notes: "from e2e" },
  });
  if (res.ok) {
    ids.customerId = res.data?.customer?.id ?? res.data?.id;
    return;
  }
  if (res.status !== 409) throw new Error(`Create customer failed: ${res.status}`);
});

await step("List customers", async () => {
  const res = await http("/customers", {
    token: sellerToken,
    query: { page: 1, pageSize: 20, q: userPhone },
  });
  if (!res.ok) throw new Error(`List customers failed: ${res.status}`);
  if (!ids.customerId) {
    ids.customerId = res.data?.customers?.find((c) => c.phone === userPhone)?.id;
  }
});

await step("Get customer", async () => {
  if (!ids.customerId) return;
  const res = await http(`/customers/${ids.customerId}`, { token: sellerToken });
  if (!res.ok) throw new Error(`Get customer failed: ${res.status}`);
});

await step("Create discount code", async () => {
  const res = await http("/discount-codes", {
    method: "POST",
    token: sellerToken,
    body: { code: discountCode, type: "PERCENT", value: 10, isActive: true },
  });
  if (!res.ok) throw new Error(`Create discount failed: ${res.status}`);
});

await step("List discount codes", async () => {
  const res = await http("/discount-codes", { token: sellerToken });
  if (!res.ok) throw new Error(`List discount failed: ${res.status}`);
});

await step("Update discount code", async () => {
  const list = await http("/discount-codes", { token: sellerToken });
  const code = list.data?.discounts?.find((d) => d.code === discountCode);
  if (!code) return;
  const res = await http(`/discount-codes/${code.id}`, {
    method: "PATCH",
    token: sellerToken,
    body: { isActive: false },
  });
  if (!res.ok) throw new Error(`Update discount failed: ${res.status}`);
});

await step("Exchange rate", async () => {
  const res = await http("/exchange-rates", {
    token: sellerToken,
    query: { base: "IRT", quote: "USD" },
  });
  if (!res.ok) throw new Error(`Exchange rate failed: ${res.status}`);
});

await step("Reports", async () => {
  const now = new Date();
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const to = now.toISOString();

  const endpoints = [
    ["/reports/sales", { from, to }],
    ["/reports/discounts", { from, to }],
    ["/reports/accounts-receivable", {}],
    ["/reports/top-products", { limit: 5 }],
    ["/reports/low-stock", { threshold: 5, warehouseId: ids.warehouseId }],
  ];

  for (const [path, query] of endpoints) {
    const res = await http(path, { token: sellerToken, query });
    if (!res.ok) throw new Error(`Report ${path} failed: ${res.status}`);
  }
});

await step("Create instant invoice", async () => {
  const res = await http("/invoices/instant", {
    method: "POST",
    token: sellerToken,
    body: {
      currency: "IRT",
      customerPhone: userPhone,
      customerName: "E2E Customer",
      items: [{ description: "E2E item", quantity: 2, unitPrice: 120000 }],
    },
  });
  if (!res.ok) throw new Error(`Invoice failed: ${res.status}`);
  ids.invoiceId = res.data?.invoice?.id ?? res.data?.id;
});

await step("Create warehouse invoice", async () => {
  if (!ids.warehouseId || !ids.variantId) return;
  const res = await http("/invoices/warehouse", {
    method: "POST",
    token: sellerToken,
    body: {
      warehouseId: ids.warehouseId,
      currency: "IRT",
      customerPhone: userPhone,
      customerName: "E2E Customer",
      items: [{ variantId: ids.variantId, quantity: 1, description: "E2E item" }],
    },
  });
  if (!res.ok) throw new Error(`Warehouse invoice failed: ${res.status}`);
});

await step("List invoices", async () => {
  const res = await http("/invoices", { token: sellerToken, query: { page: 1, pageSize: 10 } });
  if (!res.ok) throw new Error(`List invoices failed: ${res.status}`);
});

await step("Get invoice", async () => {
  if (!ids.invoiceId) return;
  const res = await http(`/invoices/${ids.invoiceId}`, { token: sellerToken });
  if (!res.ok) throw new Error(`Get invoice failed: ${res.status}`);
});

await step("Invoice PDF", async () => {
  if (!ids.invoiceId) return;
  const res = await http(`/invoices/${ids.invoiceId}/pdf`, {
    method: "POST",
    token: sellerToken,
  });
  if (!res.ok) throw new Error(`Generate PDF failed: ${res.status}`);

  const pdfRes = await http(`/invoices/${ids.invoiceId}/pdf`, { token: sellerToken });
  if (!pdfRes.ok) throw new Error(`Fetch PDF failed: ${pdfRes.status}`);
});

await step("Create payment", async () => {
  if (!ids.invoiceId) return;
  const res = await http(`/invoices/${ids.invoiceId}/payments`, {
    method: "POST",
    token: sellerToken,
    body: { amount: 100000, currency: "IRT", method: "CASH", note: "e2e" },
  });
  if (!res.ok) throw new Error(`Payment failed: ${res.status}`);
  ids.paymentId = res.data?.payment?.id ?? res.data?.id;
});

await step("List payments", async () => {
  if (!ids.invoiceId) return;
  const res = await http(`/invoices/${ids.invoiceId}/payments`, { token: sellerToken });
  if (!res.ok) throw new Error(`List payments failed: ${res.status}`);
  if (!ids.paymentId) ids.paymentId = res.data?.payments?.[0]?.id;
});

await step("Void payment", async () => {
  if (!ids.paymentId) return;
  const res = await http(`/payments/${ids.paymentId}/void`, { method: "POST", token: sellerToken });
  if (!res.ok) throw new Error(`Void payment failed: ${res.status}`);
});

await step("Reminders", async () => {
  if (!ids.invoiceId) return;
  const dueAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const create = await http(`/reminder/invoices/${ids.invoiceId}/reminders`, {
    method: "POST",
    token: sellerToken,
    body: {
      installments: [
        { dueAt, remindDaysBefore: 1, channel: "SMS", message: "E2E reminder" },
      ],
    },
  });
  if (!create.ok) throw new Error(`Create reminder failed: ${create.status}`);

  const list = await http(`/reminder/invoices/${ids.invoiceId}/reminders`, { token: sellerToken });
  if (!list.ok) throw new Error(`List reminders failed: ${list.status}`);
  ids.reminderId = list.data?.reminders?.[0]?.id;

  if (ids.reminderId) {
    const cancel = await http(`/reminder/reminders/${ids.reminderId}/cancel`, {
      method: "POST",
      token: sellerToken,
    });
    if (!cancel.ok) throw new Error(`Cancel reminder failed: ${cancel.status}`);
  }
});

await step("Public invoice access", async () => {
  const tokenRes = await http("/public/invoices/request-token", {
    method: "POST",
    body: { phone: userPhone },
  });
  if (!tokenRes.ok) throw new Error(`Public token failed: ${tokenRes.status}`);
  ids.publicToken = tokenRes.data?.token;

  if (ids.publicToken) {
    const list = await http("/public/invoices", {
      query: { phone: userPhone, token: ids.publicToken },
    });
    if (!list.ok) throw new Error(`Public list failed: ${list.status}`);

    const pdf = await http(`/public/invoices/${ids.publicToken}/pdf`);
    if (!pdf.ok) throw new Error(`Public PDF failed: ${pdf.status}`);
  }
});

await step("Auth refresh", async () => {
  const res = await http("/auth/refresh", { method: "POST" });
  if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
});

await step("Auth logout", async () => {
  const res = await http("/auth/logout", { method: "POST" });
  if (!res.ok) throw new Error(`Logout failed: ${res.status}`);
});

await step("Customer portal register/login", async () => {
  const register = await http("/customer/register", {
    method: "POST",
    body: { phone: userPhone, password: userPass, name: "E2E Customer" },
  });
  if (!register.ok && register.status !== 409) {
    throw new Error(`Customer register failed: ${register.status}`);
  }

  const login = await http("/customer/login", {
    method: "POST",
    body: { phone: userPhone, password: userPass },
  });
  if (!login.ok) throw new Error(`Customer login failed: ${login.status}`);
  userToken = login.data?.accessToken;

  if (userToken && ids.invoiceId) {
    const list = await http("/customer/invoices", {
      token: userToken,
      query: { page: 1, pageSize: 5 },
    });
    if (!list.ok) throw new Error(`Customer invoices failed: ${list.status}`);

    const detail = await http(`/customer/invoices/${ids.invoiceId}`, { token: userToken });
    if (!detail.ok) throw new Error(`Customer invoice detail failed: ${detail.status}`);
  }
});

if (failures > 0) {
  console.error(`\nE2E finished with ${failures} failure(s).`);
  process.exit(1);
}

console.log("\nE2E finished successfully.");
