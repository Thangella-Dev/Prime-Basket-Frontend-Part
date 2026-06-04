# Prime Basket Frontend

Prime Basket is a premium grocery ecommerce frontend built with React and Vite. It currently supports region-aware shopping flows, product discovery, cart and checkout, account management, order/refund demos, theme switching, and an in-app shopping assistant.

Primary production domain: `https://prime-basket.in`

## What The App Includes

- Home, category, product detail, cart, wishlist, payment, and account pages
- Region switching for `India` and `Kenya`
- Language switching for `English`, `Hindi`, `Telugu`, and `Swahili`
- Region-aware currency presentation
- Firebase-backed live catalog support for configured flows
- Local fallback/demo data for both India and Kenya region flows
- Chatbot panel and shopping assistant UI
- Premium mobile-first UI improvements across core screens
- Ongoing desktop and mobile dark-mode refinement across header, account, and promotional surfaces
- Route-safe public asset loading for direct and nested entries
- Safer homepage fallback loading when live catalog fetches are slow
- Mobile curated-rail swipe support with right-aligned shelf controls
- Home curated rails now use native horizontal scroll with scroll-snap, which improves real-device swipe reliability and keeps arrow controls synced to the actual shelf position
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
- Desktop home-category sidebar now has an internal scroll area with a fuller category list instead of ending early with empty space
- Home `Deals Of The Day` now supports a denser 3-column mobile layout and pads to six cards when the available deal pool is smaller
- Home `Deals Of The Day` product cards now use the hardened shared quantity picker with edge-aware desktop placement, safer mobile sheet scrolling, and no accidental product-navigation taps while choosing units
- Cart removal/decrement actions now clear top-right cart feedback immediately when the removed item no longer exists in cart
- Mobile glass bottom navigation is now smaller, theme-aware, and visually better integrated with the app shell
- The mobile glass bottom dock was tuned down slightly again so it feels lighter on small screens without losing the premium shell treatment
- Mobile chatbot launcher now sits above the bottom dock instead of colliding with it
- Mobile header actions are rebalanced so `Browse All Categories` stays readable while search remains accessible
- Account logout now routes through a confirmation dialog across mobile and desktop account flows
- Desktop `My Account` logout now correctly renders its confirmation dialog instead of failing silently
- Wallet top-up now requires a valid numeric amount before users can continue
- OTP verification now supports one-time-code autofill and smarter multi-digit paste behavior
- Generated demo/dev OTP values can now be used through an explicit auto-fill choice in the sign-in flow
- The OTP verification modal now uses a cleaner mobile-friendly choice card for `Auto Fill OTP` versus `Enter Manually`
- India phone-region users now default to India catalog/language rules, while Kenya phone-region users stay locked to Kenya catalog/language rules
- Search fallback indexing is now region-aware, so India no longer falls back to Kenya products when live catalog data is unavailable
- Wishlist now stays product-only even when the same item already exists in cart, and moving wishlist items to cart still removes them from wishlist immediately
- Cart merging now normalizes unit keys before comparison, reducing duplicate line-items when the same product is added repeatedly
- The mobile dock now hides correctly for address-entry overlays, including the checkout address modal
- Desktop locale selection is now consolidated into one premium country-language control with flag emojis and country-valid language options only
- India locale options now include `English`, `Hindi`, and `Telugu`, while Kenya locale options stay limited to `English` and `Swahili`
- Kenya users can now switch back from `Swahili` to `English` without the app forcing the region default language again
- The mobile glass bottom dock now uses a cleaner vertical entry animation, slightly larger tap targets, and stronger active-button feedback
- The chatbot launcher now shows only on the home page and remains lifted clear of the mobile dock
- The chatbot can now still be opened intentionally from the mobile side menu on any page, while the floating launcher remains home-only
- The chatbot launcher now also hides automatically while the delivered-order feedback prompt is visible on home, preventing overlap with that premium order-follow-up card
- The home hero `Explore now` CTA now opens the matching category flow for the active slide, and the manual slideshow arrows were removed
- Tapping the hero slide cards themselves now also opens the matching category flow
- Shared section-title divider lines such as the one after `Popular Products` were removed for a cleaner premium heading style
- Login/auth overlays now suppress the mobile dock, and OTP send now dismisses the mobile keyboard automatically
- Checkout `Select address to continue` now jumps directly into address entry when no saved address exists
- Address entry now shows inline real-world validation errors for empty or invalid required fields like house, locality, pincode, receiver name, and phone
- Address entry now validates more strictly by region, including exact India/Kenya postal-code rules, normalized receiver names, and phone-number format checks with the country prefix kept inline on mobile
- Wishlist/cart interaction is more isolated so wishlist taps do not accidentally trigger neighboring cart actions
- `Buy Again` is now available in `My Account` for reordering previous items individually
- The mobile dock now hides while mobile category filter/sort sheets are open
- A runtime crash in `App.jsx` caused by reading `page` before navigation-state initialization was fixed
- A premium shared refresh layer now strengthens section surfaces, motion, home merchandising, and light/dark consistency across core storefront views
- Wishlist dark-mode surfaces, crumb header, and action buttons were refined for stronger contrast and readability
- Product-card and detail-page heart/share controls now avoid sticky mobile hover states after deselecting
- The order follow-up journey now feels more premium with a richer floating tracking card, a delivered-on-home feedback prompt, and a direct `Track Order` CTA on the order-success page
- Order progression notifications now include the packed stage as well, not only out-for-delivery and delivered
- Footer layout spacing was tightened by removing an extra phantom grid column and reducing overly wide gaps
- The global in-app toast now uses a softer premium notice style instead of the older plain dark bar treatment
- The floating order-update tracker is now more compact on mobile so delivery updates stay visible without covering too much page space
- My Account profile saving now rejects invalid full names and malformed emails instead of only checking empty values
- Mobile footer spacing is now tighter around the dock/footer handoff so the last section no longer leaves extra empty space on small screens
- Scroll restoration now runs only on the initial refresh/session restore, which prevents the random auto scroll up/down behavior that could happen while moving through app sections
- Account help/support popup backdrops now use the app’s blue-tinted premium overlay treatment instead of a flat dark backdrop
- The shared app shell now shows premium animated online/offline status popups so connectivity changes feel polished and product-native
- Shared product imagery is now more deterministic in fallback mode, especially for India catalog categories like rice, pulses, masala, biscuits, oral care, body care, snacks, cool drinks, feminine care, baby care, and home needs
- Cart feedback is now context-aware, so remove-from-cart actions no longer show a misleading `Go to Cart` CTA while add and move-to-cart actions still do
- `Browse All Categories` now closes on outside interaction, main-app scrolling, resize, and navigation, while staying open during genuine interaction inside the dropdown itself
- Refund and return requests now begin with explicit `Return Requested` or `Refund Requested` states before moving into review and later pickup/refund-processing stages
- Refund timelines now behave more like order tracking with visible requested, review, pickup, processing, and completed steps plus staged notification updates
- The mobile glass dock now hides correctly in refund tracking and return-request contexts so refund controls are not overlapped on small screens
- Rapid repeated taps on the Prime Basket header logo are now ignored so accidental double-clicks no longer force unwanted scroll-to-top behavior
- Re-entering category browsing now resets stale deal-discount filters instead of reopening with an old 0-10% discount state still applied
- Desktop `My Account` spacing is now denser so sidebar items, cards, headers, and controls fit larger screens more cleanly without looking oversized
- Clicking the Prime Basket logo while already on Home now safely no-ops instead of re-triggering a scroll-reset path
- Category filter resets now restore true full price and discount bounds rather than leaving a zeroed range that still acts like an active filter
- Fresh category entry now waits for the new category's real filter bounds before resetting state, which removes the lingering auto-applied `0-10% off` bug cleanly
- The Prime Basket brand action now uses a throttled button flow with double-click suppression so repeated logo taps do not trigger duplicate top-scroll jumps
- Desktop `My Account` no longer wraps section content inside an extra outer card or nested scroll panel, which removes duplicate vertical spacing and improves screen fit
- Desktop account spacing was tightened further across section padding, profile fields, menu cards, and action buttons for a more compact premium layout
- India fallback pricing strings were normalized again so rupee values render correctly instead of mojibake text when local data is used
- A page-level error boundary now protects major lazy-loaded page regions from blank-screen failures
- The app shell is now also wrapped by the shared error boundary so intermittent boot-time white-screen failures degrade safely instead of leaving a blank page
- Home and category product-list views now restore their previous products, filters, sort state, and scroll position when users return from product detail
- Product detail now includes a premium zoom flow with hover magnification, multi-image lightbox viewing, and touch-friendly mobile zoom gestures
- Product detail now keeps only one primary wishlist action instead of showing duplicate wishlist controls
- Shared home/category product rails were tightened slightly so cards fit better on laptop, tablet, and mobile screens without feeling cramped
- Core in-app toast styling now uses Prime Basket themed gradients, blur, and softer shadows instead of generic dark popup styling
- Refund tracking now uses a more order-tracking-style vertical progress rail with clearer active and completed stages
- Home and page-level skeleton loaders now better match the curated rail layout and premium card rhythm instead of falling back to overly generic placeholders
- Desktop header marketing/trust chips were removed so the shell focuses on location, browse, search, and account actions without wasting vertical space
- The fixed header offsets were corrected so the home hero/slideshow no longer starts behind the navbar on desktop or mobile
- The desktop `Browse All Categories` dropdown is now constrained to a smaller scrollable premium panel that stays inside the viewport
- Dark-mode header visuals were refined with clearer blue-tinted surfaces, stronger contrast, and compact action buttons
- Category entry now resets stale filters before paint, preventing the temporary `0-10%` discount auto-filter glitch when opening categories
- Notification dropdown layering was fixed so the panel floats above the second navbar/search row with its own internal scroll instead of being hidden under the header chrome
- Mobile country/language selection, notification dropdowns, and search suggestions now use full-header-aware top-layer offsets so they no longer open behind the mobile header or secondary navbar
- Home `Top Selling`, `Trending`, `Recently Added`, and `Top Rated` shelves now backfill from the full regional catalog so rails do not stop at only two or three products
- Home curated shelves now use smoother native horizontal scrolling with lighter snap behavior and safer mobile card sizing to prevent edge clipping
- Product unit selection is now product-type aware across cards and detail pages, so drinks show ml/L, rice shows kg bags, cleaning liquids show ml/L, toothpaste/baby powder show grams, and packs stay as packs
- Shared product-card unit selection now has better truncation, keyboard support, touch isolation, and viewport-aware dropdown positioning across Deals, home grids, category grids, and related products
- Cart rows now include product-aware unit selection, letting users switch pack/weight/volume directly from cart while prices and totals update
- Cart unit changes now merge duplicate product/unit lines safely instead of creating inconsistent rows
- Cart remove/decrement matching now normalizes display unit labels, fixing the last-item removal issue when only one cart row remains
- Mobile `Browse All Categories` now opens as a viewport-safe fixed dropdown sheet with internal scrolling instead of getting clipped by the second navbar
- Mobile home curated cards were tightened for better fit across narrow screens while preserving the premium rail/card look
- June 3 frontend QA confirmed `npm run lint` has `0 errors`, `npm run build` passes, and the generated `dist/` entry responds with HTTP 200 from a local static server
- Backend scaffolding is now ready to start in a separate `backend/` folder using the staged API plan documented in `docs/BACKEND.md`
- Desktop `My Account` now uses a more compact, aligned dashboard shell with tighter sidebar navigation, profile details, buttons, and dark-mode-safe account surfaces
- A follow-up desktop account fit pass removed the sidebar scroll trap and tightened order cards, order item rows, status chips, thumbnails, profile fields, and action buttons to reduce empty space on laptop and desktop screens
- Desktop `My Account` now uses a dedicated `v2` account rail so the signed-in identity card, scrollable menu, pinned logout footer, and right content area align more cleanly
- Mobile popups now use a global overlay safety layer so auth, address, rating, return/refund, category filters, product unit selection, lightbox, notification, language/country, search, cart-toast, and simple-toast surfaces stay above the header and bottom dock

## Tech Stack

- `React 18`
- `Vite 7`
- `ESLint 10`
- `@eslint/js`, `globals`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`
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

For frontend code-quality checks:

```bash
npm run lint
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
  Shared header, compact desktop command row, notification dropdown, search overlay, region/language UI, mobile drawer, dark-mode header polish, and browse-category dropdown behavior.

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
- Dedicated lint command now runs successfully with `0 errors`, with only known hook/Fast Refresh warnings remaining
- Stronger account/help/payment UX than the earlier baseline
- More production-like desktop account layout with reduced oversized spacing and clearer sidebar/content alignment
- More compact desktop account order/profile density with less wasted whitespace and no trapped left-menu scroll in normal desktop layouts
- More reliable mobile overlay stacking across portal modals, header dropdowns, toasts, and bottom-dock layouts
- Better dark-mode coverage across shared navigation and key account flows
- More polished checkout presentation and order-review flow
- More stable overlay/modal behavior in cart and account flows
- Better mobile bottom-dock/chatbot spacing and interaction
- Stronger account logout, wallet-entry, and OTP verification behavior
- Better desktop account confirmation visibility and light-mode wallet readability
- Reduced auth bootstrapping overhead and added more lazy image decoding in shared UI surfaces

What still needs work:

- Full backend integration
- Production-grade auth and payments
- Complete end-to-end QA on all devices
- More cleanup of inline page-level styles
- Review remaining hook-dependency and Fast Refresh warnings before final production release
- Final dark-mode consistency review across every subsection
- Manual real-device/browser QA outside this Windows sandbox, because local headless Chrome is blocked by access permissions here

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
- Added a glassmorphism bottom-dock navigation pattern for mobile home, category, product, cart, wishlist, and account flows
- Refined mobile dock sizing, chatbot spacing, and lower header action balance after visual QA
- Moved account logout through a confirmation dialog in mobile account-card navigation too
- Tightened wallet amount entry rules and improved wallet/refund light-mode readability
- Added OTP autofill and paste-friendly segmented verification handling
- Preserved home and category browsing state when navigating back from product detail so loaded products, filters, sort choices, and scroll position restore instead of refetching immediately
- Added a premium product-image preview flow on product detail with hover zoom, multi-image lightbox expansion, and mobile-friendly double-tap/pinch interactions
- Removed the duplicate wishlist CTA from the product-detail action row so the page keeps one clear primary wishlist control
- Reduced shared product-card and merchandising section spacing slightly so key storefront sections feel better balanced on 13-inch and 14-inch screens
- Reworked the main in-app toast styling so popup notices align more closely with Prime Basket gradients, blur, and premium glassmorphism direction
- Added the `npm run lint` quality gate and installed the required ESLint/React lint dependencies
- Cleaned lint errors across app, page, component, service, context, data, translation, and utility files so the current lint pass completes with `0 errors`
- Removed unused imports, props, stale local state, empty catch bindings, and duplicate translation keys that could hide future regressions
- Corrected UPI validation regex handling in both payment utilities and the payment page flow
- Revalidated the production build after the frontend hardening pass

## Backend Attachment Direction

To take this to production, attach the backend in a staged service-layer migration:

- Auth API
- Catalog API or validated Firebase access layer
- Cart API
- Checkout and order API
- Payment backend and webhook verification
- Notification service
- Chatbot proxy/backend

Detailed backend guidance is now available in [docs/BACKEND.md](./docs/BACKEND.md), with the full module-level implementation plan in [docs/BACKEND_Integration_Modeule.md](./docs/BACKEND_Integration_Modeule.md).

## Documentation

See the `docs` folder for detailed project documentation:

- [Manager Mail Update](./docs/Mail_Update.md)
- [Latest Daily Update](./docs/DAILY_UPDATE_2026-05-29.md)
- [Previous Daily Update](./docs/DAILY_UPDATE_2026-05-27.md)
- [Previous Daily Update](./docs/DAILY_UPDATE_2026-05-26.md)
- [Backend Readme](./docs/BACKEND.md)
- [Backend Systems And Cost Estimate](./docs/BACKEND_SYSTEMS_AND_COST_ESTIMATE.md)
- [Backend Integration Module](./docs/BACKEND_Integration_Modeule.md)
- [Application Overview](./docs/APPLICATION_OVERVIEW.md)
- [Tech Stack and Architecture](./docs/TECH_STACK_AND_ARCHITECTURE.md)
- [Backend Integration Guide](./docs/BACKEND_INTEGRATION_GUIDE.md)
- [Improvements and Gap Analysis](./docs/IMPROVEMENTS_AND_GAP_ANALYSIS.md)

## Current Validation

- `npm run build` passes
- `npm run lint` passes with `0 errors` and remaining warnings limited to hook-dependency/Fast Refresh architecture follow-ups
- Production metadata now targets `https://prime-basket.in`
- Category browsing, cart-item layout, shared product-card density, and all-products mode were updated and revalidated in the latest pass
- A focused code audit pass was completed on checkout, modal behavior, cart merging, chatbot currency handling, related-product/detail flows, and deployment-safe product-page behavior
- Mobile category filter popup mounting, pull-to-refresh behavior, and malformed image URL handling were stabilized in the latest pass
- Mobile dock/chatbot overlap, account logout confirmation, wallet amount validation, and OTP autofill behavior were improved in the latest pass
- Desktop logout confirmation rendering and OTP modal choice-card UI were finalized in the latest pass
- Region-aware India fallback catalog, search indexing, wishlist/cart merge behavior, and address-modal mobile dock suppression were finalized in the latest pass
- Locale selector consolidation, Kenya-English switching, home-only chatbot visibility, mobile dock/filter suppression, hero CTA routing, account `Buy Again`, and the latest `App.jsx` runtime crash fix were finalized in the latest pass
- A professional QA-style frontend audit was completed in the latest pass, including premium shell polish, India fallback image/data cleanup, shared image-resolution hardening, and page-level error-boundary protection
- The latest shell QA pass removed oversized desktop header chips, compacted the lower command row, fixed mobile/desktop hero offset, improved dark-mode header contrast, and stopped stale category discount filters from flashing on category entry
- The latest frontend hardening pass added ESLint, removed build-risk lint errors, cleaned duplicate translations, reduced unused code, and kept the production build green
- Backend documentation was refreshed with a canonical backend README, service-layer migration plan, endpoint map, localStorage migration map, validation rules, and production checklist
- The app is suitable as a strong frontend demo/prototype
- Final device-lab/browser QA and backend completion are still recommended before production use
- Local preview/browser smoke checks are still limited in this environment by Windows `spawn EPERM`, though production builds remain green
