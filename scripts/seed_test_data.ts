import { prisma } from "../src/prisma/client";
import { hashPassword } from "../src/modules/common/security/password";

const SELLER_COUNT = 5; // new sellers (excluding existing)
const CUSTOMER_COUNT = 8;
const INVOICES_PER_SELLER = 8;
const PRODUCTS_PER_SELLER = 5;
const VARIANTS_PER_PRODUCT = 2;
const WAREHOUSES_PER_SELLER = 2;
const CUSTOMER_INVOICE_SHARE = 0.5;

const EXISTING_SELLER = {
  role: "SELLER" as const,
  phone: "09177036407",
  email: "test@test.com",
  password: "saeed1234",
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function phone() {
  return `09${randInt(100000000, 999999999)}`;
}

function email(i: number) {
  const token = Math.random().toString(16).slice(2, 6);
  return `test.user.${i}.${token}@example.com`;
}

const SIMPLE_PASSWORD = "Test1234";

const NAMES = [
  "Liam Carter",
  "Emma Stone",
  "Noah Brooks",
  "Olivia Hayes",
  "Ava Reed",
  "Mason Blake",
  "Sophia Grant",
  "James Ford",
  "Mia Knight",
  "Ethan Miles",
  "Isabella Moore",
  "Lucas Hayes",
  "Amelia Scott",
  "Benjamin King",
  "Charlotte Lane",
  "Henry Cole",
  "Harper Wood",
  "Elijah Ward",
  "Evelyn Price",
  "Jack Turner",
];

function pickName(index: number) {
  return NAMES[index % NAMES.length];
}

async function uniquePhone(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const p = phone();
    const exists = await prisma.user.findUnique({ where: { phone: p } });
    if (!exists) return p;
  }
  throw new Error("Could not generate unique phone after many attempts");
}

async function uniqueEmail(i: number): Promise<string> {
  for (let t = 0; t < 20; t++) {
    const e = email(i + t);
    const exists = await prisma.user.findFirst({ where: { email: e } });
    if (!exists) return e;
  }
  throw new Error("Could not generate unique email after many attempts");
}

async function createUser(params: {
  email: string;
  phone: string;
  password: string;
  role: "SELLER" | "USER";
  name?: string;
}) {
  const passwordHash = await hashPassword(params.password);
  return prisma.user.create({
    data: {
      email: params.email,
      phone: params.phone,
      name: params.name ?? null,
      role: params.role,
      passwordHash,
      sellerProfile: params.role === "SELLER" ? { create: { storeName: `Store ${params.phone.slice(-4)}` } } : undefined,
      customerProfile: params.role === "USER" ? { create: {} } : undefined,
    },
    include: { sellerProfile: true, customerProfile: true },
  });
}

async function ensureExistingSeller() {
  const user = await prisma.user.findUnique({ where: { phone: EXISTING_SELLER.phone } });
  if (!user) {
    const passwordHash = await hashPassword(EXISTING_SELLER.password);
    await prisma.user.create({
      data: {
        email: EXISTING_SELLER.email,
        phone: EXISTING_SELLER.phone,
        name: "Seeded Seller",
        role: "SELLER",
        passwordHash,
        sellerProfile: { create: { storeName: "Pandatron Store" } },
      },
    });
  }
}

async function main() {
  const credentials: Array<{ role: string; email: string; phone: string; password: string }> = [];

  await ensureExistingSeller();
  credentials.push({
    role: "SELLER",
    email: EXISTING_SELLER.email,
    phone: EXISTING_SELLER.phone,
    password: EXISTING_SELLER.password,
  });

  // 1) create sellers
  for (let i = 1; i <= SELLER_COUNT; i++) {
    const pwd = SIMPLE_PASSWORD;
    const user = await createUser({
      email: await uniqueEmail(i),
      phone: await uniquePhone(),
      password: pwd,
      role: "SELLER",
      name: pickName(i),
    });
    credentials.push({ role: "SELLER", email: user.email ?? "", phone: user.phone, password: pwd });
  }

  // 2) create customers
  for (let i = 1; i <= CUSTOMER_COUNT; i++) {
    const pwd = SIMPLE_PASSWORD;
    const user = await createUser({
      email: await uniqueEmail(100 + i),
      phone: await uniquePhone(),
      password: pwd,
      role: "USER",
      name: pickName(100 + i),
    });
    credentials.push({ role: "USER", email: user.email ?? "", phone: user.phone, password: pwd });
  }

  const userCustomers = await prisma.user.findMany({
    where: { role: "USER", isActive: true },
    select: { id: true, phone: true, name: true },
  });

  // Load sellers
  const sellers = await prisma.sellerProfile.findMany({ include: { user: true } });

  for (const seller of sellers) {
    // Warehouses
    const warehouses: Array<{ id: number }> = [];
    for (let i = 0; i < WAREHOUSES_PER_SELLER; i++) {
      const wh = await prisma.warehouse.create({
        data: {
          sellerId: seller.id,
          name: `Warehouse ${i + 1}`,
          location: `Block ${randInt(1, 20)}`,
        },
      });
      warehouses.push({ id: wh.id });
    }

    // Products + variants
    const variants: Array<{ id: number; price: bigint }> = [];
    for (let i = 0; i < PRODUCTS_PER_SELLER; i++) {
      const product = await prisma.product.create({
        data: {
          sellerId: seller.id,
          name: `Product ${i + 1}`,
          description: `Test product ${i + 1}`,
        },
      });

      for (let v = 0; v < VARIANTS_PER_PRODUCT; v++) {
        const price = BigInt(randInt(50_000, 500_000));
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: `SKU-${product.id}-${v + 1}`,
            price,
            attributes: { color: pick(["red", "blue", "black"]) },
          },
        });
        variants.push({ id: variant.id, price });
      }
    }

    // Inventory
    for (const wh of warehouses) {
      for (const v of variants) {
        await prisma.inventory.create({
          data: {
            warehouseId: wh.id,
            variantId: v.id,
            quantity: randInt(5, 50),
          },
        });
      }
    }

    // Customers under seller
    const sellerCustomers: Array<{ id: number; phone: string }> = [];
    for (let i = 0; i < 5; i++) {
      const customer = await prisma.sellerCustomer.create({
        data: {
          sellerId: seller.id,
          name: `Buyer ${i + 1}`,
          phone: await uniquePhone(),
          notes: "Seeded customer",
        },
      });
      sellerCustomers.push({ id: customer.id, phone: customer.phone });
    }

    // Invoices + items + payments
    for (let i = 0; i < INVOICES_PER_SELLER; i++) {
      const invoiceType = pick(["INSTANT", "WAREHOUSE"] as const);
      const wh = pick(warehouses);
      const useUserCustomer = userCustomers.length > 0 && Math.random() < CUSTOMER_INVOICE_SHARE;
      const userCustomer = useUserCustomer ? pick(userCustomers) : null;
      const sellerCustomer = useUserCustomer ? null : pick(sellerCustomers);

      const itemCount = randInt(1, 3);
      const items: Array<{ variantId?: number; quantity: number; unitPrice: bigint; lineTotal: bigint }> = [];

      for (let j = 0; j < itemCount; j++) {
        const variant = pick(variants);
        const qty = randInt(1, 5);
        const unitPrice = variant.price;
        const lineTotal = unitPrice * BigInt(qty);
        items.push({
          variantId: invoiceType === "WAREHOUSE" ? variant.id : undefined,
          quantity: qty,
          unitPrice,
          lineTotal,
        });
      }

      const subtotal = items.reduce((s, it) => s + it.lineTotal, BigInt(0));
      const discount = BigInt(0);
      const tax = BigInt(0);
      const total = subtotal - discount + tax;

      const invoice = await prisma.invoice.create({
        data: {
          sellerId: seller.id,
          type: invoiceType,
          status: pick(["ISSUED", "PAID", "PARTIALLY_PAID"] as const),
          customerId: sellerCustomer?.id ?? null,
          customerName: useUserCustomer ? (userCustomer?.name ?? userCustomer?.phone ?? null) : (sellerCustomer?.phone ?? null),
          customerPhone: useUserCustomer ? (userCustomer?.phone ?? null) : (sellerCustomer?.phone ?? null),
          currency: "IRR",
          subtotal,
          discount,
          tax,
          total,
          warehouseId: invoiceType === "WAREHOUSE" ? wh.id : null,
          createdByUserId: seller.userId,
          items: { create: items },
        },
      });

      if (invoice.status !== "ISSUED") {
        const paidAmount = invoice.status === "PAID" ? total : total / BigInt(2);
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: paidAmount,
            currency: "IRR",
            amountInvoiceCurrency: paidAmount,
            method: pick(["CASH", "CARD", "TRANSFER"] as const),
            status: "RECORDED",
            note: "Seeded payment",
          },
        });
      }
    }
  }

  // Write credentials file
  const lines = ["role\temail\tphone\tpassword"];
  for (const c of credentials) {
    lines.push(`${c.role}\t${c.email}\t${c.phone}\t${c.password}`);
  }
  const fs = await import("fs/promises");
  await fs.writeFile("/home/Pandatron/Desktop/test-accounts.txt", lines.join("\n"), "utf-8");

  console.log("Seed complete. Credentials saved to /home/Pandatron/Desktop/test-accounts.txt");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
