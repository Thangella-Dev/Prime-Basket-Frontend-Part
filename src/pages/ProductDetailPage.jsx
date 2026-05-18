// src/pages/ProductDetailPage.jsx
import { useState, useEffect, useMemo } from "react";
import { database, hasFirebaseConfig } from "../firebase";
import { ref, get } from "firebase/database";
import { useT } from "../i18n/translations";
import { INDIA_ALL_PRODUCTS } from "../data/india_products";
import { KENYA_ALL_PRODUCTS } from "../data/kenya_products";
import { enhanceProduct, formatCurrency, parsePrice, resolveProductImage } from "../utils/productUtils";
import ProductCard from "../components/ProductCard";
import { getLocalizedProductName } from "../utils/translationUtils";
import { SkeletonCard } from "../components/SkeletonLoaders";

const allCoupons_en = [
  { code: "ONECARD",  text: "Get 5% off with OneCard"                  },
  { code: "BHIM25",   text: "Upto ₹25 cashback with BHIM app"          },
  { code: "ZAGG20",   text: "20% off with Zagg Rupay Credit Card"       },
  { code: "AMZPAY",   text: "Upto ₹100 cashback with Amazon Pay Later"  },
  { code: "GPAY75",   text: "Upto ₹75 cashback using Google Pay"        },
  { code: "PAYTM30",  text: "Flat ₹30 cashback with Paytm Wallet"       },
];

const allCoupons_ke = [
  { code: "MPESA10",  text: "Get 10% off paying with M-PESA"           },
  { code: "KCB50",    text: "KES 50 cashback with KCB Bank Card"        },
  { code: "EQUITY20", text: "20% off with Equity Bank Card"             },
  { code: "AIRTEL5",  text: "Flat KES 5 off with Airtel Money"          },
  { code: "VISA100",  text: "KES 100 cashback with Visa Debit Card"     },
];

const RELATED = {
  rice: ["wheat-flour", "pulses", "sugar"],
  oil: ["masala", "chilli-powder", "turmeric-powder"],
  "wheat-flour": ["rice", "pulses", "salt"],
  fruits: ["vegetables", "dairyProducts", "coolDrinks"],
  vegetables: ["fruits", "dairyProducts", "masala"],
  dairyProducts: ["milkPowders", "fruits", "biscuitsAndCookies"],
  chipsAndNamkeens: ["biscuitsAndCookies", "coolDrinks", "instantFood"],
  biscuitsAndCookies: ["chipsAndNamkeens", "coolDrinks", "milkPowders"],
  coolDrinks: ["chipsAndNamkeens", "biscuitsAndCookies", "instantFood"],
  instantFood: ["chipsAndNamkeens", "biscuitsAndCookies", "masala"],
  babyCare: ["oralCare", "bodyCare", "feminineHygiene"],
  oralCare: ["bodyCare", "babyCare", "homeNeeds"],
  bodyCare: ["oralCare", "feminineHygiene", "homeNeeds"],
  feminineHygiene: ["bodyCare", "babyCare", "homeNeeds"],
  homeNeeds: ["oralCare", "bodyCare", "babyCare"],
};

const NAV_H = 88;

export default function ProductDetailPage({ 
  product: rawProduct, onBack, onAddCart, onDecreaseCart, 
  cart = [], wishlist = [], toggleWishlist, 
  language = "en", region = "in", onCategorySelect, onOpenProduct 
}) {
  const t = useT(language);
  const [theme, setTheme] = useState(() => (typeof document !== "undefined" ? document.body.dataset.theme || "light" : "light"));
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1200));
  const isDark = theme === "dark";
  const isCompactDetails = viewportWidth <= 760;
  
  // ── Enhance Product & Unit Selection ──
  const product = useMemo(() => enhanceProduct(rawProduct, region), [rawProduct, region]);
  const [selectedUnit, setSelectedUnit] = useState(product.baseUnit || (product.units && product.units[0]?.label) || "500g");

  const currentUnitObj = (product.units || []).find(u => u.label === selectedUnit) || { label: selectedUnit, multiplier: 1 };
  const currentPrice = parsePrice(product.basePrice) * currentUnitObj.multiplier;
  const currentOldPrice = currentPrice + (currentPrice * (product.discountPercent || 0) / 100);
  const currentDiscount = product.discountPercent || 0;

  const [similar, setSimilar]               = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [showAllCoupons, setShowAllCoupons] = useState(false);
  const [shareMsg, setShareMsg]             = useState("");
  const [activeThumb, setActiveThumb]       = useState(0);
  const [copiedCode, setCopiedCode]         = useState("");
  const [tab, setTab]                       = useState("highlights");

  const allCoupons = region === "ke" ? allCoupons_ke : allCoupons_en;
  
  // Find cart item that matches both UID AND the currently selected unit
  const inCart = cart.find((c) => c._uid === product._uid && c.selectedUnit === selectedUnit);
  const qty = inCart ? inCart.quantity : 0;
  
  const isWished = wishlist.some((w) => w._uid === product._uid);
  const displayedCoupons = showAllCoupons ? allCoupons : allCoupons.slice(0, 3);

  const getTranslatedName = (name) => getLocalizedProductName(name, t);

  const translatedName = getTranslatedName(product.name);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [product._uid]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const syncTheme = () => setTheme(document.body.dataset.theme || "light");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncViewport = () => setViewportWidth(window.innerWidth);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    setLoadingSimilar(true);
    const relCats = RELATED[product._cat] || ["fruits", "vegetables", "dairyProducts"];
    const fallbackRelated = () => {
      const fallbackCatalog = region === "ke" ? KENYA_ALL_PRODUCTS : INDIA_ALL_PRODUCTS;
      const allRelated = fallbackCatalog
        .filter((p) => relCats.includes(p._cat) && p._uid !== product._uid)
        .slice(0, 10);
      setSimilar(allRelated.map((p) => enhanceProduct(p, region)));
      setLoadingSimilar(false);
    };

    if (region === "ke") {
      fallbackRelated();
      return;
    }

    if (!hasFirebaseConfig || !database) {
      fallbackRelated();
      return;
    }

    Promise.all(
      relCats.map((cat) =>
        get(ref(database, "categories/" + cat)).then((snap) => {
          const v = snap.val();
          if (!v) return [];
          return Object.values(v).slice(0, 4).map((p, i) => ({
            ...p, _cat: cat, _index: i, _uid: `${cat}_${i}`,
          }));
        })
      )
    )
      .then((res) => { 
        const flattened = res.flat().slice(0, 10);
        if (!flattened.length) {
          fallbackRelated();
          return;
        }
        setSimilar(flattened.map(p => enhanceProduct(p, region)));
        setLoadingSimilar(false); 
      })
      .catch(() => {
        fallbackRelated();
      });
  }, [product._uid, region]);

  const handleShare = async () => {
    const text = `${translatedName} — ${formatCurrency(currentPrice, region)} on Prime Basket!`;
    try {
      if (navigator.share) await navigator.share({ title: translatedName, text });
      else { await navigator.clipboard.writeText(text); setShareMsg("Copied!"); setTimeout(() => setShareMsg(""), 2000); }
    } catch { /**/ }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code); setTimeout(() => setCopiedCode(""), 2000);
  };

  const handleAddToCart = () => {
    onAddCart && onAddCart({ ...product, selectedUnit, price: currentPrice, oldPrice: currentOldPrice });
  };

  const handleDecreaseCart = () => {
    onDecreaseCart && onDecreaseCart(product._uid, selectedUnit);
  };

  return (
    <>
      <style>{`
        @keyframes pdpIconSweep {
          0% { transform: translateX(-135%); }
          100% { transform: translateX(135%); }
        }
        @keyframes pdpTrustFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .pdp {
          background:
            radial-gradient(circle at top left, rgba(15,91,215,0.08), transparent 22%),
            radial-gradient(circle at top right, rgba(255,204,115,0.12), transparent 24%),
            linear-gradient(180deg, #f7fbff 0%, #edf4fb 100%);
          min-height: 100vh;
          padding-bottom: 60px;
          font-family: 'Nunito', sans-serif;
        }
        .pdp-crumb { background:linear-gradient(180deg, rgba(255,255,255,0.97), rgba(246,250,255,0.96)); border-bottom:1px solid rgba(203,213,225,0.78); padding:13px 0; backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); }
        .pdp-crumb-inner { display:flex; align-items:center; gap:10px; font-size:13px; color:var(--body); }
        .pdp-crumb-back { display:inline-flex; align-items:center; gap:7px; color:#1d5ba0; font-weight:800; cursor:pointer; padding:8px 13px; border-radius:999px; border:1px solid rgba(191,219,254,0.98); background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(237,244,255,0.98)); box-shadow:0 10px 20px rgba(29,91,160,0.08); transition:transform .22s ease, box-shadow .22s ease, color .22s ease; }
        .pdp-crumb-back:hover { transform:translateY(-1px); box-shadow:0 16px 28px rgba(29,91,160,0.14); }
        .pdp-crumb-sep { font-size:10px; color:#9aa9bf; }
        .pdp-crumb-cat { color:#1d5ba0; font-weight:700; cursor:pointer; text-transform:capitalize; transition:color .2s ease; }
        .pdp-crumb-cat:hover { color:#143e72; }
        .pdp-crumb-name { color:var(--dark); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:300px; }

        .pdp-body { display:grid; grid-template-columns:500px 1fr; gap:32px; align-items:start; padding:28px 0 0; }
        .pdp-left { position:sticky; top:${NAV_H}px; display:flex; gap:12px; align-self:start; }
        .pdp-thumbs { display:flex; flex-direction:column; gap:10px; }
        .pdp-thumb { width:62px; height:62px; border-radius:14px; border:2px solid var(--border); background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,250,255,0.98)); display:flex; align-items:center; justify-content:center; cursor:pointer; padding:5px; transition:.24s ease; overflow:hidden; flex-shrink:0; box-shadow:0 12px 22px rgba(15,23,42,0.06); }
        .pdp-thumb:hover, .pdp-thumb.active { border-color:#1d5ba0; box-shadow:0 0 0 3px rgba(29,91,160,.12), 0 18px 30px rgba(15,23,42,0.08); transform: translateY(-2px); }
        .pdp-thumb img { max-width:100%; max-height:100%; object-fit:contain; }

        .pdp-imgcard { flex:1; background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,250,255,0.98)); border:1px solid var(--border); border-radius:22px; padding:20px 20px 16px; display:flex; flex-direction:column; align-items:stretch; min-height:500px; position:relative; overflow:hidden; box-shadow: 0 24px 48px rgba(15,23,42,0.08); }
        .pdp-img-zone { flex:1; display:flex; align-items:center; justify-content:center; padding:40px 10px; }
        .pdp-disc-badge { position:absolute; top:14px; left:14px; background:#16a34a; color:#fff; font-size:11px; font-weight:800; padding:4px 10px; border-radius:4px 10px 4px 10px; z-index:2; }
        .pdp-icon-col { position:absolute; top:14px; right:14px; display:flex; flex-direction:column; gap:8px; z-index:2; }
        .pdp-icon-btn { width:40px; height:40px; border-radius:16px; background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,246,255,0.98)); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#1d5ba0; font-size:14px; box-shadow:0 12px 24px rgba(15,23,42,.08); transition:.22s ease; position:relative; overflow:hidden; }
        .pdp-icon-btn::after { content:""; position:absolute; inset:0; background:linear-gradient(120deg, transparent 0%, rgba(255,255,255,.45) 48%, transparent 100%); transform:translateX(-135%); }
        .pdp-icon-btn:hover::after { animation:pdpIconSweep .8s ease; }
        .pdp-icon-btn:hover { background:#1d5ba0; color:#fff; border-color:#1d5ba0; transform: translateY(-2px) scale(1.03); }
        .pdp-icon-btn.wished { background:#e63946; color:#fff; border-color:#e63946; }
        .pdp-share-toast { position:absolute; top:14px; left:50%; transform:translateX(-50%); background:#1d5ba0; color:#fff; font-size:12px; font-weight:700; padding:5px 14px; border-radius:8px; white-space:nowrap; z-index:10; }
        .pdp-bigimg { max-height:320px; max-width:100%; object-fit:contain; display:block; transition:transform .35s; }
        .pdp-imgcard:hover .pdp-bigimg { transform: scale(1.03); }
        
        .pdp-right { display:flex; flex-direction:column; gap:20px; }
        .pdp-infocard { background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,251,255,0.98)); border:1px solid var(--border); border-radius:22px; padding:30px; box-shadow:0 24px 48px rgba(15,23,42,0.08); }
        .pdp-cat-tag { font-size:10px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#1d5ba0; background:#e8f0fb; padding:3px 10px; border-radius:20px; display:inline-block; margin-bottom:12px; }
        .pdp-pname { font-size:26px; font-weight:800; color:#253d4e; line-height:1.3; margin:0 0 12px; font-family:'Quicksand',sans-serif; }
        
        /* Unit Selection */
        .pdp-unit-selector { margin: 20px 0; }
        .pdp-unit-label { font-size: 13px; font-weight: 700; color: #64748b; margin-bottom: 10px; display: block; }
        .pdp-unit-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .pdp-unit-btn { padding: 8px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: linear-gradient(180deg, #fff 0%, #f8fbff 100%); font-size: 13px; font-weight: 700; color: #475569; cursor: pointer; transition: .2s; box-shadow: 0 10px 20px rgba(15,23,42,0.04); }
        .pdp-unit-btn:hover { border-color: #1d5ba0; color: #1d5ba0; transform: translateY(-1px); }
        .pdp-unit-btn.active { border-color: #1d5ba0; background: #f0f5ff; color: #1d5ba0; box-shadow: 0 12px 24px rgba(29,91,160,0.12); }

        .pdp-prices { display:flex; align-items:baseline; gap:10px; margin-bottom:4px; flex-wrap:wrap; }
        .pdp-price { font-size:32px; font-weight:800; color:#1d5ba0; font-family:'Quicksand',sans-serif; }
        .pdp-oldprice { font-size:18px; color:#94a3b8; text-decoration:line-through; }
        .pdp-savepill { font-size:12px; font-weight:700; color:#16a34a; background:#dcfce7; padding:2px 10px; border-radius:20px; align-self:center; }
        
        .pdp-action-area { margin-top: 24px; display: flex; gap: 16px; align-items: center; }
        .pdp-add-btn-v2 { flex: 1; height: 54px; background: linear-gradient(135deg, #1d5ba0 0%, #2d75c3 100%); color: #fff; border: none; border-radius: 16px; font-size: 16px; font-weight: 800; cursor: pointer; font-family: 'Nunito', sans-serif; display: flex; align-items: center; justify-content: center; gap: 10px; transition: .22s ease; box-shadow: 0 18px 30px rgba(29, 91, 160, 0.24); position: relative; overflow: hidden; }
        .pdp-add-btn-v2::after { content:""; position:absolute; inset:0; background:linear-gradient(120deg, transparent 0%, rgba(255,255,255,.4) 48%, transparent 100%); transform:translateX(-140%); }
        .pdp-add-btn-v2:hover::after { animation:pdpIconSweep .8s ease; }
        .pdp-add-btn-v2:hover { background: linear-gradient(135deg, #174d8a 0%, #2667ab 100%); transform: translateY(-2px); box-shadow: 0 22px 36px rgba(29, 91, 160, 0.3); }
        
        .pdp-qty-ctrl { display: flex; align-items: center; background: linear-gradient(135deg, #1d5ba0 0%, #2d75c3 100%); border-radius: 16px; height: 54px; flex: 1; overflow: hidden; box-shadow: 0 18px 30px rgba(29, 91, 160, 0.24); }
        .pdp-qty-btn { width: 50px; height: 100%; border: none; background: transparent; color: #fff; font-size: 24px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .pdp-qty-btn:hover { background: rgba(255,255,255,0.08); }
        .pdp-qty-num { flex: 1; text-align: center; color: #fff; font-size: 18px; font-weight: 800; }

        @media(max-width:900px) {
          .pdp-body { grid-template-columns: 1fr; }
          .pdp-left { position: static; flex-direction: column-reverse; }
          .pdp-thumbs { flex-direction: row; overflow-x: auto; }
          .pdp-imgcard { min-height: 400px; }
        }

        .pdp-trust-badges {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-top: 30px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
        }
        .pdp-trust-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          padding: 8px;
          border-radius: 16px;
          transition: transform .22s ease, background .22s ease;
        }
        .pdp-trust-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #1d5ba0 0%, #2d75c3 100%);
          color: #fff;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 16px 26px rgba(29, 91, 160, 0.22);
          animation: pdpTrustFloat 3s ease-in-out infinite;
        }
        .pdp-trust-item:hover { transform: translateY(-3px); background: rgba(255,255,255,0.5); }
        .pdp-trust-item span {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          line-height: 1.2;
        }
        body[data-theme="dark"] .pdp {
          background:
            radial-gradient(circle at top left, rgba(15,91,215,0.18), transparent 28%),
            radial-gradient(circle at top right, rgba(56,189,248,0.12), transparent 24%),
            linear-gradient(180deg, #07101d 0%, #0b1729 100%);
        }
        body[data-theme="dark"] .pdp-crumb,
        body[data-theme="dark"] .pdp-thumb,
        body[data-theme="dark"] .pdp-imgcard,
        body[data-theme="dark"] .pdp-infocard {
          background: var(--white);
          border-color: var(--border);
        }
        body[data-theme="dark"] .pdp-cat-tag {
          background: rgba(15,91,215,0.14);
          color: #8fc2ff;
        }
        body[data-theme="dark"] .pdp-unit-btn {
          background: rgba(15,23,42,0.82);
          border-color: rgba(96,165,250,0.18);
          color: #d6e8ff;
        }
        body[data-theme="dark"] .pdp-unit-btn.active,
        body[data-theme="dark"] .pdp-unit-btn:hover {
          background: rgba(15,91,215,0.16);
          color: #8fc2ff;
          border-color: rgba(96,165,250,0.4);
        }
        body[data-theme="dark"] .pdp-trust-badges {
          background: rgba(15,23,42,0.7);
          border-color: rgba(96,165,250,0.12);
        }
        body[data-theme="dark"] .pdp-trust-icon {
          background: linear-gradient(180deg, #1d5ba0 0%, #174a84 100%);
        }
        body[data-theme="dark"] .pdp-savepill {
          background: rgba(34,197,94,0.16);
          color: #86efac;
        }
        @media (max-width: 480px) {
          .pdp-trust-badges { grid-template-columns: repeat(2, 1fr); gap: 20px 10px; }
        }
      `}</style>

      <div className="pdp">
        <div className="pdp-crumb">
          <div className="container pdp-crumb-inner">
            <span className="pdp-crumb-back" onClick={onBack}>
              <i className="fas fa-arrow-left" style={{ fontSize: 10 }}></i> {t.cart.breadcrumbHome}
            </span>
            <i className="fas fa-chevron-right pdp-crumb-sep"></i>
            <span className="pdp-crumb-cat" onClick={() => onCategorySelect && onCategorySelect(product._cat)}>{t.categories?.[product._cat.replace("-", "")] || product._cat}</span>
            <i className="fas fa-chevron-right pdp-crumb-sep"></i>
            <span className="pdp-crumb-name">{translatedName}</span>
          </div>
        </div>

        <div className="container">
          <div className="pdp-body">
            {/* Left: Images */}
            <div className="pdp-left">
              <div className="pdp-thumbs">
                {[0,1,2].map((i) => (
                  <div key={i} className={`pdp-thumb${activeThumb === i ? " active" : ""}`} onClick={() => setActiveThumb(i)}>
                    <img src={resolveProductImage(product)} alt="" />
                  </div>
                ))}
              </div>

              <div className="pdp-imgcard">
                {currentDiscount > 0 && <div className="pdp-disc-badge">{currentDiscount}% OFF</div>}
                <div className="pdp-icon-col">
                  <button className="pdp-icon-btn" onClick={handleShare} title="Share"><i className="fas fa-share-alt"></i></button>
                  <button
                    className={`pdp-icon-btn${isWished ? " wished" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleWishlist && toggleWishlist(product); }}
                  >
                    <i className={isWished ? "fas fa-heart" : "far fa-heart"}></i>
                  </button>
                </div>
                {shareMsg && <div className="pdp-share-toast">{shareMsg}</div>}
                <div className="pdp-img-zone">
                  <img src={resolveProductImage(product)} alt={translatedName} className="pdp-bigimg" />
                </div>
              </div>
            </div>

            {/* Right: Info */}
            <div className="pdp-right">
              <div className="pdp-infocard">
                <span className="pdp-cat-tag" onClick={() => onCategorySelect && onCategorySelect(product._cat)} style={{ cursor: "pointer" }}>
                  {t.categories?.[product._cat.replace("-", "")] || product._cat}
                </span>
                <h1 className="pdp-pname">{translatedName}</h1>
                
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  {product.brand && <span className="pdp-by" style={{ fontSize: 14 }}>{t.product.by} <strong style={{ color: "#1d5ba0" }}>{product.brand}</strong></span>}
                  <span style={{ height: 14, width: 1, background: "#e2e8f0" }}></span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#f8fafc", padding: "4px 8px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#1d5ba0" }}>
                    ⭐ {product.stars || 4.5} <span style={{ color: "#94a3b8", fontWeight: 500 }}>({product.reviews || 120})</span>
                  </div>
                </div>

                {/* Variant Selector */}
                <div className="pdp-unit-selector">
                  <span className="pdp-unit-label">{t.product.selectQuantity || "Select Quantity"}</span>
                  <div className="pdp-unit-grid">
                    {product.units.map((u) => (
                      <button
                        key={u.label}
                        className={`pdp-unit-btn${selectedUnit === u.label ? " active" : ""}`}
                        onClick={() => setSelectedUnit(u.label)}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pdp-prices">
                  <span className="pdp-price">{formatCurrency(currentPrice, region)}</span>
                  {currentOldPrice > currentPrice && (
                    <>
                      <span className="pdp-oldprice">{formatCurrency(currentOldPrice, region)}</span>
                      <span className="pdp-savepill">{currentDiscount}% OFF</span>
                    </>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 24 }}>(Inclusive of all taxes)</p>

                {/* Add to Cart Area */}
                <div className="pdp-action-area">
                  {qty > 0 ? (
                    <div className="pdp-qty-ctrl">
                      <button className="pdp-qty-btn" onClick={handleDecreaseCart}>-</button>
                      <div className="pdp-qty-num">{qty}</div>
                      <button className="pdp-qty-btn" onClick={handleAddToCart}>+</button>
                    </div>
                  ) : (
                    <button className="pdp-add-btn-v2" onClick={handleAddToCart}>
                      {t.home.add || "ADD"}
                    </button>
                  )}
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleWishlist && toggleWishlist(product); }}
                    style={{ 
                      width: 52, height: 52, borderRadius: 12, border: "2px solid #e2e8f0", 
                      background: "#fff", color: isWished ? "#e63946" : "#64748b", 
                      fontSize: 18, cursor: "pointer", transition: ".2s"
                    }}
                  >
                    <i className={isWished ? "fas fa-heart" : "far fa-heart"}></i>
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="pdp-trust-badges">
                  <div className="pdp-trust-item">
                    <div className="pdp-trust-icon"><i className="fas fa-shipping-fast"></i></div>
                    <span>{t.product.freeDelivery}</span>
                  </div>
                  <div className="pdp-trust-item">
                    <div className="pdp-trust-icon"><i className="fas fa-undo-alt"></i></div>
                    <span>{t.product.easyReturns}</span>
                  </div>
                  <div className="pdp-trust-item">
                    <div className="pdp-trust-icon"><i className="fas fa-shield-alt"></i></div>
                    <span>{t.product.genuine}</span>
                  </div>
                  <div className="pdp-trust-item">
                    <div className="pdp-trust-icon"><i className="fas fa-box-open"></i></div>
                    <span>{t.product.fastDispatch}</span>
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "30px 0" }} />

                {/* Coupons */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 15 }}>
                  <i className="fas fa-tag" style={{ color: "#1d5ba0" }}></i>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#253d4e", textTransform: "uppercase", letterSpacing: 0.5 }}>{t.product.availableOffers}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {displayedCoupons.map((c) => (
                    <div key={c.code} onClick={() => copyCode(c.code)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1.5px dashed #e2e8f0", borderRadius: 10, cursor: "pointer", transition: ".2s" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#1d5ba0", background: "#f0f5ff", padding: "4px 8px", borderRadius: 4, minWidth: 70, textAlign: "center" }}>{c.code}</span>
                      <span style={{ fontSize: 13, color: "#475569", flex: 1 }}>{c.text}</span>
                      {copiedCode === c.code && <i className="fas fa-check" style={{ color: "#16a34a", fontSize: 12 }}></i>}
                    </div>
                  ))}
                  <button onClick={() => setShowAllCoupons(!showAllCoupons)} style={{ background: "none", border: "none", color: "#1d5ba0", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", padding: "5px 0" }}>
                    {showAllCoupons ? t.product.showLess : `+ ${allCoupons.length - 3} ${t.product.showMore}`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Details Tabs */}
          <div style={{ marginTop: 40 }}>
            <div style={{ display: "flex", gap: 24, borderBottom: `2px solid ${isDark ? "rgba(71,85,105,0.5)" : "#f1f5f9"}`, marginBottom: 25, overflowX: "auto" }}>
              {["highlights", "information"].map((tkey) => (
                <button
                  key={tkey}
                  onClick={() => setTab(tkey)}
                  style={{
                    background: "none", border: "none", padding: "12px 0",
                    fontSize: 16, fontWeight: 800, cursor: "pointer",
                    color: tab === tkey ? "#1d5ba0" : (isDark ? "#94a3b8" : "#94a3b8"),
                    borderBottom: tab === tkey ? "3px solid #1d5ba0" : "3px solid transparent",
                    transition: ".2s",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {tkey === "highlights" ? t.product.highlights : t.product.information}
                </button>
              ))}
            </div>
            <div style={{ background: isDark ? "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(19, 34, 56, 0.94))" : "#fff", borderRadius: 18, padding: isCompactDetails ? 18 : 30, boxShadow: isDark ? "0 18px 40px rgba(2,8,23,0.24)" : "0 4px 20px rgba(0,0,0,0.04)", border: `1px solid ${isDark ? "rgba(71,85,105,0.65)" : "rgba(226,232,240,0.9)"}`, overflow: "hidden" }}>
              {tab === "highlights" ? (
                <div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {[
                      { label: t.product.brand, value: product.brand || "Prime Basket" },
                      { label: t.product.category, value: t.categories?.[product._cat] || product._cat },
                      { label: t.product.keyFeatures, value: t.product[product.keyFeatures] || product.keyFeatures },
                      { label: t.product.dietaryPreference, value: t.product[product.dietaryPreference.toLowerCase().replace("-","")] || product.dietaryPreference },
                      { label: t.product.shelfLife, value: product.shelfLife },
                      { label: t.product.storage, value: product.storage },
                      { label: t.product.country, value: region === "ke" ? "Kenya" : "India" },
                    ].map((row) => (
                      <div key={row.label} style={{ display: "grid", gridTemplateColumns: isCompactDetails ? "1fr" : "minmax(138px, 186px) minmax(0, 1fr)", gap: isCompactDetails ? 6 : 16, padding: "14px 0", borderBottom: `1px solid ${isDark ? "rgba(71,85,105,0.52)" : "#f1f5f9"}` }}>
                        <span style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 14, fontWeight: 700, textTransform: isCompactDetails ? "uppercase" : "none", letterSpacing: isCompactDetails ? "0.04em" : "normal" }}>{row.label}</span>
                        <span style={{ color: isDark ? "#f8fafc" : "#253d4e", fontWeight: 700, fontSize: 14, minWidth: 0, overflowWrap: "anywhere", lineHeight: 1.55 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {product.nutrition && (
                    <div style={{ borderTop: `1px solid ${isDark ? "rgba(71,85,105,0.52)" : "#f1f5f9"}`, paddingTop: 20 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: isDark ? "#f8fafc" : "#253d4e", marginBottom: 15 }}>{t.product.nutritionInfo}</h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 15 }}>
                        {Object.entries(product.nutrition).map(([k, v]) => (
                          <div key={k} style={{ background: isDark ? "rgba(15, 23, 42, 0.76)" : "#f8faff", padding: "10px 16px", borderRadius: 12, border: `1px solid ${isDark ? "rgba(71,85,105,0.52)" : "#f1f5f9"}`, textAlign: "center", minWidth: isCompactDetails ? "calc(50% - 8px)" : 120, flex: isCompactDetails ? "1 1 calc(50% - 8px)" : "0 1 auto" }}>
                            <div style={{ fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", textTransform: "uppercase", fontWeight: 700, marginBottom: 4, overflowWrap: "anywhere" }}>{t.product[k] || k}</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#1d5ba0" }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p style={{ color: isDark ? "#cbd5e1" : "#475569", fontSize: 15, lineHeight: 1.7, marginBottom: 20, overflowWrap: "anywhere" }}>
                    {t.product.disclaimer.split(".")[0]}. {t.product.disclaimer.split(".")[1]}.
                  </p>

                  <div style={{ marginBottom: 25, display: "flex", flexDirection: "column" }}>
                    {[
                      { label: t.product.customerCare, value: "support@primebasket.com" },
                      { label: t.product.seller, value: "Prime Basket Retail Ltd." },
                      { label: t.product.shelfLife, value: product.shelfLife },
                    ].map((row) => (
                      <div key={row.label} style={{ display: "grid", gridTemplateColumns: isCompactDetails ? "1fr" : "minmax(138px, 186px) minmax(0, 1fr)", gap: isCompactDetails ? 6 : 16, padding: "14px 0", borderBottom: `1px solid ${isDark ? "rgba(71,85,105,0.52)" : "#f1f5f9"}` }}>
                        <span style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 14, fontWeight: 700, textTransform: isCompactDetails ? "uppercase" : "none", letterSpacing: isCompactDetails ? "0.04em" : "normal" }}>{row.label}</span>
                        <span style={{ color: isDark ? "#f8fafc" : "#253d4e", fontWeight: 700, fontSize: 14, minWidth: 0, overflowWrap: "anywhere", lineHeight: 1.55 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 20, padding: 15, background: isDark ? "rgba(89, 65, 10, 0.22)" : "#fff9f0", borderRadius: 12, border: `1px solid ${isDark ? "rgba(245, 158, 11, 0.32)" : "#ffeeba"}`, fontSize: 13, color: isDark ? "#fde68a" : "#856404", overflowWrap: "anywhere", lineHeight: 1.6 }}>
                    <strong>{t.product.disclaimer.split(":")[0]}:</strong> {t.product.disclaimer.split(":")[1]}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Similar Products */}
          <div style={{ marginTop: 60 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 25 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: isDark ? "#f8fafc" : "#253d4e", fontFamily: "'Quicksand', sans-serif" }}>You Might Also Like</h2>
              <button onClick={() => onCategorySelect && onCategorySelect(product._cat)} style={{ color: "#1d5ba0", fontWeight: 700, fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>View All</button>
            </div>
            {loadingSimilar ? (
              <div className="pdp-related-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(168px, 1fr))", gap: 14 }}>
                {Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: 280, background: isDark ? "rgba(15, 23, 42, 0.9)" : "#fff", borderRadius: 16, border: `1px solid ${isDark ? "rgba(71,85,105,0.52)" : "rgba(241,245,249,1)"}`, animation: "pulse 1.5s infinite" }} />)}
              </div>
            ) : (
              <div className="products-grid pdp-related-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(168px, 1fr))", gap: 14 }}>
                {similar.map((item) => (
                  <ProductCard 
                    key={item._uid} 
                    p={item} 
                    onAddCart={onAddCart} 
                    onDecreaseCart={onDecreaseCart} 
                    cart={cart} 
                    wishlist={wishlist} 
                    toggleWishlist={toggleWishlist} 
                    t={t} 
                    region={region} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
