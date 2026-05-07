// src/components/ChatbotPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import ChatWindow from "./ChatWindow";
import ChatSidebar from "./ChatSidebar";
import { getSessions, createSession, deleteSession } from "../services/firebaseApi";
import { useT } from "../i18n/translations";

export default function ChatbotPage({
  onGoCart,
  onGoWishlist,
  onClose,
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
  const t = useT(language);
  const [sessions, setSessions]             = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [creating, setCreating]             = useState(false);
  const [isReady, setIsReady]               = useState(false);



  const loadSessions = useCallback(async () => {
    try {
      const res = await getSessions();
      setSessions(res.data || []);
    } catch {}
  }, []);

  const startNewChat = async () => {
    setCreating(true);
    try {
      const res = await createSession();
      await loadSessions();
      setActiveSessionId(res.data.id);
      setSidebarOpen(false);
    } catch {
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadSessions();
      setIsReady(false);
      setTimeout(async () => {
        try {
          const res = await createSession();
          setActiveSessionId(res.data.id);
          await loadSessions();
        } catch {}
        setIsReady(true);
      }, 600);
    };
    init();
  }, []);

  const handleDelete = async (sessionId, e) => {
    if (e) e.stopPropagation();
    try {
      await deleteSession(sessionId);
      await loadSessions();
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setIsReady(false);
        setTimeout(async () => {
          try {
            const res = await createSession();
            setActiveSessionId(res.data.id);
            await loadSessions();
          } catch {}
          setIsReady(true);
        }, 400);
      }
    } catch {}
  };

  const ensureUid = (product) => ({
    ...product,
    _uid: product._uid || `chatbot_${(product.name || "").replace(/\s+/g, "_")}`,
  });

  const findCartItem = (product) =>
    cart.find(
      (c) =>
        c._uid === product._uid ||
        c.name?.toLowerCase() === product.name?.toLowerCase()
    );

  const handleChatAddToCart = (product) => {
    if (onAddToCart) onAddToCart(ensureUid(product));
  };

  const handleChatRemoveFromCart = (product) => {
    const existing = findCartItem(product);
    if (!existing) return;
    if (existing.quantity <= 1) {
      onRemoveFromCart && onRemoveFromCart(existing._uid);
    } else {
      onUpdateCartQty && onUpdateCartQty(existing._uid, existing.quantity - 1);
    }
  };

  const handleChatRemoveAllFromCart = (product) => {
    const existing = findCartItem(product);
    if (existing) onRemoveFromCart && onRemoveFromCart(existing._uid);
  };

  const handleClearCart = () => {
    onClearCart && onClearCart();
  };

  const handleChatToggleFavorite = (product) => {
    if (toggleWishlist) toggleWishlist(ensureUid(product));
  };

  const handleChatRemoveFromWishlist = (product) => {
    const existing = wishlist.find(
      (w) =>
        w._uid === product._uid ||
        w.name?.toLowerCase() === product.name?.toLowerCase()
    );
    if (existing && toggleWishlist) toggleWishlist(existing);
  };

  const isFavorite = (name) =>
    wishlist.some(
      (p) =>
        p.name?.toLowerCase() === name?.toLowerCase() ||
        p._uid?.includes(name)
    );

  const chatCartItems = cart.map((item) => ({
    ...item,
    qty: item.quantity || 1,
  }));

  return (
    <div style={{
      width: "100%", height: "100%",
      background: "#f0f9ff",
      display: "flex", flexDirection: "column",
      fontFamily: "'Nunito', sans-serif",
      overflow: "hidden", position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes pulseGlow { 0%,100%{opacity:1;box-shadow:0 0 6px #4ade80;} 50%{opacity:0.6;box-shadow:0 0 2px #4ade80;} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background:#bae6fd; border-radius:4px; }
        ::-webkit-scrollbar-thumb:hover { background:#7dd3fc; }
        .cb-btn { background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; position:relative; transition:background 0.15s; }
        .cb-btn:hover { background:rgba(255,255,255,0.28) !important; }
      `}</style>

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg,#0c4a6e 0%,#0369a1 55%,#0ea5e9 100%)",
        padding: "13px 14px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 3px 20px rgba(3,105,161,0.35)",
      }}>
        {/* Hamburger */}
        <button className="cb-btn" onClick={() => setSidebarOpen(true)}
          title="Chat history"
          style={{ padding: "8px 10px", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:"18px", height:"2px", background:"white", borderRadius:"2px" }} />
          ))}
        </button>

        {/* Brand */}
        <div style={{ display:"flex", alignItems:"center", gap:"9px" }}>
          <div>
            <div style={{ color:"white", fontWeight:900, fontSize:"15px" }}>{t.chatbot.name}</div>
            <div style={{ color:"rgba(255,255,255,0.85)", fontSize:"10px", fontWeight:600, display:"flex", alignItems:"center", gap:"5px" }}>
              {isReady ? (
                <>
                  <span style={{ width:"6px", height:"6px", background:"#4ade80", borderRadius:"50%", display:"inline-block", animation:"pulseGlow 2s infinite" }} />
                  {t.chatbot.assistance}
                </>
              ) : (
                <>
                  <span style={{ width:"6px", height:"6px", background:"#fbbf24", borderRadius:"50%", display:"inline-block" }} />
                  {t.chatbot.connecting}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Close button only */}
        <button
          className="cb-btn"
          onClick={onClose}
          title="Close chat"
          style={{ padding:"8px 11px", background:"rgba(255,255,255,0.1)", borderColor:"rgba(255,255,255,0.2)", flexShrink:0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* CHAT WINDOW */}
      <div style={{ flex:1, minHeight:0, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <ChatWindow
          sessionId={activeSessionId}
          onNewMessage={loadSessions}
          isReady={isReady}
          onAddToCart={handleChatAddToCart}
          onRemoveFromCart={handleChatRemoveFromCart}
          onRemoveAllFromCart={handleChatRemoveAllFromCart}
          onClearCart={handleClearCart}
          onToggleFavorite={handleChatToggleFavorite}
          onRemoveFromWishlist={handleChatRemoveFromWishlist}
          isFavorite={isFavorite}
          cartItems={chatCartItems}
          wishlistItems={wishlist}
          language={language}
          region={region}
        />
      </div>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          creating={creating}
          onNewChat={startNewChat}
          onSelectSession={(id) => { setActiveSessionId(id); setSidebarOpen(false); }}
          onDeleteSession={handleDelete}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
