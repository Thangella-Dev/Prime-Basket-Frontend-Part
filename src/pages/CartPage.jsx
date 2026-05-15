import { useEffect, useMemo, useState } from "react";
import { ADDRESSES_KEY } from "./AccountPage";
import { useT } from "../i18n/translations";
import AddressModal from "../components/AddressModal";
import { formatPhoneForDisplay } from "../utils/phoneValidation";
import { enhanceProduct, formatCurrency, getProductPrices, parsePrice, resolveProductImage } from "../utils/productUtils";
import { getFallbackDeals } from "../data/catalogFallback";
import { KENYA_ALL_PRODUCTS } from "../data/kenya_products";
import { getLocalizedProductName } from "../utils/translationUtils";

function loadAddresses() {
  try {
    const raw = localStorage.getItem(ADDRESSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function CartPage({
  cart,
  onUpdateQty,
  onRemove,
  onOpenProduct,
  onContinueShopping,
  onGoAccount,
  onCheckout,
  onAddCart,
  onMobileOverlayChange,
  language = "en",
  region = "in",
  user,
}) {
  const t = useT(language);
  const isKenya = region === "ke";

  const ui = isKenya
    ? {
        checkout: "Malipo",
        specialDeals: "Ofa maalum kwako!",
        unlockedDeal: "Ofa imefunguliwa. Ongeza bidhaa hii kwenye kikapu.",
        deliveryFast: "Uwasilishaji wa haraka",
        shipmentOf: "Usafirishaji wa bidhaa",
        recommended: "Unaweza pia kupenda",
        nextStep: "Chagua anwani kuendelea",
        selectedAddress: "Anwani iliyochaguliwa",
        quickAdd: "Ongeza",
        viewItem: "Tazama bidhaa",
        noAddress: "Chagua anwani kuendelea",
        savings: "Umeokoa",
        promoApplied: "Punguzo limetumika",
      }
    : {
        checkout: "Checkout",
        specialDeals: "Special deals for you!",
        unlockedDeal: "Special deal unlocked. Add this item to your cart.",
        deliveryFast: "Delivery in minutes",
        shipmentOf: "Shipment of",
        recommended: "You might also like",
        nextStep: "Select address to continue",
        selectedAddress: "Selected address",
        quickAdd: "Add",
        viewItem: "View item",
        noAddress: "Select an address to continue",
        savings: "Savings on this order",
        promoApplied: "Promo applied",
      };

  const getTranslatedName = (name) => getLocalizedProductName(name, t);

  const subtotal = cart.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
  const totalOldPrice = cart.reduce((sum, item) => sum + parsePrice(item.oldPrice || item.price) * item.quantity, 0);
  const saving = totalOldPrice > subtotal ? totalOldPrice - subtotal : 0;
  const vat = isKenya ? subtotal * 0.16 : 0;
  const handlingFee = !isKenya && subtotal > 0 && subtotal <= 99 ? 10 : 0;
  const delivery = subtotal > 99 ? 0 : subtotal === 0 ? 0 : 49;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [addresses, setAddresses] = useState(loadAddresses);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressNotice, setAddressNotice] = useState("");

  useEffect(() => {
    onMobileOverlayChange?.(isModalOpen);
    return () => onMobileOverlayChange?.(false);
  }, [isModalOpen, onMobileOverlayChange]);

  const baseTotal = subtotal + vat + handlingFee + delivery;
  const promoDiscount = appliedPromo ? Math.min(appliedPromo.amount, baseTotal) : 0;
  const total = baseTotal - promoDiscount;

  useEffect(() => {
    const sync = () => setAddresses(loadAddresses());
    window.addEventListener("focus", sync);
    sync();
    return () => window.removeEventListener("focus", sync);
  }, []);

  const persistAddresses = (list) => {
    localStorage.setItem(ADDRESSES_KEY, JSON.stringify(list));
    setAddresses(list);
  };

  const handleApplyPromo = () => {
    setPromoError("");
    if (!promoInput.trim()) return;

    const code = promoInput.trim().toUpperCase();
    if (code === "WELCOME50") {
      setAppliedPromo({ code, amount: 50 });
      return;
    }

    if (code === "ROYAL100") {
      setAppliedPromo({ code, amount: 100 });
      return;
    }

    try {
      const giftCards = JSON.parse(localStorage.getItem("pb_gift_cards") || "[]");
      const found = giftCards.find((giftCard) => giftCard.code === code && giftCard.status === "Active");
      if (found) {
        setAppliedPromo({ code, amount: Number(found.value) });
      } else {
        setPromoError("Invalid or expired promo code");
      }
    } catch {
      setPromoError("Invalid promo code");
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  const handleModalSave = (data) => {
    if (addresses.length >= 5) {
      setAddressNotice("Maximum 5 addresses allowed.");
      return;
    }

    const fullText = `${data.house}, ${data.building ? `${data.building}, ` : ""}${data.area}${data.landmark ? ` (Landmark: ${data.landmark})` : ""}${data.pincode ? ` - ${data.pincode}` : ""}${data.state ? `, ${data.state}` : ""}${data.country ? `, ${data.country}` : ""}`;
    const newEntry = {
      type: data.type,
      text: fullText,
      details: data,
    };

    const updated = [...addresses, newEntry];
    persistAddresses(updated);
    setSelectedIndex(updated.length - 1);
    setAddressNotice("Address added successfully.");
    setIsModalOpen(false);
  };

  const handleRemoveAddress = (index) => {
    const updated = addresses.filter((_, currentIndex) => currentIndex !== index);
    persistAddresses(updated);
    setAddressNotice("Address removed.");
    if (selectedIndex >= updated.length) {
      setSelectedIndex(Math.max(0, updated.length - 1));
    }
  };

  const selectedAddress = addresses[selectedIndex] || null;

  const specialDeals = useMemo(() => {
    if (!isKenya) return [];
    return getFallbackDeals(6, region);
  }, [isKenya, region]);

  const recommendedProducts = useMemo(() => {
    if (!isKenya) return [];
    const cartIds = new Set(cart.map((item) => item._uid || item.name));
    return KENYA_ALL_PRODUCTS.filter((product) => !cartIds.has(product._uid || product.name)).slice(0, 8);
  }, [cart, isKenya]);

  const stickyButtonLabel = selectedAddress ? t.cart.checkout : ui.nextStep;

  const handleQuickAddProduct = (product) => {
    if (!onAddCart) {
      onOpenProduct?.(product);
      return;
    }

    const enhanced = enhanceProduct(product, region, true);
    const selectedUnit = enhanced.baseUnit;
    const prices = getProductPrices(enhanced, selectedUnit);
    onAddCart({
      ...enhanced,
      selectedUnit,
      price: prices.price,
      oldPrice: prices.originalPrice,
    });
  };

  const handleProceedCheckout = () => {
    if (cart.length === 0) return;
    if (!selectedAddress) {
      setAddressNotice("");
      setIsModalOpen(true);
      return;
    }
    onCheckout?.({
      subtotal,
      total,
      delivery,
      vat,
      handlingFee,
      saving,
      promoDiscount,
      promoCode: appliedPromo?.code || "",
      address: selectedAddress,
    });
  };

  return (
    <>
      <style>{`
        @keyframes cartSweep {
          0% { transform: translateX(-135%); }
          100% { transform: translateX(135%); }
        }
        @keyframes cartIconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .cart-page {
          background:
            radial-gradient(circle at top left, rgba(255,204,115,0.12), transparent 24%),
            radial-gradient(circle at top right, rgba(68,196,212,0.12), transparent 26%),
            linear-gradient(180deg, #f6f8fc 0%, #eef4fb 100%);
          min-height: 100vh;
          padding-bottom: 104px;
        }
        .cart-crumb {
          background: rgba(255,255,255,0.82);
          border-bottom: 1px solid var(--border);
          padding: 12px 0;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .cart-crumb-inner {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--body);
        }
        .cart-crumb-back {
          color: #1d5ba0;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 13px;
          border-radius: 999px;
          border: 1px solid rgba(191,219,254,0.98);
          background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(237,244,255,0.98));
          box-shadow: 0 10px 20px rgba(29,91,160,0.08);
          transition: transform .22s ease, box-shadow .22s ease, color .22s ease;
        }
        .cart-crumb-back:hover { transform: translateY(-1px); box-shadow: 0 16px 28px rgba(29,91,160,0.14); }
        .cart-wrap {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 24px;
          margin-top: 24px;
          align-items: start;
        }
        .cart-main-column {
          display: grid;
          gap: 18px;
        }
        .cart-mobile-head {
          display: none;
        }
        .cart-premium-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,251,255,0.98));
          border: 1px solid rgba(148,163,184,0.14);
          border-radius: 26px;
          box-shadow: 0 22px 44px rgba(15,23,42,0.08);
          overflow: hidden;
          transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
        }
        .cart-premium-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 28px 54px rgba(15,23,42,0.12);
          border-color: rgba(15,91,215,0.18);
        }
        .cart-special-head,
        .cart-list-head,
        .cart-address-head,
        .cart-summary-head {
          padding: 22px 24px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .cart-special-head h3,
        .cart-list-head h2,
        .cart-address-head h3,
        .cart-summary-head h3 {
          margin: 0;
          font-family: "Outfit", "Quicksand", sans-serif;
          font-size: 1.06rem;
          font-weight: 800;
          color: var(--navy);
          letter-spacing: -0.02em;
        }
        .cart-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 28px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(15,91,215,0.08);
          border: 1px solid rgba(15,91,215,0.12);
          color: #1d5ba0;
          font-size: 0.74rem;
          font-weight: 800;
        }
        .cart-special-rail {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(254px, 72%);
          gap: 14px;
          overflow-x: auto;
          padding: 0 24px 22px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .cart-special-rail::-webkit-scrollbar {
          display: none;
        }
        .cart-special-card {
          border-radius: 24px;
          background: linear-gradient(180deg, #f3ebff 0%, #e7d7ff 100%);
          border: 1px solid rgba(109,40,217,0.12);
          padding: 14px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.55);
          transition: transform 0.24s ease, box-shadow 0.24s ease;
        }
        .cart-special-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 40px rgba(76,29,149,0.12), inset 0 1px 0 rgba(255,255,255,0.55);
        }
        .cart-special-card-inner {
          display: grid;
          grid-template-columns: 74px minmax(0,1fr) auto;
          gap: 12px;
          align-items: center;
          padding: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,0.14);
        }
        .cart-special-thumb {
          width: 74px;
          height: 74px;
          border-radius: 18px;
          background: rgba(15,23,42,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
        }
        .cart-special-thumb img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .cart-special-copy {
          min-width: 0;
        }
        .cart-special-title {
          color: #ffffff;
          font-size: 0.96rem;
          font-weight: 800;
          line-height: 1.34;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .cart-special-qty {
          color: rgba(255,255,255,0.74);
          font-size: 0.8rem;
          margin-top: 4px;
        }
        .cart-special-price {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .cart-special-price strong {
          color: #fff;
          font-size: 1.05rem;
          font-weight: 800;
        }
        .cart-special-price span {
          color: rgba(255,255,255,0.6);
          font-size: 0.82rem;
          text-decoration: line-through;
        }
        .cart-special-add {
          min-width: 88px;
          height: 46px;
          border-radius: 16px;
          border: 2px solid rgba(29,91,160,0.82);
          background: rgba(15,23,42,0.92);
          color: #9cc8ff;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          padding: 0 14px;
          position: relative;
          overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .cart-promo-btn,
        .cart-rec-btn,
        .cart-mobile-sticky-btn {
          position: relative;
          overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
        }
        .cart-special-add::after,
        .cart-empty-btn::after,
        .cart-summary-btn::after,
        .cart-promo-btn::after,
        .cart-rec-btn::after,
        .cart-mobile-sticky-btn::after,
        .cart-address-add::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.38) 48%, transparent 100%);
          transform: translateX(-140%);
          pointer-events: none;
        }
        .cart-special-add:hover::after,
        .cart-empty-btn:hover::after,
        .cart-summary-btn:hover::after,
        .cart-promo-btn:hover::after,
        .cart-rec-btn:hover::after,
        .cart-mobile-sticky-btn:hover::after,
        .cart-address-add:hover::after {
          animation: cartSweep .82s ease;
        }
        .cart-special-add:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 30px rgba(15,23,42,0.18);
        }
        .cart-promo-btn:hover,
        .cart-rec-btn:hover,
        .cart-mobile-sticky-btn:hover {
          transform: translateY(-2px);
          filter: saturate(1.04);
        }
        .cart-special-note {
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(44,17,94,0.88);
          font-size: 0.86rem;
          font-weight: 700;
          line-height: 1.45;
        }
        .cart-special-note i {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: rgba(255,255,255,0.88);
          color: #6d28d9;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cart-delivery-card {
          padding: 18px 20px;
          display: grid;
          grid-template-columns: auto minmax(0,1fr);
          gap: 14px;
          align-items: center;
          border-bottom: 1px solid rgba(148,163,184,0.12);
        }
        .cart-delivery-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(15,23,42,0.06), rgba(15,23,42,0.02));
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #1d5ba0;
          font-size: 1.45rem;
          border: 1px solid rgba(148,163,184,0.16);
          animation: cartIconFloat 3s ease-in-out infinite;
        }
        .cart-delivery-title {
          color: var(--navy);
          font-family: "Outfit", "Quicksand", sans-serif;
          font-size: clamp(1.05rem, 2vw, 1.25rem);
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .cart-delivery-sub {
          color: var(--body);
          font-size: 0.92rem;
          margin-top: 4px;
        }
        .cart-list {
          padding: 0;
        }
        .cart-item-row {
          display: grid;
          grid-template-columns: 96px minmax(0, 1fr) 146px;
          gap: 18px;
          align-items: center;
          padding: 18px 20px;
          border-top: 1px solid rgba(148,163,184,0.1);
          transition: background 0.22s ease;
        }
        .cart-item-row:hover {
          background: rgba(15,91,215,0.03);
        }
        .cart-item-thumb {
          width: 96px;
          height: 96px;
          border-radius: 20px;
          border: 1px solid rgba(148,163,184,0.12);
          background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,250,255,0.98));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          cursor: pointer;
          box-shadow: 0 14px 24px rgba(15,23,42,0.05);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .cart-item-thumb:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 18px 30px rgba(15,23,42,0.09);
        }
        .cart-item-thumb img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .cart-item-content {
          min-width: 0;
        }
        .cart-item-brand {
          color: #1d5ba0;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.62rem;
          font-weight: 800;
        }
        .cart-item-name {
          margin-top: 6px;
          color: var(--navy);
          font-size: 1rem;
          font-weight: 800;
          line-height: 1.26;
          cursor: pointer;
        }
        .cart-item-subline {
          margin-top: 8px;
          color: var(--body);
          font-size: 0.94rem;
          line-height: 1.35;
        }
        .cart-item-badges {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .cart-item-chip {
          display: inline-flex;
          align-items: center;
          min-height: 24px;
          padding: 0 9px;
          border-radius: 999px;
          background: rgba(15,91,215,0.08);
          border: 1px solid rgba(15,91,215,0.12);
          color: #1d5ba0;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.01em;
        }
        .cart-item-chip.subtle {
          background: #f8fafc;
          border-color: rgba(148,163,184,0.18);
          color: #64748b;
        }
        .cart-item-chip.save {
          background: #ecfdf5;
          border-color: rgba(22,163,74,0.18);
          color: #15803d;
        }
        .cart-item-badges .cart-item-chip:not(.save) {
          display: none;
        }
        .cart-item-meta {
          display: none;
        }
        .cart-item-actions {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .cart-item-link {
          background: none;
          border: none;
          border-bottom: 2px dotted rgba(100,116,139,0.55);
          color: var(--body);
          padding: 0;
          font-family: inherit;
          font-size: 0.86rem;
          cursor: pointer;
        }
        .cart-item-side {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          min-width: 146px;
          justify-content: center;
        }
        .cart-qty-pill {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-width: 138px;
          height: 48px;
          border-radius: 16px;
          background: linear-gradient(180deg, #1d5ba0 0%, #174a84 100%);
          color: #fff;
          padding: 0 12px;
          box-shadow: 0 14px 28px rgba(29,91,160,0.22);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .cart-qty-pill:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 34px rgba(29,91,160,0.28);
        }
        .cart-qty-pill button {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          color: #fff;
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .cart-qty-pill span {
          font-size: 1rem;
          font-weight: 800;
        }
        .cart-price-block {
          text-align: right;
          line-height: 1.2;
        }
        .cart-price-block small {
          display: block;
          color: var(--body);
          font-size: 0.76rem;
          margin-bottom: 5px;
        }
        .cart-price-block strong {
          color: var(--navy);
          font-size: 1.12rem;
          font-weight: 800;
        }
        .cart-price-block span {
          display: block;
          color: var(--body);
          text-decoration: line-through;
          font-size: 0.9rem;
          margin-bottom: 2px;
        }
        .cart-empty {
          padding: 60px 24px;
          text-align: center;
        }
        .cart-empty-icon {
          width: 72px;
          height: 72px;
          margin: 0 auto 16px;
          border-radius: 22px;
          background: rgba(15,91,215,0.08);
          color: #1d5ba0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
        }
        .cart-empty h3 {
          margin: 0 0 8px;
          color: var(--navy);
          font-family: "Outfit", "Quicksand", sans-serif;
          font-size: 1.2rem;
          font-weight: 800;
        }
        .cart-empty p {
          margin: 0 0 20px;
          color: var(--body);
          font-size: 0.94rem;
        }
        .cart-empty-btn,
        .cart-summary-btn {
          width: 100%;
          min-height: 56px;
          border: none;
          border-radius: 18px;
          background: linear-gradient(180deg, #1d5ba0 0%, #174a84 100%);
          color: #fff;
          font-family: "Outfit", "Quicksand", sans-serif;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 18px 32px rgba(29,91,160,0.24);
          position: relative;
          overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .cart-empty-btn:hover,
        .cart-summary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 38px rgba(29,91,160,0.3);
        }
        .cart-empty-btn {
          max-width: 280px;
        }
        .cart-address-body {
          padding: 0 20px 18px;
        }
        .cart-address-list {
          display: grid;
          gap: 12px;
        }
        .cart-address-item {
          position: relative;
          border: 1px solid rgba(148,163,184,0.14);
          border-radius: 18px;
          padding: 16px;
          background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(247,250,255,0.98));
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .cart-address-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 30px rgba(15,23,42,0.08);
        }
        .cart-address-item.selected {
          border-color: rgba(15,91,215,0.44);
          box-shadow: 0 14px 28px rgba(15,91,215,0.12);
          transform: translateY(-1px);
        }
        .cart-address-item-top {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .cart-address-icon {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          background: rgba(15,91,215,0.08);
          color: #1d5ba0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cart-address-copy {
          flex: 1;
          min-width: 0;
        }
        .cart-address-type {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--navy);
          font-size: 0.96rem;
          font-weight: 800;
        }
        .cart-address-text {
          margin-top: 6px;
          color: var(--body);
          font-size: 0.86rem;
          line-height: 1.55;
        }
        .cart-address-meta {
          margin-top: 8px;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          color: var(--body);
          font-size: 0.76rem;
        }
        .cart-address-remove {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 50%;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
        }
        .cart-address-add {
          width: 100%;
          margin-top: 14px;
          min-height: 50px;
          border-radius: 16px;
          border: 1px dashed rgba(15,91,215,0.34);
          background: rgba(15,91,215,0.04);
          color: #1d5ba0;
          font-family: inherit;
          font-size: 0.92rem;
          font-weight: 800;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .cart-address-add:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 28px rgba(15,91,215,0.12);
        }
        .cart-summary {
          position: sticky;
          top: 88px;
        }
        .cart-summary-body {
          padding: 0 24px 24px;
        }
        .cart-summary-deliver {
          color: var(--body);
          font-size: 0.84rem;
          line-height: 1.5;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(148,163,184,0.12);
          margin-bottom: 14px;
        }
        .cart-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          color: var(--body);
          font-size: 0.94rem;
        }
        .cart-summary-row strong,
        .cart-summary-row span:last-child {
          color: var(--navy);
          font-weight: 700;
        }
        .cart-summary-row.total {
          padding-top: 16px;
          margin-top: 2px;
          border-top: 1px solid rgba(148,163,184,0.12);
        }
        .cart-summary-row.total strong,
        .cart-summary-row.total span {
          font-size: 1.08rem;
          color: #1d5ba0;
          font-weight: 800;
        }
        .cart-summary-hint {
          margin: 8px 0 4px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(34,197,94,0.08);
          color: #166534;
          font-size: 0.8rem;
          font-weight: 700;
          line-height: 1.45;
        }
        .cart-summary-safe {
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--body);
          font-size: 0.78rem;
        }
        .cart-promo {
          display: flex;
          gap: 8px;
          margin: 16px 0 10px;
        }
        .cart-promo input {
          flex: 1;
          min-width: 0;
          border: 1.5px solid rgba(148,163,184,0.18);
          border-radius: 14px;
          padding: 11px 12px;
          font-family: inherit;
          font-size: 0.88rem;
          outline: none;
          background: #fff;
        }
        .cart-promo-btn {
          min-width: 92px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(180deg, #1d5ba0 0%, #174a84 100%);
          color: #fff;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
          padding: 0 14px;
        }
        .cart-rec-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          padding: 0 20px 20px;
        }
        .cart-rec-card {
          border-radius: 18px;
          border: 1px solid rgba(148,163,184,0.14);
          background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,251,255,0.98));
          padding: 12px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .cart-rec-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 28px rgba(15,23,42,0.08);
        }
        .cart-rec-thumb {
          position: relative;
          aspect-ratio: 1 / 1;
          height: auto;
          border-radius: 16px;
          background: #f7fbff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
        }
        .cart-rec-thumb img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .cart-rec-wish {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.96);
          color: #94a3b8;
          box-shadow: 0 8px 18px rgba(15,23,42,0.08);
        }
        .cart-rec-name {
          margin-top: 10px;
          color: var(--navy);
          font-size: 0.84rem;
          font-weight: 800;
          line-height: 1.32;
          min-height: 2.5em;
        }
        .cart-rec-price {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .cart-rec-price strong {
          color: #1d5ba0;
          font-size: 0.9rem;
          font-weight: 800;
        }
        .cart-rec-price span {
          color: var(--body);
          text-decoration: line-through;
          font-size: 0.74rem;
        }
        .cart-rec-btn {
          width: 100%;
          min-height: 38px;
          margin-top: 10px;
          border: none;
          border-radius: 12px;
          background: rgba(15,91,215,0.08);
          color: #1d5ba0;
          font-family: inherit;
          font-size: 0.8rem;
          font-weight: 800;
          cursor: pointer;
        }
        .cart-mobile-sticky {
          display: none;
        }

        body[data-theme="dark"] .cart-page {
          background:
            radial-gradient(circle at top left, rgba(15,91,215,0.18), transparent 28%),
            radial-gradient(circle at top right, rgba(56,189,248,0.12), transparent 26%),
            linear-gradient(180deg, #07101d 0%, #0b1729 100%);
        }
        body[data-theme="dark"] .cart-crumb,
        body[data-theme="dark"] .cart-premium-card,
        body[data-theme="dark"] .cart-item-thumb,
        body[data-theme="dark"] .cart-rec-card,
        body[data-theme="dark"] .cart-rec-thumb,
        body[data-theme="dark"] .cart-special-add,
        body[data-theme="dark"] .cart-address-item,
        body[data-theme="dark"] .cart-promo input {
          background: var(--white);
          border-color: var(--border);
        }
        body[data-theme="dark"] .cart-special-card {
          background: linear-gradient(180deg, rgba(47,23,98,0.92), rgba(33,19,77,0.92));
        }
        body[data-theme="dark"] .cart-address-add,
        body[data-theme="dark"] .cart-rec-btn {
          background: rgba(15,91,215,0.12);
          color: #8fc2ff;
        }
        body[data-theme="dark"] .cart-badge {
          color: #8fc2ff;
          background: rgba(15,91,215,0.14);
        }
        body[data-theme="dark"] .cart-item-chip {
          background: rgba(15,91,215,0.16);
          border-color: rgba(96,165,250,0.22);
          color: #9cc8ff;
        }
        body[data-theme="dark"] .cart-item-chip.subtle {
          background: rgba(255,255,255,0.05);
          border-color: rgba(74,95,130,0.28);
          color: #d6e6fb;
        }
        body[data-theme="dark"] .cart-item-chip.save {
          background: rgba(34,197,94,0.14);
          border-color: rgba(34,197,94,0.18);
          color: #86efac;
        }
        body[data-theme="dark"] .cart-item-meta,
        body[data-theme="dark"] .cart-price-block small,
        body[data-theme="dark"] .cart-price-block span,
        body[data-theme="dark"] .cart-item-link {
          color: #d6e6fb;
        }

        @media (max-width: 1080px) {
          .cart-rec-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .cart-wrap {
            grid-template-columns: 1fr;
          }
          .cart-summary {
            display: none;
          }
          .cart-mobile-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }
          .cart-mobile-head-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .cart-mobile-back {
            width: 42px;
            height: 42px;
            border: none;
            border-radius: 14px;
            background: rgba(255,255,255,0.92);
            box-shadow: 0 12px 20px rgba(15,23,42,0.1);
            color: #1d5ba0;
          }
          .cart-mobile-head h1 {
            margin: 0;
            font-size: 1.18rem;
            font-family: "Outfit", "Quicksand", sans-serif;
            color: var(--navy);
          }
          .cart-mobile-sticky {
            position: fixed;
            left: 14px;
            right: 14px;
            bottom: 10px;
            z-index: 60;
            display: block;
          }
          .cart-mobile-sticky-shell {
            border-radius: 22px;
            padding: 9px;
            background: rgba(18,35,63,0.16);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            box-shadow: 0 22px 40px rgba(15,23,42,0.18);
          }
          .cart-mobile-sticky-btn {
            width: 100%;
            min-height: 46px;
            border: none;
            border-radius: 15px;
            background: linear-gradient(180deg, #1d5ba0 0%, #174a84 100%);
            color: #fff;
            font-family: "Outfit", "Quicksand", sans-serif;
            font-size: 0.9rem;
            font-weight: 800;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .cart-mobile-sticky-btn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
          }
          .cart-mobile-sticky-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            color: #fff;
            font-size: 0.74rem;
            margin-bottom: 7px;
            padding: 0 4px;
          }
          .cart-mobile-sticky-meta strong {
            display: block;
            font-size: 0.86rem;
          }
        }

        @media (max-width: 640px) {
          .cart-crumb {
            display: none;
          }
          .cart-page {
            padding-bottom: 96px;
          }
          .cart-special-head,
          .cart-list-head,
          .cart-address-head,
          .cart-summary-head {
            padding: 18px 16px 14px;
          }
          .cart-special-rail,
          .cart-rec-grid {
            padding-left: 16px;
            padding-right: 16px;
          }
          .cart-special-card-inner {
            grid-template-columns: 62px minmax(0,1fr);
          }
          .cart-special-add {
            grid-column: 1 / -1;
            width: 100%;
          }
          .cart-special-thumb {
            width: 62px;
            height: 62px;
          }
          .cart-item-row {
            grid-template-columns: 76px minmax(0,1fr) auto;
            gap: 12px;
            padding: 14px 16px;
            align-items: center;
          }
          .cart-item-thumb {
            width: 76px;
            height: 76px;
            border-radius: 16px;
            padding: 8px;
          }
          .cart-item-brand {
            font-size: 0.56rem;
          }
          .cart-item-name {
            margin-top: 4px;
            font-size: 0.94rem;
          }
          .cart-item-subline {
            margin-top: 6px;
            font-size: 0.82rem;
          }
          .cart-item-badges {
            margin-top: 8px;
            gap: 6px;
          }
          .cart-item-chip {
            min-height: 22px;
            padding: 0 8px;
            font-size: 0.66rem;
          }
          .cart-item-link {
            font-size: 0.8rem;
          }
          .cart-item-actions {
            margin-top: 8px;
          }
          .cart-item-side {
            grid-column: 3;
            grid-row: 1;
            flex-direction: column;
            align-items: flex-end;
            justify-content: center;
            width: auto;
            min-width: 116px;
            gap: 8px;
          }
          .cart-qty-pill {
            min-width: 108px;
            height: 40px;
            border-radius: 12px;
            gap: 6px;
            padding: 0 7px;
          }
          .cart-qty-pill button {
            width: 24px;
            height: 24px;
            font-size: 1.35rem;
          }
          .cart-qty-pill span {
            font-size: 0.92rem;
          }
          .cart-price-block strong {
            font-size: 1rem;
          }
          .cart-price-block small,
          .cart-price-block span {
            font-size: 0.72rem;
          }
          .cart-address-body {
            padding: 0 16px 16px;
          }
          .cart-rec-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .cart-rec-card {
            padding: 12px;
          }
          .cart-rec-thumb {
            height: 110px;
          }
        }

        @media (max-width: 520px) {
          .cart-rec-grid {
            grid-template-columns: 1fr;
          }
          .cart-item-row {
            grid-template-columns: 72px minmax(0,1fr) auto;
            gap: 10px;
            padding: 12px 14px;
          }
          .cart-item-thumb {
            width: 72px;
            height: 72px;
          }
          .cart-item-side {
            min-width: 104px;
            gap: 7px;
          }
          .cart-price-block {
            text-align: right;
          }
          .cart-qty-pill {
            min-width: 102px;
            height: 38px;
          }
          .cart-qty-pill button {
            width: 22px;
            height: 22px;
            font-size: 1.2rem;
          }
          .cart-qty-pill span {
            font-size: 0.88rem;
          }
        }
      `}</style>

      <div className="cart-page">
        <div className="container" style={{ paddingTop: 18 }}>
          <div className="cart-mobile-head">
            <div className="cart-mobile-head-left">
              <button type="button" className="cart-mobile-back" onClick={onContinueShopping}>
                <i className="fas fa-chevron-left"></i>
              </button>
              <h1>{ui.checkout}</h1>
            </div>
          </div>

          <div className="cart-crumb">
            <div className="container cart-crumb-inner">
              <span className="cart-crumb-back" onClick={onContinueShopping}>
                <i className="fas fa-arrow-left" style={{ fontSize: 10 }}></i> {t.cart.breadcrumbHome}
              </span>
              <i className="fas fa-chevron-right" style={{ fontSize: 10 }}></i>
              <span style={{ color: "var(--dark)", fontWeight: 700 }}>{ui.checkout}</span>
            </div>
          </div>

          <div className="cart-wrap">
            <div className="cart-main-column">
              {specialDeals.length > 0 && cart.length > 0 ? (
                <section className="cart-premium-card">
                  <div className="cart-special-head">
                    <h3>{ui.specialDeals}</h3>
                    <span className="cart-badge">{specialDeals.length}</span>
                  </div>
                  <div className="cart-special-rail">
                    {specialDeals.map((product, index) => (
                      <article key={`${product._uid || product.name}_${index}`} className="cart-special-card">
                        <div className="cart-special-card-inner">
                          <div className="cart-special-thumb">
                            <img src={resolveProductImage(product)} alt={getTranslatedName(product.name)} loading="lazy" />
                          </div>
                          <div className="cart-special-copy">
                            <div className="cart-special-title">{getTranslatedName(product.name)}</div>
                            <div className="cart-special-qty">{product.quantity || product.standard || product.brand || "1 pack"}</div>
                            <div className="cart-special-price">
                              <strong>{formatCurrency(parsePrice(product.price), region)}</strong>
                              {product.oldPrice ? <span>{formatCurrency(parsePrice(product.oldPrice), region)}</span> : null}
                            </div>
                          </div>
                          <button type="button" className="cart-special-add" onClick={() => handleQuickAddProduct(product)}>
                            {onAddCart ? ui.quickAdd.toUpperCase() : ui.viewItem}
                          </button>
                        </div>
                        <div className="cart-special-note">
                          <i className="fas fa-lock"></i>
                          <span>{ui.unlockedDeal}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="cart-premium-card">
                <div className="cart-delivery-card">
                  <div className="cart-delivery-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div>
                    <div className="cart-delivery-title">{ui.deliveryFast}</div>
                    <div className="cart-delivery-sub">
                      {ui.shipmentOf} {itemCount} {itemCount === 1 ? t.cart.itemsCount : t.cart.itemsCountPlural}
                    </div>
                  </div>
                </div>

                <div className="cart-list-head">
                  <h2>{t.cart.title}</h2>
                  <span className="cart-badge">
                    {itemCount} {itemCount === 1 ? t.cart.itemsCount : t.cart.itemsCountPlural}
                  </span>
                </div>

                {cart.length === 0 ? (
                  <div className="cart-empty">
                    <div className="cart-empty-icon">
                      <i className="fas fa-basket-shopping"></i>
                    </div>
                    <h3>{t.cart.emptyTitle}</h3>
                    <p>{t.cart.emptyDesc}</p>
                    <button type="button" className="cart-empty-btn" onClick={onContinueShopping}>
                      {t.cart.startShopping}
                    </button>
                  </div>
                ) : (
                  <div className="cart-list">
                    {cart.map((item) => {
                      const unitPrice = parsePrice(item.price);
                      const oldUnitPrice = parsePrice(item.oldPrice || item.price);
                      const lineTotal = unitPrice * item.quantity;
                      const lineSavings = oldUnitPrice > unitPrice ? (oldUnitPrice - unitPrice) * item.quantity : 0;
                      const translatedName = getTranslatedName(item.name);
                      const unitLabel = item.selectedUnit || item.standard || item.unit || "1 unit";

                      return (
                        <article key={`${item._uid}_${item.selectedUnit || "default"}`} className="cart-item-row">
                          <div className="cart-item-thumb" onClick={() => onOpenProduct?.(item)}>
                            <img src={resolveProductImage(item)} alt={translatedName} loading="lazy" />
                          </div>

                          <div className="cart-item-content">
                            {item.brand ? <div className="cart-item-brand">{item.brand}</div> : null}
                            <div className="cart-item-name" onClick={() => onOpenProduct?.(item)}>
                              {translatedName}
                            </div>
                            <div className="cart-item-subline">{unitLabel}</div>
                            <div className="cart-item-badges">
                              {item.selectedUnit ? <span className="cart-item-chip">{item.selectedUnit}</span> : null}
                              <span className="cart-item-chip subtle">{item.quantity} {item.quantity === 1 ? "item" : "items"}</span>
                              {lineSavings > 0 ? <span className="cart-item-chip save">Save {formatCurrency(lineSavings, region)}</span> : null}
                            </div>
                            <div className="cart-item-meta">
                              {formatCurrency(unitPrice, region)} each
                              {item.brand ? ` • ${item.brand}` : ""}
                            </div>
                            <div className="cart-item-actions">
                              <button
                                type="button"
                                className="cart-item-link"
                                onClick={() => onRemove(item._uid, item.selectedUnit)}
                              >
                                {t.cart.remove}
                              </button>
                            </div>
                          </div>

                          <div className="cart-item-side">
                            <div className="cart-qty-pill">
                              <button type="button" onClick={() => onUpdateQty(item._uid, item.selectedUnit, item.quantity - 1)}>
                                -
                              </button>
                              <span>{item.quantity}</span>
                              <button type="button" onClick={() => onUpdateQty(item._uid, item.selectedUnit, item.quantity + 1)}>
                                +
                              </button>
                            </div>
                            <div className="cart-price-block">
                              <small>{formatCurrency(unitPrice, region)} each</small>
                              {oldUnitPrice > unitPrice ? <span>{formatCurrency(oldUnitPrice, region)}</span> : null}
                              <strong>{formatCurrency(lineTotal, region)}</strong>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="cart-premium-card">
                <div className="cart-address-head">
                  <h3>{t.cart.deliveryAddress}</h3>
                  {onGoAccount ? (
                    <button type="button" className="cart-item-link" onClick={onGoAccount}>
                      {t.cart.manageProfile}
                    </button>
                  ) : null}
                </div>

                <div className="cart-address-body">
                  {addressNotice ? (
                    <div
                      style={{
                        marginBottom: "14px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#eef5ff",
                        border: "1px solid rgba(29, 91, 160, 0.14)",
                        color: "#1d5ba0",
                        fontSize: "0.88rem",
                        fontWeight: 700,
                      }}
                    >
                      {addressNotice}
                    </div>
                  ) : null}

                  {addresses.length === 0 ? (
                    <div className="cart-empty" style={{ padding: "18px 0 6px", textAlign: "left" }}>
                      <p style={{ marginBottom: 0 }}>{t.cart.noAddresses}</p>
                    </div>
                  ) : (
                    <div className="cart-address-list">
                      {addresses.map((address, index) => (
                        <div
                          key={`${address.type}_${index}`}
                          className={`cart-address-item${selectedIndex === index ? " selected" : ""}`}
                          onClick={() => setSelectedIndex(index)}
                        >
                          <div className="cart-address-item-top">
                            <div className="cart-address-icon">
                              <i
                                className={
                                  address.type === "Home"
                                    ? "fas fa-home"
                                    : address.type === "Work"
                                      ? "fas fa-briefcase"
                                      : "fas fa-location-dot"
                                }
                              ></i>
                            </div>
                            <div className="cart-address-copy">
                              <div className="cart-address-type">
                                <span>{address.type}</span>
                                {selectedIndex === index ? (
                                  <i className="fas fa-circle-check" style={{ color: "#1d5ba0" }}></i>
                                ) : null}
                              </div>
                              <div className="cart-address-text">{address.text}</div>
                              {address.details?.receiverName || user?.name || address.details?.receiverPhone || user?.phone ? (
                                <div className="cart-address-meta">
                                  <span>
                                    <i className="fas fa-user"></i>{" "}
                                    {address.details?.receiverName || user?.name || "Customer"}
                                  </span>
                                  <span>
                                    <i className="fas fa-phone"></i>{" "}
                                    {formatPhoneForDisplay(region, address.details?.receiverPhone || user?.phone)}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="cart-address-remove"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveAddress(index);
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <AddressModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleModalSave}
                    t={t}
                    language={language}
                  />

                  {addresses.length < 5 ? (
                    <button type="button" className="cart-address-add" onClick={() => setIsModalOpen(true)}>
                      <i className="fas fa-plus-circle" style={{ marginRight: 8 }}></i>
                      {t.cart.addNewAddress}
                    </button>
                  ) : null}
                </div>
              </section>

              {recommendedProducts.length > 0 ? (
                <section className="cart-premium-card">
                  <div className="cart-special-head">
                    <h3>{ui.recommended}</h3>
                  </div>

                  <div className="cart-rec-grid">
                    {recommendedProducts.map((product, index) => (
                      <article
                        key={`${product._uid || product.name}_${index}`}
                        className="cart-rec-card"
                        onClick={() => onOpenProduct?.(product)}
                      >
                        <div className="cart-rec-thumb">
                          <span className="cart-rec-wish">
                            <i className="far fa-heart"></i>
                          </span>
                          <img src={resolveProductImage(product)} alt={getTranslatedName(product.name)} loading="lazy" />
                        </div>
                        <div className="cart-rec-name">{getTranslatedName(product.name)}</div>
                        <div className="cart-rec-price">
                          <strong>{formatCurrency(parsePrice(product.price), region)}</strong>
                          {product.oldPrice ? <span>{formatCurrency(parsePrice(product.oldPrice), region)}</span> : null}
                        </div>
                        <button
                          type="button"
                          className="cart-rec-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleQuickAddProduct(product);
                          }}
                        >
                          {onAddCart ? ui.quickAdd : ui.viewItem}
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="cart-premium-card cart-summary">
              <div className="cart-summary-head">
                <h3>{t.cart.orderSummary}</h3>
              </div>

              <div className="cart-summary-body">
                {selectedAddress ? (
                  <div className="cart-summary-deliver">
                    <strong>{ui.selectedAddress}:</strong> {selectedAddress.text}
                  </div>
                ) : (
                  <div className="cart-summary-deliver">{ui.noAddress}</div>
                )}

                <div className="cart-summary-row">
                  <span>
                    {t.cart.subtotal} ({itemCount} {itemCount === 1 ? t.cart.itemsCount : t.cart.itemsCountPlural})
                  </span>
                  <span>{formatCurrency(subtotal, region)}</span>
                </div>

                <div className="cart-summary-row">
                  <span>{t.cart.delivery}</span>
                  <span>{delivery === 0 ? t.cart.free : formatCurrency(delivery, region)}</span>
                </div>

                {vat > 0 ? (
                  <div className="cart-summary-row">
                    <span>VAT (16%)</span>
                    <span>{formatCurrency(vat, region)}</span>
                  </div>
                ) : null}

                {handlingFee > 0 ? (
                  <div className="cart-summary-row">
                    <span>Handling Fee</span>
                    <span>{formatCurrency(handlingFee, region)}</span>
                  </div>
                ) : null}

                {subtotal > 0 && subtotal <= 99 ? (
                  <div className="cart-summary-hint">
                    {t.cart.addMoreForFree.replace("{amount}", formatCurrency(99 - subtotal + 0.01, region).replace(".00", ""))}
                  </div>
                ) : null}

                {saving > 0 ? (
                  <div className="cart-summary-row" style={{ color: "#16a34a" }}>
                    <span>{ui.savings}</span>
                    <span>-{formatCurrency(saving, region)}</span>
                  </div>
                ) : null}

                <div className="cart-promo">
                  <input
                    type="text"
                    placeholder={t.cart.promoPlaceholder}
                    value={promoInput}
                    onChange={(event) => setPromoInput(event.target.value)}
                    disabled={appliedPromo !== null}
                  />
                  {appliedPromo ? (
                    <button type="button" className="cart-promo-btn" style={{ background: "#e63946" }} onClick={handleRemovePromo}>
                      Remove
                    </button>
                  ) : (
                    <button type="button" className="cart-promo-btn" onClick={handleApplyPromo}>
                      {t.cart.applyBtn}
                    </button>
                  )}
                </div>

                {promoError ? (
                  <div style={{ color: "#e63946", fontSize: "0.76rem", marginTop: "-2px", marginBottom: "10px" }}>
                    {promoError}
                  </div>
                ) : null}

                {promoDiscount > 0 ? (
                  <div className="cart-summary-row" style={{ color: "#16a34a" }}>
                    <span>{ui.promoApplied} ({appliedPromo?.code})</span>
                    <span>-{formatCurrency(promoDiscount, region)}</span>
                  </div>
                ) : null}

                <div className="cart-summary-row total">
                  <strong>{t.cart.totalBill}</strong>
                  <span>{formatCurrency(total, region)}</span>
                </div>

                <button
                  type="button"
                  className="cart-summary-btn"
                  disabled={cart.length === 0}
                  onClick={handleProceedCheckout}
                >
                  {selectedAddress ? t.cart.checkout : t.cart.selectAddressFirst}
                </button>

                {!selectedAddress && cart.length > 0 ? (
                  <p style={{ fontSize: "0.8rem", color: "#e63946", textAlign: "center", margin: "10px 0 0" }}>
                    {t.cart.addressRequired}
                  </p>
                ) : null}

                <div className="cart-summary-safe">
                  <i className="fas fa-shield-alt" style={{ color: "#1d5ba0" }}></i>
                  <span>{t.cart.securePayments}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="cart-mobile-sticky">
          <div className="cart-mobile-sticky-shell">
            <div className="cart-mobile-sticky-meta">
              <div>
                <strong>{formatCurrency(total, region)}</strong>
              </div>
              <div>{selectedAddress ? selectedAddress.type : ui.noAddress}</div>
            </div>
            <button
              type="button"
              className="cart-mobile-sticky-btn"
              disabled={cart.length === 0}
              onClick={handleProceedCheckout}
            >
              <span>{stickyButtonLabel}</span>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
