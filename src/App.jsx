import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import PhoneAuthModal from "./components/PhoneAuthModal";
import PremiumPageLoader from "./components/PremiumPageLoader";
import HomePage from "./pages/HomePage";
import { translations } from "./i18n/translations";
import { useTracking } from "./context/TrackingContext";
import TrackingPopup from "./components/TrackingPopup";
import { formatCurrency, parsePrice } from "./utils/productUtils";

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

const getDefaultLanguageForRegion = (regionValue = "in") =>
  regionValue === "ke" ? "ke" : "en";

export default function App() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const { startTracking, activeOrder, completedOrder, setCompletedOrder } = useTracking();
  const [bootVisualReady, setBootVisualReady] = useState(false);

  // ── Language & Region ──
  const [language, setLanguage] = useState(() => localStorage.getItem("pb_lang") || "en");
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("pb_theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  });
  const [region, setRegion] = useState(() => {
    const userStored = JSON.parse(localStorage.getItem("user") || "null");
    if (userStored?.phone) {
      const d = userStored.phone.replace(/\D/g, "");
      if (d.startsWith("254") || (d.length === 10 && (d.startsWith("07") || d.startsWith("01"))) || (d.length === 9 && (d.startsWith("7") || d.startsWith("1")))) return "ke";
      if (d.startsWith("91") || (d.length === 10 && /^[6-9]/.test(d))) return "in";
    }
    const stored = localStorage.getItem("pb_region");
    if (stored) return stored;
    return (language === "ke" ? "ke" : "in");
  });

  const handleLanguageChange = useCallback((nextLanguage) => {
    setLanguage(nextLanguage);
  }, []);

  const handleRegionChange = useCallback((nextRegion) => {
    const safeRegion = nextRegion === "ke" ? "ke" : "in";
    setRegion(safeRegion);
    setLanguage(getDefaultLanguageForRegion(safeRegion));
  }, []);

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
      read: false
    };
    setNotifications(prev => {
      const updated = [newNote, ...prev].slice(0, 20);
      localStorage.setItem("pb_notifications", JSON.stringify(updated));
      showToast(`${title}: ${message}`);
      return updated;
    });
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("pb_notifications", JSON.stringify(updated));
  };

  // ── Global Tracking & Rating Logic ──
  const lastNotifiedStatusRef = useRef(null);
  useEffect(() => {
    if (activeOrder) {
      // Guard: only notify once per status per order
      const statusKey = `${activeOrder.orderId}_${activeOrder.status}`;
      if (lastNotifiedStatusRef.current === statusKey) return;
      lastNotifiedStatusRef.current = statusKey;

      const tNote = translations[language].notifications;

      if (activeOrder.status === "Delivered") {
        setCompletedOrder(activeOrder);
        updateOrderStatus(activeOrder.orderId, "Delivered");
        addNotification(
          tNote.orderDelivered,
          tNote.orderDeliveredMsg.replace("{id}", activeOrder.orderId),
          "success"
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
  const [page, setPage] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // ── Payment & Order state ──
  const [checkoutData, setCheckoutData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [orders, setOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pb_orders") || "[]"); } catch { return []; }
  });
  const [accountSection, setAccountSection] = useState("profile");
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);

  // ── Cart & Wishlist ──
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pb_cart") || "[]"); } catch { return []; }
  });
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pb_wishlist") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("pb_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("pb_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // ── Cart Toast Panel ──
  const [cartToast, setCartToast] = useState(null); // { product, qty }
  const cartToastTimer = useRef(null);

  // ── Modal ──
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // ── Under-development page ──
  const [underDevLabel, setUnderDevLabel] = useState("");

  // Scroll to top on every page change
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page, selectedProduct]);

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
      window.history.replaceState({ page: "home" }, "", "");
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
    setPage("home");
    setSelectedCategory(null);
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goCategory = (cat) => { setSelectedCategory(cat); setSelectedProduct(null); setPage("category"); };
  const openProduct = (product) => { setSelectedProduct(product); setPage("product"); };
  const goCart = () => setPage("cart");
  const goWishlist = () => setPage("wishlist");

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
    return item.selectedUnit || item.baseUnit || item.standard || item.unit || item.quantityLabel || "default";
  }, []);

  const normalizeCartProduct = useCallback((product) => {
    const selectedUnit = resolveCartUnit(product);
    return {
      ...product,
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
  const showCartToast = useCallback((product, updatedCart) => {
    if (cartToastTimer.current) clearTimeout(cartToastTimer.current);
    const normalizedProduct = normalizeCartProduct(product);
    const item = updatedCart.find((i) => i._uid === normalizedProduct._uid && resolveCartUnit(i) === normalizedProduct.selectedUnit);
    setCartToast({ product: normalizedProduct, qty: item ? item.quantity : 1 });
    cartToastTimer.current = setTimeout(() => setCartToast(null), 3000);
  }, [normalizeCartProduct, resolveCartUnit]);

  // ── Cart helpers ──
  const addToCart = (product) => {
    setCart((prev) => {
      const normalizedProduct = normalizeCartProduct(product);
      const existing = prev.find((item) => item._uid === normalizedProduct._uid && resolveCartUnit(item) === normalizedProduct.selectedUnit);
      let updated;
      if (existing) {
        updated = prev.map((item) =>
          item._uid === normalizedProduct._uid && resolveCartUnit(item) === normalizedProduct.selectedUnit
            ? { ...item, quantity: item.quantity + 1 }
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
    
    setCart((prev) => {
      const index = prev.findIndex((item) => item._uid === uid && (!unit || resolveCartUnit(item) === unit));
      if (index !== -1 && prev[index].quantity > 1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], quantity: updated[index].quantity - 1 };
        return updated;
      }
      return prev.filter((item) => !(item._uid === uid && (!unit || resolveCartUnit(item) === unit)));
    });
  };

  const removeFromCart = (uid, unit) => setCart((prev) => prev.filter((i) => !(i._uid === uid && (!unit || resolveCartUnit(i) === unit))));

  const updateCartQty = (uid, unit, qty) => {
    if (qty <= 0) removeFromCart(uid, unit);
    else setCart((prev) => prev.map((i) => (i._uid === uid && (!unit || resolveCartUnit(i) === unit)) ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => { setCart([]); localStorage.removeItem("pb_cart"); };

  // ── Wishlist helpers ──
  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((item) => item._uid === product._uid);
      if (exists) {
        showToast(translations[language].toasts.removedFromWishlist);
        return prev.filter((item) => item._uid !== product._uid);
      }
      showToast(translations[language].toasts.addedToWishlist);
      return [...prev, product];
    });
  };

  // ── Legacy toast (wishlist/notification messages) ──
  const showToast = (message) => {
    const toast = document.getElementById("simple-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.style.transition = "all 0.3s ease";
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(-60px)";
    }, 2200);
  };

  // ── Auth ──
  const handleLoginSuccess = (data) => {
    const userData = data?.user ?? { id: data?.id, name: data?.name || "User", phone: data?.phone || "", email: data?.email || "", role: data?.role || "CUSTOMER" };
    
    // Auto-detect region from phone number if available
    const raw = String(userData.phone || "");
    const digits = raw.replace(/\D/g, "");
    
    const isKenya = digits.startsWith("254") || 
                   (digits.length === 10 && (digits.startsWith("07") || digits.startsWith("01"))) ||
                   (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1")));

    const isIndia = digits.startsWith("91") || (digits.length === 10 && /^[6-9]/.test(digits));

    if (isKenya) {
      handleRegionChange("ke");
    } else if (isIndia) {
      handleRegionChange("in");
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
    handleRegionChange("in");
    goHome();
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

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
            initialSection={accountSection}
            onSectionChange={setAccountSection}
            language={language}
            region={region}
            onLogout={handleLogout}
            onOrderSummary={handleOrderSummary}
            onRateOrder={handleRateOrder}
            onOrderAgain={handleOrderAgain}
            onDeleteOrder={deleteOrder}
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
        />
      );
    }
    if (page === "product" && selectedProduct) {
      return (
        <ProductDetailPage
          product={selectedProduct}
          onBack={goHome}
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
      />
    );
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
        language={language}
        onLanguageChange={handleLanguageChange}
        region={region}
        onRegionChange={handleRegionChange}
        theme={theme}
        onThemeToggle={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        showFooter={!["category", "account", "payment", "cart", "product", "order-success", "order-tracking", "order-detail", "rate-order", "under-dev"].includes(page)}

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
      >
        <Suspense fallback={<PremiumPageLoader />}>
          {renderPage()}
        </Suspense>
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
          <i className="fas fa-check-circle" style={{ color: "#2e7d32", fontSize: "16px" }}></i>
          <span style={{ fontWeight: 700, fontSize: "13px", color: "#2e7d32" }}>Added to Cart</span>
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
                  <img src={p.image || p.imageUrl} alt={name}
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
                {unit && <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{unit} ×{cartToast.qty}</div>}
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

        {/* Go to Cart Button */}
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
      </div>

      {/* Simple toast for wishlist/notification messages */}
      <div id="simple-toast" style={{
        opacity: 0, transform: "translateX(-50%) translateY(-60px)",
        transition: "all 0.3s ease",
        position: "fixed", top: "76px", left: "50%",
        background: "#222", color: "#fff", padding: "9px 18px",
        borderRadius: "8px", fontWeight: 600, fontSize: "13px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.28)", zIndex: 99998,
        whiteSpace: "nowrap", width: "max-content", pointerEvents: "none",
      }} />

      <PhoneAuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        language={language}
        region={region}
      />

      {/* Global Tracking & Rating Widgets */}
      <TrackingPopup onOpenTracking={() => setPage("order-tracking")} />
    </>
  );
}
