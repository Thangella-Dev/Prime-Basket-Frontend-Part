import { lazy, Suspense, useEffect, useRef, useState, useCallback } from "react";
import Header from "./Header";
import Footer from "./Footer";

const ChatbotWidget = lazy(() => import("./ChatbotWidget"));

export default function Layout({
  children,
  onAccountClick, isLoggedIn, user,
  onCategorySelect, onLogoClick,
  cartCount = 0, wishlistCount = 0,
  onCartClick, onWishlistClick,
  onOpenProduct,
  onFooterNavigate,
  language = "en",
  onLanguageChange,
  region = "in",
  onRegionChange,
  theme = "light",
  onThemeToggle,
  cart = [],
  wishlist = [],
  onAddToCart,
  toggleWishlist,
  onRemoveFromCart,
  onUpdateCartQty,
  onClearCart,
  notifications = [],
  markAllRead,
  clearNotifications,
  currentPage = "home",
  showFooter = true,
  enablePullRefresh = false,
  onPullRefresh,
  hideMobileGlassDock = false,
}) {
  const shellRef = useRef(null);
  const pullStateRef = useRef({ active: false, startY: 0, distance: 0 });
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addressOverlayOpen, setAddressOverlayOpen] = useState(false);
  const showMobileGlassDock =
    ["home", "category", "product", "cart", "wishlist", "account"].includes(currentPage) &&
    !hideMobileGlassDock &&
    !addressOverlayOpen;
  const mobileDockBadge = (count) => (
    count > 0 ? <span className="prime-mobile-dock-badge">{count > 99 ? "99+" : count}</span> : null
  );

  useEffect(() => {
    if (!enablePullRefresh) {
      setPullDistance(0);
      setIsRefreshing(false);
      pullStateRef.current = { active: false, startY: 0, distance: 0 };
    }
  }, [enablePullRefresh]);

  useEffect(() => {
    const handleAddressOverlay = (event) => {
      setAddressOverlayOpen(Boolean(event?.detail?.open));
    };
    window.addEventListener("prime-address-overlay", handleAddressOverlay);
    return () => {
      window.removeEventListener("prime-address-overlay", handleAddressOverlay);
    };
  }, []);

  const maxPull = 88;
  const triggerPull = 62;

  const handleTouchStart = useCallback((event) => {
    if (!enablePullRefresh || isRefreshing) return;
    if (window.innerWidth > 768) return;
    if ((window.scrollY || 0) > 0) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    pullStateRef.current = { active: true, startY: touch.clientY, distance: 0 };
  }, [enablePullRefresh, isRefreshing]);

  const handleTouchMove = useCallback((event) => {
    const state = pullStateRef.current;
    if (!state.active || isRefreshing) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    const raw = touch.clientY - state.startY;
    if (raw <= 0) {
      setPullDistance(0);
      state.distance = 0;
      return;
    }
    if ((window.scrollY || 0) > 0) {
      state.active = false;
      setPullDistance(0);
      return;
    }
    const damped = Math.min(maxPull, raw * 0.45);
    state.distance = damped;
    setPullDistance(damped);
    if (event.cancelable) {
      event.preventDefault();
    }
  }, [isRefreshing]);

  const endPull = useCallback(async () => {
    const state = pullStateRef.current;
    if (!state.active) return;
    const shouldRefresh = state.distance >= triggerPull && enablePullRefresh && !isRefreshing;
    pullStateRef.current = { active: false, startY: 0, distance: 0 };

    if (!shouldRefresh) {
      setPullDistance(0);
      return;
    }

    setIsRefreshing(true);
    setPullDistance(triggerPull);
    try {
      await Promise.resolve(onPullRefresh?.());
    } finally {
      setPullDistance(0);
      setIsRefreshing(false);
    }
  }, [enablePullRefresh, isRefreshing, onPullRefresh]);

  useEffect(() => {
    const node = shellRef.current;
    if (!node || !enablePullRefresh) return undefined;

    const start = (event) => handleTouchStart(event);
    const move = (event) => handleTouchMove(event);
    const end = () => {
      void endPull();
    };

    node.addEventListener("touchstart", start, { passive: true });
    node.addEventListener("touchmove", move, { passive: false });
    node.addEventListener("touchend", end);
    node.addEventListener("touchcancel", end);

    return () => {
      node.removeEventListener("touchstart", start);
      node.removeEventListener("touchmove", move);
      node.removeEventListener("touchend", end);
      node.removeEventListener("touchcancel", end);
    };
  }, [enablePullRefresh, handleTouchMove, handleTouchStart, endPull]);

  return (
    <>
      <style>{`
        .page-shell.has-mobile-glass-dock {
          padding-bottom: 96px;
        }
        .prime-mobile-glass-dock {
          position: fixed;
          left: 50%;
          bottom: calc(18px + env(safe-area-inset-bottom, 0px));
          transform: translateX(-50%);
          width: min(92vw, 418px);
          z-index: 99988;
          display: none;
          pointer-events: none;
        }
        .prime-mobile-glass-dock-shell {
          pointer-events: auto;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 3px;
          padding: 8px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.2);
          background:
            linear-gradient(135deg, rgba(255,255,255,0.36), rgba(255,255,255,0.16)),
            linear-gradient(135deg, rgba(29,91,160,0.54), rgba(68,196,212,0.24));
          box-shadow:
            0 16px 34px rgba(10, 24, 48, 0.16),
            inset 0 1px 0 rgba(255,255,255,0.22);
          backdrop-filter: blur(20px) saturate(145%);
          -webkit-backdrop-filter: blur(20px) saturate(145%);
          animation: primeDockRise .38s cubic-bezier(.22,.9,.25,1);
        }
        .prime-mobile-dock-item {
          position: relative;
          border: none;
          border-radius: 16px;
          min-height: 56px;
          padding: 7px 4px 6px;
          background: transparent;
          color: #174d8e;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          font-family: inherit;
          transition: transform .22s ease, color .22s ease, background .22s ease, box-shadow .22s ease, filter .22s ease;
          overflow: hidden;
          -webkit-tap-highlight-color: transparent;
        }
        .prime-mobile-dock-item::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04));
          opacity: 0;
          transition: opacity .22s ease;
        }
        .prime-mobile-dock-item:hover,
        .prime-mobile-dock-item:active {
          transform: translateY(-3px) scale(1.02);
          filter: saturate(1.05);
        }
        .prime-mobile-dock-item:hover::before,
        .prime-mobile-dock-item:active::before,
        .prime-mobile-dock-item.active::before {
          opacity: 1;
        }
        .prime-mobile-dock-item.active {
          color: #0f4e9d;
          background: linear-gradient(180deg, rgba(255,255,255,0.48), rgba(233,242,255,0.24));
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.28), 0 10px 20px rgba(10,24,48,0.1);
        }
        .prime-mobile-dock-item:active {
          animation: primeDockTap .28s ease;
        }
        .prime-mobile-dock-item.active .prime-mobile-dock-icon {
          transform: translateY(-1px) scale(1.04);
          box-shadow: 0 8px 16px rgba(12, 39, 85, 0.12);
        }
        .prime-mobile-dock-icon {
          position: relative;
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.22);
          border: 1px solid rgba(255,255,255,0.2);
          font-size: 13px;
          transition: transform .22s ease, background .22s ease, box-shadow .22s ease;
        }
        .prime-mobile-dock-item.active .prime-mobile-dock-icon,
        .prime-mobile-dock-item:hover .prime-mobile-dock-icon,
        .prime-mobile-dock-item:active .prime-mobile-dock-icon {
          background: rgba(255,255,255,0.34);
        }
        .prime-mobile-dock-label {
          position: relative;
          font-size: 9.4px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
        .prime-mobile-dock-badge {
          position: absolute;
          top: -5px;
          right: -7px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #ff5b67, #ff7c8a);
          color: #fff;
          font-size: 8px;
          font-weight: 900;
          box-shadow: 0 8px 16px rgba(229, 62, 62, 0.28);
          border: 1px solid rgba(255,255,255,0.6);
        }
        .prime-mobile-dock-user {
          width: 16px;
          height: 16px;
          border-radius: 6px;
          object-fit: cover;
          box-shadow: 0 4px 10px rgba(10,24,48,0.16);
        }
        body[data-theme="dark"] .prime-mobile-glass-dock-shell {
          border-color: rgba(116, 154, 219, 0.14);
          background:
            linear-gradient(135deg, rgba(15,27,44,0.72), rgba(8,16,30,0.56)),
            linear-gradient(135deg, rgba(18,56,110,0.62), rgba(27,112,154,0.22));
          box-shadow:
            0 18px 38px rgba(0, 0, 0, 0.34),
            inset 0 1px 0 rgba(255,255,255,0.08);
        }
        body[data-theme="dark"] .prime-mobile-dock-item {
          color: rgba(220, 234, 255, 0.84);
        }
        body[data-theme="dark"] .prime-mobile-dock-item.active {
          color: #ffffff;
          background: linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03));
          box-shadow: inset 0 0 0 1px rgba(174, 207, 255, 0.12), 0 10px 20px rgba(0,0,0,0.2);
        }
        body[data-theme="dark"] .prime-mobile-dock-icon {
          background: rgba(255,255,255,0.07);
          border-color: rgba(174, 207, 255, 0.08);
        }
        body[data-theme="light"] .prime-mobile-glass-dock-shell {
          border-color: rgba(255,255,255,0.24);
          background:
            linear-gradient(135deg, rgba(255,255,255,0.46), rgba(255,255,255,0.2)),
            linear-gradient(135deg, rgba(29,91,160,0.36), rgba(68,196,212,0.12));
        }
        @keyframes primeDockRise {
          from { opacity: 0; transform: translateY(14px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes primeDockTap {
          0% { transform: translateY(-1px) scale(1); }
          50% { transform: translateY(-4px) scale(0.98); }
          100% { transform: translateY(-3px) scale(1.02); }
        }
        @media (max-width: 768px) {
          .prime-mobile-glass-dock {
            display: block;
          }
        }
        @media (min-width: 769px) {
          .page-shell.has-mobile-glass-dock {
            padding-bottom: 0;
          }
        }
      `}</style>
      <Header
        onAccountClick={onAccountClick}
        isLoggedIn={isLoggedIn}
        user={user}
        onCategorySelect={onCategorySelect}
        onLogoClick={onLogoClick}
        onBack={onLogoClick}
        currentPage={currentPage}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={onCartClick}
        onWishlistClick={onWishlistClick}
        onOpenProduct={onOpenProduct}
        language={language}
        onLanguageChange={onLanguageChange}
        region={region}
        onRegionChange={onRegionChange}
        theme={theme}
        onThemeToggle={onThemeToggle}
        notifications={notifications}
        markAllRead={markAllRead}
        clearNotifications={clearNotifications}
      />
      <main
        ref={shellRef}
        className={`page-shell${enablePullRefresh ? " page-shell-refreshable" : ""}${showMobileGlassDock ? " has-mobile-glass-dock" : ""}`}
      >
        {enablePullRefresh && (
          <div
            className={`page-pull-indicator${isRefreshing ? " refreshing" : ""}${pullDistance >= triggerPull ? " ready" : ""}`}
            style={{ opacity: pullDistance > 0 || isRefreshing ? 1 : 0, transform: `translate(-50%, ${Math.max(-12, pullDistance - 26)}px)` }}
            aria-hidden="true"
          >
            <i className={`fas ${isRefreshing ? "fa-spinner fa-spin" : "fa-rotate-right"}`}></i>
          </div>
        )}
        <div
          className="page-shell-content"
          style={{
            transform:
              enablePullRefresh && pullDistance > 0
                ? `translateY(${pullDistance}px)`
                : undefined,
          }}
        >
          {children}
        </div>
      </main>
      {showMobileGlassDock && (
        <nav className="prime-mobile-glass-dock" aria-label="Mobile navigation">
          <div className="prime-mobile-glass-dock-shell">
            <button
              type="button"
              className={`prime-mobile-dock-item${currentPage === "home" ? " active" : ""}`}
              onClick={onLogoClick}
            >
              <span className="prime-mobile-dock-icon"><i className="fas fa-house"></i></span>
              <span className="prime-mobile-dock-label">Home</span>
            </button>
            <button
              type="button"
              className={`prime-mobile-dock-item${currentPage === "category" ? " active" : ""}`}
              onClick={() => onCategorySelect?.("all")}
            >
              <span className="prime-mobile-dock-icon"><i className="fas fa-table-cells-large"></i></span>
              <span className="prime-mobile-dock-label">Categories</span>
            </button>
            <button
              type="button"
              className={`prime-mobile-dock-item${currentPage === "wishlist" ? " active" : ""}`}
              onClick={onWishlistClick}
            >
              <span className="prime-mobile-dock-icon">
                <i className="fas fa-heart"></i>
                {mobileDockBadge(wishlistCount)}
              </span>
              <span className="prime-mobile-dock-label">Wishlist</span>
            </button>
            <button
              type="button"
              className={`prime-mobile-dock-item${currentPage === "cart" ? " active" : ""}`}
              onClick={onCartClick}
            >
              <span className="prime-mobile-dock-icon">
                <i className="fas fa-basket-shopping"></i>
                {mobileDockBadge(cartCount)}
              </span>
              <span className="prime-mobile-dock-label">Basket</span>
            </button>
            <button
              type="button"
              className={`prime-mobile-dock-item${currentPage === "account" ? " active" : ""}`}
              onClick={onAccountClick}
            >
              <span className="prime-mobile-dock-icon">
                {isLoggedIn && user?.profileImage ? (
                  <img className="prime-mobile-dock-user" src={user.profileImage} alt="Account" />
                ) : (
                  <i className="fas fa-user"></i>
                )}
              </span>
              <span className="prime-mobile-dock-label">Account</span>
            </button>
          </div>
        </nav>
      )}
      {showFooter && <Footer onNavigate={onFooterNavigate} language={language} region={region} wishlistCount={wishlistCount} onWishlistClick={onWishlistClick} hasMobileDock={showMobileGlassDock} />}

      <Suspense fallback={null}>
        <ChatbotWidget
          currentPage={currentPage}
          onGoCart={onCartClick}
          onGoWishlist={onWishlistClick}
          cart={cart}
          wishlist={wishlist}
          onAddToCart={onAddToCart}
          toggleWishlist={toggleWishlist}
          onRemoveFromCart={onRemoveFromCart}
          onUpdateCartQty={onUpdateCartQty}
          onClearCart={onClearCart}
          language={language}
          region={region}
        />
      </Suspense>
    </>
  );
}
