function extractNumericPortion(value) {
  const raw = String(value ?? "").trim();
  const match = raw.match(/\d[\d,]*(?:\.\d+)?/);
  return match ? match[0] : "";
}

function normalizeCurrencyContext(value = "en") {
  return value === "ke" || value === "region:ke" ? "ke" : "en";
}

export function getCurrencyPrefix(value = "en") {
  return normalizeCurrencyContext(value) === "ke" ? "KES " : "\u20b9";
}

export function parseCurrencyNumber(value) {
  return parseFloat(String(value ?? "").replace(/[^0-9.]/g, "")) || 0;
}

export function formatCurrencyDisplay(value, context = "en") {
  if (value == null || value === "") return "";
  const numericPortion = extractNumericPortion(value);
  if (!numericPortion) return String(value);
  return `${getCurrencyPrefix(context)}${numericPortion}`;
}

export function formatCurrencyAmount(amount, context = "en", decimals = 2) {
  const numeric = Number(amount || 0);
  const safeAmount = Number.isFinite(numeric) ? numeric : 0;
  return `${getCurrencyPrefix(context)}${safeAmount.toFixed(decimals)}`;
}
