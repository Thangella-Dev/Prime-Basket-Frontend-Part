import React, { useEffect, useMemo, useState } from "react";
import ChatbotPage from "./ChatbotPage";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";

class PrimeChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("PrimeBot panel crashed:", error);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#f8fbff",
            color: "#12314f",
          }}
        >
          <div
            style={{
              padding: "16px 18px",
              background: "linear-gradient(135deg,#0c4a6e 0%,#0369a1 55%,#0ea5e9 100%)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "15px",
            }}
          >
            PrimeBot
          </div>
          <div
            style={{
              flex: 1,
              padding: "22px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 800 }}>Chat needs a quick refresh.</div>
            <div style={{ fontSize: "13px", lineHeight: 1.6, maxWidth: "280px", color: "#4b6480" }}>
              The assistant hit a temporary issue. Reopen it to continue shopping help.
            </div>
            <button
              type="button"
              onClick={this.props.onRetry}
              style={{
                border: "none",
                borderRadius: "999px",
                padding: "11px 18px",
                background: "#0f5bd7",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Reopen chat
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ChatbotWidget({
  currentPage = "home",
  onGoCart,
  onGoWishlist,
  cart = [],
  wishlist = [],
  onAddToCart,
  toggleWishlist,
  onRemoveFromCart,
  onUpdateCartQty,
  onClearCart,
  language = "en",
  region = "in",
}) {
  const [open, setOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [nearFooter, setNearFooter] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [panelKey, setPanelKey] = useState(0);

  const isHome = currentPage === "home";
  const isCheckoutFlow = currentPage === "cart" || currentPage === "payment";

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const syncDrawerState = () => {
      setDrawerOpen(document.body.classList.contains("prime-drawer-open"));
      setAuthModalOpen(document.body.classList.contains("prime-auth-open"));
    };

    syncDrawerState();
    const observer = new MutationObserver(syncDrawerState);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let scrollStopTimer = null;

    const handleScroll = () => {
      const nextScrollY = window.scrollY || 0;
      const doc = document.documentElement;
      const viewportHeight = window.innerHeight || 0;
      const fullHeight = doc.scrollHeight || 0;
      const nearBottom = nextScrollY + viewportHeight >= fullHeight - 220;
      const footer = document.querySelector(".footer");
      const footerRect = footer?.getBoundingClientRect();
      const isNearFooter = footerRect ? footerRect.top <= viewportHeight - 80 : false;

      setShowScrollTop(nearBottom);
      setNearFooter(isNearFooter);
      setIsUserScrolling(true);
      if (scrollStopTimer) clearTimeout(scrollStopTimer);
      scrollStopTimer = setTimeout(() => setIsUserScrolling(false), 180);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      if (scrollStopTimer) clearTimeout(scrollStopTimer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (drawerOpen || authModalOpen) {
      setOpen(false);
    }
  }, [authModalOpen, drawerOpen]);

  useEffect(() => {
    if (open) {
      lockBodyScroll("chatbot-panel");
    } else {
      unlockBodyScroll("chatbot-panel");
    }

    return () => {
      unlockBodyScroll("chatbot-panel");
    };
  }, [open]);

  useEffect(() => {
    const handleOpenChatbot = () => {
      if (authModalOpen) return;
      setOpen(true);
    };

    window.addEventListener("open-chatbot", handleOpenChatbot);
    return () => window.removeEventListener("open-chatbot", handleOpenChatbot);
  }, [authModalOpen]);

  const showChatLauncher = useMemo(
    () => isHome && !open && !isUserScrolling && !nearFooter && !drawerOpen && !authModalOpen,
    [authModalOpen, drawerOpen, isHome, open, isUserScrolling, nearFooter]
  );

  const showTopButton = useMemo(
    () => !isCheckoutFlow && !open && showScrollTop && !drawerOpen && !authModalOpen,
    [authModalOpen, drawerOpen, isCheckoutFlow, open, showScrollTop]
  );

  return (
    <>
      <style>{`
        @keyframes primeBotFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes primeBotPulse {
          0% { transform: scale(0.92); opacity: 0.22; }
          70% { transform: scale(1.26); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes primeBotGlow {
          0%, 100% { box-shadow: 0 18px 38px rgba(15,91,215,0.24); }
          50% { box-shadow: 0 24px 44px rgba(68,196,212,0.28); }
        }
        @keyframes primeBotHint {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .prime-float-stack {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 99996;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }
        body.prime-auth-open .prime-float-stack {
          opacity: 0;
          pointer-events: none;
        }
        .prime-chat-trigger {
          position: relative;
          width: 58px;
          height: 58px;
          border: none;
          border-radius: 22px;
          cursor: pointer;
          background:
            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.86), rgba(255,255,255,0) 34%),
            linear-gradient(135deg, #0f5bd7 0%, #1f7ae0 46%, #44c4d4 100%);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 18px 38px rgba(15,91,215,0.24);
          animation: primeBotFloat 3.2s ease-in-out infinite, primeBotGlow 2.8s ease-in-out infinite;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          overflow: visible;
        }
        .prime-chat-trigger::before,
        .prime-chat-trigger::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 24px;
          border: 1px solid rgba(68,196,212,0.3);
          animation: primeBotPulse 2.8s ease-out infinite;
        }
        .prime-chat-trigger::after {
          animation-delay: 1.2s;
        }
        .prime-chat-trigger:hover {
          transform: translateY(-2px) scale(1.03);
        }
        .prime-chat-core {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.22);
        }
        .prime-chat-core i {
          font-size: 1rem;
          filter: drop-shadow(0 6px 10px rgba(0,0,0,0.14));
          color: #ffffff;
        }
        .prime-chat-status {
          position: absolute;
          right: 4px;
          bottom: 4px;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #7CFFB2;
          border: 2px solid #fff;
          box-shadow: 0 0 0 6px rgba(124,255,178,0.16);
        }
        .prime-chat-label {
          position: absolute;
          right: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          white-space: nowrap;
          border-radius: 999px;
          padding: 8px 12px;
          background: rgba(255,255,255,0.94);
          color: #12233f;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          border: 1px solid rgba(148,163,184,0.16);
          box-shadow: 0 16px 30px rgba(15,23,42,0.09);
          animation: primeBotHint 2.6s ease-in-out infinite;
        }
        .prime-chat-label::after {
          content: "";
          position: absolute;
          right: -6px;
          top: 50%;
          width: 12px;
          height: 12px;
          background: rgba(255,255,255,0.94);
          border-right: 1px solid rgba(148,163,184,0.16);
          border-bottom: 1px solid rgba(148,163,184,0.16);
          transform: translateY(-50%) rotate(-45deg);
        }
        .prime-chat-label-full {
          display: inline;
        }
        .prime-scroll-top {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          border: 1px solid rgba(148,163,184,0.16);
          background: rgba(255,255,255,0.95);
          color: #12233f;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 18px 34px rgba(15,23,42,0.12);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
        }
        .prime-scroll-top:hover {
          transform: translateY(-2px);
          color: #0f5bd7;
          box-shadow: 0 22px 40px rgba(15,23,42,0.16);
        }
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(14px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .prime-chat-panel {
          position: fixed;
          top: 82px;
          right: 24px;
          bottom: 24px;
          width: min(400px, calc(100vw - 24px));
          z-index: 99997;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 28px 60px rgba(15,23,42,0.24);
          animation: chatSlideIn 0.24s ease-out;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 768px) {
          .prime-float-stack {
            right: 14px;
            bottom: 14px;
            gap: 10px;
          }
          .prime-chat-trigger {
            width: 50px;
            height: 50px;
            border-radius: 18px;
          }
          .prime-chat-core {
            width: 41px;
            height: 41px;
            border-radius: 14px;
          }
          .prime-chat-label {
            display: inline-flex;
            align-items: center;
            right: 0;
            top: auto;
            bottom: calc(100% + 10px);
            transform: none;
            padding: 6px 10px;
            font-size: 0.66rem;
          }
          .prime-chat-label::after {
            right: 14px;
            top: auto;
            bottom: -6px;
            transform: rotate(45deg);
          }
          .prime-chat-label-full {
            display: none;
          }
          .prime-scroll-top {
            width: 36px;
            height: 36px;
            border-radius: 12px;
          }
          .prime-chat-panel {
            top: 76px;
            right: 12px;
            left: 12px;
            bottom: 12px;
            width: auto;
            border-radius: 18px;
          }
        }
      `}</style>

      <div className="prime-float-stack">
        {showTopButton && (
          <button
            type="button"
            className="prime-scroll-top"
            aria-label="Back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <i className="fas fa-chevron-up"></i>
          </button>
        )}

        {showChatLauncher && (
          <button
            type="button"
            className="prime-chat-trigger"
            onClick={() => setOpen(true)}
            title="PrimeBot Assistant"
            aria-label="Open PrimeBot assistant"
          >
            <span className="prime-chat-label">
              Ask<span className="prime-chat-label-full"> PrimeBot</span>
            </span>
            <span className="prime-chat-core">
              <i className="fas fa-comment-dots"></i>
              <span className="prime-chat-status"></span>
            </span>
          </button>
        )}
      </div>

      {open && (
        <div className="prime-chat-panel">
          <PrimeChatErrorBoundary
            resetKey={panelKey}
            onRetry={() => {
              setOpen(false);
              setPanelKey((value) => value + 1);
              window.setTimeout(() => setOpen(true), 80);
            }}
          >
            <ChatbotPage
              onGoCart={onGoCart}
              onGoWishlist={onGoWishlist}
              onClose={() => setOpen(false)}
              cart={cart}
              wishlist={wishlist}
              onAddToCart={onAddToCart}
              toggleWishlist={toggleWishlist}
              onRemoveFromCart={onRemoveFromCart}
              onUpdateCartQty={onUpdateCartQty}
              onClearCart={onClearCart}
              language={language}
              region={region}
            />
          </PrimeChatErrorBoundary>
        </div>
      )}
    </>
  );
}
