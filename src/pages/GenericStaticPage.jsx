import { useT } from "../i18n/translations";

export default function GenericStaticPage({ language = "en", pageKey, onGoHome }) {
  const t = useT(language);

  // Map pageKey to content
  const contentMap = {
    delivery: {
      title: t.links.deliveryInfo,
      icon: "fa-truck-fast",
      text: "We provide fast and reliable delivery services across all major cities. Orders above $50 qualify for free delivery. Expect your groceries within 2-4 hours of ordering."
    },
    careers: {
      title: t.links.careers,
      icon: "fa-briefcase",
      text: "Join our growing team at Prime Basket! We are always looking for passionate individuals in logistics, customer support, and technology. Send your resume to careers@primebasket.com."
    },
    vendor: {
      title: t.links.becomeVendor,
      icon: "fa-store",
      text: "Grow your business with Prime Basket. We partner with local farmers and vendors to provide the best quality products to our customers. Apply today to start selling."
    },
    accessibility: {
      title: t.links.accessibility,
      icon: "fa-universal-access",
      text: "Prime Basket is committed to making its website accessible to everyone. We are constantly improving our user experience for people of all abilities."
    },
    shipping: {
      title: t.links.shippingDetails,
      icon: "fa-box-open",
      text: "All items are packed with care in eco-friendly packaging. We ensure temperature-controlled shipping for fresh and frozen products to maintain quality."
    },
    affiliate: {
      title: t.links.affiliateProgram,
      icon: "fa-users-cog",
      text: "Join our affiliate program and earn commissions by referring customers to Prime Basket. Perfect for influencers and content creators."
    },
    "farm-biz": {
      title: t.links.farmBusiness,
      icon: "fa-tractor",
      text: "We support local farmers by providing a direct marketplace. If you run a farm, partner with us to reach thousands of customers."
    },
    "farm-jobs": {
      title: t.links.farmCareers,
      icon: "fa-seedling",
      text: "Looking for work in agriculture? We have various positions available in our partner farms and logistics centers."
    },
    suppliers: {
      title: t.links.ourSuppliers,
      icon: "fa-truck-loading",
      text: "We work with top-tier suppliers to ensure our inventory is always stocked with the best brands and freshest produce."
    },
    promotions: {
      title: t.links.promotions,
      icon: "fa-tags",
      text: "Check out our latest promotions and discounts. Save big on your daily groceries with Prime Basket's exclusive deals."
    },
    compare: {
      title: t.links.compareProducts,
      icon: "fa-balance-scale",
      text: "Easily compare products by features, price, and reviews to make the best choice for your household needs."
    }
  };

  const content = contentMap[pageKey] || { title: "Page", text: "Coming soon...", icon: "fa-info-circle" };

  return (
    <div className="static-page generic-page" style={{ paddingBottom: "80px" }}>
      <div className="page-header" style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        padding: "80px 20px",
        textAlign: "center",
        marginBottom: "60px",
        borderBottom: "1px solid #cbd5e1"
      }}>
        <div style={{ 
          width: "80px", 
          height: "80px", 
          background: "#1d5ba0", 
          borderRadius: "50%", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          margin: "0 auto 20px",
          color: "white",
          fontSize: "2rem",
          boxShadow: "0 10px 20px rgba(29, 91, 160, 0.2)"
        }}>
          <i className={`fas ${content.icon}`}></i>
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1d5ba0", marginBottom: "15px" }}>{content.title}</h1>
      </div>

      <div className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px", textAlign: "center" }}>
        <p style={{ fontSize: "1.2rem", color: "#475569", lineHeight: 1.8, marginBottom: "40px" }}>
          {content.text}
        </p>
        <button
          onClick={onGoHome}
          style={{
            background: "linear-gradient(135deg, #1d5ba0, #0ea5e9)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "14px 32px",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 8px 25px rgba(29, 91, 160, 0.3)"
          }}
        >
          {t.dev.backHome}
        </button>
      </div>
    </div>
  );
}
