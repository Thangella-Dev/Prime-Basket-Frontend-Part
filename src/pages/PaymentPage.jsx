// src/pages/PaymentPage.jsx
import { useMemo, useState } from "react";
import { useT } from "../i18n/translations";
import { useTracking } from "../context/TrackingContext";
import { formatCurrency, parsePrice } from "../utils/productUtils";

import { PAYMENT_CONFIG } from "../config/paymentConfig";
import PaymentMethods from "../components/payment/PaymentMethods";
import { getLocalizedProductName } from "../utils/translationUtils";

export default function PaymentPage({ cart, total, delivery, vat = 0, handlingFee = 0, subtotal = 0, saving = 0, promoDiscount = 0, promoCode = "", address, onBack, onSuccess, language = "en", region = "in" }) {
  const t = useT(language);
  const { walletBalance, useWalletMoney } = useTracking();
  
  const config = PAYMENT_CONFIG[region] || PAYMENT_CONFIG["in"];
  const currSym = config.currencySymbol;

  const [method, setMethod] = useState(config.methods.find(m => m.defaultActive)?.id || config.methods[0].id);
  const [upiApp, setUpiApp] = useState(config.upiApps?.[0]?.id || "");
  const [upiId, setUpiId] = useState("");
  const [useUpiId, setUseUpiId] = useState(false);
  const [bank, setBank] = useState(config.banks?.[0] || "");
  const [wallet, setWallet] = useState(config.wallets?.[0]?.id || "");
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [usePBWallet, setUsePBWallet] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState({});

  const itemCount = cart.reduce((a, i) => a + i.quantity, 0);
  const selectedMethodMeta = useMemo(
    () => config.methods.find((m) => m.id === method) || config.methods[0],
    [config.methods, method]
  );
  const selectedMethodLabel = selectedMethodMeta?.overrideLabel || t.payment.methods?.[selectedMethodMeta?.id] || selectedMethodMeta?.id || "";
  const selectedMethodDesc = selectedMethodMeta?.overrideDesc || t.payment?.[`${selectedMethodMeta?.id}Desc`] || "";

  const getTranslatedName = (name) => getLocalizedProductName(name, t);

  const formatCard = (v) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExp = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  const validate = () => {
    const e = {};
    const isWalletFullyCovering = usePBWallet && walletBalance >= total;
    if (isWalletFullyCovering) return true;

    if (method === "upi") {
      if (useUpiId && !/^[\w.\-]+@[\w]+$/.test(upiId.trim())) e.upiId = "Enter a valid UPI ID";
    }
    if (method === "mpesa") {
      if (!/^(?:254|\+254|0)?([71]\d{8})$/.test(upiId.replace(/\D/g, ""))) e.mpesaPhone = "Enter a valid M-Pesa phone number";
    }
    if (method === "card") {
      if (cardNum.replace(/\s/g, "").length < 15) e.cardNum = "Enter a valid card number";
      if (!cardName.trim()) e.cardName = "Enter cardholder name";
      if (cardExp.length <= 4) e.cardExp = "Enter valid expiry MM/YY";
      if (cardCvv.length < 3) e.cardCvv = "Enter valid CVV";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isWalletFullyCovering = usePBWallet && walletBalance >= total;
  const activeMethod = isWalletFullyCovering ? "wallet_full" : method;
  const codFee = activeMethod === "cod" ? 20 : 0;

  const orderTotal = total + codFee;
  const walletDeduction = usePBWallet ? Math.min(walletBalance, orderTotal) : 0;
  const finalPayable = orderTotal - walletDeduction;

  const handlePay = () => {
    if (!validate()) return;
    setPlacing(true);

    if (activeMethod === "card" && saveCard) {
      const savedCards = JSON.parse(localStorage.getItem("pb_saved_cards") || "[]");
      savedCards.push({
        num: cardNum.slice(-4),
        name: cardName,
        exp: cardExp
      });
      localStorage.setItem("pb_saved_cards", JSON.stringify(savedCards));
    }

    if (usePBWallet && walletDeduction > 0) {
      useWalletMoney(walletDeduction, "Order Payment");
    }

    setTimeout(() => {
      setPlacing(false);
      onSuccess && onSuccess({
        orderId: "PB" + Date.now().toString().slice(-8),
        method: usePBWallet && finalPayable === 0 ? "Wallet" : method,
        total: finalPayable,
        walletDeduction,
        address,
        items: cart,
        // Save full breakdown for OrderDetailPage
        subtotal,
        delivery,
        vat,
        handlingFee,
        saving,
        promoDiscount,
        promoCode,
      });
    }, 1800);
  };

  return (
    <>
      <style>{`
        @keyframes paySweep {
          0% { transform: translateX(-135%); }
          100% { transform: translateX(135%); }
        }
        @keyframes payFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .container { width: 96%; max-width: 1400px; margin: 0 auto; }
        .pay-page {
          background:
            radial-gradient(circle at top left, rgba(15,91,215,0.08), transparent 24%),
            radial-gradient(circle at top right, rgba(255,204,115,0.12), transparent 24%),
            linear-gradient(180deg, #f7fbff 0%, #edf4fb 100%);
          min-height:100vh;
          display: flex;
          flex-direction: column;
          font-family:'Nunito',sans-serif;
          color: var(--dark);
        }
        .pay-crumb { background:#fff; border-bottom:1px solid var(--border); padding:11px 0; }
        .pay-crumb-inner { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--body); }
        .pay-crumb-back { display:flex; align-items:center; gap:5px; color:#1d5ba0; font-weight:700; cursor:pointer; }
        .pay-crumb-back:hover { text-decoration:underline; }

        .pay-steps { background:#fff; border-bottom:1px solid var(--border); padding:12px 0; }
        .pay-steps-inner { display:flex; align-items:center; gap:0; justify-content:center; }
        .pay-step { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:700; color:var(--body); }
        .pay-step.done { color:#16a34a; }
        .pay-step.active { color:#1d5ba0; }
        .pay-step-num { width:26px; height:26px; border-radius:50%; border:2px solid currentColor; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; background:#fff; }
        .pay-step.done .pay-step-num { background:#16a34a; color:#fff; border-color:#16a34a; }
        .pay-step.active .pay-step-num { background:#1d5ba0; color:#fff; border-color:#1d5ba0; }
        .pay-step-line { width:60px; height:2px; background:var(--border); margin:0 6px; }
        .pay-step-line.done { background:#16a34a; }

        .pay-wrap { display:grid; grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.9fr); gap:24px; flex: 1; overflow: visible; align-items:start; padding-bottom: 24px; }
        @media(max-width:900px){ 
          .pay-page { min-height: auto; display: block; }
          .pay-wrap { grid-template-columns:1fr; height: auto; overflow: visible; display: block; } 
        }

        .pay-left { background:#fff; border-radius:28px; border:1px solid var(--border); overflow:hidden; min-height: 100%; box-shadow:0 22px 44px rgba(15,23,42,0.08); transition: transform .24s ease, box-shadow .24s ease, border-color .24s ease; }
        .pay-left:hover { transform: translateY(-4px); box-shadow:0 28px 54px rgba(15,23,42,0.12); border-color: rgba(15,91,215,0.18); }
        .pay-left-header { padding:22px 24px 18px; border-bottom:1px solid var(--border); display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; background:linear-gradient(180deg, rgba(248,251,255,0.96), rgba(255,255,255,0.98)); }
        .pay-left-header h2 { font-family:'Quicksand',sans-serif; font-size:1.08rem; font-weight:800; color:var(--dark); margin:0; display:flex; align-items:center; gap:8px; }
        .pay-left-sub { margin:8px 0 0; font-size:0.84rem; line-height:1.6; color:var(--body); max-width:720px; }
        .pay-left-badges { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .pay-left-badge { display:inline-flex; align-items:center; gap:7px; padding:8px 12px; border-radius:999px; background:linear-gradient(180deg, rgba(255,255,255,0.92), rgba(241,246,255,0.98)); border:1px solid rgba(29,91,160,0.12); color:#1d5ba0; font-size:0.75rem; font-weight:800; box-shadow:0 12px 22px rgba(15,23,42,0.05); }

        .pay-wallet-section { padding: 18px 24px; background: linear-gradient(180deg, #f7fbff 0%, #f8fafc 100%); border-bottom: 1px solid var(--border); }
        .pay-wallet-card { background: linear-gradient(135deg, #1d5ba0, #3b82f6); border-radius: 20px; padding: 16px 20px; color: #fff; display: flex; justify-content: space-between; align-items: center; gap: 14px; box-shadow: 0 18px 32px rgba(29, 91, 160, 0.2); }
        .pay-wallet-check { display: flex; align-items: center; gap: 12px; cursor: pointer; user-select: none; }
        .pay-wallet-check input { width: 18px; height: 18px; accent-color: #fff; cursor: pointer; }
        .pay-wallet-balance { font-size: 20px; font-weight: 800; margin-top: 2px; }
        .pay-wallet-note { font-size:12px; color:#dbeafe; margin-top:4px; }

        .pay-method-row { display:flex; align-items:stretch; border-bottom:1px solid var(--border); cursor:pointer; transition:.18s ease; padding:16px 24px; gap:14px; position:relative; }
        .pay-method-row:hover { background:#fafbff; transform: translateX(2px); }
        .pay-method-row.active { background:linear-gradient(90deg, rgba(29,91,160,0.08), rgba(240,245,255,0.92)); border-left:3px solid #1d5ba0; padding-left:21px; }
        .pay-method-radio { width:18px; height:18px; accent-color:#1d5ba0; flex-shrink:0; margin-top:2px; cursor:pointer; }
        .pay-method-info { flex:1; }
        .pay-method-label { font-size:14px; font-weight:700; color:var(--dark); display:flex; align-items:center; gap:8px; }
        .pay-method-label i { color:#1d5ba0; width:18px; text-align:center; }
        .pay-method-sub { font-size:12px; color:var(--body); margin-top:2px; }
        .pay-method-status { margin-left:auto; font-size:11px; font-weight:800; color:#1d5ba0; background:rgba(29,91,160,0.08); border:1px solid rgba(29,91,160,0.14); padding:5px 8px; border-radius:999px; white-space:nowrap; align-self:flex-start; }

        .pay-panel { padding:20px 24px 24px; border-bottom:1px solid var(--border); background:linear-gradient(180deg, rgba(250,252,255,0.98), rgba(255,255,255,0.98)); }

        .pay-upi-apps { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px; }
        .pay-upi-app { display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer; padding:10px 14px; border-radius:14px; border:2px solid var(--border); background:#fff; transition:.2s; min-width:80px; box-shadow: 0 12px 20px rgba(15,23,42,0.05); }
        .pay-upi-app:hover { border-color:#1d5ba0; transform: translateY(-2px); box-shadow: 0 18px 28px rgba(15,23,42,0.08); }
        .pay-upi-app.active { border-color:#1d5ba0; background:#f0f5ff; }
        .pay-upi-app-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px; color:#fff; overflow:hidden; }
        .pay-upi-app-icon img { width:100%; height:100%; object-fit:contain; background:#fff; padding:2px; }
        .pay-upi-app-name { font-size:11px; font-weight:700; color:var(--dark); }
        .pay-upi-divider { display:flex; align-items:center; gap:10px; margin:14px 0; color:var(--body); font-size:12px; }
        .pay-upi-divider::before, .pay-upi-divider::after { content:''; flex:1; height:1px; background:var(--border); }
        .pay-upi-id-row { display:flex; gap:8px; }
        .pay-input { flex:1; padding:10px 14px; border:1.5px solid var(--border); border-radius:8px; font-family:inherit; font-size:13px; outline:none; transition:.2s; }
        .pay-input:focus { border-color:#1d5ba0; box-shadow:0 0 0 3px rgba(29,91,160,.08); }
        .pay-input.err { border-color:#e63946; }
        .pay-input-err { font-size:11px; color:#e63946; margin-top:4px; }
        .pay-verify-btn { background:#f0f5ff; color:#1d5ba0; border:1.5px solid #1d5ba0; border-radius:12px; padding:10px 16px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:.2s; white-space:nowrap; position: relative; overflow: hidden; }
        .pay-verify-btn:hover { background:#1d5ba0; color:#fff; transform: translateY(-1px); }
        .pay-verify-btn::after,
        .pay-now-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.4) 48%, transparent 100%);
          transform: translateX(-140%);
          pointer-events: none;
        }
        .pay-verify-btn:hover::after,
        .pay-now-btn:hover::after {
          animation: paySweep .8s ease;
        }

        .pay-card-form { display:flex; flex-direction:column; gap:14px; }
        .pay-card-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .pay-label { font-size:12px; font-weight:700; color:var(--body); margin-bottom:5px; display:block; }
        .pay-card-icons { display:flex; gap:6px; margin-bottom:14px; }
        .pay-card-icon { width:44px; height:28px; border-radius:5px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; color:#fff; }
        .pay-save-row { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--dark); cursor:pointer; margin-top:4px; }
        .pay-save-row input { accent-color:#1d5ba0; width:15px; height:15px; cursor:pointer; }

        .pay-bank-select { width:100%; padding:11px 14px; border:1.5px solid var(--border); border-radius:8px; font-family:inherit; font-size:13px; outline:none; background:#fff; transition:.2s; }
        .pay-bank-select:focus { border-color:#1d5ba0; }
        .pay-bank-note { font-size:12px; color:var(--body); margin-top:10px; line-height:1.6; }

        .pay-wallets { display:flex; gap:10px; flex-wrap:wrap; }
        .pay-wallet-btn { display:flex; flex-direction:column; align-items:center; gap:5px; padding:10px 14px; border-radius:14px; border:2px solid var(--border); background:#fff; cursor:pointer; transition:.2s; min-width:80px; box-shadow: 0 12px 20px rgba(15,23,42,0.05); }
        .pay-wallet-btn:hover { border-color:#1d5ba0; transform: translateY(-2px); box-shadow: 0 18px 28px rgba(15,23,42,0.08); }
        .pay-wallet-btn.active { border-color:#1d5ba0; background:#f0f5ff; }
        .pay-wallet-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:800; color:#fff; overflow:hidden; }
        .pay-wallet-icon img { width:100%; height:100%; object-fit:contain; background:#fff; padding:2px; }
        .pay-wallet-name { font-size:11px; font-weight:700; color:var(--dark); }

        .pay-cod-box { background:#f9fafb; border-radius:10px; padding:16px 18px; border:1px solid var(--border); }
        .pay-cod-title { font-size:14px; font-weight:700; color:var(--dark); margin-bottom:6px; }
        .pay-cod-note { font-size:13px; color:var(--body); line-height:1.6; }
        .pay-cod-fee { display:inline-block; background:#fff8e1; color:#b45309; font-size:12px; font-weight:700; padding:3px 10px; border-radius:20px; margin-top:8px; }

        .pay-summary { background:#fff; border-radius:28px; border:1px solid var(--border); box-shadow:0 22px 44px rgba(15,23,42,0.08); overflow:hidden; height: fit-content; position:sticky; top:152px; transition: transform .24s ease, box-shadow .24s ease, border-color .24s ease; }
        .pay-summary:hover { transform: translateY(-4px); box-shadow:0 28px 54px rgba(15,23,42,0.12); border-color: rgba(15,91,215,0.18); }
        .pay-summary-title { padding:20px 22px 10px; border-bottom:1px solid var(--border); font-family:'Quicksand',sans-serif; font-size:16px; font-weight:800; color:var(--dark); }
        .pay-summary-sub { margin:8px 0 0; font-size:0.8rem; line-height:1.55; color:var(--body); font-family:'Nunito',sans-serif; font-weight:700; }
        .pay-summary-hero { padding: 16px 22px 0; display:grid; gap:12px; }
        .pay-summary-amount { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; padding:16px 18px; border-radius:22px; background:linear-gradient(135deg, #0f5bd7 0%, #2d75c3 100%); color:#fff; box-shadow:0 18px 34px rgba(29,91,160,0.24); }
        .pay-summary-amount small { display:block; font-size:0.76rem; font-weight:800; opacity:0.85; text-transform:uppercase; letter-spacing:0.08em; }
        .pay-summary-amount strong { display:block; font-size:1.55rem; line-height:1; font-family:'Quicksand',sans-serif; font-weight:800; margin-top:6px; }
        .pay-summary-amount span { font-size:0.8rem; font-weight:700; opacity:0.9; text-align:right; max-width:140px; }
        .pay-summary-pills { display:flex; flex-wrap:wrap; gap:10px; }
        .pay-summary-pill { display:inline-flex; align-items:center; gap:8px; padding:9px 12px; border-radius:14px; background:linear-gradient(180deg, rgba(248,251,255,0.98), rgba(240,246,255,0.98)); border:1px solid rgba(29,91,160,0.12); color:var(--dark); font-size:0.78rem; font-weight:800; min-width:0; }
        .pay-summary-pill i { color:#1d5ba0; }
        .pay-summary-items { max-height:260px; overflow-y:auto; padding:14px 22px 6px; display:grid; gap:12px; }
        .pay-summary-item { display:grid; grid-template-columns:52px minmax(0,1fr) auto; align-items:center; gap:12px; padding:12px 0; border-bottom:1px dashed #e2e8f0; }
        .pay-summary-img { width:44px; height:44px; border-radius:8px; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; padding:4px; flex-shrink:0; }
        .pay-summary-img img { max-width:100%; max-height:100%; object-fit:contain; }
        .pay-summary-copy { min-width:0; display:grid; gap:4px; }
        .pay-summary-name { font-size:12px; font-weight:700; color:var(--dark); line-height:1.4; overflow-wrap:anywhere; }
        .pay-summary-meta { display:flex; flex-wrap:wrap; gap:8px; }
        .pay-summary-qty { font-size:11px; color:var(--body); font-weight:700; background:#f8fafc; border:1px solid #e2e8f0; padding:3px 8px; border-radius:999px; }
        .pay-summary-price { font-size:13px; font-weight:800; color:#1d5ba0; font-family:'Quicksand',sans-serif; flex-shrink:0; }
        .pay-summary-breakdown { margin: 8px 22px 0; padding:14px 16px; border-radius:20px; background:linear-gradient(180deg, rgba(248,251,255,0.98), rgba(255,255,255,0.98)); border:1px solid rgba(226,232,240,0.92); }
        .pay-summary-rows { padding:0; border-top:none; }
        .pay-summary-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; font-size:13px; border-bottom:1px solid var(--bg); }
        .pay-summary-row:last-child { border-bottom:none; }
        .pay-summary-row.total { font-size:16px; font-weight:800; color:var(--dark); font-family:'Quicksand',sans-serif; padding-top:12px; }
        .pay-free-tag { background:#dcfce7; color:#16a34a; font-size:11px; font-weight:700; padding:2px 8px; border-radius:20px; }
        .pay-addr-box { margin:16px 22px 14px; background:#f0f5ff; border-radius:18px; padding:14px 14px; font-size:12px; color:var(--dark); display:flex; gap:10px; align-items:flex-start; border:1px solid rgba(29,91,160,0.1); }
        .pay-addr-box i { color:#1d5ba0; margin-top:2px; flex-shrink:0; animation: payFloat 3s ease-in-out infinite; }
        .pay-summary-footer { padding:0 22px 18px; display:grid; gap:12px; }
        .pay-now-btn { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; margin:0; background:linear-gradient(135deg, #1d5ba0 0%, #2d75c3 100%); color:#fff; border:none; border-radius:18px; padding:15px 0; font-size:15px; font-weight:800; cursor:pointer; font-family:inherit; transition:.2s; position: relative; overflow: hidden; box-shadow: 0 20px 34px rgba(29,91,160,0.24); }
        .pay-now-btn:hover:not(:disabled) { background:linear-gradient(135deg, #174d8a 0%, #2667ab 100%); transform: translateY(-2px); box-shadow: 0 24px 40px rgba(29,91,160,0.28); }
        .pay-now-btn:disabled { opacity:.65; cursor:not-allowed; }
        .pay-now-btn.loading { background:#174d8a; }
        .pay-safe { display:flex; align-items:center; justify-content:center; gap:6px; font-size:11px; color:var(--body); }

        body[data-theme="dark"] .pay-page {
          background:
            radial-gradient(circle at top left, rgba(15,91,215,0.18), transparent 28%),
            radial-gradient(circle at top right, rgba(56,189,248,0.12), transparent 26%),
            linear-gradient(180deg, #07101d 0%, #0b1729 100%);
        }
        body[data-theme="dark"] .pay-crumb,
        body[data-theme="dark"] .pay-steps,
        body[data-theme="dark"] .pay-left,
        body[data-theme="dark"] .pay-summary,
        body[data-theme="dark"] .pay-wallet-section,
        body[data-theme="dark"] .pay-method-row,
        body[data-theme="dark"] .pay-panel,
        body[data-theme="dark"] .pay-cod-box,
        body[data-theme="dark"] .pay-addr-box {
          background: linear-gradient(180deg, rgba(15,23,42,0.96), rgba(19,34,56,0.96));
          border-color: rgba(71,85,105,0.6);
        }
        body[data-theme="dark"] .pay-left-header,
        body[data-theme="dark"] .pay-wallet-section,
        body[data-theme="dark"] .pay-panel,
        body[data-theme="dark"] .pay-summary-breakdown,
        body[data-theme="dark"] .pay-summary-pill,
        body[data-theme="dark"] .pay-upi-app,
        body[data-theme="dark"] .pay-wallet-btn,
        body[data-theme="dark"] .pay-cod-box,
        body[data-theme="dark"] .pay-addr-box {
          background: linear-gradient(180deg, rgba(15,23,42,0.96), rgba(19,34,56,0.96));
          border-color: rgba(71,85,105,0.6);
        }
        body[data-theme="dark"] .pay-left-header h2,
        body[data-theme="dark"] .pay-summary-title,
        body[data-theme="dark"] .pay-method-label,
        body[data-theme="dark"] .pay-summary-name,
        body[data-theme="dark"] .pay-summary-row.total,
        body[data-theme="dark"] .pay-wallet-name,
        body[data-theme="dark"] .pay-upi-app-name,
        body[data-theme="dark"] .pay-cod-title,
        body[data-theme="dark"] .pay-addr-box {
          color: #f8fafc;
        }
        body[data-theme="dark"] .pay-left-sub,
        body[data-theme="dark"] .pay-summary-sub,
        body[data-theme="dark"] .pay-method-sub,
        body[data-theme="dark"] .pay-summary-row,
        body[data-theme="dark"] .pay-summary-qty,
        body[data-theme="dark"] .pay-safe,
        body[data-theme="dark"] .pay-bank-note,
        body[data-theme="dark"] .pay-cod-note {
          color: #cbd5e1;
        }
        body[data-theme="dark"] .pay-label,
        body[data-theme="dark"] .pay-summary-pill {
          color: #dbeafe;
        }
        body[data-theme="dark"] .pay-input,
        body[data-theme="dark"] .pay-bank-select {
          background: rgba(15,23,42,0.88);
          border-color: rgba(71,85,105,0.74);
          color: #f8fafc;
        }
        body[data-theme="dark"] .pay-summary-item {
          border-bottom-color: rgba(71,85,105,0.44);
        }
        body[data-theme="dark"] .pay-summary-qty {
          background: rgba(15,23,42,0.78);
          border-color: rgba(71,85,105,0.52);
        }
        body[data-theme="dark"] .pay-summary-img {
          background: rgba(15,23,42,0.78);
          border-color: rgba(71,85,105,0.52);
        }
        body[data-theme="dark"] .pay-step-line {
          background: rgba(71,85,105,0.7);
        }

        @keyframes spin { to { transform:rotate(360deg); } }
        .pay-spinner { width:16px; height:16px; border:2.5px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        @media (max-width: 900px) {
          .pay-wrap { grid-template-columns: 1fr !important; }
          .pay-summary { position: static !important; margin-top: 24px; }
          .pay-left-header, .pay-panel, .pay-method-row, .pay-wallet-section { padding: 16px !important; }
          .pay-method-row { flex-direction: column; align-items: stretch; }
          .pay-upi-id-row { flex-direction: column; }
          .pay-card-row { grid-template-columns: 1fr !important; }
          .pay-wallets { flex-direction: column; }
          .pay-summary-hero,
          .pay-summary-items,
          .pay-summary-footer { padding-left:16px; padding-right:16px; }
          .pay-summary-breakdown,
          .pay-addr-box { margin-left:16px; margin-right:16px; }
          .pay-wallet-card { flex-direction: column; align-items: flex-start; gap: 12px; }
          .pay-wallet-balance { font-size: 18px; }
          .pay-left-header { flex-direction: column; }
        }
        @media (max-width: 700px) {
          .pay-summary-items { max-height: none; }
          .pay-summary-item { grid-template-columns:52px minmax(0,1fr); }
          .pay-summary-price { grid-column: 2; }
          .pay-method-label { font-size: 13px; }
          .pay-method-sub { font-size: 11px; }
          .pay-card-icons { flex-wrap: wrap; gap: 8px; }
          .pay-save-row { flex-direction: column; align-items: flex-start; }
          .pay-summary-amount { flex-direction: column; align-items:flex-start; }
          .pay-summary-amount span { text-align:left; max-width:none; }
        }
        @media (max-width: 500px) {
          .pay-steps { display: none !important; }
          .pay-left-header h2 { font-size: 18px; }
          .pay-wallet-card { width: 100%; }
          .pay-upi-app { min-width: 72px; }
          .pay-summary-title { padding-left: 16px; padding-right: 16px; }
          .pay-summary { margin: 0; }
          .pay-summary-pill { width: 100%; justify-content: flex-start; }
        }
      `}</style>

      <div className="pay-page">
        <div className="pay-crumb">
          <div className="container pay-crumb-inner">
            <span className="pay-crumb-back" onClick={onBack}>
              <i className="fas fa-arrow-left" style={{ fontSize: 10 }}></i> {t.cart.continueShopping}
            </span>
            <i className="fas fa-chevron-right" style={{ fontSize: 10 }}></i>
            <span style={{ color: "var(--dark)", fontWeight: 700 }}>{t.payment.paymentMethod}</span>
          </div>
        </div>

        <div className="pay-steps">
          <div className="container pay-steps-inner">
            <div className="pay-step done">
              <div className="pay-step-num"><i className="fas fa-check" style={{ fontSize: 9 }}></i></div>
              <span>{t.header.cart}</span>
            </div>
            <div className="pay-step-line done"></div>
            <div className="pay-step done">
              <div className="pay-step-num"><i className="fas fa-check" style={{ fontSize: 9 }}></i></div>
              <span>{t.account.addresses}</span>
            </div>
            <div className="pay-step-line done"></div>
            <div className="pay-step active">
              <div className="pay-step-num">3</div>
              <span>{t.payment.paymentMethod}</span>
            </div>
            <div className="pay-step-line"></div>
            <div className="pay-step">
              <div className="pay-step-num">4</div>
              <span>{t.order.confirmed}</span>
            </div>
          </div>
        </div>

        <div className="container" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', marginTop: 28 }}>
          <div className="pay-wrap">
            <div className="pay-left">
              <div className="pay-left-header">
                <div>
                  <h2><i className="fas fa-lock" style={{ color: "#16a34a", fontSize: 15 }}></i>{t.payment.methodTitle}</h2>
                  <p className="pay-left-sub">Choose the payment option that works best for this order. The checkout is tuned to stay clear and stable across desktop, tablet, and mobile screens.</p>
                </div>
                <div className="pay-left-badges">
                  <span className="pay-left-badge"><i className="fas fa-shield-check"></i> Encrypted</span>
                  <span className="pay-left-badge"><i className="fas fa-bolt"></i> Fast checkout</span>
                </div>
              </div>

              {/* Prime-Basket Wallet Selection */}
              <div className="pay-wallet-section">
                <div className="pay-wallet-card">
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="fas fa-wallet" style={{ fontSize: 20 }}></i>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.9 }}>Prime-Basket Wallet</div>
                      <div className="pay-wallet-balance">{currSym}{walletBalance.toFixed(2)}</div>
                      <div className="pay-wallet-note">Apply your wallet balance before completing the rest of the payment.</div>
                    </div>
                  </div>
                  <label className="pay-wallet-check" style={{ opacity: walletBalance > 0 ? 1 : 0.5 }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>Use Wallet Money</span>
                    <input
                      type="checkbox"
                      checked={usePBWallet && walletBalance > 0}
                      onChange={(e) => setUsePBWallet(e.target.checked)}
                      disabled={walletBalance <= 0}
                    />
                  </label>
                </div>
                {usePBWallet && walletBalance > 0 && (
                  <div style={{ fontSize: 12, color: "#1d5ba0", fontWeight: 700, marginTop: 10, display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="fas fa-check-circle"></i>
                    {isWalletFullyCovering
                      ? "Order will be fully paid using wallet balance."
                      : `${currSym}${walletDeduction.toFixed(2)} will be deducted from your wallet.`
                    }
                  </div>
                )}
              </div>

              {!isWalletFullyCovering && (
                <PaymentMethods
                  config={config}
                  method={method} setMethod={setMethod}
                  upiApp={upiApp} setUpiApp={setUpiApp}
                  upiId={upiId} setUpiId={setUpiId}
                  useUpiId={useUpiId} setUseUpiId={setUseUpiId}
                  bank={bank} setBank={setBank}
                  wallet={wallet} setWallet={setWallet}
                  cardNum={cardNum} setCardNum={setCardNum}
                  cardName={cardName} setCardName={setCardName}
                  cardExp={cardExp} setCardExp={setCardExp}
                  cardCvv={cardCvv} setCardCvv={setCardCvv}
                  saveCard={saveCard} setSaveCard={setSaveCard}
                  errors={errors} setErrors={setErrors}
                  t={t} currSym={currSym}
                />
              )}
            </div>

            <div className="pay-summary">
              <div className="pay-summary-title">
                <i className="fas fa-receipt" style={{ color: "#1d5ba0", marginRight: 8 }}></i>
                {t.cart.orderSummary}
                <p className="pay-summary-sub">Review the final payable amount, selected method, and delivery details before placing the order.</p>
              </div>

              <div className="pay-summary-hero">
                <div className="pay-summary-amount">
                  <div>
                    <small>{finalPayable === 0 ? "Fully covered" : "Final payable"}</small>
                    <strong>{formatCurrency(finalPayable, region)}</strong>
                  </div>
                  <span>{itemCount} {itemCount === 1 ? "item" : "items"} ready for checkout</span>
                </div>
                <div className="pay-summary-pills">
                  <div className="pay-summary-pill">
                    <i className={`fas ${isWalletFullyCovering ? "fa-wallet" : selectedMethodMeta?.icon}`}></i>
                    <span>{isWalletFullyCovering ? "Wallet order" : selectedMethodLabel}</span>
                  </div>
                  <div className="pay-summary-pill">
                    <i className="fas fa-box"></i>
                    <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                  </div>
                  {selectedMethodDesc ? (
                    <div className="pay-summary-pill">
                      <i className="fas fa-circle-info"></i>
                      <span>{selectedMethodDesc}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="pay-summary-items">
                {cart.map((item, idx) => {
                  const price = parsePrice(item.price);
                  return (
                    <div key={idx} className="pay-summary-item">
                      <div className="pay-summary-img">
                        <img src={item.imageUrl} alt={item.name} />
                      </div>
                      <div className="pay-summary-copy">
                        <div className="pay-summary-name">{getTranslatedName(item.name)}</div>
                        <div className="pay-summary-meta">
                          {item.selectedUnit ? <span className="pay-summary-qty">{item.selectedUnit}</span> : null}
                          <span className="pay-summary-qty">{item.quantity} x {formatCurrency(price, region)}</span>
                        </div>
                      </div>
                      <div className="pay-summary-price">{formatCurrency(price * item.quantity, region)}</div>
                    </div>
                  );
                })}
              </div>

              <div className="pay-summary-breakdown">
              <div className="pay-summary-rows">
                <div className="pay-summary-row">
                  <span>{t.cart.subtotal} ({itemCount} {itemCount !== 1 ? t.cart.itemsCountPlural : t.cart.itemsCount})</span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(subtotal, region)}</span>
                </div>
                <div className="pay-summary-row">
                  <span>{t.order.deliveryFee}</span>
                  <span style={{ color: delivery === 0 ? "#16a34a" : "#253d4e", fontWeight: 700 }}>{delivery === 0 ? t.cart.free : formatCurrency(delivery, region)}</span>
                </div>
                <div className="pay-summary-row">
                  <span>{t.order.handlingFee}</span>
                  <span style={{ color: "#253d4e", fontWeight: 700 }}>{formatCurrency(handlingFee, region)}</span>
                </div>
                {vat > 0 && (
                  <div className="pay-summary-row">
                    <span>{t.order.taxes} (VAT 16%)</span>
                    <span style={{ color: "#253d4e", fontWeight: 700 }}>{formatCurrency(vat, region)}</span>
                  </div>
                )}
                {saving > 0 && (
                  <div className="pay-summary-row" style={{ color: "#16a34a", fontWeight: 700 }}>
                    <span>{t.order.youSaved}</span>
                    <span>-{formatCurrency(saving, region)}</span>
                  </div>
                )}
                {promoDiscount > 0 && (
                  <div className="pay-summary-row" style={{ color: "#16a34a", fontWeight: 700 }}>
                    <span>Promo Applied ({promoCode})</span>
                    <span>-{formatCurrency(promoDiscount, region)}</span>
                  </div>
                )}
                {activeMethod === "cod" && (
                  <div className="pay-summary-row">
                    <span>COD Fee</span>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(20, region)}</span>
                  </div>
                )}
                {usePBWallet && walletDeduction > 0 && (
                  <div className="pay-summary-row" style={{ color: "#1d5ba0", fontWeight: 700 }}>
                    <span>Wallet Money Used</span>
                    <span>-{formatCurrency(walletDeduction, region)}</span>
                  </div>
                )}
                <div className="pay-summary-row total">
                  <span>{finalPayable === 0 ? "Fully Paid" : t.cart.total}</span>
                  <span style={{ color: "#1d5ba0" }}>{formatCurrency(finalPayable, region)}</span>
                </div>
              </div>
              </div>

              {address && (
                <div className="pay-addr-box">
                  <i className="fas fa-map-marker-alt"></i>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{t.order.deliverTo}: {address.type}</div>
                    <div style={{ color: "var(--body)", fontSize: 12 }}>{address.text}</div>
                  </div>
                </div>
              )}

              <div className="pay-summary-footer">
              <button
                className={`pay-now-btn${placing ? " loading" : ""}`}
                onClick={handlePay}
                disabled={placing}
              >
                {placing
                  ? <><div className="pay-spinner"></div> {t.order.processing}...</>
                  : <><i className="fas fa-lock"></i> {finalPayable === 0 ? "Place Order" : `${t.payment.payNow} ${formatCurrency(finalPayable, region)}`}</>
                }
              </button>

              <div className="pay-safe">
                <i className="fas fa-shield-alt" style={{ color: "#16a34a" }}></i>
                {t.payment.secure}
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
