export default function PremiumPageLoader({ fullScreen = false }) {
  return (
    <div
      className={`premium-page-loader${fullScreen ? " premium-page-loader-fullscreen" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Prime Basket"
    >
      <div className="premium-loader-shell">
        <div className="premium-loader-brand">
          <div className="premium-loader-topline">
            <div className="premium-loader-mark">
              <img src="/assets/logo watermark 3.png" alt="Prime Basket" />
            </div>
            <div className="premium-loader-copy">
              <span className="premium-loader-kicker">Prime Basket</span>
              <strong>Fresh picks are on the way</strong>
              <p>Curating products, syncing your basket, and preparing a smoother storefront.</p>
            </div>
          </div>
          <div className="premium-loader-progress">
            <span className="premium-loader-progress-bar"></span>
          </div>
          <div className="premium-loader-metrics" aria-hidden="true">
            <span>catalog</span>
            <span>offers</span>
            <span>delivery</span>
          </div>
        </div>

        <div className="premium-loader-preview">
          <div className="premium-loader-radar">
            <span className="premium-loader-ring premium-loader-ring-one"></span>
            <span className="premium-loader-ring premium-loader-ring-two"></span>
            <span className="premium-loader-core"></span>
          </div>
          <div className="premium-loader-card premium-skeleton-surface">
            <span className="premium-loader-pill"></span>
            <span className="premium-loader-line premium-loader-line-lg"></span>
            <span className="premium-loader-line premium-loader-line-md"></span>
            <div className="premium-loader-grid">
              <span className="premium-loader-tile"></span>
              <span className="premium-loader-tile"></span>
              <span className="premium-loader-tile"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
