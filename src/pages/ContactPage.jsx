import { useState } from "react";
import { useT } from "../i18n/translations";

export default function ContactPage({ language = "en", onGoHome }) {
  const t = useT(language);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle, sending, success

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("sending");
    setTimeout(() => {
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setStatus("idle"), 5000);
    }, 1500);
  };

  return (
    <div className="static-page contact-page">
      <div className="page-header" style={{
        background: "#1d5ba0",
        padding: "60px 20px",
        textAlign: "center",
        color: "white",
        marginBottom: "60px"
      }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "10px" }}>{t.contact.title}</h1>
        <p style={{ opacity: 0.8 }}>{t.contact.desc}</p>
      </div>

      <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", display: "flex", gap: "60px", flexWrap: "wrap", marginBottom: "80px" }}>
        {/* Contact Info */}
        <div style={{ flex: "1 1 400px" }}>
          <h2 style={{ fontSize: "2rem", color: "#1d5ba0", marginBottom: "30px" }}>{t.contact.getInTouch}</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
              <div style={{ width: "50px", height: "50px", background: "#f0f9ff", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="fas fa-location-dot" style={{ color: "#1d5ba0" }}></i>
              </div>
              <div>
                <h4 style={{ margin: "0 0 5px", color: "#374151" }}>{t.footer.address}</h4>
                <p style={{ color: "#6b7280", margin: 0 }}>KPHB, JNTU Road, Hyderabad - 500085</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
              <div style={{ width: "50px", height: "50px", background: "#f0f9ff", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="fas fa-phone" style={{ color: "#1d5ba0" }}></i>
              </div>
              <div>
                <h4 style={{ margin: "0 0 5px", color: "#374151" }}>{t.footer.callUs}</h4>
                <p style={{ color: "#6b7280", margin: 0 }}>+91 80085 50199</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
              <div style={{ width: "50px", height: "50px", background: "#f0f9ff", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="fas fa-envelope" style={{ color: "#1d5ba0" }}></i>
              </div>
              <div>
                <h4 style={{ margin: "0 0 5px", color: "#374151" }}>{t.footer.email}</h4>
                <p style={{ color: "#6b7280", margin: 0 }}>support@primebasket.com</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
              <div style={{ width: "50px", height: "50px", background: "#f0f9ff", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="fas fa-clock" style={{ color: "#1d5ba0" }}></i>
              </div>
              <div>
                <h4 style={{ margin: "0 0 5px", color: "#374151" }}>{t.footer.hours}</h4>
                <p style={{ color: "#6b7280", margin: 0 }}>10:00 – 18:00, Mon – Sat</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "40px", height: "300px", background: "#e5e7eb", borderRadius: "20px", overflow: "hidden" }}>
             <iframe
                title="Google Map"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.123456789!2d78.38!3d17.48!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDI4JzQ4LjAiTiA3OMKwMjInNDguMCJF!5e0!3m2!1sen!2sin!4v1234567890"
                allowFullScreen
              ></iframe>
          </div>
        </div>

        {/* Contact Form */}
        <div style={{ flex: "1 1 500px", background: "white", padding: "40px", borderRadius: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.05)" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#4b5563" }}>{t.contact.form.name}</label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e5e7eb", outline: "none" }}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#4b5563" }}>{t.contact.form.email}</label>
                <input 
                  type="email" 
                  required
                  placeholder="john@example.com"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e5e7eb", outline: "none" }}
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#4b5563" }}>{t.contact.form.subject}</label>
              <input 
                type="text" 
                required
                placeholder="How can we help?"
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e5e7eb", outline: "none" }}
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
              />
            </div>

            <div style={{ marginBottom: "30px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#4b5563" }}>{t.contact.form.message}</label>
              <textarea 
                required
                rows="5"
                placeholder="Your message here..."
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e5e7eb", outline: "none", resize: "none" }}
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
              ></textarea>
            </div>

            <button 
              type="submit"
              disabled={status === "sending"}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #1d5ba0, #0ea5e9)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "16px",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "opacity 0.2s"
              }}
            >
              {status === "sending" ? t.contact.form.sending : t.contact.form.send}
            </button>

            {status === "success" && (
              <p style={{ marginTop: "20px", color: "#059669", fontWeight: 600, textAlign: "center" }}>
                <i className="fas fa-check-circle"></i> {t.contact.form.success}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
