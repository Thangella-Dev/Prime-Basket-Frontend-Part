import React, { useMemo, useState } from "react";
import { useTracking } from "../context/TrackingContext";

const DISMISSED_DELIVERY_PROMPTS_KEY = "pb_dismissed_delivery_prompts";

function readDismissedPrompts() {
  try {
    const stored = JSON.parse(localStorage.getItem(DISMISSED_DELIVERY_PROMPTS_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveDismissedPrompt(orderId) {
  if (!orderId) return;
  const next = Array.from(new Set([...readDismissedPrompts(), orderId]));
  localStorage.setItem(DISMISSED_DELIVERY_PROMPTS_KEY, JSON.stringify(next));
}

function hasOrderReview(orderId) {
  if (!orderId) return false;
  try {
    const reviews = JSON.parse(localStorage.getItem("pb_order_reviews") || "[]");
    return Array.isArray(reviews) && reviews.some((review) => review?.orderId === orderId);
  } catch {
    return false;
  }
}

export default function TrackingPopup({
  currentPage = "home",
  onOpenTracking,
  onOpenRating,
  onOpenOrderHelp,
}) {
  const { activeOrder, completedOrder, setCompletedOrder } = useTracking();
  const [dismissTick, setDismissTick] = useState(0);

  const isTrackingVisible = Boolean(activeOrder && activeOrder.status !== "Delivered");
  const showDeliveredPrompt = useMemo(() => {
    if (currentPage !== "home" || !completedOrder?.orderId) return false;
    return !readDismissedPrompts().includes(completedOrder.orderId) && !hasOrderReview(completedOrder.orderId);
  }, [completedOrder?.orderId, currentPage, dismissTick]);

  React.useEffect(() => {
    if (typeof document === "undefined") return undefined;
    document.body.classList.toggle("prime-delivery-prompt-open", showDeliveredPrompt);
    return () => {
      document.body.classList.remove("prime-delivery-prompt-open");
    };
  }, [showDeliveredPrompt]);

  if (!isTrackingVisible && !showDeliveredPrompt) return null;

  const dismissDeliveredPrompt = () => {
    if (completedOrder?.orderId) {
      saveDismissedPrompt(completedOrder.orderId);
      setDismissTick((prev) => prev + 1);
    }
    setCompletedOrder(null);
  };

  if (showDeliveredPrompt) {
    return (
      <div
        style={{
          position: "fixed",
          left: "18px",
          bottom: "18px",
          zIndex: 99994,
          width: "min(360px, calc(100vw - 28px))",
          borderRadius: "24px",
          overflow: "hidden",
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(240,247,255,0.98) 52%, rgba(236,250,242,0.98) 100%)",
          border: "1px solid rgba(148,163,184,0.2)",
          boxShadow: "0 24px 52px rgba(15,23,42,0.16)",
          backdropFilter: "blur(20px)",
        }}
      >
        <style>{`
          @keyframes primeTrackingFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .prime-tracking-card {
            animation: primeTrackingFloat 3.2s ease-in-out infinite;
          }
          .prime-tracking-btn {
            border: none;
            border-radius: 14px;
            font-weight: 800;
            cursor: pointer;
            transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
          }
          .prime-tracking-btn:hover {
            transform: translateY(-1px);
          }
          @media (max-width: 768px) {
            .prime-tracking-shell {
              left: 12px !important;
              right: 12px !important;
              width: auto !important;
              bottom: calc(118px + env(safe-area-inset-bottom, 0px)) !important;
            }
          }
        `}</style>
        <div className="prime-tracking-card prime-tracking-shell">
          <div
            style={{
              padding: "16px 18px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", gap: "12px", minWidth: 0 }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "18px",
                  background: "linear-gradient(135deg, #16a34a, #22c55e)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 16px 28px rgba(34,197,94,0.22)",
                  flexShrink: 0,
                }}
              >
                <i className="fas fa-check" style={{ fontSize: "18px" }}></i>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "11px", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#16a34a" }}>
                  Delivered successfully
                </div>
                <div style={{ marginTop: "4px", fontSize: "16px", fontWeight: 800, color: "#163253" }}>
                  How was order #{completedOrder.orderId}?
                </div>
                <div style={{ marginTop: "6px", fontSize: "12.5px", lineHeight: 1.55, color: "#5b708d" }}>
                  Rate your delivery experience or ask PrimeBot about any issue with this order.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissDeliveredPrompt}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "12px",
                border: "1px solid rgba(148,163,184,0.24)",
                background: "rgba(255,255,255,0.9)",
                color: "#64748b",
                cursor: "pointer",
                flexShrink: 0,
              }}
              aria-label="Dismiss delivery prompt"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              padding: "0 18px 18px",
            }}
          >
            <button
              type="button"
              className="prime-tracking-btn"
              onClick={() => {
                onOpenRating?.(completedOrder);
                dismissDeliveredPrompt();
              }}
              style={{
                padding: "13px 14px",
                background: "linear-gradient(135deg, #1d5ba0, #2563eb)",
                color: "#fff",
                boxShadow: "0 14px 24px rgba(29,91,160,0.22)",
              }}
            >
              <i className="fas fa-star" style={{ marginRight: "8px" }}></i>
              Rate now
            </button>
            <button
              type="button"
              className="prime-tracking-btn"
              onClick={() => {
                onOpenOrderHelp?.(completedOrder);
                dismissDeliveredPrompt();
              }}
              style={{
                padding: "13px 14px",
                background: "rgba(255,255,255,0.92)",
                color: "#1d5ba0",
                border: "1px solid rgba(147,197,253,0.76)",
                boxShadow: "0 12px 22px rgba(15,23,42,0.08)",
              }}
            >
              <i className="fas fa-comment-dots" style={{ marginRight: "8px" }}></i>
              Ask about order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="prime-tracking-shell"
      onClick={onOpenTracking}
      style={{
        position: "fixed",
        bottom: "18px",
        left: "18px",
        zIndex: 99994,
        width: "min(300px, calc(100vw - 28px))",
        cursor: "pointer",
      }}
    >
      <style>{`
        @keyframes primeTrackingPulse {
          0%, 100% { transform: translateY(0); box-shadow: 0 22px 42px rgba(15,91,215,0.24); }
          50% { transform: translateY(-4px); box-shadow: 0 26px 48px rgba(15,91,215,0.3); }
        }
        .prime-tracking-bubble {
          animation: primeTrackingPulse 2.9s ease-in-out infinite;
        }
        @media (max-width: 768px) {
          .prime-tracking-shell {
            left: 12px !important;
            right: auto !important;
            width: min(284px, calc(100vw - 24px)) !important;
            bottom: calc(112px + env(safe-area-inset-bottom, 0px)) !important;
          }
        }
      `}</style>
      <div
        className="prime-tracking-bubble"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 14px",
          borderRadius: "20px",
          background: "linear-gradient(135deg, #0f5bd7, #1f7ae0 46%, #44c4d4 100%)",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 22px 42px rgba(15,91,215,0.24)",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.16)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <i className="fas fa-truck" style={{ fontSize: "15px" }}></i>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.82 }}>
            Order update
          </div>
          <div style={{ fontSize: "13px", fontWeight: 800, marginTop: "1px", lineHeight: 1.2 }}>
            {activeOrder.status}
          </div>
          <div style={{ fontSize: "11px", opacity: 0.86, marginTop: "2px", lineHeight: 1.35 }}>
            Track order #{activeOrder.orderId}
          </div>
        </div>
        <div
          style={{
            padding: "7px 10px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.18)",
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
          }}
        >
          Track
        </div>
      </div>
    </div>
  );
}
