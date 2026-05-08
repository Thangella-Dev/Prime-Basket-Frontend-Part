// Reusable skeleton loader components
export const SkeletonCard = () => (
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

export const DealSkeletonCard = () => (
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

export const RailSkeletonCard = () => (
  <div className="premium-rail-skeleton premium-skeleton-surface" aria-hidden="true">
    <span className="premium-skeleton-thumb"></span>
    <div className="premium-rail-skeleton-copy">
      <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
      <span className="premium-skeleton-line premium-skeleton-line-md"></span>
      <span className="premium-skeleton-line"></span>
    </div>
  </div>
);

export const CartItemSkeletonLoader = () => (
  <div className="premium-cart-item-skeleton premium-skeleton-surface" aria-hidden="true">
    <div className="premium-skeleton-thumb"></div>
    <div className="premium-skeleton-body" style={{ flex: 1 }}>
      <span className="premium-skeleton-line premium-skeleton-line-lg"></span>
      <span className="premium-skeleton-line premium-skeleton-line-md"></span>
      <span className="premium-skeleton-line premium-skeleton-line-sm" style={{ width: '60%' }}></span>
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
    <div className="premium-skeleton-thumb" style={{ aspectRatio: '1', borderRadius: '12px' }}></div>
    <span className="premium-skeleton-line premium-skeleton-line-md"></span>
  </div>
);

export default {
  SkeletonCard,
  DealSkeletonCard,
  RailSkeletonCard,
  CartItemSkeletonLoader,
  AccountMenuSkeletonLoader,
  CategorySkeletonLoader,
};
