import { lazy, Suspense, useEffect, useRef, useState } from "react";
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
}) {
  const shellRef = useRef(null);
  const pullStateRef = useRef({ active: false, startY: 0, distance: 0 });
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!enablePullRefresh) {
      setPullDistance(0);
      setIsRefreshing(false);
      pullStateRef.current = { active: false, startY: 0, distance: 0 };
    }
  }, [enablePullRefresh]);

  const maxPull = 88;
  const triggerPull = 62;

  const handleTouchStart = (event) => {
    if (!enablePullRefresh || isRefreshing) return;
    if (window.innerWidth > 768) return;
    if ((window.scrollY || 0) > 0) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    pullStateRef.current = { active: true, startY: touch.clientY, distance: 0 };
  };

  const handleTouchMove = (event) => {
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
    event.preventDefault();
  };

  const endPull = async () => {
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
  };

  return (
    <>
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
        className={`page-shell${enablePullRefresh ? " page-shell-refreshable" : ""}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={endPull}
        onTouchCancel={endPull}
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
          style={{ transform: enablePullRefresh ? `translateY(${pullDistance}px)` : undefined }}
        >
          {children}
        </div>
      </main>
      {showFooter && <Footer onNavigate={onFooterNavigate} language={language} region={region} wishlistCount={wishlistCount} onWishlistClick={onWishlistClick} />}

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
