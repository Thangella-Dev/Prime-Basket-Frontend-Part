import { useState, useEffect, useRef } from "react";
import { database, hasFirebaseConfig } from "../firebase";
import { ref, get } from "firebase/database";
import { useT } from "../i18n/translations";
import { KENYA_ALL_PRODUCTS, KENYA_DEALS, KENYA_SECTIONS } from "../data/kenya_products";
import { getFallbackCategoryProducts, mergeCategoryProducts } from "../data/catalogFallback";
import { formatCurrencyDisplay } from "../utils/currency";
import { safeSessionGet, safeSessionRemove, safeSessionSet } from "../utils/safeStorage";
import HeroSlider from "../components/HeroSlider";

const ALL_CATS = [
  "rice", "oil", "wheat-flour", "salt", "sugar", "chilli-powder",
  "turmeric-powder", "pulses", "masala", "fruits", "vegetables",
  "dairyProducts", "feminineHygiene", "homeNeeds", "babyCare",
  "instantFood", "milkPowders", "chipsAndNamkeens", "oralCare",
  "biscuitsAndCookies", "coolDrinks", "bodyCare",
];

const DEAL_CATS = ["fruits", "vegetables", "dairyProducts", "biscuitsAndCookies", "instantFood", "coolDrinks"];

const MULTICOL_CATS = {
  topSelling: "rice",
  trending: "oil",
  recentlyAdded: "masala",
  topRated: "pulses",
};

const BADGE_CLASSES = ["bs", "bh", "bo", "bn"];
const RAIL_GAP_DESKTOP = 16;
const RAIL_GAP_MOBILE = 12;

const getRailVisibleCount = (width) => {
  if (width <= 480) return 1;
  if (width <= 840) return 2;
  if (width <= 1120) return 3;
  return 4;
};

const getRailMetricsForWidth = (width, itemCount) => {
  const safeWidth = Math.max(width || 0, 0);
  const safeItemCount = Math.max(itemCount || 0, 1);
  const gap = safeWidth <= 768 ? RAIL_GAP_MOBILE : RAIL_GAP_DESKTOP;
  const visibleCount = Math.max(1, Math.min(safeItemCount, getRailVisibleCount(safeWidth)));
  const stepWidth =
    safeWidth > 0 ? (safeWidth - gap * Math.max(visibleCount - 1, 0)) / visibleCount + gap : 0;

  return {
    gap,
    maxIndex: Math.max(safeItemCount - visibleCount, 0),
    stepWidth,
    viewportWidth: safeWidth,
    visibleCount,
  };
};

const fetchCategory = (cat) =>
  get(ref(database, `categories/${cat}`)).then((snap) => {
    const val = snap.val();
    const liveProducts = val
      ? Object.values(val).map((p, i) => ({ ...p, _cat: cat, _index: i, _uid: `${cat}_${i}` }))
      : [];
    return mergeCategoryProducts(cat, liveProducts);
  });

const fetchWithCache = async (cat) => {
  const cacheKey = `pb_cat_${cat}`;
  const cached = safeSessionGet(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      safeSessionRemove(cacheKey);
    }
  }

  const data = await fetchCategory(cat);
  if (data?.length) {
    try {
      safeSessionSet(cacheKey, JSON.stringify(data));
    } catch {
      console.warn("Storage quota exceeded, skipping cache");
    }
  }
  return data;
};

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const buildFallbackHomeSections = () => {
  const topSelling = getFallbackCategoryProducts(MULTICOL_CATS.topSelling).slice(0, 6);
  const trending = getFallbackCategoryProducts(MULTICOL_CATS.trending).slice(0, 6);
  const recentlyAdded = getFallbackCategoryProducts(MULTICOL_CATS.recentlyAdded).slice(0, 6);
  const topRated = getFallbackCategoryProducts(MULTICOL_CATS.topRated).slice(0, 6);
  const allPopular = ALL_CATS.flatMap((category) => getFallbackCategoryProducts(category));
  const allDeals = DEAL_CATS.flatMap((category) =>
    getFallbackCategoryProducts(category).filter((product) => product.oldPrice)
  );

  return {
    popular15: shuffle(allPopular).slice(0, 15),
    deals: shuffle(allDeals).slice(0, 4),
    multiCols: { topSelling, trending, recentlyAdded, topRated },
  };
};

export default function HomePage({
  onAddCart,
  onDecreaseCart,
  onCategorySelect,
  onOpenProduct,
  cart = [],
  wishlist = [],
  toggleWishlist,
  language = "en",
  region = "in",
}) {
  const t = useT(language);
  const isKenya = region === "ke";
  const displayPrice = (value) => formatCurrencyDisplay(value, region);

  const [popular15, setPopular15] = useState([]);
  const [deals, setDeals] = useState([]);
  const [multiCols, setMultiCols] = useState({ topSelling: [], trending: [], recentlyAdded: [], topRated: [] });
  const [loading, setLoading] = useState(true);
  const [railState, setRailState] = useState({});
  const [railDragOffset, setRailDragOffset] = useState({});
  const [railMetrics, setRailMetrics] = useState({});
  const railViewportRefs = useRef({});
  const railGestureState = useRef({});

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const homeUi =
    isKenya
      ? {
          kicker: "Uzoefu wa ununuzi ulioboreshwa",
          title: "Duka la kila siku lililotengenezwa kwa kasi, uaminifu, na mwonekano wa kisasa.",
          subtitle: "Kuanzia bidhaa safi hadi bidhaa muhimu za nyumbani, sehemu hii imepangwa ili iwe rahisi kutumia kwenye simu, tablet, na desktop.",
          sectionDescription: "Bidhaa zilizoandaliwa kwa uwasilishaji wa haraka na thamani ya kila siku.",
          dealsDescription: "Mapunguzo yaliyopangwa ili kupata thamani kubwa bila kupoteza ubora.",
          categoriesDescription: "Njia za haraka kwenda kwenye sehemu zinazouzwa sana kila siku.",
          curatedDescription: "Mchanganyiko wa bidhaa zinazouzwa haraka, mpya, na zenye ukadiriaji mzuri.",
          promoLabel: "Usambazaji wa haraka, matumizi bora",
          highlights: [
            { icon: "fa-bolt", value: "30 min", label: "Dirisha za haraka za uwasilishaji" },
            { icon: "fa-medal", value: "98%", label: "Kuridhika kwa wateja wanaorudi" },
            { icon: "fa-basket-shopping", value: `${cartItemCount}`, label: "Bidhaa kwenye kikapu chako" },
          ],
        }
      : {
          kicker: "Refined grocery commerce",
          title: "A premium everyday store built for speed, trust, and modern shopping behavior.",
          subtitle: "From fresh produce to household staples, the experience is structured to feel clear, fast, and polished on mobile, tablet, and desktop.",
          sectionDescription: "Curated staples and fresh picks designed for quick replenishment and high-conversion browsing.",
          dealsDescription: "High-value offers surfaced with a cleaner visual hierarchy so promotions feel premium, not noisy.",
          categoriesDescription: "Shortcut entry points into the sections customers shop most often.",
          curatedDescription: "Fast-scanning editorial columns for top sellers, trending products, and newly added picks.",
          promoLabel: "Faster fulfilment, better everyday value",
          highlights: [
            { icon: "fa-bolt", value: "30 min", label: "Fast delivery windows" },
            { icon: "fa-medal", value: "98%", label: "Repeat customer satisfaction" },
            { icon: "fa-basket-shopping", value: `${cartItemCount}`, label: "Items currently in your basket" },
          ],
        };

  const bannerCards = [
    { className: "b1", title: t.home.banner1, target: "vegetables", image: "assets/fresh&clean.png" },
    { className: "b2", title: t.home.banner2, target: "dairyProducts", image: "assets/healthy-breakfast.png" },
    { className: "b3", title: t.home.banner3, target: "fruits", image: "assets/organic-food.png" },
  ];

  const categoryTiles = [
    { key: "dairyProducts", img: "assets/category-1.png", name: t.categories.dairyProducts },
    { key: "coolDrinks", img: "assets/category-2.png", name: t.categories.coolDrinks },
    { key: "bodyCare", img: "assets/category-3.png", name: t.categories.bodyCare },
    { key: "babyCare", img: "assets/category-4.png", name: t.categories.babyCare },
    { key: "instantFood", img: "assets/category-5.png", name: t.categories.instantFood },
    { key: "biscuitsAndCookies", img: "assets/category-6.png", name: t.categories.biscuitsCookies },
    { key: "vegetables", img: "assets/category-7.png", name: t.categories.vegetables },
    { key: "fruits", img: "assets/category-10.png", name: t.categories.freshFruits },
    { key: "feminineHygiene", img: "assets/category-9.png", name: t.categories.feminineHygiene },
  ];

  const featureItems = [
    { img: "assets/icon-1.png", title: t.features.bestPrices, sub: t.features.bestPricesSub },
    { img: "assets/icon-2.png", title: t.features.freeDelivery, sub: t.features.freeDeliverySub },
    { img: "assets/icon-3.png", title: t.features.greatDeal, sub: t.features.greatDealSub },
    { img: "assets/icon-4.png", title: t.features.wideAssortment, sub: t.features.wideAssortmentSub },
    { img: "assets/icon-5.png", title: t.features.easyReturns, sub: t.features.easyReturnsSub },
  ];

  const getTranslatedName = (name) => {
    if (!name) return "";
    if (t.products?.[name]) return t.products[name];
    const entries = Object.entries(t.products || {}).sort((a, b) => b[0].length - a[0].length);
    for (const [key, val] of entries) {
      if (name.toLowerCase().includes(key.toLowerCase())) return val;
    }
    return name;
  };

  useEffect(() => {
    let cancelled = false;

    if (isKenya) {
      if (!cancelled) {
        setPopular15(shuffle(KENYA_ALL_PRODUCTS).slice(0, 15));
        setDeals(KENYA_DEALS);
        setMultiCols(KENYA_SECTIONS);
        setLoading(false);
      }
      return () => {
        cancelled = true;
      };
    }

    if (!hasFirebaseConfig || !database) {
      const fallbackSections = buildFallbackHomeSections();
      if (!cancelled) {
        setPopular15(fallbackSections.popular15);
        setDeals(fallbackSections.deals);
        setMultiCols(fallbackSections.multiCols);
        setLoading(false);
      }
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      setLoading(true);
      try {
        const popularResults = await Promise.all(ALL_CATS.map(fetchWithCache));
        const allPopular = popularResults.flat();

        const dealResults = await Promise.all(DEAL_CATS.map(fetchWithCache));
        const allDeals = dealResults.flat().filter((p) => p.oldPrice);

        const mcValues = await Promise.all(Object.values(MULTICOL_CATS).map(fetchWithCache));
        const [ts, tr, ra, tp] = mcValues;

        if (!cancelled) {
          const fallbackSections = buildFallbackHomeSections();
          setPopular15(
            shuffle(allPopular.length ? allPopular : fallbackSections.popular15).slice(0, 15)
          );
          setDeals(
            shuffle(allDeals.length ? allDeals : fallbackSections.deals).slice(0, 4)
          );
          setMultiCols({
            topSelling: (ts.length ? ts : fallbackSections.multiCols.topSelling).slice(0, 6),
            trending: (tr.length ? tr : fallbackSections.multiCols.trending).slice(0, 6),
            recentlyAdded: (ra.length ? ra : fallbackSections.multiCols.recentlyAdded).slice(0, 6),
            topRated: (tp.length ? tp : fallbackSections.multiCols.topRated).slice(0, 6),
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("HomePage fetch error:", err);
        if (!cancelled) {
          const fallbackSections = buildFallbackHomeSections();
          setPopular15(fallbackSections.popular15);
          setDeals(fallbackSections.deals);
          setMultiCols(fallbackSections.multiCols);
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isKenya, language]);

  const SkeletonCard = () => (
    <div className="premium-product-skeleton premium-skeleton-surface" aria-hidden="true">
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
  );

  const DealSkeletonCard = () => (
    <div className="premium-deal-skeleton premium-skeleton-surface" aria-hidden="true">
      <div className="premium-skeleton-media"></div>
      <div className="premium-skeleton-body">
        <span className="premium-skeleton-pill"></span>
        <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
        <span className="premium-skeleton-line premium-skeleton-line-md"></span>
        <div className="premium-skeleton-price-row">
          <span className="premium-skeleton-price"></span>
          <span className="premium-skeleton-price-muted"></span>
        </div>
        <span className="premium-skeleton-cta"></span>
      </div>
    </div>
  );

  const RailSkeletonCard = () => (
    <div className="premium-rail-skeleton premium-skeleton-surface" aria-hidden="true">
      <span className="premium-skeleton-thumb"></span>
      <div className="premium-rail-skeleton-copy">
        <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
        <span className="premium-skeleton-line premium-skeleton-line-md"></span>
        <span className="premium-skeleton-line"></span>
      </div>
    </div>
  );

  const curatedSections = [
    { key: "topSelling", title: t.home.topSelling, items: (multiCols.topSelling || []).filter(Boolean) },
    { key: "trending", title: t.home.trending, items: (multiCols.trending || []).filter(Boolean) },
    { key: "recentlyAdded", title: t.home.recentlyAdded, items: (multiCols.recentlyAdded || []).filter(Boolean) },
    { key: "topRated", title: t.home.topRated, items: (multiCols.topRated || []).filter(Boolean) },
  ];

  const registerRailViewport = (key, node) => {
    if (node) {
      railViewportRefs.current[key] = node;
      return;
    }

    delete railViewportRefs.current[key];
    delete railGestureState.current[key];
  };

  const setRailIndex = (key, nextValue) => {
    setRailState((prev) => {
      const currentIndex = prev[key]?.index ?? 0;
      const resolvedValue = typeof nextValue === "function" ? nextValue(currentIndex) : nextValue;
      const maxIndex = railMetrics[key]?.maxIndex ?? 0;
      const nextIndex = Math.max(0, Math.min(resolvedValue, maxIndex));

      if (currentIndex === nextIndex && prev[key]) {
        return prev;
      }

      return {
        ...prev,
        [key]: { index: nextIndex },
      };
    });
  };

  const scrollRail = (key, direction) => {
    setRailIndex(key, (currentIndex) => currentIndex + direction);
  };

  const setRailScrollFromRange = (key, value) => {
    setRailIndex(key, value);
  };

  const startRailGesture = (key, startX, startY = 0) => {
    setRailDragOffset((prev) => (prev[key] ? { ...prev, [key]: 0 } : prev));
    railGestureState.current[key] = {
      blockClickUntil: railGestureState.current[key]?.blockClickUntil ?? 0,
      currentX: startX,
      currentY: startY,
      dragX: 0,
      lockedAxis: null,
      startX,
      startY,
    };
  };

  const moveRailGesture = (key, currentX, currentY = 0, event) => {
    const state = railGestureState.current[key];
    if (!state) return;

    const rawDeltaX = currentX - state.startX;
    const deltaY = currentY - state.startY;
    state.currentX = currentX;
    state.currentY = currentY;

    if (!state.lockedAxis) {
      if (Math.abs(rawDeltaX) < 6 && Math.abs(deltaY) < 6) return;
      state.lockedAxis = Math.abs(rawDeltaX) > Math.abs(deltaY) ? "x" : "y";
    }

    if (state.lockedAxis === "x") {
      const maxIndex = railMetrics[key]?.maxIndex ?? 0;
      const currentIndex = railState[key]?.index ?? 0;
      let dragX = rawDeltaX;

      if ((currentIndex <= 0 && dragX > 0) || (currentIndex >= maxIndex && dragX < 0)) {
        dragX *= 0.34;
      }

      state.dragX = dragX;
      setRailDragOffset((prev) => (prev[key] === dragX ? prev : { ...prev, [key]: dragX }));
      event.preventDefault();
    }
  };

  const endRailGesture = (key) => {
    const state = railGestureState.current[key];
    if (!state) return;

    const deltaX = state.dragX ?? ((state.currentX ?? state.startX) - state.startX);
    setRailDragOffset((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

    if (state.lockedAxis === "x" && Math.abs(deltaX) > 56) {
      scrollRail(key, deltaX < 0 ? 1 : -1);
      railGestureState.current[key] = { blockClickUntil: Date.now() + 180 };
      return;
    }

    if (Math.abs(deltaX) > 8) {
      railGestureState.current[key] = { blockClickUntil: Date.now() + 120 };
      return;
    }

    delete railGestureState.current[key];
  };

  const handleRailClickCapture = (key, event) => {
    const blockClickUntil = railGestureState.current[key]?.blockClickUntil ?? 0;
    if (blockClickUntil > Date.now()) {
      event.preventDefault();
      event.stopPropagation();
      railGestureState.current[key] = { blockClickUntil: 0 };
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setRailMetrics((prev) => {
        const next = { ...prev };
        let changed = false;

        curatedSections.forEach((section) => {
          const itemCount = loading ? 4 : section.items.length;
          const viewportWidth = railViewportRefs.current[section.key]?.clientWidth ?? 0;
          const metrics = getRailMetricsForWidth(viewportWidth, itemCount);
          const previousMetrics = prev[section.key];

          if (
            !previousMetrics ||
            previousMetrics.viewportWidth !== metrics.viewportWidth ||
            previousMetrics.visibleCount !== metrics.visibleCount ||
            previousMetrics.maxIndex !== metrics.maxIndex ||
            previousMetrics.stepWidth !== metrics.stepWidth
          ) {
            next[section.key] = metrics;
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    };

    window.addEventListener("resize", handleResize);
    const frame = window.requestAnimationFrame(handleResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [loading, multiCols.topSelling, multiCols.trending, multiCols.recentlyAdded, multiCols.topRated]);

  useEffect(() => {
    const cleanups = [];

    curatedSections.forEach((section) => {
      const node = railViewportRefs.current[section.key];
      if (!node) return;

      const handleWheel = (event) => {
        const maxIndex = railMetrics[section.key]?.maxIndex ?? 0;
        if (maxIndex <= 0) return;

        const dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (Math.abs(dominantDelta) < 12) return;

        event.preventDefault();
        scrollRail(section.key, dominantDelta > 0 ? 1 : -1);
      };

      node.addEventListener("wheel", handleWheel, { passive: false });
      cleanups.push(() => node.removeEventListener("wheel", handleWheel));
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [railMetrics, loading, multiCols.topSelling, multiCols.trending, multiCols.recentlyAdded, multiCols.topRated]);

  useEffect(() => {
    setRailState((prev) => {
      const next = { ...prev };
      let changed = false;

      curatedSections.forEach((section) => {
        const maxIndex = railMetrics[section.key]?.maxIndex ?? 0;
        const currentIndex = prev[section.key]?.index ?? 0;
        const clampedIndex = Math.min(currentIndex, maxIndex);

        if (currentIndex !== clampedIndex || !prev[section.key]) {
          next[section.key] = { index: clampedIndex };
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [railMetrics, multiCols.topSelling, multiCols.trending, multiCols.recentlyAdded, multiCols.topRated]);

  const ProductCard = ({ p, idx }) => {
    const inCart = cart.find((c) => c._uid === p._uid);
    const qty = inCart ? inCart.quantity : 0;
    const isWished = wishlist.some((w) => w._uid === p._uid);
    const translatedName = getTranslatedName(p.name);
    const deliveryText = p.delivery || (p.oldPrice ? "10 min" : "Today 6PM");
    const unitLabel = p.standard || p.unit || p.quantity || "1 unit";
    const stockInfo = p.inStock === false
      ? { text: t.product.outOfStock, klass: "outofstock", disabled: true }
      : p.stock != null && p.stock <= 3
        ? { text: `Only ${p.stock} left`, klass: "warning", disabled: false }
        : { text: t.product.inStock || "In Stock", klass: "instock", disabled: false };

    return (
      <div className="pcard" data-cat={p._cat} style={{ cursor: "pointer" }} onClick={() => onOpenProduct && onOpenProduct(p)}>
        <span className={`pbadge ${BADGE_CLASSES[idx % BADGE_CLASSES.length]}`}>
          {t.badges?.[p.badge?.toLowerCase()] || p.badge || (p.oldPrice ? t.badges?.sale : t.badges?.new) || "Sale"}
        </span>
        <span className="delivery-badge">{deliveryText}</span>
        <button
          className="pwish"
          style={isWished ? { opacity: 1, background: "#ff3b81", color: "#fff" } : {}}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist && toggleWishlist(p);
          }}
        >
          <i className={isWished ? "fas fa-heart" : "far fa-heart"}></i>
        </button>
        <div className="pimg">
          <img src={p.imageUrl} alt={translatedName} loading="lazy" decoding="async" />
        </div>
        <div className="pbrand">{p.brand}</div>
        <div className="pname">{translatedName}</div>
        <div className="pweight">{unitLabel}</div>
        {p.stars != null && (
          <div className="pstars">★ {p.stars} {p.reviews && <span>({p.reviews})</span>}</div>
        )}
        <div className="pprice">
          <span className="pnew">{displayPrice(p.price)}</span>
          {p.oldPrice && <span className="pold">{displayPrice(p.oldPrice)}</span>}
        </div>
        <div className={`pstock ${stockInfo.klass}`}>{stockInfo.text}</div>
        <div className="p-action-row" onClick={(e) => e.stopPropagation()}>
          {qty > 0 ? (
            <div className="qty-control catalog-qty-control">
              <button
                className="qty-control-btn"
                onClick={() => onDecreaseCart && onDecreaseCart(p._uid)}
              >
                -
              </button>
              <span className="qty-control-value">{qty}</span>
              <button
                className="qty-control-btn"
                onClick={() => onAddCart && onAddCart(p)}
              >
                +
              </button>
            </div>
          ) : (
            <button
              className="padd"
              disabled={stockInfo.disabled}
              onClick={() => onAddCart && onAddCart(p)}
              style={{ marginTop: "8px" }}
            >
              <i className="fas fa-basket-shopping"></i> {t.home.add}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="home-showcase">
        <div className="container">
          <div className="home-showcase-grid">
            <div className="home-showcase-hero">
              <HeroSlider language={language} />
            </div>
            <div className="home-intro-copy">
              <span className="section-kicker">{homeUi.kicker}</span>
              <h2 className="home-intro-title">{homeUi.title}</h2>
              <p className="section-subtitle">{homeUi.subtitle}</p>
            </div>
            <div className="home-intro-highlights">
              {homeUi.highlights.map((item) => (
                <div key={item.label} className="home-highlight-card">
                  <div className="home-highlight-icon">
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="products-section">
        <div className="container">
          <div className="sec-header">
            <div>
              <div className="sec-title">
                <span className="section-title-icon"><i className="fas fa-fire-flame-curved"></i></span>
                <span className="section-title-text">{t.home.popular}</span>
              </div>
              <p className="section-subtitle compact">{homeUi.sectionDescription}</p>
            </div>
          </div>

          <div className="products-layout">
            <div>
              <div className="products-grid" id="pGrid">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                  : popular15.length === 0
                    ? <p style={{ color: "#7e7e7e", padding: "20px 0" }}>{t.home.noProducts}</p>
                    : popular15.map((p, i) => <ProductCard key={p._uid} p={p} idx={i} />)}
              </div>
            </div>

            <div className="sidebar">
              <div className="cat-box">
                <h3>{t.home.category}</h3>
                {[
                  { key: "fruits", icon: "fa-apple-alt", label: t.categories.freshFruits },
                  { key: "vegetables", icon: "fa-carrot", label: t.categories.vegetables },
                  { key: "dairyProducts", icon: "fa-cheese", label: t.categories.dairyProducts },
                  { key: "chipsAndNamkeens", icon: "fa-cookie-bite", label: t.categories.chipsNamkeens },
                  { key: "coolDrinks", icon: "fa-glass-cheers", label: t.categories.coolDrinks },
                  { key: "instantFood", icon: "fa-bolt", label: t.categories.instantFood },
                  { key: "babyCare", icon: "fa-baby", label: t.categories.babyCare },
                  { key: "bodyCare", icon: "fa-spa", label: t.categories.bodyCare },
                  { key: "feminineHygiene", icon: "fa-female", label: t.categories.feminineHygiene },
                ].map((c) => (
                  <div key={c.key} className="cat-item" style={{ cursor: "pointer" }} onClick={() => onCategorySelect && onCategorySelect(c.key)}>
                    <div className="cat-item-l">
                      <div className="cicon"><i className={`fas ${c.icon}`}></i></div>
                      {c.label}
                    </div>
                    <i className="fas fa-chevron-right" style={{ fontSize: "10px", color: "#bbb" }}></i>
                  </div>
                ))}
              </div>
              <div className="tags-box">
                <h3>{t.home.productTags}</h3>
                {["Organic", "Fresh", "Dairy", "Snacks", "Beverages", "Fruits", "Vegetables", "Spices"].map((tag) => (
                  <span key={tag} className="tag-pill">{t.categories?.[tag.toLowerCase()] || tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="deals-section">
        <div className="deals-header">
          <div>
            <h2 className="deals-title">
              <span className="section-title-icon"><i className="fas fa-bolt"></i></span>
              <span className="section-title-text">{t.home.deals}</span>
            </h2>
            <p className="section-subtitle compact">{homeUi.dealsDescription}</p>
          </div>
          <a href="#" className="deals-all-link" onClick={(e) => { e.preventDefault(); onCategorySelect && onCategorySelect("all"); }}>
            {t.home.allDeals} <i className="fa-solid fa-chevron-right" style={{ fontSize: "10px" }}></i>
          </a>
        </div>
          <div className="deals-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <DealSkeletonCard key={i} />)
            : deals.map((d) => {
                const inCart = cart.find((c) => c._uid === d._uid);
                const qty = inCart ? inCart.quantity : 0;
                const isWished = wishlist.some((w) => w._uid === d._uid);
                const translatedName = getTranslatedName(d.name);
                return (
                  <div key={d._uid} className="prod-card" style={{ cursor: "pointer", position: "relative" }} onClick={() => onOpenProduct && onOpenProduct(d)}>
                    <div className="card-img-zone">
                      <span className="disc-badge">{t.badges?.[d.badge?.toLowerCase()] || d.badge || t.badges?.sale || "Sale"}</span>
                      <button
                        className="deal-wish-btn"
                        style={isWished ? { background: "#ff3b81", color: "#fff", borderColor: "#ff3b81" } : {}}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist && toggleWishlist(d);
                        }}
                      >
                        <i className={isWished ? "fas fa-heart" : "far fa-heart"}></i>
                      </button>
                      <img src={d.imageUrl} alt={translatedName} loading="lazy" decoding="async" />
                    </div>
                    <div className="card-info">
                      <div className="card-title">{translatedName}</div>
                      <div className="card-seller">{d.brand}</div>
                      <div className="card-price-row">
                        <span className="price-new">{displayPrice(d.price)}</span>
                        <span className="price-old">{displayPrice(d.oldPrice)}</span>
                      </div>
                      <div className="p-action-row" onClick={(e) => e.stopPropagation()}>
                        {qty > 0 ? (
                          <div className="qty-control catalog-qty-control">
                            <button
                              className="qty-control-btn"
                              onClick={() => onDecreaseCart && onDecreaseCart(d._uid)}
                            >
                              -
                            </button>
                            <span className="qty-control-value">{qty}</span>
                            <button
                              className="qty-control-btn"
                              onClick={() => onAddCart && onAddCart(d)}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button className="padd" onClick={() => onAddCart && onAddCart(d)} style={{ marginTop: "8px" }}>
                            <i className="fas fa-basket-shopping"></i> {t.home.add}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </section>

      <div className="container">
        <div className="banners">
          {bannerCards.map((banner) => (
            <div key={banner.target} className={`bcard ${banner.className}`}>
              <div className="btext">
                <span className="banner-kicker">{homeUi.promoLabel}</span>
                <h2>{banner.title}</h2>
                <a
                  href="#"
                  className="bbtn"
                  onClick={(e) => {
                    e.preventDefault();
                    onCategorySelect && onCategorySelect(banner.target);
                  }}
                >
                  {t.home.shopNow} <i className="fa-solid fa-arrow-right" style={{ fontSize: "8px" }}></i>
                </a>
              </div>
              <div className="bimg"><img src={banner.image} alt="" loading="lazy" decoding="async" /></div>
            </div>
          ))}
        </div>
      </div>

      <section className="cat-section">
        <div className="container">
          <div className="sec-header">
            <div>
              <div className="sec-title">
                <span className="section-title-icon"><i className="fas fa-compass"></i></span>
                <span className="section-title-text">{t.home.shopByCategory}</span>
              </div>
              <p className="section-subtitle compact">{homeUi.categoriesDescription}</p>
            </div>
            <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); onCategorySelect && onCategorySelect("all"); }}>
              {t.home.allCategories} <i className="fa-solid fa-chevron-right" style={{ fontSize: "10px" }}></i>
            </a>
          </div>
          <div className="cat-grid">
            {categoryTiles.map((cat, i) => (
              <div key={i} className="catbox" style={{ cursor: "pointer" }} onClick={() => onCategorySelect && onCategorySelect(cat.key)}>
                <div className="catbox-icon"><img src={cat.img} alt="" loading="lazy" decoding="async" /></div>
                <h5>{cat.name}</h5>
                <span>{t.home.shopNow}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="curated-section">
        <div className="container">
          <div className="sec-header">
            <div>
              <div className="sec-title">
                <span className="section-title-icon"><i className="fas fa-crown"></i></span>
                <span className="section-title-text">{t.home.topSelling}</span>
              </div>
              <p className="section-subtitle compact">{homeUi.curatedDescription}</p>
            </div>
          </div>
          <div className="multicol">
            {curatedSections.map((col) => {
              const metrics = railMetrics[col.key] ?? getRailMetricsForWidth(0, loading ? 4 : col.items.length);
              const currentIndex = Math.min(railState[col.key]?.index ?? 0, metrics.maxIndex);
              const translateX = metrics.stepWidth > 0 ? currentIndex * metrics.stepWidth : 0;
              const dragOffset = railDragOffset[col.key] ?? 0;

              return (
                <div key={col.key} className="mcol-card">
                <div className="colhead">
                  <div className="coltitle">{col.title}</div>
                  <div className="rail-controls" aria-label={`${col.title} controls`}>
                    <button
                      type="button"
                      className="rail-control-btn"
                      onClick={() => scrollRail(col.key, -1)}
                      disabled={currentIndex <= 0}
                      aria-label={`Scroll ${col.title} left`}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button
                      type="button"
                      className="rail-control-btn"
                      onClick={() => scrollRail(col.key, 1)}
                      disabled={currentIndex >= metrics.maxIndex}
                      aria-label={`Scroll ${col.title} right`}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
                <div
                  className="mcol-viewport"
                  ref={(node) => registerRailViewport(col.key, node)}
                  style={{ "--rail-visible-count": metrics.visibleCount }}
                  onPointerDown={(event) => {
                    if (event.pointerType === "mouse" && event.button !== 0) return;
                    if (metrics.maxIndex <= 0) return;
                    startRailGesture(col.key, event.clientX, event.clientY);
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                  }}
                  onPointerMove={(event) => moveRailGesture(col.key, event.clientX, event.clientY, event)}
                  onPointerUp={(event) => {
                    endRailGesture(col.key);
                    event.currentTarget.releasePointerCapture?.(event.pointerId);
                  }}
                  onPointerCancel={(event) => {
                    endRailGesture(col.key);
                    event.currentTarget.releasePointerCapture?.(event.pointerId);
                  }}
                  onPointerLeave={() => endRailGesture(col.key)}
                  onClickCapture={(event) => handleRailClickCapture(col.key, event)}
                >
                  <div
                    className="mcol-track"
                    style={{ transform: `translate3d(${dragOffset - translateX}px, 0, 0)` }}
                    aria-label={`${col.title} products`}
                  >
                    {loading
                    ? Array.from({ length: 4 }).map((_, ii) => <RailSkeletonCard key={ii} />)
                    : col.items.filter(Boolean).map((item, ii) => {
                      const inCart = cart.find((c) => c._uid === item._uid);
                      const qty = inCart ? inCart.quantity : 0;
                      const isWished = wishlist.some((w) => w._uid === item._uid);
                      const translatedName = getTranslatedName(item.name);
                      return (
                        <div key={ii} className="mprod" style={{ cursor: "pointer" }} onClick={() => onOpenProduct && onOpenProduct(item)}>
                          <div className="mimg">
                            <img src={item.imageUrl} alt={translatedName} loading="lazy" decoding="async" />
                          </div>
                          <div className="minfo">
                            <h6>{translatedName}</h6>
                            <div className="pstars">★ {item.stars || "4.0"} <span>({item.reviews || 0})</span></div>
                            <div className="mbrand">{item.brand}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span className="mprice">{displayPrice(item.price)}</span>
                              {item.oldPrice && (
                                <span className="mpold">{displayPrice(item.oldPrice)}</span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
                              {qty > 0 ? (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    background: "var(--green)",
                                    borderRadius: "8px",
                                    padding: "2px 6px",
                                    height: "30px",
                                    color: "white",
                                    fontWeight: 700,
                                    flex: 1
                                  }}
                                >
                                  <button
                                    onClick={() => onDecreaseCart && onDecreaseCart(item._uid)}
                                    style={{ background: "transparent", border: "none", color: "white", fontSize: "16px", cursor: "pointer", width: "24px", lineHeight: 1 }}
                                  >
                                    -
                                  </button>
                                  <span style={{ fontSize: "13px" }}>{qty}</span>
                                  <button
                                    onClick={() => onAddCart && onAddCart(item)}
                                    style={{ background: "transparent", border: "none", color: "white", fontSize: "16px", cursor: "pointer", width: "24px", lineHeight: 1 }}
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="padd"
                                  style={{ fontSize: 11, padding: "4px 10px", flex: 1 }}
                                  onClick={() => onAddCart && onAddCart(item)}
                                >
                                  <i className="fas fa-basket-shopping"></i> {t.home.add}
                                </button>
                              )}
                              <button
                                className="pwish"
                                style={{ position: "static", opacity: 1, width: 28, height: 28, fontSize: 12, flexShrink: 0, ...(isWished ? { background: "#ff3b81", color: "#fff" } : {}) }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleWishlist && toggleWishlist(item);
                                }}
                              >
                                <i className={isWished ? "fas fa-heart" : "far fa-heart"}></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rail-footer">
                  <span className="rail-hint">
                    {isKenya ? "Telezesha moja kwa moja au tumia mishale" : "Drag the shelf directly or use the arrows"}
                  </span>
                  <span className="rail-page-indicator">
                    {metrics.maxIndex > 0 ? `${currentIndex + 1} / ${metrics.maxIndex + 1}` : "1 / 1"}
                  </span>
                </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="promo-banner">
        <div className="banner-content">
          <span className="banner-kicker banner-kicker-dark">{homeUi.promoLabel}</span>
          <h1>{t.home.stayHome}</h1>
          <p>{t.home.startShopping} <span>Prime Basket</span></p>
          <form className="subscribe" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder={t.home.emailPlaceholder} required />
            <button type="submit">{t.home.subscribe}</button>
          </form>
        </div>
        <div className="banner-images">
          <img
            className="img-person"
            src="assets/banner-9-min.png"
            alt="delivery person with groceries"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.target.style.background = "rgba(0,0,0,0.05)";
              e.target.style.borderRadius = "8px";
              e.target.style.minHeight = "220px";
            }}
          />
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="feat-grid">
            {featureItems.map((f, i) => (
              <div key={i} className="feat-item">
                <div className="ficon"><img src={f.img} alt="" loading="lazy" decoding="async" /></div>
                <div className="ftext">
                  <h5>{f.title}</h5>
                  <p>{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
