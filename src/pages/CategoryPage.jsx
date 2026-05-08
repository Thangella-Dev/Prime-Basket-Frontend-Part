// src/pages/CategoryPage.jsx
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { database, hasFirebaseConfig } from "../firebase";
import { ref, get } from "firebase/database";
import { useT } from "../i18n/translations";
import { KENYA_ALL_PRODUCTS } from "../data/kenya_products";
import { mergeCategoryProducts } from "../data/catalogFallback";
import { formatCurrencyDisplay } from "../utils/currency";

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

// Parse price string like "₹45.00" or "45" → number
function parsePrice(val) {
  if (typeof val === "number") return val;
  return parseFloat(String(val || "").replace(/[^0-9.]/g, "")) || 0;
}

// Calculate discount % between oldPrice and price
function calcDiscount(price, oldPrice) {
  const p = parsePrice(price);
  const o = parsePrice(oldPrice);
  if (!o || !p || o <= p) return 0;
  return Math.round(((o - p) / o) * 100);
}

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const clampRange = (range, min, max) => {
  const start = Math.max(min, Math.min(range[0], max));
  const end = Math.max(min, Math.min(range[1], max));
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

export default function CategoryPage({
  category, onCategoryChange, onBack,
  onAddCart, onDecreaseCart, onOpenProduct,
  cart = [], wishlist = [], toggleWishlist,
  language = "en",
  region = "in",
}) {
  const t = useT(language);
  const isKenya = region === "ke";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const categoryTopRef = useRef(null);
  const productsScrollRef = useRef(null);
  const [theme, setTheme] = useState(() => (typeof document !== "undefined" ? document.body.dataset.theme || "light" : "light"));
  const isDark = theme === "dark";
  const palette = isDark
    ? {
        pageBg: "#091321",
        sectionBg: "linear-gradient(180deg, rgba(13,24,40,0.98), rgba(18,31,50,0.98))",
        sectionMutedBg: "linear-gradient(180deg, rgba(15,27,44,0.96), rgba(16,28,46,0.98))",
        border: "rgba(74,95,130,0.42)",
        borderSoft: "rgba(74,95,130,0.24)",
        text: "#f5f8ff",
        textStrong: "#dbe7f8",
        muted: "#9eb0cb",
        mutedSoft: "#7f93b2",
        accent: "#9cc8ff",
        accentBg: "rgba(15,91,215,0.18)",
        hoverBg: "rgba(15,91,215,0.12)",
        thumbBorder: "#0f1b2d",
      }
    : {
        pageBg: "#f2f3f4",
        sectionBg: "#fff",
        sectionMutedBg: "#f8faff",
        border: "#e2e8f0",
        borderSoft: "#f0f3f9",
        text: "#253d4e",
        textStrong: "#374151",
        muted: "#64748b",
        mutedSoft: "#94a3b8",
        accent: "#1d5ba0",
        accentBg: "#e8f0fb",
        hoverBg: "#f0f5ff",
        thumbBorder: "#fff",
      };

  // ── Filter state ──────────────────────────────────────────────────────────
  const [brandSearch, setBrandSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [discountRange, setDiscountRange] = useState([0, 50]);
  const [sortBy, setSortBy] = useState("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false); // mobile

  const activeKey = CATEGORIES_DATA.find(c => c.value === category)?.key;
  const activeLabel = t.categories?.[activeKey] || category;
  const mobileUi = isKenya
    ? {
        deliveringTo: "Inawasilishwa kwa eneo lako",
        filters: "Vichungi",
        sort: "Panga",
        price: "Bei",
        brand: "Chapa",
        filterTitle: "Chuja matokeo",
        filterSubtitle: "Tafuta bidhaa, chapa, bei na punguzo kwa urahisi.",
        searchProducts: "Tafuta bidhaa au chapa",
        popularBrands: "Chapa maarufu",
        selected: "zimechaguliwa",
        showing: "Inaonyesha",
        results: "matokeo",
      }
    : {
        deliveringTo: "Delivering to your area",
        filters: "Filters",
        sort: "Sort",
        price: "Price",
        brand: "Brand",
        filterTitle: "Refine results",
        filterSubtitle: "Search products faster and narrow by brand, price, and discount.",
        searchProducts: "Search products or brands",
        popularBrands: "Popular brands",
        selected: "selected",
        showing: "Showing",
        results: "results",
      };

  const resetCategoryScrollPosition = (behavior = "auto") => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior });
    }

    if (typeof document !== "undefined") {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    if (productsScrollRef.current) {
      productsScrollRef.current.scrollTo({ top: 0, behavior });
      productsScrollRef.current.scrollTop = 0;
    }

    categoryTopRef.current?.scrollIntoView({ block: "start", behavior });
  };

  // ── Load products from Firebase ───────────────────────────────────────────
  useLayoutEffect(() => {
    resetCategoryScrollPosition("auto");
  }, [category]);

  useEffect(() => {
    if (!loading) {
      const frame = window.requestAnimationFrame(() => {
        resetCategoryScrollPosition("auto");
      });

      return () => window.cancelAnimationFrame(frame);
    }

    return undefined;
  }, [category, loading]);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    setProducts([]);
    // Reset filters on category change
    setSelectedBrands([]);
    setBrandSearch("");
    setSearchQuery("");
    setPriceRange([0, 5000]);
    setDiscountRange([0, 50]);
    setSortBy("default");

    if (isKenya) {
      // Case-insensitive match for category
      const targetCat = (category || "").toLowerCase().trim();
      const localData = KENYA_ALL_PRODUCTS.filter(p => {
        const pcat = (p._cat || "").toLowerCase().trim();
        return pcat === targetCat;
      });

      setProducts(localData.map((p) => prepareCategoryProduct(p, region)));
      setLoading(false);
      return;
    }

    if (!hasFirebaseConfig || !database) {
      const fallbackProducts = mergeCategoryProducts(category).map((product) =>
        prepareCategoryProduct(product, region)
      );
      setProducts(fallbackProducts);
      setLoading(false);
      return;
    }

    get(ref(database, "categories/" + category))
      .then((snap) => {
        const data = snap.val();
        const mergedProducts = mergeCategoryProducts(
          category,
          data
          ? Object.values(data).map((p, i) => ({
              ...p,
              _cat: category,
              _index: i,
              _uid: `${category}_${i}`,
            }))
          : []
        ).map((product) => prepareCategoryProduct(product, region));

        setProducts(mergedProducts);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Category fetch failed, using fallback catalog:", error);
        const fallbackProducts = mergeCategoryProducts(category).map((product) =>
          prepareCategoryProduct(product, region)
        );
        setProducts(fallbackProducts);
        setLoading(false);
      });
  }, [category, language, region]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const syncTheme = () => setTheme(document.body.dataset.theme || "light");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // ── Derived: price bounds from loaded products ────────────────────────────
  const priceBounds = useMemo(() => {
    if (!products.length) return [0, 5000];
    const prices = products.map((p) => p._price).filter(Boolean);
    if (!prices.length) return [0, 5000];
    return [0, Math.ceil(Math.max(...prices) / 100) * 100];
  }, [products]);

  const discountBounds = useMemo(() => {
    if (!products.length) return [0, 50];
    const maxDiscount = Math.max(0, ...products.map((product) => product._discount || 0));
    return [0, Math.max(10, Math.ceil(maxDiscount / 5) * 5)];
  }, [products]);

  // Set price range to actual bounds when products load
  useEffect(() => {
    setPriceRange(priceBounds);
  }, [priceBounds]);

  useEffect(() => {
    setDiscountRange(discountBounds);
  }, [discountBounds]);

  // ── Derived: brand list with counts ──────────────────────────────────────
  const brandList = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      if (p.brand) map[p.brand] = (map[p.brand] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [products]);

  const filteredBrands = brandList.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const effectivePriceRange = useMemo(
    () => clampRange(priceRange, priceBounds[0], priceBounds[1]),
    [priceRange, priceBounds]
  );

  const effectiveDiscountRange = useMemo(
    () => clampRange(discountRange, discountBounds[0], discountBounds[1]),
    [discountRange, discountBounds]
  );

  // ── Apply filters + sort ─────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let list = [...products];
    const normalizedSearchQuery = normalizeText(searchQuery);

    if (normalizedSearchQuery) {
      list = list.filter((product) => (
        normalizeText(product.name).includes(normalizedSearchQuery) ||
        normalizeText(product.brand).includes(normalizedSearchQuery) ||
        normalizeText(product.quantity).includes(normalizedSearchQuery)
      ));
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      const selectedBrandSet = new Set(selectedBrands.map(normalizeText));
      list = list.filter((p) => selectedBrandSet.has(normalizeText(p.brand)));
    }

    // Price range
    list = list.filter(
      (p) => p._price >= effectivePriceRange[0] && p._price <= effectivePriceRange[1]
    );

    // Discount range
    list = list.filter(
      (p) => p._discount >= effectiveDiscountRange[0] && p._discount <= effectiveDiscountRange[1]
    );

    // Sort
    switch (sortBy) {
      case "price_asc":
        list.sort((a, b) => a._price - b._price);
        break;
      case "price_desc":
        list.sort((a, b) => b._price - a._price);
        break;
      case "top_rated":
        list.sort((a, b) => (b.stars || 0) - (a.stars || 0));
        break;
      case "whats_new":
        list.sort((a, b) => b._index - a._index);
        break;
      case "best_discount":
        list.sort((a, b) => b._discount - a._discount);
        break;
      default:
        break;
    }

    return list;
  }, [products, searchQuery, selectedBrands, effectivePriceRange, effectiveDiscountRange, sortBy]);

  // ── Active filter tags ────────────────────────────────────────────────────
  const activeTags = useMemo(() => {
    const tags = [];
    if (searchQuery.trim()) {
      tags.push({ key: "search", label: `Search: ${searchQuery.trim()}`, onRemove: () => setSearchQuery("") });
    }
    if (selectedBrands.length > 0) {
      selectedBrands.forEach((b) => tags.push({ key: `brand_${b}`, label: b, onRemove: () => setSelectedBrands((prev) => prev.filter((x) => x !== b)) }));
    }
    if (effectivePriceRange[0] !== priceBounds[0] || effectivePriceRange[1] !== priceBounds[1]) {
      const p1 = isKenya ? `KES ${effectivePriceRange[0]}` : `₹${effectivePriceRange[0]}`;
      const p2 = isKenya ? `KES ${effectivePriceRange[1]}` : `₹${effectivePriceRange[1]}`;
      tags.push({ key: "price", label: `${p1} – ${p2}`, onRemove: () => setPriceRange(priceBounds) });
    }
    if (effectiveDiscountRange[0] !== discountBounds[0] || effectiveDiscountRange[1] !== discountBounds[1]) {
      tags.push({ key: "discount", label: `${effectiveDiscountRange[0]}%–${effectiveDiscountRange[1]}% off`, onRemove: () => setDiscountRange(discountBounds) });
    }
    return tags;
  }, [searchQuery, selectedBrands, effectivePriceRange, effectiveDiscountRange, priceBounds, discountBounds, language]);

  const activeFilterCount = activeTags.length;
  const highlightedBrands = brandList.slice(0, 6);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedBrands([]);
    setBrandSearch("");
    setPriceRange(priceBounds);
    setDiscountRange(discountBounds);
    setSortBy("default");
  };

  const toggleBrand = (name) => {
    setSelectedBrands((prev) =>
      prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]
    );
  };

  const handleMobileShare = async () => {
    if (typeof window === "undefined") return;
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: activeLabel, text: activeLabel, url: shareUrl });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // Ignore share cancellation/fallback errors.
    }
  };

  // ── Range slider helper (two-thumb) ──────────────────────────────────────
  function RangeSlider({ min, max, value, onChange, prefix = "", suffix = "" }) {
    const safeSpan = Math.max(max - min, 1);
    const pct = (v) => ((v - min) / safeSpan) * 100;
    const step = suffix === "%" ? 1 : safeSpan <= 250 ? 1 : safeSpan <= 1000 ? 5 : safeSpan <= 5000 ? 10 : 25;
    return (
      <div style={{ padding: "4px 0 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: palette.accent, marginBottom: 10 }}>
          <span>{prefix}{value[0]}{suffix}</span>
          <span>{prefix}{value[1]}{suffix}</span>
        </div>
        <div style={{ position: "relative", height: 28 }}>
          {/* Track background */}
          <div style={{ position: "absolute", top: 12, left: 0, right: 0, height: 5, background: palette.border, borderRadius: 999 }} />
          {/* Filled track */}
          <div style={{
            position: "absolute", top: 12, height: 5,
            left: `${pct(value[0])}%`,
            width: `${pct(value[1]) - pct(value[0])}%`,
            background: palette.accent, borderRadius: 999,
            transition: "left 0.08s linear, width 0.08s linear",
          }} />
          {/* Min thumb */}
          <input type="range" min={min} max={max} step={step} value={value[0]}
            onInput={(e) => {
              const v = Number(e.target.value);
              if (v <= value[1]) onChange([v, value[1]]);
            }}
            className="cat-range-input"
            style={{ position: "absolute", top: 0, left: 0, width: "100%", cursor: "pointer", height: 28, zIndex: value[0] > max - safeSpan * 0.1 ? 5 : 3 }}
          />
          {/* Max thumb */}
          <input type="range" min={min} max={max} step={step} value={value[1]}
            onInput={(e) => {
              const v = Number(e.target.value);
              if (v >= value[0]) onChange([value[0], v]);
            }}
            className="cat-range-input"
            style={{ position: "absolute", top: 0, left: 0, width: "100%", cursor: "pointer", height: 28, zIndex: 4 }}
          />
          {/* Min handle */}
          <div style={{ position: "absolute", top: 7, left: `calc(${pct(value[0])}% - 9px)`, width: 18, height: 18, background: palette.accent, border: `2.5px solid ${palette.thumbBorder}`, borderRadius: "50%", boxShadow: "0 6px 16px rgba(29,91,160,.25)", pointerEvents: "none", zIndex: 2, transition: "left 0.08s linear" }} />
          {/* Max handle */}
          <div style={{ position: "absolute", top: 7, left: `calc(${pct(value[1])}% - 9px)`, width: 18, height: 18, background: palette.accent, border: `2.5px solid ${palette.thumbBorder}`, borderRadius: "50%", boxShadow: "0 6px 16px rgba(29,91,160,.25)", pointerEvents: "none", zIndex: 2, transition: "left 0.08s linear" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: palette.mutedSoft, marginTop: 2 }}>
          <span>{prefix}{min}{suffix}</span>
          <span>{prefix}{max}{suffix}</span>
        </div>
      </div>
    );
  }

  // ── Filter Sidebar panel ──────────────────────────────────────────────────
  const renderFilterPanel = () => (
    <div style={{ background: palette.sectionBg, borderRadius: 20, border: `1px solid ${palette.border}`, overflow: "hidden", boxShadow: isDark ? "0 24px 40px rgba(0,0,0,.24)" : "0 24px 42px rgba(15,23,42,.08)" }}>
      <div style={{ padding: "18px 18px 16px", borderBottom: `1px solid ${palette.borderSoft}`, background: palette.sectionMutedBg, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 15, color: palette.text }}>
              <i className="fas fa-sliders-h" style={{ color: palette.accent }}></i>
              {mobileUi.filterTitle}
            </div>
            <p style={{ margin: "7px 0 0", fontSize: 12, lineHeight: 1.6, color: palette.muted }}>
              {mobileUi.filterSubtitle}
            </p>
          </div>
          <div style={{ display: "grid", gap: 8, justifyItems: "end", flexShrink: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 34, height: 34, padding: "0 10px", borderRadius: 999, background: palette.accentBg, color: palette.accent, fontSize: 13, fontWeight: 800, border: `1px solid ${palette.border}` }}>
              {activeFilterCount}
            </span>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} style={{ background: "none", border: "none", color: "#e63946", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                {t.filters.clearAll}
              </button>
            )}
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <i className="fas fa-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: palette.mutedSoft, fontSize: 12 }}></i>
          <input
            type="text"
            placeholder={mobileUi.searchProducts}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "11px 14px 11px 34px", border: `1.5px solid ${palette.border}`, borderRadius: 12, fontSize: 12.5, outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: isDark ? "#0f1a2c" : "#fff", color: palette.text, boxShadow: isDark ? "none" : "0 10px 20px rgba(15,23,42,.04)" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: palette.muted, fontWeight: 700 }}>
            {mobileUi.showing} <strong style={{ color: palette.accent }}>{filteredProducts.length}</strong> / {products.length} {mobileUi.results}
          </span>
          {selectedBrands.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 800, color: palette.accent, background: isDark ? "rgba(15,91,215,0.18)" : "#edf4ff", borderRadius: 999, padding: "5px 10px" }}>
              {selectedBrands.length} {mobileUi.selected}
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: 16, display: "grid", gap: 14 }}>
        {highlightedBrands.length > 0 && (
          <div style={{ padding: 14, borderRadius: 16, border: `1px solid ${palette.borderSoft}`, background: palette.sectionMutedBg }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: palette.text, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 10 }}>
              {mobileUi.popularBrands}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {highlightedBrands.map(({ name }) => {
                const active = selectedBrands.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleBrand(name)}
                    style={{
                      border: `1px solid ${active ? palette.accent : palette.border}`,
                      background: active ? palette.accentBg : (isDark ? "rgba(15,26,44,0.88)" : "#fff"),
                      color: active ? palette.accent : palette.textStrong,
                      borderRadius: 999,
                      padding: "8px 12px",
                      fontSize: 12,
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
          </div>
        )}

        <div style={{ padding: 14, borderRadius: 16, border: `1px solid ${palette.borderSoft}`, background: palette.sectionBg }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: palette.text, textTransform: "uppercase", letterSpacing: ".6px" }}>{t.filters.brand}</div>
            <span style={{ fontSize: 11, color: palette.mutedSoft, fontWeight: 700 }}>{brandList.length} total</span>
          </div>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <i className="fas fa-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: palette.mutedSoft, fontSize: 11 }}></i>
            <input
              type="text"
              placeholder={t.filters.searchBrand}
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              style={{ width: "100%", padding: "9px 10px 9px 30px", border: `1.5px solid ${palette.border}`, borderRadius: 10, fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: isDark ? "#0f1a2c" : "#fff", color: palette.text }}
            />
          </div>
          <div className="cat-brand-list" style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
            {filteredBrands.length === 0 ? (
              <div style={{ fontSize: 12, color: palette.mutedSoft, padding: "8px 0" }}>{t.filters.noBrands}</div>
            ) : (
              filteredBrands.map(({ name, count }) => {
                const active = selectedBrands.includes(name);
                return (
                  <label
                    key={name}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px", cursor: "pointer", borderRadius: 10, transition: ".12s", background: active ? palette.hoverBg : "transparent" }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = palette.hoverBg; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleBrand(name)}
                      style={{ accentColor: palette.accent, width: 14, height: 14, cursor: "pointer", flexShrink: 0 }}
                    />
                    <span style={{ flex: 1, fontSize: 13, color: palette.textStrong, fontWeight: active ? 700 : 500 }}>{name}</span>
                    <span style={{ fontSize: 11, color: active ? palette.accent : palette.mutedSoft, background: active ? palette.accentBg : palette.sectionMutedBg, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{count}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div style={{ padding: 14, borderRadius: 16, border: `1px solid ${palette.borderSoft}`, background: palette.sectionBg }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: palette.text, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 6 }}>{t.filters.priceRange}</div>
          <RangeSlider
            min={priceBounds[0]} max={priceBounds[1]}
            value={effectivePriceRange} onChange={setPriceRange}
            prefix={isKenya ? "KES " : "₹"}
          />
        </div>

        <div style={{ padding: 14, borderRadius: 16, border: `1px solid ${palette.borderSoft}`, background: palette.sectionBg }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: palette.text, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 6 }}>{t.filters.discountRange}</div>
          <RangeSlider
            min={discountBounds[0]} max={discountBounds[1]}
            value={effectiveDiscountRange} onChange={setDiscountRange}
            suffix="%"
          />
        </div>
      </div>
    </div>
  );

  // ── Sort dropdown ─────────────────────────────────────────────────────────
  const renderSortDropdown = () => (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setSortOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: palette.sectionBg, border: `1.5px solid ${palette.border}`, borderRadius: 9, fontSize: 13, fontWeight: 700, color: palette.text, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 1px 4px rgba(0,0,0,.05)", transition: ".15s" }}
      >
        <i className="fas fa-sort-amount-down" style={{ color: palette.accent, fontSize: 12 }}></i>
        {t.home.sort}: <span style={{ color: palette.accent }}>{getSortOptions(t).find((o) => o.value === sortBy)?.label}</span>
        <i className={`fas fa-chevron-${sortOpen ? "up" : "down"}`} style={{ fontSize: 10, color: palette.mutedSoft }}></i>
      </button>
      {sortOpen && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: palette.sectionBg, border: `1.5px solid ${palette.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 100, minWidth: 200, overflow: "hidden", animation: "fadeDown .15s ease" }}>
          {getSortOptions(t).map((opt) => (
            <div
              key={opt.value}
              onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
              style={{ padding: "10px 16px", fontSize: 13, fontWeight: sortBy === opt.value ? 700 : 400, color: sortBy === opt.value ? palette.accent : palette.textStrong, background: sortBy === opt.value ? palette.accentBg : "transparent", cursor: "pointer", transition: ".12s", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              onMouseEnter={(e) => { if (sortBy !== opt.value) e.currentTarget.style.background = palette.hoverBg; }}
              onMouseLeave={(e) => { if (sortBy !== opt.value) e.currentTarget.style.background = "transparent"; }}
            >
              {opt.label}
              {sortBy === opt.value && <i className="fas fa-check" style={{ fontSize: 11, color: palette.accent }}></i>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="cat-page-root" style={{ background: palette.pageBg, minHeight: "100vh", paddingBottom: 40 }} onClick={() => sortOpen && setSortOpen(false)}>
      <style>{`
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .cat-mobile-shell{ display:none; }
        .cat-left-col,
        .cat-right-col{
          position:sticky;
          top:88px;
          align-self:start;
          max-height:calc(100vh - 104px);
          overflow-y:auto;
          overflow-x:hidden;
          overscroll-behavior:contain;
          scrollbar-width:thin;
          scrollbar-color:rgba(76, 122, 184, 0.38) transparent;
        }
        .cat-left-col{
          padding-right:6px;
        }
        .cat-right-col{
          padding-right:6px;
        }
        .cat-left-col::-webkit-scrollbar,
        .cat-right-col::-webkit-scrollbar{
          width:6px;
        }
        .cat-left-col::-webkit-scrollbar-track,
        .cat-right-col::-webkit-scrollbar-track{
          background:transparent;
        }
        .cat-left-col::-webkit-scrollbar-thumb,
        .cat-right-col::-webkit-scrollbar-thumb{
          background:rgba(76, 122, 184, 0.32);
          border-radius:999px;
        }
        .cat-left-col::-webkit-scrollbar-thumb:hover,
        .cat-right-col::-webkit-scrollbar-thumb:hover{
          background:rgba(76, 122, 184, 0.5);
        }
        .cat-brand-list{
          max-height:none;
          overflow:visible;
        }
        @media(max-width:1200px){ .cat-page-wrap{ grid-template-columns:168px 1fr 188px !important; } }
        @media(max-width:960px) { .cat-page-wrap{ grid-template-columns:150px 1fr !important; } .cat-right-col{ display:none !important; } .mobile-filter-btn{ display:flex !important; } }
        @media(max-width:700px) { .cat-page-wrap{ grid-template-columns:1fr !important; } .cat-left-col{ display:none !important; } }
        @media(max-width:768px) { .products-grid{ grid-template-columns:repeat(2,1fr) !important; } }
        @media(max-width:960px){
          .cat-breadcrumb,
          .cat-desktop-header{
            display:none !important;
          }
          .cat-mobile-shell{
            display:grid;
            gap:10px;
            margin-bottom:12px;
          }
          .cat-page-wrap{
            gap:10px !important;
          }
          .cat-mobile-topbar{
            display:grid;
            grid-template-columns:auto minmax(0,1fr);
            gap:10px;
            align-items:center;
          }
          .cat-mobile-round-btn{
            width:42px;
            height:42px;
            border-radius:16px;
            border:1px solid rgba(255,255,255,0.12);
            background: linear-gradient(180deg, rgba(39,46,62,0.96), rgba(27,32,44,0.96));
            color:#e4efff;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            cursor:pointer;
            box-shadow:0 18px 32px rgba(0,0,0,0.2);
            transition: transform .22s ease, box-shadow .22s ease, background .22s ease;
          }
          .cat-mobile-round-btn:hover{
            transform: translateY(-1px);
            box-shadow:0 20px 34px rgba(0,0,0,0.24);
          }
          .cat-mobile-title-pill{
            min-width:0;
            border-radius:20px;
            border:1px solid rgba(255,255,255,0.1);
            background: linear-gradient(180deg, rgba(28,34,47,0.98), rgba(20,26,36,0.98));
            color:#f5f8ff;
            padding:10px 16px;
            box-shadow:0 18px 32px rgba(0,0,0,0.18);
          }
          .cat-mobile-title-main{
            font-family:"Outfit","Quicksand",sans-serif;
            font-size:0.94rem;
            font-weight:900;
            line-height:1.15;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          }
          .cat-mobile-title-sub{
            margin-top:4px;
            font-size:0.74rem;
            color:#9bb6d8;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          }
          .cat-mobile-search-row{
            display:grid;
          }
          .cat-mobile-search-input{
            width:100%;
            min-height:48px;
            border-radius:18px;
            border:1px solid rgba(255,255,255,0.1);
            background: linear-gradient(180deg, rgba(29,36,49,0.98), rgba(22,28,40,0.98));
            color:#eef5ff;
            padding:0 16px 0 42px;
            font-family:inherit;
            font-size:0.92rem;
            outline:none;
            box-sizing:border-box;
          }
          .cat-mobile-search-wrap{
            position:relative;
          }
          .cat-mobile-search-wrap i{
            position:absolute;
            top:50%;
            left:16px;
            transform:translateY(-50%);
            color:#8ba6d0;
          }
          .cat-mobile-rail{
            display:grid;
            grid-auto-flow:column;
            grid-auto-columns:minmax(104px, 1fr);
            gap:12px;
            overflow-x:auto;
            padding-bottom:2px;
            scrollbar-width:none;
            -webkit-overflow-scrolling:touch;
          }
          .cat-mobile-rail::-webkit-scrollbar{
            display:none;
          }
          .cat-mobile-rail-item{
            border:1px solid rgba(255,255,255,0.12);
            border-radius:28px;
            background:linear-gradient(180deg, rgba(30,37,50,0.98), rgba(22,28,40,0.98));
            color:#d2e2ff;
            padding:14px 12px;
            min-height:126px;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:flex-start;
            gap:10px;
            cursor:pointer;
            text-align:center;
            box-shadow:0 18px 32px rgba(0,0,0,0.18);
          }
          .cat-mobile-rail-item.active{
            border-color:rgba(37,99,235,0.9);
            box-shadow:inset 4px 0 0 rgba(37,99,235,0.9), 0 18px 34px rgba(0,0,0,0.2);
            color:#f8fbff;
          }
          .cat-mobile-rail-thumb{
            width:54px;
            height:54px;
            border-radius:50%;
            background:linear-gradient(180deg, rgba(44,54,77,1) 0%, rgba(31,41,56,1) 100%);
            color:#8cb8ff;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            font-size:1.1rem;
            flex-shrink:0;
          }
          .cat-mobile-rail-label{
            font-size:0.92rem;
            font-weight:700;
            line-height:1.25;
            display:-webkit-box;
            -webkit-line-clamp:2;
            -webkit-box-orient:vertical;
            overflow:hidden;
          }
          .cat-mobile-chip-row{
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:8px;
          }
          .cat-mobile-chip{
            min-height:44px;
            border-radius:16px;
            border:1px solid rgba(255,255,255,0.12);
            background:linear-gradient(180deg, rgba(28,34,47,0.98), rgba(22,28,40,0.98));
            color:#eef5ff;
            font-family:inherit;
            font-size:0.86rem;
            font-weight:700;
            cursor:pointer;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            gap:8px;
            padding:0 12px;
            white-space:nowrap;
            box-shadow:0 14px 28px rgba(0,0,0,0.16);
          }
          .cat-mobile-chip:hover{
            background:linear-gradient(180deg, rgba(36,47,64,0.98), rgba(27,35,49,0.98));
          }
          .cat-mobile-chip-accent{
            border-color:rgba(111,176,255,0.62) !important;
            background:linear-gradient(135deg, rgba(37,99,235,0.98), rgba(59,130,246,0.9)) !important;
            color:#f8fbff !important;
            box-shadow:0 18px 28px rgba(37,99,235,0.28);
          }
          .cat-mobile-chip-badge{
            min-width:22px;
            height:22px;
            border-radius:999px;
            background:rgba(255,255,255,0.92);
            color:#1d4ed8;
            font-size:0.74rem;
            font-weight:800;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            padding:0 6px;
          }
          .cat-mobile-sort-sheet{
            display:grid;
            gap:10px;
            padding:16px;
            border-radius:24px;
            border:1px solid rgba(255,255,255,0.1);
            background:linear-gradient(180deg, rgba(28,34,47,0.98), rgba(22,28,40,0.98));
            box-shadow:0 20px 36px rgba(0,0,0,0.2);
          }
          .cat-mobile-sort-option{
            border:none;
            border-radius:16px;
            background:rgba(255,255,255,0.04);
            color:#e1ecff;
            font-family:inherit;
            font-size:0.9rem;
            font-weight:700;
            text-align:left;
            padding:14px 16px;
            cursor:pointer;
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:10px;
          }
          .cat-mobile-sort-option.active{
            background:rgba(37,99,235,0.18);
            color:#e8f4ff;
          }
          .cat-mobile-products .products-grid{
            grid-template-columns:repeat(2,1fr) !important;
            gap:16px !important;
          }
          .cat-mobile-products .pcard{
            background:linear-gradient(180deg, rgba(20,27,40,0.94), rgba(15,22,34,0.96)) !important;
            border:1px solid rgba(255,255,255,0.08) !important;
            box-shadow:0 24px 48px rgba(0,0,0,0.22) !important;
            border-radius:26px !important;
            padding:18px !important;
          }
          .cat-mobile-products .pcard::before{
            display:none;
          }
          .cat-mobile-products .pimg{
            background:linear-gradient(180deg, rgba(23,32,48,0.96), rgba(15,23,36,0.98)) !important;
            border-radius:20px !important;
            height:144px !important;
          }
          .cat-mobile-products .pimg img{
            max-height:116px !important;
          }
          .cat-mobile-products .pbrand,
          .cat-mobile-products .pold,
          .cat-mobile-products .pstars span{
            color:rgba(209,220,241,0.68) !important;
          }
          .cat-mobile-products .pname,
          .cat-mobile-products .pnew{
            color:#f8fbff !important;
          }
          .cat-mobile-products .pwish{
            background:rgba(255,255,255,0.08) !important;
            color:#dae2ff !important;
            opacity:1 !important;
            border-color:rgba(255,255,255,0.12) !important;
          }
          .cat-mobile-products .padd{
            background:linear-gradient(135deg, rgba(34, 78, 146, 0.95) 0%, rgba(18, 34, 62, 0.98) 100%) !important;
            border:2px solid rgba(37,99,235,0.24) !important;
            color:#eef2ff !important;
            box-shadow:0 12px 24px rgba(0,0,0,0.18) !important;
          }
          .cat-mobile-products .pbadge{
            background:rgba(91,47,29,0.94) !important;
            color:#ffd1a8 !important;
          }
          .cat-mobile-products .qty-control{
            background:linear-gradient(180deg, rgba(37,99,235,0.92) 0%, rgba(20,41,72,0.98) 100%) !important;
            border:1px solid rgba(59,130,246,0.16) !important;
          }
        }
        @media(max-width:600px){
          .cat-mobile-topbar{
            grid-template-columns:auto minmax(0,1fr);
          }
        }
        @media(max-width:960px){
          .cat-brand-list{
            max-height:180px;
            overflow-y:auto;
          }
          .cat-page-root{
            background:linear-gradient(180deg, #fbfcff 0%, #f3f7fd 100%) !important;
          }
          .cat-page-wrap{
            grid-template-columns:60px minmax(0,1fr) !important;
            gap:8px !important;
            align-items:start !important;
            height:calc(100vh - 176px) !important;
            overflow:hidden !important;
          }
          .cat-left-col{
            display:block !important;
            position:sticky !important;
            top:126px !important;
            align-self:start !important;
            max-height:100% !important;
            overflow-y:auto !important;
            overflow-x:hidden !important;
            padding-right:4px !important;
            overscroll-behavior:contain !important;
            scrollbar-width:none !important;
          }
          .cat-right-col{
            max-height:none !important;
            overflow:visible !important;
            padding-right:0 !important;
          }
          .cat-left-col::-webkit-scrollbar{
            display:none !important;
          }
          .cat-box{
            padding:0 !important;
            border:none !important;
            background:transparent !important;
            box-shadow:none !important;
          }
          .cat-box h3{
            display:none !important;
          }
          .cat-item{
            display:flex !important;
            flex-direction:column !important;
            align-items:center !important;
            justify-content:flex-start !important;
            gap:4px !important;
            padding:4px 1px !important;
            margin-bottom:2px !important;
            border:none !important;
            background:transparent !important;
            color:#64748b !important;
            text-align:center !important;
            border-radius:14px !important;
            position:relative !important;
          }
          .cat-item-l{
            display:flex !important;
            flex-direction:column !important;
            align-items:center !important;
            gap:4px !important;
          }
          .cat-item .cicon{
            width:38px !important;
            height:38px !important;
            border-radius:50% !important;
            background:linear-gradient(180deg, #ffffff 0%, #eef5ff 100%) !important;
            border:1px solid rgba(29,91,160,0.1) !important;
            box-shadow:0 8px 14px rgba(15,23,42,0.06) !important;
            color:#1d5ba0 !important;
            font-size:0.72rem !important;
          }
          .cat-item > i{
            display:none !important;
          }
          .cat-item .cat-item-l{
            font-size:0.54rem !important;
            font-weight:700 !important;
            line-height:1.12 !important;
          }
          .cat-item[data-active="true"]{
            color:#1d5ba0 !important;
          }
          .cat-item[data-active="true"]::after{
            content:"";
            position:absolute;
            top:4px;
            right:-3px;
            width:3px;
            height:64%;
            border-radius:999px;
            background:linear-gradient(180deg, #1d5ba0 0%, #2f74c6 100%);
          }
          .cat-item[data-active="true"] .cicon{
            background:linear-gradient(180deg, rgba(29,91,160,0.12), rgba(29,91,160,0.2)) !important;
            border-color:rgba(29,91,160,0.16) !important;
            box-shadow:0 14px 24px rgba(29,91,160,0.16) !important;
          }
          .cat-mobile-round-btn,
          .cat-mobile-title-pill,
          .cat-mobile-search-input,
          .cat-mobile-chip,
          .cat-mobile-sort-sheet{
            border-color:rgba(29,91,160,0.12) !important;
            background:linear-gradient(180deg, #ffffff 0%, #f4f9ff 100%) !important;
            box-shadow:0 14px 26px rgba(15,23,42,0.07) !important;
            color:#253d4e !important;
          }
          .cat-mobile-round-btn{
            color:#1d5ba0 !important;
          }
          .cat-mobile-title-pill{
            color:#253d4e !important;
          }
          .cat-mobile-title-sub{
            color:#1d5ba0 !important;
          }
          .cat-mobile-chip-accent{
            color:#f8fbff !important;
            border-color:rgba(37,99,235,0.34) !important;
            background:linear-gradient(135deg, #1d5ba0 0%, #2f76c7 100%) !important;
            box-shadow:0 18px 28px rgba(29,91,160,0.2) !important;
          }
          .cat-mobile-sort-option{
            background:rgba(29,91,160,0.03) !important;
            color:#253d4e !important;
          }
          .cat-mobile-sort-option.active{
            background:rgba(29,91,160,0.1) !important;
            color:#1d5ba0 !important;
          }
          .cat-mobile-products .cat-desktop-header{
            display:none !important;
          }
          .cat-mobile-products{
            max-height:100% !important;
            overflow-y:auto !important;
            overflow-x:hidden !important;
            padding-right:4px !important;
            overscroll-behavior:contain !important;
            scrollbar-width:none !important;
          }
          .cat-mobile-products::-webkit-scrollbar{
            display:none !important;
          }
          .cat-mobile-products .cat-mobile-banner{
            display:grid !important;
            grid-template-columns:minmax(0,1fr) 90px;
            gap:10px;
            align-items:center;
            padding:14px 14px;
            margin-bottom:14px;
            border-radius:24px;
            border:1px solid rgba(148,163,184,0.18);
            background:
              radial-gradient(circle at top left, rgba(255,255,255,0.78), transparent 24%),
              radial-gradient(circle at top right, rgba(148,163,184,0.18), transparent 28%),
              linear-gradient(180deg, rgba(255,255,255,0.96), rgba(247,250,255,0.92));
            box-shadow:0 20px 36px rgba(15,23,42,0.08);
          }
          .cat-mobile-banner-copy h3{
            margin:0;
            color:#1f4f82;
            font-family:"Outfit","Quicksand",sans-serif;
            font-size:1.08rem;
            line-height:1.04;
            letter-spacing:-0.03em;
          }
          .cat-mobile-banner-copy p{
            margin:6px 0 0;
            color:#64748b;
            font-size:0.74rem;
            line-height:1.35;
          }
          .cat-mobile-banner-art{
            height:90px;
            border-radius:22px;
            background:linear-gradient(180deg, rgba(255,255,255,0.92), rgba(241,245,252,0.96));
            display:flex;
            align-items:center;
            justify-content:center;
            padding:10px;
          }
          .cat-mobile-banner-art img{
            max-width:100%;
            max-height:100%;
            object-fit:contain;
          }
          .cat-mobile-products .pcard{
            background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(245,249,255,0.95) 100%) !important;
            border:1px solid rgba(148,163,184,0.18) !important;
            box-shadow:0 18px 34px rgba(15,23,42,0.08) !important;
            border-radius:24px !important;
            padding:14px !important;
          }
          .cat-mobile-products .pimg{
            background:linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,248,255,0.96)) !important;
            height:118px !important;
            margin-bottom:12px !important;
            border-radius:18px !important;
          }
          .cat-mobile-products .pimg img{
            max-height:92px !important;
          }
          .cat-mobile-products .pbrand{
            font-size:0.62rem !important;
            margin-bottom:4px !important;
            color:#6b7280 !important;
          }
          .cat-mobile-products .pname{
            font-size:0.92rem !important;
            line-height:1.32 !important;
            min-height:2.35em !important;
            margin-bottom:6px !important;
            color:#1f456f !important;
          }
          .cat-mobile-products .pstars{
            font-size:0.78rem !important;
            margin-bottom:6px !important;
          }
          .cat-mobile-products .pnew{
            font-size:1rem !important;
            color:#1f456f !important;
          }
          .cat-mobile-products .pold{
            font-size:0.76rem !important;
            color:#6b7280 !important;
          }
          .cat-mobile-products .pbrand,
          .cat-mobile-products .pold,
          .cat-mobile-products .pstars span{
            color:#6b7280 !important;
          }
          .cat-mobile-products .pname,
          .cat-mobile-products .pnew{
            color:#1f456f !important;
          }
          .cat-mobile-products .pwish{
            background:rgba(255,255,255,0.92) !important;
            color:#4f6e97 !important;
            border-color:rgba(148,163,184,0.18) !important;
          }
          .cat-mobile-products .padd{
            background:rgba(255,255,255,0.9) !important;
            border:2px solid rgba(148,163,184,0.18) !important;
            color:#1f456f !important;
          }
          .cat-mobile-products .pbadge{
            background:rgba(237,242,247,0.96) !important;
            color:#1f456f !important;
          }
          .cat-mobile-products .qty-control{
            background:rgba(255,255,255,0.88) !important;
            border:1px solid rgba(148,163,184,0.16) !important;
            color:#1f456f !important;
          }
        }
        .cat-range-input{
          -webkit-appearance:none;
          appearance:none;
          background:transparent;
          outline:none;
          touch-action:pan-y;
        }
        .cat-range-input::-webkit-slider-runnable-track{ height:28px; background:transparent; }
        .cat-range-input::-webkit-slider-thumb{
          -webkit-appearance:none;
          appearance:none;
          width:24px;
          height:24px;
          background:transparent;
          border:none;
          cursor:pointer;
        }
        .cat-range-input::-moz-range-track{ height:28px; background:transparent; border:none; }
        .cat-range-input::-moz-range-thumb{
          width:24px;
          height:24px;
          background:transparent;
          border:none;
          cursor:pointer;
        }
        .filter-drawer { display:none; position:fixed; inset:0; z-index:1000; }
        @media(max-width:960px){ .filter-drawer.open{ display:flex !important; } }
        ::-webkit-scrollbar{ width:4px; } ::-webkit-scrollbar-track{ background:transparent; } ::-webkit-scrollbar-thumb{ background:${isDark ? "rgba(116,142,182,0.45)" : "#d0daf0"}; border-radius:4px; }
      `}</style>

      {/* Breadcrumb */}
      <div ref={categoryTopRef} className="cat-breadcrumb" style={{ background: palette.sectionBg, borderBottom: `1px solid ${palette.borderSoft}`, padding: "12px 0" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: palette.muted }}>
          <span onClick={onBack} style={{ color: palette.accent, fontWeight: 600, cursor: "pointer" }}>{t.cart.breadcrumbHome}</span>
          <i className="fas fa-chevron-right" style={{ fontSize: 10 }}></i>
          <span style={{ color: palette.text, fontWeight: 700 }}>{activeLabel}</span>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24 }}>
        <div className="cat-mobile-shell">
          <div className="cat-mobile-topbar">
            <button type="button" className="cat-mobile-round-btn" onClick={onBack}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="cat-mobile-title-pill">
              <div className="cat-mobile-title-main">{activeLabel}</div>
              <div className="cat-mobile-title-sub">{mobileUi.deliveringTo}</div>
            </div>
          </div>

          <div className="cat-mobile-chip-row">
            <button type="button" className="cat-mobile-chip cat-mobile-chip-accent" onClick={() => setFilterOpen(true)}>
              <i className="fas fa-sliders-h"></i>
              <span>{mobileUi.filters}</span>
              {activeFilterCount > 0 ? <span className="cat-mobile-chip-badge">{activeFilterCount}</span> : null}
            </button>
            <button type="button" className="cat-mobile-chip" onClick={() => setSortOpen((open) => !open)}>
              <i className="fas fa-arrow-down-wide-short"></i>
              <span>{mobileUi.sort}</span>
            </button>
          </div>

          {sortOpen ? (
            <div className="cat-mobile-sort-sheet" onClick={(event) => event.stopPropagation()}>
              {getSortOptions(t).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`cat-mobile-sort-option${sortBy === option.value ? " active" : ""}`}
                  onClick={() => {
                    setSortBy(option.value);
                    setSortOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {sortBy === option.value ? <i className="fas fa-check"></i> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="cat-page-wrap" style={{ display: "grid", gridTemplateColumns: "190px 1fr 220px", gap: 20, alignItems: "start" }}>

          {/* ── LEFT COLUMN: All Categories only ── */}
          <div className="cat-left-col">
            <div className="cat-box">
              <h3>{t.home.allCategories}</h3>
              {CATEGORIES_DATA.map((cat) => {
                const label = t.categories[cat.key] || cat.value;
                return (
                  <div
                    key={cat.value}
                    className="cat-item"
                    data-active={cat.value === category ? "true" : "false"}
                    onClick={() => onCategoryChange(cat.value)}
                    style={cat.value === category
                      ? { color: palette.accent, fontWeight: 700, background: palette.accentBg, borderRadius: 6, padding: "8px 8px", marginBottom: 2 }
                      : { cursor: "pointer" }}
                  >
                    <div className="cat-item-l">
                      <div className="cicon"><i className={`fas ${cat.icon}`}></i></div>
                      {label}
                    </div>
                    {cat.value === category && <i className="fas fa-chevron-right" style={{ fontSize: 10, color: palette.accent }}></i>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── MIDDLE: Products ── */}
          <main ref={productsScrollRef} className="cat-mobile-products">

            {!loading && filteredProducts.length > 0 ? (
              <div className="cat-mobile-banner" onClick={() => onOpenProduct?.(filteredProducts[0])}>
                <div className="cat-mobile-banner-copy">
                  <h3>{activeLabel}</h3>
                  <p>{filteredProducts[0]?.brand || filteredProducts[0]?.quantity || t.home.shopNow}</p>
                </div>
                <div className="cat-mobile-banner-art">
                  <img
                    src={filteredProducts[0]?.imageUrl}
                    alt={filteredProducts[0]?.name || activeLabel}
                    loading="lazy"
                  />
                </div>
              </div>
            ) : null}

            {/* Header bar */}
            <div className="cat-desktop-header" style={{ background: palette.sectionBg, borderRadius: 10, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,.05)", gap: 12, flexWrap: "wrap", border: `1px solid ${palette.borderSoft}` }}>
              <div>
                <h2 style={{ fontFamily: "'Quicksand',sans-serif", fontSize: 20, fontWeight: 800, color: palette.text, margin: 0 }}>{activeLabel}</h2>
                {!loading && (
                  <p style={{ fontSize: 12, color: palette.muted, marginTop: 3, marginBottom: 0 }}>
                    <strong style={{ color: palette.accent }}>{filteredProducts.length}</strong> {filteredProducts.length !== 1 ? t.filters.foundPlural : t.filters.found}
                    {activeTags.length > 0 && <span style={{ color: palette.mutedSoft }}> ({t.filters.filteredFrom} {products.length})</span>}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Mobile filter button */}
                <button
                  className="mobile-filter-btn"
                  onClick={(e) => { e.stopPropagation(); setFilterOpen(true); }}
                  style={{ display: "none", alignItems: "center", gap: 8, padding: "10px 14px", background: isDark ? "linear-gradient(135deg, #8fc2ff, #6cb7ff)" : "linear-gradient(135deg, #1d5ba0, #3a86da)", color: isDark ? "#08111f" : "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: isDark ? "0 16px 28px rgba(15,91,215,.22)" : "0 14px 24px rgba(29,91,160,.24)" }}
                >
                  <i className="fas fa-sliders-h"></i> {t.home.filter}
                  {activeFilterCount > 0 && (
                    <span style={{ background: isDark ? "#08111f" : "#fff", color: palette.accent, borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>{activeFilterCount}</span>
                  )}
                </button>
                <div onClick={(e) => e.stopPropagation()}>
                  {renderSortDropdown()}
                </div>
              </div>
            </div>

            {/* Active filter tags */}
            {activeTags.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: palette.mutedSoft, fontWeight: 600 }}>{t.filters.active}:</span>
                {activeTags.map((tag) => (
                  <span key={tag.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: palette.accentBg, color: palette.accent, fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, border: `1px solid ${palette.border}` }}>
                    {tag.label}
                    <button onClick={tag.onRemove} style={{ background: "none", border: "none", color: palette.accent, cursor: "pointer", padding: 0, fontSize: 12, display: "flex", alignItems: "center", lineHeight: 1 }}>
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                ))}
                <button onClick={clearAllFilters} style={{ fontSize: 12, fontWeight: 700, color: "#e63946", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "4px 6px" }}>
                  {t.filters.clearAll}
                </button>
              </div>
            )}

            {/* Product Grid */}
            {loading ? (
              <div className="products-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="premium-product-skeleton premium-skeleton-surface" aria-hidden="true">
                    <div className="premium-skeleton-media"></div>
                    <div className="premium-skeleton-body">
                      <span className="premium-skeleton-pill"></span>
                      <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
                      <span className="premium-skeleton-line premium-skeleton-line-md"></span>
                      <span className="premium-skeleton-line premium-skeleton-line-sm"></span>
                      <div className="premium-skeleton-price-row">
                        <span className="premium-skeleton-price"></span>
                        <span className="premium-skeleton-price-muted"></span>
                      </div>
                      <span className="premium-skeleton-cta"></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ background: palette.sectionBg, borderRadius: 12, padding: "60px 20px", textAlign: "center", border: `1px solid ${palette.borderSoft}` }}>
                <i className="fas fa-filter" style={{ fontSize: 40, color: palette.mutedSoft, marginBottom: 14, display: "block" }}></i>
                <p style={{ fontWeight: 700, color: palette.text, marginBottom: 8 }}>{t.home.noProducts}</p>
                <p style={{ fontSize: 13, color: palette.mutedSoft, marginBottom: 18 }}>{t.filters.noProductsDesc}</p>
                <button onClick={clearAllFilters} style={{ background: palette.accent, color: isDark ? "#08111f" : "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {t.filters.clearFilters}
                </button>
              </div>
            ) : (
              <div className="products-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                {filteredProducts.map((item) => {
                  const inCart = cart.find((c) => c._uid === item._uid);
                  const qty = inCart ? inCart.quantity : 0;
                  const isWished = wishlist.some((w) => w._uid === item._uid);
                  const disc = item._discount;
                  const getTranslatedName = (name) => {
                    if (!name) return "";
                    if (t.products?.[name]) return t.products[name];
                    const entries = Object.entries(t.products || {}).sort((a, b) => b[0].length - a[0].length);
                    for (const [key, val] of entries) {
                      if (name.toLowerCase().includes(key.toLowerCase())) return val;
                    }
                    return name;
                  };
                  const translatedName = getTranslatedName(item.name);
                  const deliveryText = item.delivery || (item.oldPrice ? "10 min" : "Today 6PM");
                  const unitLabel = item.standard || item.unit || item.quantity || "1 unit";
                  const stockInfo = item.inStock === false
                    ? { text: t.product.outOfStock, klass: "outofstock", disabled: true }
                    : item.stock != null && item.stock <= 3
                      ? { text: `Only ${item.stock} left`, klass: "warning", disabled: false }
                      : { text: t.product.inStock || "In Stock", klass: "instock", disabled: false };
                  return (
                    <div
                      key={item._uid}
                      className="pcard"
                      style={{ cursor: "pointer" }}
                      onClick={() => onOpenProduct && onOpenProduct(item)}
                    >
                      {/* Badge — show discount % if available, else item.badge */}
                      {disc > 0 ? (
                        <span className={`pbadge ${BADGE_CLS[products.indexOf(item) % BADGE_CLS.length]}`}>-{disc}%</span>
                      ) : item.badge ? (
                        <span className={`pbadge ${BADGE_CLS[products.indexOf(item) % BADGE_CLS.length]}`}>
                          {t.badges?.[item.badge?.toLowerCase()] || item.badge || t.badges?.sale || "Sale"}
                        </span>
                      ) : null}

                      <span className="delivery-badge">{deliveryText}</span>
                      <button
                        className="pwish"
                        style={isWished ? { opacity: 1, background: "#ff3b81", color: "#fff" } : {}}
                        onClick={(e) => { e.stopPropagation(); toggleWishlist && toggleWishlist(item); }}
                      >
                        <i className={isWished ? "fas fa-heart" : "far fa-heart"}></i>
                      </button>
                      <div className="pimg"><img src={item.imageUrl} alt={translatedName} loading="lazy" /></div>
                      <div className="pbrand">{item.brand}</div>
                      <div className="pname">{translatedName}</div>
                      <div className="pweight">{unitLabel}</div>
                      {item.stars != null && (
                        <div className="pstars">
                          <i className="fas fa-star" style={{ color: "#f59e0b" }} /> {item.stars}{item.reviews && <span> ({item.reviews})</span>}
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
                      <div className={`pstock ${stockInfo.klass}`}>{stockInfo.text}</div>
                      <div className="p-action-row" onClick={(e) => e.stopPropagation()}>
                        {qty > 0 ? (
                          <div className="qty-control catalog-qty-control">
                            <button
                              className="qty-control-btn"
                              onClick={() => onDecreaseCart && onDecreaseCart(item._uid)}
                            >
                              -
                            </button>
                            <span className="qty-control-value">{qty}</span>
                            <button
                              className="qty-control-btn"
                              onClick={() => onAddCart && onAddCart(item)}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            className="padd"
                            disabled={stockInfo.disabled}
                            onClick={() => onAddCart && onAddCart(item)}
                            style={{ marginTop: "8px" }}
                          >
                            <i className="fas fa-basket-shopping"></i> {t.home.add}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          {/* ── RIGHT COLUMN: Filters ── */}
          <div className="cat-right-col" style={{ position: "sticky", top: 88 }}>
            {!loading && renderFilterPanel()}
          </div>

        </div>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      <div className={`filter-drawer${filterOpen ? " open" : ""}`}>
        {/* Overlay */}
        <div onClick={() => setFilterOpen(false)} style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} />
        {/* Panel */}
        <div style={{ width: 300, background: isDark ? "#0f1a2c" : "#f8faff", overflowY: "auto", boxShadow: "-4px 0 20px rgba(0,0,0,.15)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 18px", background: palette.accent, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: isDark ? "#08111f" : "#fff", fontWeight: 800, fontSize: 15 }}>
              <i className="fas fa-sliders-h" style={{ marginRight: 8 }}></i>{mobileUi.filterTitle}
            </span>
            <button onClick={() => setFilterOpen(false)} style={{ background: isDark ? "rgba(8,17,31,.2)" : "rgba(255,255,255,.2)", border: "none", color: isDark ? "#08111f" : "#fff", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
          <div style={{ padding: 14 }}>
            {renderFilterPanel()}
          </div>
          <div style={{ padding: "12px 18px", borderTop: `1px solid ${palette.border}`, display: "flex", gap: 10, marginTop: "auto" }}>
            <button onClick={() => { clearAllFilters(); setFilterOpen(false); }} style={{ flex: 1, padding: "10px", background: palette.sectionBg, border: `1.5px solid ${palette.border}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: palette.textStrong }}>{t.filters.clearAll}</button>
            <button onClick={() => setFilterOpen(false)} style={{ flex: 1, padding: "10px", background: palette.accent, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: isDark ? "#08111f" : "#fff" }}>{t.filters.showResults} ({filteredProducts.length})</button>
          </div>
        </div>
      </div>
    </div>
  );
}
