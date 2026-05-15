// src/hooks/useSearch.js
import { useCallback, useEffect, useState } from "react";
import { database, hasFirebaseConfig } from "../firebase";
import { ref, get } from "firebase/database";
import { INDIA_ALL_PRODUCTS } from "../data/india_products";
import { KENYA_ALL_PRODUCTS } from "../data/kenya_products";

const ALL_CATS = [
  { value: "rice",               label: "Rice" },
  { value: "oil",                label: "Oil" },
  { value: "wheat-flour",        label: "Wheat Flour" },
  { value: "salt",               label: "Salt" },
  { value: "sugar",              label: "Sugar" },
  { value: "chilli-powder",      label: "Chilli Powder" },
  { value: "turmeric-powder",    label: "Turmeric Powder" },
  { value: "pulses",             label: "Pulses" },
  { value: "masala",             label: "Masala" },
  { value: "fruits",             label: "Fruits" },
  { value: "vegetables",         label: "Vegetables" },
  { value: "dairyProducts",      label: "Dairy Products" },
  { value: "feminineHygiene",    label: "Feminine Hygiene" },
  { value: "homeNeeds",          label: "Home Needs" },
  { value: "babyCare",           label: "Baby Care" },
  { value: "instantFood",        label: "Instant Food" },
  { value: "milkPowders",        label: "Milk Powders" },
  { value: "chipsAndNamkeens",   label: "Chips & Namkeens" },
  { value: "oralCare",           label: "Oral Care" },
  { value: "biscuitsAndCookies", label: "Biscuits & Cookies" },
  { value: "coolDrinks",         label: "Cool Drinks" },
  { value: "bodyCare",           label: "Body Care" },
];

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const categoryLabelMap = Object.fromEntries(ALL_CATS.map((cat) => [cat.value, cat.label]));

const toIndexedProduct = (product, catValue, index) => ({
  ...product,
  _cat: product._cat || catValue,
  _catLabel: product._catLabel || categoryLabelMap[product._cat || catValue] || catValue,
  _index: product._index ?? index,
  _uid: product._uid || `${product._cat || catValue}_${index}`,
});

const buildFallbackIndex = (region = "in") => ({
  products: (region === "ke" ? KENYA_ALL_PRODUCTS : INDIA_ALL_PRODUCTS).map((product, index) =>
    toIndexedProduct(product, product._cat || "general", index)
  ),
  categories: ALL_CATS,
});

// Build the full index once and cache it in module scope.
// Keep this after helper declarations so production bundles do not hit TDZ errors.
let cachedIndex = buildFallbackIndex("in");
let indexPromise = null;
let liveIndexHydrated = false;

const scoreProduct = (product, query) => {
  const name = normalize(product.name);
  const brand = normalize(product.brand);
  const category = normalize(product._catLabel);
  const badge = normalize(product.badge);

  if (name.startsWith(query)) return 120;
  if (brand.startsWith(query)) return 105;
  if (name.includes(query)) return 92;
  if (brand.includes(query)) return 78;
  if (category.includes(query)) return 62;
  if (badge.includes(query)) return 42;
  return 0;
};

async function buildIndex() {
  if (liveIndexHydrated) return cachedIndex;
  if (indexPromise) return indexPromise;

  if (!hasFirebaseConfig || !database) {
    liveIndexHydrated = true;
    return cachedIndex;
  }

  indexPromise = Promise.allSettled(
    ALL_CATS.map((cat) =>
      get(ref(database, "categories/" + cat.value)).then((snap) => {
        const val = snap.val();
        if (!val) return [];
        return Object.values(val).map((p, i) => toIndexedProduct(p, cat.value, i));
      })
    )
  ).then((results) => {
    const liveProducts = results
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value || []);

    const mergedProducts = new Map(buildFallbackIndex("in").products.map((product) => [product._uid, product]));

    liveProducts.forEach((product) => {
      mergedProducts.set(product._uid, product);
    });

    cachedIndex = {
      products: [...mergedProducts.values()],
      categories: ALL_CATS,
    };
    indexPromise = null;
    liveIndexHydrated = true;
    return cachedIndex;
  }).catch(() => {
    indexPromise = null;
    liveIndexHydrated = true;
    return cachedIndex;
  });

  return indexPromise;
}

// ── Main hook ────────────────────────────────────────────────────────────────
export function useSearch(region = "in") {
  const [indexReady, setIndexReady] = useState(true);
  const isKenya = region === "ke";

  useEffect(() => {
    if (isKenya) {
      setIndexReady(true);
      return;
    }
    if (!liveIndexHydrated) {
      buildIndex()
        .then(() => setIndexReady(true))
        .catch(() => setIndexReady(true));
    }
  }, [isKenya]);

  /**
   * Returns { categories: [...], products: [...] }
   * - categories: matching category objects  { value, label }
   * - products:   matching product objects   (with _cat, _uid, etc.)
   */
  const search = useCallback((query) => {
    const activeIndex = isKenya ? buildFallbackIndex("ke") : cachedIndex;

    if (!activeIndex || !query || query.trim().length < 1) {
      return { categories: [], products: [] };
    }

    const q = normalize(query);

    const categories = activeIndex.categories.filter((c) =>
      normalize(c.label).includes(q) || normalize(c.value).includes(q)
    );

    const products = activeIndex.products
      .map((product) => ({ product, score: scoreProduct(product, q) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.product)
      .slice(0, 12);

    return { categories, products };
  }, [isKenya]);

  return { search, indexReady };
}
