import { useT } from "../i18n/translations";

export default function PrivacyPolicyPage({ language = "en" }) {
  const t = useT(language);

  return (
    <div className="static-page privacy-page">
      <div className="page-header" style={{
        background: "#f8fafc",
        padding: "60px 20px",
        textAlign: "center",
        borderBottom: "1px solid #e2e8f0",
        marginBottom: "40px"
      }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1d5ba0", marginBottom: "10px" }}>{t.privacy.title}</h1>
        <p style={{ color: "#64748b" }}>{t.privacy.lastUpdated}</p>
      </div>

      <div className="container" style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px 80px" }}>
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#334155", marginBottom: "16px" }}>1. {t.privacy.introduction}</h2>
          <p style={{ color: "#475569", lineHeight: 1.8 }}>{t.privacy.introDesc}</p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#334155", marginBottom: "16px" }}>2. {t.privacy.dataCollection}</h2>
          <p style={{ color: "#475569", lineHeight: 1.8 }}>{t.privacy.dataDesc}</p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#334155", marginBottom: "16px" }}>3. {t.privacy.usage}</h2>
          <p style={{ color: "#475569", lineHeight: 1.8 }}>{t.privacy.usageDesc}</p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#334155", marginBottom: "16px" }}>4. {t.privacy.security}</h2>
          <p style={{ color: "#475569", lineHeight: 1.8 }}>{t.privacy.securityDesc}</p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#334155", marginBottom: "16px" }}>5. Cookies</h2>
          <p style={{ color: "#475569", lineHeight: 1.8 }}>
            We use cookies to improve your browsing experience and analyze our traffic. By continuing to use our site, you consent to our use of cookies.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#334155", marginBottom: "16px" }}>6. Contact</h2>
          <p style={{ color: "#475569", lineHeight: 1.8 }}>
            If you have any questions about this Privacy Policy, please contact us at privacy@primebasket.com.
          </p>
        </section>
      </div>
    </div>
  );
}
