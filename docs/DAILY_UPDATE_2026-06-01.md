# Daily Update - 2026-06-01

## Summary

Completed a focused frontend hardening pass for Prime Basket covering notification layering, home curated shelves, product-aware quantity/unit options, cart unit editing, mobile category browsing, and documentation updates.

## Completed Work

- Fixed notification dropdown stacking so it no longer appears under the second navbar/search row.
- Added better notification panel sizing, spacing, and internal scrolling for large notification lists.
- Corrected mobile top-layer offsets for country/language selection, notifications, and search suggestions so these panels open below the full header stack instead of being hidden behind the header or secondary navbar.
- Added special mobile overlay offsets for normal pages, pages with the delivery-location bar, and category pages where the second navbar is hidden.
- Expanded home curated rails so `Top Selling`, `Trending`, `Recently Added`, and `Top Rated` are filled from the full active-region catalog when their primary category bucket has too few products.
- Improved home shelf side scrolling with native horizontal scroll, lighter scroll-snap behavior, and safer mobile rail measurements.
- Tightened mobile curated card sizing, padding, title sizing, and rail overflow handling so product cards fit better on narrow devices.
- Improved product-aware unit inference for product cards and product detail.
- Added realistic unit options by product type:
  - rice and flour use kg bag options
  - drinks use ml/L options
  - cleaning liquids use ml/L options
  - toothpaste and baby powder use gram options
  - diapers, biscuits, chips, instant food, and similar items use pack options
- Added unit selection directly in cart rows so users can change pack, weight, or volume without leaving the cart.
- Updated cart unit switching so item price, old price, line total, and order totals update when the selected unit changes.
- Added safe duplicate merging when a cart unit change targets a product/unit combination already present in cart.
- Fixed the final cart-item removal/decrement issue by normalizing incoming unit labels before cart-row matching.
- Fixed mobile `Browse All Categories` dropdown visibility by converting it into a viewport-safe fixed sheet with internal scrolling.
- Updated the main README and docs to reflect the latest frontend behavior.

## Files Updated

- `README.md`
- `docs/APPLICATION_OVERVIEW.md`
- `docs/TECH_STACK_AND_ARCHITECTURE.md`
- `docs/IMPROVEMENTS_AND_GAP_ANALYSIS.md`
- `docs/Mail_Update.md`
- `docs/DAILY_UPDATE_2026-06-01.md`
- `src/App.jsx`
- `src/components/ProductCard.jsx`
- `src/pages/HomePage.jsx`
- `src/pages/ProductDetailPage.jsx`
- `src/pages/CartPage.jsx`
- `src/utils/productUtils.js`
- `public/style.css`

## Validation

- `npm run build` passes successfully.
- Targeted ESLint checks on touched frontend files report `0 errors`.
- A follow-up production build also passes after the mobile overlay offset correction.
- Existing hook-dependency warnings remain and should be handled separately as part of a deliberate architecture cleanup.

## Remaining Notes

- Real-device QA is still recommended for mobile browse dropdown behavior and shelf swiping.
- Backend integration is still required for production authentication, catalog ownership, cart/order persistence, payments, notifications, and refund lifecycle ownership.
