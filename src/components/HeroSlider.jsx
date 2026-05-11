// src/components/HeroSlider.jsx

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";

import { useT } from "../i18n/translations";

const AUTO_SLIDE_MS = 2000;

export default function HeroSlider({ language = "en" }) {
  const t = useT(language);

  const BLUE_PRIMARY = "#1d5ba0";
  const BLUE_SECONDARY = "#1d5ba0";

  const heroUi = useMemo(
    () =>
      language === "ke"
        ? {
            eyebrow: "Bidhaa bora za kila siku",
            secondaryCta: "Tazama bidhaa",
          }
        : {
            eyebrow: "Fresh • Fast • Everyday",
            secondaryCta: "Explore now",
          },
    [language]
  );

  const slides = useMemo(
    () => [
      {
        title: t.hero[0].title,
        desc: t.hero[0].desc,
        img: "assets/fruits.png",
        alt: "Fresh fruits",
        badge: "🍊 Fresh Picks",
        tag: "Fruits & More",
      },
      {
        title: t.hero[1].title,
        desc: t.hero[1].desc,
        img: "assets/fresh&clean.png",
        alt: "Organic vegetables",
        badge: "🥦 Organic",
        tag: "Farm Fresh",
      },
      {
        title: t.hero[2].title,
        desc: t.hero[2].desc,
        img: "assets/tropical-fruits.png",
        alt: "Tropical fruits",
        badge: "🥭 Tropical",
        tag: "Exotic Range",
      },
      {
        title: t.hero[3].title,
        desc: t.hero[3].desc,
        img: "assets/dairy-needs.png",
        alt: "Dairy products",
        badge: "🥛 Daily Fresh",
        tag: "Dairy & Eggs",
      },
    ],
    [t]
  );

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const timerRef = useRef(null);

  const touchStartRef = useRef({
    x: 0,
    y: 0,
  });

  const touchDeltaRef = useRef({
    x: 0,
    y: 0,
  });

  const len = slides.length;

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const go = useCallback(
    (dir = 1) => {
      if (isAnimating) return;

      setIsAnimating(true);

      setCurrent((prev) => (prev + dir + len) % len);

      setTimeout(() => {
        setIsAnimating(false);
      }, 420);
    },
    [isAnimating, len]
  );

  const goTo = useCallback(
    (idx) => {
      if (idx === current || isAnimating) return;

      setIsAnimating(true);

      setCurrent(idx);

      setTimeout(() => {
        setIsAnimating(false);
      }, 420);
    },
    [current, isAnimating]
  );

  useEffect(() => {
    clearTimer();

    if (!isPaused) {
      timerRef.current = setInterval(() => {
        go(1);
      }, AUTO_SLIDE_MS);
    }

    return () => clearTimer();
  }, [current, isPaused, go]);

  // ======================
  // TOUCH SWIPE
  // ======================

  const handleTouchStart = (e) => {
    const touch = e.touches?.[0];

    if (!touch) return;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    touchDeltaRef.current = {
      x: 0,
      y: 0,
    };

    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches?.[0];

    if (!touch) return;

    touchDeltaRef.current = {
      x: touch.clientX - touchStartRef.current.x,
      y: touch.clientY - touchStartRef.current.y,
    };
  };

  const handleTouchEnd = () => {
    const { x, y } = touchDeltaRef.current;

    const isHorizontalSwipe =
      Math.abs(x) > 18 && Math.abs(x) > Math.abs(y);

    if (isHorizontalSwipe) {
      if (x < 0) {
        go(1);
      } else {
        go(-1);
      }
    }

    touchStartRef.current = {
      x: 0,
      y: 0,
    };

    touchDeltaRef.current = {
      x: 0,
      y: 0,
    };

    setTimeout(() => {
      setIsPaused(false);
    }, 80);
  };

  // ======================
  // CARD POSITIONS
  // ======================

  const getPos = (idx) => {
    const diff = (idx - current + len) % len;

    if (diff === 0) return "center";
    if (diff === 1) return "right";
    if (diff === len - 1) return "left";
    if (diff === 2) return "far-right";

    return "hidden";
  };

  const slide = slides[current];

  return (
    <>
      <style>{`

      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

      *{
        box-sizing:border-box;
      }

      .hs-root{
        position:relative;
        overflow:hidden;

        background:
          radial-gradient(circle at top left,#ffffff 0%,#dbe9ff 30%,#bdd4ff 100%);

        border-radius:24px;

        font-family:'Inter',sans-serif;

        min-height:460px;

        touch-action:pan-y;
      }

      /* ========================= */

      .hs-glow{
        position:absolute;
        border-radius:50%;
        filter:blur(70px);
        pointer-events:none;
      }

      .hs-glow-1{
        width:300px;
        height:300px;
        background:#155EEF18;
        top:-100px;
        left:-100px;
      }

      .hs-glow-2{
        width:240px;
        height:240px;
        background:#155EEF15;
        right:-70px;
        bottom:-70px;
      }

      /* ========================= */

      .hs-inner{
        position:relative;
        z-index:2;

        max-width:1180px;

        margin:auto;

        min-height:460px;

        display:grid;

        grid-template-columns:1fr 1fr;

        align-items:center;

        gap:10px;

        padding:26px 34px 62px;
      }

      /* ========================= */

      .hs-content{
        display:flex;
        flex-direction:column;

        gap:14px;

        max-width:430px;
      }

      .hs-eyebrow{
        width:fit-content;

        display:flex;
        align-items:center;
        gap:8px;

        padding:7px 13px;

        border-radius:999px;

        background:rgba(255,255,255,.72);

        backdrop-filter:blur(10px);

        border:1px solid rgba(106, 148, 234, 0.14);

        color:${BLUE_PRIMARY};

        font-size:12px;
        font-weight:600;
      }

      .hs-eyebrow-dot{
        width:7px;
        height:7px;

        border-radius:50%;

        background:${BLUE_PRIMARY};
      }

      .hs-badge{
        color:${BLUE_PRIMARY};

        font-size:15px;
        font-weight:700;
      }

      .hs-title{
        margin:0;

        font-size:clamp(30px,4vw,54px);

        line-height:1.02;

        letter-spacing:-0.05em;

        font-weight:800;

        color:#0D2B7E;
      }

      .hs-title span{
        display:block;
      }

      .hs-desc{
        margin:0;

        font-size:15px;

        line-height:1.65;

        color:#42557E;

        max-width:360px;
      }

      /* ========================= */

      .hs-cta{
        margin-top:4px;

        display:inline-flex;
        align-items:center;
        gap:10px;

        width:fit-content;

        padding:13px 24px;

        border-radius:999px;

        background:
          linear-gradient(
            135deg,
            ${BLUE_PRIMARY},
            ${BLUE_SECONDARY}
          );

        color:white;

        text-decoration:none;

        font-size:14px;
        font-weight:700;

        box-shadow:
          0 14px 34px rgba(110, 153, 238, 0.22);

        transition:.3s ease;
      }

      .hs-cta:hover{
        transform:translateY(-2px);
      }

      /* ========================= */

      .hs-carousel{
        position:relative;

        height:320px;

        display:flex;
        align-items:center;
        justify-content:center;

        overflow:visible;
      }

      .hs-card{
        position:absolute;

        width:175px;
        height:275px;

        border-radius:24px;

        overflow:hidden;

        cursor:pointer;

        background:
          linear-gradient(
            180deg,
            rgba(255,255,255,.88),
            rgba(217,230,255,.95)
          );

        border:1px solid rgba(255,255,255,.8);

        backdrop-filter:blur(14px);

        box-shadow:
          0 18px 40px rgba(69, 153, 249, 0.1);

        transition:
          transform .65s cubic-bezier(.22,1,.36,1),
          opacity .45s ease;

        will-change:transform;

        backface-visibility:hidden;
      }

      .hs-card-img{
        position:absolute;

        inset:0;

        width:100%;
        height:100%;

        object-fit:contain;

        padding:18px;

        filter:
          drop-shadow(0 12px 18px rgba(0,0,0,.12));

        transition:transform .5s ease;
      }

      .hs-card-tag{
        position:absolute;

        left:50%;
        bottom:14px;

        transform:translateX(-50%);

        background:white;

        padding:7px 16px;

        border-radius:999px;

        font-size:11px;

        font-weight:700;

        color:#1749B3;

        white-space:nowrap;

        box-shadow:
          0 8px 18px rgba(0,0,0,.06);
      }

      /* ========================= */

      .hs-card[data-pos="center"]{
        transform:
          translateX(0)
          scale(1);

        opacity:1;

        z-index:10;
      }

      .hs-card[data-pos="center"] .hs-card-img{
        transform:
          scale(1.05)
          translateY(-2px);
      }

      .hs-card[data-pos="right"]{
        transform:
          translateX(125px)
          scale(.84)
          rotate(6deg);

        opacity:.82;

        z-index:6;
      }

      .hs-card[data-pos="left"]{
        transform:
          translateX(-125px)
          scale(.84)
          rotate(-6deg);

        opacity:.82;

        z-index:6;
      }

      .hs-card[data-pos="far-right"]{
        transform:
          translateX(220px)
          scale(.70)
          rotate(10deg);

        opacity:.34;

        z-index:2;
      }

      .hs-card[data-pos="hidden"]{
        transform:
          translateX(300px)
          scale(.5);

        opacity:0;

        pointer-events:none;
      }

      /* ========================= */

      .hs-dots{
        position:absolute;

        left:50%;
        bottom:18px;

        transform:translateX(-50%);

        display:flex;

        gap:9px;

        z-index:30;
      }

      .hs-dot{
        width:7px;
        height:7px;

        border-radius:999px;

        background:#AAC4FF;

        cursor:pointer;

        transition:.3s ease;
      }

      .hs-dot.active{
        width:26px;

        background:${BLUE_PRIMARY};
      }

      /* ========================= */

      .hs-nav{
        position:absolute;

        right:20px;
        bottom:12px;

        display:flex;

        gap:10px;

        z-index:30;
      }

      .hs-nav-btn{
        width:42px;
        height:42px;

        border:none;

        border-radius:50%;

        cursor:pointer;

        background:rgba(255,255,255,.9);

        backdrop-filter:blur(12px);

        color:${BLUE_PRIMARY};

        font-size:14px;

        transition:.3s ease;

        box-shadow:
          0 10px 24px rgba(0,0,0,.08);
      }

      .hs-nav-btn:hover{
        background:${BLUE_PRIMARY};

        color:white;

        transform:scale(1.06);
      }

      /* =========================
         MOBILE
      ========================= */

      @media(max-width:768px){

        .hs-root{
          min-height:245px;

          border-radius:20px;
        }

        .hs-inner{
          min-height:245px;

          grid-template-columns:1.1fr .9fr;

          gap:2px;

          padding:14px 12px 42px;
        }

        .hs-content{
          gap:8px;

          max-width:100%;
        }

        .hs-eyebrow{
          font-size:9px;

          padding:5px 9px;
        }

        .hs-badge{
          font-size:11px;
        }

        .hs-title{
          font-size:21px;

          line-height:1.05;
        }

        .hs-desc{
          font-size:10px;

          line-height:1.45;

          max-width:150px;
        }

        .hs-cta{
          padding:8px 13px;

          font-size:11px;

          gap:6px;
        }

        .hs-carousel{
          height:185px;
        }

        .hs-card{
          width:98px;
          height:152px;

          border-radius:18px;
        }

        .hs-card-img{
          padding:12px;
        }

        .hs-card-tag{
          font-size:8px;

          padding:5px 10px;

          bottom:10px;
        }

        .hs-card[data-pos="center"]{
          transform:
            translateX(0)
            scale(1);
        }

        .hs-card[data-pos="right"]{
          transform:
            translateX(58px)
            scale(.80)
            rotate(5deg);
        }

        .hs-card[data-pos="left"]{
          transform:
            translateX(-58px)
            scale(.80)
            rotate(-5deg);
        }

        .hs-card[data-pos="far-right"]{
          transform:
            translateX(100px)
            scale(.62)
            rotate(9deg);

          opacity:.24;
        }

        .hs-nav{
          right:10px;

          bottom:6px;

          gap:6px;
        }

        .hs-nav-btn{
          width:30px;
          height:30px;

          font-size:10px;
        }

        .hs-dots{
          bottom:8px;
        }

        .hs-dot{
          width:5px;
          height:5px;
        }

        .hs-dot.active{
          width:18px;
        }
      }

      `}</style>

      <div
        className="hs-root"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div className="hs-glow hs-glow-1"></div>
        <div className="hs-glow hs-glow-2"></div>

        <div className="hs-inner">

          {/* LEFT CONTENT */}

          <div className="hs-content">

            <div className="hs-eyebrow">
              <span className="hs-eyebrow-dot"></span>
              {heroUi.eyebrow}
            </div>

            <div className="hs-badge">
              {slide.badge}
            </div>

            <h1 className="hs-title">
              {slide.title.split("\n").map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </h1>

            <p className="hs-desc">
              {slide.desc}
            </p>

            <a href="#pGrid" className="hs-cta">
              {heroUi.secondaryCta}
              <i className="fas fa-arrow-right"></i>
            </a>

          </div>

          {/* RIGHT CAROUSEL */}

          <div className="hs-carousel">

            {slides.map((s, i) => {
              const pos = getPos(i);

              return (
                <div
                  key={i}
                  className="hs-card"
                  data-pos={pos}
                  onClick={() => {
                    if (pos !== "center") {
                      goTo(i);
                    }
                  }}
                >
                  <img
                    src={s.img}
                    alt={s.alt}
                    className="hs-card-img"
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                    decoding="async"
                  />

                  <div className="hs-card-tag">
                    {s.tag}
                  </div>

                </div>
              );
            })}

          </div>

        </div>

        {/* DOTS */}

        <div className="hs-dots">

          {slides.map((_, i) => (
            <div
              key={i}
              className={`hs-dot ${i === current ? "active" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}

        </div>

        {/* NAVIGATION */}

        <div className="hs-nav">

          <button
            type="button"
            className="hs-nav-btn"
            onClick={() => go(-1)}
          >
            <i className="fas fa-arrow-left"></i>
          </button>

          <button
            type="button"
            className="hs-nav-btn"
            onClick={() => go(1)}
          >
            <i className="fas fa-arrow-right"></i>
          </button>

        </div>

      </div>
    </>
  );
}