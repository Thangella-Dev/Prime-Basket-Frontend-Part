import { useState } from "react";
import { useT } from "../i18n/translations";

export default function FAQPage({ language = "en" }) {
  const t = useT(language);
  const [activeIndex, setActiveIndex] = useState(null);

  const toggle = (i) => setActiveIndex(activeIndex === i ? null : i);

  return (
    <div className="static-page faq-page">
      <div className="page-header" style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        padding: "80px 20px",
        textAlign: "center",
        marginBottom: "60px"
      }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, color: "#1d5ba0", marginBottom: "15px" }}>{t.faq.title}</h1>
        <p style={{ color: "#64748b", fontSize: "1.1rem" }}>Everything you need to know about Prime Basket.</p>
      </div>

      <div className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {t.faq.questions.map((item, i) => (
            <div 
              key={i} 
              style={{ 
                background: "white", 
                borderRadius: "16px", 
                border: "1px solid #e2e8f0", 
                overflow: "hidden",
                boxShadow: activeIndex === i ? "0 10px 25px rgba(0,0,0,0.05)" : "none",
                transition: "all 0.3s"
              }}
            >
              <div 
                onClick={() => toggle(i)}
                style={{ 
                  padding: "24px", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  cursor: "pointer",
                  background: activeIndex === i ? "#f8fafc" : "white"
                }}
              >
                <h3 style={{ fontSize: "1.1rem", color: "#334155", margin: 0, fontWeight: 700 }}>{item.q}</h3>
                <i className={`fas fa-chevron-${activeIndex === i ? "up" : "down"}`} style={{ color: "#1d5ba0" }}></i>
              </div>
              
              <div style={{ 
                maxHeight: activeIndex === i ? "500px" : "0", 
                overflow: "hidden", 
                transition: "max-height 0.3s ease-out" 
              }}>
                <div style={{ padding: "0 24px 24px", color: "#64748b", lineHeight: 1.7 }}>
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          marginTop: "60px", 
          padding: "40px", 
          background: "#1d5ba0", 
          borderRadius: "24px", 
          textAlign: "center", 
          color: "white" 
        }}>
          <h2 style={{ marginBottom: "10px" }}>Still have questions?</h2>
          <p style={{ opacity: 0.8, marginBottom: "25px" }}>We're here to help you 24/7. Reach out to our support team.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
             <button style={{ 
               padding: "12px 30px", 
               borderRadius: "10px", 
               border: "none", 
               background: "white", 
               color: "#1d5ba0", 
               fontWeight: 700,
               cursor: "pointer"
             }}>
               Contact Support
             </button>
             <button style={{ 
               padding: "12px 30px", 
               borderRadius: "10px", 
               border: "1px solid rgba(255,255,255,0.3)", 
               background: "transparent", 
               color: "white", 
               fontWeight: 700,
               cursor: "pointer"
             }}>
               Help Center
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
