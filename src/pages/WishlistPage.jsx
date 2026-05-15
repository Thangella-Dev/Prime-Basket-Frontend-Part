// src/pages/WishlistPage.jsx
import { useT } from "../i18n/translations";
import { getLocalizedProductName } from "../utils/translationUtils";
import { sanitizeImageUrl } from "../utils/productUtils";

export default function WishlistPage({
  wishlist,
  cart,
  toggleWishlist,
  onAddCart,
  onDecreaseCart,
  onOpenProduct,
  onContinueShopping,
  language = "en",
}) {
  const t = useT(language);

  const getTranslatedName = (name) => getLocalizedProductName(name, t);
  const handleMoveToCart = (item) => {
    onAddCart && onAddCart(item);
    toggleWishlist && toggleWishlist(item);
  };

  return (
    <>
      <style>{`
        .wl-page { background: var(--bg); min-height: 100vh; padding-bottom: 60px; }
        .wl-crumb {
          background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(247,250,255,0.96));
          border-bottom: 1px solid rgba(203,213,225,0.72);
          padding: 14px 0;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .wl-crumb-inner { display:flex; align-items:center; gap:10px; font-size:13px; color:var(--body); }
        .wl-crumb-back {
          color:#1d5ba0;
          font-weight:800;
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:8px 12px;
          border-radius:999px;
          background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(237,244,255,0.98));
          border:1px solid rgba(191,219,254,0.98);
          box-shadow:0 10px 18px rgba(29,91,160,0.08);
          transition:transform .2s ease, box-shadow .2s ease, color .2s ease;
        }
        .wl-crumb-back:hover { transform: translateY(-1px); box-shadow:0 16px 24px rgba(29,91,160,0.14); }

        .wl-header-bar {
          background:#fff;
          border-radius:18px;
          border:1px solid rgba(148,163,184,.18);
          padding:18px 24px;
          margin-top:28px;
          margin-bottom:24px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          box-shadow:0 16px 36px rgba(15,23,42,.07);
          gap:16px;
          flex-wrap:wrap;
        }
        .wl-header-bar h2 { font-family:'Quicksand',sans-serif; font-size:20px; font-weight:800; color:var(--dark); margin:0; display:flex; align-items:center; gap:10px; }
        .wl-header-bar h2 i { color:#e63946; }
        .wl-count-pill { background:#fde8ea; color:#e63946; font-size:12px; font-weight:700; padding:3px 10px; border-radius:20px; }
        .wl-clear-btn {
          background:none;
          border:1.5px solid #e63946;
          color:#e63946;
          border-radius:12px;
          padding:8px 16px;
          font-size:13px;
          font-weight:700;
          cursor:pointer;
          font-family:inherit;
          display:flex;
          align-items:center;
          gap:6px;
          transition:.2s;
        }
        .wl-clear-btn:hover { background:#fde8ea; }

        .wl-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:16px; }
        @media(max-width:1180px){ .wl-grid { grid-template-columns:repeat(4,minmax(0,1fr)); } }
        @media(max-width:900px){ .wl-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
        @media(max-width:640px){ .wl-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; } }

        .wl-card {
          background:linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(246,249,255,0.98) 100%);
          border-radius:22px;
          border:1px solid rgba(148,163,184,.18);
          overflow:hidden;
          box-shadow:0 18px 38px rgba(15,23,42,.08);
          transition:transform .26s ease, box-shadow .26s ease, border-color .26s ease;
          position:relative;
          display:flex;
          flex-direction:column;
          padding:12px;
          min-height:312px;
        }
        .wl-card::before {
          content:"";
          position:absolute;
          inset:0;
          background:radial-gradient(circle at top left, rgba(29,91,160,.08), transparent 26%);
          opacity:0;
          transition:opacity .24s ease;
          pointer-events:none;
        }
        .wl-card:hover {
          transform:translateY(-5px);
          box-shadow:0 28px 52px rgba(15,23,42,.12);
          border-color:rgba(29,91,160,.24);
        }
        .wl-card:hover::before { opacity:1; }

        .wl-card-img {
          aspect-ratio:1 / 1;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:14px;
          cursor:pointer;
          background:linear-gradient(180deg, #f9fbff 0%, #edf4ff 100%);
          flex-shrink:0;
          border-radius:18px;
          overflow:hidden;
          margin-bottom:12px;
        }
        .wl-card-img img { width:100%; height:100%; object-fit:contain; transition:transform .34s ease; }
        .wl-card:hover .wl-card-img img { transform:scale(1.08); }

        .wl-remove-btn {
          position:absolute;
          top:18px;
          right:18px;
          width:34px;
          height:34px;
          border-radius:14px;
          background:rgba(255,255,255,.96);
          border:1px solid rgba(148,163,184,.18);
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          color:#e63946;
          font-size:14px;
          box-shadow:0 10px 22px rgba(15,23,42,.1);
          transition:.2s;
          z-index:2;
        }
        .wl-remove-btn:hover { background:#e63946; color:#fff; border-color:#e63946; }

        .wl-card-body { padding:0 2px 2px; display:flex; flex-direction:column; flex:1; }
        .wl-card-brand { font-size:10px; font-weight:800; color:#1d5ba0; text-transform:uppercase; letter-spacing:.1em; margin-bottom:5px; min-height:15px; overflow:hidden; }
        .wl-card-name { font-size:13px; font-weight:800; color:var(--dark); margin-bottom:7px; cursor:pointer; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; line-height:1.36; min-height:2.72em; flex-shrink:0; }
        .wl-card-name:hover { color:#1d5ba0; }
        .wl-card-unit { font-size:11px; color:var(--body); margin-bottom:7px; }
        .wl-card-stars { font-size:10.5px; color:var(--body); margin-bottom:8px; min-height:15px; overflow:hidden; display:flex; align-items:center; gap:4px; }
        .wl-card-stars i { color:#f59e0b; }
        .wl-card-price { display:flex; align-items:center; gap:7px; margin-bottom:10px; flex-wrap:wrap; min-height:24px; }
        .wl-card-new { font-size:15px; font-weight:800; color:#1d5ba0; font-family:'Outfit','Quicksand',sans-serif; }
        .wl-card-old { font-size:11px; color:var(--body); text-decoration:line-through; }
        .wl-card-save { font-size:10px; font-weight:700; color:#16a34a; background:#dcfce7; padding:2px 7px; border-radius:20px; }

        .wl-add-btn {
          width:100%;
          background:linear-gradient(135deg, var(--green), var(--green-dark));
          color:#fff;
          border:none;
          border-radius:14px;
          padding:10px 0;
          font-size:12px;
          font-weight:800;
          cursor:pointer;
          font-family:inherit;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:7px;
          transition:.2s;
          margin-top:auto;
          box-shadow:0 14px 28px rgba(31,92,161,.16);
        }
        .wl-add-btn:hover { background:linear-gradient(135deg, #1b4c92, #163f78); transform:translateY(-1px); }
        .wl-add-btn.added { background:#16a34a; }
        .wl-add-btn.added:hover { background:#15803d; }

        .wl-qty {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:8px;
          background:linear-gradient(135deg, var(--green), var(--green-dark));
          border-radius:14px;
          padding:4px;
          min-height:40px;
          margin-top:auto;
          box-shadow:0 14px 26px rgba(31,92,161,.15);
        }
        .wl-qty-btn {
          width:32px;
          height:32px;
          border:none;
          border-radius:10px;
          background:rgba(255,255,255,.16);
          color:#fff;
          font-size:18px;
          font-weight:800;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .wl-qty-btn:hover { background:rgba(255,255,255,.24); }
        .wl-qty-val {
          flex:1;
          text-align:center;
          color:#fff;
          font-size:13px;
          font-weight:800;
        }

        .wl-empty { text-align:center; padding:80px 20px; background:#fff; border-radius:14px; border:1px solid var(--border); margin-top:28px; }
        .wl-empty-icon { font-size:56px; color:#fca5a5; margin-bottom:18px; }
        .wl-empty h3 { font-family:'Quicksand',sans-serif; font-size:22px; font-weight:800; color:var(--dark); margin-bottom:8px; }
        .wl-empty p { color:var(--body); font-size:14px; margin-bottom:26px; }
        .wl-empty-btn { background:#1d5ba0; color:#fff; border:none; border-radius:8px; padding:13px 30px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; transition:.2s; }
        .wl-empty-btn:hover { background:#174d8a; }

        @media(max-width:640px){
          .wl-header-bar { padding:16px 18px; border-radius:16px; }
          .wl-card { border-radius:18px; padding:10px; min-height:286px; }
          .wl-card-img { border-radius:16px; padding:12px; margin-bottom:10px; }
          .wl-remove-btn { top:14px; right:14px; width:32px; height:32px; }
          .wl-card-name { font-size:12px; }
          .wl-card-new { font-size:14px; }
          .wl-add-btn { border-radius:12px; padding:9px 0; }
          .wl-qty { min-height:38px; border-radius:12px; }
          .wl-qty-btn { width:30px; height:30px; }
        }
      `}</style>

      <div className="wl-page">
        <div className="wl-crumb">
          <div className="container wl-crumb-inner">
            <span className="wl-crumb-back" onClick={onContinueShopping}>
              <i className="fas fa-arrow-left" style={{ fontSize: 10 }}></i> {t.cart.breadcrumbHome}
            </span>
            <i className="fas fa-chevron-right" style={{ fontSize: 10 }}></i>
            <span style={{ color: "var(--dark)", fontWeight: 700 }}>{t.wishlist.title}</span>
          </div>
        </div>

        <div className="container">
          {wishlist.length === 0 ? (
            <div className="wl-empty">
              <div className="wl-empty-icon"><i className="fas fa-heart-broken"></i></div>
              <h3>{t.wishlist.emptyTitle}</h3>
              <p>{t.wishlist.emptyDesc}</p>
              <button className="wl-empty-btn" onClick={onContinueShopping}>
                <i className="fas fa-store" style={{ marginRight: 8 }}></i>
                {t.home.shopNow}
              </button>
            </div>
          ) : (
            <>
              <div className="wl-header-bar">
                <h2>
                  <i className="fas fa-heart"></i> {t.wishlist.title}
                  <span className="wl-count-pill">{wishlist.length} {wishlist.length === 1 ? t.cart.itemsCount : t.cart.itemsCountPlural}</span>
                </h2>
                <button className="wl-clear-btn" onClick={() => wishlist.forEach((item) => toggleWishlist(item))}>
                  <i className="fas fa-trash-alt"></i> {t.cart.remove} All
                </button>
              </div>

              <div className="wl-grid">
                {wishlist.map((item) => {
                  const translatedName = getTranslatedName(item.name);
                  const unitLabel = item.standard || item.unit || item.quantity || "1 unit";
                  const oldVal = parseFloat(String(item.oldPrice || "").replace(/[^0-9.]/g, ""));
                  const curVal = parseFloat(String(item.price || "").replace(/[^0-9.]/g, ""));
                  const discPct = oldVal && curVal && oldVal > curVal ? Math.round(((oldVal - curVal) / oldVal) * 100) : null;

                  return (
                    <div key={item._uid} className="wl-card">
                      <button className="wl-remove-btn" onClick={() => toggleWishlist(item)} title="Remove from wishlist">
                        <i className="fas fa-times"></i>
                      </button>

                      <div className="wl-card-img" onClick={() => onOpenProduct && onOpenProduct(item)}>
                        <img src={sanitizeImageUrl(item.imageUrl)} alt={translatedName} loading="lazy" />
                      </div>

                      <div className="wl-card-body">
                        {item.brand && <div className="wl-card-brand">{item.brand}</div>}
                        <div className="wl-card-name" onClick={() => onOpenProduct && onOpenProduct(item)}>
                          {translatedName}
                        </div>
                        <div className="wl-card-unit">{unitLabel}</div>
                        {item.stars && (
                          <div className="wl-card-stars">
                            <i className="fas fa-star"></i>
                            <span>{item.stars}{item.reviews && ` (${item.reviews})`}</span>
                          </div>
                        )}
                        <div className="wl-card-price">
                          <span className="wl-card-new">{item.price}</span>
                          {item.oldPrice && <span className="wl-card-old">{item.oldPrice}</span>}
                          {discPct && <span className="wl-card-save">{discPct}% off</span>}
                        </div>
                        <button className="wl-add-btn" onClick={() => handleMoveToCart(item)}>
                          <i className="fas fa-shopping-cart"></i> {t.home.add} {t.header.cart}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
