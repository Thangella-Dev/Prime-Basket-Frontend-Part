// src/pages/OrderSuccessPage.jsx
import { useT } from "../i18n/translations";
import { formatCurrency, handleProductImageError, resolveProductImage } from "../utils/productUtils";
import { getLocalizedProductName } from "../utils/translationUtils";

export default function OrderSuccessPage({ order, onGoHome, onGoOrders, onGoTracking, language = "en", region = "in" }) {
  const t = useT(language);
  
  const getTranslatedName = (name) => getLocalizedProductName(name, t);

  const methodLabel = t.payment.methods[order?.method] || "Online";

  const eta = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const options = { weekday: "long", day: "numeric", month: "long" };
    return d.toLocaleDateString(region === "ke" ? "sw-KE" : "en-IN", options);
  };

  return (
    <>
      <style>{`
        .os-page { background:var(--bg); min-height:100vh; display:flex; align-items:center; justify-content:center; padding:40px 20px; font-family:'Nunito',sans-serif; }
        .os-card { background:#fff; border-radius:20px; border:1px solid var(--border); box-shadow:0 8px 40px rgba(0,0,0,.08); max-width:560px; width:100%; padding:48px 40px; text-align:center; }

        /* tick animation */
        @keyframes pop { 0%{transform:scale(0)} 70%{transform:scale(1.15)} 100%{transform:scale(1)} }
        .os-tick { width:80px; height:80px; background:#dcfce7; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 24px; animation:pop .5s ease forwards; }
        .os-tick i { font-size:36px; color:#16a34a; }

        .os-title { font-family:'Quicksand',sans-serif; font-size:26px; font-weight:800; color:var(--dark); margin-bottom:6px; }
        .os-sub { font-size:14px; color:var(--body); margin-bottom:28px; line-height:1.6; }

        .os-order-id { background:#f0f5ff; border-radius:10px; padding:12px 20px; display:inline-flex; align-items:center; gap:8px; margin-bottom:28px; }
        .os-order-id-label { font-size:12px; color:var(--body); font-weight:600; }
        .os-order-id-val { font-size:14px; font-weight:800; color:#1d5ba0; font-family:'Quicksand',sans-serif; letter-spacing:.5px; }

        .os-details { border:1px solid var(--border); border-radius:12px; overflow:hidden; margin-bottom:28px; text-align:left; }
        .os-detail-row { display:flex; align-items:center; justify-content:space-between; padding:13px 18px; border-bottom:1px solid var(--border); font-size:13px; }
        .os-detail-row:last-child { border-bottom:none; }
        .os-detail-key { color:var(--body); display:flex; align-items:center; gap:8px; }
        .os-detail-key i { color:#1d5ba0; width:14px; text-align:center; }
        .os-detail-val { font-weight:700; color:var(--dark); }
        .os-detail-val.green { color:#16a34a; }
        .os-detail-val.blue { color:#1d5ba0; }

        .os-items { border:1px solid var(--border); border-radius:12px; overflow:hidden; margin-bottom:28px; }
        .os-items-header { padding:11px 18px; background:#f9fafb; border-bottom:1px solid var(--border); font-size:12px; font-weight:800; color:var(--body); text-transform:uppercase; letter-spacing:.5px; }
        .os-item { display:flex; align-items:center; gap:12px; padding:11px 18px; border-bottom:1px solid var(--border); }
        .os-item:last-child { border-bottom:none; }
        .os-item-img { width:42px; height:42px; border-radius:8px; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; padding:4px; flex-shrink:0; }
        .os-item-img img { max-width:100%; max-height:100%; object-fit:contain; }
        .os-item-name { font-size:12px; font-weight:700; color:var(--dark); flex:1; line-height:1.4; }
        .os-item-qty { font-size:11px; color:var(--body); }
        .os-item-price { font-size:13px; font-weight:800; color:#1d5ba0; font-family:'Quicksand',sans-serif; }

        .os-btns { display:flex; gap:10px; flex-wrap:wrap; }
        .os-btn-primary { flex:1; background:#1d5ba0; color:#fff; border:none; border-radius:10px; padding:13px 0; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; transition:.2s; min-width:140px; }
        .os-btn-primary:hover { background:#174d8a; }
        .os-btn-secondary { flex:1; background:#fff; color:#1d5ba0; border:2px solid #1d5ba0; border-radius:10px; padding:13px 0; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; transition:.2s; min-width:140px; }
        .os-btn-secondary:hover { background:#f0f5ff; }
        .os-btn-tracking { flex:1; background:linear-gradient(135deg, #16a34a, #22c55e); color:#fff; border:none; border-radius:10px; padding:13px 0; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; transition:.2s; min-width:140px; }
        .os-btn-tracking:hover { background:linear-gradient(135deg, #15803d, #16a34a); transform:translateY(-1px); box-shadow:0 4px 16px rgba(22,163,74,0.3); }
      `}</style>

      <div className="os-page">
        <div className="os-card">
          <div className="os-tick"><i className="fas fa-check"></i></div>
          <div className="os-title">{t.order.successTitle}</div>
          <p className="os-sub">{t.order.successDesc}</p>

          <div className="os-order-id">
            <div className="os-order-id-label">{t.order.id}</div>
            <div className="os-order-id-val">#{order?.orderId}</div>
          </div>

          {/* Order details */}
          <div className="os-details">
            <div className="os-detail-row">
              <span className="os-detail-key"><i className="fas fa-money-bill-wave"></i> {t.order.amountPaid}</span>
              <span className="os-detail-val blue">{formatCurrency(order?.total, region)}</span>
            </div>
            <div className="os-detail-row">
              <span className="os-detail-key"><i className="fas fa-credit-card"></i> {t.order.paymentMethod}</span>
              <span className="os-detail-val">{methodLabel}</span>
            </div>
            <div className="os-detail-row">
              <span className="os-detail-key"><i className="fas fa-truck"></i> {t.order.estimatedDelivery}</span>
              <span className="os-detail-val green">{eta()}</span>
            </div>
            {order?.address && (
              <div className="os-detail-row">
                <span className="os-detail-key"><i className="fas fa-map-marker-alt"></i> {t.order.deliverTo}</span>
                <span className="os-detail-val" style={{ maxWidth: "55%", textAlign: "right", fontSize: 12 }}>
                  {order.address.type}: {order.address.text}
                </span>
              </div>
            )}
          </div>

          {/* Items */}
          {order?.items?.length > 0 && (
            <div className="os-items">
              <div className="os-items-header">{t.order.itemsOrdered} ({order.items.reduce((a, i) => a + i.quantity, 0)})</div>
              {order?.items?.map((item, idx) => (
                <div className="os-item" key={idx}>
                  <div className="os-item-img"><img src={resolveProductImage(item)} alt={item.name} onError={(event) => handleProductImageError(event, item)} /></div>
                  <div className="os-item-name">{getTranslatedName(item.name)}</div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                    <div className="os-item-qty" style={{ fontWeight: 700 }}>{item.selectedUnit} × {item.quantity}</div>
                    <div className="os-item-price">{formatCurrency(parseFloat(String(item.price).replace(/[^0-9.]/g, "")) * item.quantity, region)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="os-btns">
            <button className="os-btn-secondary" onClick={onGoHome}>
              <i className="fas fa-home" style={{ marginRight: 6 }}></i> {t.order.continueShopping}
            </button>
            <button className="os-btn-tracking" onClick={onGoTracking}>
              <i className="fas fa-route" style={{ marginRight: 6 }}></i> Track Order
            </button>
            <button className="os-btn-primary" onClick={onGoOrders}>
              <i className="fas fa-box" style={{ marginRight: 6 }}></i> {t.order.myOrders}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
