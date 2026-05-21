// src/pages/RateOrderPage.jsx
import { useState } from "react";
import { useT } from "../i18n/translations";

const ISSUE_OPTIONS = [
  { key: "missing", icon: "fa-box-open", label: "Missing / Incorrect items" },
  { key: "packaging", icon: "fa-boxes", label: "Poor packaging" },
  { key: "late", icon: "fa-clock", label: "Late delivery" },
  { key: "behavior", icon: "fa-user-times", label: "Delivery partner behavior" },
];

const TAG_OPTIONS = [
  { key: "packed", icon: "📦", label: "Well packed" },
  { key: "fresh", icon: "🌿", label: "Fresh" },
  { key: "taste", icon: "😋", label: "Good taste" },
  { key: "fast", icon: "⚡", label: "Fast delivery" },
  { key: "polite", icon: "🙏", label: "Polite partner" },
  { key: "value", icon: "💰", label: "Great value" },
];

export default function RateOrderPage({ order, onGoBack, onSubmit, language = "en", region = "in" }) {
  const t = useT(language);
  const currSym = region === "ke" ? "KES " : "\u20b9";

  const [ratings, setRatings] = useState({ delivery: 0, quality: 0 });
  const [hoverRatings, setHoverRatings] = useState({ delivery: 0, quality: 0 });
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [photos, setPhotos] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState("");

  const deliveryRating = ratings.delivery;
  const qualityRating = ratings.quality;
  const deliveryHover = hoverRatings.delivery;
  const qualityHover = hoverRatings.quality;
  const hasAnyRating = deliveryRating > 0 || qualityRating > 0;

  const averageRating = (deliveryRating + qualityRating) / 2;
  const ratingLevel = averageRating >= 4 ? "good" : averageRating >= 2.5 ? "medium" : averageRating > 0 ? "bad" : "none";

  const getDynamicTags = () => {
    if (ratingLevel === "good") return [
      { key: "packed", icon: "📦", label: "Well packed" },
      { key: "fresh", icon: "🌿", label: "Fresh" },
      { key: "taste", icon: "😋", label: "Good taste" },
      { key: "fast", icon: "⚡", label: "Fast delivery" },
      { key: "polite", icon: "🙏", label: "Polite partner" },
      { key: "value", icon: "💰", label: "Great value" },
    ];
    if (ratingLevel === "medium") return [
      { key: "avg", icon: "😐", label: "Average quality" },
      { key: "delayed", icon: "🕒", label: "Delayed slightly" },
      { key: "okpack", icon: "📦", label: "Ok packaging" },
      { key: "needs_imp", icon: "🛠️", label: "Needs improvement" },
      { key: "fair", icon: "⚖️", label: "Fair price" },
    ];
    if (ratingLevel === "bad") return [
      { key: "poor", icon: "😞", label: "Poor quality" },
      { key: "late", icon: "⏰", label: "Late delivery" },
      { key: "damaged", icon: "❌", label: "Damaged items" },
      { key: "rude", icon: "😠", label: "Rude behavior" },
      { key: "stale", icon: "🥀", label: "Not fresh" },
      { key: "expensive", icon: "💸", label: "Too expensive" },
    ];
    return [];
  };

  const dynamicTags = getDynamicTags();

  const toggleIssue = (key) => {
    setSelectedIssues(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };
  const toggleTag = (key) => {
    setSelectedTags(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = files.map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 5));
  };

  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!hasAnyRating) {
      setValidationError("Please provide at least one rating.");
      return;
    }
    setValidationError("");
    setSubmitted(true);
    if (onSubmit) {
      onSubmit({
        orderId: order?.orderId,
        deliveryRating: ratings.delivery,
        qualityRating: ratings.quality,
        issues: selectedIssues,
        tags: selectedTags,
        reviewText,
        photos: photos.length,
        date: new Date().toISOString()
      });
    }
  };

  const StarRow = ({ label, icon, rating, hover, onRate, onHover, onLeave }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "#f0f5ff", display: "flex", alignItems: "center",
          justifyContent: "center", color: "#1d5ba0", fontSize: 16,
        }}>
          <i className={`fas ${icon}`}></i>
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#253d4e" }}>{label}</span>
        {rating > 0 && (
          <span style={{
            marginLeft: "auto", fontSize: 12, fontWeight: 700,
            color: rating >= 4 ? "#16a34a" : rating >= 3 ? "#ca8a04" : "#dc2626",
            background: rating >= 4 ? "#dcfce7" : rating >= 3 ? "#fef9c3" : "#fee2e2",
            padding: "3px 10px", borderRadius: 20,
          }}>
            {rating === 5 ? "Excellent" : rating === 4 ? "Very Good" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            onClick={() => onRate(star)}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={() => onLeave()}
            style={{
              fontSize: 32, cursor: "pointer",
              color: star <= (hover || rating) ? "#f59e0b" : "#e0e4ea",
              transition: "transform 0.15s, color 0.15s",
              transform: star <= (hover || rating) ? "scale(1.1)" : "scale(1)",
            }}
          >★</span>
        ))}
      </div>
    </div>
  );

  if (submitted) {
    return (
      <>
        <style>{`
          @keyframes confettiPop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        `}</style>
        <div style={{
          background: "var(--bg)", minHeight: "100vh", display: "flex",
          alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "60px 48px",
            textAlign: "center", maxWidth: 480, width: "100%",
            boxShadow: "0 8px 40px rgba(0,0,0,.08)",
            animation: "confettiPop 0.5s ease",
          }}>
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              background: "#dcfce7", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 24px",
              fontSize: 40,
            }}>🎉</div>
            <h2 style={{ fontFamily: "'Quicksand',sans-serif", fontSize: 24, fontWeight: 800, color: "#253d4e", margin: "0 0 8px" }}>
              Thank You for Your Feedback!
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              Your review helps us improve our service and products.
              <br />Delivery: {"★".repeat(deliveryRating)}{"☆".repeat(5 - deliveryRating)}
              {" · "}Quality: {"★".repeat(qualityRating)}{"☆".repeat(5 - qualityRating)}
            </p>
            <button onClick={onGoBack} style={{
              background: "#1d5ba0", color: "#fff", border: "none",
              borderRadius: 12, padding: "14px 40px", fontSize: 14,
              fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>
              <i className="fas fa-arrow-left" style={{ marginRight: 8 }}></i>
              Back to Orders
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .ro-page { background:var(--bg); min-height:100vh; padding:0 0 60px; font-family:'Nunito',sans-serif; }
        .ro-crumb { background:linear-gradient(180deg, rgba(255,255,255,0.97), rgba(246,250,255,0.96)); border-bottom:1px solid rgba(203,213,225,0.78); padding:13px 0; backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); }
        .ro-crumb-inner { display:flex; align-items:center; gap:10px; font-size:13px; color:var(--body); }
        .ro-crumb-back { color:#1d5ba0; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:7px; padding:8px 13px; border-radius:999px; border:1px solid rgba(191,219,254,0.98); background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(237,244,255,0.98)); box-shadow:0 10px 20px rgba(29,91,160,0.08); transition:transform .22s ease, box-shadow .22s ease, color .22s ease; }
        .ro-crumb-back:hover { transform:translateY(-1px); box-shadow:0 16px 28px rgba(29,91,160,0.14); }
        .ro-container { max-width:640px; margin:0 auto; padding:28px 20px; }
        .ro-card {
          background:#fff; border-radius:16px; border:1px solid var(--border);
          box-shadow:0 4px 24px rgba(0,0,0,.05); margin-bottom:20px; overflow:hidden;
        }
        .ro-card-header {
          padding:18px 24px; border-bottom:1px solid var(--border);
          display:flex; align-items:center; gap:10px;
        }
        .ro-card-header h3 {
          font-family:'Quicksand',sans-serif; font-size:16px;
          font-weight:800; color:#253d4e; margin:0;
        }
        .ro-card-header i { color:#1d5ba0; font-size:16px; }
        .ro-card-body { padding:24px; }

        .ro-issue-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .ro-issue-btn {
          display:flex; align-items:center; gap:10px;
          padding:14px 16px; border-radius:10px;
          border:1.5px solid var(--border); background:#fff;
          cursor:pointer; transition:.2s; font-family:inherit;
          font-size:13px; font-weight:600; color:#253d4e;
        }
        .ro-issue-btn:hover { border-color:#1d5ba0; background:#f0f5ff; }
        .ro-issue-btn.active { border-color:#1d5ba0; background:#1d5ba0; color:#fff; }
        .ro-issue-btn i { font-size:14px; }
        .ro-issue-btn.active i { color:#fff; }

        .ro-tag-row { display:flex; flex-wrap:wrap; gap:8px; }
        .ro-tag {
          display:inline-flex; align-items:center; gap:6px;
          padding:8px 16px; border-radius:20px;
          border:1.5px solid var(--border); background:#fff;
          cursor:pointer; transition:.2s; font-size:13px;
          font-weight:600; color:#253d4e; font-family:inherit;
        }
        .ro-tag:hover { border-color:#1d5ba0; }
        .ro-tag.active { border-color:#16a34a; background:#dcfce7; color:#16a34a; }

        .ro-textarea {
          width:100%; min-height:100px; border:1.5px solid var(--border);
          border-radius:12px; padding:16px; font-size:14px;
          font-family:inherit; resize:vertical; outline:none;
          transition:border-color .2s;
        }
        .ro-textarea:focus { border-color:#1d5ba0; }

        .ro-photos { display:flex; gap:10px; flex-wrap:wrap; margin-top:16px; }
        .ro-photo-thumb {
          width:72px; height:72px; border-radius:10px;
          border:1px solid var(--border); overflow:hidden;
          position:relative;
        }
        .ro-photo-thumb img { width:100%; height:100%; object-fit:cover; }
        .ro-photo-remove {
          position:absolute; top:2px; right:2px;
          width:20px; height:20px; border-radius:50%;
          background:rgba(0,0,0,.6); color:#fff; border:none;
          font-size:10px; cursor:pointer; display:flex;
          align-items:center; justify-content:center;
        }
        .ro-photo-add {
          width:72px; height:72px; border-radius:10px;
          border:2px dashed #d0d8e4; display:flex;
          align-items:center; justify-content:center;
          cursor:pointer; color:#94a3b8; font-size:20px;
          transition:.2s; position:relative; overflow:hidden;
        }
        .ro-photo-add:hover { border-color:#1d5ba0; color:#1d5ba0; }
        .ro-photo-add input { 
          position:absolute; inset:0; opacity:0; cursor:pointer;
        }

        .ro-submit {
          width:100%; background:linear-gradient(135deg, #1d5ba0, #2980b9);
          color:#fff; border:none; border-radius:12px;
          padding:16px; font-size:16px; font-weight:700;
          cursor:pointer; font-family:inherit; transition:.2s;
          display:flex; align-items:center; justify-content:center; gap:10px;
          box-shadow:0 4px 16px rgba(29,91,160,.25);
        }
        .ro-submit:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(29,91,160,.35); }
      `}</style>

      <div className="ro-page">
        <div className="ro-crumb">
          <div className="container ro-crumb-inner">
            <span className="ro-crumb-back" onClick={onGoBack}>
              <i className="fas fa-arrow-left" style={{ fontSize: 10 }}></i> My Orders
            </span>
            <i className="fas fa-chevron-right" style={{ fontSize: 10 }}></i>
            <span style={{ color: "var(--dark)", fontWeight: 700 }}>Rate Order</span>
          </div>
        </div>

        <div className="ro-container">

          {/* Order badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#f0f5ff", padding: "8px 16px", borderRadius: 8,
            fontSize: 13, fontWeight: 700, color: "#1d5ba0", marginBottom: 24,
          }}>
            <i className="fas fa-receipt"></i>
            Rating Order #{order?.orderId}
          </div>

          {/* Star Ratings */}
          <div className="ro-card">
            <div className="ro-card-header">
              <i className="fas fa-star"></i>
              <h3>Rate Your Experience</h3>
            </div>
            <div className="ro-card-body">
              <StarRow
                label="Delivery Experience"
                icon="fa-truck"
                rating={deliveryRating}
                hover={deliveryHover}
                onRate={(value) => {
                  setRatings((prev) => ({ ...prev, delivery: value }));
                  if (validationError) setValidationError("");
                }}
                onHover={(value) => setHoverRatings((prev) => ({ ...prev, delivery: value }))}
                onLeave={() => setHoverRatings((prev) => ({ ...prev, delivery: 0 }))}
              />
              <StarRow
                label="Product Quality"
                icon="fa-gem"
                rating={qualityRating}
                hover={qualityHover}
                onRate={(value) => {
                  setRatings((prev) => ({ ...prev, quality: value }));
                  if (validationError) setValidationError("");
                }}
                onHover={(value) => setHoverRatings((prev) => ({ ...prev, quality: value }))}
                onLeave={() => setHoverRatings((prev) => ({ ...prev, quality: 0 }))}
              />
            </div>
          </div>

          {/* Issues */}
          <div className="ro-card">
            <div className="ro-card-header">
              <i className="fas fa-exclamation-triangle"></i>
              <h3>Any Issues?</h3>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8" }}>Select if applicable</span>
            </div>
            <div className="ro-card-body">
              <div className="ro-issue-grid">
                {ISSUE_OPTIONS.map(issue => (
                  <button
                    key={issue.key}
                    className={`ro-issue-btn${selectedIssues.includes(issue.key) ? " active" : ""}`}
                    onClick={() => toggleIssue(issue.key)}
                  >
                    <i className={`fas ${issue.icon}`}></i>
                    {issue.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags & Review */}
          <div className="ro-card">
            <div className="ro-card-header">
              <i className="fas fa-comment-dots"></i>
              <h3>Write Your Review</h3>
            </div>
            <div className="ro-card-body">
              {/* Quick tags */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>Quick Tags</div>
                <div className="ro-tag-row">
                  {dynamicTags.map(tag => (
                    <button
                      key={tag.key}
                      className={`ro-tag${selectedTags.includes(tag.key) ? " active" : ""}`}
                      onClick={() => toggleTag(tag.key)}
                    >
                      {tag.icon} {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review text */}
              <textarea
                className="ro-textarea"
                placeholder="Share your detailed experience with this order..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />

              {/* Photos */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>
                  <i className="fas fa-camera" style={{ marginRight: 6 }}></i>
                  Add Photos ({photos.length}/5)
                </div>
                <div className="ro-photos">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="ro-photo-thumb">
                      <img src={photo.url} alt={photo.name} />
                      <button className="ro-photo-remove" onClick={() => removePhoto(idx)}>✕</button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <div className="ro-photo-add">
                      <i className="fas fa-plus"></i>
                      <input type="file" accept="image/*" multiple onChange={handlePhotoAdd} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          {validationError && (
            <div style={{ margin: "0 0 14px", color: "#dc2626", fontSize: 13, fontWeight: 700 }}>
              {validationError}
            </div>
          )}
          <button className="ro-submit" onClick={handleSubmit}>
            <i className="fas fa-paper-plane"></i>
            Submit Review
          </button>

        </div>
      </div>
    </>
  );
}
