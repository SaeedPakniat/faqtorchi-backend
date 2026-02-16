export function normalizeIranPhone(input: string) {
  // Digits only
  const digitsOnly = input.replace(/\D/g, "");

  // Max 11 digits (e.g., 09xxxxxxxxx)
  const trimmed = digitsOnly.slice(0, 11);

  return trimmed;
}

export function isValidIranPhone(phone: string) {
  // Simple and practical: 11 digits starting with 09
  return /^09\d{9}$/.test(phone);
}
