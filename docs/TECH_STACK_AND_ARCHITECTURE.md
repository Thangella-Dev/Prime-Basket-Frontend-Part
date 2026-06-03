# Tech Stack and Architecture

## Core Stack

- `React 18`
- `Vite 7`
- `React DOM`
- `Firebase Realtime Database`
- `i18next`
- `react-i18next`
- `react-router-dom` is installed, but the app mainly uses internal page state instead of full router-driven navigation
- `Tailwind CSS 4` is installed, but the current UI is mostly custom CSS driven
- `ESLint 10`
- `@eslint/js`
- `globals`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`

## Styling Approach

The application currently uses:

- Large shared stylesheet in `public/style.css`
- Page-specific CSS such as `src/pages/Account.css`
- Inline styles in some page-level components

This means the current visual system is powerful but mixed. A future cleanup could move more repeated styles into reusable components or shared tokens.

## Main Frontend Architecture

## Deployment and Discovery Surface

- Production storefront domain: `https://prime-basket.in`
- SEO/discovery assets currently maintained in the repo:
  - `index.html` metadata
  - `public/robots.txt`
  - `public/sitemap.xml`
  - `public/geo.txt`
  - `public/llms.txt`
  - `public/site.webmanifest`

### App Shell

- `src/App.jsx`
  Controls top-level state such as page navigation, region, language, theme, cart, wishlist, checkout state, orders, login modal state, locale enforcement by phone-region, mobile dock visibility rules, context-aware cart toast behavior, cart unit/quantity mutation, mobile toast stacking hooks, and shared page-level error-boundary wrapping.

- `src/components/Layout.jsx`
  Wraps the shared page shell, mobile glass bottom dock, pull-to-refresh handling, connectivity surfaces, and shared overlay-aware dock suppression.

- `src/components/Header.jsx`
  Handles header behavior, region/language UI, notification dropdown, search overlay, mobile drawer, compact desktop command-row behavior, dark-mode header polish, full-header-aware mobile overlay positioning, notification overlay layering, and browse-category dropdown dismissal/sizing behavior.

- `src/components/ChatbotWidget.jsx`
  Handles the floating assistant launcher, mobile/desktop chat panel behavior, home-only launcher visibility, footer-aware floating controls, and quantity/auth overlay suppression.

- `src/components/Footer.jsx`
  Shared footer.

- `src/utils/translationUtils.js`
  Shared product-name localization normalization and search-hint helpers.

### State and Context

- `src/context/AuthContext.jsx` 
  Manages session and user data with localStorage-backed persistence and consolidated session bootstrapping for lower startup overhead.

- `src/context/TrackingContext.jsx`
  Handles active order tracking simulation and wallet state.

### Main Pages

- `src/pages/HomePage.jsx`
  Handles hero, premium catalog merchandising, cached home-state restore, active-region curated rail backfilling, and the native scroll-snap curated shelves used for mobile-friendly swipe interaction.
- `src/pages/CategoryPage.jsx`
  Handles category browsing, all-products mode, compact desktop filter controls, category-specific product-grid presentation, state restoration from product detail, and pre-paint filter resets for fresh category entry.
- `src/pages/ProductDetailPage.jsx`
  Handles gallery/zoom, buying details, product-aware unit selection, pricing, cart/wishlist actions, trust metadata, and related products.
- `src/pages/CartPage.jsx`
  Handles cart, product-aware unit switching, mobile checkout presentation, promo flow, address selection, and recommended/special-deal product surfaces.
- `src/pages/PaymentPage.jsx`
- `src/pages/AccountPage.jsx`
  Handles account dashboard flows including the compact desktop account shell, dedicated `v2` account rail, denser profile/order card presentation, orders, buy-again, wallet, notifications, help, and the staged refund/return request lifecycle with proof uploads and order-style refund timeline tracking.
- `src/components/PhoneAuthModal.jsx`
  Handles phone sign-in, OTP verification, generated-OTP choice prompting, segmented OTP autofill/paste behavior, and verification UI state.
- `public/style.css`
  Contains the shared visual system, header/mobile shell styling, and the global mobile overlay safety layer that keeps modals, sheets, dropdowns, lightboxes, and toasts above the mobile header and bottom dock.
- `src/pages/WishlistPage.jsx`
- `src/pages/OrderSuccessPage.jsx`
- `src/pages/OrderTrackingPage.jsx`
- `src/pages/OrderDetailPage.jsx`
- `src/pages/RateOrderPage.jsx`

### Supporting Systems

- `docs/BACKEND.md`
  Canonical backend integration README with service-layer guidance, API endpoint map, localStorage migration plan, validation rules, environment variables, production checklist, and June 3 backend-start recommendation.

- `docs/BACKEND_Integration_Modeule.md`
  Detailed backend integration module for auth, catalog, cart, wishlist, checkout, orders, payments, refunds, notifications, wallet, and chatbot proxy migration.

- `src/firebase.js`
  Firebase app and Realtime Database setup through environment variables.

- `src/services/groqService.js`
  Chatbot-related product selection and AI prompt preparation.

- `src/utils/productUtils.js`
  Product normalization, currency formatting, product-aware unit template inference, image sanitizing, and category-safe fallback image resolution utilities.

- `src/data/india_products.js`
  India fallback catalog data used when live India catalog access is unavailable.

- `src/data/kenya_products.js`
  Kenya fallback catalog data and curated Kenya home/category product surfaces.

- `src/utils/demoPhoneAuth.js`
  Demo OTP generation and verification fallback used when backend phone-auth endpoints are unavailable.

- `src/config/paymentConfig.js`
  Payment configuration logic.

- `src/i18n/translations.js`
  Translation content and language text handling.

- `eslint.config.js`
  Frontend lint configuration for JavaScript/JSX quality checks, React Hooks warnings, Fast Refresh warnings, and relaxed legacy rules while the app is being production-hardened.

## Navigation Model

The app is not currently router-first. It mostly uses:

- `page` state in `App.jsx`
- callback-based navigation
- some window events for cross-page actions

This works, but a future production refactor could move more navigation to a cleaner route-driven model.

## Data Model Summary

### Catalog

- Firebase Realtime Database for live catalog paths
- local data fallback for region-specific flows in both India and Kenya
- direct India fallback asset mapping for categories that previously showed misleading placeholder art
- timeout-backed fallback protection on key homepage catalog surfaces to avoid prolonged skeleton-only states when live fetches stall
- premium home skeleton coverage that now includes curated-rail-style placeholders instead of only generic product blocks
- region-aware search fallback indexing so category/search results stay aligned to the active phone-region profile
- category filter state is reset before fresh category paint so stale discount ranges do not briefly filter new category results

### User and commerce state

- localStorage-backed frontend persistence
- wishlist-origin metadata for move-to-cart and restore-to-wishlist behavior
- staged refund request persistence with history and proof metadata

### Chatbot

- client-side chatbot UI
- AI service prompt-building logic
- should be moved behind a backend proxy for safer production use

### Commerce interaction rules

- Cart line merging is normalized by product identity plus selected unit
- Cart unit changes normalize display labels before matching, update unit price/totals, and merge duplicate product/unit rows when needed
- Wishlist persistence is product-only and does not store live cart quantity
- Mobile address-entry overlays signal the shared app shell so the mobile dock hides while forms are open
- Login/auth overlays and mobile category filter/sort sheets also signal mobile dock suppression
- Wishlist move-to-cart behavior removes the product from wishlist immediately after adding it to cart

## Current Architecture Quality

What is already good:

- Clear enough page separation
- Reusable shell and shared state
- Good utility reuse in product/currency handling
- Context usage where it matters
- Major pages are already split
- `npm run lint` now runs successfully with `0 errors`
- `npm run build` remains green after the latest hardening pass

What should improve later:

- Reduce giant page-level inline styles
- Reduce amount of state living in `App.jsx`
- Move from demo persistence to real API persistence using the staged backend plan in `docs/BACKEND.md`
- Consider route-driven navigation for long-term maintainability
- Introduce testing and stronger data contracts
- Review remaining hook-dependency and Fast Refresh warnings as part of a deliberate architecture cleanup
- Add a preview/browser automation path outside the current Windows sandbox so runtime QA is not blocked by `spawn EPERM`
