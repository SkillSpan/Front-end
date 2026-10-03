const ARABIC_LETTER_RE = /[\u0600-\u06FF]/;

export function getTextDirection(value = "") {
  return ARABIC_LETTER_RE.test(String(value)) ? "rtl" : "ltr";
}

export function getTextLanguage(value = "") {
  return getTextDirection(value) === "rtl" ? "ar" : "en";
}
