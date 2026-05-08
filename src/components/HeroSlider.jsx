// src/components/HeroSlider.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useT } from "../i18n/translations";

export default function HeroSlider({ language = "en" }) {
  const t = useT(language);
  const AUTO_SLIDE_MS = 3000;

  const heroUi = useMemo(
    () =>
      language === "ke"
        ? {
            eyebrow: "Bidhaa bora za kila siku, zimepangwa vizuri",
            trust: ["Ubora wa shambani", "Uwasilishaji wa haraka", "Bei nzuri kila siku"],
            secondaryCta: "Tazama bidhaa zinazouzwa zaidi",
            statLabels: ["Wateja", "Wakulima", "Miji"],
            floating: "Imekadiriwa sana wiki hii",
          }
        : {
            eyebrow: "Curated essentials for modern grocery shopping",
            trust: ["Farm-direct quality", "Fast delivery slots", "Sharp everyday pricing"],
            secondaryCta: "Explore bestsellers",
            statLabels: ["Customers", "Farmers", "Cities"],
            floating: "Top rated this week",
          },
    [language]
  );

  const heroStats = useMemo(
    () => [
      { value: "500k+", label: heroUi.statLabels[0] },
      { value: "2k+", label: heroUi.statLabels[1] },
      { value: "50+", label: heroUi.statLabels[2] },
    ],
    [heroUi]
  );

  const slides = useMemo(
    () => [
      {
        title: t.hero[0].title,
        desc: t.hero[0].desc,
        img: "assets/fruits.png",
        alt: "Fresh fruits pile",
      },
      {
        title: t.hero[1].title,
        desc: t.hero[1].desc,
        img: "assets/fresh&clean.png",
        alt: "Organic vegetables arrangement",
      },
      {
        title: t.hero[2].title,
        desc: t.hero[2].desc,
        img: "assets/tropical-fruits.png",
        alt: "Tropical fruits pile",
      },
      {
        title: t.hero[3].title,
        desc: t.hero[3].desc,
        img: "assets/dairy-needs.png",
        alt: "Eggs",
      },
    ],
    [t]
  );

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoSlideRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchDeltaRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setCurrent(0);
    setIsPaused(false);
  }, [language]);

  useEffect(() => {
    if (isPaused) return undefined;

    autoSlideRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, AUTO_SLIDE_MS);

    return () => clearInterval(autoSlideRef.current);
  }, [AUTO_SLIDE_MS, isPaused, slides.length]);

  const goToSlide = (index) => {
    setCurrent(index);
  };

  const goToPrevious = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchDeltaRef.current = { x: 0, y: 0 };
    setIsPaused(true);
  };

  const handleTouchMove = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchDeltaRef.current = {
      x: touch.clientX - touchStartRef.current.x,
      y: touch.clientY - touchStartRef.current.y,
    };
  };

  const handleTouchEnd = () => {
    const { x, y } = touchDeltaRef.current;
    const isHorizontalSwipe = Math.abs(x) > 36 && Math.abs(x) > Math.abs(y);

    if (isHorizontalSwipe) {
      if (x < 0) goToNext();
      else goToPrevious();
    }

    touchStartRef.current = { x: 0, y: 0 };
    touchDeltaRef.current = { x: 0, y: 0 };
    setIsPaused(false);
  };

  return (
    <div
      className="slider"
      style={{ "--active-slide": current }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="slider-track"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`slide${i === current ? " active" : ""}`}
            style={{ "--hero-art": `url(${slide.img})` }}
          >
            <div className="content">
              <div className="hero-top-row">
                <div className="hero-eyebrow">
                  <span className="hero-eyebrow-dot"></span>
                  {heroUi.eyebrow}
                </div>
                <div className="hero-copy-block">
                  <div className="hero-copy-surface">
                    <div className="hero-copy-main">
                      <h1>
                        {slide.title.split("\n").map((line, j) => (
                          <span key={j}>{line}</span>
                        ))}
                      </h1>
                      <p className="hero-description">{slide.desc}</p>
                    </div>
                    <div className="hero-copy-meta">
                      <div className="hero-trust-row">
                        {heroUi.trust.map((item) => (
                          <span key={item} className="hero-trust-pill">{item}</span>
                        ))}
                      </div>
                      <div className="hero-actions">
                        <form className="subscribe" onSubmit={(e) => e.preventDefault()}>
                          <input type="email" placeholder={t.home.emailPlaceholder} required />
                          <button type="submit">{t.home.subscribe}</button>
                        </form>
                        <a href="#pGrid" className="hero-secondary-btn">{heroUi.secondaryCta}</a>
                      </div>
                      <div className="hero-stats">
                        {heroStats.map((stat) => (
                          <div key={stat.label} className="hero-stat-card">
                            <strong>{stat.value}</strong>
                            <span>{stat.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="image-container">
                  <div className="hero-floating-chip">
                    <i className="fas fa-crown"></i>
                    {heroUi.floating}
                  </div>
                  <img
                    src={slide.img}
                    alt={slide.alt}
                    decoding="async"
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                  />
                  </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="slider-nav" aria-label="Slide navigation">
        <button
          type="button"
          className="slider-nav-btn"
          onClick={goToPrevious}
          aria-label="Previous slide"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <button
          type="button"
          className="slider-nav-btn"
          onClick={goToNext}
          aria-label="Next slide"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
      <div className="dots">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`dot${i === current ? " active" : ""}`}
            onClick={() => goToSlide(i)}
          ></div>
        ))}
      </div>
    </div>
  );
}
