import { useEffect, useState } from "react";
import { database } from "../firebase";
import { ref, get } from "firebase/database";
import { useT } from "../i18n/translations";

const CATEGORY_LABELS = {
  rice: "Rice",
  oil: "Oil",
  "wheat-flour": "Wheat Flour",
  salt: "Salt",
  sugar: "Sugar",
  "chilli-powder": "Chilli Powder",
  "turmeric-powder": "Turmeric Powder",
  pulses: "Pulses",
  masala: "Masala",
  fruits: "Fruits",
  vegetables: "Vegetables",
  dairyProducts: "Dairy Products",
  feminineHygiene: "Feminine Hygiene",
  homeNeeds: "Home Needs",
  babyCare: "Baby Care",
  instantFood: "Instant Food",
  milkPowders: "Milk Powders",
  chipsAndNamkeens: "Chips & Namkeens",
  oralCare: "Oral Care",
  biscuitsAndCookies: "Biscuits & Cookies",
  coolDrinks: "Cool Drinks",
  bodyCare: "Body Care",
};

function Products({ category, onAddCart, language = "en", region = "in" }) {
  const t = useT(language);
  const currPrefix = region === "ke" ? "KES " : "₹";
  const formatPrice = (p) => {
    if (!p) return "";
    const numeric = String(p).replace(/₹/g, "").replace(/KES/gi, "").trim();
    return `${currPrefix}${numeric}`;
  };
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTranslatedName = (name) => {
    if (!name) return "";
    if (t.products?.[name]) return t.products[name];
    const entries = Object.entries(t.products || {}).sort((a, b) => b[0].length - a[0].length);
    for (const [key, val] of entries) {
      if (name.toLowerCase().includes(key.toLowerCase())) return val;
    }
    return name;
  };

  useEffect(() => {
    if (!category) return;

    setLoading(true);
    setProducts([]);

    const productsRef = ref(database, "categories/" + category);

    get(productsRef).then((snapshot) => {
      const data = snapshot.val();
      if (data) {
        let list = Object.values(data);
        // Filter for Kenya
        if (language === "ke") {
          list = list.filter(p => {
            const n = (p.name || "").toLowerCase();
            return t.products && Object.keys(t.products).some(k => n.includes(k.toLowerCase()));
          });
        }
        setProducts(list);
      } else {
        setProducts([]);
      }
      setLoading(false);
    });
  }, [category, language]);

  if (!category) return null;

  return (
    <section className="products-section">
      <div className="container">
        {/* Section header */}
        <div className="sec-header">
          <div>
            <div className="sec-title">
              {t.categories?.[category.replace("-", "")] || CATEGORY_LABELS[category] || category}
            </div>
          </div>
        </div>

        {/* Products grid — same markup as HomePage's pcard */}
        <div className="products-grid" id="pGrid">
          {loading ? (
            <p style={{ padding: "2rem", color: "#888" }}>Loading products…</p>
          ) : products.length === 0 ? (
            <p style={{ padding: "2rem", color: "#888" }}>No products found.</p>
          ) : (
            products.map((item, index) => {
              const translatedName = getTranslatedName(item.name);
              return (
                <div key={index} className="pcard">
                  {item.badge && (
                    <span className="pbadge bo">
                      {t.badges?.[item.badge.toLowerCase()] || item.badge}
                    </span>
                  )}
                  <button className="pwish">
                    <i className="far fa-heart"></i>
                  </button>
                  <div className="pimg">
                    <img
                      src={item.imageUrl}
                      alt={translatedName}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="pbrand">{item.brand}</div>
                  <div className="pname">{translatedName}</div>
                  {item.stars != null && (
                    <div className="pstars">
                      ⭐ {item.stars}{" "}
                      {item.reviews && <span>({item.reviews})</span>}
                    </div>
                  )}
                  <div className="pprice">
                    <span className="pnew">{formatPrice(item.price)}</span>
                    {item.oldPrice && (
                      <span className="pold">{formatPrice(item.oldPrice)}</span>
                    )}
                  </div>
                  <button
                    className="padd"
                    onClick={() => onAddCart && onAddCart(item)}
                  >
                    <i className="fas fa-shopping-cart"></i> {t.home.add || "Add"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default Products;