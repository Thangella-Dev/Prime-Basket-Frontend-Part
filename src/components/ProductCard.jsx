// src/components/ProductCard.jsx
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import "./ProductCard.css";
import { enhanceProduct, getProductPrices, formatCurrency } from "../utils/productUtils";
import { getLocalizedProductName } from "../utils/translationUtils";
import { Heart, ShoppingBasket, ChevronDown, Check, X } from 'lucide-react';

export default function ProductCard({ 
  p: rawProduct, 
  onAddCart, 
  onDecreaseCart, 
  cart = [], 
  wishlist = [], 
  toggleWishlist, 
  t, 
  region = "in",
  onOpenProduct,
}) {
  // Enhance product with dynamic units
  const p = useMemo(() => enhanceProduct(rawProduct, region), [rawProduct, region]);
  
  const [selectedUnit, setSelectedUnit] = useState(p.baseUnit);
  const [showModal, setShowModal] = useState(false);
  const suppressOpenUntilRef = useRef(0);
  const cardRef = useRef(null);
  const unitTriggerRef = useRef(null);
  const desktopPopoverRef = useRef(null);
  const [isDesktopPopover, setIsDesktopPopover] = useState(false);
  const [desktopPopoverStyle, setDesktopPopoverStyle] = useState(null);

  const prices = useMemo(() => getProductPrices(p, selectedUnit), [p, selectedUnit]);
  const translatedName = getLocalizedProductName(p.name, t);
  
  // Find item in cart based on both product ID AND selected unit
  const cartItem = cart.find(c => c._uid === p._uid && c.selectedUnit === selectedUnit);
  const qty = cartItem ? cartItem.quantity : 0;
  
  const isWished = wishlist.some(w => w._uid === p._uid);

  const handleAdd = (e, unitOverride = selectedUnit) => {
    e.stopPropagation();
    onAddCart && onAddCart({
      ...p,
      selectedUnit: unitOverride,
      price: getProductPrices(p, unitOverride).price
    });
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    onDecreaseCart && onDecreaseCart({
      ...p,
      selectedUnit
    });
  };

  const openUnitModal = (e) => {
    e.stopPropagation();
    setShowModal(true);
  };

  const selectUnit = (unitLabel) => {
    setSelectedUnit(unitLabel);
  };

  const closeUnitModal = (event) => {
    if (event) {
      event.stopPropagation();
    }
    suppressOpenUntilRef.current = Date.now() + 260;
    setShowModal(false);
  };

  const updateDesktopPopoverPosition = useCallback(() => {
    const trigger = unitTriggerRef.current;
    if (!trigger || typeof window === "undefined") return;
    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const width = Math.min(Math.max(rect.width, 228), 320);
    const maxLeft = window.innerWidth - width - viewportPadding;
    const left = Math.max(viewportPadding, Math.min(rect.left, maxLeft));
    const top = Math.min(rect.bottom + 10, window.innerHeight - viewportPadding);
    setDesktopPopoverStyle({
      position: "fixed",
      top,
      left,
      width,
      zIndex: 100070,
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncPopoverMode = () => {
      const supportsDesktopPopover = window.matchMedia("(min-width: 1180px) and (hover: hover) and (pointer: fine)").matches;
      const cardWidth = cardRef.current?.offsetWidth || 0;
      setIsDesktopPopover(supportsDesktopPopover && cardWidth >= 220);
    };
    syncPopoverMode();
    window.addEventListener("resize", syncPopoverMode);
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && cardRef.current
        ? new ResizeObserver(syncPopoverMode)
        : null;
    resizeObserver?.observe(cardRef.current);
    return () => {
      window.removeEventListener("resize", syncPopoverMode);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!showModal || !isDesktopPopover) return undefined;
    updateDesktopPopoverPosition();

    const handleClickAway = (event) => {
      const insideCard = cardRef.current?.contains(event.target);
      const insidePopover = desktopPopoverRef.current?.contains(event.target);
      if (!insideCard && !insidePopover) {
        closeUnitModal();
      }
    };

    const handleViewportChange = () => {
      updateDesktopPopoverPosition();
    };

    document.addEventListener("mousedown", handleClickAway);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [showModal, isDesktopPopover, updateDesktopPopoverPosition]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const shouldHideChatbot = showModal && !isDesktopPopover;
    document.body.classList.toggle("prime-quantity-open", shouldHideChatbot);
    return () => {
      document.body.classList.remove("prime-quantity-open");
    };
  }, [showModal, isDesktopPopover]);

  const quantityPicker = (
    <>
      <div className="unit-modal-header">
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <img src={p.imageUrl} alt={p.name} style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 8, background: "#f8f9fa", padding: 4 }} />
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#253d4e", margin: 0 }}>{t.product.selectQuantity || "Select Quantity"}</h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{translatedName}</p>
          </div>
        </div>
        <button className="unit-modal-close" onClick={closeUnitModal}>
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="unit-list">
        {p.units.map((u, idx) => {
          const uPrices = getProductPrices(p, u.label);
          const isSelected = selectedUnit === u.label;
          const isBestValue = idx === p.units.length - 1 && p.units.length > 2;

          return (
            <div
              key={u.label}
              className={`unit-item ${isSelected ? "selected" : ""}`}
              onClick={() => selectUnit(u.label)}
            >
              <div className="unit-item-info">
                <span className="unit-item-label">{u.label}</span>
                <div className="unit-item-price-section">
                  <span className="unit-item-price">{formatCurrency(uPrices.price, region)}</span>
                  {uPrices.originalPrice > uPrices.price && (
                    <span className="unit-item-old-price">{formatCurrency(uPrices.originalPrice, region)}</span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {isBestValue && <span className="best-value-badge">{t.product.bestValue || "Best Value"}</span>}
                <div className={`unit-checkbox ${isSelected ? "checked" : ""}`}>
                  {isSelected && <Check size={14} strokeWidth={3} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="unit-modal-footer">
        <button className="unit-done-btn" type="button" onClick={closeUnitModal}>{t.product.done || "Done"}</button>
        <button
          className="unit-add-btn"
          type="button"
          onClick={(e) => {
            handleAdd(e, selectedUnit);
            closeUnitModal(e);
          }}
        >
          {t.home.add || "ADD"} TO CART
        </button>
      </div>
    </>
  );

  return (
    <div
      ref={cardRef}
      className="pcard-v2"
      onClick={() => {
        if (Date.now() < suppressOpenUntilRef.current) return;
        if (onOpenProduct) {
          onOpenProduct(p);
        } else {
          window.dispatchEvent(new CustomEvent("open-product", { detail: p }));
        }
      }}
    >
      {/* Badges */}
      <div style={{ position: "absolute", top: 10, left: 0, display: "flex", flexDirection: "column", gap: 5, zIndex: 2, alignItems: "flex-start" }}>
        {p.badge && (
          <span className={`pbadge-v2 ${p.badge.toLowerCase()}`}>
            {p.badge}
          </span>
        )}
        {prices.discountPercent > 0 && (
          <span className="pbadge-v2 discount">
            {prices.discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button 
        className={`pwish-v2 ${isWished ? "active" : ""}`}
        onClick={(e) => { e.stopPropagation(); toggleWishlist && toggleWishlist(p); }}
      >
        <Heart size={18} fill={isWished ? "currentColor" : "none"} stroke={isWished ? "#ff3b81" : "currentColor"} color={isWished ? "#ff3b81" : "currentColor"} />
      </button>

      {/* Product Image */}
      <div className="pimg-v2">
        <img src={p.imageUrl} alt={p.name} loading="lazy" />
      </div>

      {/* Content */}
      <div className="pbrand-v2">{p.brand}</div>
      <div className="pname-v2">{translatedName}</div>
      {(p.stars != null || p.reviews != null) && (
        <div className="prating-v2">
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }}>
            <span style={{ color: "#ffc107" }}>★</span>
            <span>{p.stars || "4.0"}</span>
            {p.reviews != null ? <small>({p.reviews})</small> : null}
          </span>
        </div>
      )}

      {/* Unit Selector */}
      <div className="unit-selector-wrap">
        <div ref={unitTriggerRef} className="unit-selector-btn" onClick={openUnitModal}>
          <span>{selectedUnit}</span>
          <ChevronDown size={10} strokeWidth={2} />
        </div>
        {showModal && isDesktopPopover && desktopPopoverStyle ? createPortal(
          <div
            ref={desktopPopoverRef}
            className="unit-desktop-popover"
            style={desktopPopoverStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {quantityPicker}
          </div>,
          document.body
        ) : null}
      </div>

      {/* Prices */}
      <div className="pprice-v2">
        <span className="pnew-v2">{formatCurrency(prices.price, region)}</span>
        {prices.originalPrice > prices.price && (
          <span className="pold-v2">{formatCurrency(prices.originalPrice, region)}</span>
        )}
      </div>

      {/* Action Button */}
      <div className="p-action-row-v2" onClick={(e) => e.stopPropagation()}>
        {qty > 0 ? (
          <div className="qty-v2">
            <button className="qty-btn-v2" onClick={handleDecrease}>-</button>
            <span className="qty-val-v2">{qty}</span>
            <button className="qty-btn-v2" onClick={handleAdd}>+</button>
          </div>
        ) : (
          <button className="padd-v2" onClick={handleAdd}>
            <ShoppingBasket size={16} strokeWidth={2} style={{ marginRight: 8 }} />
            {t.home.add || "ADD"}
          </button>
        )}
      </div>

      {/* Unit Selection Modal */}
      {showModal && !isDesktopPopover && createPortal(
        <div
          className="unit-modal-overlay"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            closeUnitModal(e);
          }}
        >
          <div className="unit-modal-content" onClick={(e) => e.stopPropagation()}>
            {quantityPicker}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
