# Daily Update - 2026-05-15

## Completed Today

- Added a dedicated India fallback catalog in `src/data/india_products.js`
- Made `catalogFallback` region-aware for India and Kenya
- Made shared search fallback indexing region-aware in `src/hooks/useSearch.js`
- Updated `HomePage` fallback sections to use the active region instead of Kenya-only fallback products
- Updated `CategoryPage` fallback catalog paths to respect the active region
- Updated cart special-deals fallback lookup to use the active region
- Normalized cart unit keys before cart merging to reduce duplicate line items
- Stripped quantity-specific state from wishlist persistence so wishlist remains product-only
- Simplified wishlist UI so it no longer shows cart-style quantity controls
- Hid the mobile dock while reusable address-entry overlays are open
- Added a combined desktop locale selector with flag emojis and country-valid language choices only
- Restored `Hindi` as an India language option and kept Kenya restricted to `English` + `Swahili`
- Fixed Kenya users switching back to `English` without the app forcing `Swahili`
- Routed hero `Explore now` to the matching category flow and removed the manual hero arrows
- Removed decorative section-heading divider lines for cleaner premium section headers
- Restricted the chatbot launcher to home only and kept it above the mobile dock
- Hid the mobile dock while login/auth overlays and mobile category filter/sort sheets are open
- Improved the mobile dock with a cleaner vertical entry animation and stronger active-button feedback
- Added `Buy Again` to `My Account` for quick reorder cards
- Made `Select address to continue` open address entry directly when no saved address exists
- Dismissed the mobile keyboard after `Send OTP`
- Fixed desktop logout confirmation rendering in `My Account`
- Fixed the latest `App.jsx` crash caused by an effect referencing `page` before the navigation state existed
- Synced README and docs with the full May 15 region/cart/wishlist/locale/overlay/runtime fixes

## Validation

- `npm run build` passes

## Notes

- A local preview/browser verification attempt still fails in this environment because the Windows sandbox blocks preview startup with `spawn EPERM`.
- Kenya region behavior remained intact while India fallback/search behavior, locale selection, account logout handling, and overlay behavior were corrected.
