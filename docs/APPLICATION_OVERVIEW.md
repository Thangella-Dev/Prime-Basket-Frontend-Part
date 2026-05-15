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
- mobile dock suppression while address-entry overlays are open
- mobile dock suppression during login/auth overlays and mobile category filter/sort sheets
- home-only chatbot visibility instead of global page-wide launcher presence
- hero CTA routing from `Explore now` into the related category flow

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

## Current Limitations

This is still not a fully production-backed commerce system yet. The main limitations are:

- Auth is frontend/session driven
- Cart and checkout are client-side state driven
- Orders and refunds are simulated
- Payment flow is demo-oriented
- Sensitive integrations should not stay fully client-side for production
- Some pages still rely on inline styles and demo data

## Overall Quality Assessment

Current readiness by area:

- UI/UX quality: `Good`
- Mobile responsiveness: `Good`, with more visual QA still recommended
- Frontend architecture: `Moderate to good`
- Backend integration readiness: `Moderate`
- Production readiness: `Partial`, not complete

## Best Next Product Step

The best next step is to convert the app from a strong frontend demo into a properly backed application by attaching:

- Real authentication APIs
- Real cart/order APIs
- Real payment processing
- Real notification delivery
- Real chatbot proxy/backend
