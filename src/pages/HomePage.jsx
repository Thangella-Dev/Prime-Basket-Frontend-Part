import { useState, useEffect, useRef } from "react";
import { database, hasFirebaseConfig } from "../firebase";
import { ref, get } from "firebase/database";
import { useT } from "../i18n/translations";
import { KENYA_ALL_PRODUCTS, KENYA_DEALS, KENYA_SECTIONS } from "../data/kenya_products";
import { getFallbackCategoryProductsByRegion, mergeCategoryProducts } from "../data/catalogFallback";
import { formatCurrencyDisplay } from "../utils/currency";
import { safeSessionGet, safeSessionRemove, safeSessionSet } from "../utils/safeStorage";
import HeroSlider from "../components/HeroSlider";
import ProductCard from "../components/ProductCard";
import {
  CategorySkeletonLoader,
  DealSkeletonCard,
  HeroSkeleton,
  RailSkeletonCard,
  SkeletonCard,
} from "../components/SkeletonLoaders";
import { resolveProductImage } from "../utils/productUtils";
import { Flame, Bolt, Compass, Crown, ChevronRight, ChevronLeft, ShoppingCart, Heart, ArrowRight } from "lucide-react";
import { getLocalizedProductName } from "../utils/translationUtils";

const ALL_CATS = [
  "rice", "oil", "wheat-flour", "salt", "sugar", "chilli-powder",
  "turmeric-powder", "pulses", "masala", "fruits", "vegetables",
  "dairyProducts", "feminineHygiene", "homeNeeds", "babyCare",
  "instantFood", "milkPowders", "chipsAndNamkeens", "oralCare",
  "biscuitsAndCookies", "coolDrinks", "bodyCare",
];

const DEAL_CATS = ["fruits", "vegetables", "dairyProducts", "biscuitsAndCookies", "instantFood", "coolDrinks"];
const HOME_VIEW_CACHE_PREFIX = "pb_home_view_v1";
const HOME_VIEW_TTL_MS = 1000 * 60 * 20;

const MULTICOL_CATS = {
  topSelling: "rice",
  trending: "oil",
  recentlyAdded: "masala",
  topRated: "pulses",
};

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
    // Don't assign _uid here - let mergeCategoryProducts handle stable UID generation
    const liveProducts = val
      ? Object.values(val).map((p, i) => ({ ...p, _cat: cat, _index: i }))
      : [];
    return mergeCategoryProducts(cat, liveProducts, "in");
  });

const fetchWithCache = async (cat) => {
  const cacheKey = `pb_cat_${cat}`;
  const cached = safeSessionGet(cacheKey);
  if (cached) {
    try {
      const saved = JSON.parse(cached);
      return mergeCategoryProducts(cat, saved, "in");
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

const ensureMinimumItems = (items, minimum) => {
  const source = Array.isArray(items) ? items.filter(Boolean) : [];
  if (source.length === 0) return [];
  if (source.length >= minimum) return source.slice(0, minimum);

  const expanded = [...source];
  let cloneIndex = 0;
  while (expanded.length < minimum) {
    const original = source[cloneIndex % source.length];
    expanded.push({
      ...original,
      _uid: `${original._uid || original.name || "item"}__dup_${cloneIndex}`,
    });
    cloneIndex += 1;
  }
  return expanded;
};

const buildFallbackHomeSections = (region = "in") => {
  const topSelling = getFallbackCategoryProductsByRegion(MULTICOL_CATS.topSelling, region).slice(0, 6);
  const trending = getFallbackCategoryProductsByRegion(MULTICOL_CATS.trending, region).slice(0, 6);
  const recentlyAdded = getFallbackCategoryProductsByRegion(MULTICOL_CATS.recentlyAdded, region).slice(0, 6);
  const topRated = getFallbackCategoryProductsByRegion(MULTICOL_CATS.topRated, region).slice(0, 6);
  const allPopular = ALL_CATS.flatMap((category) => getFallbackCategoryProductsByRegion(category, region));
  const allDeals = DEAL_CATS.flatMap((category) =>
    getFallbackCategoryProductsByRegion(category, region).filter((product) => product.oldPrice)
  );

  return {
    popular15: shuffle(allPopular).slice(0, 15),
    deals: ensureMinimumItems(shuffle(allDeals), 6),
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
  refreshSignal = 0,
  navigationMode = "push",
}) {
  const t = useT(language);
  const isKenya = region === "ke";
  const displayPrice = (value) => formatCurrencyDisplay(value, region);

  const [popular15, setPopular15] = useState([]);
  const [deals, setDeals] = useState([]);
  const [multiCols, setMultiCols] = useState({ topSelling: [], trending: [], recentlyAdded: [], topRated: [] });
  const [loading, setLoading] = useState(true);
  const [railState, setRailState] = useState({});
  const [railMetrics, setRailMetrics] = useState({});
  const railViewportRefs = useRef({});
  const hasLoadedHomeRef = useRef(false);
  const restoredHomeCacheRef = useRef(false);
  const restoredHomeScrollYRef = useRef(0);
  const homeStateCacheKey = `${HOME_VIEW_CACHE_PREFIX}:${region}`;

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
    { className: "b1", title: t.home.banner1, target: "vegetables", image: "/assets/fresh&clean.png" },
    { className: "b2", title: t.home.banner2, target: "dairyProducts", image: "/assets/healthy-breakfast.png" },
    { className: "b3", title: t.home.banner3, target: "fruits", image: "/assets/organic-food.png" },
  ];

  const categoryTiles = [
    { key: "dairyProducts", img: "/assets/category-1.png", name: t.categories.dairyProducts },
    { key: "coolDrinks", img: "/assets/category-2.png", name: t.categories.coolDrinks },
    { key: "bodyCare", img: "/assets/category-3.png", name: t.categories.bodyCare },
    { key: "babyCare", img: "/assets/category-4.png", name: t.categories.babyCare },
    { key: "instantFood", img: "/assets/category-5.png", name: t.categories.instantFood },
    { key: "biscuitsAndCookies", img: "/assets/category-6.png", name: t.categories.biscuitsCookies },
    { key: "vegetables", img: "/assets/category-7.png", name: t.categories.vegetables },
    { key: "fruits", img: "/assets/category-10.png", name: t.categories.freshFruits },
    { key: "feminineHygiene", img: "/assets/category-9.png", name: t.categories.feminineHygiene },
  ];

  const featureItems = [
    { img: "/assets/icon-1.png", title: t.features.bestPrices, sub: t.features.bestPricesSub },
    { img: "/assets/icon-2.png", title: t.features.freeDelivery, sub: t.features.freeDeliverySub },
    { img: "/assets/icon-3.png", title: t.features.greatDeal, sub: t.features.greatDealSub },
    { img: "/assets/icon-4.png", title: t.features.wideAssortment, sub: t.features.wideAssortmentSub },
    { img: "/assets/icon-5.png", title: t.features.easyReturns, sub: t.features.easyReturnsSub },
  ];

  const getTranslatedName = (name) => getLocalizedProductName(name, t);

  useEffect(() => {
    restoredHomeCacheRef.current = false;
    restoredHomeScrollYRef.current = 0;
    if (navigationMode !== "restore") return;

    const cached = safeSessionGet(homeStateCacheKey);
    if (!cached) return;

    try {
      const parsed = JSON.parse(cached);
      if (!parsed || Date.now() - Number(parsed.savedAt || 0) > HOME_VIEW_TTL_MS) {
        safeSessionRemove(homeStateCacheKey);
        return;
      }

      if (Array.isArray(parsed.popular15)) setPopular15(parsed.popular15);
      if (Array.isArray(parsed.deals)) setDeals(parsed.deals);
      if (parsed.multiCols) setMultiCols(parsed.multiCols);
      restoredHomeScrollYRef.current = Number(parsed.scrollY || 0);
      restoredHomeCacheRef.current = true;
      hasLoadedHomeRef.current = true;
      setLoading(false);
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: restoredHomeScrollYRef.current, behavior: "auto" });
      });
    } catch {
      safeSessionRemove(homeStateCacheKey);
    }
  }, [homeStateCacheKey, navigationMode]);

  useEffect(() => {
    let cancelled = false;
    const keepContentVisible = hasLoadedHomeRef.current && refreshSignal > 0;
    if (restoredHomeCacheRef.current && refreshSignal === 0) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: restoredHomeScrollYRef.current, behavior: "auto" });
      });
      return () => {
        cancelled = true;
      };
    }

    if (isKenya) {
      if (!cancelled) {
        setPopular15(shuffle(KENYA_ALL_PRODUCTS).slice(0, 15));
        setDeals(KENYA_DEALS);
        setMultiCols(KENYA_SECTIONS);
        setLoading(false);
        hasLoadedHomeRef.current = true;
      }
      return () => {
        cancelled = true;
      };
    }

    if (!hasFirebaseConfig || !database) {
      const fallbackSections = buildFallbackHomeSections(region);
      if (!cancelled) {
        setPopular15(fallbackSections.popular15);
        setDeals(fallbackSections.deals);
        setMultiCols(fallbackSections.multiCols);
        setLoading(false);
        hasLoadedHomeRef.current = true;
      }
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      setLoading(!keepContentVisible);
      try {
        const fallbackSections = buildFallbackHomeSections(region);
        const withTimeout = (promise, ms = 4000) =>
          Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
          ]);

        const popularResults = await withTimeout(Promise.all(ALL_CATS.map(fetchWithCache)));
        const allPopular = popularResults.flat();

        const dealResults = await withTimeout(Promise.all(DEAL_CATS.map(fetchWithCache)));
        const allDeals = dealResults.flat().filter((p) => p.oldPrice);

        const mcValues = await withTimeout(Promise.all(Object.values(MULTICOL_CATS).map(fetchWithCache)));
        const [ts, tr, ra, tp] = mcValues;

        if (!cancelled) {
          setPopular15(
            shuffle(allPopular.length ? allPopular : fallbackSections.popular15).slice(0, 15)
          );
          setDeals(
            ensureMinimumItems(
              shuffle(allDeals.length ? allDeals : fallbackSections.deals),
              6
            )
          );
          setMultiCols({
            topSelling: (ts.length ? ts : fallbackSections.multiCols.topSelling).slice(0, 6),
            trending: (tr.length ? tr : fallbackSections.multiCols.trending).slice(0, 6),
            recentlyAdded: (ra.length ? ra : fallbackSections.multiCols.recentlyAdded).slice(0, 6),
            topRated: (tp.length ? tp : fallbackSections.multiCols.topRated).slice(0, 6),
          });
          setLoading(false);
          hasLoadedHomeRef.current = true;
        }
      } catch (err) {
        console.error("HomePage fetch error:", err);
        if (!cancelled) {
          const fallbackSections = buildFallbackHomeSections(region);
          setPopular15(fallbackSections.popular15);
          setDeals(fallbackSections.deals);
          setMultiCols(fallbackSections.multiCols);
          setLoading(false);
          hasLoadedHomeRef.current = true;
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [homeStateCacheKey, isKenya, language, refreshSignal, region]);

  useEffect(() => {
    if (loading) return;
    safeSessionSet(
      homeStateCacheKey,
      JSON.stringify({
        savedAt: Date.now(),
        popular15,
        deals,
        multiCols,
        scrollY: typeof window !== "undefined" ? window.scrollY || 0 : 0,
      })
    );
  }, [deals, homeStateCacheKey, loading, multiCols, popular15]);

  useEffect(() => {
    if (loading || typeof window === "undefined") return undefined;
    let frame = 0;
    const saveScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        safeSessionSet(
          homeStateCacheKey,
          JSON.stringify({
            savedAt: Date.now(),
            popular15,
            deals,
            multiCols,
            scrollY: window.scrollY || 0,
          })
        );
      });
    };
    window.addEventListener("scroll", saveScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", saveScroll);
    };
  }, [deals, homeStateCacheKey, loading, multiCols, popular15]);

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
  };

  const syncRailIndex = (key, nextIndex) => {
    setRailState((prev) => {
      const currentIndex = prev[key]?.index ?? 0;
      if (currentIndex === nextIndex && prev[key]) {
        return prev;
      }

      return {
        ...prev,
        [key]: { index: nextIndex },
      };
    });
  };

  const setRailIndex = (key, nextValue, behavior = "smooth") => {
    const currentIndex = railState[key]?.index ?? 0;
    const resolvedValue = typeof nextValue === "function" ? nextValue(currentIndex) : nextValue;
    const maxIndex = railMetrics[key]?.maxIndex ?? 0;
    const nextIndex = Math.max(0, Math.min(resolvedValue, maxIndex));
    const viewport = railViewportRefs.current[key];
    const stepWidth = railMetrics[key]?.stepWidth ?? 0;

    syncRailIndex(key, nextIndex);

    if (viewport && stepWidth > 0) {
      viewport.scrollTo({
        left: nextIndex * stepWidth,
        behavior,
      });
    }
  };

  const scrollRail = (key, direction) => {
    setRailIndex(key, (currentIndex) => currentIndex + direction);
  };

  const handleRailScroll = (key) => {
    const viewport = railViewportRefs.current[key];
    const stepWidth = railMetrics[key]?.stepWidth ?? 0;
    const maxIndex = railMetrics[key]?.maxIndex ?? 0;
    if (!viewport || stepWidth <= 0) return;

    const nextIndex = Math.max(0, Math.min(Math.round(viewport.scrollLeft / stepWidth), maxIndex));
    syncRailIndex(key, nextIndex);
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

        if (event.cancelable) {
          event.preventDefault();
        }
        const stepWidth = railMetrics[section.key]?.stepWidth ?? 0;
        if (stepWidth > 0) {
          node.scrollBy({ left: dominantDelta > 0 ? stepWidth : -stepWidth, behavior: "smooth" });
        }
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

  useEffect(() => {
    curatedSections.forEach((section) => {
      const viewport = railViewportRefs.current[section.key];
      const stepWidth = railMetrics[section.key]?.stepWidth ?? 0;
      const currentIndex = railState[section.key]?.index ?? 0;

      if (!viewport || stepWidth <= 0) return;

      const expectedLeft = currentIndex * stepWidth;
      if (Math.abs(viewport.scrollLeft - expectedLeft) > 2) {
        viewport.scrollTo({ left: expectedLeft, behavior: "auto" });
      }
    });
  }, [railMetrics, railState, multiCols.topSelling, multiCols.trending, multiCols.recentlyAdded, multiCols.topRated]);

  return (
    <>
      <section className="home-showcase">
        <div className="container">
          <div className="home-showcase-grid">
            <div className="home-showcase-hero">
              {loading ? <HeroSkeleton /> : <HeroSlider language={language} onCategorySelect={onCategorySelect} />} 
            </div>
          </div>
        </div>
      </section>

      <section className="products-section">
        <div className="container">
          <div className="sec-header">
            <div>
              <div className="sec-title"> 
                <span className="section-title-icon"><Flame size={18} /></span>
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
                    : popular15.map((p) => (
                      <ProductCard
                        key={p._uid}
                        p={p}
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
            </div>

            <div className="sidebar">
              <div className="cat-box">
                <h3>{t.home.category}</h3>
                {(loading
                  ? Array.from({ length: 9 }).map((_, index) => ({ key: `skeleton-${index}`, skeleton: true }))
                  : [
                  { key: "fruits", icon: "fa-solid fa-apple-whole", label: t.categories.freshFruits },
                  { key: "vegetables", icon: "fa-solid fa-carrot", label: t.categories.vegetables },
                  { key: "dairyProducts", icon: "fa-solid fa-cheese", label: t.categories.dairyProducts },
                  { key: "chipsAndNamkeens", icon: "fa-solid fa-cookie-bite", label: t.categories.chipsNamkeens },
                  { key: "coolDrinks", icon: "fa-solid fa-glass-water", label: t.categories.coolDrinks },
                  { key: "instantFood", icon: "fa-solid fa-bolt", label: t.categories.instantFood },
                  { key: "babyCare", icon: "fa-solid fa-baby", label: t.categories.babyCare },
                  { key: "bodyCare", icon: "fa-solid fa-spa", label: t.categories.bodyCare },
                  { key: "feminineHygiene", icon: "fa-solid fa-person-dress", label: t.categories.feminineHygiene },
                  { key: "homeNeeds", icon: "fa-solid fa-broom", label: t.categories.homeNeeds },
                  { key: "oralCare", icon: "fa-solid fa-tooth", label: t.categories.oralCare },
                  { key: "biscuitsAndCookies", icon: "fa-solid fa-cookie", label: t.categories.biscuitsCookies },
                  { key: "milkPowders", icon: "fa-solid fa-glass-whiskey", label: t.categories.milkPowders },
                ]).map((c) => (
                  c.skeleton ? (
                    <CategorySkeletonLoader key={c.key} />
                  ) : (
                  <div key={c.key} className="cat-item" style={{ cursor: "pointer" }} onClick={() => onCategorySelect && onCategorySelect(c.key)}>
                    <div className="cat-item-l">
                      <div className="cicon"><i className={`fas ${c.icon}`}></i></div>
                      {c.label}
                    </div>
                    <ChevronRight size={14} style={{ color: "#bbb" }} />
                  </div>
                  )
                ))} 
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="deals-section">
        <div className="deals-header">
          <div className="deals-copy">
            <h2 className="deals-title"> 
              <span className="section-title-icon"><Bolt size={18} /></span>
              <span className="section-title-text">{t.home.deals}</span>
            </h2>
            <p className="section-subtitle compact deals-subtitle">{homeUi.dealsDescription}</p>
          </div>
          <a href="#" className="deals-all-link" onClick={(e) => { e.preventDefault(); onCategorySelect && onCategorySelect("all"); }}>
            <span className="deals-all-link-text">{t.home.allDeals}</span>
            <span className="deals-all-link-icon">
              <ChevronRight size={14} />
            </span>
          </a> 
        </div>
          <div className="deals-grid">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <DealSkeletonCard key={i} />)
            : deals.map((d) => (
                <ProductCard
                  key={d._uid}
                  p={d}
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
                  {t.home.shopNow} <ArrowRight size={12} style={{ verticalAlign: "middle" }} />
                </a>
              </div>
              <div className="bimg"><img src={banner.image} alt="" loading="lazy" decoding="async" /></div>
            </div>
          ))}
        </div>
      </div>

      <section className="cat-section">
        <div className="container">
          <div className="deals-header category-intro-card">
            <div className="deals-copy category-intro-copy">
              <h2 className="deals-title category-intro-title">
                <span className="section-title-icon"><Compass size={18} /></span>
                <span className="section-title-text">{t.home.shopByCategory}</span>
              </h2>
              <p className="section-subtitle compact deals-subtitle category-intro-subtitle">{homeUi.categoriesDescription}</p>
            </div>
            <a href="#" className="deals-all-link category-intro-link" onClick={(e) => { e.preventDefault(); onCategorySelect && onCategorySelect("all"); }}>
              <span className="deals-all-link-text">{t.home.allCategories}</span>
              <span className="deals-all-link-icon">
                <ChevronRight size={14} />
              </span>
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
                <span className="section-title-icon"><Crown size={18} /></span>
                <span className="section-title-text">{t.home.topSelling}</span>
              </div>
              <p className="section-subtitle compact">{homeUi.curatedDescription}</p>
            </div>
          </div>
          <div className="multicol">
            {curatedSections.map((col) => {
              const metrics = railMetrics[col.key] ?? getRailMetricsForWidth(0, loading ? 4 : col.items.length);
              const currentIndex = Math.min(railState[col.key]?.index ?? 0, metrics.maxIndex);
              const itemWidth = metrics.stepWidth > 0 ? Math.max(metrics.stepWidth - metrics.gap, 0) : 0;

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
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      className="rail-control-btn"
                      onClick={() => scrollRail(col.key, 1)}
                      disabled={currentIndex >= metrics.maxIndex}
                      aria-label={`Scroll ${col.title} right`}
                    > 
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <div
                  className="mcol-viewport"
                  ref={(node) => registerRailViewport(col.key, node)}
                  style={{
                    "--rail-visible-count": metrics.visibleCount,
                    "--rail-gap": `${metrics.gap}px`,
                    "--rail-item-width": itemWidth ? `${itemWidth}px` : undefined,
                  }}
                  onScroll={() => handleRailScroll(col.key)}
                >
                  <div
                    className="mcol-track"
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
                            <img src={resolveProductImage(item)} alt={translatedName} loading="lazy" decoding="async" />
                          </div>
                          <div className="minfo">
                            <h6>{translatedName}</h6>
                            <div className="pstars">★ {item.stars || "4.0"} <span>({item.reviews || 0})</span></div>
                            <div className="mbrand">{item.brand}</div>
                            <div className="mcurated-price-row">
                              <span className="mprice">{displayPrice(item.price)}</span>
                              {item.oldPrice && (
                                <span className="mpold">{displayPrice(item.oldPrice)}</span>
                              )}
                            </div>
                            <div
                              className="mcurated-actions"
                              data-rail-ignore-drag="true"
                              onClick={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                            >
                              {qty > 0 ? (
                                <div
                                  className="mcurated-qty"
                                  data-rail-ignore-drag="true"
                                >
                                  <button
                                    type="button"
                                    className="mcurated-qty-btn"
                                    data-rail-ignore-drag="true"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={() => onDecreaseCart && onDecreaseCart(item._uid)}
                                  >
                                    -
                                  </button>
                                  <span className="mcurated-qty-value">{qty}</span>
                                  <button
                                    type="button"
                                    className="mcurated-qty-btn"
                                    data-rail-ignore-drag="true"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={() => onAddCart && onAddCart(item)}
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="padd"
                                  data-rail-ignore-drag="true"
                                  onPointerDown={(e) => e.stopPropagation()}
                                  style={{ fontSize: 11, padding: "4px 10px", flex: 1 }}
                                  onClick={() => onAddCart && onAddCart(item)}
                                >
                                  <ShoppingCart size={14} style={{ marginRight: 6 }} /> {t.home.add}
                                </button>
                              )}
                              <button
                                type="button"
                                className={`pwish mcurated-wish-btn${isWished ? " active" : ""}`}
                                data-rail-ignore-drag="true"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleWishlist && toggleWishlist(item);
                                }}
                              >
                                <Heart size={16} fill={isWished ? "#fff" : "none"} style={{ color: isWished ? "#fff" : "currentColor" }} />
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
                    {isKenya ? "Telezesha shelf au tumia mishale" : "Swipe the shelf or use the arrows"}
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
            src="/assets/banner-9-min.png"
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
