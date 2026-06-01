# Backend Integration Guide

This is the single frontend-to-backend integration guide for Prime Basket. Use it when wiring the current React/Vite frontend to real backend APIs.

For backend build phases and timelines, use [BACKEND_IMPLEMENTATION_PLAN.md](./BACKEND_IMPLEMENTATION_PLAN.md). For provider choices and costs, use [BACKEND_SYSTEMS_AND_COST_ESTIMATE.md](./BACKEND_SYSTEMS_AND_COST_ESTIMATE.md).

## Integration Principle

Do not add direct `fetch()` calls inside page components. Add a service layer first, then migrate one domain at a time while keeping existing fallbacks during the transition.

Recommended service files:

- `src/services/apiClient.js`
- `src/services/authApi.js`
- `src/services/catalogApi.js`
- `src/services/cartApi.js`
- `src/services/wishlistApi.js`
- `src/services/addressApi.js`
- `src/services/checkoutApi.js`
- `src/services/orderApi.js`
- `src/services/paymentApi.js`
- `src/services/refundApi.js`
- `src/services/notificationApi.js`
- `src/services/chatApi.js`

## Environment Variables

Local:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Production:

```env
VITE_API_BASE_URL=https://api.prime-basket.in
```

Keep Firebase frontend variables only while the frontend still reads Firebase catalog data directly. Move sensitive provider keys behind backend APIs before production.

## API Client Pattern

Create `src/services/apiClient.js`:

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

## API Groups To Add

### Auth

- `POST /auth/send-otp`
- `POST /auth/verify-otp`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

Frontend areas:

- `src/context/AuthContext.jsx`
- `src/components/PhoneAuthModal.jsx`

### Catalog

- `GET /catalog/home?country=IN`
- `GET /catalog/categories?country=IN`
- `GET /catalog/products?country=IN&category=rice`
- `GET /catalog/products/:id`
- `GET /catalog/products/:id/related`

Frontend areas:

- `src/pages/HomePage.jsx`
- `src/pages/CategoryPage.jsx`
- `src/pages/ProductDetailPage.jsx`
- `src/components/SearchBox.jsx`
- `src/utils/productUtils.js`

### Cart

- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/:itemId`
- `DELETE /cart/items/:itemId`
- `POST /cart/quote`

Frontend areas:

- `src/App.jsx`
- `src/pages/CartPage.jsx`
- `src/components/ProductCard.jsx`

Important cart payload notes:

- Cart items should include a stable product ID and variant/unit ID when the backend owns catalog data.
- Until variant IDs exist, the frontend currently uses `selectedUnit` labels such as `1kg`, `500ml`, `1L`, or `1 pack`.
- Backend cart APIs should support quantity changes and unit/variant changes without creating duplicate rows.
- If a user changes a cart item to a unit/variant already present in cart, the backend should merge quantities just like the frontend now does.

### Wishlist

- `GET /wishlist`
- `POST /wishlist/items`
- `DELETE /wishlist/items/:productId`
- `POST /wishlist/items/:productId/move-to-cart`

Frontend areas:

- `src/App.jsx`
- `src/pages/WishlistPage.jsx`
- `src/components/ProductCard.jsx`

### Address And Checkout

- `GET /addresses`
- `POST /addresses`
- `PATCH /addresses/:id`
- `DELETE /addresses/:id`
- `POST /checkout/quote`
- `POST /checkout/start`

Frontend areas:

- `src/components/AddressModal.jsx`
- `src/pages/CartPage.jsx`
- `src/pages/PaymentPage.jsx`

### Orders And Tracking

- `GET /orders`
- `GET /orders/:id`
- `GET /orders/:id/tracking`
- `POST /orders/:id/buy-again`
- `POST /orders/:id/rating`

Frontend areas:

- `src/pages/AccountPage.jsx`
- `src/pages/OrderSuccessPage.jsx`
- `src/pages/OrderTrackingPage.jsx`
- `src/pages/OrderDetailPage.jsx`
- `src/pages/RateOrderPage.jsx`
- `src/context/TrackingContext.jsx`

### Payments

- `POST /payments/razorpay/create-order`
- `POST /payments/razorpay/verify`
- `POST /payments/razorpay/webhook`
- `POST /payments/mpesa/stk-push`
- `POST /payments/mpesa/callback`

Frontend area:

- `src/pages/PaymentPage.jsx`

Important rule: frontend payment success must not finalize an order by itself. The backend must verify payment webhooks/signatures.

### Refunds And Returns

- `POST /returns`
- `GET /returns`
- `GET /returns/:id`
- `POST /returns/:id/proofs`
- `PATCH /returns/:id/status`

Frontend areas:

- `src/pages/AccountPage.jsx`
- `src/pages/OrderDetailPage.jsx`

### Notifications

- `GET /notifications`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `DELETE /notifications/:id`
- `DELETE /notifications/clear-read`

Frontend areas:

- `src/App.jsx`
- `src/components/Header.jsx`
- `src/components/TrackingPopup.jsx`

### Chatbot Proxy

- `POST /ai/chat`
- `POST /ai/product-suggestions`

Frontend areas:

- `src/services/groqService.js`
- `src/components/ChatbotWidget.jsx`
- `src/components/ChatbotPage.jsx`

## LocalStorage Migration Map

- `auth/session`: move to backend tokens and `/auth/me`.
- `cart`: move to `/cart`.
- `wishlist`: move to `/wishlist`.
- `orders`: move to `/orders`.
- `addresses`: move to `/addresses`.
- `notifications`: move to `/notifications`.
- `refunds/returns`: move to `/returns`.
- `wallet`: move to backend wallet ledger if wallet remains in scope.
- region/language preferences: move to user preferences after login, keep guest fallback locally.

## Safe Migration Order

1. Add `apiClient.js` and domain API files.
2. Connect auth and profile while keeping current UI.
3. Connect catalog reads with Firebase/local fallback preserved.
4. Connect cart and wishlist APIs with optimistic UI.
5. Connect addresses and checkout quote.
6. Connect payments through backend-created payment orders and webhooks.
7. Connect order history and tracking.
8. Connect refunds/returns and notifications.
9. Move chatbot calls behind backend proxy.
10. Remove obsolete demo persistence after API parity is confirmed.

## Validation Rules Backend Must Own

- Verify user session on protected APIs.
- Detect country from phone/profile and enforce region-safe catalog results.
- Never trust frontend prices, discounts, stock, delivery fee, or tax.
- Validate cart item IDs, units, quantity, stock, and active price before checkout.
- Validate address fields by country.
- Verify payment signatures and webhook events.
- Validate refund eligibility, reason, proof files, and status transitions.
- Rate-limit OTP, auth, payment, upload, and chatbot endpoints.

## Production QA Checklist

- India and Kenya login flows work with correct catalog and language behavior.
- Guest logout returns to guest storefront context.
- Catalog products, prices, images, units, and stock match backend data.
- Cart and wishlist survive refresh and login.
- Checkout quote matches final order amount.
- Payment success/failure/cancelled states are backend-confirmed.
- Orders, tracking, ratings, buy-again, refunds, and notifications persist.
- Mobile overlays, dock, chatbot, keyboard, and sheets do not overlap.
- Sentry/log monitoring shows no release-blocking runtime errors.

## First Production Beta Minimum

Do not ship real checkout until these are complete:

- Auth/OTP.
- Region-safe catalog.
- Cart/wishlist.
- Addresses.
- Checkout quote.
- Payment webhook verification.
- Order persistence.
- Basic notifications.
- Error monitoring.
