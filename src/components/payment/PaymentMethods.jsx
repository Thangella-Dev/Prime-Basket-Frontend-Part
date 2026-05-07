import React from "react";
import CardInput from "./CardInput";
import { validateUPI, validateMPesa } from "../../utils/paymentUtils";

export default function PaymentMethods({
  config, method, setMethod,
  upiApp, setUpiApp,
  upiId, setUpiId,
  useUpiId, setUseUpiId,
  bank, setBank,
  wallet, setWallet,
  cardNum, setCardNum,
  cardName, setCardName,
  cardExp, setCardExp,
  cardCvv, setCardCvv,
  saveCard, setSaveCard,
  errors, setErrors,
  t, currSym
}) {
  return (
    <>
      {config.methods.map((m) => {
        const label = m.overrideLabel || (t.payment.methods[m.id] || m.id);
        const sub = m.overrideDesc || t.payment[m.id + "Desc"];

        return (
          <div key={m.id}>
            <div
              className={`pay-method-row${method === m.id ? " active" : ""}`}
              onClick={() => { setMethod(m.id); setErrors({}); }}
            >
              <input type="radio" className="pay-method-radio" checked={method === m.id} onChange={() => { setMethod(m.id); setErrors({}); }} />
              <div className="pay-method-info">
                <div className="pay-method-label">
                  <i className={`fas ${m.icon}`}></i> {label}
                </div>
                <div className="pay-method-sub">{sub}</div>
              </div>
              <div className="pay-method-status">{method === m.id ? "Selected" : "Available"}</div>
            </div>

            {method === m.id && (
              <div className="pay-panel">
                {m.id === "upi" && (
                  <>
                    {!useUpiId && (
                      <>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)", marginBottom: 12 }}>{t.payment.selectUpiApp}</p>
                        <div className="pay-upi-apps">
                          {config.upiApps.map((app) => (
                            <div
                              key={app.id}
                              className={`pay-upi-app${upiApp === app.id ? " active" : ""}`}
                              onClick={() => setUpiApp(app.id)}
                            >
                              <div className="pay-upi-app-icon" style={{ background: app.bg || "#fff" }}>
                                {app.logo ? <img src={app.logo} alt={app.label} /> : app.letter}
                              </div>
                              <span className="pay-upi-app-name">{app.label}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    <div className="pay-upi-divider">{t.payment.orPayUsingUpiId}</div>
                    <div className="pay-upi-id-row">
                      <div style={{ flex: 1 }}>
                        <input
                          className={`pay-input${errors.upiId ? " err" : ""}`}
                          placeholder="e.g. yourname@upi"
                          value={upiId}
                          onChange={(e) => { setUpiId(e.target.value); setUseUpiId(!!e.target.value); setErrors((prev) => ({ ...prev, upiId: null })); }}
                          onBlur={() => {
                            if (upiId && !validateUPI(upiId)) {
                              setErrors((prev) => ({ ...prev, upiId: "Enter a valid UPI ID" }));
                            }
                          }}
                        />
                        {errors.upiId && <div className="pay-input-err">{errors.upiId}</div>}
                      </div>
                      <button className="pay-verify-btn">{t.payment.verify}</button>
                    </div>
                  </>
                )}

                {m.id === "card" && (
                  <CardInput
                    cardNum={cardNum} setCardNum={setCardNum}
                    cardName={cardName} setCardName={setCardName}
                    cardExp={cardExp} setCardExp={setCardExp}
                    cardCvv={cardCvv} setCardCvv={setCardCvv}
                    saveCard={saveCard} setSaveCard={setSaveCard}
                    errors={errors} setErrors={setErrors}
                    allowedCards={config.cards}
                    t={t}
                  />
                )}

                {m.id === "netbanking" && (
                  <>
                    <label className="pay-label">{t.payment.selectBank}</label>
                    <select className="pay-bank-select" value={bank} onChange={(e) => setBank(e.target.value)}>
                      {config.banks.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <p className="pay-bank-note">
                      You will be redirected to your bank's secure portal to complete the payment.
                    </p>
                  </>
                )}

                {m.id === "wallet" && (
                  <div className="pay-wallets">
                    {config.wallets.map((w) => (
                      <div
                        key={w.id}
                        className={`pay-wallet-btn${wallet === w.id ? " active" : ""}`}
                        onClick={() => setWallet(w.id)}
                      >
                        <div className="pay-wallet-icon" style={{ background: w.bg || "#fff" }}>
                          {w.logo ? <img src={w.logo} alt={w.label} /> : w.letter}
                        </div>
                        <span className="pay-wallet-name">{w.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {m.id === "mpesa" && (
                  <div className="pay-mpesa-box">
                    <label className="pay-label">M-Pesa Phone Number</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        className={`pay-input${errors.mpesaPhone ? " err" : ""}`}
                        style={{ flex: 1 }}
                        placeholder="e.g. 07XXXXXXXX or 2547XXXXXXXX"
                        value={upiId}
                        onChange={(e) => { setUpiId(e.target.value); setErrors((prev) => ({ ...prev, mpesaPhone: null })); }}
                        onBlur={() => {
                           if (upiId && !validateMPesa(upiId)) {
                             setErrors((prev) => ({ ...prev, mpesaPhone: "Enter a valid M-Pesa phone number" }));
                           }
                        }}
                      />
                    </div>
                    {errors.mpesaPhone && <div className="pay-input-err">{errors.mpesaPhone}</div>}
                    <p className="pay-bank-note" style={{ marginTop: '10px' }}>
                      An STK push prompt will be sent to your phone. Enter your M-Pesa PIN to complete payment.
                    </p>
                  </div>
                )}

                {m.id === "cod" && (
                  <div className="pay-cod-box">
                    <div className="pay-cod-title">
                      <i className="fas fa-info-circle" style={{ color: "#1d5ba0", marginRight: 6 }}></i>
                      {t.payment.methods.cod || "Cash on Delivery"}
                    </div>
                    <p className="pay-cod-note">{t.payment.codNote}</p>
                    <span className="pay-cod-fee">{currSym}20 {t.payment.codFee}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
