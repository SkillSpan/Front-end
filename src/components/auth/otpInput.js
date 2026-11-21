// Shared behaviour for the 6-box verification code inputs (sign-up OTP and
// password-reset code). Pure helpers so they are easy to test.

export const OTP_LENGTH = 6;

/** Keep digits only (also converts Arabic-Indic and Persian digits to 0-9). */
export function onlyDigits(text) {
  return String(text ?? '')
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, '');
}

/**
 * Write `text`'s digits into `values` starting at `start`.
 * Returns { values, focusIndex, count } (count = digits written).
 */
export function fillDigits(values, start, text) {
  const digits = onlyDigits(text);
  const next = [...values];
  let i = start;
  for (const d of digits) {
    if (i >= next.length) break;
    next[i] = d;
    i += 1;
  }
  const count = i - start;
  const focusIndex = Math.min(Math.max(i - 1, 0), next.length - 1);
  return { values: next, focusIndex, count };
}

/**
 * What a box's onChange should do with the raw input value.
 * - one new digit: replace this box
 * - several digits (SMS autofill, typing over a filled box, paste without
 *   a paste event): distribute from this box
 */
export function nextFromInput(values, index, raw) {
  const digits = onlyDigits(raw);
  if (!digits) {
    if (String(raw ?? '') === '') {
      const next = [...values];
      next[index] = '';
      return { values: next, focusIndex: index, count: 0, cleared: true };
    }
    return null; // non-digit typed: ignore
  }
  if (digits.length === 2 && values[index]) {
    // typed over a filled box: keep the newly typed digit
    const fresh = digits[0] === values[index] ? digits[1] : digits[0];
    const next = [...values];
    next[index] = fresh;
    return { values: next, focusIndex: Math.min(index + 1, values.length - 1), count: 1 };
  }
  if (digits.length === 1) {
    const next = [...values];
    next[index] = digits;
    return { values: next, focusIndex: Math.min(index + 1, values.length - 1), count: 1 };
  }
  return fillDigits(values, index, digits);
}
