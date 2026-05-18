# Prime Basket Update

Date: 2026-05-15

Today's work covered regional storefront correctness, locale-selector UX, cart and wishlist hardening, mobile dock/chat interactions, checkout overlay polish, account improvements, and final runtime stabilization.

- Added an India-safe local fallback catalog so India users no longer see Kenya-only products when live catalog data is unavailable.
- Updated shared catalog fallback helpers and shared search fallback indexing to respect the active region instead of leaking Kenya products into India.
- Strengthened phone-region behavior so signed-in India and Kenya users stay aligned to their valid product and language profiles.
- Reworked locale selection so desktop now uses one combined premium country-language control with flag emojis and only valid languages for the active country.
- Added `Hindi` back to India language options and kept Kenya restricted to `English` plus `Swahili`.
- Fixed Kenya users switching from `Swahili` back to `English` without the app re-forcing the region default language.
- Normalized cart line merging by product plus normalized unit key, reducing duplicate cart rows for repeated adds of the same item.
- Kept wishlist storage product-only so cart quantity state does not leak into wishlist behavior.
- Simplified wishlist cards so they always show a clean add-to-cart action instead of cart-style quantity controls.
- Preserved the existing move-to-cart behavior from wishlist, where the wishlist item is removed immediately after adding to cart.
- Added `Buy Again` to `My Account` so previous order items can be reordered individually.
- Made checkout `Select address to continue` open address entry directly when the user has no saved address.
- Hid the mobile glass bottom dock while address-entry overlays, login/auth overlays, and mobile category filter/sort sheets are open.
- Adjusted the mobile glass dock with smoother vertical entry animation, stronger tap feedback, and slightly larger touch targets.
- Restricted the chatbot launcher to home only and kept it lifted above the mobile dock.
- Routed home hero `Explore now` actions to the related category flow for the active slide and removed the manual hero arrows.
- Removed decorative heading divider lines such as the line after `Popular Products` for a cleaner premium UI.
- Improved OTP flow by dismissing the mobile keyboard after `Send OTP`, supporting segmented autofill/paste, and keeping auto-fill as an explicit user choice.
- Fixed desktop account logout confirmation so the confirm dialog renders correctly instead of failing silently.
- Fixed the latest `App.jsx` runtime crash caused by reading `page` before navigation-state initialization.
- Updated README, daily update, application overview, architecture, and gap-analysis docs to reflect all May 15 changes.

Validation:

- `npm run build` passes successfully after the latest changes.
- A code-level audit pass was completed across home, category, cart, wishlist, locale selection, account, auth, and shared fallback/search flows.
- A preview/browser smoke check was attempted, but local Windows sandbox/process restrictions still block a usable preview session with `spawn EPERM`.
