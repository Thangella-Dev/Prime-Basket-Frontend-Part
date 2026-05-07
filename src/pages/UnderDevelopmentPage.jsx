// src/pages/UnderDevelopmentPage.jsx
import { useT } from "../i18n/translations";

export default function UnderDevelopmentPage({ label, onGoHome, language = "en" }) {
  const t = useT(language);
  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 20px",
      fontFamily: "'Nunito', sans-serif",
      textAlign: "center",
    }}>
      {/* Animated gears illustration */}
      <div style={{ position: "relative", width: "120px", height: "120px", marginBottom: "32px" }}>
        <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }}>
          <style>{`
            @keyframes spinCW  { from { transform-origin: 38px 38px; transform: rotate(0deg);   } to { transform-origin: 38px 38px; transform: rotate(360deg);  } }
            @keyframes spinCCW { from { transform-origin: 82px 82px; transform: rotate(0deg);   } to { transform-origin: 82px 82px; transform: rotate(-360deg); } }
            .g1 { animation: spinCW  3s linear infinite; }
            .g2 { animation: spinCCW 3s linear infinite; }
          `}</style>
          {/* Gear 1 */}
          <g className="g1">
            <path fill="#1d5ba0" d="
              M38 18 l3-6h-6l3 6
              M50.5 21.5 l5.2-3.6-4.2-4.2-3.6 5.2
              M57.5 31.5 l6-3-3-5.2-6 3
              M59 44 l6 3 3-5.2-6-3
              M55 55.5 l5.2 3.6 4.2-4.2-5.2-3.6
              M44.5 60 l3 6h-6l3-6
              M33 56 l-5.2 3.6 4.2 4.2 5.2-3.6
              M24 47 l-6 3 3 5.2 6-3
              M20 34 l-6-3-3 5.2 6 3
              M24 22.5 l-5.2-3.6-4.2 4.2 5.2 3.6
            " />
            <circle cx="38" cy="38" r="16" fill="#1d5ba0" />
            <circle cx="38" cy="38" r="8"  fill="white" />
          </g>
          {/* Gear 2 (smaller) */}
          <g className="g2">
            <path fill="#0ea5e9" d="
              M82 62 l2.5-5h-5l2.5 5
              M91 64.5 l4.3-3-3.5-3.5-3 4.3
              M96 72 l5-2.5-2.5-4.3-5 2.5
              M97 81 l5 2.5 2.5-4.3-5-2.5
              M94 89 l4.3 3 3.5-3.5-4.3-3
              M87.5 93 l2.5 5h-5l2.5-5
              M78 90 l-4.3 3 3.5 3.5 4.3-3
              M72 83.5 l-5 2.5 2.5 4.3 5-2.5
              M70 74.5 l-5-2.5-2.5 4.3 5 2.5
              M73 66 l-4.3-3-3.5 3.5 4.3 3
            " />
            <circle cx="82" cy="77" r="13" fill="#0ea5e9" />
            <circle cx="82" cy="77" r="6.5" fill="white" />
          </g>
        </svg>
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#1d5ba0", marginBottom: "10px" }}>
        🚧 {t.dev.title}
      </h1>

      {label && (
        <p style={{ fontSize: "16px", fontWeight: 700, color: "#0ea5e9", marginBottom: "8px" }}>
          "{label}"
        </p>
      )}

      <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "400px", lineHeight: 1.7, marginBottom: "32px" }}>
        {t.dev.desc}
      </p>

      {/* Progress bar animation */}
      <div style={{ width: "260px", height: "6px", background: "#e0f2fe", borderRadius: "6px", overflow: "hidden", marginBottom: "36px" }}>
        <div style={{
          height: "100%",
          background: "linear-gradient(90deg, #1d5ba0, #0ea5e9)",
          borderRadius: "6px",
          animation: "progressPulse 2s ease-in-out infinite",
        }} />
        <style>{`
          @keyframes progressPulse {
            0%   { width: 20%; margin-left: 0; }
            50%  { width: 60%; margin-left: 20%; }
            100% { width: 20%; margin-left: 80%; }
          }
        `}</style>
      </div>

      <button
        onClick={onGoHome}
        style={{
          background: "linear-gradient(135deg, #1d5ba0, #0ea5e9)",
          color: "white",
          border: "none",
          borderRadius: "10px",
          padding: "12px 32px",
          fontSize: "14px",
          fontWeight: 800,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 4px 166px rgba(29,91,160,0.3)",
          transition: "transform 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        ← {t.dev.backHome}
      </button>
    </div>
  );
}