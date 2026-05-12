export function normalizeTranslationKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getLocalizedProductName(name, t) {
  if (!name) return "";
  const direct = t?.products?.[name];
  if (direct) return direct;

  const normalizedTarget = normalizeTranslationKey(name);
  if (!normalizedTarget) return name;

  const entries = Object.entries(t?.products || {});
  const exactMatch = entries.find(([key]) => normalizeTranslationKey(key) === normalizedTarget);
  return exactMatch ? exactMatch[1] : name;
}

export function getSearchHintSuggestions(language = "en") {
  return language === "ke"
    ? ["maziwa", "mkate", "sukari", "mchele", "mafuta", "matunda"]
    : ["milk", "bread", "sugar", "rice", "oil", "fruits"];
}
