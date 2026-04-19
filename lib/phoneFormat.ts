/**
 * Formats raw digits into +7 (XXX) XXX-XX-XX mask.
 * Returns both the display value and the raw digits.
 */
export function formatPhone(raw: string): { display: string; digits: string } {
  // Strip everything except digits
  let digits = raw.replace(/\D/g, "");

  // Normalise: if starts with 8 or 7, strip leading country code
  if (digits.startsWith("8") || digits.startsWith("7")) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);

  let display = "+7";
  if (digits.length > 0) display += ` (${digits.slice(0, 3)}`;
  if (digits.length >= 3) display += `)`;
  if (digits.length > 3) display += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) display += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) display += `-${digits.slice(8, 10)}`;

  return { display, digits: digits ? `7${digits}` : "" };
}
