// src/pages/AccountPage.jsx
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import "./Account.css";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n/translations";
import AddressModal from "../components/AddressModal";
import {
  formatPhoneForDisplay,
  getPhoneInputMaxLength,
  sanitizePhoneInput,
  validateAndNormalizePhone,
} from "../utils/phoneValidation";
import { getLocalizedProductName } from "../utils/translationUtils";
import { resolveProductImage } from "../utils/productUtils";

// Shared key used by both AccountPage and CartPage
export const ADDRESSES_KEY = "pb_saved_addresses";
const REFUND_REQUESTS_KEY = "refund_requests";
const WALLET_KEY = "wallet";

const REFUND_STATUSES = ["Requested", "Processing", "Completed"];
const RETURN_STATUSES = ["Requested", "Pickup Scheduled", "Picked", "Verified", "Refund Initiated", "Completed"];
const RETURN_REASONS = [
  { label: "Item not received", type: "refund" },
  { label: "Damaged / Wrong item", type: "return" },
  { label: "Quality issue", type: "return" },
  { label: "Don't need anymore", type: "return" },
];

function loadRefundRequests() {
  try {
    return JSON.parse(localStorage.getItem(REFUND_REQUESTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRefundRequests(requests) {
  localStorage.setItem(REFUND_REQUESTS_KEY, JSON.stringify(requests));
}

function loadWallet() {
  try {
    const wallet = JSON.parse(localStorage.getItem(WALLET_KEY) || "null");
    if (wallet && typeof wallet === "object" && typeof wallet.balance === "number") return wallet;
    return { balance: 0.00, transactions: [] };
  } catch {
    return { balance: 0.00, transactions: [] };
  }
}

function saveWallet(wallet) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
}

function parseMoney(value) {
  return Number(String(value || "").replace(/[^0-9.]/g, "")) || 0;
}

function statusSteps(type) {
  return type === "return" ? RETURN_STATUSES : REFUND_STATUSES;
}

function statusLabel(type, status) {
  if (type === "return" && status === "Requested") return "Return Requested";
  if (type === "refund" && status === "Requested") return "Refund Requested";
  return status;
}

function statusClass(status) {
  if (status === "Completed") return "done";
  if (status === "Processing" || status === "Refund Initiated" || status === "Verified") return "processing";
  return "pending";
}

function makeOrderItemId(order, item, index) {
  return `${order.orderId}_${item?._uid || item?.id || index}`;
}

function getItemAmount(item) {
  return parseMoney(item?.price) * (item?.quantity || 1);
}

function InlineNotice({ notice, onClose }) {
  if (!notice?.text) return null;

  return (
    <div className={`account-inline-notice ${notice.type || "info"}`} role="status" aria-live="polite">
      <div className="account-inline-notice-copy">
        <i
          className={`fas ${
            notice.type === "error"
              ? "fa-circle-exclamation"
              : notice.type === "success"
                ? "fa-circle-check"
                : "fa-circle-info"
          }`}
        ></i>
        <span>{notice.text}</span>
      </div>
      {onClose && (
        <button type="button" className="account-inline-notice-close" onClick={onClose} aria-label="Dismiss message">
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  );
}

function EmptySectionState({
  icon = "fa-folder-open",
  title = "Nothing here yet",
  description = "This section will show your saved information once it becomes available.",
}) {
  return (
    <div className="account-empty-state" role="status" aria-live="polite">
      <div className="account-empty-state-icon">
        <i className={`fas ${icon}`}></i>
      </div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  return createPortal(
    <div className="account-confirm-overlay" onClick={onClose}>
      <div className="account-confirm-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="account-confirm-icon-wrap">
          <div className={`account-confirm-icon ${tone}`}>
            <i className={`fas ${tone === "danger" ? "fa-trash-can" : "fa-circle-check"}`}></i>
          </div>
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="account-confirm-actions">
          <button type="button" className="account-confirm-btn secondary" onClick={onClose}>
            {cancelLabel}
          </button>
          <button type="button" className={`account-confirm-btn ${tone}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AccountPage({ onGoHome, onLogout, initialSection = "profile", onSectionChange, orders: propOrders = [], notifications = [], onClearNotifications, language = "en", region = "in", onOrderSummary, onRateOrder, onOrderAgain, onBuyAgainItem, onDeleteOrder }) {
  const t = useT(language);
  const { logout, user, updateUser } = useAuth();
  const currSym = region === "ke" ? "KES " : "\u20b9";
  const buyAgainLabel = language === "ke" ? "Nunua Tena" : "Buy Again";
  const [isDesktopLayout, setIsDesktopLayout] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth > 900 : true
  );
  const shouldOpenInitialDetail = initialSection && initialSection !== "profile";
  const [section, setSection] = useState(shouldOpenInitialDetail ? initialSection : "profile");
  const [viewMode, setViewMode] = useState(shouldOpenInitialDetail ? "detail" : "menu");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const walletSectionLabel = language === "ke" ? "Pochi yangu" : "My Wallet";

  const menuItems = useMemo(() => ([
    { key: "profile", icon: "fa-user", label: t.account.profile, subtitle: "Manage your personal details" },
    { key: "orders", icon: "fa-box", label: t.account.orders, subtitle: "Track and manage your purchases" },
    { key: "buyAgain", icon: "fa-rotate-right", label: buyAgainLabel, subtitle: "Quickly reorder products you purchased before" },
    { key: "refunds", icon: "fa-rotate-left", label: t.account.myRefunds, subtitle: "Review returns and refund requests" },
    { key: "wallet", icon: "fa-wallet", label: walletSectionLabel, subtitle: "Add money, check balance, and review wallet activity" },
    { key: "addresses", icon: "fa-location-dot", label: t.account.addresses, subtitle: "Saved delivery locations" },
    { key: "giftcards", icon: "fa-gift", label: t.account.giftCards, subtitle: "Rewards, balances, and gift cards" },
    { key: "notifications", icon: "fa-bell", label: t.header.notifications, subtitle: "Latest alerts and updates" },
    { key: "payments", icon: "fa-credit-card", label: t.footer.paymentMethods, subtitle: "Cards, wallets, and secure payments" },
    { key: "help", icon: "fa-circle-question", label: t.links.helpTicket, subtitle: "Support and help tickets" },
    { key: "logout", icon: "fa-right-from-bracket", label: t.account.logout, subtitle: "Sign out of your account", tone: "logout" },
  ]), [buyAgainLabel, t, walletSectionLabel]);

  const sectionMeta = useMemo(() => ({
    profile: { title: t.account.profile, subtitle: "Update your profile, phone, and email details." },
    orders: { title: t.account.orders, subtitle: "See placed orders, reorder items, and rate deliveries." },
    buyAgain: { title: buyAgainLabel, subtitle: "Reorder the exact products from your previous deliveries, one item at a time." },
    refunds: { title: t.account.myRefunds, subtitle: "Track refunds, return progress, and request updates." },
    wallet: { title: walletSectionLabel, subtitle: "Add money to your wallet, track balance, and review wallet credits." },
    addresses: { title: t.account.addresses, subtitle: "Manage saved delivery addresses and location details." },
    giftcards: { title: t.account.giftCards, subtitle: "Handle rewards, promo balances, and gift card activity." },
    notifications: { title: t.header.notifications, subtitle: "Review recent account, order, and offer notifications." },
    payments: { title: t.footer.paymentMethods, subtitle: "Manage secure payment methods, wallets, and payment info." },
    help: { title: t.links.helpTicket, subtitle: "Open support requests and browse help resources." },
  }), [buyAgainLabel, t, walletSectionLabel]);

  // Sync when parent changes initialSection (e.g. navigating from OrderSuccessPage)
  useEffect(() => {
    const nextSection = initialSection || "profile";
    const nextIsDetail = nextSection !== "profile";
    setSection(nextIsDetail ? nextSection : "profile");
    setViewMode(nextIsDetail ? "detail" : "menu");
  }, [initialSection]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncLayout = () => setIsDesktopLayout(window.innerWidth > 900);
    syncLayout();
    window.addEventListener("resize", syncLayout);
    return () => window.removeEventListener("resize", syncLayout);
  }, []);

  const openSection = (nextSection) => {
    if (nextSection === "logout") {
      setLogoutConfirmOpen(true);
      return;
    }
    setSection(nextSection);
    setViewMode("detail");
    onSectionChange && onSectionChange(nextSection);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const backToMenu = () => {
    setViewMode("menu");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();   // clears cart, wishlist, auth, and goes home
    } else {
      logout();
      onGoHome();
    }
  };

  const renderSectionContent = () => (
    <>
      {section === "profile" && <Profile user={user} updateUser={updateUser} t={t} language={language} region={region} />}
      {section === "orders" && <OrdersSection orders={propOrders} t={t} currSym={currSym} onOrderSummary={onOrderSummary} onRateOrder={onRateOrder} onOrderAgain={onOrderAgain} onDeleteOrder={onDeleteOrder} language={language} />}
      {section === "buyAgain" && <BuyAgainSection orders={propOrders} t={t} currSym={currSym} language={language} onBuyAgainItem={onBuyAgainItem} />}
      {section === "addresses" && <AddressSection t={t} language={language} region={region} />}
      {section === "refunds" && <RefundsDemoSection t={t} currSym={currSym} region={region} language={language} />}
      {section === "wallet" && <WalletSection t={t} currSym={currSym} region={region} language={language} />}
      {section === "giftcards" && <GiftCardsSection t={t} currSym={currSym} language={language} />}
      {section === "notifications" && <NotificationsSection t={t} language={language} notifications={notifications} onClearNotifications={onClearNotifications} />}
      {section === "payments" && <PaymentsSection t={t} region={region} language={language} />}
      {section === "help" && <HelpSection t={t} language={language} />}
    </>
  );

  if (isDesktopLayout) {
    return (
      <>
        <div className="account-container account-desktop-layout">
          <aside className="account-sidebar">
            <div className="account-sidebar-header">
              <div className="account-title-row">
                <h2>{t.account.title}</h2>
                <button type="button" className="account-back-btn account-home-btn account-desktop-home" onClick={onGoHome}>
                  <i className="fas fa-house"></i>
                  <span>{t.cart?.breadcrumbHome || "Home"}</span>
                </button>
              </div>
              <p className="account-sidebar-subtitle">
                {user?.name ? `${user.name.split(" ")[0]}, manage everything from one place.` : "Manage everything from one place."}
              </p>
            </div>

            <div className="account-menu">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`account-item${section === item.key ? " active" : ""}${item.tone === "logout" ? " logout" : ""}`}
                  onClick={() => {
                    if (item.key === "logout") {
                      setLogoutConfirmOpen(true);
                      return;
                    }
                    setSection(item.key);
                    onSectionChange && onSectionChange(item.key);
                  }}
                >
                  <i className={`fas ${item.icon}`}></i>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="account-content">
            <div className="account-desktop-panel">
              <div className="account-desktop-panel-head">
                <div className="account-menu-eyebrow">{t.account.title}</div>
                <h2>{sectionMeta[section]?.title || t.account.title}</h2>
                <p>{sectionMeta[section]?.subtitle || "Manage your account section details."}</p>
              </div>
              <div className="account-detail-content">
                {renderSectionContent()}
              </div>
            </div>
          </main>
        </div>
        <ConfirmDialog
          open={logoutConfirmOpen}
          title={language === "ke" ? "Una uhakika unataka kutoka?" : "Are you sure you want to log out?"}
          message={language === "ke" ? "Utatoka kwenye akaunti hii na utahitaji kuingia tena ili kufikia maelezo yako." : "You will be signed out of this account and will need to sign in again to access your details."}
          confirmLabel={language === "ke" ? "Toka" : "Log out"}
          cancelLabel={language === "ke" ? "Ghairi" : "Cancel"}
          tone="danger"
          onConfirm={() => {
            setLogoutConfirmOpen(false);
            handleLogout();
          }}
          onClose={() => setLogoutConfirmOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className={`account-container reveal ${viewMode === "detail" ? "detail-open" : "menu-open"}`}>
        {viewMode === "menu" ? (
          <div className="account-menu-stage">
          <div className="account-menu-hero">
            <div className="account-title-row">
              <div className="account-menu-eyebrow">{t.account.title}</div>
              <button type="button" className="account-back-btn account-home-btn" onClick={onGoHome}>
                <i className="fas fa-house"></i>
                <span>{t.cart?.breadcrumbHome || "Home"}</span>
              </button>
            </div>
            <h2>{user?.name ? `${user.name.split(" ")[0]}, choose what you want to manage` : "Choose what you want to manage"}</h2>
            <p>Open one section at a time for a cleaner, full-screen account experience.</p>
          </div>

          <div className="account-menu-grid">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`account-menu-card${item.tone === "logout" ? " logout" : ""}`}
                onClick={() => openSection(item.key)}
              >
                <div className="account-menu-card-icon">
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <div className="account-menu-card-copy">
                  <strong>{item.label}</strong>
                  <span>{item.subtitle}</span>
                </div>
                <i className={`fas ${item.tone === "logout" ? "fa-arrow-right-from-bracket" : "fa-chevron-right"} account-menu-card-arrow`}></i>
              </button>
            ))}
          </div>
          </div>
        ) : (
          <div className="account-detail-stage">
          <div className="account-detail-bar">
            <div className="account-detail-actions">
              <button type="button" className="account-back-btn" onClick={backToMenu}>
                <i className="fas fa-arrow-left"></i>
                <span>Back</span>
              </button>
            </div>
            <div className="account-detail-copy">
              <div className="account-title-row">
                <div className="account-menu-eyebrow">{t.account.title}</div>
                <button type="button" className="account-back-btn account-home-btn" onClick={onGoHome}>
                  <i className="fas fa-house"></i>
                  <span>{t.cart?.breadcrumbHome || "Home"}</span>
                </button>
              </div>
              <h2>{sectionMeta[section]?.title || t.account.title}</h2>
              <p>{sectionMeta[section]?.subtitle || "Manage your account section details."}</p>
            </div>
          </div>

          <div className="account-detail-content">
            {renderSectionContent()}
          </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={logoutConfirmOpen}
        title={language === "ke" ? "Una uhakika unataka kutoka?" : "Are you sure you want to log out?"}
        message={language === "ke" ? "Utatoka kwenye akaunti hii na utahitaji kuingia tena ili kufikia maelezo yako." : "You will be signed out of this account and will need to sign in again to access your details."}
        confirmLabel={language === "ke" ? "Toka" : "Log out"}
        cancelLabel={language === "ke" ? "Ghairi" : "Cancel"}
        tone="danger"
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          handleLogout();
        }}
        onClose={() => setLogoutConfirmOpen(false)}
      />
    </>
  );
}

export default AccountPage;


/* ─── Profile Component ──────────────────────────────────────────── */

function Profile({ user, updateUser, t, language = "en", region = "in" }) {
  const [isEditing, setIsEditing] = useState(false);
  const [photo, setPhoto] = useState(null); // Temporary preview
  const [displayPhoto, setDisplayPhoto] = useState(user?.profileImage || null);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [emailError, setEmailError] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [notice, setNotice] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    try {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailError("Please enter a valid email address");
        return;
      }
      
      const saved = JSON.parse(localStorage.getItem("user") || "{}");
      const updated = { ...saved, name, email, phone, profileImage: photo || displayPhoto };
      if (updateUser) {
        updateUser(updated);
      } else {
        localStorage.setItem("user", JSON.stringify(updated));
      }
      setDisplayPhoto(photo || displayPhoto);
      setPhoto(null);
      setEmailError("");
      setIsEditing(false);
      setNotice({ type: "success", text: `${t.account.details} saved successfully.` });
    } catch {
      setIsEditing(false);
      setNotice({ type: "success", text: `${t.account.details} saved successfully.` });
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setDisplayPhoto(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(user?.name || "");
    setEmail(user?.email || "");
    setEmailError("");
    setPhone(user?.phone || "");
    setPhoto(null);
  };

  const userInitial = name ? name.charAt(0).toUpperCase() : "";
  const hasPhoto = photo || displayPhoto;

  return (
    <div className="profile-container">
      <div className="account-panel-head">
        <h2>{t.account.details}</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="account-panel-action"
          >
            {t.account.edit}
          </button>
        )}
      </div>

      <InlineNotice notice={notice} onClose={() => setNotice(null)} />

      <div className="profile-layout">
        <div className="profile-photo-section">
          {hasPhoto ? (
            <img
              src={photo || displayPhoto}
              alt="Profile"
              className="profile-photo"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="profile-photo profile-photo-fallback">
              {userInitial}
            </div>
          )}
          {isEditing && (
            <div className="profile-photo-actions">
              <label htmlFor="profile-upload" className="profile-photo-trigger">
                {hasPhoto ? t.account.changePhoto : t.account.uploadPhoto}
              </label>
              <input id="profile-upload" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
              {hasPhoto && (
                <button 
                  onClick={handleRemovePhoto}
                  className="profile-photo-remove"
                >
                  <i className="fas fa-trash-alt"></i> {t.account.removePhoto}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="profile-form profile-fields">
          <div className="profile-field">
            <label>{t.account.fullName}</label>
            {isEditing ? (
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            ) : (
              <div className="profile-value">{name || "N/A"}</div>
            )}
          </div>

          <div className="profile-field">
            <label>{t.account.emailAddress}</label>
            {isEditing ? (
              <>
                <input className={emailError ? "has-error" : ""} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(""); }} />
                {emailError && <div className="profile-error">{emailError}</div>}
              </>
            ) : (
              <div className="profile-value">{email || "N/A"}</div>
            )}
          </div>

          <div className="profile-field">
            <label>{t.account.phoneNumber}</label>
            {isEditing ? (
              <div className="profile-readonly-wrap">
                <input
                  type="text"
                  disabled
                  value={formatPhoneForDisplay(region, phone) || ""}
                  className="profile-readonly"
                />
                <i className="fas fa-lock profile-readonly-icon"></i>
              </div>
            ) : (
              <div className="profile-value">
                {formatPhoneForDisplay(region, phone) || "N/A"}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="profile-actions">
              <button
                onClick={handleSave}
                className="save-btn"
              >
                {t.account.saveDetails}
              </button>
              <button
                onClick={handleCancel}
                className="save-btn secondary"
              >
                {t.account.cancel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ─── Orders Component ───────────────────────────────────────────── */

function BuyAgainSection({ orders = [], t, currSym = "\u20b9", language = "en", onBuyAgainItem }) {
  const buyAgainItems = useMemo(() => {
    const flattened = orders.flatMap((order) =>
      (order.items || []).map((item, index) => ({
        ...item,
        _buyAgainKey: `${order.orderId}_${item?._uid || item?.id || item?.name || index}`,
        _orderId: order.orderId,
      }))
    );

    const deduped = new Map();
    flattened.forEach((item) => {
      const key = `${item._uid || item.name}_${item.selectedUnit || item.standard || item.unit || "default"}`;
      if (!deduped.has(key)) deduped.set(key, item);
    });

    return Array.from(deduped.values());
  }, [orders]);

  return (
    <div className="buy-again-card">
      <div className="account-panel-head">
        <h2>{language === "ke" ? "Nunua bidhaa zako tena" : "Buy your favourites again"}</h2>
      </div>

      {buyAgainItems.length === 0 ? (
        <EmptySectionState
          icon="fa-rotate-right"
          title={language === "ke" ? "Hakuna bidhaa za kununua tena bado" : "No buy again products yet"}
          description={
            language === "ke"
              ? "Bidhaa kutoka kwa oda zako zilizowasilishwa zitaonekana hapa ili uweze kuzinunua tena haraka."
              : "Products from your delivered orders will appear here so you can reorder them quickly."
          }
        />
      ) : (
        <div className="buy-again-grid">
          {buyAgainItems.map((item) => {
            const translatedName = getLocalizedProductName(item.name, t);
            return (
              <article key={item._buyAgainKey} className="buy-again-item">
                <div className="buy-again-thumb">
                  <img src={resolveProductImage(item)} alt={translatedName} loading="lazy" decoding="async" />
                </div>
                <div className="buy-again-copy">
                  <div className="buy-again-brand">{item.brand || (language === "ke" ? "Bidhaa ya zamani" : "Previous order item")}</div>
                  <h3>{translatedName}</h3>
                  <div className="buy-again-meta">
                    <span>{item.selectedUnit || item.standard || item.unit || "1 unit"}</span>
                    <span>{language === "ke" ? "Oda" : "Order"} #{item._orderId}</span>
                  </div>
                  <div className="buy-again-footer">
                    <strong>{item.price || `${currSym}0.00`}</strong>
                    <button type="button" className="buy-again-btn" onClick={() => onBuyAgainItem?.(item)}>
                      <i className="fas fa-cart-plus"></i>
                      <span>{language === "ke" ? "Nunua tena" : "Buy Again"}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrdersSection({ orders = [], t, currSym = "\u20b9", onOrderSummary, onRateOrder, onOrderAgain, onDeleteOrder }) {
  const [loading, setLoading] = useState(true);

  const [activeMenuOrderId, setActiveMenuOrderId] = useState(null);
  const [refundRequests, setRefundRequests] = useState(loadRefundRequests);
  const [returnModal, setReturnModal] = useState(null);
  const [returnStep, setReturnStep] = useState(1);
  const [returnReason, setReturnReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [demoToast, setDemoToast] = useState("");
  const [now, setNow] = useState(Date.now());
  const [orderFilter, setOrderFilter] = useState("Delivered"); // Default filter
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Refreshes the UI state for time-dependent logic
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const [markedOrders, setMarkedOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pb_marked_orders") || "[]"); } catch { return []; }
  });

  const [reviews, setReviews] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pb_order_reviews") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    const sync = () => {
      setRefundRequests(loadRefundRequests());
      setReviews(JSON.parse(localStorage.getItem("pb_order_reviews") || "[]"));
    };
    window.addEventListener("storage", sync);
    window.addEventListener("refund-requests-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("refund-requests-updated", sync);
    };
  }, []);

  const updateRequestStatus = (id, status) => {
    setRefundRequests(prev => {
      const updated = prev.map(req => req.id === id ? { ...req, status } : req);
      saveRefundRequests(updated);
      window.dispatchEvent(new Event("refund-requests-updated"));
      return updated;
    });
  };

  const completeWalletCredit = (request) => {
    if (request.refundMethod !== "Wallet") return;
    const wallet = loadWallet();
    const alreadyCredited = wallet.transactions.some(tx => tx.requestId === request.id);
    if (alreadyCredited) return;
    const updatedWallet = {
      balance: Number(wallet.balance || 0) + Number(request.amount || 0),
      transactions: [
        {
          requestId: request.id,
          amount: Number(request.amount || 0),
          type: "credit",
          reason: request.reason,
          orderId: request.orderId,
          date: new Date().toISOString(),
        },
        ...(wallet.transactions || []),
      ],
    };
    saveWallet(updatedWallet);
    window.dispatchEvent(new Event("wallet-updated"));
    setDemoToast("Refund processed successfully. Wallet updated.");
    setTimeout(() => setDemoToast(""), 2600);
  };

  const runDemoFlow = (request) => {
    const flow = request.type === "return"
      ? [
          ["Pickup Scheduled", 3000],
          ["Picked", 7000],
          ["Verified", 11000],
          ["Refund Initiated", 15000],
          ["Completed", 19000],
        ]
      : [
          ["Processing", 3000],
          ["Completed", request.refundMethod === "Wallet" ? 7000 : 10000],
        ];

    flow.forEach(([status, delay]) => {
      setTimeout(() => {
        updateRequestStatus(request.id, status);
        if (status === "Completed") completeWalletCredit(request);
      }, delay);
    });
  };

  const resetReturnModal = () => {
    setReturnModal(null);
    setReturnStep(1);
    setReturnReason("");
    setRefundMethod("");
    setSubmittingRequest(false);
  };

  const getRequestForItem = (order, item, index) => {
    const orderItemId = makeOrderItemId(order, item, index);
    return refundRequests.find(req => req.orderItemId === orderItemId);
  };

  const startItemFlow = (order, item, index, selectedType) => {
    if (getRequestForItem(order, item, index)) return;
    setReturnModal({
      order,
      item,
      index,
      selectedType,
      orderItemId: makeOrderItemId(order, item, index),
      amount: getItemAmount(item),
    });
    setReturnStep(1);
    setReturnReason("");
    setRefundMethod("");
  };

  const selectedReasonMeta = RETURN_REASONS.find(reason => reason.label === returnReason);
  const selectedFlowType = selectedReasonMeta?.type || returnModal?.selectedType || "refund";

  const submitDemoRequest = () => {
    if (!returnModal || !returnReason || !refundMethod) return;
    const duplicate = refundRequests.some(req => req.orderItemId === returnModal.orderItemId);
    if (duplicate) {
      resetReturnModal();
      return;
    }
    setSubmittingRequest(true);
    const request = {
      id: `${selectedFlowType === "return" ? "RET" : "RFD"}${Date.now().toString().slice(-7)}`,
      orderId: returnModal.order.orderId,
      orderItemId: returnModal.orderItemId,
      productName: getTranslatedName(returnModal.item?.name) || "Order item",
      productImage: returnModal.item?.imageUrl || "",
      reason: returnReason,
      type: selectedFlowType,
      status: "Requested",
      refundMethod,
      amount: returnModal.amount,
      timestamp: new Date().toISOString(),
    };

    setTimeout(() => {
      setRefundRequests(prev => {
        const updated = [request, ...prev];
        saveRefundRequests(updated);
        window.dispatchEvent(new Event("refund-requests-updated"));
        return updated;
      });
      setSubmittingRequest(false);
      setReturnStep(3);
      runDemoFlow(request);
    }, 700);
  };

  const toggleMark = (orderId) => {
    setMarkedOrders(prev => {
      const updated = prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId];
      localStorage.setItem("pb_marked_orders", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteOrder = (orderId) => {
    setActiveMenuOrderId(null);
    setOrderToDelete(orderId);
  };

  const allOrders = useMemo(() => {
    let filtered = [...orders];
    if (orderFilter === "Delivered") {
      filtered = filtered.filter(o => o.status === "Delivered");
    }
    return filtered;
  }, [orders, orderFilter]);

  // Simulate loading
  useState(() => { setTimeout(() => setLoading(false), 800); });

  const methodLabel = { upi: "UPI", card: "Card", netbanking: "Net Banking", wallet: "Wallet", cod: "COD" };

  const statusConfig = {
    Delivered: { bg: "#dcfce7", color: "#16a34a", icon: "fa-check-circle", label: "Delivered" },
    Processing: { bg: "#fef9c3", color: "#ca8a04", icon: "fa-clock", label: "In Process" },
    "Out for Delivery": { bg: "#dbeafe", color: "#1d5ba0", icon: "fa-truck-loading", label: "Out for Delivery" },
    Confirmed: { bg: "#f0f5ff", color: "#1d5ba0", icon: "fa-clipboard-check", label: "Confirmed" },
    Packed: { bg: "#fef3c7", color: "#d97706", icon: "fa-box-open", label: "Packed" },
    Cancelled: { bg: "#fee2e2", color: "#dc2626", icon: "fa-times-circle", label: "Cancelled" },
  };

  const getTranslatedName = (name) => getLocalizedProductName(name, t);

  return (
    <div className="orders-card">
      <style>{`
        .ord-menu-container { position: relative; }
        .ord-dots {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.2s; color: #94a3b8;
        }
        .ord-dots:hover { background: #f1f5f9; color: #1d5ba0; }
        .ord-menu-dropdown {
          position: absolute; right: 0; top: 35px;
          background: white; border: 1px solid #e2e8f0;
          border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          z-index: 100; width: 180px; overflow: hidden;
        }
        .ord-menu-item {
          padding: 12px 16px; font-size: 13px; font-weight: 600;
          color: #475569; display: flex; align-items: center; gap: 10px;
          cursor: pointer; transition: 0.15s;
        }
        .ord-menu-item:hover { background: #f8fafc; color: #1d5ba0; }
        .ord-menu-item i { width: 16px; text-align: center; }
        
        /* Return Flow Modal */
        .ret-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6); z-index: 2000;
          display: flex; align-items: center; justify-content: center;
        }
        .ret-modal {
          background: white; border-radius: 20px; width: 95%; max-width: 500px;
          max-height: 90vh; overflow-y: auto;
        }
        .ret-header { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
        .ret-body { padding: 24px; }
        .ret-step-title { font-size: 18px; font-weight: 800; color: #253d4e; margin-bottom: 10px; }
        .ret-reason-opt {
          padding: 14px; border: 1.5px solid #e2e8f0; border-radius: 12px;
          margin-bottom: 10px; cursor: pointer; font-weight: 600; color: #475569;
          transition: 0.2s;
        }
        .ret-reason-opt:hover { border-color: #1d5ba0; background: #f0f5ff; }
        .ret-reason-opt.selected { border-color: #1d5ba0; background: #f0f5ff; color: #1d5ba0; }
        .ret-reason-opt.disabled { opacity: .45; pointer-events: none; background: #f8fafc; }
        .ret-summary {
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px;
          padding: 14px; margin-bottom: 16px; display: flex; gap: 12px; align-items: center;
        }
        .ret-summary img { width: 48px; height: 48px; object-fit: contain; border-radius: 10px; background: #fff; border: 1px solid #edf2f7; }
        .ret-progress { display:flex; flex-direction:column; gap:10px; margin:18px 0; }
        .ret-progress-row { display:flex; align-items:center; gap:10px; color:#94a3b8; font-size:13px; font-weight:700; }
        .ret-progress-dot { width:18px; height:18px; border-radius:50%; background:#e2e8f0; display:flex; align-items:center; justify-content:center; color:white; font-size:9px; }
        .ret-progress-row.active { color:#1d5ba0; }
        .ret-progress-row.active .ret-progress-dot { background:#1d5ba0; }
        .ord-line-items { padding: 0 22px 14px; display:flex; flex-direction:column; gap:10px; }
        .ord-line-item {
          border:1px solid #edf2f7; border-radius:12px; padding:12px;
          display:grid; grid-template-columns:48px minmax(0,1fr) auto; gap:12px; align-items:center;
          background:#fff;
        }
        .ord-line-img { width:48px; height:48px; border-radius:10px; border:1px solid #edf2f7; display:flex; align-items:center; justify-content:center; background:#fafafa; overflow:hidden; }
        .ord-line-img img { max-width:100%; max-height:100%; object-fit:contain; }
        .ord-line-name { font-weight:800; color:#253d4e; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ord-line-meta { color:#64748b; font-size:12px; margin-top:3px; }
        .ord-item-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
        .ord-item-btn {
          border:none; border-radius:8px; padding:8px 11px; font-size:12px; font-weight:800;
          cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:.15s;
        }
        .ord-item-btn.return { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }
        .ord-item-btn.refund { background:#eff6ff; color:#1d5ba0; border:1px solid #bfdbfe; }
        .ord-item-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; }
        .ord-refund-badge {
          display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px;
          font-size:11px; font-weight:800; white-space:nowrap;
        }
        .ord-refund-badge.done { background:#dcfce7; color:#16a34a; }
        .ord-refund-badge.processing { background:#fef9c3; color:#ca8a04; }
        .ord-refund-badge.pending { background:#e8f0fb; color:#1d5ba0; }
        .demo-toast {
          position: fixed; top: 92px; left: 50%; transform: translateX(-50%);
          background:#16a34a; color:white; padding:12px 18px; border-radius:999px;
          box-shadow:0 10px 28px rgba(22,163,74,.25); z-index:3000; font-weight:800; font-size:13px;
        }
        .ord-card { background:#fff; border:1px solid #edf2f7; border-radius:16px; margin-bottom:20px; overflow:hidden; }
        .ord-header { padding:20px; display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #edf2f7; }
        .ord-id { font-size:15px; font-weight:800; color:#253d4e; display:flex; align-items:center; gap:6px; }
        .ord-date { font-size:12px; color:#94a3b8; margin-top:4px; display:block; }
        .ord-total { font-size:16px; font-weight:800; color:#253d4e; }
        .ord-status { padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; margin-left:10px; }
        .ord-right { display:flex; align-items:center; }
        .ord-thumbs { padding:14px 20px; display:flex; align-items:center; gap:8px; }
        .ord-thumb { width:40px; height:40px; border-radius:8px; border:1px solid #edf2f7; background:#fafafa; overflow:hidden; }
        .ord-thumb img { width:100%; height:100%; object-fit:contain; }
        .ord-thumb-more { width:40px; height:40px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; border-radius:8px; font-size:12px; font-weight:700; color:#64748b; }
        .ord-thumb-text { font-size:13px; color:#64748b; margin-left:8px; }
        .ord-address { padding:0 20px 14px; font-size:13px; color:#64748b; }
        .ord-actions { padding:14px 20px; background:#fafafa; border-top:1px solid #edf2f7; display:flex; gap:10px; }
        .ord-btn { padding:10px 16px; border-radius:8px; border:none; font-size:12px; font-weight:700; cursor:pointer; }
        .ord-btn-summary { background:#fff; border:1px solid #e2e8f0; color:#475569; }
        .ord-btn-rate { background:#fff; border:1px solid #e2e8f0; color:#475569; }
        .ord-btn-again { background:#1d5ba0; color:#fff; }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 5px 20px" }}>
        <h2 style={{ margin: 0 }}>{t.account.orders}</h2>
        <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "10px" }}>
          <button 
            onClick={() => setOrderFilter("Delivered")}
            style={{ 
              padding: "8px 16px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 700,
              background: orderFilter === "Delivered" ? "white" : "transparent",
              color: orderFilter === "Delivered" ? "#1d5ba0" : "#64748b",
              boxShadow: orderFilter === "Delivered" ? "0 2px 8px rgba(0,0,0,0.05)" : "none"
            }}
          >
            Delivered
          </button>
          <button 
            onClick={() => setOrderFilter("All")}
            style={{ 
              padding: "8px 16px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 700,
              background: orderFilter === "All" ? "white" : "transparent",
              color: orderFilter === "All" ? "#1d5ba0" : "#64748b",
              boxShadow: orderFilter === "All" ? "0 2px 8px rgba(0,0,0,0.05)" : "none"
            }}
          >
            All Orders
          </button>
        </div>
      </div>

      {/* Return/Refund Flow Modal */}
      {demoToast && createPortal(<div className="demo-toast"><i className="fas fa-check-circle" style={{ marginRight: 8 }}></i>{demoToast}</div>, document.body)}
      {returnModal && createPortal(
        <div className="ret-overlay" style={{ backdropFilter: "blur(5px)" }}>
          <div className="ret-modal" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1000 }}>
            <div className="ret-header">
              <h3 style={{ margin: 0 }}>Return/Refund: #{returnModal.order.orderId}</h3>
              <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }} onClick={resetReturnModal}>&times;</button>
            </div>
            <div className="ret-body">
              <div className="ret-summary">
                {returnModal.item?.imageUrl && <img src={resolveProductImage(returnModal.item)} alt={getTranslatedName(returnModal.item?.name)} loading="lazy" decoding="async" />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: "#253d4e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getTranslatedName(returnModal.item?.name) || "Order item"}</div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>Refund amount: <strong>{currSym}{returnModal.amount.toFixed(2)}</strong></div>
                </div>
              </div>
              {returnStep === 1 && (
                <>
                  <div className="ret-step-title">Step 1: Why are you returning this?</div>
                  <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Please select the most accurate reason.</p>
                  {RETURN_REASONS.map(reason => (
                    <div key={reason.label} className={`ret-reason-opt ${returnReason === reason.label ? 'selected' : ''}`} onClick={() => setReturnReason(reason.label)}>
                      <strong>{reason.label}</strong>
                      <div style={{ fontSize: 12, opacity: .72, marginTop: 3 }}>
                        {reason.type === "refund" ? "Refund only, no pickup" : "Return pickup and refund"}
                      </div>
                    </div>
                  ))}
                  <button 
                    disabled={!returnReason}
                    style={{ width: '100%', padding: 14, borderRadius: 10, background: returnReason ? '#1d5ba0' : '#cbd5e1', color: 'white', border: 'none', fontWeight: 700, marginTop: 10 }} 
                    onClick={() => setReturnStep(2)}
                  >
                    Next Step
                  </button>
                </>
              )}

              {returnStep === 2 && (
                <>
                  <div className="ret-step-title">Step 2: Choose Refund Method</div>
                  <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Where would you like to receive your refund?</p>
                  <div className={`ret-reason-opt ${refundMethod === "Original Payment" ? "selected" : ""}`} onClick={() => setRefundMethod("Original Payment")}>
                    <strong>Original Payment Mode</strong>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Demo delay: 2-3 seconds</div>
                  </div>
                  <div className={`ret-reason-opt ${refundMethod === "Wallet" ? "selected" : ""}`} onClick={() => setRefundMethod("Wallet")}>
                    <strong>Prime-Basket Wallet</strong>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Instant refund (Recommended)</div>
                  </div>
                  <button
                    disabled={!refundMethod || submittingRequest}
                    style={{ width: '100%', padding: 14, borderRadius: 10, background: refundMethod ? '#1d5ba0' : '#cbd5e1', color: 'white', border: 'none', fontWeight: 700, marginTop: 10 }}
                    onClick={submitDemoRequest}
                  >
                    {submittingRequest ? "Creating request..." : "Confirm Request"}
                  </button>
                  <button style={{ width: '100%', padding: 14, borderRadius: 10, background: '#f1f5f9', border: 'none', fontWeight: 700, marginTop: 10 }} onClick={() => setReturnStep(1)}>Back</button>
                </>
              )}

              {returnStep === 3 && (
                <div style={{ padding: '8px 0' }}>
                  <div className="ret-step-title">Step 3: Processing...</div>
                  <p style={{ color: '#64748b', fontSize: 14, marginBottom: 12 }}>
                    {selectedFlowType === "return" ? "Pickup and refund flow started." : "Refund flow started."}
                  </p>
                  <div style={{ color: "#253d4e", fontSize: 13, lineHeight: 1.7 }}>
                    <div><strong>Reason:</strong> {returnReason}</div>
                    <div><strong>Refund Method:</strong> {refundMethod}</div>
                    <div><strong>Estimated time:</strong> Processing...</div>
                  </div>
                  <div className="ret-progress">
                    {statusSteps(selectedFlowType).map((step, i) => (
                      <div key={step} className={`ret-progress-row ${i === 0 ? "active" : ""}`}>
                        <span className="ret-progress-dot">{i + 1}</span>
                        {statusLabel(selectedFlowType, step)}
                      </div>
                    ))}
                  </div>
                  <button style={{ width: '100%', padding: 14, borderRadius: 10, background: '#1d5ba0', color: 'white', border: 'none', fontWeight: 700 }} onClick={resetReturnModal}>
                    View in My Refunds
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      <ConfirmDialog
        open={Boolean(orderToDelete)}
        title="Remove order from history?"
        message="This hides the order from your account view and keeps your order list cleaner."
        confirmLabel="Remove Order"
        onClose={() => setOrderToDelete(null)}
        onConfirm={() => {
          onDeleteOrder && onDeleteOrder(orderToDelete);
          setOrderToDelete(null);
        }}
      />

      {allOrders.length === 0 ? (
        <EmptySectionState
          icon={orderFilter === "Delivered" ? "fa-box-open" : "fa-bag-shopping"}
          title={orderFilter === "Delivered" ? "No delivered orders yet" : "No orders yet"}
          description={
            orderFilter === "Delivered"
              ? "Delivered orders will appear here once your purchases are completed successfully."
              : "Your full order history will appear here after you place your first order."
          }
        />
      ) : (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {allOrders.map((order, i) => {
          const sc = statusConfig[order.status] || statusConfig.Processing;
          const itemsPreview = (order.items || []).slice(0, 4);
          const extraCount = (order.items || []).length - 4;
          const totalItems = (order.items || []).reduce((a, itm) => a + (itm.quantity || 1), 0);

          const orderReview = reviews.find(r => r.orderId === (order.orderId || order.id));
          return (
            <div key={order.orderId || i} className="ord-card">
              <div className="ord-header">
                <div className="ord-id-group">
                  <div className="ord-id">
                    <i className="fas fa-receipt" style={{ fontSize: 12, color: "#94a3b8" }}></i>
                    #{order.orderId}
                    {(order.marked || markedOrders.includes(order.orderId)) && (
                      <i className="fas fa-star" style={{ color: "#f59e0b", fontSize: "12px", marginLeft: "4px" }}></i>
                    )}
                  </div>
                  <span className="ord-date">
                    {order.date} · {methodLabel[order.method] || order.method}
                  </span>
                </div>
                <div className="ord-right">
                  <span className="ord-total">{currSym}{Number(order.total).toFixed(2)}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className="ord-status" style={{ background: sc.bg, color: sc.color }}>
                      <i className={`fas ${sc.icon}`} style={{ fontSize: 11 }}></i>
                      {sc.label || order.status}
                    </span>
                    {orderReview && (
                      <div style={{ display: "flex", gap: 2, color: "#f59e0b", fontSize: 12 }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s}>{s <= Math.round((orderReview.deliveryRating + orderReview.qualityRating) / 2) ? "★" : "☆"}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ord-menu-container">
                    <div className="ord-dots" onClick={() => setActiveMenuOrderId(activeMenuOrderId === order.orderId ? null : order.orderId)}>
                      <i className="fas fa-ellipsis-v"></i>
                    </div>
                    {activeMenuOrderId === order.orderId && (
                      <div className="ord-menu-dropdown">
                        <div className="ord-menu-item" onClick={() => { toggleMark(order.orderId); setActiveMenuOrderId(null); }}>
                          <i className={`${(order.marked || markedOrders.includes(order.orderId)) ? "fas fa-star" : "far fa-star"}`} style={{ color: (order.marked || markedOrders.includes(order.orderId)) ? "#f59e0b" : "inherit" }}></i>
                          {(order.marked || markedOrders.includes(order.orderId)) ? "Unmark" : "Mark as Important"}
                        </div>
                        <div className="ord-menu-item" style={{ color: "#ef4444" }} onClick={() => { 
                          deleteOrder(order.orderId);
                          setActiveMenuOrderId(null); 
                        }}>
                          <i className="fas fa-trash-alt"></i> Delete Order
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {itemsPreview.length > 0 && (
                <div className="ord-thumbs">
                  {itemsPreview.map((item, j) => (
                    <div key={item._uid || j} className="ord-thumb">
                      <img src={resolveProductImage(item)} alt={getTranslatedName(item.name)} loading="lazy" decoding="async" />
                    </div>
                  ))}
                  {extraCount > 0 && (
                    <div className="ord-thumb-more">+{extraCount}</div>
                  )}
                  <span className="ord-thumb-text">
                    {totalItems} item{totalItems !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {order.address && (
                <div className="ord-address">
                  <i className="fas fa-map-marker-alt"></i>
                  <span><strong>{order.address.type}:</strong> {order.address.text}</span>
                </div>
              )}

              {order.status === "Delivered" && (order.items || []).length > 0 && (
                <div className="ord-line-items">
                  {(order.items || []).map((item, itemIndex) => {
                    const request = getRequestForItem(order, item, itemIndex);
                    const amount = getItemAmount(item);
                    const itemName = getTranslatedName(item.name);
                    return (
                      <div key={makeOrderItemId(order, item, itemIndex)} className="ord-line-item">
                        <div className="ord-line-img">
                          {(item.image || item.imageUrl) ? <img src={resolveProductImage(item)} alt={itemName} loading="lazy" decoding="async" /> : <i className="fas fa-box" style={{ color: "#94a3b8" }}></i>}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="ord-line-name">{itemName}</div>
                          <div className="ord-line-meta">Qty: {item.quantity || 1} · {currSym}{amount.toFixed(2)}</div>
                          {request && (
                            <div style={{ marginTop: 8 }}>
                              <span className={`ord-refund-badge ${statusClass(request.status)}`}>
                                <i className={`fas ${request.status === "Completed" ? "fa-check-circle" : "fa-clock"}`}></i>
                                {statusLabel(request.type, request.status)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ord-item-actions">
                          <button
                            className="ord-item-btn return"
                            disabled={!!request}
                            onClick={() => startItemFlow(order, item, itemIndex, "return")}
                          >
                            <i className="fas fa-undo"></i> Return
                          </button>
                          <button
                            className="ord-item-btn refund"
                            disabled={!!request}
                            onClick={() => startItemFlow(order, item, itemIndex, "refund")}
                          >
                            <i className="fas fa-hand-holding-usd"></i> Refund
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="ord-actions">
                <button className="ord-btn ord-btn-summary" onClick={() => onOrderSummary && onOrderSummary(order)}>Order Summary</button>
                {order.status === "Delivered" && !orderReview && (
                  <button className="ord-btn ord-btn-rate" onClick={() => onRateOrder && onRateOrder(order)}>Rate Order</button>
                )}
                <button className="ord-btn ord-btn-again" onClick={() => onOrderAgain && onOrderAgain(order)}>Order Again</button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}


/* ─── Addresses Component ────────────────────────────────────────── */

// Load from localStorage
function loadAddresses() {
  try {
    const raw = localStorage.getItem(ADDRESSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAddresses(list) {
  localStorage.setItem(ADDRESSES_KEY, JSON.stringify(list));
}

export function AddressSection({ t, language = "en", region = "in" }) {
  const [addresses, setAddresses] = useState(loadAddresses);
  const [editIndex, setEditIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    saveAddresses(addresses);
    // Notify other windows/components
    window.dispatchEvent(new Event("storage"));
  }, [addresses]);

  const handleModalSave = (data) => {
    const fullText = `${data.house}, ${data.building ? data.building + ", " : ""}${data.area}${data.landmark ? " (Landmark: " + data.landmark + ")" : ""}${data.pincode ? " - " + data.pincode : ""}${data.state ? ", " + data.state : ""}${data.country ? ", " + data.country : ""}`;
    const newAddr = {
      type: data.type,
      text: fullText,
      details: data,
      isPrimary: addresses.length === 0
    };

    if (editIndex !== null) {
      const updated = [...addresses];
      updated[editIndex] = { ...updated[editIndex], ...newAddr };
      setAddresses(updated);
      setEditIndex(null);
      setNotice({ type: "success", text: "Address updated successfully." });
    } else {
      if (addresses.length >= 5) {
        setNotice({ type: "error", text: "Maximum 5 addresses allowed." });
        return;
      }
      // If this is the first address, it should be primary
      if (addresses.length === 0) newAddr.isPrimary = true;
      setAddresses([...addresses, newAddr]);
      setNotice({ type: "success", text: "Address added successfully." });
    }
    setIsModalOpen(false);
  };

  const deleteAddress = (i) => {
    setAddresses(addresses.filter((_, idx) => idx !== i));
    setNotice({ type: "success", text: "Address removed from your account." });
  };

  const editAddress = (i) => {
    setEditIndex(i);
    setIsModalOpen(true);
  };

  const makePrimary = (i) => {
    const updated = addresses.map((addr, idx) => ({ ...addr, isPrimary: idx === i }));
    setAddresses(updated);
    setNotice({ type: "success", text: "Primary address updated." });
  };

  return (
    <div className="address-card">
      <InlineNotice notice={notice} onClose={() => setNotice(null)} />

      <div className="add-address-bar" onClick={() => { setIsModalOpen(true); setEditIndex(null); }}>
        <span className="plus" style={{ color: "#1d5ba0", fontSize: "1.2rem", fontWeight: 700, marginRight: "8px" }}>+</span>
        <span style={{ color: "#1d5ba0", fontWeight: 700 }}>{t.cart.addNewAddress}</span>
      </div>

      <h3 style={{ fontSize: "1.2rem", color: "#253d4e", marginTop: "20px", marginBottom: "15px" }}>{t.account.addresses}</h3>

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        initialData={editIndex !== null ? addresses[editIndex].details : null}
        t={t}
        language={language}
        region={region}
      />

      {addresses.length === 0 && (
        <EmptySectionState
          icon="fa-location-dot"
          title="No saved addresses yet"
          description="Your delivery addresses will appear here so you can choose them faster during checkout."
        />
      )}

      {addresses.map((addr, i) => {
        const isPrimary = addr.isPrimary || (!addresses.some(a => a.isPrimary) && i === 0);
        return (
        <div key={i} className="address-item-card" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "24px",
          border: "1px solid #ececec",
          borderRadius: "12px",
          marginBottom: "16px",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(29, 91, 160, 0.12)"; e.currentTarget.style.borderColor = "#1d5ba0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; e.currentTarget.style.borderColor = "#ececec"; }}
        >
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              background: "#f0f5ff",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1d5ba0",
              fontSize: "1.2rem"
            }}>
              <i className={addr.type === "Home" ? "fas fa-home" : addr.type === "Work" ? "fas fa-briefcase" : "fas fa-map-marker-alt"}></i>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <strong style={{ fontSize: "1.1rem", color: "#253d4e" }}>{addr.type}</strong>
                {isPrimary && <span style={{ fontSize: "0.7rem", padding: "2px 8px", background: "#f0f5ff", color: "#1d5ba0", borderRadius: "4px", fontWeight: 800 }}>PRIMARY</span>}
              </div>
              <p style={{ fontSize: "0.9rem", color: "#7e7e7e", lineHeight: 1.5, margin: 0, maxWidth: "400px" }}>{addr.text}</p>

              {addr.details?.receiverName && (
                <div style={{ marginTop: "10px", fontSize: "0.85rem", color: "#253d4e", display: "flex", gap: "10px" }}>
                  <span><i className="fas fa-user" style={{ fontSize: "0.75rem", color: "#94a3b8" }}></i> {addr.details.receiverName}</span>
                  <span><i className="fas fa-phone" style={{ fontSize: "0.75rem", color: "#94a3b8" }}></i> {formatPhoneForDisplay(region, addr.details.receiverPhone)}</span>
                </div>
              )}

              <div style={{ marginTop: "16px", display: "flex", gap: "20px" }}>
                <button onClick={() => editAddress(i)} style={{ background: "transparent", border: "none", color: "#1d5ba0", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", padding: 0 }}>EDIT</button>
                <button onClick={() => deleteAddress(i)} style={{ background: "transparent", border: "none", color: "#ef4444", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", padding: 0 }}>DELETE</button>
                {!isPrimary && (
                  <button onClick={() => makePrimary(i)} style={{ background: "transparent", border: "none", color: "#10b981", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", padding: 0 }}>MAKE PRIMARY</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )})}

    </div>
  );
}


/* ─── Add Balance Modal Component ────────────────────────────────── */

function AddBalanceModal({ isOpen, onClose, currSym, region, t, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const predefinedAmounts = [100, 200, 1000];
  const numericAmount = Number.parseFloat(amount);
  const hasValidAmount = Number.isFinite(numericAmount) && numericAmount > 0 && numericAmount <= 100000;

  const handleTopUp = () => {
    const numAmount = Number.parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (numAmount > 100000) {
      setError("Amount cannot exceed 100000 in a single top-up.");
      return;
    }

    setError("");
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      onSuccess(numAmount, paymentMethod);
      setIsProcessing(false);
      setAmount("");
    }, 2000);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start",
      justifyContent: "center", zIndex: 3000, padding: "40px 20px",
      overflowY: "auto", backdropFilter: "blur(4px)"
    }} onClick={onClose}>
      <div className="modal-content" style={{
        background: "white", width: "100%", maxWidth: "450px",
        borderRadius: "20px", padding: "30px", position: "relative",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        animation: "modalAppear 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
      }} onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} style={{
          position: "absolute", top: "20px", right: "20px",
          background: "#f1f5f9", border: "none", width: "32px", height: "32px",
          borderRadius: "50%", cursor: "pointer", color: "#64748b"
        }}><i className="fas fa-times"></i></button>

        <h3 style={{ fontSize: "1.4rem", color: "#253d4e", marginBottom: "8px", fontWeight: 800 }}>Add Balance</h3>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "24px" }}>Top up your Prime-Basket wallet to enjoy faster checkouts.</p>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "10px" }}>Enter Amount</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "#253d4e" }}>{currSym}</span>
            <input 
              type="number" 
              inputMode="decimal"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => {
                const sanitized = e.target.value
                  .replace(/[^\d.]/g, "")
                  .replace(/^(\d*\.?\d{0,2}).*$/, "$1");
                setAmount(sanitized);
                if (error) setError("");
              }}
              placeholder="0.00"
              style={{
                width: "100%", padding: "16px 16px 16px 45px", borderRadius: "12px",
                border: "2px solid #e2e8f0", fontSize: "1.2rem", fontWeight: 800,
                outline: "none", transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#1d5ba0"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
          {error && (
            <div style={{ marginTop: "10px", color: "#dc2626", fontSize: "0.82rem", fontWeight: 700 }}>
              {error}
            </div>
          )}
          
          <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
            {predefinedAmounts.map(val => (
              <button 
                key={val}
                onClick={() => setAmount(val.toString())}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px",
                  border: "1px solid #e2e8f0", background: amount === val.toString() ? "#f0f5ff" : "white",
                  color: amount === val.toString() ? "#1d5ba0" : "#475569",
                  fontWeight: 700, cursor: "pointer", fontSize: "0.85rem",
                  borderColor: amount === val.toString() ? "#1d5ba0" : "#e2e8f0"
                }}
              >
                +{currSym}{val}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "12px" }}>Select Payment Method</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              { id: "upi", label: "UPI", icon: "fa-mobile-alt" },
              { id: "card", label: "Card", icon: "fa-credit-card" },
              { id: "netbanking", label: "Net Banking", icon: "fa-university" },
              { id: "wallet", label: "Other Wallet", icon: "fa-wallet" }
            ].map(m => (
              <div 
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                style={{
                  padding: "14px", borderRadius: "12px", border: "2px solid",
                  borderColor: paymentMethod === m.id ? "#1d5ba0" : "#f1f5f9",
                  background: paymentMethod === m.id ? "#f0f7ff" : "#f8fafc",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "10px",
                  transition: "all 0.2s"
                }}
              >
                <i className={`fas ${m.icon}`} style={{ color: paymentMethod === m.id ? "#1d5ba0" : "#94a3b8" }}></i>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: paymentMethod === m.id ? "#1d5ba0" : "#475569" }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handleTopUp}
          disabled={isProcessing || !hasValidAmount}
          style={{
            width: "100%", padding: "16px", background: "#1d5ba0", color: "white",
            border: "none", borderRadius: "12px", fontSize: "1rem", fontWeight: 800,
            cursor: isProcessing ? "not-allowed" : "pointer",
            opacity: isProcessing || !hasValidAmount ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"
          }}
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Processing...
            </>
          ) : (
            `Add ${currSym}${hasValidAmount ? numericAmount.toFixed(2) : "0.00"}`
          )}
        </button>

      </div>
      <style>{`
        @keyframes modalAppear {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}


/* ─── Refunds & Wallet Component ─────────────────────────────────── */

function WalletSection({ t, currSym, region, language = "en" }) {
  const [wallet, setWallet] = useState(loadWallet);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const syncWallet = () => setWallet(loadWallet());
    window.addEventListener("wallet-updated", syncWallet);
    window.addEventListener("storage", syncWallet);
    return () => {
      window.removeEventListener("wallet-updated", syncWallet);
      window.removeEventListener("storage", syncWallet);
    };
  }, []);

  const topWalletTransactions = (wallet.transactions || []).slice(0, 6);

  return (
    <div className="refunds-card">
      <style>{`
        @keyframes walletPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.015)} }
        .wallet-card { background:linear-gradient(135deg,#1d5ba0,#3b82f6); color:white; border-radius:16px; padding:22px; margin:20px 0; display:flex; justify-content:space-between; gap:20px; align-items:center; box-shadow:0 12px 30px rgba(29,91,160,.18); animation:walletPulse 1.8s ease-in-out; position:relative; overflow:hidden; }
        .wallet-add-btn { background: rgba(255,255,255,0.2); border: 1.5px solid rgba(255,255,255,0.4); color: white; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 13px; margin-top: 10px; display: inline-flex; align-items: center; gap: 6px; }
        .wallet-add-btn:hover { background: white; color: #1d5ba0; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .wallet-balance { font-size:30px; font-weight:900; font-family:'Quicksand',sans-serif; margin-top:4px; }
        .wallet-tx { background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.22); border-radius:12px; padding:10px 12px; min-width:220px; }
        .wallet-tx-row { display:flex; justify-content:space-between; gap:14px; font-size:12px; padding:4px 0; }
        .wallet-history { margin-top: 18px; display: grid; gap: 12px; }
        .wallet-history-row { display:flex; justify-content:space-between; gap:16px; align-items:center; padding:14px 16px; border:1px solid #ececec; border-radius:14px; background:linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.98)); }
        .wallet-history-copy { min-width:0; display:grid; gap:4px; }
        .wallet-history-copy strong { color:#253d4e; }
        .wallet-history-copy span { color:#64748b; font-size:12px; }
        .wallet-history-amount { color:#1d5ba0; font-weight:900; font-size:15px; white-space:nowrap; }
        @media(max-width:700px){ .wallet-card{ flex-direction:column; align-items:flex-start; } .wallet-tx{ width:100%; } .wallet-history-row{ flex-direction:column; align-items:flex-start; } }
      `}</style>
      <h2 style={{ display: "flex", alignItems: "center", gap: "10px", color: "#17324d" }}>
        <i className="fas fa-wallet" style={{ color: "#1d5ba0" }}></i> {language === "ke" ? "Pochi yangu" : "My Wallet"}
      </h2>
      <div className="wallet-card">
        <div>
          <div style={{ opacity: .85, fontWeight: 800, fontSize: 13 }}>{language === "ke" ? "Salio la Prime-Basket" : "Prime-Basket Wallet"}</div>
          <div className="wallet-balance">{currSym}{Number(wallet.balance || 0).toFixed(2)}</div>
          <div style={{ opacity: .86, fontSize: 12, marginTop: 4, color: "rgba(255,255,255,0.96)" }}>
            {language === "ke" ? "Ongeza pesa kwa pochi yako kwa malipo ya haraka na uhifadhi salio lako hapa." : "Add money to your wallet for faster checkout and keep your balance ready here."}
          </div>
          <button className="wallet-add-btn" onClick={() => setIsAddModalOpen(true)}>
            <i className="fas fa-plus-circle"></i> {language === "ke" ? "Ongeza pesa" : "Add Money"}
          </button>
        </div>
        <div className="wallet-tx">
          <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 4, color: "rgba(255,255,255,0.98)" }}>{language === "ke" ? "Muhtasari wa hivi karibuni" : "Recent wallet activity"}</div>
          {topWalletTransactions.length === 0 ? (
            <div style={{ fontSize: 12, opacity: .75 }}>{language === "ke" ? "Hakuna miamala ya pochi bado." : "No wallet transactions yet."}</div>
          ) : (
            topWalletTransactions.slice(0, 3).map((tx) => (
              <div key={tx.requestId} className="wallet-tx-row">
                <span>{tx.orderId || "Wallet Top-up"}</span>
                <strong>+{currSym}{Number(tx.amount || 0).toFixed(2)}</strong>
              </div>
            ))
          )}
        </div>
      </div>

      <AddBalanceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        currSym={currSym}
        region={region}
        t={t}
        onSuccess={(amount, method) => {
          const updatedWallet = {
            balance: Number(wallet.balance || 0) + amount,
            transactions: [
              {
                requestId: "TOPUP" + Date.now().toString().slice(-4),
                orderId: language === "ke" ? "Ongezeko la pochi" : "Wallet Top-up",
                amount,
                date: new Date().toLocaleDateString(),
                status: "Completed",
                method,
              },
              ...(wallet.transactions || []),
            ],
          };
          saveWallet(updatedWallet);
          setWallet(updatedWallet);
          window.dispatchEvent(new Event("wallet-updated"));
          setIsAddModalOpen(false);
        }}
      />

      <div className="wallet-history">
        {topWalletTransactions.length === 0 ? (
          <EmptySectionState
            icon="fa-wallet"
            title={language === "ke" ? "Hakuna shughuli za pochi bado" : "No wallet activity yet"}
            description={language === "ke" ? "Ongeza pesa au subiri marejesho ya wallet yaonekane hapa." : "Add money or wait for wallet refunds to show up here."}
          />
        ) : (
          topWalletTransactions.map((tx) => (
            <div key={tx.requestId} className="wallet-history-row">
              <div className="wallet-history-copy">
                <strong>{tx.orderId || (language === "ke" ? "Ongezeko la pochi" : "Wallet Top-up")}</strong>
                <span>{tx.date} · {tx.method || (language === "ke" ? "Mkopo" : "Credit")}</span>
              </div>
              <div className="wallet-history-amount">+{currSym}{Number(tx.amount || 0).toFixed(2)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RefundsDemoSection({ t, currSym, region }) {
  const [refunds, setRefunds] = useState(loadRefundRequests);

  useEffect(() => {
    const syncRefunds = () => setRefunds(loadRefundRequests());
    window.addEventListener("refund-requests-updated", syncRefunds);
    window.addEventListener("storage", syncRefunds);
    return () => {
      window.removeEventListener("refund-requests-updated", syncRefunds);
      window.removeEventListener("storage", syncRefunds);
    };
  }, []);

  return (
    <div className="refunds-card">
      <style>{`
        .rfd-demo-item { border:1px solid #ececec; border-radius:12px; padding:16px; margin-bottom:12px; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:16px; align-items:start; }
        .rfd-demo-product { display:flex; gap:12px; min-width:0; }
        .rfd-demo-img { width:52px; height:52px; border-radius:10px; border:1px solid #edf2f7; background:#fafafa; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; }
        .rfd-demo-img img { max-width:100%; max-height:100%; object-fit:contain; }
        .rfd-status { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; }
        .rfd-completed { background:#dcfce7; color:#16a34a; }
        .rfd-processing { background:#fef9c3; color:#ca8a04; }
        .rfd-pending { background:#e8f0fb; color:#1d5ba0; }
        .rfd-timeline { grid-column:1 / -1; display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:8px; margin-top:4px; }
        .rfd-step { display:flex; align-items:center; gap:6px; color:#94a3b8; font-size:11px; font-weight:800; }
        .rfd-step-dot { width:18px; height:18px; border-radius:50%; background:#e2e8f0; color:white; display:flex; align-items:center; justify-content:center; font-size:9px; flex-shrink:0; }
        .rfd-step.done,.rfd-step.active { color:#1d5ba0; }
        .rfd-step.done .rfd-step-dot { background:#16a34a; }
        .rfd-step.active .rfd-step-dot { background:#1d5ba0; animation:pulse 1.2s infinite; }
        @media(max-width:700px){ .rfd-demo-item{ grid-template-columns:1fr; } }
      `}</style>
      <h2 style={{ display: "flex", alignItems: "center", gap: "10px", color: "#17324d" }}>
        <i className="fas fa-undo" style={{ color: "#1d5ba0" }}></i> {t.account.myRefunds}
      </h2>

      <div className="refunds-list" style={{ marginTop: "20px" }}>
        {refunds.length === 0 ? (
          <EmptySectionState
            icon="fa-rotate-left"
            title="No refund requests yet"
            description="Any refund or return request you raise for your orders will be tracked here with status updates."
          />
        ) : (
          refunds.map((rfd) => {
            const steps = statusSteps(rfd.type);
            const activeIndex = rfd.status === "Completed" ? steps.length : steps.indexOf(rfd.status);
            return (
              <div key={rfd.id} className="rfd-demo-item">
                <div className="rfd-demo-product">
                  <div className="rfd-demo-img">
                    {(rfd.image || rfd.productImage) ? <img src={rfd.image || rfd.productImage} alt={rfd.productName} loading="lazy" decoding="async" /> : <i className="fas fa-box" style={{ color: "#94a3b8" }}></i>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ color: "#253d4e" }}>{rfd.productName || "Order item"}</strong>
                    <p style={{ fontSize: "13px", color: "#7e7e7e", margin: "4px 0" }}>#{rfd.id} - Order #{rfd.orderId}</p>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>{rfd.type === "return" ? "Return + Refund" : "Refund Only"} - {rfd.refundMethod} - {rfd.reason}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#1d5ba0", marginBottom: "4px" }}>{currSym}{Number(rfd.amount || 0).toFixed(2)}</div>
                  <span className={`rfd-status ${rfd.status === "Completed" ? "rfd-completed" : rfd.status === "Requested" ? "rfd-pending" : "rfd-processing"}`}>{statusLabel(rfd.type, rfd.status)}</span>
                </div>
                <div className="rfd-timeline">
                  {steps.map((step, index) => (
                    <div key={step} className={`rfd-step ${index < activeIndex ? "done" : index === activeIndex ? "active" : ""}`}>
                      <span className="rfd-step-dot">{index < activeIndex ? <i className="fas fa-check"></i> : index + 1}</span>
                      {statusLabel(rfd.type, step)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


/* ─── E-Gift Cards & Rewards Component ───────────────────────────── */

function GiftCardsSection({ t, currSym }) {
  const [showForm, setShowForm] = useState(false);
  const [gcNumber, setGcNumber] = useState("");
  const [gcPin, setGcPin] = useState("");
  const [message, setMessage] = useState(null);

  const [giftCards, setGiftCards] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pb_gift_cards") || "[]");
    } catch {
      return [];
    }
  });

  const rewards = [
    { title: "Welcome Reward", code: "WELCOME50", value: "50.00", exp: "31 Dec 2026", status: "Active" },
    { title: "Loyalty Bonus", code: "ROYAL100", value: "100.00", exp: "15 Jun 2026", status: "Active" },
  ];

  const handleAddGiftCard = (e) => {
    e.preventDefault();
    
    if (!/^\d{16}$/.test(gcNumber)) {
      setMessage({ type: "error", text: "Invalid Card Number: Must be exactly 16 digits" });
      return;
    }
    if (!/^\d{4}$/.test(gcPin)) {
      setMessage({ type: "error", text: "Invalid PIN: Must be exactly 4 digits" });
      return;
    }
    
    // Instead of adding to wallet, we generate a promo code
    const amount = currSym === "KES " ? 100 : 100; // 100 KES or 100 RS
    const newCode = "GC" + Math.random().toString(36).substring(2, 6).toUpperCase() + Date.now().toString().slice(-2);
    
    const newCard = {
      title: "Gift Card",
      code: newCode,
      value: amount.toFixed(2),
      exp: "No Expiry",
      status: "Active"
    };

    const updatedCards = [newCard, ...giftCards];
    setGiftCards(updatedCards);
    localStorage.setItem("pb_gift_cards", JSON.stringify(updatedCards));
    
    setMessage({ type: "success", text: `Gift Card valid! Promo code ${newCode} generated.` });
    setGcNumber("");
    setGcPin("");
    setTimeout(() => {
      setShowForm(false);
      setMessage(null);
    }, 3000);
  };

  const allRewards = [...giftCards, ...rewards];

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setMessage({ type: "success", text: t.accountExtras.copied });
    } catch {
      setMessage({ type: "error", text: "Unable to copy the code right now." });
    }
  };

  return (
    <div className="giftcards-card">
      {!showForm && <InlineNotice notice={message} onClose={() => setMessage(null)} />}
      <div className="giftcards-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <h2 style={{ margin: 0 }}>{t.account.giftCards}</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="giftcards-toggle"
          style={{ background: "#1d5ba0", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
        >
          {showForm ? t.account.cancel : `+ ${t.accountExtras.giftCard}`}
        </button>
      </div>

      {showForm && (
        <form className="giftcard-form" onSubmit={handleAddGiftCard} style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "25px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "15px", fontSize: "16px", color: "#253d4e" }}>{t.accountExtras.redeemGiftCard}</h3>
          {message && (
            <div style={{ padding: "10px", borderRadius: "8px", marginBottom: "15px", background: message.type === "success" ? "#dcfce7" : "#fee2e2", color: message.type === "success" ? "#16a34a" : "#dc2626", fontSize: "14px", fontWeight: 600 }}>
              {message.text}
            </div>
          )}
          <div className="giftcard-form-row" style={{ display: "flex", gap: "15px", marginBottom: "15px", flexWrap: "wrap" }}>
            <div className="giftcard-form-field giftcard-form-field-number" style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "5px" }}>{t.accountExtras.cardNumber}</label>
              <input 
                type="text" 
                value={gcNumber} 
                onChange={(e) => setGcNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} 
                placeholder={t.accountExtras.cardPlaceholder}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" }}
              />
            </div>
            <div className="giftcard-form-field giftcard-form-field-pin" style={{ flex: 1, minWidth: "120px", maxWidth: "200px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "5px" }}>{t.accountExtras.pinNumber}</label>
              <input 
                type="text" 
                value={gcPin} 
                onChange={(e) => setGcPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                placeholder={t.accountExtras.pinPlaceholder}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" }}
              />
            </div>
          </div>
          <button type="submit" className="giftcard-apply-btn" style={{ background: "#16a34a", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
            {t.accountExtras.applyCard}
          </button>
        </form>
      )}

      <div className="giftcards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {allRewards.map((rw, i) => (
          <div key={i} className="giftcard-reward-card" style={{
            background: "linear-gradient(135deg, #f0f5ff 0%, #e0eaff 100%)",
            border: "2px dashed #1d5ba0", borderRadius: "16px", padding: "20px",
            position: "relative", overflow: "hidden"
          }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#1d5ba0", marginBottom: "8px", textTransform: "uppercase" }}>{rw.title === "Welcome Reward" ? t.accountExtras.welcomeReward : rw.title === "Loyalty Bonus" ? t.accountExtras.loyaltyBonus : rw.title === "Gift Card" ? t.accountExtras.giftCard : rw.title}</div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#253d4e", marginBottom: "12px" }}>{currSym}{rw.value}</div>
            <div className="giftcard-code-row" style={{ background: "white", padding: "8px 12px", borderRadius: "8px", border: "1px solid #1d5ba0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <code className="giftcard-code-text" style={{ fontSize: "14px", fontWeight: 800, color: "#1d5ba0" }}>{rw.code}</code>
              <button className="giftcard-copy-btn" type="button" style={{ background: "transparent", border: "none", color: "#1d5ba0", fontWeight: 700, fontSize: "11px", cursor: "pointer" }} onClick={() => handleCopyCode(rw.code)}>{t.accountExtras.copy}</button>
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "12px" }}>{t.accountExtras.expires} {rw.exp === "No Expiry" ? t.accountExtras.noExpiry : rw.exp}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ─── Notifications Component ────────────────────────────────────── */

function NotificationsSection({ t, notifications = [], onClearNotifications }) {
  const accountNotifications = notifications.length > 0
    ? notifications.map((note) => {
        const typeConfig = {
          success: { icon: "fa-check-circle", color: "#16a34a" },
          warning: { icon: "fa-triangle-exclamation", color: "#f59e0b" },
          error: { icon: "fa-circle-exclamation", color: "#ef4444" },
          info: { icon: "fa-bell", color: "#1d5ba0" },
        };
        const config = typeConfig[note.type] || typeConfig.info;
        return {
          title: note.title,
          desc: note.message,
          time: note.time,
          icon: config.icon,
          color: config.color,
        };
      })
    : [];

  return (
    <div className="notifications-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "25px", flexWrap: "wrap" }}>
        <h2 style={{ marginBottom: 0 }}>{t.header.notifications}</h2>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={onClearNotifications}
            style={{
              border: "1px solid rgba(239,68,68,0.18)",
              background: "#fff5f5",
              color: "#dc2626",
              borderRadius: "999px",
              padding: "10px 14px",
              fontSize: "12px",
              fontWeight: 800,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <i className="fas fa-trash-can" style={{ marginRight: 8 }}></i>
            Clear Notifications
          </button>
        )}
      </div>
      <div className="notifications-list">
        {accountNotifications.length === 0 ? (
          <EmptySectionState
            icon="fa-bell-slash"
            title="No notifications yet"
            description="Order updates, offers, and account alerts will show up here once you receive them."
          />
        ) : (
          accountNotifications.map((note, i) => (
            <div key={i} className="notification-item" style={{
              display: "flex", gap: "16px", padding: "16px", border: "1px solid #ececec",
              borderRadius: "12px", marginBottom: "12px", background: "#fff",
              transition: "0.2s"
            }} onMouseEnter={e => e.currentTarget.style.borderColor = "#1d5ba0"} onMouseLeave={e => e.currentTarget.style.borderColor = "#ececec"}>
              <div style={{
                width: "42px", height: "42px", borderRadius: "50%", background: note.color + "15",
                color: note.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <i className={`fas ${note.icon}`}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <strong style={{ color: "#253d4e", fontSize: "14px" }}>{note.title}</strong>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>{note.time}</span>
                </div>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>{note.desc}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


/* ─── Payments Component ─────────────────────────────────────────── */

function PaymentsSection({ t, region }) {
  const [cards, setCards] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pb_saved_cards") || "[]"); }
    catch { return []; }
  });
  const [cardToDelete, setCardToDelete] = useState(null);
  const [notice, setNotice] = useState(null);

  const deleteCard = (index) => {
    const updated = cards.filter((_, i) => i !== index);
    setCards(updated);
    localStorage.setItem("pb_saved_cards", JSON.stringify(updated));
    setCardToDelete(null);
    setNotice({ type: "success", text: "Saved card removed." });
  };

  const getCardIcon = (num) => {
    if (String(num).startsWith("4")) return "fab fa-cc-visa";
    if (String(num).startsWith("5")) return "fab fa-cc-mastercard";
    return "fas fa-credit-card";
  };

  return (
    <div className="payments-card">
      <InlineNotice notice={notice} onClose={() => setNotice(null)} />
      <ConfirmDialog
        open={cardToDelete !== null}
        title="Remove saved card?"
        message="This payment method will be removed from your saved list. You can add it again later during checkout."
        confirmLabel="Remove Card"
        onClose={() => setCardToDelete(null)}
        onConfirm={() => deleteCard(cardToDelete)}
      />
      <style>{`
        .premium-card {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-radius: 16px; padding: 24px; color: white;
          position: relative; overflow: hidden; margin-bottom: 20px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          transition: transform 0.3s; cursor: default;
        }
        .premium-card:hover { transform: translateY(-5px); }
        .premium-card .card-chip { width: 45px; height: 35px; background: #e2e8f0; border-radius: 6px; margin-bottom: 20px; opacity: 0.8; }
        .premium-card .card-number { font-size: 20px; letter-spacing: 3px; font-weight: 700; margin-bottom: 20px; }
        .premium-card .card-footer { display: flex; justify-content: space-between; align-items: flex-end; }
        .premium-card .card-label { font-size: 10px; text-transform: uppercase; opacity: 0.7; margin-bottom: 4px; }
        .premium-card .card-value { font-size: 14px; font-weight: 600; }
        .premium-card .card-type { font-size: 28px; opacity: 0.9; }
        .card-delete-btn {
          position: absolute; top: 15px; right: 15px;
          background: rgba(255,255,255,0.1); border: none; color: white;
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.2s;
        }
        .card-delete-btn:hover { background: #ef4444; }
      `}</style>
      <h2 style={{ marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
        <i className="fas fa-credit-card" style={{ color: "#1d5ba0" }}></i> {t.footer.paymentMethods}
      </h2>

      {cards.length === 0 ? (
        <EmptySectionState
          icon="fa-credit-card"
          title="No saved payment methods yet"
          description="Cards and saved payment methods will appear here after you use them during checkout."
        />
      ) : (
        <div className="payments-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {cards.map((card, i) => (
            <div key={i} className="premium-card">
              <button className="card-delete-btn" onClick={() => setCardToDelete(i)} title="Remove Card">
                <i className="fas fa-trash-alt" style={{ fontSize: "14px" }}></i>
              </button>
              <div className="card-chip"></div>
              <div className="card-number">•••• •••• •••• {card.num}</div>
              <div className="card-footer">
                <div>
                  <div className="card-label">Card Holder</div>
                  <div className="card-value">{card.name}</div>
                </div>
                <div>
                  <div className="card-label">Expires</div>
                  <div className="card-value">{card.exp}</div>
                </div>
                <div className="card-type">
                  <i className={getCardIcon(card.num)}></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {region === "ke" && (
        <div className="payments-wallets" style={{ marginTop: "40px" }}>
          <h3 className="payments-wallets-title">Mobile Wallets</h3>
          <div className="payments-wallet-grid" style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            <div className="payments-wallet-card payments-wallet-card-primary" style={{ padding: "15px 25px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="payments-wallet-icon success"><i className="fas fa-check"></i></div>
              <div>
                <strong className="payments-wallet-name">{t.accountExtras.mpesaConnected}</strong>
                <span className="payments-wallet-meta">{t.accountExtras.primaryWallet}</span>
              </div>
            </div>
            <div className="payments-wallet-card" style={{ padding: "15px 25px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="payments-wallet-icon add"><i className="fas fa-plus"></i></div>
              <div>
                <strong className="payments-wallet-name">Airtel Money</strong>
                <span className="payments-wallet-meta">{t.accountExtras.notLinked}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ─── Help Component ─────────────────────────────────────────────── */

function HelpSection({ t, language }) {
  const [openCategory, setOpenCategory] = useState(null);
  const [openFaq, setOpenFaq] = useState(null); // "catIndex_qIndex" key for individual FAQ accordion
  const [showSupport, setShowSupport] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [notice, setNotice] = useState(null);

  const toggleCategory = (cat) => setOpenCategory(openCategory === cat ? null : cat);
  const toggleFaq = (key) => setOpenFaq(openFaq === key ? null : key);

  const faqData = {
    [t.accountExtras.faqCategories.coupons]: [
      { q: language === "ke" ? "Kuponi haifanyi kazi / kuponi imeisha muda wake" : "Coupon not working / expired coupon", a: language === "ke" ? "Kila kuponi inakuja na muda wa uhalali. Ikiwa muda wa uhalali umeisha huwezi kutumia kuponi hiyo. Angalia sehemu ya 'Angalia kuponi na ofa' kwa ofa mpya." : "Every coupon comes with a validity period. If the validity is over you cannot use the coupon. Check the 'View coupons & offers' section for new offers." },
      { q: language === "ke" ? "Nilisahau kutumia nambari yangu ya kuponi. Nifanye nini sasa?" : "I forgot to apply my coupon code. What do I do now?", a: language === "ke" ? "Agizo likishafanywa haliwezi kuhaririwa. Unaweza kutumia kuponi hiyo kwa agizo lako lijalo." : "An order once placed cannot be edited. You can use the coupon for your next order." },
    ],
    [t.accountExtras.faqCategories.general]: [
      { q: language === "ke" ? "Ninafutaje akaunti yangu?" : "How do I delete my account?", a: language === "ke" ? "Unaweza kuwasiliana na msaada wetu kwa wateja kupitia 'Chat Nasi' au barua pepe ili kufuta akaunti yako." : "You can contact our customer support through 'Chat With Us' or email to delete your account." },
      { q: language === "ke" ? "Je, mnakata kodi yoyote juu ya bei ya bidhaa?" : "Do you charge any taxes over product price?", a: language === "ke" ? "Bei zote za bidhaa zinajumuisha kodi. Ada ya uwasilishaji au ada ndogo ya kikapu inaweza kutumika kulingana na agizo." : "All product prices are inclusive of taxes. A delivery fee or small-cart fee may apply depending on the order." },
      { q: language === "ke" ? "Muda wenu wa kazi ni upi?" : "What are your timings?", a: language === "ke" ? "Timu yetu ya msaada inapatikana kuanzia saa 12 asubuhi hadi saa 9 usiku." : "Our support team is available from 6am to 3am." },
    ],
    [t.accountExtras.faqCategories.payment]: [
      { q: language === "ke" ? "Ni njia zipi za malipo zinazopatikana?" : "What are the modes of payment?", a: language === "ke" ? "COD, kadi za mkopo/deni (Visa, Mastercard, Rupay), pochi, Pay Later, na malipo ya mtandaoni yanasaidiwa." : "COD, credit/debit cards (Visa, Mastercard, Rupay), wallets, Pay Later, and online payments are supported." },
      { q: language === "ke" ? "Ninabadilishaje njia ya malipo?" : "How do I change the payment mode?", a: language === "ke" ? "Agizo likishakuwa njiani kuletwa, njia ya malipo haiwezi kubadilishwa." : "Once an order is out for delivery, the payment method cannot be changed." },
      { q: language === "ke" ? "Je, ni salama kutumia kadi yangu?" : "Is it safe to use my card?", a: language === "ke" ? "Ndiyo. Shughuli zote zinashughulikiwa kupitia lango za malipo salama zinazotii PCI DSS." : "Yes. All transactions are processed via secure PCI DSS compliant payment gateways." },
      { q: language === "ke" ? "Kwa nini COD yangu imezuiwa?" : "Why is my COD blocked?", a: language === "ke" ? "Ikiwa maagizo yanafutwa mara kwa mara baada ya kufungwa au uwasilishaji, COD inaweza kuzuiwa kwa muda." : "If orders are frequently cancelled after packing or delivery, COD may be temporarily disabled." },
      { q: language === "ke" ? "Je, mnatoza gharama kwa mfuko?" : "Do you charge for the bag?", a: language === "ke" ? "Prime-Basket haitozi gharama kwa mifuko. Hata hivyo, ada ya ufungaji inaweza kutumika." : "Prime-Basket does not charge for bags. However, a packaging fee may apply." },
    ],
    [t.accountExtras.faqCategories.orders]: [
      { q: language === "ke" ? "Naweza kubadilisha anwani ya uwasilishaji?" : "Can I change the delivery address?", a: language === "ke" ? "Agizo likishafanywa, anwani ya uwasilishaji haiwezi kubadilishwa." : "Once an order is placed, the delivery address cannot be changed." },
      { q: language === "ke" ? "Je, kuna thamani ya chini ya agizo?" : "Is there a minimum order value?", a: language === "ke" ? "Hakuna thamani ya chini au ya juu ya agizo." : "There is no minimum or maximum order value." },
    ],
    [t.accountExtras.faqCategories.wallet]: [
      { q: language === "ke" ? "Siwezi kuongeza pesa kwenye pochi yangu" : "I am not able to add money to my wallet", a: language === "ke" ? "Tafadhali sasisha programu iwe toleo la hivi karibuni na ujaribu tena." : "Please update the app to the latest version and try again." },
      { q: language === "ke" ? "Pesa iliyoongezwa kwenye pochi haionekani" : "Money added to wallet is not visible", a: language === "ke" ? "Sasisha programu iwe toleo la hivi karibuni na uangalie tena." : "Update the app to the latest version and check again." },
    ],
  };

  const categoryIcons = {
    [t.accountExtras.faqCategories.coupons]: "fa-tags",
    [t.accountExtras.faqCategories.general]: "fa-info-circle",
    [t.accountExtras.faqCategories.payment]: "fa-credit-card",
    [t.accountExtras.faqCategories.orders]: "fa-box",
    [t.accountExtras.faqCategories.wallet]: "fa-wallet",
  };

  return (
    <div className="help-card">
      <InlineNotice notice={notice} onClose={() => setNotice(null)} />
      <style>{`
        .faq-accordion-category {
          margin-bottom: 12px;
          border: 1px solid #e8ecf2;
          border-radius: 12px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .faq-accordion-category:hover {
          box-shadow: 0 4px 16px rgba(29, 91, 160, 0.08);
        }
        .faq-cat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #f8fafc;
          cursor: pointer;
          transition: background 0.2s;
          user-select: none;
        }
        .faq-cat-header:hover {
          background: #f0f5ff;
        }
        .faq-cat-header.active {
          background: #1d5ba0;
          color: #fff;
        }
        .faq-cat-header .faq-cat-left {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          font-size: 14px;
        }
        .faq-cat-header .faq-cat-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #e8f0fb;
          color: #1d5ba0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          transition: 0.2s;
        }
        .faq-cat-header.active .faq-cat-icon {
          background: rgba(255,255,255,0.2);
          color: #fff;
        }
        .faq-cat-chevron {
          font-size: 12px;
          transition: transform 0.3s ease;
        }
        .faq-cat-header.active .faq-cat-chevron {
          transform: rotate(180deg);
        }
        .faq-cat-body {
          padding: 0;
        }
        .faq-accordion-item {
          border-bottom: 1px solid #f0f2f5;
        }
        .faq-accordion-item:last-child {
          border-bottom: none;
        }
        .faq-q-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px 14px 52px;
          cursor: pointer;
          transition: background 0.15s;
          gap: 12px;
        }
        .faq-q-header:hover {
          background: #fafbff;
        }
        .faq-q-text {
          font-weight: 600;
          font-size: 13px;
          color: #253d4e;
          flex: 1;
          line-height: 1.4;
        }
        .faq-q-header.active .faq-q-text {
          color: #1d5ba0;
        }
        .faq-q-chevron {
          font-size: 10px;
          color: #94a3b8;
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }
        .faq-q-header.active .faq-q-chevron {
          transform: rotate(180deg);
          color: #1d5ba0;
        }
        .faq-a-body {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s ease, padding 0.35s ease;
          padding: 0 20px 0 52px;
        }
        .faq-a-body.open {
          max-height: 200px;
          padding: 0 20px 16px 52px;
        }
        .faq-a-text {
          font-size: 13px;
          color: #64748b;
          line-height: 1.7;
          margin: 0;
          padding: 8px 14px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 3px solid #1d5ba0;
        }
        .faq-count-badge {
          font-size: 11px;
          background: #e8f0fb;
          color: #1d5ba0;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 700;
        }
        .faq-cat-header.active .faq-count-badge {
          background: rgba(255,255,255,0.2);
          color: #fff;
        }
      `}</style>

      <h2>{t.links.helpTicket}</h2>

      <div className="help-options">
        <button onClick={() => setShowSupport(true)}>
          {t.accountExtras.contactSupport}
        </button>
        <button onClick={() => setShowComplaint(true)}>
          {t.accountExtras.raiseComplaint}
        </button>
        <button onClick={() => setShowIssue(true)}>
          {t.accountExtras.reportIssue}
        </button>
      </div>

      {/* Contact Support Modal */}
      {showSupport && (
        <div className="help-modal-overlay">
          <div className="help-modal">
            <div className="help-modal-header">
              <h3>{t.accountExtras.contactSupport}</h3>
              <button onClick={() => setShowSupport(false)}>&times;</button>
            </div>
            <div className="help-modal-body">
              <div className="support-option" onClick={() => window.location.href="tel:+1800123456"}>
                <i className="fas fa-phone-alt"></i>
                <div>
                  <strong>Call Us</strong>
                  <p>Speak to our agent (6 AM - 3 AM)</p>
                </div>
              </div>
              <div className="support-option" onClick={() => {
                window.dispatchEvent(new CustomEvent("open-chatbot"));
                setShowSupport(false);
                setNotice({ type: "success", text: "Chat support opened." });
              }}>
                <i className="fas fa-comments"></i>
                <div>
                  <strong>Chat With Us</strong>
                  <p>Instant support via live chat</p>
                </div>
              </div>
              <div className="support-option" onClick={() => window.location.href="mailto:support@primebasket.com"}>
                <i className="fas fa-envelope"></i>
                <div>
                  <strong>Email Us</strong>
                  <p>Get a response within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raise Complaint Modal */}
      {showComplaint && (
        <div className="help-modal-overlay">
          <div className="help-modal">
            <div className="help-modal-header">
              <h3>Raise a Complaint</h3>
              <button onClick={() => setShowComplaint(false)}>&times;</button>
            </div>
            <form className="help-modal-body help-form" onSubmit={(e) => {
              e.preventDefault();
              const complaintId = "CMP" + Math.floor(Math.random() * 10000);
              setNotice({ type: "success", text: `Complaint registered successfully. ID: ${complaintId}` });
              setShowComplaint(false);
            }}>
              <label>Complaint Subject</label>
              <select required>
                <option value="">Select a subject</option>
                <option>Payment Issue</option>
                <option>Delivery Delay</option>
                <option>Account Access</option>
                <option>Other</option>
              </select>
              <label>Description</label>
              <textarea required placeholder="Explain your issue in detail..." rows="4"></textarea>
              <button type="submit" className="submit-btn">Submit Complaint</button>
            </form>
          </div>
        </div>
      )}

      {/* Report Order Issue Modal */}
      {showIssue && (
        <div className="help-modal-overlay">
          <div className="help-modal">
            <div className="help-modal-header">
              <h3>Report Order Issue</h3>
              <button onClick={() => setShowIssue(false)}>&times;</button>
            </div>
            <form className="help-modal-body help-form" onSubmit={(e) => {
              e.preventDefault();
              setNotice({ type: "success", text: "Issue reported. Our team will review it shortly." });
              setShowIssue(false);
            }}>
              <label>Order ID</label>
              <input type="text" required placeholder="e.g. PB1023" />
              <label>Issue Type</label>
              <select required>
                <option value="">Select issue</option>
                <option>Missing Items</option>
                <option>Damaged Products</option>
                <option>Wrong Items Received</option>
                <option>Quality Not Satisfactory</option>
              </select>
              <label>Description</label>
              <textarea required placeholder="Describe the problem..." rows="4"></textarea>
              <button type="submit" className="submit-btn">Report Issue</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .help-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
        }
        .help-modal {
          background: white; border-radius: 16px; width: 90%; max-width: 500px;
          overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .help-modal-header {
          padding: 20px; border-bottom: 1px solid #eee;
          display: flex; justify-content: space-between; align-items: center;
        }
        .help-modal-header h3 { margin: 0; font-size: 18px; color: #253d4e; }
        .help-modal-header button { background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8; }
        .help-modal-body { padding: 20px; }
        .support-option {
          display: flex; align-items: center; gap: 16px; padding: 16px;
          border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 12px;
          cursor: pointer; transition: 0.2s;
        }
        .support-option:hover { background: #f0f5ff; border-color: #1d5ba0; }
        .support-option i { font-size: 20px; color: #1d5ba0; width: 40px; height: 40px; background: #eef2ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .support-option strong { display: block; color: #253d4e; font-size: 15px; }
        .support-option p { margin: 2px 0 0; font-size: 13px; color: #64748b; }
        .help-form label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 6px; }
        .help-form input, .help-form select, .help-form textarea {
          width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;
          margin-bottom: 16px; font-family: inherit; font-size: 14px;
        }
        .help-form .submit-btn {
          width: 100%; padding: 14px; background: #1d5ba0; color: white;
          border: none; border-radius: 8px; font-weight: 700; cursor: pointer;
        }
      `}</style>

      <h3 style={{ fontSize: "1.15rem", color: "#253d4e", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <i className="fas fa-question-circle" style={{ color: "#1d5ba0" }}></i> FAQs
      </h3>

      {Object.keys(faqData).map((category, catIdx) => {
        const isOpen = openCategory === category;
        return (
          <div key={category} className="faq-accordion-category">
            <div
              className={`faq-cat-header ${isOpen ? "active" : ""}`}
              onClick={() => toggleCategory(category)}
            >
              <div className="faq-cat-left">
                <div className="faq-cat-icon">
                  <i className={`fas ${categoryIcons[category] || "fa-question"}`}></i>
                </div>
                {category}
                <span className="faq-count-badge">{faqData[category].length}</span>
              </div>
              <i className={`fas fa-chevron-down faq-cat-chevron`}></i>
            </div>
            {isOpen && (
              <div className="faq-cat-body">
                {faqData[category].map((item, qIdx) => {
                  const faqKey = `${catIdx}_${qIdx}`;
                  const isQOpen = openFaq === faqKey;
                  return (
                      <div key={faqKey} className="faq-accordion-item">
                      <div
                        className={`faq-q-header${isQOpen ? " active" : ""}`}
                        onClick={() => toggleFaq(faqKey)}
                      >
                        <span className="faq-q-text">{item.q}</span>
                        <i className={`fas fa-chevron-down faq-q-chevron`}></i>
                      </div>
                      <div className={`faq-a-body${isQOpen ? " open" : ""}`}>
                        <p className="faq-a-text">{item.a}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
