// Moldovan phone numbers: 0 + 8 digits (mobile 06x/07x, landline 022…),
// also accepted with the country code: +373 / 00373 / 373.

/** Digits as typed, max 13 (enough for +373 and spaces stripped). */
export const phoneInput = (v: string) => v.replace(/\D/g, "").slice(0, 13);

/** National format 0XXXXXXXX, or "" when it is not a valid Moldovan number. */
export const normalizeMdPhone = (raw: string): string => {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00373")) d = "0" + d.slice(5);
  else if (d.startsWith("373")) d = "0" + d.slice(3);
  return /^0\d{8}$/.test(d) ? d : "";
};

export const PHONE_ERROR = "Numărul trebuie să aibă 9 cifre și să înceapă cu 0 (ex: 069 123 456).";
export const PHONE_PLACEHOLDER = "Ex: 069 123 456";
