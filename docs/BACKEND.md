# Backend README

## Current Decision

Prime Basket is ready to start backend integration now.

The frontend already has working flows for home discovery, category browsing, product detail, cart, wishlist, checkout, account, order tracking, refunds, notifications, region/language behavior, and chatbot UI. The remaining production gap is that many of these flows still use Firebase reads, local fallback data, and `localStorage` instead of a real backend-owned commerce system.

Production release should wait until these backend-owned systems are complete:

- Real authentication and session refresh
- Region-safe catalog API
- Persistent cart and wishlist APIs
- Address, checkout, order, and payment APIs
- Payment webhook verification
- Refund and return workflow persistence
- Notification delivery and read-state sync
- Chatbot backend proxy so AI keys are not exposed in the browser

## Canonical Backend Docs

- Detailed module guide: [BACKEND_Integration_Modeule.md](./BACKEND_Integration_Modeule.md)
- Backend systems and cost estimate: [BACKEND_SYSTEMS_AND_COST_ESTIMATE.md](./BACKEND_SYSTEMS_AND_COST_ESTIMATE.md)
- Older high-level guide retained for compatibility: [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md)
- Architecture context: [TECH_STACK_AND_ARCHITECTURE.md](./TECH_STACK_AND_ARCHITECTURE.md)

## Recommended Integration Approach

Do not add raw `fetch()` calls directly inside page components. Add a service layer first, then migrate each domain one by one.

Recommended frontend service files:

- `src/services/apiClient.js`
- `src/services/authApi.js`
- `src/services/catalogApi.js`
- `src/services/cartApi.js`
- `src/services/wishlistApi.js`
- `src/services/addressApi.js`
- `src/services/checkoutApi.js`
- `src/services/orderApi.js`
- `src/services/paymentApi.js`
- `src/services/walletApi.js`
- `src/services/refundApi.js`
- `src/services/notificationApi.js`
- `src/services/chatApi.js`

Recommended starting API client:

```js
import { fetchWithTimeout, parseJsonResponse } from "../utils/network";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
  }

  return data;
}
```

Later improvements:

- Refresh-token retry for `401`
- Request IDs
- Safe retry for idempotent `GET` calls
- Backend error-code mapping for premium UI messages

## Environment Variables

Frontend:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Production frontend:

```env
VITE_API_BASE_URL=https://api.prime-basket.in
```

Keep Firebase variables only while the frontend still reads Firebase directly:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Move these behind the backend before production:

```env
VITE_GROQ_API_KEY=
VITE_GROQ_API_URL=
VITE_GROQ_MODEL=
```

Backend-only secrets should never use `VITE_`:

- OTP provider secret
- Payment provider secret
- Payment webhook secret
- Groq/OpenAI/AI provider key
- Firebase Admin credentials
- JWT signing secret
- Database connection string

## Endpoint Map

### Auth

- `POST /api/auth/send-phone-otp`
- `POST /api/auth/verify-phone-otp`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/users/me`

Frontend files to update:

- `src/components/PhoneAuthModal.jsx`
- `src/context/AuthContext.jsx`
- `src/App.jsx`

### Catalog And Search

- `GET /api/catalog/home?region=in&language=en`
- `GET /api/catalog/categories?region=in`
- `GET /api/catalog/categories/:category/products?region=in&page=1&limit=24`
- `GET /api/catalog/products/:productId?region=in`
- `GET /api/catalog/products/:productId/related?region=in`
- `GET /api/search?q=rice&region=in&language=en`

Frontend files to update:

- `src/pages/HomePage.jsx`
- `src/pages/CategoryPage.jsx`
- `src/pages/ProductDetailPage.jsx`
- `src/components/SearchBox.jsx`
- `src/utils/productUtils.js`

### Cart And Wishlist

- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:lineId`
- `DELETE /api/cart/items/:lineId`
- `POST /api/cart/merge`
- `GET /api/wishlist`
- `POST /api/wishlist/items`
- `DELETE /api/wishlist/items/:productId`
- `POST /api/wishlist/items/:productId/move-to-cart`

Frontend files to update:

- `src/App.jsx`
- `src/pages/CartPage.jsx`
- `src/pages/WishlistPage.jsx`
- shared product-card components that call cart/wishlist actions

### Addresses, Checkout, Orders, And Payments

- `GET /api/addresses`
- `POST /api/addresses`
- `PATCH /api/addresses/:addressId`
- `DELETE /api/addresses/:addressId`
- `POST /api/checkout/quote`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:orderId`
- `GET /api/orders/:orderId/tracking`
- `POST /api/orders/:orderId/reorder`
- `POST /api/payments/session`
- `POST /api/payments/confirm`

Payment provider webhooks must be backend-only.

Frontend files to update:

- `src/pages/CartPage.jsx`
- `src/pages/PaymentPage.jsx`
- `src/pages/OrderSuccessPage.jsx`
- `src/pages/OrderTrackingPage.jsx`
- `src/pages/OrderDetailPage.jsx`
- `src/context/TrackingContext.jsx`

### Wallet, Refunds, Notifications, And Chat

- `GET /api/wallet`
- `POST /api/wallet/top-up`
- `GET /api/wallet/transactions`
- `POST /api/refunds`
- `GET /api/refunds`
- `GET /api/refunds/:requestId`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `POST /api/notifications/read-all`
- `DELETE /api/notifications/:id`
- `POST /api/chat`

Frontend files to update:

- `src/pages/AccountPage.jsx`
- `src/components/Header.jsx`
- `src/services/groqService.js`
- `src/context/TrackingContext.jsx`

## LocalStorage Migration Map

These keys should move to backend ownership:

- `user`
- `accessToken`
- `refreshToken`
- `pb_cart`
- `pb_wishlist`
- `pb_orders`
- `pb_notifications`
- `pb_saved_addresses`
- `wallet`
- `refund_requests`
- `pb_refunds`
- `pb_saved_cards`
- `pb_gift_cards`
- `pb_order_reviews`
- `pb_active_tracking`

These can stay local as UI preferences:

- `pb_lang`
- `pb_region`
- `pb_theme`
- page navigation cache
- scroll/session restoration cache

## Safe Migration Order

1. Add `apiClient.js` and domain service files.
2. Connect phone auth and `/api/auth/me`.
3. Connect catalog APIs while keeping current Firebase/local fallback active.
4. Connect cart and wishlist, including guest cart merge after login.
5. Connect address and checkout quote APIs.
6. Connect payment session/confirmation and order creation.
7. Connect order history and tracking.
8. Connect refunds, wallet, notifications, and review/rating flows.
9. Move chatbot AI calls behind `/api/chat`.
10. Remove demo/localStorage ownership only after each backend domain is stable.

## Backend Validation Rules

Backend must validate:

- Phone country and digit length
- Region/language compatibility
- Product belongs to selected region
- Unit exists for product
- Stock availability
- Cart quantity limits
- Address required fields
- India/Kenya postal-code formats
- Checkout total from server-side pricing
- Payment amount against backend quote
- Wallet balance before debit
- Refund eligibility and order status
- Proof upload file type and size

## Production Checklist

- Use HTTPS only in production.
- Add CORS allowlist for `https://prime-basket.in`, `http://localhost:5173`, and `http://localhost:4173`.
- Verify payment webhooks server-side.
- Use short-lived access tokens and refresh-token rotation.
- Add OTP, checkout, payment, and chatbot rate limits.
- Do not trust frontend prices, discounts, cart totals, or wallet deductions.
- Add server logs, audit logs, and error monitoring.
- Add database backups.
- Add real-device QA for mobile Chrome, mobile Safari, desktop Chrome, and desktop Edge.

## Final Recommendation

Start backend integration now, but keep the current frontend fallbacks during migration. The safest path is to attach one backend domain at a time and remove demo/localStorage behavior only after the matching backend feature is verified.
