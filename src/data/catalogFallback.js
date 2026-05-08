import { KENYA_ALL_PRODUCTS } from "./kenya_products";

function normalizeCategory(category) {
  return String(category || "").trim().toLowerCase();
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
  const targetCategory = normalizeCategory(category);

  return KENYA_ALL_PRODUCTS.filter((product) => {
    return normalizeCategory(product._cat) === targetCategory;
  }).map((product, index) => withCatalogMeta(product, category, index));
}

export function mergeCategoryProducts(category, liveProducts = []) {
  const merged = new Map(
    getFallbackCategoryProducts(category).map((product) => [product._uid, product])
  );

  liveProducts.forEach((product, index) => {
    const normalizedProduct = withCatalogMeta(product, category, index);
    merged.set(normalizedProduct._uid, normalizedProduct);
  });

  return [...merged.values()];
}

export function getFallbackProductByUid(category, uid) {
  if (!uid) return null;

  const directMatch = KENYA_ALL_PRODUCTS.find((product) => product._uid === uid);
  if (directMatch) {
    return directMatch;
  }

  const targetCategory = normalizeCategory(category);
  return (
    KENYA_ALL_PRODUCTS.find((product) => {
      return (
        normalizeCategory(product._cat) === targetCategory &&
        `${product._cat}_${product._index}` === uid
      );
    }) || null
  );
}

export function getFallbackDeals(limit = 4) {
  return KENYA_ALL_PRODUCTS.filter((product) => product.oldPrice).slice(0, limit);
}
