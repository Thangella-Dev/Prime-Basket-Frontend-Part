// src/pages/CategoryPage.jsx
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { database, hasFirebaseConfig } from "../firebase";
import { ref, get } from "firebase/database";
import { useT } from "../i18n/translations";
import { KENYA_ALL_PRODUCTS } from "../data/kenya_products";
import { mergeCategoryProducts } from "../data/catalogFallback";
import { formatCurrencyDisplay } from "../utils/currency";
import ProductCard from "../components/ProductCard";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES_DATA = [
  { value: "rice", icon: "fa-seedling", key: "rice" },
  { value: "oil", icon: "fa-tint", key: "oil" },
  { value: "wheat-flour", icon: "fa-bread-slice", key: "wheatflour" },
  { value: "salt", icon: "fa-mortar-pestle", key: "salt" },
  { value: "sugar", icon: "fa-cube", key: "sugar" },
  { value: "chilli-powder", icon: "fa-pepper-hot", key: "chillipowder" },
  { value: "turmeric-powder", icon: "fa-leaf", key: "turmericpowder" },
  { value: "pulses", icon: "fa-circle", key: "pulses" },
  { value: "masala", icon: "fa-mortar-pestle", key: "masala" },
  { value: "fruits", icon: "fa-apple-alt", key: "freshFruits" },
  { value: "vegetables", icon: "fa-carrot", key: "vegetables" },
  { value: "dairyProducts", icon: "fa-cheese", key: "dairyProducts" },
  { value: "feminineHygiene", icon: "fa-female", key: "feminineHygiene" },
  { value: "homeNeeds", icon: "fa-broom", key: "homeNeeds" },
  { value: "babyCare", icon: "fa-baby", key: "babyCare" },
  { value: "instantFood", icon: "fa-bolt", key: "instantFood" },
  { value: "milkPowders", icon: "fa-glass-whiskey", key: "milkPowders" },
  { value: "chipsAndNamkeens", icon: "fa-cookie-bite", key: "chipsNamkeens" },
  { value: "oralCare", icon: "fa-tooth", key: "oralCare" },
  { value: "biscuitsAndCookies", icon: "fa-cookie", key: "biscuitsCookies" },
  { value: "coolDrinks", icon: "fa-glass-cheers", key: "coolDrinks" },
  { value: "bodyCare", icon: "fa-spa", key: "bodyCare" },
];

const BADGE_CLS = ["bg-hot", "bg-sale", "bg-new", "bg-best"];

const getSortOptions = (t) => [
  { value: "default", label: t.filters.sortBy.default },
  { value: "price_asc", label: t.filters.sortBy.priceAsc },
  { value: "price_desc", label: t.filters.sortBy.priceDesc },
  { value: "top_rated", label: t.filters.sortBy.topRated },
  { value: "whats_new", label: t.filters.sortBy.whatsNew },
  { value: "best_discount", label: t.filters.sortBy.bestDiscount },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parsePrice(val) {
  if (typeof val === "number") return val;
  return parseFloat(String(val || "").replace(/[^0-9.]/g, "")) || 0;
}

function calcDiscount(price, oldPrice) {
  const p = parsePrice(price);
  const o = parsePrice(oldPrice);
  if (!o || !p || o <= p) return 0;
  return Math.round(((o - p) / o) * 100);
}

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const clampRange = (range, min, max) => {
  if (!range || range.length < 2) return [min, max];
  const start = Math.max(min, Math.min(Number(range[0]) || min, max));
  const end = Math.max(min, Math.min(Number(range[1]) || max, max));
  return start <= end ? [start, end] : [end, start];
};

const prepareCategoryProduct = (product, region) => ({
  ...product,
  price: formatCurrencyDisplay(product.price, region),
  oldPrice: product.oldPrice ? formatCurrencyDisplay(product.oldPrice, region) : product.oldPrice,
  _price: parsePrice(product.price),
  _oldPrice: parsePrice(product.oldPrice),
  _discount: calcDiscount(product.price, product.oldPrice),
});

// ─── RangeSlider component ────────────────────────────────────────────────────
function RangeSlider({ min, max, value, onChange, prefix = "", suffix = "", accent }) {
  const safeSpan = Math.max(max - min, 1);
  const pct = (v) => Math.min(100, Math.max(0, ((v - min) / safeSpan) * 100));
  const step = suffix === "%" ? 1 : safeSpan <= 250 ? 1 : safeSpan <= 1000 ? 5 : safeSpan <= 5000 ? 10 : 25;

  const handleMin = useCallback((e) => {
    const v = Number(e.target.value);
    if (v <= (value[1] ?? max)) onChange([v, value[1] ?? max]);
  }, [value, max, onChange]);

  const handleMax = useCallback((e) => {
    const v = Number(e.target.value);
    if (v >= (value[0] ?? min)) onChange([value[0] ?? min, v]);
  }, [value, min, onChange]);

  const safeVal = clampRange(value, min, max);

  return (
    <div style={{ padding: "4px 0 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: accent, marginBottom: 10 }}>
        <span style={{ background: `${accent}18`, padding: "2px 8px", borderRadius: 6 }}>{prefix}{safeVal[0]}{suffix}</span>
        <span style={{ background: `${accent}18`, padding: "2px 8px", borderRadius: 6 }}>{prefix}{safeVal[1]}{suffix}</span>
      </div>
      <div style={{ position: "relative", height: 32 }}>
        <div style={{ position: "absolute", top: 14, left: 0, right: 0, height: 4, background: "#e2e8f0", borderRadius: 999 }} />
        <div style={{
          position: "absolute", top: 14, height: 4,
          left: `${pct(safeVal[0])}%`,
          width: `${pct(safeVal[1]) - pct(safeVal[0])}%`,
          background: accent, borderRadius: 999,
        }} />
        <input
          type="range" min={min} max={max} step={step} value={safeVal[0]}
          onInput={handleMin}
          style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: 32,
            WebkitAppearance: "none", appearance: "none", background: "transparent",
            outline: "none", cursor: "pointer",
            zIndex: safeVal[0] > max - safeSpan * 0.1 ? 5 : 3,
          }}
          className="cp-range"
        />
        <input
          type="range" min={min} max={max} step={step} value={safeVal[1]}
          onInput={handleMax}
          style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: 32,
            WebkitAppearance: "none", appearance: "none", background: "transparent",
            outline: "none", cursor: "pointer", zIndex: 4,
          }}
          className="cp-range"
        />
        <div style={{ position: "absolute", top: 8, left: `calc(${pct(safeVal[0])}% - 8px)`, width: 16, height: 16, background: accent, border: "2.5px solid #fff", borderRadius: "50%", boxShadow: "0 2px 8px rgba(0,0,0,.2)", pointerEvents: "none", zIndex: 2 }} />
        <div style={{ position: "absolute", top: 8, left: `calc(${pct(safeVal[1])}% - 8px)`, width: 16, height: 16, background: accent, border: "2.5px solid #fff", borderRadius: "50%", boxShadow: "0 2px 8px rgba(0,0,0,.2)", pointerEvents: "none", zIndex: 2 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
        <span>{prefix}{min}{suffix}</span>
        <span>{prefix}{max}{suffix}</span>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CategoryPage({
  category, onCategoryChange, onBack,
  onAddCart, onDecreaseCart, onOpenProduct,
  cart = [], wishlist = [], toggleWishlist,
  language = "en",
  region = "in",
}) {
  const t = useT(language);
  const isKenya = region === "ke";

  // ── State ──────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() =>
    typeof document !== "undefined" ? document.body.dataset.theme || "light" : "light"
  );
  const isDark = theme === "dark";

  // Filter state
  const [brandSearch, setBrandSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [discountRange, setDiscountRange] = useState([0, 50]);
  const [sortBy, setSortBy] = useState("default");

  // UI state
  const [filterOpen, setFilterOpen] = useState(false);   // mobile bottom sheet
  const [sortOpen, setSortOpen] = useState(false);        // desktop dropdown
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false); // mobile sort sheet
  const [filterTab, setFilterTab] = useState("brand");    // mobile filter tab: brand | price | discount

  const pageTopRef = useRef(null);
  const productsRef = useRef(null);

  // ── Theme (palette) ────────────────────────────────────────────────────────
  const p = isDark
    ? {
        bg: "#0b1624",
        card: "#111e2e",
        cardAlt: "#0f1928",
        border: "rgba(74,95,130,0.35)",
        text: "#e8f0fb",
        textMuted: "#8fa8c8",
        textFaint: "#607a9c",
        accent: "#4d94ff",
        accentBg: "rgba(77,148,255,0.12)",
        danger: "#ff5c7a",
        success: "#22c55e",
        shadow: "0 4px 24px rgba(0,0,0,0.4)",
        shadowSm: "0 2px 8px rgba(0,0,0,0.3)",
      }
    : {
        bg: "#f0f4f8",
        card: "#ffffff",
        cardAlt: "#f8faff",
        border: "#dde5f0",
        text: "#1e3a5f",
        textMuted: "#5a7a9e",
        textFaint: "#94a8c0",
        accent: "#1d5ba0",
        accentBg: "#e8f0fb",
        danger: "#dc2626",
        success: "#16a34a",
        shadow: "0 4px 24px rgba(15,30,60,0.1)",
        shadowSm: "0 2px 8px rgba(15,30,60,0.07)",
      };

  const currPrefix = isKenya ? "KES " : "₹";

  // ── Category metadata ──────────────────────────────────────────────────────
  const activeKey = CATEGORIES_DATA.find((c) => c.value === category)?.key;
  const isAllView = category === "all";
  const activeLabel = isAllView
    ? (t.home?.allCategories || "All Categories")
    : (t.categories?.[activeKey] || category);
  const categorySelectOptions = [
    { value: "all", label: t.home?.allCategories || "All Categories" },
    ...CATEGORIES_DATA.map((cat) => ({
      value: cat.value,
      label: t.categories?.[cat.key] || cat.value,
    })),
  ];

  // ── Scroll reset ───────────────────────────────────────────────────────────
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    if (productsRef.current) {
      productsRef.current.scrollTop = 0;
    }
  }, []);

  useLayoutEffect(() => { scrollToTop(); }, [category]);

  // ── Theme observer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === "undefined") return;
    const sync = () => setTheme(document.body.dataset.theme || "light");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  // ── Load products ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!category) return;
    setLoading(true);
    setProducts([]);
    setSelectedBrands([]);
    setBrandSearch("");
    setSearchQuery("");
    setSortBy("default");

    const prep = (arr) => arr.map((p) => prepareCategoryProduct(p, region));

    const fromFallbackAll = () =>
      prep(
        CATEGORIES_DATA.flatMap((cat) =>
          mergeCategoryProducts(cat.value).map((product, i) => ({
            ...product, _cat: cat.value, _index: i,
            _uid: product._uid || `${cat.value}_${i}`,
          }))
        )
      );

    if (isAllView) {
      if (isKenya) {
        const final = prep(KENYA_ALL_PRODUCTS);
        setAllProducts(final); setProducts(final); setLoading(false);
        return;
      }
      if (!hasFirebaseConfig || !database) {
        const all = fromFallbackAll();
        setAllProducts(all); setProducts(all); setLoading(false);
        return;
      }
      get(ref(database, "categories"))
        .then((snap) => {
          const data = snap.val() || {};
          const raw = Object.entries(data).flatMap(([catKey, catProducts]) =>
            Object.values(catProducts || {}).map((product, i) => ({
              ...product, _cat: catKey, _index: i,
              _uid: product?._uid || `${catKey}_${i}`,
            }))
          );
          const merged = raw.length ? prep(raw) : fromFallbackAll();
          setAllProducts(merged); setProducts(merged); setLoading(false);
        })
        .catch(() => {
          const all = fromFallbackAll();
          setAllProducts(all); setProducts(all); setLoading(false);
        });
      return;
    }

    if (isKenya) {
      const targetCat = (category || "").toLowerCase().trim();
      const local = KENYA_ALL_PRODUCTS.filter(
        (prod) => (prod._cat || "").toLowerCase().trim() === targetCat
      );
      const final = prep(local);
      setAllProducts(final); setProducts(final); setLoading(false);
      return;
    }

    if (!hasFirebaseConfig || !database) {
      const fallback = prep(mergeCategoryProducts(category));
      setAllProducts(fallback); setProducts(fallback); setLoading(false);
      return;
    }

    get(ref(database, "categories/" + category))
      .then((snap) => {
        const data = snap.val();
        const merged = prep(
          mergeCategoryProducts(
            category,
            data
              ? Object.values(data).map((prod, i) => ({
                  ...prod, _cat: category, _index: i, _uid: `${category}_${i}`,
                }))
              : []
          )
        );
        setProducts(merged); setLoading(false);
      })
      .catch(() => {
        const fallback = prep(mergeCategoryProducts(category));
        setProducts(fallback); setLoading(false);
      });
  }, [category, language, region]);

  // ── Preload allProducts for cross-category search ──────────────────────────
  useEffect(() => {
    if (allProducts.length || !category) return;
    const prep = (arr) => arr.map((prod) => prepareCategoryProduct(prod, region));
    if (isKenya) {
      setAllProducts(prep(KENYA_ALL_PRODUCTS));
      return;
    }
    if (!hasFirebaseConfig || !database) {
      setAllProducts(
        prep(CATEGORIES_DATA.flatMap((cat) =>
          mergeCategoryProducts(cat.value).map((product, i) => ({
            ...product, _cat: cat.value, _index: i,
            _uid: product._uid || `${cat.value}_${i}`,
          }))
        ))
      );
      return;
    }
    get(ref(database, "categories"))
      .then((snap) => {
        const data = snap.val() || {};
        const raw = Object.entries(data).flatMap(([catKey, catProducts]) =>
          Object.values(catProducts || {}).map((product, i) => ({
            ...product, _cat: catKey, _index: i,
            _uid: product?._uid || `${catKey}_${i}`,
          }))
        );
        setAllProducts(raw.length ? prep(raw) : prep(CATEGORIES_DATA.flatMap((cat) =>
          mergeCategoryProducts(cat.value).map((product, i) => ({
            ...product, _cat: cat.value, _index: i,
            _uid: product._uid || `${cat.value}_${i}`,
          }))
        )));
      })
      .catch(() => {
        setAllProducts(prep(CATEGORIES_DATA.flatMap((cat) =>
          mergeCategoryProducts(cat.value).map((product, i) => ({
            ...product, _cat: cat.value, _index: i,
            _uid: product._uid || `${cat.value}_${i}`,
          }))
        )));
      });
  }, [allProducts.length, isKenya, region]);

  // ── Price & discount bounds ────────────────────────────────────────────────
  const priceBounds = useMemo(() => {
    const prices = products.map((prod) => prod._price).filter(Boolean);
    if (!prices.length) return [0, 5000];
    return [0, Math.ceil(Math.max(...prices) / 100) * 100];
  }, [products]);

  const discountBounds = useMemo(() => {
    const max = Math.max(0, ...products.map((prod) => prod._discount || 0));
    return [0, Math.max(10, Math.ceil(max / 5) * 5)];
  }, [products]);

  // Sync ranges when products change
  useEffect(() => { setPriceRange(priceBounds); }, [priceBounds[0], priceBounds[1]]);
  useEffect(() => { setDiscountRange(discountBounds); }, [discountBounds[0], discountBounds[1]]);

  // ── Brand list ─────────────────────────────────────────────────────────────
  const brandSource = useMemo(() =>
    searchQuery.trim() && allProducts.length ? allProducts : products,
    [searchQuery, allProducts, products]
  );

  const brandList = useMemo(() => {
    const map = {};
    brandSource.forEach((prod) => {
      if (prod.brand) map[prod.brand] = (map[prod.brand] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [brandSource]);

  const filteredBrands = useMemo(() =>
    brandList.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase())),
    [brandList, brandSearch]
  );

  const highlightedBrands = useMemo(() => {
    if (filteredBrands.length > 0) return filteredBrands;
    return brandList;
  }, [filteredBrands, brandList]);

  // Effective ranges (clamped)
  const effectivePriceRange = useMemo(
    () => clampRange(priceRange, priceBounds[0], priceBounds[1]),
    [priceRange, priceBounds]
  );
  const effectiveDiscountRange = useMemo(
    () => clampRange(discountRange, discountBounds[0], discountBounds[1]),
    [discountRange, discountBounds]
  );

  // ── Filtered & sorted products ─────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const q = normalizeText(searchQuery);
    const source = q && allProducts.length ? allProducts : products;
    let list = [...source];

    if (q) {
      list = list.filter(
        (prod) =>
          normalizeText(prod.name).includes(q) ||
          normalizeText(prod.brand).includes(q) ||
          normalizeText(prod.quantity).includes(q)
      );
    }

    if (selectedBrands.length > 0) {
      const set = new Set(selectedBrands.map(normalizeText));
      list = list.filter((prod) => set.has(normalizeText(prod.brand)));
    }

    list = list.filter(
      (prod) =>
        prod._price >= effectivePriceRange[0] &&
        prod._price <= effectivePriceRange[1] &&
        prod._discount >= effectiveDiscountRange[0] &&
        prod._discount <= effectiveDiscountRange[1]
    );

    switch (sortBy) {
      case "price_asc":   list.sort((a, b) => a._price - b._price); break;
      case "price_desc":  list.sort((a, b) => b._price - a._price); break;
      case "top_rated":   list.sort((a, b) => (b.stars || 0) - (a.stars || 0)); break;
      case "whats_new":   list.sort((a, b) => b._index - a._index); break;
      case "best_discount": list.sort((a, b) => b._discount - a._discount); break;
      default: break;
    }

    return list;
  }, [products, allProducts, searchQuery, selectedBrands, effectivePriceRange, effectiveDiscountRange, sortBy]);

  // ── Active filter tags ─────────────────────────────────────────────────────
  const activeTags = useMemo(() => {
    const tags = [];
    if (searchQuery.trim()) tags.push({ key: "search", label: `"${searchQuery.trim()}"`, onRemove: () => setSearchQuery("") });
    selectedBrands.forEach((b) =>
      tags.push({ key: `brand_${b}`, label: b, onRemove: () => setSelectedBrands((prev) => prev.filter((x) => x !== b)) })
    );
    if (effectivePriceRange[0] !== priceBounds[0] || effectivePriceRange[1] !== priceBounds[1]) {
      tags.push({
        key: "price",
        label: `${currPrefix}${effectivePriceRange[0]}–${currPrefix}${effectivePriceRange[1]}`,
        onRemove: () => setPriceRange(priceBounds),
      });
    }
    if (effectiveDiscountRange[0] !== discountBounds[0] || effectiveDiscountRange[1] !== discountBounds[1]) {
      tags.push({
        key: "discount",
        label: `${effectiveDiscountRange[0]}%–${effectiveDiscountRange[1]}% off`,
        onRemove: () => setDiscountRange(discountBounds),
      });
    }
    return tags;
  }, [searchQuery, selectedBrands, effectivePriceRange, effectiveDiscountRange, priceBounds, discountBounds, currPrefix]);

  const activeFilterCount = activeTags.length;

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedBrands([]);
    setBrandSearch("");
    setPriceRange(priceBounds);
    setDiscountRange(discountBounds);
    setSortBy("default");
  }, [priceBounds, discountBounds]);

  const toggleBrand = useCallback((name) => {
    setSelectedBrands((prev) =>
      prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]
    );
  }, []);

  const handleAllDeals = useCallback(() => {
    setDiscountRange([Math.max(discountBounds[0], Math.min(5, discountBounds[1])), discountBounds[1]]);
    setSortBy("best_discount");
    setSearchQuery("");
  }, [discountBounds]);

  // ── Product helpers ────────────────────────────────────────────────────────
  const getTranslatedName = useCallback((name) => {
    if (!name) return "";
    if (t.products?.[name]) return t.products[name];
    const entries = Object.entries(t.products || {}).sort((a, b) => b[0].length - a[0].length);
    for (const [key, val] of entries) {
      if (name.toLowerCase().includes(key.toLowerCase())) return val;
    }
    return name;
  }, [t]);

  const getStockInfo = useCallback((item) => {
    if (item.inStock === false) return { text: t.product?.outOfStock || "Out of stock", cls: "outofstock", disabled: true };
    if (item.stock != null && item.stock <= 3) return { text: `Only ${item.stock} left`, cls: "warning", disabled: false };
    return { text: t.product?.inStock || "In Stock", cls: "instock", disabled: false };
  }, [t]);

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      if (navigator.share) await navigator.share({ title: activeLabel, url: window.location.href });
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(window.location.href);
    } catch { /* ignore */ }
  }, [activeLabel]);

  // ── Sort label ─────────────────────────────────────────────────────────────
  const sortLabel = sortBy === "default"
    ? "Sort By"
    : (getSortOptions(t).find((o) => o.value === sortBy)?.label || "Sort By");

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Filter sidebar content (shared between desktop sidebar + mobile drawer)
  // ══════════════════════════════════════════════════════════════════════════
  const renderBrandFilter = () => (
    <div>
      {/* Top brands quick-select */}
      {brandList.slice(0, 8).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: p.textFaint, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
            Popular
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {brandList.slice(0, 8).map(({ name }) => {
              const active = selectedBrands.includes(name);
              return (
                <button
                  key={name}
                  onClick={() => toggleBrand(name)}
                  style={{
                    padding: "5px 11px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: `1.5px solid ${active ? p.accent : p.border}`,
                    background: active ? p.accentBg : "transparent",
                    color: active ? p.accent : p.text,
                    transition: "all .15s",
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Brand search + list */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <i className="fas fa-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: p.textFaint, fontSize: 12 }} />
        <input
          type="text"
          placeholder="Search brands…"
          value={brandSearch}
          onChange={(e) => setBrandSearch(e.target.value)}
          style={{
            width: "100%", padding: "9px 12px 9px 32px", borderRadius: 10,
            border: `1.5px solid ${p.border}`, background: p.card, color: p.text,
            fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
          }}
        />
      </div>

      <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {filteredBrands.length === 0 ? (
          <div style={{ fontSize: 12, color: p.textFaint, padding: "8px 4px" }}>No brands found</div>
        ) : filteredBrands.map(({ name, count }) => {
          const active = selectedBrands.includes(name);
          return (
            <label key={name} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
              borderRadius: 10, cursor: "pointer",
              background: active ? p.accentBg : "transparent",
              transition: "background .12s",
            }}>
              <input
                type="checkbox" checked={active} onChange={() => toggleBrand(name)}
                style={{ accentColor: p.accent, width: 15, height: 15, cursor: "pointer", flexShrink: 0 }}
              />
              <span style={{ flex: 1, fontSize: 13, color: p.text, fontWeight: active ? 700 : 400 }}>{name}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20,
                background: active ? `${p.accent}22` : p.cardAlt,
                color: active ? p.accent : p.textFaint,
              }}>{count}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  const renderPriceFilter = () => (
    <RangeSlider
      min={priceBounds[0]} max={priceBounds[1]}
      value={effectivePriceRange} onChange={setPriceRange}
      prefix={currPrefix} accent={p.accent}
    />
  );

  const renderDiscountFilter = () => (
    <RangeSlider
      min={discountBounds[0]} max={discountBounds[1]}
      value={effectiveDiscountRange} onChange={setDiscountRange}
      suffix="%" accent={p.accent}
    />
  );

  // Full desktop sidebar filter panel
  const renderDesktopFilterPanel = () => (
    <div style={{
      background: p.card, borderRadius: 16, border: `1px solid ${p.border}`,
      overflow: "hidden", boxShadow: "0 20px 40px rgba(15,30,60,0.16)",
    }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${p.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14, color: p.text }}>
          <i className="fas fa-sliders-h" style={{ color: p.accent }} />
          Refine results
          {activeFilterCount > 0 && (
            <span style={{ background: p.accent, color: "#fff", fontSize: 11, fontWeight: 800, padding: "1px 7px", borderRadius: 20, minWidth: 20, textAlign: "center" }}>{activeFilterCount}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} style={{ background: "none", border: "none", color: p.danger, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Clear all
            </button>
          )}
          <button onClick={() => setDesktopFiltersOpen(false)} style={{ width: 30, height: 30, borderRadius: 999, border: `1px solid ${p.border}`, background: p.cardAlt, color: p.textMuted, cursor: "pointer" }}>
            <i className="fas fa-times" />
          </button>
        </div>
      </div>

      <div style={{ padding: 14, display: "grid", gap: 12 }}>
        <div style={{ padding: 14, borderRadius: 14, border: `1px solid ${p.border}`, background: p.cardAlt }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: p.text, textTransform: "uppercase", letterSpacing: ".06em" }}>Brand</div>
            <span style={{ fontSize: 11, color: p.textFaint, fontWeight: 800 }}>{selectedBrands.length || brandList.length}</span>
          </div>
          {highlightedBrands.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {highlightedBrands.slice(0, 6).map(({ name }) => {
                const active = selectedBrands.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleBrand(name)}
                    style={{
                      border: `1px solid ${active ? p.accent : p.border}`,
                      background: active ? p.accentBg : p.card,
                      color: active ? p.accent : p.text,
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}
          {renderBrandFilter()}
        </div>

        <div style={{ padding: 14, borderRadius: 14, border: `1px solid ${p.border}`, background: p.cardAlt }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: p.text, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Price Range</div>
          {renderPriceFilter()}
        </div>

        <div style={{ padding: 14, borderRadius: 14, border: `1px solid ${p.border}`, background: p.cardAlt }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: p.text, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Discount</div>
          {renderDiscountFilter()}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: activeFilterCount > 0 ? "1fr auto" : "1fr", gap: 10 }}>
          <button
            type="button"
            onClick={() => setDesktopFiltersOpen(false)}
            style={{
              minHeight: 42,
              borderRadius: 12,
              border: `1px solid ${p.border}`,
              background: p.card,
              color: p.text,
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Apply Filters
          </button>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              style={{
                minHeight: 42,
                padding: "0 14px",
                borderRadius: 12,
                border: `1px solid ${p.border}`,
                background: p.card,
                color: p.danger,
                fontSize: 12.5,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Product card
  // ══════════════════════════════════════════════════════════════════════════
  const renderProductCard = (item, index) => {
    const inCart = cart.find((c) => c._uid === item._uid);
    const qty = inCart ? inCart.quantity : 0;
    const isWished = wishlist.some((w) => w._uid === item._uid);
    const disc = item._discount;
    const name = getTranslatedName(item.name);
    const stock = getStockInfo(item);
    const deliveryText = item.delivery || (item.oldPrice ? "10 min" : "Today 6PM");

    return (
      <div
        key={item._uid}
        className="cp-product-card pcard"
        onClick={() => onOpenProduct?.(item)}
        style={{ cursor: "pointer", position: "relative" }}
      >
        {disc > 0 ? (
          <span className={`pbadge ${BADGE_CLS[index % BADGE_CLS.length]}`}>-{disc}%</span>
        ) : item.badge ? (
          <span className={`pbadge ${BADGE_CLS[index % BADGE_CLS.length]}`}>
            {t.badges?.[item.badge?.toLowerCase()] || item.badge}
          </span>
        ) : null}

        <span className="delivery-badge">{deliveryText}</span>

        <button
          className="pwish"
          style={isWished ? { opacity: 1, background: "#ff3b81", color: "#fff" } : {}}
          onClick={(e) => { e.stopPropagation(); toggleWishlist?.(item); }}
        >
          <i className={isWished ? "fas fa-heart" : "far fa-heart"} />
        </button>

        <div className="pimg">
          <img src={item.imageUrl} alt={name} loading="lazy" />
        </div>

        <div className="pbrand">{item.brand}</div>
        <div className="pname">{name}</div>
        <div className="pweight">{item.standard || item.unit || item.quantity || "1 unit"}</div>

        {item.stars != null && (
          <div className="pstars">
            <i className="fas fa-star" style={{ color: "#f59e0b" }} />
            {" "}{item.stars}
            {item.reviews && <span> ({item.reviews})</span>}
          </div>
        )}

        <div className="pprice">
          <span className="pnew">
            {isKenya ? String(item.price || "").replace("₹", "KES ") : item.price}
          </span>
          {item.oldPrice && (
            <span className="pold">
              {isKenya ? String(item.oldPrice || "").replace("₹", "KES ") : item.oldPrice}
            </span>
          )}
        </div>

        <div className={`pstock ${stock.cls}`}>{stock.text}</div>

        <div className="p-action-row" onClick={(e) => e.stopPropagation()}>
          {qty > 0 ? (
            <div className="qty-control catalog-qty-control">
              <button className="qty-control-btn" onClick={() => onDecreaseCart?.(item._uid)}>−</button>
              <span className="qty-control-value">{qty}</span>
              <button className="qty-control-btn" onClick={() => onAddCart?.(item)}>+</button>
            </div>
          ) : (
            <button
              className="padd"
              disabled={stock.disabled}
              onClick={() => onAddCart?.(item)}
            >
              <i className="fas fa-basket-shopping" /> {t.home?.add || "Add"}
            </button>
          )}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Skeleton
  // ══════════════════════════════════════════════════════════════════════════
  const renderSkeleton = () => (
    <div className="cp-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="premium-product-skeleton premium-skeleton-surface" aria-hidden="true">
          <div className="premium-skeleton-media" />
          <div className="premium-skeleton-body">
            <span className="premium-skeleton-pill" />
            <span className="premium-skeleton-line premium-skeleton-line-lg" />
            <span className="premium-skeleton-line premium-skeleton-line-md" />
            <span className="premium-skeleton-line premium-skeleton-line-sm" />
            <div className="premium-skeleton-price-row">
              <span className="premium-skeleton-price" />
              <span className="premium-skeleton-price-muted" />
            </div>
            <span className="premium-skeleton-cta" />
          </div>
        </div>
      ))}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // JSX
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="cp-root"
      style={{ background: p.bg, minHeight: "100vh", color: p.text }}
      onClick={() => { setSortOpen(false); setDesktopFiltersOpen(false); }}
    >
      {/* ── Styles ── */}
      <style>{`
        /* ── Range input reset ── */
        .cp-range { -webkit-appearance:none; appearance:none; background:transparent; outline:none; touch-action:pan-y; }
        .cp-range::-webkit-slider-runnable-track { background:transparent; }
        .cp-range::-webkit-slider-thumb { -webkit-appearance:none; width:0; height:0; }
        .cp-range::-moz-range-track { background:transparent; border:none; }
        .cp-range::-moz-range-thumb { width:0; height:0; border:none; background:transparent; }

        /* ── Layout ── */
        .cp-root { font-family: "Outfit","Quicksand",system-ui,sans-serif; }
        .cp-layout {
          display: grid;
          grid-template-columns: 240px minmax(0,1fr);
          gap: 20px;
          max-width: 1440px;
          margin: 0 auto;
          padding: 20px 16px 40px;
          align-items: start;
        }
        .cp-layout.filters-open {
          grid-template-columns: 240px minmax(0,1fr) 330px;
        }

        /* ── Sidebar ── */
        .cp-sidebar,
        .cp-filter-sidebar {
          position: sticky;
          top: 138px;
          max-height: calc(100vh - 154px);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: ${p.accent}44 transparent;
        }
        .cp-sidebar::-webkit-scrollbar,
        .cp-filter-sidebar::-webkit-scrollbar { width: 4px; }
        .cp-sidebar::-webkit-scrollbar-thumb,
        .cp-filter-sidebar::-webkit-scrollbar-thumb { background: ${p.accent}44; border-radius: 4px; }
        .cp-filter-sidebar {
          display: none;
        }
        .cp-layout.filters-open .cp-filter-sidebar {
          display: flex;
        }

        /* ── Category nav ── */
        .cp-cat-nav { background: ${p.card}; border-radius: 16px; border: 1px solid ${p.border}; overflow: hidden; box-shadow: ${p.shadowSm}; }
        .cp-cat-nav-title { padding: 14px 16px 10px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: ${p.textFaint}; border-bottom: 1px solid ${p.border}; }
        .cp-cat-nav-list { max-height: 320px; overflow-y: auto; padding: 6px 0; scrollbar-width: thin; scrollbar-color: ${p.accent}44 transparent; }
        .cp-cat-nav-list::-webkit-scrollbar { width: 3px; }
        .cp-cat-nav-list::-webkit-scrollbar-thumb { background: ${p.accent}44; border-radius: 3px; }
        .cp-cat-item { display: flex; align-items: center; gap: 10px; padding: 9px 14px; cursor: pointer; font-size: 13px; font-weight: 500; color: ${p.textMuted}; transition: all .12s; border-left: 3px solid transparent; }
        .cp-cat-item:hover { background: ${p.accentBg}; color: ${p.accent}; }
        .cp-cat-item.active { background: ${p.accentBg}; color: ${p.accent}; font-weight: 700; border-left-color: ${p.accent}; }
        .cp-cat-item .cp-cat-icon { width: 28px; height: 28px; border-radius: 8px; background: ${p.cardAlt}; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; }
        .cp-cat-item.active .cp-cat-icon { background: ${p.accentBg}; color: ${p.accent}; }

        /* ── Main content ── */
        .cp-main { min-width: 0; }
        .cp-toolbar-shell {
          position: sticky;
          top: 82px;
          z-index: 40;
          margin-bottom: 14px;
        }

        /* ── Toolbar ── */
        .cp-toolbar {
          background: ${p.card};
          border-radius: 14px;
          border: 1px solid ${p.border};
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          box-shadow: 0 12px 28px rgba(15,30,60,0.08);
        }
        .cp-toolbar-meta { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 700; color: ${p.textMuted}; white-space: nowrap; }
        .cp-toolbar-meta strong { color: ${p.text}; font-size: 14px; font-weight: 800; }
        .cp-search-wrap { flex: 1; min-width: 220px; max-width: 360px; position: relative; }
        .cp-search-wrap i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: ${p.textFaint}; font-size: 13px; }
        .cp-search-input {
          width: 100%; padding: 9px 12px 9px 36px; border-radius: 10px;
          border: 1.5px solid ${p.border}; background: ${p.cardAlt}; color: ${p.text};
          font-size: 13.5px; outline: none; box-sizing: border-box; font-family: inherit;
          transition: border-color .15s;
        }
        .cp-search-input:focus { border-color: ${p.accent}; }

        .cp-toolbar-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; margin-left: auto; }
        .cp-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1.5px solid ${p.border}; background: ${p.card}; color: ${p.text}; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap; transition: all .15s; }
        .cp-btn:hover { background: ${p.accentBg}; border-color: ${p.accent}; color: ${p.accent}; }
        .cp-btn-accent { background: ${p.accent}; color: #fff; border-color: ${p.accent}; }
        .cp-btn-accent:hover { opacity: .9; }
        .cp-badge { background: ${p.accent}; color: #fff; border-radius: 20px; padding: 1px 7px; font-size: 11px; font-weight: 800; min-width: 18px; text-align: center; }
        .cp-select-wrap { position: relative; min-width: 190px; }
        .cp-select-wrap i.cp-select-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: ${p.textFaint}; font-size: 12px; pointer-events: none; }
        .cp-select-wrap i.cp-select-chevron { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: ${p.textFaint}; font-size: 10px; pointer-events: none; }
        .cp-select { width: 100%; min-height: 38px; padding: 0 34px 0 34px; border-radius: 10px; border: 1.5px solid ${p.border}; background: ${p.card}; color: ${p.text}; font-size: 13px; font-weight: 700; font-family: inherit; appearance: none; -webkit-appearance: none; -moz-appearance: none; cursor: pointer; outline: none; }
        /* ── Sort dropdown ── */
        .cp-sort-wrap { position: relative; }
        .cp-sort-menu {
          position: absolute; top: calc(100% + 6px); right: 0; min-width: 200px;
          background: ${p.card}; border: 1.5px solid ${p.border}; border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,.12); z-index: 200; overflow: hidden;
          animation: cpFadeDown .15s ease;
        }
        .cp-sort-item { padding: 10px 16px; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 10px; transition: background .1s; color: ${p.text}; }
        .cp-sort-item:hover { background: ${p.accentBg}; }
        .cp-sort-item.active { color: ${p.accent}; font-weight: 700; background: ${p.accentBg}; }

        /* ── Result count + tags ── */
        .cp-result-info { font-size: 13px; color: ${p.textMuted}; font-weight: 500; margin-bottom: 10px; }
        .cp-result-info strong { color: ${p.accent}; font-weight: 800; }
        .cp-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .cp-tag { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; background: ${p.accentBg}; color: ${p.accent}; border: 1px solid ${p.accent}44; }
        .cp-tag-rm { background: none; border: none; color: ${p.accent}; cursor: pointer; padding: 0; font-size: 12px; display: flex; align-items: center; line-height: 1; }
        .cp-clear-btn { font-size: 12px; font-weight: 700; color: ${p.danger}; background: none; border: none; cursor: pointer; font-family: inherit; padding: 4px 6px; }

        /* ── Product grid ── */
        .cp-grid { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 12px; }
        .cp-grid .pcard-v2 {
          min-height: 292px;
          padding: 10px;
          border-radius: 18px;
        }
        .cp-grid .pcard-v2 .pimg-v2 {
          margin-bottom: 10px;
          padding: 10px;
          border-radius: 16px;
        }
        .cp-grid .pcard-v2 .pbrand-v2 {
          font-size: 10px;
          margin-bottom: 3px;
        }
        .cp-grid .pcard-v2 .pname-v2 {
          font-size: 12.5px;
          min-height: 2.5em;
          margin-bottom: 4px;
        }
        .cp-grid .pcard-v2 .prating-v2 {
          margin-bottom: 6px;
        }
        .cp-grid .pcard-v2 .unit-selector-btn {
          margin-bottom: 8px;
          padding: 5px 9px;
          font-size: 11px;
        }
        .cp-grid .pcard-v2 .pnew-v2 {
          font-size: 14px;
        }
        .cp-grid .pcard-v2 .pold-v2 {
          font-size: 10px;
        }
        .cp-grid .pcard-v2 .padd-v2,
        .cp-grid .pcard-v2 .qty-v2 {
          margin-top: 8px;
        }
        .cp-grid .pcard-v2 .padd-v2 {
          padding: 9px;
          font-size: 11.5px;
          border-radius: 11px;
        }
        .cp-grid .pcard-v2 .qty-v2 {
          height: 34px;
          border-radius: 11px;
        }
        .cp-grid .pcard-v2 .qty-btn-v2 {
          width: 30px;
          font-size: 15px;
        }

        /* ── Empty state ── */
        .cp-empty { text-align: center; padding: 60px 24px; background: ${p.card}; border-radius: 16px; border: 1px solid ${p.border}; }
        .cp-empty i { font-size: 48px; color: ${p.textFaint}; display: block; margin-bottom: 16px; }
        .cp-empty h3 { font-size: 16px; font-weight: 700; color: ${p.text}; margin: 0 0 8px; }
        .cp-empty p { font-size: 13px; color: ${p.textMuted}; margin: 0 0 20px; }

        /* ── Mobile: breadcrumb top bar (hidden on mobile) ── */
        .cp-breadcrumb { background: ${p.card}; border-bottom: 1px solid ${p.border}; padding: 10px 0; }
        .cp-breadcrumb-inner { max-width: 1440px; margin: 0 auto; padding: 0 16px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${p.textMuted}; }

        /* ══ MOBILE STICKY TOP BAR ══ */
        .cp-mobile-topbar {
          display: none;
          position: sticky;
          top: 0;
          z-index: 100;
          background: ${p.card};
          border-bottom: 1px solid ${p.border};
          box-shadow: ${p.shadowSm};
          padding: 10px 14px;
          gap: 10px;
          flex-direction: column;
        }
        .cp-mobile-topbar-row1 { display: flex; align-items: center; gap: 10px; }
        .cp-mobile-back { width: 38px; height: 38px; border-radius: 12px; border: 1.5px solid ${p.border}; background: ${p.cardAlt}; color: ${p.text}; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; font-size: 14px; }
        .cp-mobile-title { flex: 1; min-width: 0; }
        .cp-mobile-title-main { font-size: 15px; font-weight: 800; color: ${p.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cp-mobile-title-sub { font-size: 11px; color: ${p.textMuted}; margin-top: 1px; }
        .cp-mobile-topbar-row2 { display: flex; gap: 8px; }
        .cp-mobile-search-wrap { flex: 1; position: relative; }
        .cp-mobile-search-wrap i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: ${p.textFaint}; font-size: 13px; pointer-events: none; }
        .cp-mobile-search-input {
          width: 100%; padding: 10px 12px 10px 36px; border-radius: 12px;
          border: 1.5px solid ${p.border}; background: ${p.cardAlt}; color: ${p.text};
          font-size: 14px; outline: none; box-sizing: border-box; font-family: inherit;
        }
        .cp-mobile-search-input:focus { border-color: ${p.accent}; }
        .cp-mobile-filter-btn {
          display: flex; align-items: center; gap: 6px; padding: 0 14px; height: 42px; border-radius: 12px;
          border: 1.5px solid ${p.border}; background: ${p.cardAlt}; color: ${p.text};
          font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; font-family: inherit;
          flex-shrink: 0;
        }
        .cp-mobile-filter-btn.has-filters { border-color: ${p.accent}; background: ${p.accentBg}; color: ${p.accent}; }

        /* ── Mobile action bar: sort + results ── */
        .cp-mobile-action-bar { display: none; }

        /* ── Mobile category strip ── */
        .cp-mobile-cats { display: none; background: ${p.card}; border-bottom: 1px solid ${p.border}; padding: 0; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; white-space: nowrap; }
        .cp-mobile-cats::-webkit-scrollbar { display: none; }
        .cp-mobile-cat-chip { display: inline-flex; align-items: center; gap: 7px; padding: 10px 14px; font-size: 13px; font-weight: 600; color: ${p.textMuted}; cursor: pointer; border-bottom: 2.5px solid transparent; white-space: nowrap; transition: all .15s; }
        .cp-mobile-cat-chip.active { color: ${p.accent}; border-bottom-color: ${p.accent}; font-weight: 800; }
        .cp-mobile-cat-chip i { font-size: 12px; }

        /* ── Mobile bottom sheet ── */
        .cp-filter-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 500; }
        .cp-filter-overlay.open { display: block; animation: cpFadeIn .2s ease; }
        .cp-filter-sheet {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 501;
          background: ${p.card}; border-radius: 24px 24px 0 0;
          max-height: 90vh; display: flex; flex-direction: column;
          box-shadow: 0 -8px 32px rgba(0,0,0,.2);
          transform: translateY(100%); transition: transform .3s ease;
        }
        .cp-filter-sheet.open { transform: translateY(0); }
        .cp-filter-sheet-handle { width: 36px; height: 4px; background: ${p.border}; border-radius: 2px; margin: 12px auto 0; }
        .cp-filter-sheet-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid ${p.border}; }
        .cp-filter-sheet-title { font-size: 16px; font-weight: 800; color: ${p.text}; display: flex; align-items: center; gap: 8px; }
        .cp-filter-sheet-close { width: 32px; height: 32px; border-radius: 50%; border: none; background: ${p.cardAlt}; color: ${p.textMuted}; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
        .cp-filter-tabs { display: flex; border-bottom: 1px solid ${p.border}; background: ${p.cardAlt}; }
        .cp-filter-tab { flex: 1; padding: 12px 0; font-size: 13px; font-weight: 700; text-align: center; cursor: pointer; color: ${p.textMuted}; border: none; background: none; font-family: inherit; border-bottom: 2.5px solid transparent; transition: all .15s; }
        .cp-filter-tab.active { color: ${p.accent}; border-bottom-color: ${p.accent}; background: ${p.card}; }
        .cp-filter-sheet-body { flex: 1; overflow-y: auto; padding: 16px 18px; }
        .cp-filter-sheet-footer { padding: 12px 18px; border-top: 1px solid ${p.border}; display: flex; gap: 10px; }
        .cp-filter-footer-clear { flex: 1; padding: 12px; border-radius: 12px; border: 1.5px solid ${p.border}; background: ${p.cardAlt}; color: ${p.text}; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .cp-filter-footer-apply { flex: 2; padding: 12px; border-radius: 12px; border: none; background: ${p.accent}; color: #fff; font-size: 14px; font-weight: 800; cursor: pointer; font-family: inherit; }

        /* ── Mobile sort sheet ── */
        .cp-sort-sheet { background: ${p.card}; border-radius: 24px 24px 0 0; padding: 8px 0 20px; }
        .cp-sort-sheet-item { display: flex; align-items: center; justify-content: space-between; padding: 13px 20px; font-size: 14px; font-weight: 600; color: ${p.text}; cursor: pointer; }
        .cp-sort-sheet-item.active { color: ${p.accent}; font-weight: 800; }

        /* ── Mobile products wrapper ── */
        .cp-mobile-products-wrap { padding: 12px 14px 80px; }
        .cp-mobile-result-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .cp-mobile-result-count { font-size: 13px; color: ${p.textMuted}; font-weight: 600; }
        .cp-mobile-result-count strong { color: ${p.accent}; }
        .cp-mobile-sort-btn { display: flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px; border: 1.5px solid ${p.border}; background: ${p.card}; color: ${p.text}; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }

        /* ── Animations ── */
        @keyframes cpFadeDown { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes cpFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes cpSlideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }

        /* ── Active filter tags (mobile) ── */
        .cp-mobile-tags { display: flex; overflow-x: auto; gap: 6px; padding-bottom: 2px; scrollbar-width: none; margin-bottom: 10px; }
        .cp-mobile-tags::-webkit-scrollbar { display: none; }

        /* ════════════════ RESPONSIVE ════════════════ */

        /* ── Tablet (768–1024) ── */
        @media (max-width: 1100px) {
          .cp-layout { grid-template-columns: 220px minmax(0,1fr); gap: 14px; }
          .cp-layout.filters-open { grid-template-columns: 220px minmax(0,1fr) 300px; }
          .cp-grid { grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; }
        }

        @media (max-width: 900px) {
          .cp-layout { grid-template-columns: 200px minmax(0,1fr); gap: 12px; }
          .cp-layout.filters-open { grid-template-columns: 200px minmax(0,1fr) 280px; }
          .cp-grid { grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px; }
        }

        /* ── Mobile (≤ 768) ── */
        @media (max-width: 768px) {
          .cp-breadcrumb { display: none; }
          .cp-layout { display: block; padding: 0; }
          .cp-sidebar { display: none; }
          .cp-main { min-width: 0; }
          .cp-toolbar-shell,
          .cp-toolbar { display: none; }

          .cp-mobile-topbar { display: flex; }
          .cp-mobile-cats { display: block; }
          .cp-mobile-action-bar { display: flex; }

          .cp-grid { grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; }
        }

        @media (max-width: 480px) {
          .cp-grid { grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; }
        }

        @media (max-width: 420px) {
          .cp-grid { grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════
          DESKTOP breadcrumb
      ══════════════════════════════════════════════ */}
      <div className="cp-breadcrumb">
        <div className="cp-breadcrumb-inner">
          <span onClick={onBack} style={{ color: p.accent, fontWeight: 600, cursor: "pointer" }}>
            {t.cart?.breadcrumbHome || "Home"}
          </span>
          <i className="fas fa-chevron-right" style={{ fontSize: 10 }} />
          <span style={{ color: p.text, fontWeight: 700 }}>{activeLabel}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MOBILE: Sticky top bar
      ══════════════════════════════════════════════ */}
      <div className="cp-mobile-topbar" ref={pageTopRef}>
        <div className="cp-mobile-topbar-row1">
          <button className="cp-mobile-back" onClick={onBack}>
            <i className="fas fa-chevron-left" />
          </button>
          <div className="cp-mobile-title">
            <div className="cp-mobile-title-main">{activeLabel}</div>
            <div className="cp-mobile-title-sub">
              {filteredProducts.length} products
            </div>
          </div>
          <button className="cp-mobile-back" onClick={handleShare} style={{ marginLeft: "auto" }}>
            <i className="fas fa-share-alt" />
          </button>
        </div>
        <div className="cp-mobile-topbar-row2">
          <div className="cp-mobile-search-wrap">
            <i className="fas fa-search" />
            <input
              type="text"
              className="cp-mobile-search-input"
              placeholder="Search products or brands…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className={`cp-mobile-filter-btn${activeFilterCount > 0 ? " has-filters" : ""}`}
            onClick={() => setFilterOpen(true)}
          >
            <i className="fas fa-sliders-h" />
            Filter
            {activeFilterCount > 0 && (
              <span style={{
                background: p.accent, color: "#fff", borderRadius: "50%",
                width: 18, height: 18, fontSize: 10, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MOBILE: Category horizontal strip
      ══════════════════════════════════════════════ */}
      <div className="cp-mobile-cats">
        <div
          className={`cp-mobile-cat-chip${isAllView ? " active" : ""}`}
          onClick={() => onCategoryChange?.("all")}
        >
          <i className="fas fa-th" />
          {t.home?.allCategories || "All"}
        </div>
        {CATEGORIES_DATA.map((cat) => (
          <div
            key={cat.value}
            className={`cp-mobile-cat-chip${cat.value === category ? " active" : ""}`}
            onClick={() => onCategoryChange?.(cat.value)}
          >
            <i className={`fas ${cat.icon}`} />
            {t.categories?.[cat.key] || cat.value}
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP + TABLET layout
      ══════════════════════════════════════════════ */}
      <div className={`cp-layout${desktopFiltersOpen ? " filters-open" : ""}`}>

        {/* ── Sidebar ── */}
        <aside className="cp-sidebar">
          {/* Category nav */}
          <div className="cp-cat-nav">
            <div className="cp-cat-nav-title">Categories</div>
            <div className="cp-cat-nav-list">
              <div
                className={`cp-cat-item${isAllView ? " active" : ""}`}
                onClick={() => onCategoryChange?.("all")}
              >
                <span className="cp-cat-icon">
                  <i className="fas fa-th" />
                </span>
                {t.home?.allCategories || "All Categories"}
              </div>
              {CATEGORIES_DATA.map((cat) => (
                <div
                  key={cat.value}
                  className={`cp-cat-item${cat.value === category ? " active" : ""}`}
                  onClick={() => onCategoryChange?.(cat.value)}
                >
                  <span className="cp-cat-icon">
                    <i className={`fas ${cat.icon}`} />
                  </span>
                  {t.categories?.[cat.key] || cat.value}
                </div>
              ))}
            </div>
          </div>

        </aside>

        {/* ── Main ── */}
        <main className="cp-main" ref={productsRef}>

          {/* Desktop toolbar */}
          <div className="cp-toolbar-shell" onClick={(e) => e.stopPropagation()}>
          <div className="cp-toolbar">
            <div className="cp-toolbar-meta">
              <strong>{activeLabel}</strong>
              {!loading ? <span>{filteredProducts.length} results</span> : null}
            </div>
            <div className="cp-search-wrap">
              <i className="fas fa-search" />
              <input
                type="text"
                className="cp-search-input"
                placeholder="Search products or brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="cp-toolbar-actions">
              <button className="cp-btn" onClick={handleAllDeals}>
                <i className="fas fa-tags" />
                {t.home?.allDeals || "All Deals"}
              </button>

              <button className="cp-btn" onClick={() => setDesktopFiltersOpen((open) => !open)}>
                <i className="fas fa-sliders-h" />
                Filters
                {activeFilterCount > 0 && <span className="cp-badge">{activeFilterCount}</span>}
              </button>

              {/* Sort dropdown */}
              <div className="cp-sort-wrap" onClick={(e) => e.stopPropagation()}>
                <button className="cp-btn" onClick={() => setSortOpen((v) => !v)}>
                  <i className="fas fa-sort-amount-down" />
                  <span style={{ color: p.accent }}>{sortLabel}</span>
                  <i className={`fas fa-chevron-${sortOpen ? "up" : "down"}`} style={{ fontSize: 10, color: p.textFaint }} />
                </button>
                {sortOpen && (
                  <div className="cp-sort-menu">
                    {getSortOptions(t).map((opt) => (
                      <div
                        key={opt.value}
                        className={`cp-sort-item${sortBy === opt.value ? " active" : ""}`}
                        onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                      >
                        {opt.label}
                        {sortBy === opt.value && <i className="fas fa-check" style={{ fontSize: 11 }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>

          {/* Mobile products wrapper */}
          <div className="cp-mobile-products-wrap">
            {/* Mobile: result bar + sort */}
            <div className="cp-mobile-result-bar" style={{ display: "none" }}>
              <div className="cp-mobile-result-count">
                <strong>{filteredProducts.length}</strong> results
              </div>
              <button className="cp-mobile-sort-btn" onClick={() => setMobileSortOpen(true)}>
                <i className="fas fa-sort-amount-down" />
                {sortLabel}
              </button>
            </div>

            {/* Active filter tags */}
            {activeTags.length > 0 && (
              <div>
                <div className="cp-tags cp-mobile-tags">
                  {activeTags.map((tag) => (
                    <span key={tag.key} className="cp-tag">
                      {tag.label}
                      <button className="cp-tag-rm" onClick={tag.onRemove}>
                        <i className="fas fa-times" />
                      </button>
                    </span>
                  ))}
                  <button className="cp-clear-btn" onClick={clearAllFilters}>
                    Clear all
                  </button>
                </div>
              </div>
            )}

            {/* Result count (desktop) */}
            {!loading && (
              <div className="cp-result-info" style={{ marginBottom: activeTags.length ? 6 : 12 }}>
                <strong>{filteredProducts.length}</strong>{" "}
                {filteredProducts.length !== 1 ? (t.filters?.foundPlural || "products found") : (t.filters?.found || "product found")}
                {activeTags.length > 0 && (
                  <span style={{ color: p.textFaint }}> (filtered from {products.length})</span>
                )}
              </div>
            )}

            {/* Grid */}
            {loading ? renderSkeleton() : filteredProducts.length === 0 ? (
              <div className="cp-empty">
                <i className="fas fa-filter" />
                <h3>{t.home?.noProducts || "No products found"}</h3>
                <p>{t.filters?.noProductsDesc || "Try adjusting your filters or search query."}</p>
                <button
                  onClick={clearAllFilters}
                  style={{
                    background: p.accent, color: "#fff", border: "none", borderRadius: 10,
                    padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {t.filters?.clearFilters || "Clear Filters"}
                </button>
              </div>
            ) : (
              <div className="cp-grid">
                {filteredProducts.map((item) => (
                  <ProductCard
                    key={item._uid}
                    p={item}
                    onAddCart={onAddCart}
                    onDecreaseCart={onDecreaseCart}
                    cart={cart}
                    wishlist={wishlist}
                    toggleWishlist={toggleWishlist}
                    t={t}
                    region={region}
                    onOpenProduct={onOpenProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        <aside className="cp-filter-sidebar">
          {desktopFiltersOpen ? renderDesktopFilterPanel() : null}
        </aside>
      </div>

      {/* ══════════════════════════════════════════════
          MOBILE: Sort bottom sheet
      ══════════════════════════════════════════════ */}
      {mobileSortOpen && (
        <>
          <div
            className="cp-filter-overlay open"
            onClick={() => setMobileSortOpen(false)}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 502,
            background: p.card, borderRadius: "24px 24px 0 0",
            boxShadow: "0 -8px 32px rgba(0,0,0,.2)",
            animation: "cpSlideUp .3s ease",
          }}>
            <div style={{ width: 36, height: 4, background: p.border, borderRadius: 2, margin: "12px auto 0" }} />
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${p.border}`, fontSize: 16, fontWeight: 800, color: p.text }}>
              Sort By
            </div>
            {getSortOptions(t).map((opt) => (
              <div
                key={opt.value}
                className={`cp-sort-sheet-item${sortBy === opt.value ? " active" : ""}`}
                style={{ color: sortBy === opt.value ? p.accent : p.text }}
                onClick={() => { setSortBy(opt.value); setMobileSortOpen(false); }}
              >
                {opt.label}
                {sortBy === opt.value && <i className="fas fa-check" style={{ fontSize: 13, color: p.accent }} />}
              </div>
            ))}
            <div style={{ height: 20 }} />
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          MOBILE: Filter bottom sheet
      ══════════════════════════════════════════════ */}
      <div
        className={`cp-filter-overlay${filterOpen ? " open" : ""}`}
        onClick={() => setFilterOpen(false)}
      />
      <div className={`cp-filter-sheet${filterOpen ? " open" : ""}`}>
        <div className="cp-filter-sheet-handle" />
        <div className="cp-filter-sheet-header">
          <div className="cp-filter-sheet-title">
            <i className="fas fa-sliders-h" style={{ color: p.accent }} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{ background: p.accent, color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 12, fontWeight: 800 }}>
                {activeFilterCount}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} style={{ background: "none", border: "none", color: p.danger, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Clear all
              </button>
            )}
            <button className="cp-filter-sheet-close" onClick={() => setFilterOpen(false)}>
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="cp-filter-tabs">
          {[
            { id: "brand", label: "Brand", icon: "fa-tag" },
            { id: "price", label: "Price", icon: "fa-coins" },
            { id: "discount", label: "Discount", icon: "fa-percent" },
            { id: "sort", label: "Sort", icon: "fa-sort" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`cp-filter-tab${filterTab === tab.id ? " active" : ""}`}
              onClick={() => setFilterTab(tab.id)}
            >
              <i className={`fas ${tab.icon}`} style={{ marginRight: 4 }} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="cp-filter-sheet-body">
          {filterTab === "brand" && renderBrandFilter()}
          {filterTab === "price" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: p.textMuted, marginBottom: 16 }}>
                Set your price range
              </div>
              {renderPriceFilter()}
            </div>
          )}
          {filterTab === "discount" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: p.textMuted, marginBottom: 16 }}>
                Minimum discount percentage
              </div>
              {renderDiscountFilter()}
            </div>
          )}
          {filterTab === "sort" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {getSortOptions(t).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "13px 14px", borderRadius: 12, border: `1.5px solid ${sortBy === opt.value ? p.accent : p.border}`,
                    background: sortBy === opt.value ? p.accentBg : "transparent",
                    color: sortBy === opt.value ? p.accent : p.text,
                    fontFamily: "inherit", fontSize: 14, fontWeight: sortBy === opt.value ? 700 : 500,
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  {opt.label}
                  {sortBy === opt.value && <i className="fas fa-check" style={{ fontSize: 12 }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="cp-filter-sheet-footer">
          <button className="cp-filter-footer-clear" onClick={clearAllFilters}>
            Reset
          </button>
          <button className="cp-filter-footer-apply" onClick={() => setFilterOpen(false)}>
            Show {filteredProducts.length} results
          </button>
        </div>
      </div>
    </div>
  );
}
