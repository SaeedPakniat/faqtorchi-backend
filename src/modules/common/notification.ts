export async function sendSms(to: string, message: string) {
    // Stub implementation: replace with real provider integration
    console.log(`[SMS] to=${to} message=${message}`);
}

export async function sendEmail(to: string, subject: string, body: string) {
    // Stub implementation: replace with real provider integration
    console.log(`[EMAIL] to=${to} subject=${subject} body=${body}`);
}

export async function sendInvoiceIssuedNotification(params: { phone?: string | null; message: string }) {
    if (!params.phone) return;
    await sendSms(params.phone, params.message);
}
