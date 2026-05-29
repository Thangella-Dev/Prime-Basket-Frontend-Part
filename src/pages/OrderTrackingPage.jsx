// src/pages/OrderTrackingPage.jsx
import { useState, useEffect } from "react";
import { useT } from "../i18n/translations";
import { useTracking } from "../context/TrackingContext";

const getTrackingSteps = (t) => [
  { key: "Confirmed",  icon: "fa-clipboard-check", label: t.tracking.confirmed,  desc: t.tracking.confirmedDesc },
  { key: "Packed",     icon: "fa-box-open",        label: t.tracking.packed,     desc: t.tracking.packedDesc },
  { key: "Out for Delivery", icon: "fa-shipping-fast", label: t.tracking.outForDelivery, desc: t.tracking.outForDeliveryDesc },
  { key: "Delivered",  icon: "fa-check-circle",     label: t.tracking.delivered, desc: t.tracking.deliveredDesc },
];

export default function OrderTrackingPage({ order, onGoHome, onGoOrders, addNotification, onStatusUpdate: _onStatusUpdate, language = "en", region = "in" }) {
  const t = useT(language);

  // Track current step index (0..3)
  const [currentStep, setCurrentStep] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");


  const { activeOrder } = useTracking();

  // Sync current step with activeOrder status
  useEffect(() => {
    if (activeOrder) {
      const steps = ["Confirmed", "Packed", "Out for Delivery", "Delivered"];
      const s = activeOrder.status === "Processing" ? "Packed" : activeOrder.status;
      const idx = steps.indexOf(s);
      if (idx !== -1) setCurrentStep(idx);
      if (activeOrder.status === "Delivered") setShowFeedback(true);
    }
  }, [activeOrder?.status, activeOrder?.orderId]);
 
  const handleFeedbackSubmit = () => {
    if (rating === 0) {
      setFeedbackError("Please select a rating for the delivery partner.");
      return;
    }
    setFeedbackError("");
    if (order?.items?.length > 0) {
      try {
        const storedRatings = JSON.parse(localStorage.getItem("pb_product_ratings") || "{}");
        order.items.forEach(item => {
          const id = item._uid || item.id;
          if (id) {
            const current = storedRatings[id] || { stars: 0, count: 0, total: 0 };
            storedRatings[id] = {
              stars: rating,
              count: current.count + 1,
              total: current.total + rating
            };
          }
        });
        localStorage.setItem("pb_product_ratings", JSON.stringify(storedRatings));
        window.dispatchEvent(new Event('storage'));
      } catch {}
    }
    setFeedbackSubmitted(true);
    if (addNotification) {
      addNotification("Feedback Received", `Thank you for rating! (${rating}/5 stars)`, "success");
    }
    setTimeout(() => { if (onGoOrders) onGoOrders(); }, 2000);
  };



  return (
    <>
      <style>{`
        .ot-page { background: var(--bg); min-height: 100vh; padding: 40px 20px; font-family: 'Nunito', sans-serif; }
        .ot-container { max-width: 700px; margin: 0 auto; }

        .ot-header-card {
          background: linear-gradient(135deg, #1d5ba0, #2980b9);
          border-radius: 20px;
          padding: 32px 36px;
          color: #fff;
          margin-bottom: 28px;
          position: relative;
          overflow: hidden;
        }
        .ot-header-card::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -30%;
          width: 300px;
          height: 300px;
          background: rgba(255,255,255,0.06);
          border-radius: 50%;
        }
        .ot-header-title {
          font-family: 'Quicksand', sans-serif;
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 6px;
        }
        .ot-header-sub {
          font-size: 14px;
          opacity: 0.85;
        }
        .ot-order-id {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.15);
          padding: 8px 16px;
          border-radius: 10px;
          margin-top: 16px;
          font-size: 14px;
          font-weight: 700;
          backdrop-filter: blur(10px);
        }

        /* ── Tracking Timeline ── */
        .ot-timeline {
          background: #fff;
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 8px 40px rgba(0,0,0,0.06);
          padding: 36px 40px;
          margin-bottom: 28px;
        }
        .ot-timeline-title {
          font-family: 'Quicksand', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #253d4e;
          margin: 0 0 28px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ot-timeline-title i { color: #1d5ba0; }

        .ot-steps {
          position: relative;
          padding-left: 42px;
        }
        /* Vertical line */
        .ot-steps::before {
          content: "";
          position: absolute;
          left: 20px;
          top: 20px;
          bottom: 20px;
          width: 3px;
          background: #e8ecf2;
          border-radius: 2px;
        }
        /* Animated progress line */
        .ot-steps-progress {
          position: absolute;
          left: 20px;
          top: 20px;
          width: 3px;
          background: linear-gradient(180deg, #1d5ba0, #16a34a);
          border-radius: 2px;
          transition: height 1s ease;
        }

        .ot-step {
          position: relative;
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr);
          align-items: start;
          column-gap: 14px;
          padding-bottom: 36px;
        }
        .ot-step:last-child { padding-bottom: 0; }

        .ot-step-dot {
          position: relative;
          left: auto;
          top: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.5s ease;
          z-index: 2;
        }
        .ot-step-dot.pending {
          background: #f0f2f5;
          color: #94a3b8;
          border: 2px solid #e0e4ea;
        }
        .ot-step-dot.active {
          background: #1d5ba0;
          color: #fff;
          border: 3px solid #a3c4f3;
          animation: stepPop 0.5s ease;
          box-shadow: 0 0 0 6px rgba(29,91,160,0.12);
        }
        .ot-step-dot.done {
          background: #16a34a;
          color: #fff;
          border: 2px solid #86efac;
        }

        @keyframes stepPop {
          0% { transform: scale(0.6); }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        .ot-step-content {
          padding-left: 0;
          min-width: 0;
        }
        .ot-step-label {
          font-weight: 800;
          font-size: 15px;
          color: #253d4e;
          margin-bottom: 4px;
          transition: color 0.3s;
        }
        .ot-step.completed .ot-step-label { color: #16a34a; }
        .ot-step.current .ot-step-label { color: #1d5ba0; }
        .ot-step.pending .ot-step-label { color: #94a3b8; }

        .ot-step-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
        }
        .ot-step.pending .ot-step-desc { color: #cbd5e1; }

        .ot-step-time {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        /* ── Live indicator ── */
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .ot-live-dot {
          width: 8px;
          height: 8px;
          background: #16a34a;
          border-radius: 50%;
          display: inline-block;
          animation: livePulse 1.5s ease-in-out infinite;
        }

        /* ── Feedback Card ── */
        .ot-feedback-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 8px 40px rgba(0,0,0,0.06);
          padding: 36px 40px;
          margin-bottom: 28px;
          text-align: center;
          animation: slideUp 0.5s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ot-feedback-title {
          font-family: 'Quicksand', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #253d4e;
          margin: 0 0 8px;
        }
        .ot-feedback-sub {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 24px;
        }

        .ot-stars {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .ot-star {
          font-size: 36px;
          cursor: pointer;
          transition: transform 0.2s, color 0.2s;
          color: #d0d8e4;
        }
        .ot-star:hover { transform: scale(1.2); }
        .ot-star.filled { color: #f59e0b; }

        .ot-feedback-textarea {
          width: 100%;
          min-height: 80px;
          border: 1.5px solid #e8ecf2;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
          margin-bottom: 16px;
        }
        .ot-feedback-textarea:focus { border-color: #1d5ba0; }

        .ot-feedback-submit {
          background: #1d5ba0;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 14px 40px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .ot-feedback-submit:hover { background: #174d8a; transform: translateY(-1px); }

        /* ── Success checkmark ── */
        .ot-success-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          animation: stepPop 0.5s ease;
        }
        .ot-success-icon i { font-size: 36px; color: #16a34a; }

        /* ── Buttons ── */
        .ot-btns {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .ot-btn-primary {
          background: #1d5ba0;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 13px 28px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .ot-btn-primary:hover { background: #174d8a; }
        .ot-btn-secondary {
          background: #fff;
          color: #1d5ba0;
          border: 2px solid #1d5ba0;
          border-radius: 10px;
          padding: 13px 28px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .ot-btn-secondary:hover { background: #f0f5ff; }

        /* Delivery partner card */
        .ot-partner-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 22px;
          background: #f8fafc;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .ot-partner-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1d5ba0, #2980b9);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 22px;
          flex-shrink: 0;
        }
        .ot-partner-name {
          font-weight: 800;
          font-size: 15px;
          color: #253d4e;
        }
        .ot-partner-role {
          font-size: 12px;
          color: #64748b;
        }
        .ot-partner-phone {
          margin-left: auto;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #16a34a;
          font-size: 16px;
          cursor: pointer;
          transition: 0.2s;
        }
        .ot-partner-phone:hover { background: #bbf7d0; }

        @media (max-width: 900px) {
          .ot-page { padding: 28px 16px; }
          .ot-header-card { padding: 24px 22px; }
          .ot-header-title { font-size: 22px; }
          .ot-header-sub { font-size: 13px; }
          .ot-order-id { padding: 10px 14px; font-size: 13px; }
          .ot-timeline { padding: 24px 22px; }
          .ot-steps { padding-left: 38px; }
          .ot-steps::before,
          .ot-steps-progress { left: 18px; top: 18px; bottom: 18px; }
          .ot-step { grid-template-columns: 36px minmax(0, 1fr); column-gap: 12px; }
          .ot-step-dot { width: 36px; height: 36px; }
          .ot-step-content { padding-left: 0; }
          .ot-step-label { font-size: 14px; }
          .ot-step-desc { font-size: 13px; }
          .ot-feedback-card { padding: 28px 22px; }
          .ot-stars { gap: 6px; }
          .ot-star { font-size: 32px; }
          .ot-partner-card { flex-direction: column; align-items: stretch; gap: 14px; }
          .ot-partner-phone { margin-left: 0; }
          .ot-btns { flex-direction: column; }
          .ot-btn-primary, .ot-btn-secondary { width: 100%; justify-content: center; }
        }

        @media (max-width: 600px) {
          .ot-page { padding: 20px 12px; }
          .ot-header-card { padding: 20px 18px; }
          .ot-timeline { padding: 20px 18px; }
          .ot-steps { padding-left: 36px; }
          .ot-steps::before,
          .ot-steps-progress { left: 17px; top: 17px; bottom: 17px; }
          .ot-step { grid-template-columns: 34px minmax(0, 1fr); column-gap: 10px; }
          .ot-step-dot { width: 34px; height: 34px; }
          .ot-step-content { padding-left: 0; }
          .ot-live-dot { width: 6px; height: 6px; }
          .ot-feedback-submit { width: 100%; padding: 14px 20px; }
          .ot-partner-card { padding: 16px 18px; }
        }
      `}</style>

      <div className="ot-page">
        <div className="ot-container reveal">

          {/* Header */}
          <div className="ot-header-card">
            <div className="ot-header-title">
              <i className="fas fa-truck" style={{ marginRight: "10px" }}></i>
              {t.tracking.title}
            </div>
            <div className="ot-header-sub">{t.tracking.subTitle}</div>
            <div className="ot-order-id">
              <i className="fas fa-receipt"></i>
              {t.order.id} #{order?.orderId || "PB" + Date.now().toString().slice(-6)}
            </div>
          </div>

          {/* Timeline Tracker */}
          <div className="ot-timeline">
            <div className="ot-timeline-title">
              <i className="fas fa-route"></i>
              {t.tracking.progress}
              {currentStep < 3 && (
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>
                  <span className="ot-live-dot"></span> {t.tracking.live}
                </span>
              )}
            </div>

            <div className="ot-steps">
              {/* Progress line */}
              <div
                className="ot-steps-progress"
                style={{ height: `${(currentStep / (getTrackingSteps(t).length - 1)) * 100}%` }}
              />

              {getTrackingSteps(t).map((step, idx) => {
                const isLastStep = idx === getTrackingSteps(t).length - 1;
                const isDelivered = isLastStep && currentStep === idx;
                // When delivered, the last step is also "completed", not "current"
                const status = idx < currentStep || isDelivered ? "completed" : idx === currentStep ? "current" : "pending";
                const dotClass = idx < currentStep || isDelivered ? "done" : idx === currentStep ? "active" : "pending";
                const now = new Date();
                const stepTime = new Date(now.getTime() + (idx * 5 - currentStep * 2) * 60000);
                
                return (
                  <div key={step.key} className={`ot-step ${status}`}>
                    <div className={`ot-step-dot ${dotClass}`}>
                      <i className={`fas ${status === "completed" ? "fa-check" : step.icon}`}></i>
                    </div>
                    <div className="ot-step-content">
                      <div className="ot-step-label">{step.label}</div>
                      <div className="ot-step-desc">{step.desc}</div>
                      {status !== "pending" && (
                        <div className="ot-step-time" style={status === "completed" ? { color: "#16a34a" } : {}}>
                          <i className="far fa-clock" style={status === "completed" ? { color: "#16a34a" } : {}}></i>
                          {status === "current" ? (language === "ke" ? "Inashughulikiwa..." : "In progress...") : stepTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


 
          {/* Feedback Form — only after delivery */}
          {showFeedback && !feedbackSubmitted && (
            <div className="ot-feedback-card reveal">
              <div className="ot-success-icon">
                <i className="fas fa-check"></i>
              </div>
              <div className="ot-feedback-title">{t.tracking.feedbackTitle}</div>
              <div className="ot-feedback-sub">
                {t.tracking.feedbackSub}
              </div>
 
              {/* Delivery Partner */}
              <div className="ot-partner-card">
                <div className="ot-partner-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div className="ot-partner-name">{region === "ke" ? "Maina Kamau" : "Rahul Kumar"}</div>
                  <div className="ot-partner-role">{t.tracking.partnerRole}</div>
                </div>
                <div className="ot-partner-phone" title="Call delivery partner">
                  <i className="fas fa-phone-alt"></i>
                </div>
              </div>
 
              {/* Star Rating */}
              <div className="ot-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`ot-star${star <= (hoverRating || rating) ? " filled" : ""}`}
                    onClick={() => {
                      setRating(star);
                      if (feedbackError) setFeedbackError("");
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </span>
                ))}
              </div>
              {rating > 0 && (
                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
                  {rating === 1 && (language === "ke" ? "Mbaya 😞" : "Poor 😞")}
                  {rating === 2 && (language === "ke" ? "Kawaida 😐" : "Fair 😐")}
                  {rating === 3 && (language === "ke" ? "Nzuri 🙂" : "Good 🙂")}
                  {rating === 4 && (language === "ke" ? "Nzuri Sana 😊" : "Very Good 😊")}
                  {rating === 5 && (language === "ke" ? "Bora Zaidi! 🤩" : "Excellent! 🤩")}
                </div>
              )}
              {feedbackError && (
                <div style={{ fontSize: "13px", color: "#dc2626", margin: "-6px 0 16px", fontWeight: 700 }}>
                  {feedbackError}
                </div>
              )}
 
              {/* Feedback Text */}
              <textarea
                className="ot-feedback-textarea"
                placeholder={language === "ke" ? "Shiriki uzoefu wako wa uwasilishaji... (si lazima)" : "Share your delivery experience... (optional)"}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
 
              <button className="ot-feedback-submit" onClick={handleFeedbackSubmit}>
                <i className="fas fa-paper-plane"></i>
                {t.tracking.submit}
              </button>
            </div>
          )}
 
          {/* Thank you after submission */}
          {feedbackSubmitted && (
            <div className="ot-feedback-card reveal">
              <div className="ot-success-icon">
                <i className="fas fa-heart"></i>
              </div>
              <div className="ot-feedback-title">{t.tracking.thankYou}</div>
              <div className="ot-feedback-sub">
                {t.tracking.thankYouDesc}
                <br />
                {language === "ke" ? "Inakupeleka kwenye maagizo yako..." : "Redirecting to your orders..."}
              </div>
            </div>
          )}
 
          {/* Bottom Navigation */}
          <div className="ot-btns">
            <button className="ot-btn-secondary" onClick={onGoHome}>
              <i className="fas fa-home"></i> {t.order.continueShopping}
            </button>
            <button className="ot-btn-primary" onClick={onGoOrders}>
              <i className="fas fa-box"></i> {t.order.myOrders}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
