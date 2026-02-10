import { prisma } from "../../prisma/client";
import type { CreateRemindersInput } from "./reminder.schemas";

async function assertInvoiceOwnership(sellerId: number, invoiceId: number) {
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: { id: true, sellerId: true },
    });

    if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
    if (invoice.sellerId !== sellerId) throw Object.assign(new Error("Forbidden"), { status: 403 });
}

export async function createReminders(params: { sellerId: number; invoiceId: number } & CreateRemindersInput) {
    await assertInvoiceOwnership(params.sellerId, params.invoiceId);

    const reminders = await prisma.$transaction(async (tx) => {
        const created = [] as any[];
        for (const item of params.installments) {
            const dueAt = new Date(item.dueAt);
            const remindAt = new Date(dueAt.getTime() - item.remindDaysBefore * 24 * 60 * 60 * 1000);
            const reminder = await tx.reminder.create({
                data: {
                    invoiceId: params.invoiceId,
                    sellerId: params.sellerId,
                    dueAt,
                    remindAt,
                    channel: item.channel,
                    status: "PENDING",
                    message: item.message ?? null,
                },
            });
            created.push(reminder);
        }
        return created;
    });

    return { reminders };
}

export async function listReminders(params: { sellerId: number; invoiceId: number }) {
    await assertInvoiceOwnership(params.sellerId, params.invoiceId);

    const reminders = await prisma.reminder.findMany({
        where: { invoiceId: params.invoiceId, sellerId: params.sellerId },
        orderBy: [{ remindAt: "asc" }, { id: "asc" }],
    });

    return { reminders };
}

export async function cancelReminder(params: { sellerId: number; reminderId: number }) {
    const reminder = await prisma.reminder.findUnique({
        where: { id: params.reminderId },
        select: { id: true, sellerId: true, status: true },
    });

    if (!reminder) throw Object.assign(new Error("Reminder not found"), { status: 404 });
    if (reminder.sellerId !== params.sellerId) throw Object.assign(new Error("Forbidden"), { status: 403 });

    const updated =
        reminder.status === "CANCELED"
            ? reminder
            : await prisma.reminder.update({
                  where: { id: params.reminderId },
                  data: { status: "CANCELED" },
              });

    return { reminder: updated };
}
