import { useEffect, useState } from "react";
import { database } from "../firebase";
import { ref, get } from "firebase/database";
import { useT } from "../i18n/translations";
import ProductCard from "./ProductCard";

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

function Products({ category, onAddCart, onDecreaseCart, cart = [], wishlist = [], toggleWishlist, language = "en", region = "in" }) {
  const t = useT(language);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, [category, language, t.products]);

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
            products.map((item) => (
              <ProductCard
                key={item._uid || item.name || item.imageUrl}
                p={item}
                onAddCart={onAddCart}
                onDecreaseCart={onDecreaseCart}
                cart={cart}
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
                t={t}
                region={region}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default Products;
