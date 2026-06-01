# Application Overview

## What Prime Basket Is

Prime Basket is a mobile-first grocery ecommerce frontend built with React and Vite. It is designed to support a premium grocery shopping experience with:

- Home page product discovery
- Category browsing
- Product detail pages
- Cart and checkout flow
- Address management
- Account management
- Notifications
- Refund and wallet demo flows
- Region and language switching
- In-app chatbot support

Current production domain:

- `https://prime-basket.in`

## Current Product Shape

The current application behaves like a premium frontend demo or near-production storefront with strong UX work already completed. It is more advanced than a basic mockup because it includes:

- Real UI flow between pages
- Stateful cart and wishlist behavior
- Region-aware currency behavior
- Multi-section account area
- Order tracking simulation
- Payment flow simulation
- Reusable layout and header system
- Optional live catalog data from Firebase Realtime Database

## Countries, Languages, and Currencies

The frontend currently supports:

- `India` region
- `Kenya` region
- `English` language
- `Hindi` language
- `Telugu` language
- `Swahili` language

Important behavior:

- Phone-number login now auto-locks the region profile to `India` or `Kenya`
- India profiles now stay within India-valid languages and India-related products
- Kenya profiles now stay within Kenya-valid languages and Kenya-related products
- Desktop locale selection is now presented as one combined country-language control with flag emojis, matching the premium mobile direction more closely
- Users can still manually switch only within the valid language set for their active country
- Currency formatting is region-aware in major shopping flows

## Current Data Sources

The application currently mixes two catalog modes:

- `India` catalog: primarily Firebase Realtime Database driven, with an India-safe local fallback layer
- `Kenya` catalog: largely local fallback/static product data

Recent storefront hardening also added:

- region-aware fallback search indexing
- normalized cart merging by product + unit
- product-only wishlist display even if the product is already in cart
- context-aware cart feedback so remove actions no longer show cart-success CTAs
- mobile dock suppression while address-entry overlays are open
- mobile dock suppression during login/auth overlays and mobile category filter/sort sheets
- mobile dock suppression during refund tracking and return-request contexts
- home-only chatbot visibility instead of global page-wide launcher presence
- hero CTA routing from `Explore now` into the related category flow
- browse-category dropdown auto-dismissal on outside interaction while preserving internal dropdown scrolling
- compact desktop browse-category dropdown sizing so the category panel stays inside the viewport
- staged refund and return tracking with requested, review, pickup, refund-processing, and completed phases
- native mobile swipe-first curated home rails with scroll-snap behavior and synced shelf arrows
- full-shell error-boundary protection to reduce occasional blank-screen boot failures
- fresh category entry now resets stale filter state before paint, preventing the brief `0-10%` discount auto-filter flash
- notification dropdown layering now stays above the second navbar/search row and scrolls internally
- home curated shelves now backfill from the full active-region catalog so top-selling/trending/recently-added/top-rated rails do not end after only a few products
- product-aware unit selection now covers product cards, product detail, and cart rows
- cart unit switching now updates price/totals and merges duplicate product/unit rows safely
- cart remove/decrement matching now normalizes unit labels so the final cart item can always be removed
- mobile browse-category dropdown now opens as a viewport-safe fixed sheet instead of being clipped by header overflow
- mobile curated shelf cards now fit narrow screens more reliably without clipped edges
- a dedicated lint workflow through `npm run lint`, currently passing with `0 errors`
- frontend cleanup across unused imports/props/state, duplicate translation keys, payment validation regexes, and stale catch bindings

Other important state is currently stored in the browser through `localStorage`, including:

- User session
- Cart
- Wishlist
- Addresses
- Orders
- Notifications
- Refund requests
- Wallet
- Saved cards
- Reviews

## Current Strengths

- Strong premium UI direction
- Good mobile focus
- Buildable and navigable app
- Region-aware shopping foundation
- Good amount of user flow coverage
- Documentation and structure now clearer than before
- Category browsing is now denser and more catalog-focused, with compact cards and an all-products browsing mode
- Mobile cart and checkout presentation are more space-efficient than earlier revisions
- SEO, crawler-discovery, sitemap, geo, and structured metadata are now aligned to the production domain
- Public asset references are now route-safe, reducing broken-image risk on direct or nested entries
- Homepage catalog sections now fail over faster to fallback data instead of remaining in long skeleton states during slow live fetches
- Mobile glass bottom navigation is now integrated for key shopping/account flows with a lifted chatbot launcher and tighter dock sizing
- Account flows now include safer logout confirmation and stricter wallet top-up amount handling
- OTP verification UX now supports one-time-code autofill and smarter paste handling
- Desktop account logout now uses the same visible confirmation behavior as mobile
- The sign-in OTP flow now asks before auto-filling generated demo OTP values and presents the choice more clearly on mobile
- OTP send now dismisses the mobile keyboard for a smoother auth flow
- `Buy Again` now exists in `My Account` for quick reorders from previous purchases
- Desktop account logout now confirms correctly and no longer fails silently
- The shared storefront shell now has a more cohesive premium surface system, stronger mobile dock behavior, and page-level error-boundary protection
- The home curated shelves now use a more reliable real-device interaction model instead of a fragile custom drag path
- Refund tracking now reads more like order tracking, with clearer staged progress presentation
- India fallback catalog presentation is now more trustworthy because category-safe imagery is mapped directly in the fallback dataset instead of depending on misleading placeholders
- The shared header is now more compact on desktop, with unnecessary marketing chips removed and clearer location/browse/search hierarchy
- Dark-mode header surfaces now have stronger contrast, cleaner blue-tinted depth, and compact account action buttons
- Mobile and desktop hero offsets now better respect the fixed header so primary content is not hidden behind the navbar
- The latest hardening pass added ESLint coverage and removed current lint errors while keeping the production build green
- Shopping units now feel closer to real ecommerce behavior because pack, weight, and volume variants are inferred by product type instead of falling back to generic kg choices
- Cart editing is stronger because users can change both item count and unit/pack size directly from the cart

## Current Limitations

This is still not a fully production-backed commerce system yet. The main limitations are:

- Auth is frontend/session driven
- Cart and checkout are client-side state driven
- Orders and refunds are simulated
- Payment flow is demo-oriented
- Sensitive integrations should not stay fully client-side for production
- Some pages still rely on inline styles and demo data
- Remaining lint warnings should be reviewed as part of a deliberate hook-dependency/Fast Refresh cleanup instead of quick patching
- Live browser/device QA is still needed outside this sandbox because local preview startup is blocked here by Windows `spawn EPERM`

## Overall Quality Assessment

Current readiness by area:

- UI/UX quality: `Good`
- Mobile responsiveness: `Good`, with more visual QA still recommended
- Frontend architecture: `Moderate to good`, with lint now enforcing a cleaner baseline
- Backend integration readiness: `Ready to begin staged integration`
- Production readiness: `Partial`, not complete

## Best Next Product Step

The best next step is to convert the app from a strong frontend demo into a properly backed application by following [BACKEND.md](./BACKEND.md) and attaching:

- Real authentication APIs
- Real cart/order APIs
- Real payment processing
- Real notification delivery
- Real chatbot proxy/backend

The backend documentation now includes the recommended frontend service layer, endpoint groups, localStorage migration map, validation rules, environment variables, and production checklist.
