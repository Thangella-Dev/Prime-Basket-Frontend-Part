export const PHONE_COUNTRIES = {
  IN: {
    code: "IN",
    region: "in",
    name: "India",
    dial: "+91",
    error: "Enter a valid Indian mobile number",
    placeholder: "9XXXXXXXXX",
  },
  KE: {
    code: "KE",
    region: "ke",
    name: "Kenya",
    dial: "+254",
    error: "Enter a valid Kenyan mobile number",
    placeholder: "0712345678 or +254712345678",
  },
};

export function getPhoneCountry(countryOrRegion = "in") {
  const key = String(countryOrRegion || "").toUpperCase();
  if (key === "KE" || key === "KENYA") return PHONE_COUNTRIES.KE;
  if (key === "IN" || key === "INDIA") return PHONE_COUNTRIES.IN;
  return String(countryOrRegion || "").toLowerCase() === "ke"
    ? PHONE_COUNTRIES.KE
    : PHONE_COUNTRIES.IN;
}

export function sanitizePhoneInput(countryOrRegion, value) {
  const country = getPhoneCountry(countryOrRegion);
  const raw = String(value || "").trim();

  if (country.code === "IN") {
    return raw.replace(/\D/g, "").slice(0, 10);
  }

  if (raw.startsWith("+")) {
    return `+${raw.slice(1).replace(/\D/g, "").slice(0, 12)}`;
  }

  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) {
    const sub = digits.slice(3);
    if (sub.startsWith("0")) return sub.slice(0, 10);
    return sub.slice(0, 9);
  }
  if (digits.startsWith("0")) return digits.slice(0, 10);
  if (digits.startsWith("7") || digits.startsWith("1")) return digits.slice(0, 9);
  return digits.slice(0, 10);
}

export function getPhoneInputMaxLength(countryOrRegion, value = "") {
  const country = getPhoneCountry(countryOrRegion);
  if (country.code === "IN") return 10;
  const raw = String(value || "");
  if (raw.startsWith("+254")) return 13;
  if (raw.startsWith("7") || raw.startsWith("1")) return 9;
  return 10;
}

export function validateAndNormalizePhone(countryOrRegion, value) {
  const country = getPhoneCountry(countryOrRegion);
  const raw = String(value || "").trim();

  if (country.code === "IN") {
    const digits = raw.startsWith("+91") ? raw.slice(3).replace(/\D/g, "") : raw.replace(/\D/g, "");
    if (/^[6-9]\d{9}$/.test(digits)) {
      return { isValid: true, normalized: `+91${digits}`, error: "" };
    }
    return { isValid: false, normalized: "", error: PHONE_COUNTRIES.IN.error };
  }

  if (/^\+2540/.test(raw)) {
    return { isValid: false, normalized: "", error: PHONE_COUNTRIES.KE.error };
  }
  if (/^\+254[71]\d{8}$/.test(raw)) {
    return { isValid: true, normalized: raw, error: "" };
  }

  const digits = raw.replace(/\D/g, "");
  if (/^0[71]\d{8}$/.test(digits)) {
    return { isValid: true, normalized: `+254${digits.slice(1)}`, error: "" };
  }
  if (/^[71]\d{8}$/.test(digits)) {
    return { isValid: true, normalized: `+254${digits}`, error: "" };
  }

  return { isValid: false, normalized: "", error: PHONE_COUNTRIES.KE.error };
}

export function getEditablePhoneValue(countryOrRegion, value) {
  const country = getPhoneCountry(countryOrRegion);
  const raw = String(value || "").trim();
  if (country.code === "IN" && raw.startsWith("+91")) return raw.slice(3);
  if (country.code === "KE" && raw.startsWith("+254")) return raw.slice(4);
  return raw;
}

export function formatPhoneForDisplay(countryOrRegion, value) {
  const country = getPhoneCountry(countryOrRegion);
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (raw.startsWith("+")) return raw;

  const validation = validateAndNormalizePhone(country.code, raw);
  if (validation.isValid) return validation.normalized;

  const digits = raw.replace(/\D/g, "");
  if (country.code === "IN" && digits.length === 10) return `+91${digits}`;
  if (country.code === "KE" && digits.length === 9) return `+254${digits}`;
  if (country.code === "KE" && digits.length === 10 && digits.startsWith("0")) return `+254${digits.slice(1)}`;
  return raw;
}
