import { INDIA_ALL_PRODUCTS } from "./india_products";
import { KENYA_ALL_PRODUCTS } from "./kenya_products";

function normalizeCategory(category) {
  return String(category || "").trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

const INDIA_PRODUCT_NAMES = new Set(INDIA_ALL_PRODUCTS.map((product) => normalizeText(product.name)));
const INDIA_BRANDS = new Set(INDIA_ALL_PRODUCTS.map((product) => normalizeText(product.brand)));
const KENYA_PRODUCT_NAMES = new Set(KENYA_ALL_PRODUCTS.map((product) => normalizeText(product.name)));
const KENYA_BRANDS = new Set(KENYA_ALL_PRODUCTS.map((product) => normalizeText(product.brand)));

function isLikelyKenyaProduct(product) {
  if (!product || typeof product !== "object") return false;

  const uid = normalizeText(product._uid);
  const price = `${product.price || ""} ${product.oldPrice || ""}`.toLowerCase();
  const regionText = `${product.region || ""} ${product.country || ""} ${product.currency || ""}`.toLowerCase();
  const name = normalizeText(product.name);
  const brand = normalizeText(product.brand);

  if (uid.startsWith("ke_")) return true;
  if (price.includes("kes")) return true;
  if (regionText.includes("kenya") || regionText.includes(" ke ") || regionText.endsWith(" ke")) return true;
  if (name && KENYA_PRODUCT_NAMES.has(name) && !INDIA_PRODUCT_NAMES.has(name)) return true;
  if (brand && KENYA_BRANDS.has(brand) && !INDIA_BRANDS.has(brand)) return true;

  return false;
}

export function filterProductsForRegion(products = [], region = "in") {
  const source = Array.isArray(products) ? products : [];
  if (region === "ke") return source;
  return source.filter((product) => !isLikelyKenyaProduct(product));
}

// Generate stable UID based on product properties, not array index
function generateStableUid(product, category) {
  const cat = normalizeCategory(category || product._cat);
  const name = (product.name || "").toLowerCase().trim().replace(/\s+/g, '-');
  const brand = (product.brand || "").toLowerCase().trim().replace(/\s+/g, '-');

  const legacyIndexUid = typeof product._uid === 'string' && /^.+_\d+$/.test(product._uid);
  if (product._uid && !legacyIndexUid) {
    return product._uid;
  }

  if (name && brand) {
    return `${cat}_${brand}_${name}`;
  }
  if (name) {
    return `${cat}_${name}`;
  }

  const index = product._index ?? 0;
  return `${cat}_${index}`;
}

function withCatalogMeta(product, category, index) {
  const stableUid = generateStableUid(product, category);
  
  return {
    ...product,
    _cat: product._cat || category,
    _index: product._index ?? index,
    _uid: stableUid,
    stock: product.stock ?? 18,
    inStock: product.inStock !== false,
    delivery: product.delivery || (product.badge?.toLowerCase() === "sale" ? "10 min" : "Today 6PM"),
    standard: product.standard || "1 unit",
  };
}

export function getFallbackCategoryProducts(category) {
  return getFallbackCategoryProductsByRegion(category, "in");
}

function getCatalogForRegion(region = "in") {
  return region === "ke" ? KENYA_ALL_PRODUCTS : INDIA_ALL_PRODUCTS;
}

export function getFallbackCategoryProductsByRegion(category, region = "in") {
  const targetCategory = normalizeCategory(category);
  const catalog = getCatalogForRegion(region);

  return catalog.filter((product) => {
    return normalizeCategory(product._cat) === targetCategory;
  }).map((product, index) => withCatalogMeta(product, category, index));
}

export function mergeCategoryProducts(category, liveProducts = [], region = "in") {
  const safeLiveProducts = filterProductsForRegion(liveProducts, region);
  const merged = new Map(
    getFallbackCategoryProductsByRegion(category, region).map((product) => [product._uid, product])
  );

  safeLiveProducts.forEach((product, index) => {
    const normalizedProduct = withCatalogMeta(product, category, index);
    merged.set(normalizedProduct._uid, normalizedProduct);
  });

  return [...merged.values()];
}

export function getFallbackProductByUid(category, uid) {
  if (!uid) return null;

  const directMatch = [...INDIA_ALL_PRODUCTS, ...KENYA_ALL_PRODUCTS].find((product) => product._uid === uid);
  if (directMatch) {
    return directMatch;
  }

  const targetCategory = normalizeCategory(category);
  return (
    [...INDIA_ALL_PRODUCTS, ...KENYA_ALL_PRODUCTS].find((product) => {
      return (
        normalizeCategory(product._cat) === targetCategory &&
        `${product._cat}_${product._index}` === uid
      );
    }) || null
  );
}

export function getFallbackDeals(limit = 4, region = "in") {
  return getCatalogForRegion(region).filter((product) => product.oldPrice).slice(0, limit);
}
