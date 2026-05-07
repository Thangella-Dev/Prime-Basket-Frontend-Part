import { useEffect, useState } from "react";
import "./PhoneLoginModal.css";
import { sendDemoPhoneOtp, verifyDemoPhoneOtp } from "../utils/demoPhoneAuth";
import { useT } from "../i18n/translations";
import {
  getPhoneCountry,
  getPhoneInputMaxLength,
  sanitizePhoneInput,
  validateAndNormalizePhone,
} from "../utils/phoneValidation";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Country list with flag, dial code, max digits
const COUNTRIES = [
  { ...getPhoneCountry("KE"), flagSrc: "https://flagcdn.com/w20/ke.png" },
  { ...getPhoneCountry("IN"), flagSrc: "https://flagcdn.com/w20/in.png" },
];

export default function PhoneAuthModal({
  isOpen,
  onClose,
  apiBaseUrl,
  onLoginSuccess,
  redirectPath,
  language = "en",
  region = "in",
}) {
  const t = useT(language);

  // Auto-select country from language
  const defaultCountry = region === "ke" || language === "ke"
    ? COUNTRIES.find(c => c.code === "KE")
    : COUNTRIES.find(c => c.code === "IN");

  const [step, setStep] = useState("PHONE");
  const [digits, setDigits] = useState("");          // only the number part
  const [country, setCountry] = useState(defaultCountry);
  const [sentPhone, setSentPhone] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");

  const baseUrl = apiBaseUrl || API_BASE_URL;

  useEffect(() => {
    if (!isOpen || step !== "PHONE" || digits) return;
    setCountry(defaultCountry);
  }, [defaultCountry, digits, isOpen, step]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    document.body.classList.toggle("prime-auth-open", isOpen);
    return () => {
      document.body.classList.remove("prime-auth-open");
    };
  }, [isOpen]);

  const phoneValidation = validateAndNormalizePhone(country.code, digits);
  const inputMaxLength = getPhoneInputMaxLength(country.code, digits);
  const fullPhone = () => phoneValidation.normalized;
  const isValidPhone = () => phoneValidation.isValid;

  const resetForm = () => {
    setStep("PHONE");
    setDigits("");
    setOtp("");
    setError("");
    setDevOtp("");
    setSentPhone("");
    setShowDropdown(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleDigitsChange = (e) => {
    setDigits(sanitizePhoneInput(country.code, e.target.value));
    setError("");
  };

  const handleCountrySelect = (c) => {
    setCountry(c);
    setDigits("");
    setShowDropdown(false);
    setError("");
  };

  const performSendOtp = async () => {
    setError("");
    setLoading(true);
    const validation = validateAndNormalizePhone(country.code, digits);
    const phone = validation.normalized;
    try {
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const response = await fetch(`${baseUrl}/api/auth/send-phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "LOGIN" }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
      if (data.devOtp || data.otp) setDevOtp(data.devOtp || data.otp);
      setSentPhone(phone);
      setStep("OTP");
    } catch (err) {
      if (err instanceof TypeError && isValidPhone()) {
        try {
          const fallback = await sendDemoPhoneOtp({ phone, purpose: "LOGIN" });
          setDevOtp(fallback.otp || "");
          setSentPhone(phone);
          setStep("OTP");
          setError("");
        } catch (fb) {
          setError(fb.message || t.auth.serverError);
        }
      } else {
        setError(err.message || t.auth.serverError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => { e.preventDefault(); await performSendOtp(); };
  const handleResendOtp = async () => { await performSendOtp(); };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!/^\d{6}$/.test(otp.trim())) throw new Error(t.auth.invalidOtp);

      let data;
      try {
        const response = await fetch(`${baseUrl}/api/auth/verify-phone-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: sentPhone || fullPhone(), otp: otp.trim() }),
        });
        data = await response.json();
        if (!response.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
      } catch (ne) {
        if (ne instanceof TypeError) {
          data = await verifyDemoPhoneOtp({ phone: sentPhone || fullPhone(), otp: otp.trim() });
          setDevOtp("");
        } else throw ne;
      }

      if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));
      if (data?.accessToken) localStorage.setItem("accessToken", data.accessToken);
      if (data?.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);

      if (typeof onLoginSuccess === "function") onLoginSuccess(data);
      if (redirectPath) window.location.assign(redirectPath);
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof TypeError ? t.auth.serverError : err.message || t.auth.invalidOtp);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => { setStep("PHONE"); setOtp(""); setError(""); setDevOtp(""); };

  if (!isOpen) return null;

  return (
    <div className="phone-login-overlay" onClick={handleClose}>
      <div className="phone-login-modal" onClick={(e) => e.stopPropagation()}>

        {/* Left – video/logo panel */}
        <div className="phone-login-video">
          <video autoPlay loop muted playsInline className="modal-video">
            <source src="/thelogovideo.mp4" type="video/mp4" />
          </video>
          <div className="video-overlay"></div>
        </div>

        {/* Right – form panel */}
        <div className="phone-login-form-container">
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close sign in">
            ×
          </button>

          <div className="phone-login-content">
            <h3>{step === "PHONE" ? t.auth.signIn : t.auth.verifyOtp}</h3>

            {step === "PHONE" && (
              <div className="phone-instruction">{t.auth.mobileNumber}</div>
            )}

            {error && <div className="error-message">{error}</div>}
            {devOtp && (
              <div className="dev-otp-display">
                <strong>OTP:</strong> {devOtp}
              </div>
            )}

            {/* ── PHONE STEP ── */}
            {step === "PHONE" ? (
              <form onSubmit={handleSendOtp} style={{ width: "100%" }}>

                {/* Input wrapper — position:relative so dropdown anchors right here */}
                <div style={{ position: "relative", width: "100%" }}>

                  {/* Split input */}
                  <div className="phone-split-input">

                    {/* Country selector */}
                    <button
                      type="button"
                      className="country-selector"
                      onClick={() => setShowDropdown(d => !d)}
                      disabled={loading}
                    >
                      <img
                        src={country.flagSrc}
                        alt={country.code}
                        className="country-flag-img"
                      />
                      <span className="country-dial">{country.dial}</span>
                      <span className="country-caret" aria-hidden="true">▾</span>
                    </button>

                    <div className="phone-divider" />

                    <input
                      type="tel"
                      className="phone-digits-input"
                      value={digits}
                      onChange={handleDigitsChange}
                      placeholder={country.placeholder}
                      maxLength={inputMaxLength}
                      required
                      disabled={loading}
                      autoFocus
                      inputMode="numeric"
                    />
                  </div>

                  {/* Dropdown — position:absolute relative to wrapper above */}
                  {showDropdown && (
                    <div className="country-dropdown">
                      {COUNTRIES.map(c => (
                        <div
                          key={c.code}
                          className={`country-option${c.code === country.code ? " active" : ""}`}
                          onClick={() => handleCountrySelect(c)}
                        >
                          <img src={c.flagSrc} alt={c.code} className="country-flag-img" />
                          <span className="country-option-name">{c.name}</span>
                          <span className="country-option-dial">{c.dial}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress dots */}
                <div className="phone-dots">
                  {Array.from({ length: inputMaxLength }).map((_, i) => (
                    <div key={i} className={`phone-dot${i < digits.length ? " filled" : ""}`} />
                  ))}
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading || !isValidPhone()}
                >
                  {loading ? t.auth.sending : t.auth.sendOtp}
                </button>

                <p className="phone-terms">
                  By continuing, you agree to our{" "}
                  <span style={{ textDecoration: "underline", cursor: "pointer" }}>Terms</span>{" "}
                  &amp;{" "}
                  <span style={{ textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>
                </p>
              </form>

            ) : (
              /* ── OTP STEP ── */
              <form onSubmit={handleVerifyOtp} style={{ width: "100%" }}>
                <div className="otp-sent-message">
                  {t.auth.otpSentTo} <strong>{sentPhone || fullPhone()}</strong>
                </div>

                {/* 6-box OTP entry like Amazon */}
                <div className="otp-boxes">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      id={`otp-box-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={`otp-box${otp[i] ? " filled" : ""}`}
                      value={otp[i] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (!val) {
                          setOtp(prev => prev.slice(0, i) + prev.slice(i + 1));
                          return;
                        }
                        const next = (otp.slice(0, i) + val + otp.slice(i + 1)).slice(0, 6);
                        setOtp(next);
                        // Auto-focus next box
                        const nb = document.getElementById(`otp-box-${i + 1}`);
                        if (nb) nb.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[i]) {
                          const pb = document.getElementById(`otp-box-${i - 1}`);
                          if (pb) pb.focus();
                        }
                      }}
                      autoFocus={i === 0}
                      disabled={loading}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? t.auth.verifying : t.auth.verifySignIn}
                </button>

                <div className="otp-actions">
                  <button type="button" className="link-btn" onClick={handleBackToPhone}>
                    ← {t.auth.changeNumber}
                  </button>
                  <button type="button" className="link-btn" onClick={handleResendOtp} disabled={loading}>
                    {t.auth.resendOtp}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
