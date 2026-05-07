// src/pages/WishlistPage.jsx
import { useT } from "../i18n/translations";

export default function WishlistPage({ wishlist, cart, toggleWishlist, onAddCart, onDecreaseCart, onOpenProduct, onContinueShopping, language = "en" }) {
  const t = useT(language);
  
  const getTranslatedName = (name) => {
    if (!name) return "";
    if (t.products?.[name]) return t.products[name];
    const entries = Object.entries(t.products || {}).sort((a, b) => b[0].length - a[0].length);
    for (const [key, val] of entries) {
      if (name.toLowerCase().includes(key.toLowerCase())) return val;
    }
    return name;
  };

  return (
    <>
      <style>{`
        .wl-page { background: var(--bg); min-height: 100vh; padding-bottom: 60px; }
        .wl-crumb { background:#fff; border-bottom:1px solid var(--border); padding:12px 0; }
        .wl-crumb-inner { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--body); }
        .wl-crumb-back { color:#1d5ba0; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; }
        .wl-crumb-back:hover { text-decoration:underline; }

        .wl-header-bar { background:#fff; border-radius:14px; border:1px solid var(--border); padding:20px 28px; margin-top:28px; margin-bottom:24px; display:flex; align-items:center; justify-content:space-between; box-shadow:var(--shadow); }
        .wl-header-bar h2 { font-family:'Quicksand',sans-serif; font-size:20px; font-weight:800; color:var(--dark); margin:0; display:flex; align-items:center; gap:10px; }
        .wl-header-bar h2 i { color:#e63946; }
        .wl-count-pill { background:#fde8ea; color:#e63946; font-size:12px; font-weight:700; padding:3px 10px; border-radius:20px; }
        .wl-clear-btn { background:none; border:1.5px solid #e63946; color:#e63946; border-radius:8px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:6px; transition:.2s; }
        .wl-clear-btn:hover { background:#fde8ea; }

        .wl-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:18px; }
        @media(max-width:1100px){ .wl-grid { grid-template-columns:repeat(4,1fr); } }
        @media(max-width:860px){ .wl-grid { grid-template-columns:repeat(3,1fr); } }
        @media(max-width:600px){ .wl-grid { grid-template-columns:repeat(2,1fr); } }

        .wl-card { background:#fff; border-radius:12px; border:1px solid var(--border); overflow:hidden; box-shadow:var(--shadow); transition:.22s; position:relative; display:flex; flex-direction:column; }
        .wl-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.1); }

        .wl-card-img { height:160px; display:flex; align-items:center; justify-content:center; padding:14px; cursor:pointer; background:#fafbff; flex-shrink:0; }
        .wl-card-img img { max-height:130px; max-width:100%; object-fit:contain; transition:.3s; }
        .wl-card:hover .wl-card-img img { transform:scale(1.06); }

        .wl-remove-btn { position:absolute; top:10px; right:10px; width:32px; height:32px; border-radius:50%; background:#fff; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#e63946; font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,.08); transition:.2s; z-index:2; }
        .wl-remove-btn:hover { background:#e63946; color:#fff; border-color:#e63946; }

        .wl-card-body { padding:12px 14px 14px; display:flex; flex-direction:column; flex:1; }
        .wl-card-brand { font-size:11px; font-weight:700; color:#1d5ba0; text-transform:uppercase; letter-spacing:.5px; margin-bottom:3px; height:16px; overflow:hidden; }
        .wl-card-name { font-size:13px; font-weight:700; color:var(--dark); margin-bottom:6px; cursor:pointer; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; line-height:1.4; height:36px; flex-shrink:0; }
        .wl-card-name:hover { color:#1d5ba0; }
        .wl-card-stars { font-size:11px; color:var(--body); margin-bottom:8px; height:16px; overflow:hidden; }
        .wl-card-price { display:flex; align-items:baseline; gap:6px; margin-bottom:10px; flex-wrap:wrap; min-height:24px; }
        .wl-card-new { font-size:15px; font-weight:800; color:#1d5ba0; font-family:'Quicksand',sans-serif; }
        .wl-card-old { font-size:12px; color:var(--body); text-decoration:line-through; }
        .wl-card-save { font-size:10px; font-weight:700; color:#16a34a; background:#dcfce7; padding:2px 7px; border-radius:20px; }

        .wl-add-btn { width:100%; background:#1d5ba0; color:#fff; border:none; border-radius:8px; padding:9px 0; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:6px; transition:.2s; margin-top:auto; }
        .wl-add-btn:hover { background:#174d8a; }
        .wl-add-btn.added { background:#16a34a; }
        .wl-add-btn.added:hover { background:#15803d; }

        .wl-empty { text-align:center; padding:80px 20px; background:#fff; border-radius:14px; border:1px solid var(--border); margin-top:28px; }
        .wl-empty-icon { font-size:56px; color:#fca5a5; margin-bottom:18px; }
        .wl-empty h3 { font-family:'Quicksand',sans-serif; font-size:22px; font-weight:800; color:var(--dark); margin-bottom:8px; }
        .wl-empty p { color:var(--body); font-size:14px; margin-bottom:26px; }
        .wl-empty-btn { background:#1d5ba0; color:#fff; border:none; border-radius:8px; padding:13px 30px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; transition:.2s; }
        .wl-empty-btn:hover { background:#174d8a; }
      `}</style>

      <div className="wl-page">
        {/* Breadcrumb */}
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
                  const inCart = cart.find((c) => c._uid === item._uid);
                  const qty = inCart ? inCart.quantity : 0;
                  const translatedName = getTranslatedName(item.name);

                  const oldVal = parseFloat(String(item.oldPrice || "").replace(/[^0-9.]/g, ""));
                  const curVal = parseFloat(String(item.price || "").replace(/[^0-9.]/g, ""));
                  const discPct = oldVal && curVal && oldVal > curVal ? Math.round(((oldVal - curVal) / oldVal) * 100) : null;

                  return (
                    <div key={item._uid} className="wl-card">
                      <button className="wl-remove-btn" onClick={() => toggleWishlist(item)} title="Remove from wishlist">
                        <i className="fas fa-times"></i>
                      </button>

                      <div className="wl-card-img" onClick={() => onOpenProduct && onOpenProduct(item)}>
                        <img src={item.imageUrl} alt={translatedName} loading="lazy" />
                      </div>

                      <div className="wl-card-body">
                        {item.brand && <div className="wl-card-brand">{item.brand}</div>}
                        <div className="wl-card-name" onClick={() => onOpenProduct && onOpenProduct(item)}>
                          {translatedName}
                        </div>
                        {item.stars && (
                          <div className="wl-card-stars">⭐ {item.stars}{item.reviews && ` (${item.reviews})`}</div>
                        )}
                        <div className="wl-card-price">
                          <span className="wl-card-new">{item.price}</span>
                          {item.oldPrice && <span className="wl-card-old">{item.oldPrice}</span>}
                          {discPct && <span className="wl-card-save">{discPct}% off</span>}
                        </div>
                        {qty > 0 ? (
                          <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            background: "var(--green)", borderRadius: "8px", padding: "4px 8px",
                            height: "38px", color: "white", fontWeight: 700
                          }}>
                            <button onClick={() => onDecreaseCart && onDecreaseCart(item._uid)}
                              style={{ background: "transparent", border: "none", color: "white", fontSize: "20px", cursor: "pointer", width: "32px" }}>
                              -
                            </button>
                            <span style={{ fontSize: "14px" }}>{qty}</span>
                            <button onClick={() => onAddCart && onAddCart(item)}
                              style={{ background: "transparent", border: "none", color: "white", fontSize: "20px", cursor: "pointer", width: "32px" }}>
                              +
                            </button>
                          </div>
                        ) : (
                          <button className="wl-add-btn" onClick={() => onAddCart && onAddCart(item)}>
                            <i className="fas fa-shopping-cart"></i> {t.home.add} {t.header.cart}
                          </button>
                        )}
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