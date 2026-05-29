# Prime Basket Update

Date: 2026-05-27

This update covers the latest May 26 and May 27 frontend work focused on premium header compatibility, category browsing stability, dark-mode polish, and documentation cleanup.

- Reviewed the shared header direction and identified the remaining shell issues that were making the desktop header feel oversized.
- Removed unnecessary desktop header marketing chips such as `Prime Basket premium`, `Quick doorstep delivery`, `Fresh regional catalog`, `Fast delivery`, and `Fresh guarantee`.
- Compacted the desktop header and lower command row so the app gives more space back to product discovery and the home hero.
- Fixed mobile and desktop header offsets so the slideshow/hero content no longer starts behind the fixed navbar.
- Constrained the desktop `Browse All Categories` dropdown so it stays inside the viewport and uses a smaller scrollable premium panel.
- Rebalanced the command row to reduce empty left/right space and align location, browse, and search controls more naturally.
- Improved dark-mode header visuals with blue-tinted premium surfaces, stronger contrast, better borders, and more readable search/location/browse controls.
- Reduced the Notifications, Wishlist, Basket, and Account desktop action cluster so the buttons no longer overflow the header in dark mode.
- Fixed the category-opening glitch where a stale `0-10%` discount filter could briefly auto-apply before the page normalized.
- Updated category filter initialization so fresh category entry resets filters before paint and range clamping waits until real products are loaded.
- Preserved existing restore behavior for returning from product detail while preventing stale filters on normal category entry.
- Added a canonical `docs/BACKEND.md` backend README so the project now has a clean starting point for backend integration.
- Expanded backend documentation with the recommended frontend service layer, domain API files, endpoint map, localStorage migration plan, validation rules, environment variables, and production checklist.
- Added `docs/BACKEND_SYSTEMS_AND_COST_ESTIMATE.md` with recommended backend providers, cloud/database/payment/OTP/notification/AI systems, API modules, and practical monthly cost ranges for demo, beta, early production, and growth stages.
- Connected the main README and documentation index to the detailed backend module file so backend handoff information is easier to find.
- Added separate daily update files for May 26 and May 27.
- Updated README, application overview, architecture notes, and improvement/gap analysis docs with the latest shell and category stability work.

Validation:

- `npm run build` passes successfully after the latest changes.
- Backend documentation updates are docs-only and do not require another build.
- Local visual preview is still blocked in this environment by the Windows `spawn EPERM` preview-server limitation, so final real-browser visual QA is still recommended outside the sandbox.
