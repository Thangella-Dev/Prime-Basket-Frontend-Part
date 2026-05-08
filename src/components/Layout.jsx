import { lazy, Suspense } from "react";
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
  currentPage = "home",
  showFooter = true,
}) {
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
      />
      <main className="page-shell">{children}</main>
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
