import { useT } from "../i18n/translations";

export default function TermsPage({ language = "en" }) {
  const t = useT(language);

  return (
    <div className="static-page terms-page">
      <div className="page-header" style={{
        background: "#f8fafc",
        padding: "60px 20px",
        textAlign: "center",
        borderBottom: "1px solid #e2e8f0",
        marginBottom: "40px"
      }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1d5ba0", marginBottom: "10px" }}>{t.terms.title}</h1>
        <p style={{ color: "#64748b" }}>{t.terms.lastUpdated}</p>
      </div>

      <div className="container" style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px 80px" }}>
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#334155", marginBottom: "16px" }}>1. {t.terms.usage}</h2>
          <p style={{ color: "#475569", lineHeight: 1.8 }}>{t.terms.usageDesc}</p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#334155", marginBottom: "16px" }}>2. {t.terms.orders}</h2>
          <p style={{ color: "#475569", lineHeight: 1.8 }}>{t.terms.ordersDesc}</p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#334155", marginBottom: "16px" }}>3. {t.terms.cancellation}</h2>
          <p style={{ color: "#475569", lineHeight: 1.8 }}>{t.terms.cancellationDesc}</p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#334155", marginBottom: "16px" }}>4. Account Security</h2>
          <p style={{ color: "#475569", lineHeight: 1.8 }}>
            You are responsible for maintaining the confidentiality of your account information. Any activity under your account is your responsibility.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#334155", marginBottom: "16px" }}>5. Liability</h2>
          <p style={{ color: "#475569", lineHeight: 1.8 }}>
            Prime Basket is not liable for any indirect or consequential damages arising from the use of our services.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#334155", marginBottom: "16px" }}>6. Governing Law</h2>
          <p style={{ color: "#475569", lineHeight: 1.8 }}>
            These terms are governed by the laws of the jurisdiction in which we operate.
          </p>
        </section>
      </div>
    </div>
  );
}
