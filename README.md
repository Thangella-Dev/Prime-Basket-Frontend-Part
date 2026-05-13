# Prime Basket Frontend

Prime Basket is a premium grocery ecommerce frontend built with React and Vite. It currently supports region-aware shopping flows, product discovery, cart and checkout, account management, order/refund demos, theme switching, and an in-app shopping assistant.

Primary production domain: `https://prime-basket.in`

## What The App Includes

- Home, category, product detail, cart, wishlist, payment, and account pages
- Region switching for `India` and `Kenya`
- Language switching for `English` and `Swahili`
- Region-aware currency presentation
- Firebase-backed live catalog support for configured flows
- Local fallback/demo data for some region flows
- Chatbot panel and shopping assistant UI
- Premium mobile-first UI improvements across core screens
- Ongoing desktop and mobile dark-mode refinement across header, account, and promotional surfaces
- Route-safe public asset loading for direct and nested entries
- Safer homepage fallback loading when live catalog fetches are slow
- Mobile curated-rail swipe support with right-aligned shelf controls
- Improved category-page desktop layering and tappable range-slider filter behavior
- Same-origin web manifest values for local and production compatibility
- Category-page search/filter runtime stabilization for desktop refine-panel interactions
- App navigation and scroll persistence across browser refreshes
- Mobile pull-to-refresh support for core shopping pages with a content-only refresh indicator
- Premium mobile delivery-location bar under the header on home, replacing the raw detected-location text treatment
- Category-page filter-mode separation so desktop uses the right refine sidebar and mobile uses the bottom-sheet flow
- Mobile category-search blur handling to reduce unwanted scroll jumps after leaving the search field
- Mobile category filter/sort sheets now render through a body portal so they attach to the viewport instead of the scrolling product list
- Pull-to-refresh now refreshes in-app without a full loader flash, and its touch handling no longer triggers passive-listener console warnings
- Shared product image rendering now sanitizes malformed remote URLs such as accidental `hhttps://...` entries

## Tech Stack

- `React 18`
- `Vite 7`
- `Firebase Realtime Database`
- `i18next` and `react-i18next`
- `react-router-dom` installed, though current navigation is mostly app-state driven
- `Tailwind CSS 4` installed, while most of the current UI uses custom CSS

## Run The Project

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

## Environment Variables

The app expects Firebase configuration through Vite environment variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Optional AI/chat-related variables currently referenced:

- `VITE_GROQ_API_KEY`
- `VITE_GROQ_API_URL`
- `VITE_GROQ_MODEL`

## Current Architecture Summary

- `src/App.jsx`
  Main app orchestration, top-level page state, theme, region, language, cart, wishlist, checkout, and order flow state.

- `src/components/Header.jsx`
  Shared header, notification dropdown, search overlay, region/language UI, and mobile drawer.

- `src/context/AuthContext.jsx`
  Session and user state.

- `src/context/TrackingContext.jsx`
  Order tracking and wallet demo state.

- `src/pages/*`
  Main UI pages for the shopping and account flows.

## Current Application Quality

What is already strong:

- Premium-looking frontend direction
- Good mobile responsiveness across major flows
- Broad feature coverage for a frontend ecommerce demo
- Region-aware shopping foundation
- Stable build output
- Stronger account/help/payment UX than the earlier baseline
- Better dark-mode coverage across shared navigation and key account flows
- More polished checkout presentation and order-review flow
- More stable overlay/modal behavior in cart and account flows

What still needs work:

- Full backend integration
- Production-grade auth and payments
- Complete end-to-end QA on all devices
- More cleanup of inline page-level styles
- Final dark-mode consistency review across every subsection

## Improvements Completed In This Implementation Cycle

- Audited and stabilized desktop category browsing so the left rail, sticky toolbar, and right filter panel work as one coherent layout
- Added hover-reveal desktop categories with icon-first collapsed state and label expansion on interaction
- Moved desktop quantity selection into an on-card dropdown/popover instead of a detached fullscreen-style desktop modal
- Added animated premium search hints for product/category search surfaces
- Refined search-hint layout so desktop search recommendations render as a clean trailing chip instead of overlapping the input text
- Replaced fuzzy product-name translation matching with safer exact-normalized matching to prevent incorrect English/Swahili product labels
- Upgraded theme-toggle presentation with cleaner premium light/dark icons
- Reworked the mobile `Browse All Categories` trigger into a cleaner frosted glass treatment
- Fixed route-relative public asset references so direct entries and nested URLs no longer break brand, hero, or footer imagery
- Added a timeout-backed homepage fallback so popular, deals, and curated sections recover faster when live catalog fetches stall
- Reworked category browsing with a compact desktop filter bar, denser square product cards, and a real `All Categories` all-products mode
- Added category-page quick actions for `All Categories` and `All Deals`
- Fixed mobile browse dropdown anchoring so it opens directly under its trigger
- Strengthened light-mode header icon contrast for notifications, wishlist, and basket actions
- Removed oversized desktop category featured-product blocks that were crowding the catalog
- Tightened category/product card density across shared grids to reduce text collisions and improve scanability
- Improved mobile cart item layout so quantity controls and price stay aligned in the side column instead of dropping awkwardly below the product details
- Reduced badge/text collisions in shared product cards and tightened deal-card title handling
- Upgraded the header and navigation shell
- Improved region/language/currency behavior
- Reworked hero and home presentation
- Improved account layout and scrolling behavior
- Tightened cart and payment UI
- Reduced the add-to-cart preview toast footprint for a cleaner mobile/desktop overlay
- Improved mobile auth modal handling
- Fixed chatbot runtime and overlay issues
- Added overlay-only scroll behavior for drawer/chat flows
- Added page-level lazy loading for better first-load performance
- Improved dark-mode readability and notification surface behavior
- Replaced browser popups in account/rating flows with in-app notices and confirm dialogs
- Improved account payment/help dark-mode behavior and premium panel treatment
- Improved dark-mode desktop header readability, reduced glass/shine artifacts, and strengthened dropdown contrast
- Reworked the payment page with a richer method-selection surface and a more premium order summary
- Fixed the M-Pesa checkout input state bug
- Stabilized the address modal for cart and account by rendering it through a body portal
- Normalized cart merging so repeated adds increase the same line item instead of duplicating it when unit defaults differ
- Improved product-detail highlights and information cards for dark mode and overflow handling
- Swapped the lower header-bar placement of location and browse controls to match the requested layout
- Removed a set of hardcoded chatbot currency strings and made its visible pricing more region-aware
- Added safe Firebase fallback handling on product detail pages for deployments missing live catalog env vars
- Improved mobile header brand fitting and refined smarter product-unit inference across groceries, drinks, dairy, snacks, and care items
- Tuned footer/chatbot floating-control behavior so the up-arrow and chat launcher hand off cleanly near the footer
- Added production-ready SEO, crawler, LLM discovery, manifest, and favicon/browser icon setup
- Pointed canonical, Open Graph, Twitter, sitemap, robots, geo, and LLM discovery files to the production domain `https://prime-basket.in`
- Improved desktop curated product rail click behavior so `Top Selling`, `Trending`, `Recently Added`, and `Top Rated` cards open reliably
- Stabilized quantity modal close behavior so outside taps dismiss the modal without accidentally opening the product page
- Refined mobile category sticky header/chip behavior and improved desktop account layout with a left navigation rail
- Added curved-square account avatar presentation inside the mobile side menu account card

## Backend Attachment Direction

To take this to production, attach:

- Auth API
- Catalog API or validated Firebase access layer
- Cart API
- Checkout and order API
- Payment backend and webhook verification
- Notification service
- Chatbot proxy/backend

Detailed backend guidance is available in [docs/BACKEND_INTEGRATION_GUIDE.md](./docs/BACKEND_INTEGRATION_GUIDE.md).

## Documentation

See the `docs` folder for detailed project documentation:

- [Manager Mail Update](./docs/Mail_Update.md)
- [Today Manager Summary](./docs/DAILY_UPDATE_2026-05-13.md)
- [Application Overview](./docs/APPLICATION_OVERVIEW.md)
- [Tech Stack and Architecture](./docs/TECH_STACK_AND_ARCHITECTURE.md)
- [Backend Integration Guide](./docs/BACKEND_INTEGRATION_GUIDE.md)
- [Improvements and Gap Analysis](./docs/IMPROVEMENTS_AND_GAP_ANALYSIS.md)

## Current Validation

- `npm run build` passes
- Production metadata now targets `https://prime-basket.in`
- Category browsing, cart-item layout, shared product-card density, and all-products mode were updated and revalidated in the latest pass
- A focused code audit pass was completed on checkout, modal behavior, cart merging, chatbot currency handling, related-product/detail flows, and deployment-safe product-page behavior
- Mobile category filter popup mounting, pull-to-refresh behavior, and malformed image URL handling were stabilized in the latest pass
- The app is suitable as a strong frontend demo/prototype
- Final device-lab/browser QA and backend completion are still recommended before production use
