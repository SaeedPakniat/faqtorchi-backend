// import Constants from "expo-constants";
// import { calculateInvoiceTotal } from "../store/invoices/calculations";
// import { getInvoiceRemaining } from "../store/invoices/installments";
// import type { Invoice } from "../store/invoices/models";

// type ReminderDays = 1 | 2 | 3;

// function isExpoGo() {
//   // appOwnership === "expo" means Expo Go
//   return Constants.appOwnership === "expo";
// }

// async function getNotifications() {
//   if (isExpoGo()) return null;
//   try {
//     const mod = await import("expo-notifications");
//     return mod;
//   } catch {
//     return null;
//   }
// }

// function toDate(iso?: string) {
//   if (!iso) return null;
//   const d = new Date(iso);
//   return Number.isNaN(d.getTime()) ? null : d;
// }

// function subtractDays(date: Date, days: number) {
//   const d = new Date(date);
//   d.setDate(d.getDate() - days);
//   return d;
// }

// function future(date: Date) {
//   return date.getTime() > Date.now() + 60_000; // at least 1 minute in the future
// }

// export async function cancelAllInvoiceReminders() {
//   const Notifications = await getNotifications();
//   if (!Notifications) return; // do nothing in Expo Go
//   await Notifications.cancelAllScheduledNotificationsAsync();
// }

// export async function scheduleInvoiceReminders(params: {
//   invoice: Invoice;
//   daysBefore: ReminderDays;
// }) {
//   const Notifications = await getNotifications();
//   if (!Notifications) return; // do nothing in Expo Go

//   const { invoice, daysBefore } = params;

//   // If fully paid, don't schedule anything
//   const remaining = getInvoiceRemaining(invoice);
//   if (remaining <= 0) return;

//   const total = calculateInvoiceTotal(invoice);
//   const customer = invoice.customerName ?? invoice.customerPhone;

//   // If there are installments: for now create one reminder per installment
//   // (without relying on paidPaymentIds because it doesn't seem to exist in your model)
//   if (invoice.installments?.length) {
//     for (const inst of invoice.installments) {
//       const due = toDate(inst.dueAt);
//       if (!due) continue;

//       // If you want to test:
//       // const remindAt = new Date(Date.now() + 90_000);

//       const remindAt = subtractDays(due, daysBefore);
//       if (!future(remindAt)) continue;

//       await Notifications.scheduleNotificationAsync({
//         content: {
//           title: "Installment Due Reminder",
//           body: `Installment for invoice #${invoice.id} for ${customer} is due in ${daysBefore} day(s).`,
//           sound: true,
//         },
//         trigger: {
//           date: remindAt,
//           channelId: "invoice-reminders",
//         } as any,
//       });
//     }
//     return;
//   }

//   // If we only have dueAt
//   const due = toDate(invoice.dueAt);
//   if (!due) return;

//   const remindAt = subtractDays(due, daysBefore);
//   if (!future(remindAt)) return;

//   await Notifications.scheduleNotificationAsync({
//     content: {
//       title: "Invoice Due Reminder",
//       body: `Invoice #${invoice.id} for ${customer} due in ${daysBefore} days. Amount: ${total.toLocaleString()}`,
//       sound: true,
//     },
//     trigger: {
//       date: remindAt,
//       channelId: "invoice-reminders",
//     } as any,
//   });
// }

import Constants from "expo-constants";
import { calculateInvoiceTotal } from "../store/invoices/calculations";
import { getInvoiceRemaining } from "../store/invoices/installments";
import type { Invoice } from "../store/invoices/models";

type ReminderDays = 1 | 2 | 3;

async function getNotifications(): Promise<
  typeof import("expo-notifications") | null
> {
  if (Constants.appOwnership === "expo") {
    // Expo Go supports local notifications; allow it.
  }
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}

function toDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function subtractDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function future(date: Date) {
  return date.getTime() > Date.now() + 60_000; // at least 1 minute in the future
}

export async function cancelAllInvoiceReminders() {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleInvoiceReminders(params: {
  invoice: Invoice;
  daysBefore: ReminderDays;
}) {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  const { invoice, daysBefore } = params;

  const remaining = getInvoiceRemaining(invoice);
  if (remaining <= 0) return;

  const total = calculateInvoiceTotal(invoice);
  const customer = invoice.customerName ?? invoice.customerPhone;

  // If there are installments: one reminder per installment
  if (invoice.installments?.length) {
    for (const inst of invoice.installments) {
      const due = toDate(inst.dueAt);
      if (!due) continue;

      const remindAt = subtractDays(due, daysBefore);
      if (!future(remindAt)) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Installment Due Reminder",
          body: `Installment for invoice #${invoice.id} for ${customer} is due in ${daysBefore} day(s).`,
          sound: true,
        },
        trigger: { date: remindAt, channelId: "invoice-reminders" } as any,
      });
    }
    return;
  }

  // If we only have dueAt
  const due = toDate(invoice.dueAt);
  if (!due) return;

  const remindAt = subtractDays(due, daysBefore);
  if (!future(remindAt)) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Invoice Due Reminder",
      body: `Invoice #${invoice.id} for ${customer} due in ${daysBefore} days. Amount: ${total.toLocaleString()}`,
      sound: true,
    },
    trigger: { date: remindAt, channelId: "invoice-reminders" } as any,
  });
}
