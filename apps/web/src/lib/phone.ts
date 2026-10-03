/** Accepts local or international numbers: digits, spaces, dashes, parentheses, optional leading +. */
const PHONE_PATTERN = /^\+?[0-9(][0-9\s\-()]{5,18}[0-9]$/;

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(value.trim());
}

/** Normalises to a `tel:` URI with only digits and a leading +. */
export function toTelHref(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/[^0-9]/g, '');
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`;
}
