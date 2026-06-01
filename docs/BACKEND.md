# Backend Documentation Index

Prime Basket has several backend planning documents, but they now have separate responsibilities. Start here, then open only the document needed for the current task.

## Current Backend Status

The frontend is ready to begin staged backend integration. It already has working UI flows for region/language selection, catalog browsing, product detail, product-aware unit selection, cart unit/quantity editing, wishlist, checkout, account, order tracking, refunds, notifications, and chatbot interactions.

The production gap is that many flows still rely on Firebase reads, local fallback data, frontend demo state, and `localStorage`. A real backend should own authentication, catalog, cart, wishlist, address, checkout, orders, payments, refunds, notifications, admin operations, and chatbot proxying.

## Which Backend Doc To Use

- [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md): Frontend-to-backend migration guide, service files, API groups, localStorage replacement, validation rules, and QA checklist.
- [BACKEND_IMPLEMENTATION_PLAN.md](./BACKEND_IMPLEMENTATION_PLAN.md): Full backend build plan, module phases, estimated days, database tables, and production rollout checklist.
- [BACKEND_SYSTEMS_AND_COST_ESTIMATE.md](./BACKEND_SYSTEMS_AND_COST_ESTIMATE.md): Recommended providers, infrastructure options, payment/OTP/notification systems, and rough cost planning.
- [TECH_STACK_AND_ARCHITECTURE.md](./TECH_STACK_AND_ARCHITECTURE.md): Current frontend architecture context.
- [BACKEND_Integration_Modeule.md](./BACKEND_Integration_Modeule.md): Legacy typo-named redirect kept only so old links do not break.

## Recommended Backend Direction

Use a staged migration. Do not replace every demo/local frontend flow at once.

Recommended first milestone:

- Real phone OTP auth and session refresh.
- Backend user profile and preferences.
- Region-safe catalog API for India and Kenya.
- Persistent cart and wishlist APIs.
- Backend address book and checkout quote.
- Product/SKU unit metadata for pack, kg, gram, ml, litre, and count-based variants so the frontend cart/detail selectors can be backed by real catalog data.

After that, move into:

- Payment webhooks.
- Orders and tracking.
- Refund and return workflow.
- Notifications.
- Admin operations.
- Chatbot backend proxy.

## Required Frontend Environment Variable

Local backend:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Production backend:

```env
VITE_API_BASE_URL=https://api.prime-basket.in
```

Sensitive keys such as payment secrets, OTP secrets, and `GROQ_API_KEY` must move to the backend before production release.

## Production Readiness Summary

Prime Basket should not be treated as production-ready for real customer payments until these backend systems are complete:

- Real authentication and session handling.
- Backend-owned catalog, stock, prices, and image metadata.
- Persistent cart, wishlist, address, and profile data.
- Backend checkout quote and order creation.
- Payment provider webhook verification.
- Refund/return persistence and admin review.
- In-app/SMS/email/push notification sync.
- Backend chatbot proxy.
- Monitoring, logging, rate limiting, and security validation.

## Validation Note

Latest frontend state before backend integration:

- `npm run build` passes.
- Latest targeted ESLint checks on touched frontend files report `0 errors`; remaining warnings are known hook/Fast Refresh follow-ups.
- June 1 frontend hardening added richer home merchandising rails, notification overlay fixes, mobile browse-category fixes, product-aware unit options, cart unit switching, and safer final-item cart removal.
