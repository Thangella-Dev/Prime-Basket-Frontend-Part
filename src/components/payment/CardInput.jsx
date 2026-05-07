import React, { useState } from "react";
import { detectCardType, formatCardNumber, formatExpiry, validateLuhn, validateExpiry } from "../../utils/paymentUtils";

const ICONS = {
  visa: "https://img.icons8.com/color/1200/visa.jpg",
  mastercard: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg",
  rupay: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/RuPay.svg/1280px-RuPay.svg.png",
  amex: "https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg",
  unionpay: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSiQErNsSvCX45iDvkXlxUXxGNMNS8aH1tFhA&s",
  unknown: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" // fallback or generic
};

export default function CardInput({ 
  cardNum, setCardNum, 
  cardName, setCardName, 
  cardExp, setCardExp, 
  cardCvv, setCardCvv, 
  saveCard, setSaveCard, 
  errors, setErrors,
  allowedCards,
  t
}) {
  const [detectedType, setDetectedType] = useState("unknown");

  const handleCardNumChange = (e) => {
    const raw = e.target.value;
    const type = detectCardType(raw);
    setDetectedType(type);
    
    const formatted = formatCardNumber(raw, type);
    setCardNum(formatted);
    setErrors((prev) => ({ ...prev, cardNum: null }));
  };

  const handleExpChange = (e) => {
    setCardExp(formatExpiry(e.target.value));
    setErrors((prev) => ({ ...prev, cardExp: null }));
  };

  const isAmex = detectedType === "amex";
  const cvvLength = isAmex ? 4 : 3;

  return (
    <div className="pay-card-form">
      <div className="pay-card-icons">
        {allowedCards.map((c) => (
          <div key={c} className={`pay-card-icon ${detectedType === c ? 'highlight' : ''}`} style={{ opacity: detectedType === "unknown" || detectedType === c ? 1 : 0.3, transition: "0.2s" }}>
            <img src={ICONS[c]} alt={c} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fff", borderRadius: 4 }} />
          </div>
        ))}
      </div>
      <div>
        <label className="pay-label">{t.payment.cardNumber}</label>
        <div style={{ position: "relative" }}>
          <input
            className={`pay-input${errors.cardNum ? " err" : ""}`}
            style={{ width: "100%" }}
            placeholder="1234 5678 9012 3456"
            value={cardNum}
            maxLength={isAmex ? 17 : 19}
            onChange={handleCardNumChange}
            onBlur={() => {
              if (cardNum && !validateLuhn(cardNum)) {
                setErrors((prev) => ({ ...prev, cardNum: "Invalid card number" }));
              } else if (cardNum && detectedType !== "unknown" && !allowedCards.includes(detectedType)) {
                setErrors((prev) => ({ ...prev, cardNum: "Card type not supported in this region" }));
              }
            }}
          />
        </div>
        {errors.cardNum && <div className="pay-input-err">{errors.cardNum}</div>}
      </div>
      <div>
        <label className="pay-label">{t.payment.cardholderName}</label>
        <input
          className={`pay-input${errors.cardName ? " err" : ""}`}
          style={{ width: "100%" }}
          placeholder="Name as on card"
          value={cardName}
          onChange={(e) => { setCardName(e.target.value); setErrors((prev) => ({ ...prev, cardName: null })); }}
        />
        {errors.cardName && <div className="pay-input-err">{errors.cardName}</div>}
      </div>
      <div className="pay-card-row">
        <div>
          <label className="pay-label">{t.payment.expiryDate}</label>
          <input
            className={`pay-input${errors.cardExp ? " err" : ""}`}
            style={{ width: "100%" }}
            placeholder="MM/YY"
            value={cardExp}
            maxLength={5}
            onChange={handleExpChange}
            onBlur={() => {
              if (cardExp && !validateExpiry(cardExp)) {
                setErrors((prev) => ({ ...prev, cardExp: "Invalid expiry date" }));
              }
            }}
          />
          {errors.cardExp && <div className="pay-input-err">{errors.cardExp}</div>}
        </div>
        <div>
          <label className="pay-label">{t.payment.cvv}</label>
          <input
            className={`pay-input${errors.cardCvv ? " err" : ""}`}
            style={{ width: "100%" }}
            placeholder={isAmex ? "••••" : "•••"}
            type="password"
            maxLength={cvvLength}
            value={cardCvv}
            onChange={(e) => { setCardCvv(e.target.value.replace(/\D/g, "").slice(0, cvvLength)); setErrors((prev) => ({ ...prev, cardCvv: null })); }}
          />
          {errors.cardCvv && <div className="pay-input-err">{errors.cardCvv}</div>}
        </div>
      </div>
      <label className="pay-save-row">
        <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} />
        {t.payment.saveCard}
      </label>
    </div>
  );
}
