const ProductSkeletonMarkup = () => (
  <>
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
  </>
);

export const SkeletonCard = () => (
  <div className="premium-product-skeleton premium-skeleton-surface" aria-hidden="true">
    <ProductSkeletonMarkup />
  </div>
);

export const DealSkeletonCard = () => (
  <div className="premium-deal-skeleton premium-skeleton-surface" aria-hidden="true">
    <ProductSkeletonMarkup />
  </div>
);

export const RailSkeletonCard = () => (
  <div className="premium-rail-skeleton premium-skeleton-surface" aria-hidden="true">
    <span className="premium-skeleton-thumb"></span>
    <div className="premium-rail-skeleton-copy">
      <span className="premium-skeleton-pill"></span>
      <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
      <span className="premium-skeleton-line premium-skeleton-line-md"></span>
      <div className="premium-skeleton-price-row">
        <span className="premium-skeleton-price"></span>
        <span className="premium-skeleton-price-muted"></span>
      </div>
      <div className="premium-rail-skeleton-actions">
        <span className="premium-skeleton-cta"></span>
        <span className="premium-skeleton-icon"></span>
      </div>
    </div>
  </div>
);

export const CartItemSkeletonLoader = () => (
  <div className="premium-cart-item-skeleton premium-skeleton-surface" aria-hidden="true">
    <div className="premium-skeleton-thumb"></div>
    <div className="premium-skeleton-body" style={{ flex: 1 }}>
      <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
      <span className="premium-skeleton-line premium-skeleton-line-md"></span>
      <span className="premium-skeleton-line premium-skeleton-line-sm" style={{ width: "60%" }}></span>
      <div className="premium-skeleton-price-row">
        <span className="premium-skeleton-price"></span>
        <span className="premium-skeleton-price-muted"></span>
      </div>
    </div>
  </div>
);

export const AccountMenuSkeletonLoader = () => (
  <div className="premium-account-menu-skeleton premium-skeleton-surface" aria-hidden="true">
    <div className="premium-skeleton-icon"></div>
    <div className="premium-skeleton-body">
      <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
      <span className="premium-skeleton-line premium-skeleton-line-md"></span>
    </div>
  </div>
);

export const CategorySkeletonLoader = () => (
  <div className="premium-category-skeleton premium-skeleton-surface" aria-hidden="true">
    <div className="premium-skeleton-thumb" style={{ aspectRatio: "1", borderRadius: "12px" }}></div>
    <span className="premium-skeleton-line premium-skeleton-line-md"></span>
  </div>
);

export const InlinePanelSkeleton = ({ lines = 3, compact = false }) => (
  <div
    className={`premium-inline-panel-skeleton premium-skeleton-surface${compact ? " compact" : ""}`}
    aria-hidden="true"
  >
    <span className="premium-skeleton-pill"></span>
    {Array.from({ length: lines }).map((_, index) => (
      <span
        key={index}
        className={`premium-skeleton-line ${index === 0 ? "premium-skeleton-line-lg" : index === lines - 1 ? "premium-skeleton-line-sm" : "premium-skeleton-line-md"}`}
      ></span>
    ))}
    <div className="premium-skeleton-price-row">
      <span className="premium-skeleton-price"></span>
      <span className="premium-skeleton-price-muted"></span>
    </div>
  </div>
);

export const HeroSkeleton = () => (
  <div className="premium-hero-skeleton premium-skeleton-surface" aria-hidden="true">
    <div className="premium-hero-copy">
      <span className="premium-skeleton-pill"></span>
      <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
      <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
      <span className="premium-skeleton-line premium-skeleton-line-md"></span>
      <span className="premium-skeleton-cta"></span>
    </div>
    <div className="premium-hero-media">
      <div className="premium-skeleton-media"></div>
      <div className="premium-hero-dots">
        <span className="premium-skeleton-thumb"></span>
        <span className="premium-skeleton-thumb"></span>
        <span className="premium-skeleton-thumb"></span>
      </div>
    </div>
  </div>
);

export const HomePageSkeleton = () => (
  <div className="premium-page-skeleton premium-page-skeleton-home" aria-hidden="true">
    <HeroSkeleton />
    <div className="premium-page-section-grid">
      <div className="premium-page-section-main">
        <InlinePanelSkeleton lines={2} compact />
        <div className="premium-page-products-grid">
          {Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      </div>
      <div className="premium-page-section-side">
        <InlinePanelSkeleton lines={2} compact />
        {Array.from({ length: 7 }).map((_, index) => <CategorySkeletonLoader key={index} />)}
      </div>
    </div>
    <div className="premium-home-rails-skeleton">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="premium-home-rail-column">
          <InlinePanelSkeleton lines={1} compact />
          <RailSkeletonCard />
          <RailSkeletonCard />
        </div>
      ))}
    </div>
  </div>
);

export const CategoryPageSkeleton = () => (
  <div className="premium-page-skeleton premium-page-skeleton-category" aria-hidden="true">
    <div className="premium-category-layout-skeleton">
      <div className="premium-category-rail-skeleton">
        <InlinePanelSkeleton lines={1} compact />
        {Array.from({ length: 8 }).map((_, index) => <CategorySkeletonLoader key={index} />)}
      </div>
      <div className="premium-category-main-skeleton">
        <div className="premium-category-toolbar-skeleton premium-skeleton-surface">
          <span className="premium-skeleton-line premium-skeleton-line-md"></span>
          <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
          <span className="premium-skeleton-pill"></span>
          <span className="premium-skeleton-pill"></span>
        </div>
        <div className="premium-page-products-grid">
          {Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      </div>
      <div className="premium-category-filter-skeleton">
        <InlinePanelSkeleton lines={4} />
        <InlinePanelSkeleton lines={4} />
      </div>
    </div>
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="premium-page-skeleton premium-page-skeleton-product" aria-hidden="true">
    <div className="premium-product-detail-skeleton">
      <div className="premium-product-gallery-skeleton premium-skeleton-surface">
        <div className="premium-product-gallery-rail">
          {Array.from({ length: 4 }).map((_, index) => (
            <span key={index} className="premium-skeleton-thumb"></span>
          ))}
        </div>
        <div className="premium-product-gallery-main">
          <div className="premium-skeleton-media"></div>
        </div>
      </div>
      <div className="premium-product-copy-skeleton premium-skeleton-surface">
        <span className="premium-skeleton-pill"></span>
        <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
        <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
        <span className="premium-skeleton-line premium-skeleton-line-md"></span>
        <div className="premium-skeleton-price-row">
          <span className="premium-skeleton-price"></span>
          <span className="premium-skeleton-price-muted"></span>
        </div>
        <div className="premium-product-unit-row">
          {Array.from({ length: 4 }).map((_, index) => (
            <span key={index} className="premium-skeleton-pill"></span>
          ))}
        </div>
        <div className="premium-product-cta-row">
          <span className="premium-skeleton-cta"></span>
          <span className="premium-skeleton-cta"></span>
        </div>
        <InlinePanelSkeleton lines={4} />
      </div>
    </div>
    <div className="premium-page-products-grid">
      {Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)}
    </div>
  </div>
);

export const CartPageSkeleton = () => (
  <div className="premium-page-skeleton premium-page-skeleton-cart" aria-hidden="true">
    <div className="premium-cart-layout-skeleton">
      <div className="premium-cart-main-skeleton">
        <InlinePanelSkeleton lines={2} />
        {Array.from({ length: 3 }).map((_, index) => <CartItemSkeletonLoader key={index} />)}
      </div>
      <div className="premium-cart-side-skeleton">
        <CheckoutSummarySkeleton />
      </div>
    </div>
  </div>
);

export const CheckoutSummarySkeleton = () => (
  <div className="premium-checkout-summary-skeleton premium-skeleton-surface" aria-hidden="true">
    <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
    <span className="premium-skeleton-line premium-skeleton-line-md"></span>
    <span className="premium-skeleton-line premium-skeleton-line-md"></span>
    <span className="premium-skeleton-line premium-skeleton-line-md"></span>
    <div className="premium-skeleton-price-row">
      <span className="premium-skeleton-price"></span>
      <span className="premium-skeleton-price-muted"></span>
    </div>
    <span className="premium-skeleton-cta"></span>
  </div>
);

export const AccountDashboardSkeleton = () => (
  <div className="premium-page-skeleton premium-page-skeleton-account" aria-hidden="true">
    <div className="premium-account-layout-skeleton">
      <div className="premium-account-menu-list">
        {Array.from({ length: 6 }).map((_, index) => <AccountMenuSkeletonLoader key={index} />)}
      </div>
      <div className="premium-account-panel-skeleton">
        <InlinePanelSkeleton lines={2} />
        <InlinePanelSkeleton lines={5} />
        <div className="premium-page-products-grid">
          {Array.from({ length: 3 }).map((_, index) => <CartItemSkeletonLoader key={index} />)}
        </div>
      </div>
    </div>
  </div>
);

export const AuthModalSkeleton = () => (
  <div className="premium-auth-skeleton premium-skeleton-surface" aria-hidden="true">
    <div className="premium-auth-skeleton-hero">
      <div className="premium-skeleton-media"></div>
    </div>
    <div className="premium-auth-skeleton-form">
      <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
      <span className="premium-skeleton-line premium-skeleton-line-md"></span>
      <div className="premium-auth-skeleton-row">
        <span className="premium-skeleton-pill"></span>
        <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
      </div>
      <div className="premium-auth-skeleton-otp">
        {Array.from({ length: 6 }).map((_, index) => (
          <span key={index} className="premium-skeleton-thumb"></span>
        ))}
      </div>
      <span className="premium-skeleton-cta"></span>
    </div>
  </div>
);

export default {
  SkeletonCard,
  DealSkeletonCard,
  RailSkeletonCard,
  CartItemSkeletonLoader,
  AccountMenuSkeletonLoader,
  CategorySkeletonLoader,
  InlinePanelSkeleton,
  HeroSkeleton,
  HomePageSkeleton,
  CategoryPageSkeleton,
  ProductDetailSkeleton,
  CartPageSkeleton,
  CheckoutSummarySkeleton,
  AccountDashboardSkeleton,
  AuthModalSkeleton,
};
