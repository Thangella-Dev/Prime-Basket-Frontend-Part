import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import PhoneAuthModal from "./components/PhoneAuthModal";
import PremiumPageLoader from "./components/PremiumPageLoader";
import AppErrorBoundary from "./components/AppErrorBoundary";
import {
  AccountDashboardSkeleton,
  CartPageSkeleton,
  CategoryPageSkeleton,
  CheckoutSummarySkeleton,
  HomePageSkeleton,
  ProductDetailSkeleton,
} from "./components/SkeletonLoaders";
import HomePage from "./pages/HomePage";
import { translations } from "./i18n/translations";
import { useTracking } from "./context/TrackingContext";
import TrackingPopup from "./components/TrackingPopup";
import { formatCurrency, parsePrice, resolveProductImage } from "./utils/productUtils";

const AccountPage = lazy(() => import("./pages/AccountPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const OrderSuccessPage = lazy(() => import("./pages/OrderSuccessPage"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const RateOrderPage = lazy(() => import("./pages/RateOrderPage"));
const UnderDevelopmentPage = lazy(() => import("./pages/UnderDevelopmentPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const GenericStaticPage = lazy(() => import("./pages/GenericStaticPage"));

const NAV_STATE_KEY = "pb_nav_state_v2";
const NAV_SCROLL_KEY = "pb_nav_scroll_v2";
const GUEST_LOCALE_KEY = "pb_guest_locale_v1";
const NAV_MODE_RESTORE = "restore";
const NAV_MODE_PUSH = "push";

const getAllowedLanguagesForRegion = (regionValue = "in") =>
  regionValue === "ke" ? ["en", "ke"] : ["en", "hi", "te"];

const getDefaultLanguageForRegion = (regionValue = "in") =>
  regionValue === "ke" ? "ke" : "en";

const sanitizeLanguageForRegion = (nextLanguage, regionValue = "in") => {
  const allowed = getAllowedLanguagesForRegion(regionValue);
  return allowed.includes(nextLanguage)
    ? nextLanguage
    : getDefaultLanguageForRegion(regionValue);
};

const deriveRegionFromPhone = (phone = "") => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (
    digits.startsWith("254") ||
    (digits.length === 10 && (digits.startsWith("07") || digits.startsWith("01"))) ||
    (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1")))
  ) {
    return "ke";
  }
  if (digits.startsWith("91") || (digits.length === 10 && /^[6-9]/.test(digits))) {
    return "in";
  }
  return null;
};

const readStoredJson = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const sanitizeStoredProduct = (product) => {
  if (!product || typeof product !== "object") return product;
  return {
    ...product,
    imageUrl: resolveProductImage(product),
    image: resolveProductImage(product),
  };
};

const sanitizeStoredOrder = (order) => {
  if (!order || typeof order !== "object") return order;
  return {
    ...order,
    items: Array.isArray(order.items) ? order.items.map(sanitizeStoredProduct) : order.items,
  };
};

const buildCartToastPayload = (product, qty, action = "added") => ({
  product,
  qty,
  action,
});

const normalizeUnitKey = (value) =>
  String(value || "default")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const buildWishlistSnapshot = (product) => {
  const sanitizedProduct = sanitizeStoredProduct(product);
  const {
    quantity,
    selectedUnit,
    wishlistOrigin,
    wishlistRestoreEligible,
    wishlistOriginSnapshot,
    ...wishlistProduct
  } = sanitizedProduct || {};
  return wishlistProduct;
};

const dedupeWishlistCollection = (items = []) => {
  const byUid = new Map();
  items.forEach((item) => {
    const snapshot = buildWishlistSnapshot(item);
    if (snapshot?._uid && !byUid.has(snapshot._uid)) {
      byUid.set(snapshot._uid, snapshot);
    }
  });
  return [...byUid.values()];
};

const dedupeCartCollection = (items = []) => {
  const byKey = new Map();
  items.forEach((item) => {
    const sanitizedItem = sanitizeStoredProduct(item);
    const normalizedUnit = normalizeUnitKey(
      sanitizedItem?.selectedUnit ||
      sanitizedItem?.baseUnit ||
      sanitizedItem?.standard ||
      sanitizedItem?.unit ||
      sanitizedItem?.quantityLabel ||
      "default"
    );
    const key = `${sanitizedItem?._uid || sanitizedItem?.id || sanitizedItem?.name || "item"}::${normalizedUnit}`;
    const nextQuantity = Number(sanitizedItem?.quantity) > 0 ? Number(sanitizedItem.quantity) : 1;

    if (!byKey.has(key)) {
      byKey.set(key, {
        ...sanitizedItem,
        selectedUnit: normalizedUnit,
        quantity: nextQuantity,
      });
      return;
    }

    const existing = byKey.get(key);
    byKey.set(key, {
      ...existing,
      quantity: (existing.quantity || 0) + nextQuantity,
      wishlistOrigin: Boolean(existing.wishlistOrigin || sanitizedItem?.wishlistOrigin),
      wishlistRestoreEligible:
        existing.wishlistRestoreEligible !== false &&
        sanitizedItem?.wishlistRestoreEligible !== false,
      wishlistOriginSnapshot:
        existing.wishlistOriginSnapshot || sanitizedItem?.wishlistOriginSnapshot || null,
    });
  });
  return [...byKey.values()];
};

export default function App() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const { startTracking, activeOrder, completedOrder, setCompletedOrder } = useTracking();
  const [bootVisualReady, setBootVisualReady] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [hideMobileGlassDock, setHideMobileGlassDock] = useState(false);
  const [refundOverlayOpen, setRefundOverlayOpen] = useState(false);
  const [categoryVisitToken, setCategoryVisitToken] = useState(0);
  const [navigationMode, setNavigationMode] = useState(NAV_MODE_PUSH);
  const initialClientPrefsRef = useRef(null);
  const initialNavRef = useRef(null);
  if (initialClientPrefsRef.current === null) {
    const storedUser = readStoredJson("user", null);
    const inferredRegion = deriveRegionFromPhone(storedUser?.phone);
    initialClientPrefsRef.current = {
      storedUser,
      inferredRegion,
      storedLanguage: localStorage.getItem("pb_lang") || "en",
      storedRegion: localStorage.getItem("pb_region") || "in",
      storedTheme: localStorage.getItem("pb_theme"),
    };
  }
  if (initialNavRef.current === null) {
    initialNavRef.current = readStoredJson(NAV_STATE_KEY, {});
  }
  const initialClientPrefs = initialClientPrefsRef.current || {};
  const initialNav = initialNavRef.current || {};

  // ── Language & Region ──
  const [language, setLanguage] = useState(() => {
    if (initialClientPrefs.inferredRegion) return getDefaultLanguageForRegion(initialClientPrefs.inferredRegion);
    return sanitizeLanguageForRegion(initialClientPrefs.storedLanguage || "en", initialClientPrefs.storedRegion || "in");
  });
  const [theme, setTheme] = useState(() => {
    const saved = initialClientPrefs.storedTheme;
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  });
  const [region, setRegion] = useState(() => {
    if (initialClientPrefs.inferredRegion) return initialClientPrefs.inferredRegion;
    const stored = initialClientPrefs.storedRegion;
    if (stored) return stored;
    return (language === "ke" ? "ke" : "in");
  });

  const handleLanguageChange = useCallback((nextLanguage) => {
    setLanguage(sanitizeLanguageForRegion(nextLanguage, region));
  }, [region]);

  const handleRegionChange = useCallback((nextRegion) => {
    const safeRegion = nextRegion === "ke" ? "ke" : "in";
    setRegion(safeRegion);
    setLanguage(getDefaultLanguageForRegion(safeRegion));
  }, [language]);

  // ── Notifications ──
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pb_notifications") || "[]"); } catch { return []; }
  });

  const addNotification = (title, message, type = "info") => {
    const newNote = {
      id: Date.now(),
      title,
      message,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      createdAt: Date.now(),
    };
    setNotifications(prev => {
      const updated = [newNote, ...prev].slice(0, 20);
      localStorage.setItem("pb_notifications", JSON.stringify(updated));
      showToast(message, { title, type });
      return updated;
    });
  };

  useEffect(() => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const cleaned = notifications.filter((note) => {
      const createdAt = Number(note?.createdAt || 0);
      if (!createdAt) return true;
      const isOlderThanDay = now - createdAt > DAY_MS;
      const keepImportantUnread =
        !note?.read && (note?.type === "delivery" || note?.type === "success");
      return !isOlderThanDay || keepImportantUnread;
    });
    if (cleaned.length !== notifications.length) {
      setNotifications(cleaned);
      localStorage.setItem("pb_notifications", JSON.stringify(cleaned));
    }
  }, [notifications]);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("pb_notifications", JSON.stringify(updated));
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem("pb_notifications");
  };

  // ── Global Tracking & Rating Logic ──
  const lastNotifiedStatusRef = useRef(null);
  useEffect(() => {
    if (activeOrder) {
      // Guard: only notify once per status per order
      const statusKey = `${activeOrder.orderId}_${activeOrder.status}`;
      if (lastNotifiedStatusRef.current === statusKey) return;
      lastNotifiedStatusRef.current = statusKey;

      const tNote = (translations[language] || translations.en).notifications;

      if (activeOrder.status === "Delivered") {
        setCompletedOrder(activeOrder);
        updateOrderStatus(activeOrder.orderId, "Delivered");
        addNotification(
          tNote.orderDelivered,
          tNote.orderDeliveredMsg.replace("{id}", activeOrder.orderId),
          "success"
        );
      } else if (activeOrder.status === "Packed") {
        addNotification(
          language === "ke" ? "Agizo Limefungwa" : "Order Packed",
          language === "ke"
            ? `Agizo lako #${activeOrder.orderId} limefungwa na linaandaliwa kusafirishwa.`
            : `Your order #${activeOrder.orderId} is packed and being prepared for dispatch.`,
          "info"
        );
      } else if (activeOrder.status === "Out for Delivery") {
         addNotification(
          tNote.outForDelivery,
          tNote.outForDeliveryMsg.replace("{id}", activeOrder.orderId),
          "info"
        );
      }
    }
  }, [activeOrder?.status, activeOrder?.orderId, language]);
  
  useEffect(() => {
    localStorage.setItem("pb_lang", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("pb_region", region);
  }, [region]);

  useEffect(() => {
    if (!isAuthenticated || !user?.phone) return;
    const inferredRegion = deriveRegionFromPhone(user.phone);
    if (!inferredRegion) return;

    if (region !== inferredRegion) {
      setRegion(inferredRegion);
    }
    const sanitizedLanguage = sanitizeLanguageForRegion(language, inferredRegion);
    if (language !== sanitizedLanguage) {
      setLanguage(sanitizedLanguage);
    }
  }, [isAuthenticated, user?.phone, region, language]);

  useEffect(() => {
    const timer = window.setTimeout(() => setBootVisualReady(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("pb_theme", theme);
    document.body.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#08111f" : "#1f5ca1");
  }, [theme]);



  // ── Navigation state ──
  const [page, setPage] = useState(() => initialNav.page || "home");
  const [selectedCategory, setSelectedCategory] = useState(() => initialNav.selectedCategory || null);
  const [selectedProduct, setSelectedProduct] = useState(() => initialNav.selectedProduct || null);

  // ── Payment & Order state ──
  const [checkoutData, setCheckoutData] = useState(() => initialNav.checkoutData || null);
  const [orderData, setOrderData] = useState(() => initialNav.orderData || null);
  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pb_orders") || "[]").map(sanitizeStoredOrder);
    } catch {
      return [];
    }
  });
  const [accountSection, setAccountSection] = useState(() => initialNav.accountSection || "profile");
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(() => initialNav.selectedOrderForDetail || null);

  // ── Cart & Wishlist ──
  const [cart, setCart] = useState(() => {
    try {
      return dedupeCartCollection(JSON.parse(localStorage.getItem("pb_cart") || "[]"));
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState(() => {
    try {
      return dedupeWishlistCollection(JSON.parse(localStorage.getItem("pb_wishlist") || "[]"));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("pb_cart", JSON.stringify(dedupeCartCollection(cart)));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("pb_wishlist", JSON.stringify(dedupeWishlistCollection(wishlist)));
  }, [wishlist]);

  // ── Cart Toast Panel ──
  const [cartToast, setCartToast] = useState(null); // { product, qty, action }
  const cartToastTimer = useRef(null);

  // ── Modal ──
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // ── Under-development page ──
  const [underDevLabel, setUnderDevLabel] = useState(() => initialNav.underDevLabel || "");

  useEffect(() => {
    if (!["category", "cart"].includes(page) && hideMobileGlassDock) {
      setHideMobileGlassDock(false);
    }
  }, [hideMobileGlassDock, page]);

  const hasMountedNavigationRef = useRef(false);
  const hasRestoredInitialScrollRef = useRef(false);
  const skipNextScrollResetRef = useRef(false);
  // Scroll to top on in-app navigation, but not on initial boot/refresh restore
  useEffect(() => {
    if (!hasMountedNavigationRef.current) {
      hasMountedNavigationRef.current = true;
      return;
    }
    if (skipNextScrollResetRef.current) {
      skipNextScrollResetRef.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [page, selectedCategory, selectedProduct]);

  const getViewKey = useCallback(
    () =>
      [
        page || "home",
        selectedCategory || "",
        selectedProduct?._uid || selectedProduct?.id || "",
        page === "account" ? accountSection || "" : "",
        selectedOrderForDetail?.orderId || selectedOrderForDetail?.id || "",
      ].join("|"),
    [page, selectedCategory, selectedProduct, accountSection, selectedOrderForDetail]
  );

  useEffect(() => {
    const navState = {
      page,
      selectedCategory,
      selectedProduct,
      checkoutData,
      orderData,
      accountSection,
      selectedOrderForDetail,
      underDevLabel,
    };
    localStorage.setItem(NAV_STATE_KEY, JSON.stringify(navState));
  }, [page, selectedCategory, selectedProduct, checkoutData, orderData, accountSection, selectedOrderForDetail, underDevLabel]);

  useEffect(() => {
    const viewKey = getViewKey();
    const saveScroll = () => {
      const existing = readStoredJson(NAV_SCROLL_KEY, {}) || {};
      existing[viewKey] = window.scrollY || 0;
      localStorage.setItem(NAV_SCROLL_KEY, JSON.stringify(existing));
    };

    const restoreScroll = () => {
      if (hasRestoredInitialScrollRef.current) return;
      const saved = readStoredJson(NAV_SCROLL_KEY, {}) || {};
      const y = Number(saved[viewKey] || 0);
      hasRestoredInitialScrollRef.current = true;
      if (y > 0) window.scrollTo({ top: y, behavior: "auto" });
    };

    let raf = 0;
    let timer = 0;
    if (!hasRestoredInitialScrollRef.current) {
      raf = window.requestAnimationFrame(restoreScroll);
      timer = window.setTimeout(restoreScroll, 240);
    }
    window.addEventListener("scroll", saveScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("scroll", saveScroll);
    };
  }, [getViewKey, page, selectedCategory, selectedProduct, accountSection, selectedOrderForDetail, bootVisualReady]);

  // Sync orders from localStorage if updated elsewhere
  useEffect(() => {
    const sync = () => {
      try {
        const localOrders = JSON.parse(localStorage.getItem("pb_orders") || "[]");
        setOrders(localOrders);
      } catch (e) {}
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // Listen for product-open events fired from ProductDetailPage similar cards
  useEffect(() => {
    const handler = (e) => openProduct(e.detail);
    window.addEventListener("open-product", handler);
    return () => window.removeEventListener("open-product", handler);
  }, []);

  // ── History API Support ──
  useEffect(() => {
    const handlePopState = (event) => {
      skipNextScrollResetRef.current = true;
      setNavigationMode(NAV_MODE_RESTORE);
      if (event.state) {
        const { page: p, cat: c, prod: pr, accSec } = event.state;
        setPage(p || "home");
        setSelectedCategory(c || null);
        setSelectedProduct(pr || null);
        if (accSec) setAccountSection(accSec);
      } else {
        setPage("home");
        setSelectedCategory(null);
        setSelectedProduct(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    
    // Initial state push
    if (!window.history.state) {
      window.history.replaceState({
        page: initialNav.page || "home",
        cat: initialNav.selectedCategory || null,
        prod: initialNav.selectedProduct || null,
        accSec: initialNav.accountSection || null,
      }, "", "");
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync state changes to history
  const isInternalChange = useRef(false);
  useEffect(() => {
    const currentState = window.history.state;
    const newState = { 
      page, 
      cat: selectedCategory, 
      prod: selectedProduct, 
      accSec: page === "account" ? accountSection : null 
    };

    // Only push if different from current state to avoid loops
    if (JSON.stringify(currentState) !== JSON.stringify(newState)) {
      window.history.pushState(newState, "", "");
    }
  }, [page, selectedCategory, selectedProduct, accountSection]);

  // Listen for footer under-development link clicks
  useEffect(() => {
    const handler = (e) => {
      setUnderDevLabel(e.detail?.label || "");
      setPage("under-dev");
    };
    window.addEventListener("open-under-dev", handler);
    return () => window.removeEventListener("open-under-dev", handler);
  }, []);

  // Listen for static page navigation from footer
  useEffect(() => {
    const handler = (e) => {
      const targetPage = e.detail?.page;
      if (!targetPage) return;

      if (targetPage === "login") {
        if (!isAuthenticated) setIsLoginModalOpen(true);
        else setPage("account");
      } else if (targetPage === "cart") {
        goCart();
      } else if (targetPage === "wishlist") {
        goWishlist();
      } else if (targetPage === "orders") {
        setAccountSection("orders");
        if (isAuthenticated) setPage("account");
        else setIsLoginModalOpen(true);
      } else if (targetPage === "help") {
        setAccountSection("help");
        if (isAuthenticated) setPage("account");
        else setIsLoginModalOpen(true);
      } else if (targetPage.startsWith("cat:")) {
        const cat = targetPage.replace("cat:", "");
        goCategory(cat);
      } else {
        setPage(targetPage);
      }
    };
    window.addEventListener("footer-navigate", handler);
    return () => window.removeEventListener("footer-navigate", handler);
  }, [isAuthenticated]);

  // ── Navigation helpers ──
  const goHome = () => {
    if (page === "home" && !selectedCategory && !selectedProduct) {
      return;
    }
    skipNextScrollResetRef.current = true;
    setNavigationMode(NAV_MODE_RESTORE);
    setPage("home");
    setSelectedCategory(null);
    setSelectedProduct(null);
  };
  const refreshHomeFromLogo = useCallback(() => {
    setNavigationMode(NAV_MODE_PUSH);
    setPage("home");
    setSelectedCategory(null);
    setSelectedProduct(null);
    setRefreshSignal((prev) => prev + 1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);
  const goCategory = (cat) => {
    setNavigationMode(NAV_MODE_PUSH);
    window.scrollTo({ top: 0, behavior: "auto" });
    setCategoryVisitToken((prev) => prev + 1);
    setSelectedCategory(cat);
    setSelectedProduct(null);
    setPage("category");
  };
  const openProduct = (product) => {
    setNavigationMode(NAV_MODE_PUSH);
    setSelectedProduct(product);
    setPage("product");
  };
  const goCart = () => setPage("cart");
  const goWishlist = () => setPage("wishlist");

  const goBackFromProduct = () => {
    if (typeof window !== "undefined" && window.history.length > 1 && window.history.state) {
      window.history.back();
      return;
    }
    if (selectedCategory) {
      goCategory(selectedCategory);
      return;
    }
    goHome();
  };

  const goCheckout = (data) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    setCheckoutData(data);
    setPage("payment");
  };

  const handlePaymentSuccess = (order) => {
    const newOrder = {
      ...order,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      status: "Confirmed",
    };
    const updated = [newOrder, ...orders];
    setOrders(updated);
    localStorage.setItem("pb_orders", JSON.stringify(updated));
    setOrderData(newOrder);
    setCart([]);
    localStorage.removeItem("pb_cart");

    // Add real-time notification
    addNotification(
      "Order Placed!",
      `Your order #${newOrder.id || Date.now().toString().slice(-6)} has been placed successfully.`,
      "success"
    );

    setPage("order-success");
    
    // Cleanup gift cards if used (codes starting with GC are manually added)
    if (order.promoCode && order.promoCode.startsWith("GC")) {
      try {
        const existing = JSON.parse(localStorage.getItem("pb_gift_cards") || "[]");
        const filtered = existing.filter(c => c.code !== order.promoCode);
        localStorage.setItem("pb_gift_cards", JSON.stringify(filtered));
      } catch(e) {}
    }

    // Global tracking trigger
    startTracking(newOrder);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => {
      const updated = prev.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o);
      localStorage.setItem("pb_orders", JSON.stringify(updated));
      return updated;
    });
    // Also update orderData if it's the current one
    if (orderData && orderData.orderId === orderId) {
      setOrderData(prev => ({ ...prev, status: newStatus }));
    }
  };

  const deleteOrder = (orderId) => {
    setOrders(prev => {
      const updated = prev.filter(o => o.orderId !== orderId);
      localStorage.setItem("pb_orders", JSON.stringify(updated));
      return updated;
    });
    showToast("Order deleted from history.");
  };

  // ── Order Actions from My Orders ──
  const handleOrderSummary = (order) => {
    setSelectedOrderForDetail(order);
    setPage("order-detail");
  };

  const handleRateOrder = (order) => {
    setSelectedOrderForDetail(order);
    setPage("rate-order");
  };

  const resolveCartUnit = useCallback((item) => {
    if (!item) return "default";
    return normalizeUnitKey(item.selectedUnit || item.baseUnit || item.standard || item.unit || item.quantityLabel || "default");
  }, []);

  const normalizeCartProduct = useCallback((product) => {
    const selectedUnit = resolveCartUnit(product);
    return {
      ...sanitizeStoredProduct(product),
      selectedUnit,
      quantity: Number(product?.quantity) > 0 ? Number(product.quantity) : 1,
    };
  }, [resolveCartUnit]);

  const handleOrderAgain = (order) => {
    if (!order?.items || order.items.length === 0) {
      showToast("No items to reorder from this order.");
      return;
    }
    // Add all items from the order to cart
    let unavailableCount = 0;
    const newCart = [...cart];
    for (const item of order.items) {
      // Simulated availability check (95% chance available)
      const isAvailable = Math.random() > 0.05;
      if (!isAvailable) {
        unavailableCount++;
        continue;
      }
      const normalizedItem = normalizeCartProduct(item);
      const existing = newCart.find((c) => c._uid === normalizedItem._uid && resolveCartUnit(c) === normalizedItem.selectedUnit);
      if (existing) {
        existing.quantity = (existing.quantity || 0) + normalizedItem.quantity;
      } else {
        newCart.push(normalizedItem);
      }
    }
    setCart(newCart);
    localStorage.setItem("pb_cart", JSON.stringify(newCart));

    if (unavailableCount > 0) {
      showToast(`${unavailableCount} item(s) not available, removed from cart.`);
    }

    addNotification(
      "Items Added to Cart",
      `${order.items.length - unavailableCount} items from order #${order.orderId} added to your cart.`,
      "success"
    );
    setPage("cart");
  };

  // ── Cart Toast Panel ──
  const showCartToast = useCallback((product, updatedCart, action = "added") => {
    if (cartToastTimer.current) clearTimeout(cartToastTimer.current);
    const normalizedProduct = normalizeCartProduct(product);
    const item = updatedCart.find((i) => i._uid === normalizedProduct._uid && resolveCartUnit(i) === normalizedProduct.selectedUnit);
    if (!item) {
      setCartToast(null);
      return;
    }
    setCartToast(buildCartToastPayload(normalizedProduct, item.quantity, action));
    cartToastTimer.current = setTimeout(() => setCartToast(null), 3000);
  }, [normalizeCartProduct, resolveCartUnit]);

  const showCartRemovedToast = useCallback((product) => {
    if (!product) return;
    if (cartToastTimer.current) clearTimeout(cartToastTimer.current);
    const normalizedProduct = normalizeCartProduct(product);
    setCartToast(buildCartToastPayload(normalizedProduct, 0, "removed"));
    cartToastTimer.current = setTimeout(() => setCartToast(null), 2200);
  }, [normalizeCartProduct]);

  const restoreWishlistProductFromCart = useCallback((cartItem, options = {}) => {
    const { silent = false } = options;
    if (!cartItem?.wishlistOrigin || cartItem?.wishlistRestoreEligible === false) return;
    const snapshot = buildWishlistSnapshot(cartItem.wishlistOriginSnapshot || cartItem);
    if (!snapshot?._uid) return;
    setWishlist((prev) => {
      if (prev.some((item) => item._uid === snapshot._uid)) return prev;
      return dedupeWishlistCollection([...prev, snapshot]);
    });
    if (!silent) {
      showToast("Moved back to wishlist", { type: "info", title: "Wishlist updated" });
    }
  }, []);

  // ── Cart helpers ──
  const addToCart = (product) => {
    setCart((prev) => {
      const normalizedProduct = normalizeCartProduct(product);
      const existing = prev.find((item) => item._uid === normalizedProduct._uid && resolveCartUnit(item) === normalizedProduct.selectedUnit);
      let updated;
      if (existing) {
        updated = prev.map((item) =>
          item._uid === normalizedProduct._uid && resolveCartUnit(item) === normalizedProduct.selectedUnit
            ? {
                ...item,
                quantity: item.quantity + 1,
                wishlistOrigin: Boolean(item.wishlistOrigin || normalizedProduct.wishlistOrigin),
                wishlistRestoreEligible:
                  item.wishlistRestoreEligible !== false &&
                  normalizedProduct.wishlistRestoreEligible !== false,
                wishlistOriginSnapshot:
                  item.wishlistOriginSnapshot || normalizedProduct.wishlistOriginSnapshot || null,
              }
            : item
        );
      } else {
        updated = [...prev, normalizedProduct];
      }
      showCartToast(normalizedProduct, updated);
      return updated;
    });
  };

  const decreaseQuantity = (product) => {
    const uid = typeof product === "string" ? product : product._uid;
    const unit = typeof product === "object" ? resolveCartUnit(product) : null;
    let removedItem = null;
    
    setCart((prev) => {
      const index = prev.findIndex((item) => item._uid === uid && (!unit || resolveCartUnit(item) === unit));
      if (index !== -1 && prev[index].quantity > 1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], quantity: updated[index].quantity - 1 };
        if (typeof product === "object") {
          showCartToast(product, updated);
        }
        return updated;
      }
      removedItem = prev.find((item) => item._uid === uid && (!unit || resolveCartUnit(item) === unit)) || null;
      const updated = prev.filter((item) => !(item._uid === uid && (!unit || resolveCartUnit(item) === unit)));
      if (typeof product === "object") {
        showCartRemovedToast(product);
      } else {
        setCartToast(null);
      }
      return updated;
    });
    if (removedItem) {
      restoreWishlistProductFromCart(removedItem);
    }
  };

  const removeFromCart = (uid, unit) => {
    let removedItem = null;
    setCart((prev) => {
      removedItem = prev.find((i) => i._uid === uid && (!unit || resolveCartUnit(i) === unit)) || null;
      if (removedItem) {
        showCartRemovedToast(removedItem);
      } else {
        setCartToast(null);
      }
      return prev.filter((i) => !(i._uid === uid && (!unit || resolveCartUnit(i) === unit)));
    });
    if (removedItem) {
      restoreWishlistProductFromCart(removedItem);
    }
  };

  const updateCartQty = (uid, unit, qty) => {
    if (qty <= 0) removeFromCart(uid, unit);
    else setCart((prev) => prev.map((i) => (i._uid === uid && (!unit || resolveCartUnit(i) === unit)) ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => {
    cart.forEach((item) => restoreWishlistProductFromCart(item, { silent: true }));
    setCart([]);
    localStorage.removeItem("pb_cart");
  };

  // ── Wishlist helpers ──
  const removeWishlistItem = useCallback((product, options = {}) => {
    const { silent = false, blockRestore = true } = options;
    if (!product?._uid) return;
    const uid = product._uid;

    setWishlist((prev) => prev.filter((item) => item._uid !== uid));

    if (blockRestore) {
      setCart((prev) =>
        prev.map((item) =>
          item._uid === uid ? { ...item, wishlistRestoreEligible: false } : item
        )
      );
    }

    if (!silent) {
      showToast((translations[language] || translations.en).toasts.removedFromWishlist, {
        type: "info",
        title: "Wishlist updated",
      });
    }
  }, [language]);

  const moveWishlistItemToCart = useCallback((product) => {
    if (!product) return;
    const wishlistSnapshot = buildWishlistSnapshot(product);
    const cartProduct = {
      ...product,
      wishlistOrigin: true,
      wishlistRestoreEligible: true,
      wishlistOriginSnapshot: wishlistSnapshot,
    };

    removeWishlistItem(product, { silent: true, blockRestore: false });
    setCart((prev) => {
      const normalizedProduct = normalizeCartProduct(cartProduct);
      const existing = prev.find((item) => item._uid === normalizedProduct._uid && resolveCartUnit(item) === normalizedProduct.selectedUnit);
      const updated = existing
        ? prev.map((item) =>
            item._uid === normalizedProduct._uid && resolveCartUnit(item) === normalizedProduct.selectedUnit
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  wishlistOrigin: true,
                  wishlistRestoreEligible: true,
                  wishlistOriginSnapshot:
                    item.wishlistOriginSnapshot || normalizedProduct.wishlistOriginSnapshot || null,
                }
              : item
          )
        : [...prev, normalizedProduct];

      showCartToast(normalizedProduct, updated, "moved");
      return updated;
    });
  }, [normalizeCartProduct, removeWishlistItem, resolveCartUnit, showCartToast]);

  const clearWishlist = useCallback(() => {
    const wishlistIds = new Set(wishlist.map((item) => item._uid));
    setWishlist([]);
    setCart((prev) =>
      prev.map((item) =>
        wishlistIds.has(item._uid) ? { ...item, wishlistRestoreEligible: false } : item
      )
    );
    showToast("Wishlist cleared", { type: "info", title: "Wishlist updated" });
  }, [wishlist]);

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((item) => item._uid === product._uid);
      if (exists) {
        setCart((cartPrev) =>
          cartPrev.map((item) =>
            item._uid === product._uid ? { ...item, wishlistRestoreEligible: false } : item
          )
        );
        showToast((translations[language] || translations.en).toasts.removedFromWishlist, { type: "info", title: "Wishlist updated" });
        return prev.filter((item) => item._uid !== product._uid);
      }
      showToast((translations[language] || translations.en).toasts.addedToWishlist, { type: "success", title: "Wishlist updated" });
      return dedupeWishlistCollection([...prev, buildWishlistSnapshot(product)]);
    });
  };

  // ── Legacy toast (wishlist/notification messages) ──
  const showToast = (message, options = {}) => {
    const toast = document.getElementById("simple-toast");
    if (!toast) return;
    const titleNode = toast.querySelector("[data-toast-title]");
    const bodyNode = toast.querySelector("[data-toast-body]");
    const iconNode = toast.querySelector("[data-toast-icon]");
    const iconWrapNode = toast.querySelector("[data-toast-icon-wrap]");
    const type = options.type || "info";
    const title = options.title || (type === "success" ? "Success" : "Update");
    const iconByType = {
      success: "fa-circle-check",
      error: "fa-circle-exclamation",
      warning: "fa-triangle-exclamation",
      info: "fa-bell",
    };
    const paletteByType = {
      success: {
        background: "linear-gradient(135deg, rgba(10,90,76,0.92), rgba(22,163,74,0.82), rgba(84,214,146,0.78))",
        border: "1px solid rgba(134,239,172,0.34)",
        shadow: "0 18px 38px rgba(22,163,74,0.2)",
        iconBg: "rgba(220,252,231,0.18)",
      },
      error: {
        background: "linear-gradient(135deg, rgba(127,29,29,0.92), rgba(220,38,38,0.86), rgba(248,113,113,0.78))",
        border: "1px solid rgba(254,202,202,0.34)",
        shadow: "0 18px 38px rgba(220,38,38,0.22)",
        iconBg: "rgba(254,226,226,0.18)",
      },
      warning: {
        background: "linear-gradient(135deg, rgba(120,53,15,0.92), rgba(234,88,12,0.86), rgba(251,191,36,0.72))",
        border: "1px solid rgba(253,230,138,0.34)",
        shadow: "0 18px 38px rgba(234,88,12,0.2)",
        iconBg: "rgba(255,247,237,0.18)",
      },
      info: {
        background: "linear-gradient(135deg, rgba(14,47,104,0.92), rgba(29,91,160,0.88), rgba(73,191,212,0.76))",
        border: "1px solid rgba(191,219,254,0.34)",
        shadow: "0 18px 38px rgba(29,91,160,0.22)",
        iconBg: "rgba(239,246,255,0.18)",
      },
    };
    const palette = paletteByType[type] || paletteByType.info;

    toast.dataset.type = type;
    if (titleNode) titleNode.textContent = title;
    if (bodyNode) bodyNode.textContent = message;
    if (iconNode) iconNode.className = `fas ${iconByType[type] || iconByType.info}`;
    toast.style.background = palette.background;
    toast.style.border = palette.border;
    toast.style.boxShadow = palette.shadow;
    if (iconWrapNode) iconWrapNode.style.background = palette.iconBg;

    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0) scale(1)";
    if (toast._hideTimer) clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(-14px) scale(0.98)";
    }, 2200);
  };

  // ── Auth ──
  const handleLoginSuccess = (data) => {
    const userData = data?.user ?? { id: data?.id, name: data?.name || "User", phone: data?.phone || "", email: data?.email || "", role: data?.role || "CUSTOMER" };

    try {
      localStorage.setItem(
        GUEST_LOCALE_KEY,
        JSON.stringify({
          region,
          language,
        })
      );
    } catch {
      // no-op
    }
    
    // Auto-detect region from phone number if available
    const inferredRegion = deriveRegionFromPhone(userData.phone);
    if (inferredRegion) {
      handleRegionChange(inferredRegion);
    }

    // Clear guest cart/wishlist/orders for fresh login experience as requested
    setCart([]);
    setWishlist([]);
    setOrders([]);
    setNotifications([]);
    localStorage.removeItem("pb_cart");
    localStorage.removeItem("pb_wishlist");
    localStorage.removeItem("pb_orders");
    localStorage.removeItem("pb_notifications");
    localStorage.removeItem("pb_saved_addresses");
    localStorage.removeItem("pb_marked_orders");
    localStorage.removeItem("pb_saved_cards");
    localStorage.removeItem("pb_refunds");
    localStorage.removeItem("refund_requests");
    localStorage.removeItem("wallet");

    login(userData, { accessToken: data?.accessToken, refreshToken: data?.refreshToken });
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    // Clear all user-specific state
    setCart([]);
    setWishlist([]);
    setOrders([]);
    setOrderData(null);
    setCheckoutData(null);
    setNotifications([]);
    // Clear session data from storage
    localStorage.removeItem("pb_active_tracking");
    // Logout from auth (clears user/tokens)
    logout();
    const guestLocale = readStoredJson(GUEST_LOCALE_KEY, null);
    const nextRegion = guestLocale?.region === "ke" ? "ke" : "in";
    const nextLanguage = sanitizeLanguageForRegion(
      guestLocale?.language || getDefaultLanguageForRegion(nextRegion),
      nextRegion
    );
    setRegion(nextRegion);
    setLanguage(nextLanguage);
    goHome();
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;
  const refreshablePages = new Set(["home", "category", "product", "cart", "wishlist", "account"]);

  const handlePullRefresh = useCallback(async () => {
    setRefreshSignal((prev) => prev + 1);
    await new Promise((resolve) => window.setTimeout(resolve, 320));
  }, []);

  // ── Render current page ──
  const renderPage = () => {

    if (page === "under-dev") {
      return <UnderDevelopmentPage label={underDevLabel} onGoHome={goHome} language={language} region={region} />;
    }
    if (page === "about") {
      return <AboutPage language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "contact") {
      return <ContactPage language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "privacy") {
      return <PrivacyPolicyPage language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "terms") {
      return <TermsPage language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "faq") {
      return <FAQPage language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "delivery") {
      return <GenericStaticPage pageKey="delivery" language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "careers") {
      return <GenericStaticPage pageKey="careers" language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "vendor") {
      return <GenericStaticPage pageKey="vendor" language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "accessibility") {
      return <GenericStaticPage pageKey="accessibility" language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "shipping") {
      return <GenericStaticPage pageKey="shipping" language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "affiliate") {
      return <GenericStaticPage pageKey="affiliate" language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "farm-biz") {
      return <GenericStaticPage pageKey="farm-biz" language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "farm-jobs") {
      return <GenericStaticPage pageKey="farm-jobs" language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "suppliers") {
      return <GenericStaticPage pageKey="suppliers" language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "promotions") {
      return <GenericStaticPage pageKey="promotions" language={language} region={region} onGoHome={goHome} />;
    }
    if (page === "compare") {
      return <GenericStaticPage pageKey="compare" language={language} region={region} onGoHome={goHome} />;
    }

    if (page === "account" && isAuthenticated) {
      return (
        <AccountPage
          user={user}
          onGoHome={goHome}
          orders={orders}
            notifications={notifications}
            onClearNotifications={clearNotifications}
            initialSection={accountSection}
            onSectionChange={setAccountSection}
            language={language}
            region={region}
            onLogout={handleLogout}
            onOrderSummary={handleOrderSummary}
          onRateOrder={handleRateOrder}
          onOrderAgain={handleOrderAgain}
          onBuyAgainItem={addToCart}
          onDeleteOrder={deleteOrder}
          onNotification={addNotification}
          onRefundOverlayChange={setRefundOverlayOpen}
        />
      );
    }
    if (page === "cart") {
      return (
        <CartPage
          cart={cart}
          onUpdateQty={updateCartQty}
          onRemove={removeFromCart}
          onOpenProduct={openProduct}
          onContinueShopping={goHome}
          onGoAccount={() => { if (isAuthenticated) { setAccountSection("profile"); setPage("account"); } else setIsLoginModalOpen(true); }}
          onCheckout={goCheckout}
          onAddCart={addToCart}
          onMobileOverlayChange={setHideMobileGlassDock}
          language={language}
          region={region}
          user={user}
        />
      );
    }
    if (page === "wishlist") {
      return (
        <WishlistPage
          wishlist={wishlist}
          cart={cart}
          toggleWishlist={toggleWishlist}
          onMoveToCart={moveWishlistItemToCart}
          onClearWishlist={clearWishlist}
          onAddCart={addToCart}
          onDecreaseCart={decreaseQuantity}
          onOpenProduct={openProduct}
          onContinueShopping={goHome}
          language={language}
          region={region}
        />
      );
    }
    if (page === "payment" && checkoutData) {
      return (
        <PaymentPage
          cart={cart}
          total={checkoutData.total}
          delivery={checkoutData.delivery}
          vat={checkoutData.vat}
          handlingFee={checkoutData.handlingFee}
          subtotal={checkoutData.subtotal}
          saving={checkoutData.saving}
          promoDiscount={checkoutData.promoDiscount}
          promoCode={checkoutData.promoCode}
          address={checkoutData.address}
          onBack={goCart}
          onSuccess={handlePaymentSuccess}
          language={language}
          region={region}
        />
      );
    }
    if (page === "order-success" && orderData) {
      return (
        <OrderSuccessPage
          order={orderData}
          onGoHome={goHome}
          onGoOrders={() => {
            setAccountSection("orders");
            if (isAuthenticated) setPage("account");
            else setIsLoginModalOpen(true);
          }}
          onGoTracking={() => setPage("order-tracking")}
          language={language}
          region={region}
        />
      );
    }
    if (page === "order-tracking" && orderData) {
      return (
        <OrderTrackingPage
          order={orderData}
          onGoHome={goHome}
          onGoOrders={() => {
            setAccountSection("orders");
            if (isAuthenticated) setPage("account");
            else setIsLoginModalOpen(true);
          }}
          addNotification={addNotification}
          onStatusUpdate={updateOrderStatus}
          language={language}
          region={region}
        />
      );
    }
    if (page === "order-detail" && selectedOrderForDetail) {
      return (
        <OrderDetailPage
          order={selectedOrderForDetail}
          onGoBack={() => {
            setAccountSection("orders");
            setPage("account");
          }}
          onGoRate={(o) => {
            setSelectedOrderForDetail(o);
            setPage("rate-order");
          }}
          onOrderAgain={handleOrderAgain}
          language={language}
          region={region}
          user={user}
        />
      );
    }
    if (page === "rate-order" && selectedOrderForDetail) {
      return (
        <RateOrderPage
          order={selectedOrderForDetail}
          onGoBack={() => {
            setAccountSection("orders");
            setPage("account");
          }}
          onSubmit={(feedback) => {
            try {
              const existing = JSON.parse(localStorage.getItem("pb_order_reviews") || "[]");
              const updated = [feedback, ...existing];
              localStorage.setItem("pb_order_reviews", JSON.stringify(updated));
              window.dispatchEvent(new Event("storage")); // Notify components like AccountPage
            } catch (e) {}

            addNotification(
              "Review Submitted",
              `Your review for order #${feedback.orderId} has been saved. Thank you!`,
              "success"
            );
          }}
          language={language}
          region={region}
        />
      );
    }
    if (page === "category") {
      return (
        <CategoryPage
          category={selectedCategory}
          onCategoryChange={goCategory}
          onBack={goHome}
          onAddCart={addToCart}
          onDecreaseCart={decreaseQuantity}
          onOpenProduct={openProduct}
          cart={cart}
          wishlist={wishlist}
          toggleWishlist={toggleWishlist}
          language={language}
          region={region}
          refreshSignal={refreshSignal}
          onMobileOverlayChange={setHideMobileGlassDock}
          navigationMode={navigationMode}
          visitToken={categoryVisitToken}
        />
      );
    }
    if (page === "product" && selectedProduct) {
      return (
        <ProductDetailPage
          product={selectedProduct}
          onBack={goBackFromProduct}
          onAddCart={addToCart}
          onDecreaseCart={decreaseQuantity}
          cart={cart}
          wishlist={wishlist}
          toggleWishlist={toggleWishlist}
          onCategorySelect={goCategory}
          onOpenProduct={openProduct}
          language={language}
          region={region}
        />
      );
    }
    if (page === "home") {
      return (
        <HomePage
          onAddCart={addToCart}
          onDecreaseCart={decreaseQuantity}
          onCategorySelect={goCategory}
          onOpenProduct={openProduct}
          cart={cart}
          wishlist={wishlist}
          toggleWishlist={toggleWishlist}
          language={language}
          region={region}
          refreshSignal={refreshSignal}
          navigationMode={navigationMode}
        />
      );
    }

    // Default fallback (e.g. if page is 'account' but not authenticated)
    return (
      <HomePage
        onAddCart={addToCart}
        onDecreaseCart={decreaseQuantity}
        onCategorySelect={goCategory}
        onOpenProduct={openProduct}
        cart={cart}
        wishlist={wishlist}
        toggleWishlist={toggleWishlist}
        language={language}
        region={region}
        refreshSignal={refreshSignal}
        navigationMode={navigationMode}
      />
    );
  };

  const renderPageSkeleton = () => {
    if (page === "account") return <AccountDashboardSkeleton />;
    if (page === "cart" || page === "wishlist") return <CartPageSkeleton />;
    if (page === "payment" || page === "order-success" || page === "order-tracking") return <CheckoutSummarySkeleton />;
    if (page === "order-detail" || page === "rate-order") return <AccountDashboardSkeleton />;
    if (page === "category") return <CategoryPageSkeleton />;
    if (page === "product") return <ProductDetailSkeleton />;
    if (page === "home") return <HomePageSkeleton />;
    return <PremiumPageLoader />;
  };

  if (!bootVisualReady) {
    return <PremiumPageLoader fullScreen />;
  }

  return (
    <>
      <Layout
        currentPage={page}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onAccountClick={() => { if (isAuthenticated) { setAccountSection("profile"); setPage("account"); } else setIsLoginModalOpen(true); }}
        onCartClick={goCart}
        onWishlistClick={goWishlist}
        isLoggedIn={isAuthenticated}
        user={user}
        onCategorySelect={goCategory}
        onLogoClick={goHome}
        onLogoDoubleClick={refreshHomeFromLogo}
        language={language}
        onLanguageChange={handleLanguageChange}
        region={region}
        onRegionChange={handleRegionChange}
        theme={theme}
        onThemeToggle={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        showFooter={page === "home"}

        // Chatbot props
        cart={cart}
        wishlist={wishlist}
        onAddToCart={addToCart}
        toggleWishlist={toggleWishlist}
        onRemoveFromCart={removeFromCart}
        onUpdateCartQty={updateCartQty}
        onClearCart={clearCart}
        onOpenProduct={openProduct}
        notifications={notifications}
        markAllRead={markAllRead}
        clearNotifications={clearNotifications}
        enablePullRefresh={refreshablePages.has(page)}
        onPullRefresh={handlePullRefresh}
        hideMobileGlassDock={
          hideMobileGlassDock ||
          isLoginModalOpen ||
          (page === "account" && accountSection === "refunds") ||
          refundOverlayOpen
        }
      >
        <AppErrorBoundary>
          <Suspense fallback={renderPageSkeleton()}>
            {renderPage()}
          </Suspense>
        </AppErrorBoundary>
      </Layout>

      {/* ── Zepto-style Cart Preview Panel ── */}
      <div style={{
        position: "fixed", top: "16px", right: "16px",
        transform: cartToast ? "translateY(0)" : "translateY(calc(-100% - 30px))",
        transition: "transform 0.38s cubic-bezier(0.34, 1.3, 0.64, 1)",
        width: "min(274px, 82vw)",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 8px 26px rgba(0,0,0,0.16)",
        zIndex: 99999,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "10px 12px 8px",
          borderBottom: "1px solid #f0f0f0",
        }}>
          <i
            className={`fas ${
              cartToast?.action === "removed"
                ? "fa-trash-can"
                : cartToast?.action === "moved"
                  ? "fa-arrow-right-arrow-left"
                  : "fa-check-circle"
            }`}
            style={{
              color:
                cartToast?.action === "removed"
                  ? "#c62828"
                  : cartToast?.action === "moved"
                    ? "#1d5ba0"
                    : "#2e7d32",
              fontSize: "16px",
            }}
          ></i>
          <span
            style={{
              fontWeight: 700,
              fontSize: "13px",
              color:
                cartToast?.action === "removed"
                  ? "#c62828"
                  : cartToast?.action === "moved"
                    ? "#1d5ba0"
                    : "#2e7d32",
            }}
          >
            {cartToast?.action === "removed"
              ? "Removed from Cart"
              : cartToast?.action === "moved"
                ? "Moved to Cart"
                : "Added to Cart"}
          </span>
        </div>

        {/* Product Row */}
        {cartToast && (() => {
          const p = cartToast.product;
          const name = (language === "sw" || language === "ke") ? (p.nameSw || p.name) : (language === "te" ? (p.nameTe || p.name) : p.name);
          const rawPrice = parsePrice(p.offerPrice ?? p.price ?? 0);
          const rawMrp = p.mrp != null || p.originalPrice != null
            ? parsePrice(p.mrp ?? p.originalPrice)
            : null;
          const unit = p.unit || p.weight || "";
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 12px" }}>
              {/* Image */}
              <div style={{
                width: "54px", height: "54px", flexShrink: 0,
                borderRadius: "8px", border: "1px solid #eee",
                overflow: "hidden", background: "#fafafa",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {p.image || p.imageUrl ? (
                  <img src={resolveProductImage(p)} alt={name}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <i className="fas fa-box" style={{ color: "#ccc", fontSize: "22px" }}></i>
                )}
              </div>
              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600, fontSize: "12.5px", color: "#1a1a1a",
                  overflow: "hidden", textOverflow: "ellipsis",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  lineHeight: 1.3,
                }}>{name}</div>
                {cartToast.action === "removed" ? (
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>Item removed from your basket</div>
                ) : cartToast.action === "moved" ? (
                  <div style={{ fontSize: "11px", color: "#5c6f8b", marginTop: "2px" }}>Saved from wishlist and ready in your basket</div>
                ) : (
                  unit && <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{unit} ×{cartToast.qty}</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px" }}>
                  <span style={{
                    background: "#2e7d32", color: "#fff",
                    fontWeight: 700, fontSize: "12px",
                    padding: "2px 8px", borderRadius: "6px",
                  }}>{formatCurrency(rawPrice, region)}</span>
                  {rawMrp != null && rawMrp > rawPrice && (
                    <span style={{ fontSize: "11px", color: "#aaa", textDecoration: "line-through" }}>{formatCurrency(rawMrp, region)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {cartToast?.action !== "removed" && (
          <div
            onClick={() => { setCartToast(null); goCart(); }}
            style={{
              borderTop: "1px solid #f0f0f0",
              padding: "10px 12px",
              textAlign: "center",
              fontWeight: 700, fontSize: "12px",
              color: "#052694ff",
              cursor: "pointer",
              userSelect: "none",
              letterSpacing: "0.2px",
            }}
          >
            Go to Cart &nbsp;›
          </div>
        )}
      </div>

      {/* Simple toast for wishlist/notification messages */}
      <div id="simple-toast" style={{
        opacity: 0,
        transform: "translateX(-50%) translateY(-14px) scale(0.98)",
        transition: "opacity 0.26s ease, transform 0.26s ease",
        position: "fixed",
        top: "82px",
        left: "50%",
        width: "min(92vw, 430px)",
        padding: "12px 14px",
        borderRadius: "18px",
        background: "linear-gradient(135deg, rgba(14,47,104,0.92), rgba(29,91,160,0.88), rgba(73,191,212,0.76))",
        color: "#fff",
        boxShadow: "0 18px 38px rgba(29,91,160,0.22)",
        border: "1px solid rgba(191,219,254,0.34)",
        backdropFilter: "blur(18px)",
        zIndex: 99998,
        pointerEvents: "none",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div
            data-toast-icon-wrap
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "12px",
              background: "rgba(239,246,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <i data-toast-icon className="fas fa-bell"></i>
          </div>
          <div style={{ minWidth: 0 }}>
            <div data-toast-title style={{ fontSize: "11px", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.8 }}>
              Update
            </div>
            <div data-toast-body style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1.4, marginTop: "2px" }}>
              Notification
            </div>
          </div>
        </div>
      </div>

      <PhoneAuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        language={language}
        region={region}
      />

      {/* Global Tracking & Rating Widgets */}
      <TrackingPopup
        currentPage={page}
        onOpenTracking={() => setPage("order-tracking")}
        onOpenRating={(order) => {
          if (!order) return;
          setSelectedOrderForDetail(order);
          setPage("rate-order");
        }}
        onOpenOrderHelp={() => {
          window.dispatchEvent(new CustomEvent("open-chatbot"));
        }}
      />
    </>
  );
}
