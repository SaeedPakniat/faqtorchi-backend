import process from "node:process";

const API_URL = process.env.API_URL || "http://localhost:3000";
const PHONE = process.env.SELLER_PHONE;
const PASSWORD = process.env.SELLER_PASSWORD;

if (!PHONE || !PASSWORD) {
    console.error("Missing SELLER_PHONE or SELLER_PASSWORD env vars");
    process.exit(1);
}

async function request(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });
    const text = await res.text();
    let json;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        json = null;
    }
    if (!res.ok) {
        throw new Error(`Request failed ${res.status} ${path}: ${text}`);
    }
    return json;
}

async function main() {
    const login = await request("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ phone: PHONE, password: PASSWORD }),
    });
    const token = login.accessToken;
    if (!token) throw new Error("No accessToken from login");

    const headers = { Authorization: `Bearer ${token}` };

    const warehouse = await request("/api/v1/warehouses", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "Smoke Warehouse" }),
    });

    const product = await request("/api/v1/products", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "Smoke Product" }),
    });

    const variant = await request(`/api/v1/products/${product.product.id}/variants`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sku: `SMOKE-${Date.now()}`, price: "250000" }),
    });

    await request("/api/v1/inventory/adjust", {
        method: "POST",
        headers,
        body: JSON.stringify({
            warehouseId: warehouse.warehouse.id,
            variantId: variant.variant.id,
            delta: 10,
            note: "smoke"
        }),
    });

    const warehouseInvoice = await request("/api/v1/invoices/warehouse", {
        method: "POST",
        headers,
        body: JSON.stringify({
            warehouseId: warehouse.warehouse.id,
            currency: "IRR",
            discount: "0",
            tax: "0",
            items: [{ variantId: variant.variant.id, quantity: 2 }],
        }),
    });

    const instantInvoice = await request("/api/v1/invoices/instant", {
        method: "POST",
        headers,
        body: JSON.stringify({
            currency: "IRR",
            items: [{ description: "Smoke Service", quantity: 1, unitPrice: "1000" }],
        }),
    });

    const payment = await request(`/api/v1/invoices/${warehouseInvoice.invoice.id}/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ amount: "1000", method: "CASH" }),
    });

    await request(`/api/v1/payments/${payment.payment.id}/void`, {
        method: "POST",
        headers,
    });

    const pdf = await request(`/api/v1/invoices/${warehouseInvoice.invoice.id}/pdf`, {
        method: "POST",
        headers,
    });

    await request(`/api/v1/invoices/${warehouseInvoice.invoice.id}/pdf`, {
        method: "GET",
        headers,
    });

    await request(pdf.pdfUrlPublic, { method: "GET" });

    const dueAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    await request(`/api/v1/invoices/${warehouseInvoice.invoice.id}/reminders`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            installments: [{ dueAt, remindDaysBefore: 1, channel: "NOTIF", message: "smoke" }],
        }),
    });

    await request("/api/v1/reports/sales", { method: "GET", headers });
    await request("/api/v1/reports/accounts-receivable", { method: "GET", headers });
    await request("/api/v1/reports/top-products?limit=5", { method: "GET", headers });
    await request(`/api/v1/reports/low-stock?threshold=5&warehouseId=${warehouse.warehouse.id}`, {
        method: "GET",
        headers,
    });

    console.log("Smoke test completed");
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
