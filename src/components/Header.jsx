import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import SearchBox from "./SearchBox";
import { useT } from "../i18n/translations";
import { detectCurrentLocation, loadSavedLocation } from "../utils/locationService";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";
import { MoonStar, SunMedium } from "lucide-react";

export default function Header({
  onAccountClick, isLoggedIn, user,
  onCategorySelect, onLogoClick, onLogoDoubleClick,
  onBack, currentPage = "home",
  cartCount = 0, wishlistCount = 0,
  onCartClick, onWishlistClick,
  onOpenProduct,
  language = "en",
  onLanguageChange,
  region = "in",
  onRegionChange,
  theme = "light",
  onThemeToggle,
  notifications = [],
  markAllRead,
  clearNotifications,
}) {
  const t = useT(language);
  const isDark = theme === "dark";
  const ThemeIcon = isDark ? SunMedium : MoonStar;
  const isHomePage = currentPage === "home";
  const isCategoryPage = currentPage === "category";
  const locationUi = language === "ke"
    ? {
        detect: "Tambua eneo",
        detecting: "Inatafuta...",
        unavailable: "Eneo",
        autoError: "Ruhusu ruhusa ya eneo",
      }
    : {
        detect: "Detect location",
        detecting: "Detecting...",
        unavailable: "Location",
        autoError: "Enable location access",
      };
  const themeUi = language === "ke"
    ? {
        label: isDark ? "Mwanga" : "Giza",
        action: isDark ? "Badili kwenda mwanga" : "Badili kwenda giza",
      }
    : {
        label: isDark ? "Light mode" : "Dark mode",
        action: isDark ? "Switch to light mode" : "Switch to dark mode",
      };

  const categories = [
    { value: "rice", icon: "fa-seedling", label: t.categories.rice },
    { value: "oil", icon: "fa-tint", label: t.categories.oil },
    { value: "wheat-flour", icon: "fa-bread-slice", label: t.categories.wheatflour },
    { value: "salt", icon: "fa-mortar-pestle", label: t.categories.salt },
    { value: "sugar", icon: "fa-cube", label: t.categories.sugar },
    { value: "chilli-powder", icon: "fa-pepper-hot", label: t.categories.chillipowder },
    { value: "turmeric-powder", icon: "fa-leaf", label: t.categories.turmericpowder },
    { value: "pulses", icon: "fa-circle", label: t.categories.pulses },
    { value: "masala", icon: "fa-mortar-pestle", label: t.categories.masala },
    { value: "fruits", icon: "fa-apple-alt", label: t.categories.freshFruits },
    { value: "vegetables", icon: "fa-carrot", label: t.categories.vegetables },
    { value: "dairyProducts", icon: "fa-cheese", label: t.categories.dairyProducts },
    { value: "feminineHygiene", icon: "fa-female", label: t.categories.feminineHygiene },
    { value: "homeNeeds", icon: "fa-broom", label: t.categories.homeNeeds },
    { value: "babyCare", icon: "fa-baby", label: t.categories.babyCare },
    { value: "instantFood", icon: "fa-bolt", label: t.categories.instantFood },
    { value: "milkPowders", icon: "fa-glass-whiskey", label: t.categories.milkPowders },
    { value: "chipsAndNamkeens", icon: "fa-cookie-bite", label: t.categories.chipsNamkeens },
    { value: "oralCare", icon: "fa-tooth", label: t.categories.oralCare },
    { value: "biscuitsAndCookies", icon: "fa-cookie", label: t.categories.biscuitsCookies },
    { value: "coolDrinks", icon: "fa-glass-cheers", label: t.categories.coolDrinks },
    { value: "bodyCare", icon: "fa-spa", label: t.categories.bodyCare },
    { value: "meat", icon: "fa-drumstick-bite", label: t.categories.meat },
  ];
  const categoryByValue = Object.fromEntries(categories.map((category) => [category.value, category]));
  const mobileCategoryGroups = [
    {
      key: "fresh",
      title: language === "ke" ? "Bidhaa safi" : "Fresh market",
      subtitle: language === "ke" ? "Matunda, mboga na maziwa" : "Fruits, vegetables and dairy",
      icon: "fa-leaf",
      values: ["fruits", "vegetables", "dairyProducts", "meat"],
    },
    {
      key: "essentials",
      title: language === "ke" ? "Mahitaji ya kila siku" : "Daily essentials",
      subtitle: language === "ke" ? "Mchele, mafuta na viungo" : "Rice, oil, flour and spices",
      icon: "fa-basket-shopping",
      values: ["rice", "oil", "wheat-flour", "salt", "sugar", "chilli-powder", "turmeric-powder", "pulses", "masala"],
    },
    {
      key: "snacks",
      title: language === "ke" ? "Vitafunio na vinywaji" : "Snacks and drinks",
      subtitle: language === "ke" ? "Chakula cha haraka na vinywaji" : "Quick bites, biscuits and beverages",
      icon: "fa-cookie-bite",
      values: ["instantFood", "chipsAndNamkeens", "biscuitsAndCookies", "coolDrinks", "milkPowders"],
    },
    {
      key: "care",
      title: language === "ke" ? "Huduma ya nyumba" : "Home and care",
      subtitle: language === "ke" ? "Nyumbani, mwili na familia" : "Home, body, baby and family care",
      icon: "fa-home",
      values: ["homeNeeds", "bodyCare", "oralCare", "feminineHygiene", "babyCare"],
    },
  ];
  const desktopBrowseKicker = language === "ke" ? "Soko la haraka" : "Shop faster";
  const desktopBrowseTitle = language === "ke" ? "Browse by aisle" : "Browse by aisle";
  const desktopBrowseSubtitle = language === "ke"
    ? "Chagua kundi la bidhaa na uende moja kwa moja kwenye sehemu yake."
    : "Jump into curated grocery aisles without losing your current shopping flow.";
  const desktopBrowseMeta = language === "ke" ? "Region-safe catalog" : "Region-safe catalog";
  const headerPromiseItems = language === "ke"
    ? [
        { icon: "fa-bolt", label: "Haraka" },
        { icon: "fa-shield-alt", label: "Imehakikiwa" },
      ]
    : [
        { icon: "fa-bolt", label: "Fast delivery" },
        { icon: "fa-shield-alt", label: "Fresh guarantee" },
      ];
  const headerExperienceItems = language === "ke"
    ? [
        { icon: "fa-crown", label: "Prime Basket premium" },
        { icon: "fa-truck", label: "Uwasilishaji wa haraka" },
        { icon: "fa-leaf", label: "Bidhaa mpya kila siku" },
      ]
    : [
        { icon: "fa-crown", label: "Prime Basket premium" },
        { icon: "fa-truck", label: "Quick doorstep delivery" },
        { icon: "fa-leaf", label: "Fresh regional catalog" },
      ];

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [brandTap, setBrandTap] = useState(false);
  const [locationState, setLocationState] = useState(() => loadSavedLocation());
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationNotice, setLocationNotice] = useState("");
  const [mobileLanguageOpen, setMobileLanguageOpen] = useState(false);
  const [desktopLocaleOpen, setDesktopLocaleOpen] = useState(false);
  const [expandedDrawerGroup, setExpandedDrawerGroup] = useState("fresh");
  const browseRef = useRef(null);
  const mobileBrowseRef = useRef(null);
  const notesRef = useRef(null);
  const mobileNotesRef = useRef(null);
  const mobileLanguageRef = useRef(null);
  const desktopLocaleRef = useRef(null);
  const brandTimerRef = useRef(null);
  const lastBrandClickRef = useRef(0);
  const locationNoticeTimerRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const scrollAnchorRef = useRef(0);
  const scrollFrameRef = useRef(0);
  const chromeHiddenRef = useRef(false);

  useEffect(() => {
    const setChromeVisibility = (nextHidden) => {
      chromeHiddenRef.current = nextHidden;
      setChromeHidden((prev) => (prev === nextHidden ? prev : nextHidden));
    };

    const handleScroll = () => {
      if (scrollFrameRef.current) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        const nextY = window.scrollY || 0;
        const isMobileViewport = window.innerWidth <= 768;

        setScrolled(nextY > 10);

        if (isMobileViewport && isHomePage) {
          // Keep the home header/search chrome stable on mobile to avoid the
          // first-scroll fade/slide glitch caused by collapsing the top bar.
          setChromeVisibility(false);
          scrollAnchorRef.current = nextY;
        } else if (!isMobileViewport || !isHomePage) {
          setChromeVisibility(false);
          scrollAnchorRef.current = nextY;
        }

        lastScrollYRef.current = nextY;
        scrollFrameRef.current = 0;
      });
    };

    lastScrollYRef.current = window.scrollY || 0;
    scrollAnchorRef.current = lastScrollYRef.current;
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, [drawerOpen, dropdownOpen, notesOpen, isHomePage]);

  useEffect(() => {
    if (drawerOpen || dropdownOpen || notesOpen || searchOpen) {
      chromeHiddenRef.current = false;
      scrollAnchorRef.current = window.scrollY || 0;
      setChromeHidden(false);
    }
  }, [drawerOpen, dropdownOpen, notesOpen, searchOpen]);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.permissions?.query) return;

    let cancelled = false;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (!cancelled && status.state === "granted" && !locationState) {
          handleDetectLocation(true);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => {
    if (brandTimerRef.current) clearTimeout(brandTimerRef.current);
    if (locationNoticeTimerRef.current) clearTimeout(locationNoticeTimerRef.current);
  }, []);

  useEffect(() => {
    const handlePointerOutside = (e) => {
      const clickedInsideDesktopBrowse = browseRef.current?.contains(e.target);
      const clickedInsideMobileBrowse = mobileBrowseRef.current?.contains(e.target);
      const clickedInsideDesktopNotes = notesRef.current?.contains(e.target);
      const clickedInsideMobileNotes = mobileNotesRef.current?.contains(e.target);
      const clickedInsideDesktopLocale = desktopLocaleRef.current?.contains(e.target);
      if (!clickedInsideDesktopBrowse && !clickedInsideMobileBrowse) setDropdownOpen(false);
      if (!clickedInsideDesktopNotes && !clickedInsideMobileNotes) setNotesOpen(false);
      if (mobileLanguageRef.current && !mobileLanguageRef.current.contains(e.target)) setMobileLanguageOpen(false);
      if (!clickedInsideDesktopLocale) setDesktopLocaleOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerOutside);
    return () => document.removeEventListener("pointerdown", handlePointerOutside);
  }, []);

  useEffect(() => {
    setNotesOpen(false);
    setDropdownOpen(false);
  }, [currentPage]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setNotesOpen(false);
        setDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return undefined;
    const isInsideBrowse = (target) =>
      browseRef.current?.contains(target) || mobileBrowseRef.current?.contains(target);
    const closeBrowse = () => setDropdownOpen(false);
    const closeBrowseOnOutsideScroll = (event) => {
      if (isInsideBrowse(event.target)) return;
      setDropdownOpen(false);
    };
    const closeBrowseOnWindowScroll = () => {
      const activeElement = document.activeElement;
      if (activeElement && isInsideBrowse(activeElement)) return;
      setDropdownOpen(false);
    };
    document.addEventListener("wheel", closeBrowseOnOutsideScroll, { passive: true, capture: true });
    document.addEventListener("touchmove", closeBrowseOnOutsideScroll, { passive: true, capture: true });
    window.addEventListener("scroll", closeBrowseOnWindowScroll, { passive: true });
    window.addEventListener("resize", closeBrowse);
    return () => {
      document.removeEventListener("wheel", closeBrowseOnOutsideScroll, { capture: true });
      document.removeEventListener("touchmove", closeBrowseOnOutsideScroll, { capture: true });
      window.removeEventListener("scroll", closeBrowseOnWindowScroll);
      window.removeEventListener("resize", closeBrowse);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (!notesOpen) return undefined;
    const isInsideNotes = (target) =>
      notesRef.current?.contains(target) || mobileNotesRef.current?.contains(target);
    const closeNotes = () => setNotesOpen(false);
    const closeNotesOnOutsideScroll = (event) => {
      if (isInsideNotes(event.target)) return;
      setNotesOpen(false);
    };
    const closeNotesOnWindowScroll = () => {
      const activeElement = document.activeElement;
      if (isInsideNotes(activeElement)) return;
      setNotesOpen(false);
    };
    document.addEventListener("wheel", closeNotesOnOutsideScroll, { passive: true, capture: true });
    document.addEventListener("touchmove", closeNotesOnOutsideScroll, { passive: true, capture: true });
    window.addEventListener("scroll", closeNotesOnWindowScroll, { passive: true });
    window.addEventListener("resize", closeNotes);
    return () => {
      document.removeEventListener("wheel", closeNotesOnOutsideScroll, { capture: true });
      document.removeEventListener("touchmove", closeNotesOnOutsideScroll, { capture: true });
      window.removeEventListener("scroll", closeNotesOnWindowScroll);
      window.removeEventListener("resize", closeNotes);
    };
  }, [notesOpen]);

  useEffect(() => {
    const isLocked = drawerOpen || searchOpen;
    if (isLocked) {
      lockBodyScroll("header-overlay");
    } else {
      unlockBodyScroll("header-overlay");
    }
    document.body.classList.toggle("prime-drawer-open", drawerOpen);
    document.body.classList.toggle("prime-search-open", searchOpen);
    return () => {
      unlockBodyScroll("header-overlay");
      document.body.classList.remove("prime-drawer-open");
      document.body.classList.remove("prime-search-open");
    };
  }, [drawerOpen, searchOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setDrawerOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeAllPanels = () => {
    setDropdownOpen(false);
    setDrawerOpen(false);
    setSearchOpen(false);
    setNotesOpen(false);
    setMobileLanguageOpen(false);
    setDesktopLocaleOpen(false);
  };

  const handleDetectLocation = async (silent = false) => {
    setLocationLoading(true);
    if (!silent) {
      setLocationError("");
      setLocationNotice("");
    }
    try {
      const location = await detectCurrentLocation({ forceFresh: !silent });
      setLocationState(location);
      setLocationError("");
      if (!silent) {
        const detectedLabel = location?.fullAddress || location?.label || locationUi.detect;
        setLocationNotice(
          language === "ke"
            ? `Eneo limetambuliwa: ${detectedLabel}`
            : `Detected location: ${detectedLabel}`
        );
        if (locationNoticeTimerRef.current) clearTimeout(locationNoticeTimerRef.current);
        locationNoticeTimerRef.current = setTimeout(() => setLocationNotice(""), 4200);
      }
    } catch (error) {
      if (!silent) setLocationError(error.message || locationUi.autoError);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleBrandClick = (e) => {
    e.preventDefault();
    closeAllPanels();
    if (currentPage === "home") {
      if (brandTimerRef.current) clearTimeout(brandTimerRef.current);
      setBrandTap(true);
      brandTimerRef.current = setTimeout(() => setBrandTap(false), 420);
      return;
    }
    const now = Date.now();
    if (now - lastBrandClickRef.current < 450) {
      return;
    }
    lastBrandClickRef.current = now;
    if (brandTimerRef.current) clearTimeout(brandTimerRef.current);
    setBrandTap(true);
    brandTimerRef.current = setTimeout(() => setBrandTap(false), 420);
    onLogoClick?.();
  };

  const handleBrandDoubleClick = (e) => {
    e.preventDefault();
    closeAllPanels();
    if (brandTimerRef.current) clearTimeout(brandTimerRef.current);
    setBrandTap(true);
    brandTimerRef.current = setTimeout(() => setBrandTap(false), 420);
    if (currentPage === "home") {
      onLogoDoubleClick?.();
      return;
    }
    onLogoClick?.();
  };

  const handleCategoryClick = (e, value) => {
    e.preventDefault();
    closeAllPanels();
    if (onCategorySelect) onCategorySelect(value);
  };

  const handleNavigate = (callback) => (e) => {
    e.preventDefault();
    closeAllPanels();
    callback?.();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const locationLabel = locationLoading
    ? locationUi.detecting
    : locationState?.label || locationUi.detect;
  const locationBannerTitle =
    language === "ke" ? "Unanunua kwa eneo hili" : "Shopping for this area";
  const locationBannerCopy =
    locationState?.fullAddress || locationState?.label || locationUi.unavailable;
  const mobileLocationBarTitle =
    language === "ke" ? "Inapeleka hadi" : "Delivering to";
  const showMobileLocationBar = isHomePage && !drawerOpen && Boolean(locationState?.fullAddress || locationState?.label);
  const regionOptions = [
    { value: "in", label: "India", meta: "INR", flag: "🇮🇳", accent: "from-orange-400 via-white to-green-400" },
    { value: "ke", label: "Kenya", meta: "KES", flag: "🇰🇪", accent: "from-green-500 via-red-500 to-black" },
  ];
  const languageOptionsByRegion = {
    in: [
      { value: "en", label: "English", native: "English", meta: "India default" },
      { value: "te", label: "Telugu", native: "తెలుగు", meta: "Regional" },
    ],
    ke: [
      { value: "en", label: "English", native: "English", meta: "Kenya option" },
      { value: "ke", label: "Swahili", native: "Kiswahili", meta: "Kenya default" },
    ],
  };
  const localeRegionOptions = [
    { value: "in", label: "India", meta: "INR", flag: "\uD83C\uDDEE\uD83C\uDDF3", accent: "from-orange-400 via-white to-green-400" },
    { value: "ke", label: "Kenya", meta: "KES", flag: "\uD83C\uDDF0\uD83C\uDDEA", accent: "from-green-500 via-red-500 to-black" },
  ];
  const localeLanguageOptionsByRegion = {
    in: [
      { value: "en", label: "English", native: "English", meta: "India default" },
      { value: "hi", label: "Hindi", native: "\u0939\u093F\u0928\u094D\u0926\u0940", meta: "National" },
      { value: "te", label: "Telugu", native: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41", meta: "Regional" },
    ],
    ke: [
      { value: "en", label: "English", native: "English", meta: "Kenya option" },
      { value: "ke", label: "Swahili", native: "Kiswahili", meta: "Kenya default" },
    ],
  };
  const activeRegion = region === "ke" ? "ke" : "in";
  const languageOptions = localeLanguageOptionsByRegion[activeRegion];
  const currentRegionOption =
    localeRegionOptions.find((option) => option.value === activeRegion) || localeRegionOptions[0];
  const currentLanguageOption =
    languageOptions.find((option) => option.value === language) || languageOptions[0];
  const profileRegionOptions = [
    { value: "in", label: "India", meta: "INR", flag: "\uD83C\uDDEE\uD83C\uDDF3" },
    { value: "ke", label: "Kenya", meta: "KES", flag: "\uD83C\uDDF0\uD83C\uDDEA" },
  ];
  const profileLanguageOptionsByRegion = {
    in: [
      { value: "en", label: "English", native: "English", meta: "India default" },
      { value: "hi", label: "Hindi", native: "\u0939\u093F\u0928\u094D\u0926\u0940", meta: "National" },
      { value: "te", label: "Telugu", native: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41", meta: "Regional" },
    ],
    ke: [
      { value: "en", label: "English", native: "English", meta: "Kenya option" },
      { value: "ke", label: "Swahili", native: "Kiswahili", meta: "Kenya default" },
    ],
  };
  const profileActiveRegion = region === "ke" ? "ke" : "in";
  const profileLanguageOptions = profileLanguageOptionsByRegion[profileActiveRegion];
  const profileCurrentRegionOption =
    profileRegionOptions.find((option) => option.value === profileActiveRegion) || profileRegionOptions[0];
  const profileCurrentLanguageOption =
    profileLanguageOptions.find((option) => option.value === language) || profileLanguageOptions[0];
  const localePanelTitle = language === "ke" ? "Country and language" : "Country and language";
  const localePanelCopy = profileActiveRegion === "ke"
    ? "Kenya profile keeps Kenya products with English and Kiswahili only."
    : "India profile keeps India products with English, Hindi, and Telugu.";

  useEffect(() => {
    if (!profileLanguageOptions.some((option) => option.value === language)) {
      onLanguageChange?.(activeRegion === "ke" ? "ke" : "en");
    }
  }, [activeRegion, language, onLanguageChange, profileLanguageOptions]);

  const Badge = ({ count, color = "#e53e3e" }) => {
    if (!count || count <= 0) return null;
    return (
      <span className="badge" style={{ background: color, color: "#fff" }}>
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  const AccountButton = ({ compact = false }) => (
    <a
      href="#"
      className={`nav-icon-btn${compact ? " compact" : ""}`}
      onClick={handleNavigate(onAccountClick)}
      title={isLoggedIn ? (user?.name || "My Account") : "Sign In"}
    >
      {isLoggedIn ? (
        <span className="icon-wrap nav-user-icon">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={user?.name || "Profile"}
              className="nav-user-avatar"
            />
          ) : (
            <i className="fas fa-circle-user" style={{ fontSize: "24px", color: "#1d5ba0", lineHeight: 1 }}></i>
          )}
          <span className="nav-user-online" />
        </span>
      ) : (
        <span className="icon-wrap"><i className="fas fa-user"></i></span>
      )}
      <span className="label" style={isLoggedIn ? { color: "#1d5ba0", fontWeight: 700 } : {}}>
        {isLoggedIn ? t.header.account : t.header.login}
      </span>
    </a>
  );

  const CategoryLinks = () => (
    <>
      {categories.map((cat) => (
        <a key={cat.value} href="#" onClick={(e) => handleCategoryClick(e, cat.value)}>
          <i className={`fas ${cat.icon}`}></i> {cat.label}
        </a>
      ))}
    </>
  );

  const DesktopCategoryMenu = () => (
    <div className="desktop-browse-panel">
      <div className="desktop-browse-hero">
        <span className="desktop-browse-kicker">{desktopBrowseKicker}</span>
        <strong>{desktopBrowseTitle}</strong>
        <p>{desktopBrowseSubtitle}</p>
        <span className="desktop-browse-meta">
          <i className="fas fa-shield-alt"></i>
          {desktopBrowseMeta}
        </span>
      </div>
      <div className="desktop-browse-groups">
        {mobileCategoryGroups.map((group) => (
          <section className="desktop-browse-group" key={group.key}>
            <div className="desktop-browse-group-head">
              <span className="desktop-browse-group-icon">
                <i className={`fas ${group.icon}`}></i>
              </span>
              <span className="desktop-browse-group-copy">
                <strong>{group.title}</strong>
                <small>{group.subtitle}</small>
              </span>
            </div>
            <div className="desktop-browse-group-grid">
              {group.values
                .map((value) => categoryByValue[value])
                .filter(Boolean)
                .map((cat) => (
                  <a
                    key={cat.value}
                    href="#"
                    className="desktop-browse-category"
                    onClick={(e) => handleCategoryClick(e, cat.value)}
                  >
                    <span className="desktop-browse-category-icon">
                      <i className={`fas ${cat.icon}`}></i>
                    </span>
                    <span>{cat.label}</span>
                  </a>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );

  const drawerLayer = typeof document !== "undefined"
    ? createPortal(
        <>
          <div
            className={`mobile-drawer-backdrop${drawerOpen ? " open" : ""}`}
            onClick={() => setDrawerOpen(false)}
          />

          <div className={`mobile-drawer${drawerOpen ? " open" : ""}`}>
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-topline">
                <div className="mobile-drawer-topcopy">
                  <span className="mobile-drawer-kicker">{language === "ke" ? "Mipangilio" : "Quick settings"}</span>
                  <h3>{language === "ke" ? "Badili mwonekano wa programu" : ""}</h3>
                </div>
              </div>
              <button type="button" className="mobile-drawer-close" onClick={() => setDrawerOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="mobile-drawer-section">
              <div className="mobile-section-head">
                <span>{language === "ke" ? "Akaunti" : "Account"}</span>
                <small>{language === "ke" ? "Fungua akaunti yako au ingia hapa." : "Open your account or sign in from here."}</small>
              </div>
              <div className="mobile-quick-actions">
                <button
                  type="button"
                  className="mobile-quick-chip"
                  onClick={() => {
                    setDrawerOpen(false);
                    onAccountClick?.();
                  }}
                >
                  {isLoggedIn && user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user?.name || "Profile"}
                      className="mobile-quick-avatar"
                    />
                  ) : (
                    <i className={`fas ${isLoggedIn ? "fa-circle-user" : "fa-user"}`}></i>
                  )}
                  <span>{isLoggedIn ? (user?.name || t.header.account) : t.header.login}</span>
                </button>
              </div>
            </div>

            <div className="mobile-drawer-section">
              <div className="mobile-section-head">
                <span>{language === "ke" ? "Msaada wa haraka" : "Quick help"}</span>
                <small>{language === "ke" ? "Fungua PrimeBot ukiihitaji." : "Open PrimeBot whenever you need help."}</small>
              </div>
              <div className="mobile-quick-actions">
                <button
                  type="button"
                  className="mobile-quick-chip"
                  onClick={() => {
                    setDrawerOpen(false);
                    window.dispatchEvent(new CustomEvent("open-chatbot"));
                  }}
                >
                  <i className="fas fa-comment-dots"></i>
                  <span>{language === "ke" ? "Muulize PrimeBot" : "Ask PrimeBot"}</span>
                </button>
              </div>
            </div>

            <div className="mobile-drawer-section">
              <div className="mobile-section-head">
                <span>{language === "ke" ? "Mwonekano" : "Appearance"}</span>
                <small>{language === "ke" ? "" : ""}</small>
              </div>
              <div className="mobile-utility-stack">
                <div className="mobile-theme-setting">
                  <div className="mobile-theme-copy">
                    <strong>{themeUi.label}</strong>
                    <span>{themeUi.action}</span>
                  </div>
                  <button
                    type="button"
                    className="mobile-theme-toggle"
                    onClick={onThemeToggle}
                    title={themeUi.action}
                    aria-label={themeUi.action}
                    >
                      <ThemeIcon size={18} strokeWidth={2.1} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )
    : null;

  const searchLayer = typeof document !== "undefined"
    ? createPortal(
        <>
          <div
            className={`search-overlay-backdrop${searchOpen ? " open" : ""}`}
            onClick={() => setSearchOpen(false)}
          />
          <div className={`search-overlay-shell${searchOpen ? " open" : ""}`}>
            <div className="search-overlay-card">
              <div className="search-overlay-head">
                <div>
                  <strong>{language === "ke" ? "Tafuta kwa haraka" : "Search Prime Basket"}</strong>
                  <span>{language === "ke" ? "Bidhaa na sehemu zote" : "Products and categories in one place"}</span>
                </div>
                <button
                  type="button"
                  className="search-overlay-close"
                  onClick={() => setSearchOpen(false)}
                  aria-label={language === "ke" ? "Funga utafutaji" : "Close search"}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <SearchBox
                onCategorySelect={(cat) => {
                  setSearchOpen(false);
                  onCategorySelect?.(cat);
                }}
                onOpenProduct={(prod) => {
                  setSearchOpen(false);
                  onOpenProduct?.(prod);
                }}
                mobile
                language={language}
                region={region}
              />
            </div>
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <>
      <header id="navbar" className={`${scrolled ? "scrolled" : ""}${chromeHidden ? " chrome-hidden" : ""}${drawerOpen ? " drawer-open" : ""}${isCategoryPage ? " page-category" : ""}${showMobileLocationBar ? " has-mobile-location-bar" : ""}`}>
        <div className="nav-inner">
        <div className="nav-left" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            type="button"
            className={`logo brand-link${brandTap ? " brand-link-active" : ""}`}
            onClick={handleBrandClick}
            onDoubleClick={handleBrandDoubleClick}
          >
            <img
              src="/assets/prime-basket-brand.png"
              alt="Prime Basket"
              className="brand-logo-image brand-logo-image-header"
            />
          </button>
        </div>

        <div className="nav-center" style={{ gap: "30px", justifyContent: "center" }}></div>

        <div className="nav-right">
          <div className="nav-tools">
            <button
              type="button"
              className="nav-utility-chip"
              onClick={() => handleDetectLocation(false)}
              title={locationState?.fullAddress || locationUi.detect}
            >
              <i className={`fas ${locationLoading ? "fa-spinner fa-spin" : "fa-location-crosshairs"}`}></i>
              <span className="nav-utility-label">{locationLabel}</span>
            </button>
            <div className="nav-locale-picker" ref={desktopLocaleRef}>
              <button
                type="button"
                className={`nav-select-chip nav-locale-chip${desktopLocaleOpen ? " open" : ""}`}
                onClick={() => setDesktopLocaleOpen((prev) => !prev)}
                aria-expanded={desktopLocaleOpen}
                title={localePanelTitle}
              >
                <span className="nav-select-flag" aria-hidden="true">{profileCurrentRegionOption.flag}</span>
                <span className="nav-locale-chip-copy">
                  <strong>{profileCurrentLanguageOption.label}</strong>
                  <small>{profileCurrentRegionOption.label}</small>
                </span>
                <i className="fas fa-chevron-down"></i>
              </button>
              {desktopLocaleOpen && (
                <div className="desktop-locale-menu">
                  <div className="desktop-locale-menu-head">
                    <strong>{localePanelTitle}</strong>
                    <span>Products, currency, and language stay matched to your signed-in phone region.</span>
                  </div>
                  <div className="desktop-locale-profile">
                    <div className="desktop-locale-profile-flag" aria-hidden="true">{profileCurrentRegionOption.flag}</div>
                    <div className="desktop-locale-profile-copy">
                      <strong>{profileCurrentRegionOption.label}</strong>
                      <span>{profileCurrentRegionOption.meta} · {profileCurrentLanguageOption.native || profileCurrentLanguageOption.label}</span>
                    </div>
                  </div>
                  <div className="desktop-locale-language-grid">
                    {profileLanguageOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`desktop-locale-language-btn${language === option.value ? " active" : ""}`}
                        onClick={() => {
                          onLanguageChange?.(option.value);
                          setDesktopLocaleOpen(false);
                        }}
                      >
                        <span className="desktop-locale-language-flag" aria-hidden="true">{profileCurrentRegionOption.flag}</span>
                        <span className="desktop-locale-language-copy">
                          <strong>{option.label}</strong>
                          <small>{option.native || option.label}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="desktop-locale-note">{localePanelCopy}</div>
                </div>
              )}
            </div>
            <button
              type="button"
              className="nav-utility-chip nav-theme-toggle"
              onClick={onThemeToggle}
              title={themeUi.action}
              aria-label={themeUi.action}
            >
              <ThemeIcon size={18} strokeWidth={2.1} />
            </button>
          </div>
          <div className="nav-icons">
            <div className="nav-action-item" ref={notesRef}>
              <a
                href="#"
                className="nav-icon-btn"
                aria-label={t.header.notifications}
                onClick={(e) => {
                  e.preventDefault();
                  setDropdownOpen(false);
                  setNotesOpen((prev) => !prev);
                }}
              >
                <span className="icon-wrap">
                  <i className="far fa-bell"></i>
                  <Badge count={unreadCount} color="#e53e3e" />
                </span>
                <span className="label">{t.header.notifications}</span>
              </a>

              {notesOpen && (
                <div className="notes-dropdown">
                  <div className="notes-head">
                    <div>
                      <h4>Notifications</h4>
                      <p>{unreadCount > 0 ? `${unreadCount} unread updates` : "Everything is up to date"}</p>
                    </div>
                    <div className="notes-actions-wrap">
                      {notifications.length > 0 && (
                        <div className="notes-actions">
                          <button type="button" className="notes-mark-read" onClick={markAllRead}>
                            Mark all read
                          </button>
                          <button type="button" className="notes-mark-read notes-clear" onClick={clearNotifications}>
                            Clear notifications
                          </button>
                        </div>
                      )}
                      <button type="button" className="notes-close-btn" onClick={() => setNotesOpen(false)} aria-label="Close notifications">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>

                  <div className="notes-list">
                    {notifications.length === 0 ? (
                      <div className="notes-empty">
                        <div className="notes-empty-icon">
                          <i className="fas fa-bell-slash"></i>
                        </div>
                        <p>No notifications yet</p>
                        <span>We will show order, delivery, and offer updates here.</span>
                      </div>
                    ) : (
                      notifications.map((note) => (
                        <div
                          key={note.id}
                          className={`note-item${note.read ? "" : " unread"}`}
                        >
                          <div
                            className={`note-icon note-${note.type || "info"}`}
                          >
                            <i
                              className={`fas ${
                                note.type === "success"
                                  ? "fa-check-circle"
                                  : note.type === "delivery"
                                    ? "fa-truck"
                                    : "fa-info-circle"
                              }`}
                            ></i>
                          </div>
                          <div className="note-copy">
                            <div className="note-title">{note.title}</div>
                            <div className="note-message">{note.message}</div>
                            <div className="note-time">{note.time}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <a href="#" className="nav-icon-btn" onClick={handleNavigate(onWishlistClick)}>
              <span className="icon-wrap"><i className="fas fa-heart"></i><Badge count={wishlistCount} /></span>
              <span className="label">{t.header.wishlist}</span>
            </a>

            <a href="#" className="nav-icon-btn" onClick={handleNavigate(onCartClick)}>
              <span className="icon-wrap"><i className="fas fa-basket-shopping"></i><Badge count={cartCount} /></span>
              <span className="label">{t.header.basket}</span>
            </a>

            <AccountButton />
          </div>
        </div>

        <div className="mobile-header-actions">
          <div className="mobile-language-picker" ref={mobileLanguageRef}>
            <button
              type="button"
              className="mobile-header-icon-btn"
              onClick={() => setMobileLanguageOpen((prev) => !prev)}
              title={language === "ke" ? "Nchi na lugha" : "Country and language"}
              aria-label={language === "ke" ? "Nchi na lugha" : "Country and language"}
              aria-expanded={mobileLanguageOpen}
            >
              <i className="fas fa-globe"></i>
            </button>
            {mobileLanguageOpen && (
              <div className="mobile-language-menu mobile-settings-menu">
                {onRegionChange && (
                  <div className="mobile-settings-group">
                    <div className="mobile-settings-head">
                      <strong>{language === "ke" ? "Country profile" : "Country profile"}</strong>
                      <span>{language === "ke" ? "Currency and catalog are locked to your current number" : "Currency and catalog stay aligned to the signed-in phone region"}</span>
                    </div>
                    <div className="mobile-settings-grid">
                      <div className="mobile-settings-chip active">
                          <span className="mobile-settings-chip-flag" aria-hidden="true">{profileCurrentRegionOption.flag}</span>
                          <span className="mobile-settings-chip-text">
                            <span className="mobile-settings-chip-title">{profileCurrentRegionOption.label}</span>
                            <small>{profileCurrentRegionOption.meta}</small>
                          </span>
                        </div>
                    </div>
                  </div>
                )}

                <div className="mobile-settings-group">
                  <div className="mobile-settings-head">
                    <strong>{language === "ke" ? "Lugha" : "Language"}</strong>
                    <span>{language === "ke" ? "Badili kwa mkono ukitaka" : "Change it manually if you prefer"}</span>
                  </div>
                  <div className="mobile-settings-grid">
                    {profileLanguageOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`mobile-settings-chip${language === option.value ? " active" : ""}`}
                        onClick={() => {
                          onLanguageChange?.(option.value);
                          setMobileLanguageOpen(false);
                        }}
                        >
                        <span className="mobile-settings-chip-flag mobile-settings-chip-flag-lang" aria-hidden="true">
                          {profileCurrentRegionOption.flag}
                        </span>
                        <span className="mobile-settings-chip-text">
                          <span className="mobile-settings-chip-title">{option.label}</span>
                          <small>{option.native || option.label}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                  <div className="mobile-settings-note">
                  {profileActiveRegion === "ke"
                    ? "Kenya profiles keep English and Kiswahili only, and the catalog stays aligned to Kenya shopping."
                    : "India profiles keep English, Hindi, and Telugu only, and the catalog stays aligned to India shopping."}
                  </div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="mobile-header-icon-btn"
            onClick={() => handleDetectLocation(false)}
            title={locationState?.fullAddress || locationUi.detect}
            aria-label={locationUi.detect}
          >
            <i className={`fas ${locationLoading ? "fa-spinner fa-spin" : "fa-location-crosshairs"}`}></i>
          </button>
          <div className="mobile-header-notes-wrap" ref={mobileNotesRef}>
            <button
              type="button"
              className="mobile-header-icon-btn"
              onClick={() => {
                setDropdownOpen(false);
                setNotesOpen((prev) => !prev);
              }}
              title={t.header.notifications}
              aria-label={t.header.notifications}
              aria-expanded={notesOpen}
            >
              <i className="far fa-bell"></i>
              <Badge count={unreadCount} color="#e53e3e" />
            </button>
            {notesOpen && (
              <div className="notes-dropdown mobile-header-notes-dropdown">
                <div className="notes-head">
                  <div>
                    <h4>Notifications</h4>
                    <p>{unreadCount > 0 ? `${unreadCount} unread updates` : "Everything is up to date"}</p>
                  </div>
                  <div className="notes-actions-wrap">
                    {notifications.length > 0 && (
                      <div className="notes-actions">
                        <button type="button" className="notes-mark-read" onClick={markAllRead}>
                          Mark all read
                        </button>
                        <button type="button" className="notes-mark-read notes-clear" onClick={clearNotifications}>
                          Clear notifications
                        </button>
                      </div>
                    )}
                    <button type="button" className="notes-close-btn" onClick={() => setNotesOpen(false)} aria-label="Close notifications">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>

                <div className="notes-list">
                  {notifications.length === 0 ? (
                    <div className="notes-empty">
                      <div className="notes-empty-icon">
                        <i className="fas fa-bell-slash"></i>
                      </div>
                      <p>No notifications yet</p>
                      <span>We will show order, delivery, and offer updates here.</span>
                    </div>
                  ) : (
                    notifications.map((note) => (
                      <div
                        key={note.id}
                        className={`note-item${note.read ? "" : " unread"}`}
                      >
                        <div
                          className={`note-icon note-${note.type || "info"}`}
                        >
                          <i
                            className={`fas ${
                              note.type === "success"
                                ? "fa-check-circle"
                                : note.type === "delivery"
                                  ? "fa-truck"
                                  : "fa-info-circle"
                            }`}
                          ></i>
                        </div>
                        <div className="note-copy">
                          <div className="note-title">{note.title}</div>
                          <div className="note-message">{note.message}</div>
                          <div className="note-time">{note.time}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          className={`hamburger${drawerOpen ? " open" : ""}`}
          aria-label="Toggle menu"
          aria-expanded={drawerOpen}
          onClick={() => {
            setDropdownOpen(false);
            setNotesOpen(false);
            setDrawerOpen((prev) => !prev);
          }}
        >
          <span></span><span></span><span></span>
        </button>
      </div>

      <div className="nav-secondary">
        <div className="nav-experience-strip" aria-label={language === "ke" ? "Prime Basket benefits" : "Prime Basket benefits"}>
          <div className="nav-experience-inner">
            {headerExperienceItems.map((item) => (
              <span key={item.label} className="nav-experience-item">
                <i className={`fas ${item.icon}`}></i>
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <div className="nav-search-row">
          <div className="nav-search-inner">
            {!drawerOpen && (
              <div className="nav-location-banner nav-location-banner-inline nav-location-banner-rail">
                <div className="nav-location-banner-icon">
                  <i className={`fas ${locationLoading ? "fa-spinner fa-spin" : "fa-location-dot"}`}></i>
                </div>
                <div className="nav-location-banner-copy">
                  <strong>{locationBannerTitle}</strong>
                  <span>{locationBannerCopy}</span>
                </div>
              </div>
            )}
            <div className="nav-search-copy nav-browse-slot">
              <div className="browse-wrapper" ref={browseRef}>
                <button
                  className={`browse-btn${dropdownOpen ? " open" : ""}`}
                  aria-expanded={dropdownOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotesOpen(false);
                    setDropdownOpen((prev) => !prev);
                  }}
                >
                  <span className="bar-icon"><span></span><span></span><span></span></span>
                  <span className="browse-btn-label">{t.header.browseAll}</span>
                  <i className="fa fa-chevron-down chevron"></i>
                </button>
                <nav className={`dropdown-menu desktop-browse-menu${dropdownOpen ? " open" : ""}`} role="menu">
                  <DesktopCategoryMenu />
                </nav>
              </div>
            </div>
            <div className="mobile-search-actions">
              <div className="mobile-browse-wrapper" ref={mobileBrowseRef}>
                <button
                  type="button"
                  className={`mobile-browse-btn${dropdownOpen ? " open" : ""}`}
                  aria-expanded={dropdownOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotesOpen(false);
                    setDropdownOpen((prev) => !prev);
                  }}
                >
                  <span className="bar-icon"><span></span><span></span><span></span></span>
                  <span className="browse-btn-label">{t.header.browseAll}</span>
                  <i className="fa fa-chevron-down chevron"></i>
                </button>
                <nav className={`dropdown-menu mobile-browse-menu${dropdownOpen ? " open" : ""}`} role="menu">
                  <CategoryLinks />
                </nav>
              </div>
              <button
                type="button"
                className="mobile-search-launch"
                onClick={() => setSearchOpen(true)}
                title={language === "ke" ? "Tafuta" : "Search"}
                aria-label={language === "ke" ? "Tafuta" : "Search"}
              >
                <i className="fas fa-magnifying-glass"></i>
                <span className="mobile-search-launch-text">
                  {language === "ke" ? "Tafuta bidhaa au aina..." : "Search products or categories..."}
                </span>
              </button>
            </div>
            <div className="search-wrapper header-search-shell search-row-shell">
              <SearchBox
                onCategorySelect={onCategorySelect}
                onOpenProduct={onOpenProduct}
                language={language}
                region={region}
              />
            </div>
            <div className="nav-promise-pills" aria-label={language === "ke" ? "Ahadi za duka" : "Prime Basket promises"}>
              {headerPromiseItems.map((item) => (
                <span key={item.label} className="nav-promise-pill">
                  <i className={`fas ${item.icon}`}></i>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {showMobileLocationBar && (
          <div className="mobile-location-status-bar">
            <div className="mobile-location-status-icon">
              <i className={`fas ${locationLoading ? "fa-spinner fa-spin" : "fa-location-dot"}`}></i>
            </div>
            <div className="mobile-location-status-copy">
              <strong>{mobileLocationBarTitle}</strong>
              <span>{locationBannerCopy}</span>
            </div>
          </div>
        )}
      </div>

      {(locationError || (locationNotice && !showMobileLocationBar)) && !drawerOpen && (
        <div className={`nav-location-hint${locationNotice ? " success" : ""}`}>
          {locationError || locationNotice}
        </div>
      )}
      </header>
      {drawerLayer}
      {searchLayer}
    </>
  );
}
