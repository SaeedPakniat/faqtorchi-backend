import { prisma } from "../prisma/client";
import { env } from "../config/env";

export function startReminderWorker() {
    if (!env.ENABLE_REMINDER_WORKER) return;

    const intervalMs = 60_000;

    const tick = async () => {
        try {
            const now = new Date();
            const reminders = await prisma.reminder.findMany({
                where: { status: "PENDING", remindAt: { lte: now } },
                take: 100,
            });

            if (reminders.length === 0) return;

            const ids = reminders.map((r) => r.id);
            await prisma.$transaction(async (tx) => {
                await tx.reminder.updateMany({
                    where: { id: { in: ids } },
                    data: { status: "SENT", sentAt: now },
                });
            });

            for (const reminder of reminders) {
                console.log("Reminder SENT", {
                    reminderId: reminder.id,
                    invoiceId: reminder.invoiceId,
                    channel: reminder.channel,
                    dueAt: reminder.dueAt.toISOString(),
                    remindAt: reminder.remindAt.toISOString(),
                });
            }
        } catch (err) {
            console.error("Reminder worker error", err);
        }
    };

    setInterval(tick, intervalMs);
    tick();
}
