import { useT } from "../i18n/translations";

export default function AboutPage({ language = "en", onGoHome }) {
  const t = useT(language);

  const stats = [
    { icon: "fa-users", label: t.about.stats.customers, value: "500k+" },
    { icon: "fa-leaf", label: t.about.stats.products, value: "10k+" },
    { icon: "fa-handshake", label: t.about.stats.farmers, value: "2k+" },
    { icon: "fa-city", label: t.about.stats.cities, value: "50+" },
  ];

  return (
    <div className="static-page about-page">
      <div className="page-header" style={{
        background: "linear-gradient(rgba(29, 91, 160, 0.8), rgba(14, 165, 233, 0.8)), url('https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "80px 20px",
        textAlign: "center",
        color: "white",
        marginBottom: "60px"
      }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: "20px" }}>{t.about.title}</h1>
        <p style={{ fontSize: "1.2rem", maxWidth: "800px", margin: "0 auto", opacity: 0.9 }}>
          {t.home.stayHome}
        </p>
      </div>

      <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        {/* Story Section */}
        <section style={{ display: "flex", gap: "60px", alignItems: "center", marginBottom: "80px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 500px" }}>
            <h2 style={{ fontSize: "2.5rem", color: "#1d5ba0", marginBottom: "24px" }}>{t.about.story}</h2>
            <p style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "#4b5563", marginBottom: "24px" }}>
              {t.about.storyDesc}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
              <div>
                <h3 style={{ fontSize: "1.5rem", color: "#0ea5e9", marginBottom: "12px" }}>{t.about.mission}</h3>
                <p style={{ color: "#6b7280", lineHeight: 1.6 }}>{t.about.missionDesc}</p>
              </div>
              <div>
                <h3 style={{ fontSize: "1.5rem", color: "#0ea5e9", marginBottom: "12px" }}>{t.about.vision}</h3>
                <p style={{ color: "#6b7280", lineHeight: 1.6 }}>{t.about.visionDesc}</p>
              </div>
            </div>
          </div>
          <div style={{ flex: "1 1 500px" }}>
            <img 
              src="https://images.unsplash.com/photo-1534723452862-4c874018d66d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
              alt="Grocery Store" 
              style={{ width: "100%", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
            />
          </div>
        </section>

        {/* Stats Section */}
        <section style={{ 
          background: "#f0f9ff", 
          borderRadius: "30px", 
          padding: "60px", 
          display: "flex", 
          justifyContent: "space-around", 
          flexWrap: "wrap", 
          gap: "40px",
          marginBottom: "80px" 
        }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ 
                width: "80px", 
                height: "80px", 
                background: "white", 
                borderRadius: "20px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                margin: "0 auto 20px",
                boxShadow: "0 10px 20px rgba(29, 91, 160, 0.1)"
              }}>
                <i className={`fas ${stat.icon}`} style={{ fontSize: "2rem", color: "#1d5ba0" }}></i>
              </div>
              <h4 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1d5ba0", marginBottom: "5px" }}>{stat.value}</h4>
              <p style={{ color: "#6b7280", fontWeight: 600 }}>{stat.label}</p>
            </div>
          ))}
        </section>

        <div style={{ textAlign: "center", marginBottom: "80px" }}>
           <button
            onClick={onGoHome}
            style={{
              background: "linear-gradient(135deg, #1d5ba0, #0ea5e9)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "16px 40px",
              fontSize: "1.1rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "transform 0.2s",
              boxShadow: "0 10px 30px rgba(29, 91, 160, 0.3)"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-5px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            {t.dev.backHome}
          </button>
        </div>
      </div>
    </div>
  );
}
