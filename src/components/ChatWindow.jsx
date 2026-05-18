import React, { useState, useRef, useEffect, useCallback } from "react";
import { chatWithGroq } from "../services/groqService";
import {
  getMessages,
  saveUserMessage,
  saveBotMessage,
} from "../services/firebaseApi";
import { useT, translations } from "../i18n/translations";
import { formatCurrency, resolveProductImage } from "../utils/productUtils";

// ── Telugu product name map ────────────────────────────────────────────────────
const TELUGU_NAMES = {
  Tomatoes: "టమోటాలు",
  Onions: "ఉల్లిపాయలు",
  Potatoes: "బంగాళాదుంపలు",
  Spinach: "పాలకూర",
  Broccoli: "బ్రొకలీ",
  Carrots: "క్యారెట్లు",
  Bananas: "అరటిపండ్లు",
  "Red Apples": "ఎర్ర యాపిల్స్",
  Mangoes: "మామిడిపండ్లు",
  Grapes: "ద్రాక్షపండ్లు",
  Watermelon: "పుచ్చకాయ",
  Strawberries: "స్ట్రాబెర్రీలు",
  "Full Cream Milk": "పూర్తి క్రీమ్ పాలు",
  Curd: "పెరుగు",
  Paneer: "పనీర్",
  Butter: "వెన్న",
  Eggs: "గుడ్లు",
  Cheese: "చీజ్",
  "Basmati Rice": "బాస్మతి బియ్యం",
  "Whole Wheat Atta": "గోధుమ పిండి",
  Oats: "వోట్స్",
  Poha: "అటుకులు",
  "Toor Dal": "కంది పప్పు",
  "Moong Dal": "పెసర పప్పు",
  "Chana Dal": "శనగ పప్పు",
  "Turmeric Powder": "పసుపు పొడి",
  "Red Chilli Powder": "ఎర్ర మిర్చి పొడి",
  "Cumin Seeds": "జీలకర్ర",
  "Garam Masala": "గరం మసాలా",
  "Sunflower Oil": "సూర్యకాంతి నూనె",
  "Olive Oil": "ఆలివ్ నూనె",
  "Mustard Oil": "ఆవాల నూనె",
  "Green Tea": "గ్రీన్ టీ",
  "Instant Coffee": "ఇన్‌స్టంట్ కాఫీ",
  "Orange Juice": "నారంజ రసం",
  Biscuits: "బిస్కెట్లు",
  "Maggi Noodles": "మేగీ నూడుల్స్",
  "Potato Chips": "బంగాళాదుంప చిప్స్",
  Bread: "బ్రెడ్",
  Cake: "కేక్",
};

const KE_NAMES = {
  Tomatoes: "Nyanya",
  Onions: "Kitunguu",
  Potatoes: "Viazi",
  Spinach: "Mchicha",
  Broccoli: "Brokoli",
  Carrots: "Karoti",
  Bananas: "Ndizi",
  "Red Apples": "Matofaa Mekundu",
  Mangoes: "Embe",
  Grapes: "Zabibu",
  Watermelon: "Tikiti Maji",
  Strawberries: "Strawberi",
  "Full Cream Milk": "Maziwa ya Krimu",
  Curd: "Mtindi",
  Paneer: "Jibini",
  Butter: "Siagi",
  Eggs: "Mayai",
  Cheese: "Jibini",
  "Basmati Rice": "Mchele wa Basmati",
  "Whole Wheat Atta": "Unga wa Ngano",
  Oats: "Oti",
  Poha: "Poha",
  "Toor Dal": "Dengu",
  "Moong Dal": "Dengu",
  "Chana Dal": "Dengu",
  "Turmeric Powder": "Bizari",
  "Red Chilli Powder": "Pilipili",
  "Cumin Seeds": "Bizari",
  "Garam Masala": "Viungo",
  "Sunflower Oil": "Mafuta ya Alizeti",
  "Olive Oil": "Mafuta ya Zeituni",
  "Mustard Oil": "Mafuta ya Haradali",
  "Green Tea": "Chai ya Kijani",
  "Instant Coffee": "Kahawa ya Papo hapo",
  "Orange Juice": "Juisi ya Chungwa",
  Biscuits: "Biskuti",
  "Maggi Noodles": "Noodles za Maggi",
  "Potato Chips": "Chips za Viazi",
  Bread: "Mkate",
  Cake: "Keki",
};

const TE = {
  tryAsking: "ఇలా అడగండి",
  soundOn: "🔊 శబ్దం ఆన్",
  muted: "🔇 మ్యూట్",
  placeholder: "అడగండి, కార్ట్‌కు జొడించండి...",
  listening: "🎙️ వింటున్నాను... మాట్లాడండి",
  poweredBy: "PrimeBasket AI ద్వారా",
  productsFound: (n) => `${n} ఉత్పత్తులు దొరికాయి`,
  addBtn: "జొడించు",
  unavailable: "అందుబాటులో లేదు",
  welcome: (
    <>
      👋 నమస్కారం! నేను <strong>PrimeBot</strong>, మీ PrimeBasket సహాయకుడిని!
      <br />
      <br />
      మీరు తెలుగులో లేదా English లో మాట్లాడవచ్చు 🎙️
      <br />
      <strong>ఉత్పత్తులు చూపించు</strong>, <strong>కార్ట్‌కు జొడించు</strong>,
      లేదా <strong>ఇష్టాలు సేవ్ చేయి</strong> — చెప్పండి!
    </>
  ),
  cartAdded: (name) => `${name} కార్ట్‌కు జొడించబడింది!`,
  cartRemoved: (name) => `${name} కార్ట్ నుండి తీసివేయబడింది!`,
  qtyIncreased: (name, qty) => `${name} పరిమాణం ${qty}కు పెరిగింది!`,
  qtyDecreased: (name, qty) => `${name} పరిమాణం ${qty}కు తగ్గింది!`,
};
const EN = {
  tryAsking: "Try asking",
  soundOn: "🔊 Sound On",
  muted: "🔇 Muted",
  placeholder: "Ask, add to cart, save to favorites...",
  listening: "🎙️ Listening... speak now",
  poweredBy: "Powered by PrimeBasket AI",
  productsFound: (n) => `${n} product${n !== 1 ? "s" : ""} found`,
  addBtn: "Add",
  unavailable: "Unavailable",
  welcome: (
    <>
      👋 Hey! I'm <strong>PrimeBot</strong>, your PrimeBasket grocery assistant!
      <br />
      <br />
      How can I help you today? 🎙️
      <br />
      <strong>show products</strong>, <strong>add to cart</strong>, or{" "}
      <strong>save favorites</strong> — just say it!
    </>
  ),
  cartAdded: (name) => `${name} added to cart!`,
  cartRemoved: (name) => `${name} removed from cart!`,
  qtyIncreased: (name, qty) => `${name} quantity increased to ${qty}!`,
  qtyDecreased: (name, qty) => `${name} quantity decreased to ${qty}!`,
};

const KE = {
  tryAsking: "Jaribu kuuliza",
  soundOn: "🔊 Sauti Ipo",
  muted: "🔇 Kimya",
  placeholder: "Uliza, ongeza kwenye kikapu, hifadhi mapendeleo...",
  listening: "🎙️ Nasikiliza... ongea sasa",
  poweredBy: "Inaendeshwa na Prime-Basket AI",
  productsFound: (n) => `${n} bidhaa zimepatikana`,
  addBtn: "Ongeza",
  unavailable: "Haipatikani",
  welcome: (
    <>
      👋 Habari! Mimi ni <strong>PrimeBot</strong>, msaidizi wako wa PrimeBasket!
      <br />
      <br />
      Naweza kukusaidia vipi leo? 🎙️
      <br />
      <strong>onyesha bidhaa</strong>, <strong>ongeza kwenye kikapu</strong>,
      au <strong>hifadhi mapendeleo</strong> — sema tu!
    </>
  ),
  cartAdded: (name) => `${name} imeongezwa kwenye kikapu!`,
  cartRemoved: (name) => `${name} imeondolewa kwenye kikapu!`,
  qtyIncreased: (name, qty) => `Idadi ya ${name} imeongezeka hadi ${qty}!`,
  qtyDecreased: (name, qty) => `Idadi ya ${name} imepungua hadi ${qty}!`,
};

const SUGGESTIONS_EN = [
  { icon: "🥦", text: "What vegetables are available?" },
  { icon: "🥛", text: "What dairy products do you have?" },
  { icon: "🔥", text: "What are the best deals?" },
  { icon: "🛒", text: "Add all budget-friendly items to cart" },
];
const SUGGESTIONS_TE = [
  { icon: "🥦", text: "ఏ కూరగాయలు అందుబాటులో ఉన్నాయి?" },
  { icon: "🥛", text: "మీ దగ్గర ఏ పాల ఉత్పత్తులు ఉన్నాయి?" },
  { icon: "🔥", text: "ఉత్తమ ఆఫర్లు ఏమిటి?" },
  { icon: "🛒", text: "₹50 కంటే తక్కువ అన్ని వస్తువులు కార్ట్‌కు జొడించు" },
];
const SUGGESTIONS_KE = [
  { icon: "🥦", text: "Kuna mboga gani zinazopatikana?" },
  { icon: "🥛", text: "Muna bidhaa gani za maziwa?" },
  { icon: "🔥", text: "Kuna ofa gani bora leo?" },
  { icon: "🛒", text: "Ongeza bidhaa zote za bei nafuu kwenye kikapu" },
];

const BADGE_COLORS = {
  bs: { bg: "#ef4444", text: "white" },
  bh: { bg: "#f97316", text: "white" },
  bo: { bg: "#3b82f6", text: "white" },
  bn: { bg: "#22c55e", text: "white" },
  default: { bg: "#6366f1", text: "white" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseMessage(content) {
  if (!content) return { text: "", products: [], action: null };
  let remaining = content,
    products = [],
    action = null;
  const prodMatch = remaining.match(/```products\s*([\s\S]*?)```/);
  if (prodMatch) {
    try {
      products = JSON.parse(prodMatch[1].trim());
    } catch (e) {}
    remaining = remaining.replace(/```products\s*[\s\S]*?```/, "").trim();
  }
  const actMatch = remaining.match(/```action\s*([\s\S]*?)```/);
  if (actMatch) {
    try {
      action = JSON.parse(actMatch[1].trim());
    } catch (e) {}
    remaining = remaining.replace(/```action\s*[\s\S]*?```/, "").trim();
  }
  return {
    text: remaining.trim(),
    products: Array.isArray(products) ? products : [],
    action,
  };
}

function cleanForSpeech(text) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_`#~>]/g, "")
    .replace(new RegExp(String.fromCharCode(8377), "g"), " rupees ")
    .replace(/KES/gi, " Kenyan shillings ")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function speakText(text, lang) {
  const cleaned = cleanForSpeech(text);
  if (!cleaned) return;

  if (lang === "te-IN" && window.responsiveVoice) {
    // Telugu — use ResponsiveVoice
    window.responsiveVoice.cancel();
    window.responsiveVoice.speak(cleaned, "Indian English Female", {
      pitch: 1,
      rate: 0.9,
      volume: 1,
    });
    return;
  }

  // English — use browser speechSynthesis
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(cleaned);
    utter.lang = lang || "en-IN";
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(
        (v) => v.lang === "en-IN" && v.name.toLowerCase().includes("google"),
      ) ||
      voices.find((v) => v.lang === "en-IN") ||
      voices.find((v) => v.lang === "en-US") ||
      voices[0];
    if (preferred) utter.voice = preferred;
    window.speechSynthesis.speak(utter);
  }
}

// ── SpeakButton ────────────────────────────────────────────────────────────────
function SpeakButton({ text, lang, isUser }) {
  const [speaking, setSpeaking] = useState(false);
  const handle = () => {
    if (!window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const cleaned = cleanForSpeech(text);
    if (!cleaned) return;
    const doSpeak = () => {
      const utter = new SpeechSynthesisUtterance(cleaned);
      utter.lang = lang || "en-IN";
      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.volume = 1.0;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(
          (v) =>
            v.lang === (lang || "en-IN") &&
            v.name.toLowerCase().includes("google"),
        ) ||
        voices.find((v) => v.lang === (lang || "en-IN")) ||
        voices[0];
      if (preferred) utter.voice = preferred;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    };
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak();
      };
      setTimeout(doSpeak, 200);
    } else {
      doSpeak();
    }
  };
  return (
    <button
      onClick={handle}
      title={speaking ? "Stop" : "Listen"}
      style={{
        width: "26px",
        height: "26px",
        borderRadius: "50%",
        flexShrink: 0,
        background: speaking
          ? "linear-gradient(135deg,#ef4444,#f97316)"
          : isUser
            ? "rgba(255,255,255,0.22)"
            : "#e0f2fe",
        border: `1.5px solid ${speaking ? "transparent" : isUser ? "rgba(255,255,255,0.35)" : "#bae6fd"}`,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
        marginTop: "4px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.18)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {speaking ? (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="white">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isUser ? "white" : "#0369a1"}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}

// ── InlineToast ────────────────────────────────────────────────────────────────
function InlineToast({ toast }) {
  if (!toast) return null;
  const colors = {
    cart: { bg: "linear-gradient(135deg,#0369a1,#0ea5e9)", icon: "🛒" },
    remove: { bg: "linear-gradient(135deg,#64748b,#94a3b8)", icon: "🗑️" },
    fav: { bg: "linear-gradient(135deg,#e11d48,#f43f5e)", icon: "❤️" },
  };
  const c = colors[toast.type] || colors.cart;
  return (
    <div
      style={{
        margin: "0 0 6px 0",
        background: c.bg,
        color: "white",
        padding: "10px 16px",
        borderRadius: "14px",
        fontSize: "13px",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        animation: "slideUp 0.25s ease-out",
        fontFamily: "Nunito,sans-serif",
      }}
    >
      <span style={{ fontSize: "16px" }}>{c.icon}</span>
      <span>{toast.message}</span>
    </div>
  );
}

// ── Price parser: handles "₹45", "45.00", 45, "Rs.45", "$4.5" etc ──
function parsePrice(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;
  // Strip any currency symbols/letters, keep digits and decimal point
  const cleaned = String(val).replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

// ── CartDisplay ────────────────────────────────────────────────────────────────
function CartDisplay({ cartItems = [], region = "in" }) {
  if (!cartItems.length) return (
    <div style={{ padding:"12px 14px", background:"#f0f9ff", borderRadius:"12px", border:"1.5px solid #bae6fd", fontSize:"13px", color:"#64748b", textAlign:"center" }}>
      🛒 Your cart is empty
    </div>
  );
  const total = cartItems.reduce((s, i) => s + (parsePrice(i.price)||0) * (i.quantity||i.qty||1), 0);
  return (
    <div style={{ background:"linear-gradient(135deg,#f0f9ff,#e0f2fe)", border:"1.5px solid #7dd3fc", borderRadius:"16px", overflow:"hidden", marginTop:"8px" }}>
      <div style={{ padding:"10px 14px", background:"linear-gradient(135deg,#0369a1,#0ea5e9)", display:"flex", alignItems:"center", gap:"8px" }}>
        <span style={{ fontSize:"16px" }}>🛒</span>
        <span style={{ color:"white", fontWeight:800, fontSize:"13px" }}>Your Cart ({cartItems.length} item{cartItems.length!==1?"s":""})</span>
        <span style={{ color:"rgba(255,255,255,0.85)", fontSize:"11px", marginLeft:"auto", fontWeight:700 }}>Total: {formatCurrency(total, region)}</span>
      </div>
      <div style={{ padding:"10px", display:"flex", flexDirection:"column", gap:"8px", maxHeight:"320px", overflowY:"auto" }}>
        {cartItems.map((item, i) => {
          const qty = item.quantity || item.qty || 1;
          const price = parsePrice(item.price) || 0;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", background:"white", borderRadius:"12px", padding:"8px 10px", boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
              <div style={{ width:"52px", height:"52px", borderRadius:"10px", overflow:"hidden", flexShrink:0, background:"#f1f5f9", border:"1px solid #e2e8f0" }}>
                {item.imageUrl
                  ? <img src={resolveProductImage(item)} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"contain" }} onError={e=>{e.target.style.display="none";}} />
                  : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px" }}>🛒</div>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:"12.5px", color:"#1e293b", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.name}</div>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginTop:"4px" }}>
                  <span style={{ fontSize:"12px", fontWeight:800, color:"#0369a1" }}>{formatCurrency(price, region)}</span>
                  <span style={{ fontSize:"11px", color:"#94a3b8" }}>?? {qty}</span>
                </div>
              </div>
              <div style={{ fontSize:"13px", fontWeight:800, color:"#0ea5e9", flexShrink:0 }}>{formatCurrency(price * qty, region)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── WishlistDisplay ────────────────────────────────────────────────────────────
function WishlistDisplay({ wishlistItems = [], region = "in" }) {
  if (!wishlistItems.length) return (
    <div style={{ padding:"12px 14px", background:"#fff1f2", borderRadius:"12px", border:"1.5px solid #fda4af", fontSize:"13px", color:"#64748b", textAlign:"center" }}>
      ❤️ Your wishlist is empty
    </div>
  );
  return (
    <div style={{ background:"linear-gradient(135deg,#fff1f2,#fce7f3)", border:"1.5px solid #fda4af", borderRadius:"16px", overflow:"hidden", marginTop:"8px" }}>
      <div style={{ padding:"10px 14px", background:"linear-gradient(135deg,#e11d48,#f43f5e)", display:"flex", alignItems:"center", gap:"8px" }}>
        <span style={{ fontSize:"16px" }}>❤️</span>
        <span style={{ color:"white", fontWeight:800, fontSize:"13px" }}>Your Wishlist ({wishlistItems.length} item{wishlistItems.length!==1?"s":""})</span>
      </div>
      <div style={{ padding:"10px", display:"flex", flexDirection:"column", gap:"8px", maxHeight:"320px", overflowY:"auto" }}>
        {wishlistItems.map((item, i) => {
          const price = parsePrice(item.price) || 0;
          const oldPrice = parsePrice(item.oldPrice) || 0;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", background:"white", borderRadius:"12px", padding:"8px 10px", boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
              <div style={{ width:"52px", height:"52px", borderRadius:"10px", overflow:"hidden", flexShrink:0, background:"#f1f5f9", border:"1px solid #e2e8f0" }}>
                {item.imageUrl
                  ? <img src={resolveProductImage(item)} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"contain" }} onError={e=>{e.target.style.display="none";}} />
                  : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px" }}>❤️</div>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:"12.5px", color:"#1e293b", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.name}</div>
                <div style={{ display:"flex", alignItems:"center", gap:"6px", marginTop:"4px" }}>
                  <span style={{ fontSize:"12px", fontWeight:800, color:"#e11d48" }}>{formatCurrency(price, region)}</span>
                  {oldPrice > price && <span style={{ fontSize:"10px", color:"#94a3b8", textDecoration:"line-through" }}>{formatCurrency(oldPrice, region)}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ActionBanner ───────────────────────────────────────────────────────────────
function ActionBanner({ action, products, cartItems = [], wishlistItems = [], region = "in" }) {
  if (!action) return null;

  if (action.type === "SHOW_CART") return <CartDisplay cartItems={cartItems} region={region} />;
  if (action.type === "SHOW_WISHLIST") return <WishlistDisplay wishlistItems={wishlistItems} region={region} />;

  const isCart = action.type === "ADD_TO_CART";
  const items = action.products?.length ? action.products : products;
  return (
    <div
      style={{
        marginTop: "10px",
        background: isCart
          ? "linear-gradient(135deg,#e0f2fe,#f0f9ff)"
          : "linear-gradient(135deg,#fff1f2,#fce7f3)",
        border: `1.5px solid ${isCart ? "#7dd3fc" : "#fda4af"}`,
        borderRadius: "14px",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span style={{ fontSize: "22px" }}>{isCart ? "🛒" : "❤️"}</span>
      <div>
        <div
          style={{
            fontSize: "12.5px",
            fontWeight: 800,
            color: isCart ? "#0369a1" : "#e11d48",
          }}
        >
          {isCart
            ? `${items.length} item${items.length !== 1 ? "s" : ""} added to Cart!`
            : `${items.length} item${items.length !== 1 ? "s" : ""} added to Favorites!`}
        </div>
        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
          {items.map((p) => p.name).join(", ")}
        </div>
      </div>
    </div>
  );
}

// ── ProductCard ────────────────────────────────────────────────────────────────
function ProductCard({
  product,
  onAddToCart,
  onRemoveFromCart,
  onToggleFavorite,
  isFav,
  cartQty,
  onShowToast,
  isTelugu,
  language = "en",
  region = "in",
}) {
  const inStock = product.inStock !== false;
  const badgeStyle =
    BADGE_COLORS[product.badgeClass] || BADGE_COLORS["default"];
  const discount =
    product.oldPrice && product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : null;
  const unitPrice =
    typeof product.price === "number"
      ? product.price
      : parsePrice(product.price) || 0;
  const totalPrice = unitPrice * (cartQty || 1);
  const teluguName = TELUGU_NAMES[product.name];
  const L = language === "ke" ? KE : (isTelugu ? TE : EN);

  const handleAdd = (e) => {
    e.stopPropagation();
    onAddToCart && onAddToCart(product);
    const pname = language === "ke" ? (KE_NAMES[product.name] || product.name) : (isTelugu ? (TELUGU_NAMES[product.name] || product.name) : product.name);
    onShowToast && onShowToast(L.cartAdded(pname), "cart");
  };
  const handleInc = (e) => {
    e.stopPropagation();
    onAddToCart && onAddToCart(product);
    const pname = language === "ke" ? (KE_NAMES[product.name] || product.name) : (isTelugu ? (TELUGU_NAMES[product.name] || product.name) : product.name);
    onShowToast && onShowToast(L.qtyIncreased(pname, (cartQty || 0) + 1), "cart");
  };
  const handleDec = (e) => {
    e.stopPropagation();
    onRemoveFromCart && onRemoveFromCart(product);
    const pname = language === "ke" ? (KE_NAMES[product.name] || product.name) : (isTelugu ? (TELUGU_NAMES[product.name] || product.name) : product.name);
    if (cartQty <= 1) onShowToast && onShowToast(L.cartRemoved(pname), "remove");
    else onShowToast && onShowToast(L.qtyDecreased(pname, cartQty - 1), "remove");
  };

  return (
    <div
      style={{
        width: "185px",
        flexShrink: 0,
        background: "white",
        borderRadius: "18px",
        border: `1.5px solid ${cartQty > 0 ? "#7dd3fc" : "#e8f4fd"}`,
        boxShadow:
          cartQty > 0
            ? "0 4px 20px rgba(3,105,161,0.18)"
            : "0 4px 16px rgba(3,105,161,0.08)",
        overflow: "hidden",
        fontFamily: "Nunito,sans-serif",
        transition: "all 0.22s ease",
        position: "relative",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.transform = "translateY(-4px)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {product.badge && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 2,
            background: badgeStyle.bg,
            color: badgeStyle.text,
            fontSize: "9px",
            fontWeight: 800,
            padding: "3px 9px",
            borderRadius: "20px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          {product.badge}
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite && onToggleFavorite(product);
        }}
        style={{
          position: "absolute",
          top: "9px",
          right: "9px",
          zIndex: 2,
          border: "1px solid #e2e8f0",
          borderRadius: "50%",
          width: "30px",
          height: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(59,25,114,0.12)",
          transition: "all 0.2s",
          color: isFav ? "#fff" : "#333",
          fontSize: "13px",
          background: isFav ? "#e11d48" : "#fff",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {/* {isFav ? "❤️" : "🤍"} */}
        <i className="far fa-heart"></i>
      </button>

      <div
        style={{
          height: "140px",
          background: "linear-gradient(145deg,#f0f9ff,#e0f2fe)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {product.imageUrl ? (
          <>
            <img
              src={resolveProductImage(product)}
              alt={product.name}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                transition: "transform 0.35s ease",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.12))",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextSibling.style.display = "flex";
              }}
            />
            <div
              style={{
                display: "none",
                fontSize: "42px",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
              }}
            >
              🛒
            </div>
          </>
        ) : (
          <div style={{ fontSize: "42px" }}>🛒</div>
        )}
        {!inStock && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.82)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                background: "#ef4444",
                color: "white",
                fontSize: "10px",
                fontWeight: 800,
                padding: "4px 12px",
                borderRadius: "20px",
              }}
            >
              OUT OF STOCK
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: "10px 12px 12px" }}>
        <div
          style={{
            fontSize: "10px",
            color: "#94a3b8",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            marginBottom: "3px",
          }}
        >
          {product.brand}
        </div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.name}
        </div>
        {isTelugu && teluguName && (
          <div
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              color: "#0369a1",
              marginTop: "2px",
              marginBottom: "4px",
              lineHeight: 1.4,
            }}
          >
            {teluguName}
          </div>
        )}
        {!isTelugu && <div style={{ marginBottom: "4px" }} />}
        {product.quantity && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "7px",
              padding: "2px 7px",
              marginBottom: "5px",
            }}
          >
            <span
              style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a" }}
            >
              📦 {product.quantity}
            </span>
          </div>
        )}
        {product.stars && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              marginBottom: "5px",
            }}
          >
            <span style={{ color: "#f59e0b", fontSize: "11px" }}>
              {product.stars}
            </span>
            {product.reviews && (
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                ({product.reviews})
              </span>
            )}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            marginBottom: "10px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: 900, color: "#0369a1" }}>
            {formatCurrency(cartQty > 1 ? totalPrice : unitPrice, region)}
          </span>
          {cartQty > 1 && (
            <span
              style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}
            >
              ({formatCurrency(unitPrice, region)} x {cartQty})
            </span>
          )}
          {product.oldPrice && cartQty <= 1 && (
            <span
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                textDecoration: "line-through",
              }}
            >
              {formatCurrency(parsePrice(product.oldPrice), region)}
            </span>
          )}
          {discount && discount > 0 && cartQty <= 1 && (
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                color: "#16a34a",
                background: "#f0fdf4",
                padding: "2px 5px",
                borderRadius: "5px",
              }}
            >
              -{discount}%
            </span>
          )}
        </div>
        {!inStock ? (
          <button
            disabled
            style={{
              width: "100%",
              padding: "9px",
              background: "#f1f5f9",
              color: "#94a3b8",
              border: "none",
              borderRadius: "11px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "not-allowed",
              fontFamily: "Nunito,sans-serif",
            }}
          >
            {L.unavailable}
          </button>
        ) : cartQty === 0 || !cartQty ? (
          <button
            onClick={handleAdd}
            style={{
              width: "100%",
              padding: "9px 0",
              background: "linear-gradient(135deg,#0369a1,#0ea5e9)",
              color: "white",
              border: "none",
              borderRadius: "11px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "Nunito,sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s",
              boxShadow: "0 3px 10px rgba(3,105,161,0.25)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {L.add}
          </button>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f8fafc",
              borderRadius: "11px",
              padding: "3px",
              border: "1.5px solid #e2e8f0",
            }}
          >
            <button
              onClick={handleDec}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: "white",
                border: "1px solid #e2e8f0",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span
              style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}
            >
              {cartQty}
            </span>
            <button
              onClick={handleInc}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: "#0369a1",
                border: "none",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(3,105,161,0.2)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ProductRow ─────────────────────────────────────────────────────────────────
function ProductRow({
  products,
  onAddToCart,
  onRemoveFromCart,
  onToggleFavorite,
  isFavorite,
  cartItems,
  onShowToast,
  isTelugu,
  language = "en",
  region = "in",
}) {
  const L = language === "ke" ? KE : (isTelugu ? TE : EN);
  return (
    <div style={{ marginTop: "10px", width: "100%" }}>
      <div
        style={{
          fontSize: "10.5px",
          color: "#94a3b8",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.7px",
          marginBottom: "10px",
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {L.productsFound(products.length)}
      </div>
      <div
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          paddingBottom: "10px",
          scrollSnapType: "x mandatory",
        }}
      >
        {products.map((p, i) => {
          const cartQty = cartItems?.find((c) => c.name === p.name)?.qty || 0;
          return (
            <div key={i} style={{ scrollSnapAlign: "start" }}>
              <ProductCard
                product={p}
                onAddToCart={onAddToCart}
                onRemoveFromCart={onRemoveFromCart}
                onToggleFavorite={onToggleFavorite}
                isFav={isFavorite ? isFavorite(p.name) : false}
                cartQty={cartQty}
                onShowToast={onShowToast}
                isTelugu={isTelugu}
                language={language}
                region={region}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── TypingIndicator ────────────────────────────────────────────────────────────
function TypingIndicator({ language = "en" }) {
  const t = useT(language);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#0369a1,#0ea5e9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
          }}
        >
          🛒
        </div>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#0369a1" }}>
          {t.chatbot.name}
        </span>
      </div>
      <div
        style={{
          background: "white",
          borderRadius: "4px 18px 18px 18px",
          padding: "12px 18px",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          width: "fit-content",
          border: "1px solid #e0f2fe",
        }}
      >
        {[0, 200, 400].map((delay, i) => (
          <div
            key={i}
            style={{
              width: "8px",
              height: "8px",
              background: "#0ea5e9",
              borderRadius: "50%",
              animation: "dotPulse 1.4s infinite ease-in-out",
              animationDelay: `${delay}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── MessageBubble ──────────────────────────────────────────────────────────────
function MessageBubble({
  message,
  onAddToCart,
  onRemoveFromCart,
  onToggleFavorite,
  isFavorite,
  cartItems,
  wishlistItems,
  voiceLang,
  onShowToast,
  isTelugu,
  language = "en",
  region = "in",
}) {
  const t = useT(language);
  if (!message || !message.role) return null;
  const isUser = message.role === "user";
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  let { text, products, action } = isUser
    ? { text: message.content, products: [], action: null }
    : parseMessage(message.content);

  // Filter products for Kenya locale
  if (!isUser && language === "ke" && products.length > 0) {
    const pt = translations.ke.products || {};
    const transKeys = Object.keys(pt).map(k => k.toLowerCase());
    products = products.filter(p => {
      const name = (p.name || "").toLowerCase();
      return transKeys.some(k => name.includes(k));
    });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: "4px",
        animation: "slideUp 0.2s ease-out",
      }}
    >
      {!isUser && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#0369a1,#0ea5e9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
            }}
          >
            🛒
          </div>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#0369a1" }}>
            {t.chatbot.name}
          </span>
        </div>
      )}
      {text && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "6px",
            maxWidth: isUser ? "85%" : "92%",
            flexDirection: isUser ? "row-reverse" : "row",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderRadius: isUser
                ? "18px 18px 4px 18px"
                : "4px 18px 18px 18px",
              fontSize: "14px",
              lineHeight: 1.65,
              wordBreak: "break-word",
              background: isUser
                ? "linear-gradient(135deg,#0369a1,#0284c7)"
                : "white",
              color: isUser ? "white" : "#333",
              boxShadow: isUser
                ? "0 3px 10px rgba(3,105,161,0.3)"
                : "0 2px 8px rgba(0,0,0,0.08)",
              border: isUser ? "none" : "1px solid #e0f2fe",
              whiteSpace: "pre-wrap",
              fontFamily: "Nunito,sans-serif",
            }}
          >
            {text}
          </div>
          <SpeakButton text={text} lang={voiceLang} isUser={isUser} />
        </div>
      )}
      {!isUser && products.length > 0 && (
        <div style={{ width: "100%", maxWidth: "100%" }}>
          <ProductRow
            products={products}
            onAddToCart={onAddToCart}
            onRemoveFromCart={onRemoveFromCart}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
            cartItems={cartItems}
            onShowToast={onShowToast}
            isTelugu={isTelugu}
            language={language}
            region={region}
          />
        </div>
      )}
      {!isUser && action && (
        <div style={{ width: "100%" }}>
          <ActionBanner action={action} products={products} cartItems={cartItems} wishlistItems={wishlistItems} region={region} />
        </div>
      )}
      {time && (
        <span style={{ fontSize: "11px", color: "#bdbdbd", padding: "0 4px" }}>
          {time}
        </span>
      )}
    </div>
  );
}

// ── Main ChatWindow ────────────────────────────────────────────────────────────
export default function ChatWindow({
  sessionId,
  onNewMessage,
  isReady,
  onAddToCart,
  onRemoveFromCart,
  onRemoveAllFromCart,
  onToggleFavorite,
  onRemoveFromWishlist,
  onClearCart,
  isFavorite,
  cartItems,
  wishlistItems = [],
  language = "en",
  region = "in",
}) {
  const t = useT(language);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [toast, setToast] = useState(null);
  const [voiceLang, setVoiceLang] = useState(language === "ke" ? "en-IN" : "te-IN");
  const [isMuted, setIsMuted] = useState(false);

  const isTelugu = voiceLang === "te-IN";
  const isSwahili = language === "ke";
  const sw = isSwahili;
  const L = isSwahili ? KE : (isTelugu ? TE : EN);
  const SUGGESTIONS = isSwahili ? SUGGESTIONS_KE : (isTelugu ? SUGGESTIONS_TE : SUGGESTIONS_EN);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const handleSendRef = useRef(null);
  const isMutedRef = useRef(isMuted);
  const voiceLangRef = useRef(voiceLang);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);
  useEffect(() => {
    voiceLangRef.current = voiceLang;
  }, [voiceLang]);
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, toast]);

  const showToast = useCallback((message, type) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const executeAction = useCallback(
    (action, products) => {
      if (!action) return;
      const items = action.products?.length ? action.products : products;
      const te = voiceLangRef.current === "te-IN";
      const sw = language === "ke";

      if (action.type === "ADD_TO_CART") {
        if (!items?.length) return;
        items.forEach((p) => onAddToCart && onAddToCart(p));
        showToast(
          sw ? `${items.length} bidhaa zimeongezwa kwenye kikapu!` :
          (te ? `${items.length} వస్తువులు కార్ట్‌కు జొడించబడ్డాయి!` : `${items.length} item${items.length !== 1 ? "s" : ""} added to cart!`),
          "cart",
        );
      } else if (action.type === "ADD_TO_FAVORITES") {
        if (!items?.length) return;
        items.forEach((p) => onToggleFavorite && onToggleFavorite(p));
        showToast(
          sw ? `${items.length} bidhaa zimeongezwa kwenye mapendeleo!` :
          (te ? `${items.length} వస్తువులు ఇష్టాలకు జొడించబడ్డాయి!` : `${items.length} item${items.length !== 1 ? "s" : ""} added to favorites!`),
          "fav",
        );
      } else if (action.type === "REMOVE_FROM_CART") {
        if (!items?.length) return;
        items.forEach((p) => onRemoveAllFromCart && onRemoveAllFromCart(p));
        showToast(
          sw ? `${items.length} bidhaa zimeondolewa kwenye kikapu!` :
          (te ? `${items.length} వస్తువులు కార్ట్ నుండి తీసివేయబడ్డాయి!` : `${items.length} item${items.length !== 1 ? "s" : ""} removed from cart!`),
          "remove",
        );
      } else if (action.type === "REMOVE_FROM_WISHLIST") {
        if (!items?.length) return;
        items.forEach((p) => onRemoveFromWishlist && onRemoveFromWishlist(p));
        showToast(
          sw ? `${items.length} bidhaa zimeondolewa kwenye mapendeleo!` :
          (te ? `${items.length} వస్తువులు ఇష్టాల నుండి తీసివేయబడ్డాయి!` : `${items.length} item${items.length !== 1 ? "s" : ""} removed from wishlist!`),
          "remove",
        );
      } else if (action.type === "CLEAR_CART") {
        onClearCart && onClearCart();
        showToast(
          sw ? "Kikapu kimeondolewa!" : (te ? "కార్ట్ క్లియర్ చేయబడింది!" : "Cart cleared!"),
          "remove",
        );
      }
    },
    [onAddToCart, onToggleFavorite, onRemoveAllFromCart, onRemoveFromWishlist, onClearCart, showToast, language],
  );

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      setShowSuggestions(true);
      return;
    }
    const load = async () => {
      setFetching(true);
      try {
        const res = await getMessages(sessionId);
        const msgs = res.data || [];
        setMessages(msgs);
        setShowSuggestions(msgs.length === 0);
      } catch (e) {
        console.error("Load messages error:", e);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [sessionId]);

  const handleSend = useCallback(
    async (textOverride) => {
      const text = (textOverride !== undefined ? textOverride : input).trim();
      if (!text || !sessionId || loading) return;

      setShowSuggestions(false);

      const userMsg = {
        id: Date.now(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      inputRef.current?.blur();
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      try {
        await saveUserMessage(sessionId, text);
        const history = messages
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.content }));

        const botContent = await chatWithGroq(history, text, cartItems || [], wishlistItems || []);
        const saved = await saveBotMessage(sessionId, botContent);
        const botMsg = saved.data;
        setMessages((prev) => [...prev, botMsg]);

        const parsed = parseMessage(botContent);
        if (parsed.action) executeAction(parsed.action, parsed.products);
        if (parsed.text && !isMutedRef.current)
          speakText(parsed.text, voiceLangRef.current);

        onNewMessage && onNewMessage();
      } catch (err) {
        console.error("Chat error:", err);
        const errContent = sw ? "Samahani, sikuweza kuunganishwa. Tafadhali jaribu tena." : (isTelugu
          ? "క్షమించండి, కనెక్ట్ కాలేదు. మళ్ళీ ప్రయత్నించండి."
          : "Sorry, I couldn't connect. Please try again.");
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "bot",
            content: errContent,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [
      input,
      sessionId,
      loading,
      messages,
      executeAction,
      onNewMessage,
      isTelugu,
      isSwahili,
      cartItems,
      wishlistItems,
    ],
  );

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  const startVoice = () => {
    setVoiceError("");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setVoiceError(
        sw ? "Usaidizi wa sauti haupatikani. Tumia Chrome." : (isTelugu
          ? "వాయిస్ సపోర్ట్ లేదు. Chrome వాడండి."
          : "Voice not supported. Use Chrome."),
      );
      return;
    }
    const recognition = new SR();
    recognition.lang = voiceLang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    recognition.onstart = () => {
      setListening(true);
      setInput("");
    };
    recognition.onresult = (event) => {
      let final = "", interim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      const combined = (final + interim).trim();
      if (combined) setInput(combined);
      if (final.trim()) {
        setListening(false);
        setTimeout(() => handleSendRef.current(final.trim()), 300);
      }
    };
    recognition.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed")
        setVoiceError(
          sw ? "Maikrofoni imezuiwa. Ruhusu kwenye mipangilio." : (isTelugu
            ? "మైక్ బ్లాక్ అయింది. సెట్టింగ్స్‌లో అనుమతించండి."
            : "Mic blocked. Allow mic in browser settings."),
        );
      else if (e.error === "no-speech")
        setVoiceError(
          sw ? "Hakuna sauti iliyotambuliwa. Jaribu tena." : (isTelugu
            ? "మాట వినబడలేదు. మళ్ళీ ప్రయత్నించండి."
            : "No speech detected. Try again."),
        );
      else
        setVoiceError((sw ? "Hitilafu ya sauti: " : (isTelugu ? "వాయిస్ లోపం: " : "Voice error: ")) + e.error);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };
  const inputHasText = input.trim().length > 0;
  const isDisabled = !sessionId || !isReady;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        background: "#f0f9ff",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes slideUp  { from{opacity:0;transform:translateY(6px);}  to{opacity:1;transform:translateY(0);} }
        @keyframes dotPulse { 0%,80%,100%{transform:scale(0.6);opacity:0.4;} 40%{transform:scale(1);opacity:1;} }
        @keyframes spin     { to{transform:rotate(360deg);} }
        @keyframes blink    { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        .chip:hover  { background:#e0f2fe!important; border-color:#0ea5e9!important; transform:translateY(-1px); }
        .mic:hover:not(:disabled)  { background:#dbeafe!important; }
        .send:hover:not(:disabled) { transform:scale(1.06); }
        .lang-btn { transition: all 0.15s; cursor: pointer; }
        .lang-btn:hover { opacity: 0.8; }
      `}</style>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Welcome */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "linear-gradient(135deg,#0369a1,#0ea5e9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
              }}
            >
              🛒
            </div>
            <span
              style={{ fontSize: "12px", fontWeight: 700, color: "#0369a1" }}
            >
              {t.chatbot.name}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
            <div
              style={{
                background: "white",
                borderRadius: "4px 18px 18px 18px",
                padding: "14px 18px",
                fontSize: "14px",
                color: "#333",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                maxWidth: "88%",
                lineHeight: 1.65,
                border: "1px solid #e0f2fe",
                fontFamily: "Nunito,sans-serif",
              }}
            >
              {L.welcome}
            </div>
            <SpeakButton
              text={
                sw ? "Habari! Mimi ni PrimeBot, msaidizi wako wa PrimeBasket!" :
                (isTelugu
                  ? "నమస్కారం! నేను PrimeBot, మీ PrimeBasket సహాయకుడిని!"
                  : "Hey! I'm PrimeBot, your PrimeBasket grocery assistant!")
              }
              lang={voiceLang}
              isUser={false}
            />
          </div>
        </div>

        {/* Suggestions */}
        {showSuggestions && !fetching && sessionId && (
          <div style={{ animation: "slideUp 0.35s ease-out" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#9e9e9e",
                fontWeight: 600,
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {L.tryAsking}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="chip"
                  onClick={() => handleSend(s.text)}
                  style={{
                    padding: "7px 13px",
                    borderRadius: "20px",
                    border: "1.5px solid #7dd3fc",
                    background: "white",
                    color: "#0369a1",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Nunito,sans-serif",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span>{s.icon}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {fetching && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px",
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                border: "2px solid #0ea5e9",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        )}

        {!fetching &&
          messages.map((msg, i) =>
            msg && msg.role ? (
              <MessageBubble
                key={msg.id || i}
                message={msg}
                onAddToCart={onAddToCart}
                onRemoveFromCart={onRemoveFromCart}
                onToggleFavorite={onToggleFavorite}
                isFavorite={isFavorite}
                cartItems={cartItems}
                wishlistItems={wishlistItems}
                voiceLang={voiceLang}
                onShowToast={showToast}
                isTelugu={isTelugu}
                language={language}
                region={region}
              />
            ) : null,
          )}

        {loading && <TypingIndicator language={language} />}
        <InlineToast toast={toast} />
        <div ref={bottomRef} />
      </div>

      {/* Voice error */}
      {voiceError && (
        <div
          style={{
            margin: "0 16px 8px",
            padding: "10px 14px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            fontSize: "12px",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>⚠️ {voiceError}</span>
          <button
            onClick={() => setVoiceError("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#dc2626",
              fontSize: "16px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Listening banner */}
      {listening && (
        <div
          style={{
            margin: "0 16px 8px",
            padding: "9px 14px",
            background: "#fff7f7",
            border: "1.5px solid #fca5a5",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#ef4444",
              animation: "blink 1s infinite",
            }}
          />
          <span
            style={{
              fontSize: "13px",
              color: "#b91c1c",
              fontWeight: 600,
              flex: 1,
            }}
          >
            {L.listening}
          </span>
          <button
            onClick={stopVoice}
            style={{
              background: "#ef4444",
              border: "none",
              borderRadius: "8px",
              color: "white",
              padding: "4px 12px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 700,
              fontFamily: "Nunito,sans-serif",
            }}
          >
            {sw ? "Acha" : (isTelugu ? "ఆపు" : "Stop")}
          </button>
        </div>
      )}

      {/* Input bar */}
      <div
        style={{
          padding: "10px 16px 12px",
          background: "white",
          borderTop: "1px solid #e0f2fe",
          flexShrink: 0,
          boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "8px",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <button
            className="lang-btn"
            onClick={() => {
              window.speechSynthesis?.cancel();
              setIsMuted((v) => !v);
            }}
            style={{
              padding: "3px 11px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: "Nunito,sans-serif",
              border: "1.5px solid",
              borderColor: isMuted ? "#ef4444" : "#22c55e",
              background: isMuted ? "#fff1f2" : "#f0fdf4",
              color: isMuted ? "#ef4444" : "#16a34a",
            }}
          >
            {isMuted ? L.muted : L.soundOn}
          </button>
          {!sw && (
            <button
              className="lang-btn"
              onClick={() => setVoiceLang("te-IN")}
              style={{
                padding: "3px 11px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "Nunito,sans-serif",
                border: "1.5px solid",
                borderColor: isTelugu ? "#0369a1" : "#e2e8f0",
                background: isTelugu ? "#e0f2fe" : "white",
                color: isTelugu ? "#0369a1" : "#94a3b8",
              }}
            >
              🇮🇳 తెలుగు
            </button>
          )}
          <button
            className="lang-btn"
            onClick={() => setVoiceLang("en-IN")}
            style={{
              padding: "3px 11px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: "Nunito,sans-serif",
              border: "1.5px solid",
              borderColor: voiceLang === "en-IN" ? "#0369a1" : "#e2e8f0",
              background: voiceLang === "en-IN" ? "#e0f2fe" : "white",
              color: voiceLang === "en-IN" ? "#0369a1" : "#94a3b8",
            }}
          >
            {sw ? "🇬🇧 English" : "🇬🇧 English"}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#f0f9ff",
            border: `1.5px solid ${listening ? "#fca5a5" : inputFocused ? "#0ea5e9" : "#bae6fd"}`,
            borderRadius: "30px",
            padding: "8px 8px 8px 18px",
            transition: "all 0.2s",
            boxShadow: inputFocused ? "0 0 0 3px rgba(14,165,233,0.1)" : "none",
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isDisabled) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              listening
                ? L.listening
                : isDisabled
                  ? (sw ? "Inatayarisha mazungumzo..." : (isTelugu ? "చాట్ సిద్ధమవుతోంది..." : "Setting up chat..."))
                  : L.placeholder
            }
            disabled={isDisabled}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "14px",
              color: "#333",
              fontFamily: "Nunito,sans-serif",
            }}
          />
          <button
            className="mic"
            onClick={listening ? stopVoice : startVoice}
            disabled={isDisabled}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: listening ? "#fff0f0" : "#e0f2fe",
              border: `1.5px solid ${listening ? "#fca5a5" : "#7dd3fc"}`,
              cursor: isDisabled ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.18s",
              opacity: isDisabled ? 0.5 : 1,
            }}
          >
            {listening ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#ef4444">
                <rect x="6" y="6" width="12" height="12" rx="2.5" />
              </svg>
            ) : (
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0369a1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
          <button
            className="send"
            onClick={() => handleSend()}
            disabled={!inputHasText || loading || isDisabled}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background:
                inputHasText && !loading && !isDisabled
                  ? "linear-gradient(135deg,#0369a1,#0ea5e9)"
                  : "#e0e0e0",
              border: "none",
              cursor:
                inputHasText && !loading && !isDisabled
                  ? "pointer"
                  : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.2s",
              boxShadow:
                inputHasText && !isDisabled
                  ? "0 3px 10px rgba(3,105,161,0.3)"
                  : "none",
            }}
          >
            {loading ? (
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={inputHasText && !isDisabled ? "white" : "#9e9e9e"}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: "10px",
            color: "#bdbdbd",
            marginTop: "6px",
          }}
        >
          {L.poweredBy}
        </div>
      </div>
    </div>
  );
}





