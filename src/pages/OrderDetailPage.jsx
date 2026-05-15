import { useT } from "../i18n/translations";
import { formatPhoneForDisplay } from "../utils/phoneValidation";
import { formatCurrency } from "../utils/productUtils";
import { getLocalizedProductName } from "../utils/translationUtils";

export default function OrderDetailPage({ order, onGoBack, onGoRate, onOrderAgain, language = "en", region = "in", user }) {
  const t = useT(language);
  const currSym = region === "ke" ? "KES " : "\u20b9";

  const getTranslatedName = (name) => getLocalizedProductName(name, t);

  const methodLabel = { 
    upi: "UPI", 
    card: t.payment.methods.card, 
    netbanking: t.payment.methods.netbanking, 
    wallet: t.payment.methods.wallet, 
    cod: t.payment.methods.cod 
  };
  const deliveryMin = Math.floor(Math.random() * 15) + 5;

  // Get bill values from order object or fallback for older orders
  const itemTotal = order?.subtotal || (order?.items || []).reduce((sum, item) => {
    const price = parseFloat(String(item.price || "").replace(/[^0-9.]/g, "")) || 0;
    return sum + price * (item.quantity || 1);
  }, 0);
  
  const deliveryFee = order?.delivery ?? (itemTotal > 99 ? 0 : 49);
  const handlingCharge = order?.handlingFee ?? (itemTotal > 0 ? 5 : 0);
  const vatAmount = order?.vat || 0;
  const orderSaving = order?.saving || 0;
  const promoDisc = order?.promoDiscount || 0;
  
  // For legacy/calculated total:
  const finalTotal = Number(order?.total) || (itemTotal + deliveryFee + handlingCharge + vatAmount - promoDisc);

  return (
    <>
      <style>{`
        .od-page { background:var(--bg); min-height:100vh; padding:0 0 60px; font-family:'Nunito',sans-serif; }
        .od-crumb { background:linear-gradient(180deg, rgba(255,255,255,0.97), rgba(246,250,255,0.96)); border-bottom:1px solid rgba(203,213,225,0.78); padding:13px 0; backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); }
        .od-crumb-inner { display:flex; align-items:center; gap:10px; font-size:13px; color:var(--body); }
        .od-crumb-back { color:#1d5ba0; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:7px; padding:8px 13px; border-radius:999px; border:1px solid rgba(191,219,254,0.98); background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(237,244,255,0.98)); box-shadow:0 10px 20px rgba(29,91,160,0.08); transition:transform .22s ease, box-shadow .22s ease, color .22s ease; }
        .od-crumb-back:hover { transform:translateY(-1px); box-shadow:0 16px 28px rgba(29,91,160,0.14); }

        .od-container { max-width:800px; margin:0 auto; padding:28px 20px; }

        /* Status header */
        .od-status-card {
          background: linear-gradient(135deg, #16a34a, #22c55e);
          border-radius: 18px;
          padding: 28px 32px;
          color: #fff;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          overflow: hidden;
        }
        .od-status-card::before {
          content:""; position:absolute; top:-40%; right:-20%;
          width:250px; height:250px; background:rgba(255,255,255,.08);
          border-radius:50%;
        }
        .od-status-icon {
          width:64px; height:64px; border-radius:50%;
          background:rgba(255,255,255,.2); display:flex;
          align-items:center; justify-content:center; font-size:28px;
          flex-shrink:0; backdrop-filter:blur(10px);
        }
        .od-status-title { font-size:22px; font-weight:800; font-family:'Quicksand',sans-serif; margin-bottom:4px; }
        .od-status-sub { font-size:13px; opacity:.85; }

        /* Cards */
        .od-card {
          background:#fff; border-radius:16px;
          border:1px solid var(--border);
          box-shadow:0 4px 24px rgba(0,0,0,.05);
          margin-bottom:20px; overflow:hidden;
        }
        .od-card-header {
          padding:18px 24px; border-bottom:1px solid var(--border);
          display:flex; align-items:center; gap:10px;
        }
        .od-card-header h3 {
          font-family:'Quicksand',sans-serif; font-size:16px;
          font-weight:800; color:#253d4e; margin:0;
        }
        .od-card-header i { color:#1d5ba0; font-size:16px; }
        .od-card-body { padding:20px 24px; }

        /* Items */
        .od-item {
          display:flex; align-items:center; gap:14px;
          padding:14px 0; border-bottom:1px solid #f5f5f5;
        }
        .od-item:last-child { border-bottom:none; }
        .od-item-img {
          width:56px; height:56px; border-radius:10px;
          border:1px solid var(--border); padding:4px;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; background:#fafafa;
        }
        .od-item-img img { max-width:100%; max-height:100%; object-fit:contain; }
        .od-item-info { flex:1; min-width:0; }
        .od-item-name { font-size:14px; font-weight:700; color:#253d4e; margin-bottom:2px; }
        .od-item-meta { font-size:12px; color:#7e7e7e; }
        .od-item-prices { text-align:right; flex-shrink:0; }
        .od-item-price { font-size:15px; font-weight:800; color:#1d5ba0; font-family:'Quicksand',sans-serif; }
        .od-item-oldprice { font-size:12px; color:#94a3b8; text-decoration:line-through; }

        /* Bill rows */
        .od-bill-row {
          display:flex; justify-content:space-between; align-items:center;
          padding:10px 0; font-size:14px; color:#64748b;
          border-bottom:1px solid #f5f5f5;
        }
        .od-bill-row:last-child { border-bottom:none; }
        .od-bill-row .val { font-weight:700; color:#253d4e; }
        .od-bill-row.total { 
          font-size:16px; font-weight:800; color:#253d4e;
          padding:14px 0 6px; margin-top:4px;
          border-top:2px solid #1d5ba0; border-bottom:none;
        }
        .od-bill-row.total .val { color:#1d5ba0; font-size:18px; }
        .od-bill-free { color:#16a34a; font-weight:700; }
        .od-bill-discount { color:#16a34a; font-weight:700; }

        /* Savings banner */
        .od-savings {
          background:linear-gradient(90deg, #dcfce7, #f0fdf4);
          border:1px solid #86efac; border-radius:10px;
          padding:12px 18px; margin-bottom:20px;
          display:flex; align-items:center; gap:10px;
          font-size:14px; font-weight:700; color:#16a34a;
        }
        .od-savings i { font-size:18px; }

        /* Details section */
        .od-detail-row {
          display:flex; align-items:flex-start; gap:12px;
          padding:12px 0; border-bottom:1px solid #f5f5f5;
          font-size:14px;
        }
        .od-detail-row:last-child { border-bottom:none; }
        .od-detail-icon {
          width:36px; height:36px; border-radius:8px;
          background:#f0f5ff; display:flex; align-items:center;
          justify-content:center; color:#1d5ba0; font-size:14px;
          flex-shrink:0;
        }
        .od-detail-label { font-size:12px; color:#94a3b8; font-weight:600; margin-bottom:2px; }
        .od-detail-value { font-weight:700; color:#253d4e; }

        /* Buttons */
        .od-btns {
          display:flex; gap:12px; margin-top:8px;
        }
        .od-btn {
          flex:1; border:none; border-radius:12px;
          padding:14px 0; font-size:14px; font-weight:700;
          cursor:pointer; font-family:inherit; transition:.2s;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .od-btn:hover { transform:translateY(-1px); }
        .od-btn-rate {
          background:linear-gradient(135deg, #f59e0b, #fbbf24);
          color:#fff; box-shadow:0 4px 16px rgba(245,158,11,.25);
        }
        .od-btn-rate:hover { box-shadow:0 6px 20px rgba(245,158,11,.35); }
        .od-btn-again {
          background:linear-gradient(135deg, #1d5ba0, #2980b9);
          color:#fff; box-shadow:0 4px 16px rgba(29,91,160,.25);
        }
        .od-btn-again:hover { box-shadow:0 6px 20px rgba(29,91,160,.35); }

        /* Order ID badge */
        .od-order-badge {
          display:inline-flex; align-items:center; gap:8px;
          background:#f0f5ff; padding:8px 16px; border-radius:8px;
          font-size:13px; font-weight:700; color:#1d5ba0;
          margin-bottom:20px;
        }
      `}</style>

      <div className="od-page">
        <div className="od-crumb">
          <div className="container od-crumb-inner">
            <span className="od-crumb-back" onClick={onGoBack}>
              <i className="fas fa-arrow-left" style={{ fontSize: 10 }}></i> {t.account.orders}
            </span>
            <i className="fas fa-chevron-right" style={{ fontSize: 10 }}></i>
            <span style={{ color: "var(--dark)", fontWeight: 700 }}>{t.order.orderDetails}</span>
          </div>
        </div>

        <div className="od-container">

          {/* Status Header */}
          <div className="od-status-card">
            <div className="od-status-icon">
              {order?.status === "Delivered" ? "✅" : order?.status === "Processing" ? "📦" : "🔔"}
            </div>
            <div>
              <div className="od-status-title">
                {order?.status === "Delivered" ? t.order.delivered : order?.status === "Processing" ? t.order.processing : order?.status || t.order.confirmed}
              </div>
              <div className="od-status-sub">
                {order?.status === "Delivered"
                  ? `${order?.date || t.order.today}`
                  : `${order?.date || t.order.today}`
                }
              </div>
            </div>
          </div>

          {/* Order ID */}
          <div className="od-order-badge">
            <i className="fas fa-receipt"></i>
            {t.order.id} #{order?.orderId}
          </div>

          {/* Savings Banner */}
          {orderSaving > 0 && (
            <div className="od-savings">
              <i className="fas fa-piggy-bank"></i>
              {t.order.youSaved.replace("{amount}", currSym + orderSaving.toFixed(2))}
            </div>
          )}

          {/* Items Ordered */}
          <div className="od-card">
            <div className="od-card-header">
              <i className="fas fa-shopping-bag"></i>
              <h3>{t.order.itemsOrdered} ({(order?.items || []).reduce((a, i) => a + (i.quantity || 1), 0)})</h3>
            </div>
            <div className="od-card-body" style={{ padding: "10px 24px" }}>
              {(order?.items || []).length > 0 ? (
                order.items.map((item, idx) => {
                  const price = parseFloat(String(item.price || "").replace(/[^0-9.]/g, "")) || 0;
                  return (
                    <div key={idx} className="od-item">
                      <div className="od-item-img"><img src={item.imageUrl} alt={item.name} /></div>
                      <div style={{ flex: 1 }}>
                        <div className="od-item-name">{getTranslatedName(item.name)}</div>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>{item.selectedUnit} × {item.quantity}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="od-item-price">{formatCurrency(price * (item.quantity || 1), region)}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{formatCurrency(price, region)} / {item.selectedUnit}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
                  {t.home.noProducts}
                </p>
              )}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="od-card">
            <div className="od-card-header">
              <i className="fas fa-file-invoice"></i>
              <h3>{t.order.billSummary}</h3>
            </div>
            <div className="od-card-body">
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ color: "#64748b" }}>{t.order.itemTotal}</span>
                <span style={{ fontWeight: 700, color: "#253d4e" }}>{formatCurrency(itemTotal, region)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ color: "#64748b" }}>{t.order.deliveryFee}</span>
                <span style={{ fontWeight: 700, color: deliveryFee === 0 ? "#16a34a" : "#253d4e" }}>{deliveryFee === 0 ? t.cart.free : formatCurrency(deliveryFee, region)}</span>
              </div>
              {handlingCharge > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                  <span style={{ color: "#64748b" }}>{t.order.handlingFee}</span>
                  <span style={{ fontWeight: 700, color: "#253d4e" }}>{formatCurrency(handlingCharge, region)}</span>
                </div>
              )}
              {vatAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                  <span style={{ color: "#64748b" }}>{t.order.taxes} (VAT 16%)</span>
                  <span style={{ fontWeight: 700, color: "#253d4e" }}>{formatCurrency(vatAmount, region)}</span>
                </div>
              )}
              {promoDisc > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", color: "#16a34a", fontWeight: 700 }}>
                  <span>{t.order.promoApplied}</span>
                  <span>-{formatCurrency(promoDisc, region)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", marginTop: 8, borderTop: "1.5px solid #e2e8f0" }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#253d4e" }}>{t.order.totalBill}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#1d5ba0" }}>{formatCurrency(finalTotal, region)}</span>
              </div>
              {orderSaving > 0 && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: "#f0fdf4", borderRadius: 10, color: "#16a34a", fontSize: 13, fontWeight: 700, textAlign: "center" }}>
                  {t.order.youSaved} {formatCurrency(orderSaving, region)} {t.order.onThisOrder}
                </div>
              )}
            </div>
          </div>

          {/* Other Details */}
          <div className="od-card">
            <div className="od-card-header">
              <i className="fas fa-info-circle"></i>
              <h3>{t.order.otherDetails}</h3>
            </div>
            <div className="od-card-body" style={{ padding: "12px 24px" }}>
              <div className="od-detail-row">
                <div className="od-detail-icon"><i className="fas fa-credit-card"></i></div>
                <div>
                  <div className="od-detail-label">{t.order.paymentMethod}</div>
                  <div className="od-detail-value">{methodLabel[order?.method] || order?.method || "Online"}</div>
                </div>
              </div>
              {order?.address && (
                <>
                  <div className="od-detail-row">
                    <div className="od-detail-icon"><i className="fas fa-user"></i></div>
                    <div>
                      <div className="od-detail-label">{t.order.receiver}</div>
                      <div className="od-detail-value">
                        {order.address.details?.receiverName || user?.name || "Customer"}
                        {(order.address.details?.receiverPhone || user?.phone) && (
                          <span style={{ color: "#64748b", fontWeight: 400, marginLeft: 8 }}>
                            {formatPhoneForDisplay(region, order.address.details?.receiverPhone || user?.phone)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="od-detail-row">
                    <div className="od-detail-icon"><i className="fas fa-map-marker-alt"></i></div>
                    <div>
                      <div className="od-detail-label">{t.cart.deliveryAddress}</div>
                      <div className="od-detail-value">{order.address.type}: {order.address.text}</div>
                    </div>
                  </div>
                </>
              )}
              <div className="od-detail-row">
                <div className="od-detail-icon"><i className="fas fa-calendar-alt"></i></div>
                <div>
                  <div className="od-detail-label">{t.order.orderDate}</div>
                  <div className="od-detail-value">{order?.date || t.order.today}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="od-btns">
            <button className="od-btn od-btn-rate" onClick={() => onGoRate && onGoRate(order)}>
              <i className="fas fa-star"></i> {language === "ke" ? "Kadiria Agizo" : "Rate Order"}
            </button>
            <button className="od-btn od-btn-again" onClick={() => onOrderAgain && onOrderAgain(order)}>
              <i className="fas fa-redo"></i> {language === "ke" ? "Agiza Tena" : "Order Again"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
