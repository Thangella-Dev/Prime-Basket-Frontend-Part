# Backend Integration Guide

## Documentation Role

This is the detailed backend integration module. For the short project entry point and handoff summary, start with [BACKEND.md](./BACKEND.md). Keep this file as the deeper implementation reference for endpoint contracts, frontend file ownership, localStorage migration, validation, security, and QA.

## Current Status

Prime Basket is ready to start backend integration now.

The frontend has working shopping, account, cart, wishlist, checkout, order, refund, notification, region, language, and chatbot flows. Most of these flows are still powered by a mix of Firebase reads, local fallback data, and browser `localStorage`. The backend work should replace those demo/client-only storage paths one domain at a time.

Important release note:

- Backend integration can start now.
- Final production release should wait until real auth, payments, order persistence, security rules, and device QA are complete.

## Recommended Backend Architecture

Use any production backend stack your team prefers. Good fits:

- `Node.js + Express`
- `NestJS`
- `FastAPI`
- `Firebase Functions`
- `Next.js API routes`

Recommended production backend modules:

- Auth and session
- User profile
- Catalog and search
- Cart
- Wishlist
- Addresses
- Checkout quote
- Payments and webhooks
- Orders and tracking
- Refunds and returns
- Wallet
- Notifications
- Chatbot/AI proxy

## Environment Variables

Frontend already supports:

```env
VITE_API_BASE_URL=http://localhost:8080
```

For production:

```env
VITE_API_BASE_URL=https://api.prime-basket.in
```

Keep these only if the frontend still reads Firebase directly:

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

Do not keep sensitive provider keys in frontend variables:

```env
# Move these behind backend proxy before production
VITE_GROQ_API_KEY=
VITE_GROQ_API_URL=
VITE_GROQ_MODEL=
```

## Frontend Service Layer To Add

Add a proper API layer before replacing page logic directly.

### Add `src/services/apiClient.js`

Purpose:

- centralize `VITE_API_BASE_URL`
- attach auth token
- parse JSON
- handle refresh-token retry
- normalize backend errors
- keep fetch timeout behavior

Suggested shape:

```js
import { fetchWithTimeout, parseJsonResponse } from "../utils/network";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
  }

  return data;
}
```

Later improvement:

- add `refreshToken()` handling for `401`
- add request IDs
- add telemetry
- add retry for safe GET requests

### Add Domain API Files

Create these files under `src/services/`:

- `authApi.js`
- `catalogApi.js`
- `cartApi.js`
- `wishlistApi.js`
- `addressApi.js`
- `checkoutApi.js`
- `orderApi.js`
- `paymentApi.js`
- `walletApi.js`
- `refundApi.js`
- `notificationApi.js`
- `chatApi.js`

Do not put raw `fetch()` calls directly inside pages after backend integration begins.

## Backend API Contract

Use `/api` prefix consistently.

### Auth

Endpoints:

- `POST /api/auth/send-phone-otp`
- `POST /api/auth/verify-phone-otp`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Send OTP request:

```json
{
  "phone": "+918519913550",
  "purpose": "LOGIN"
}
```

Verify OTP response:

```json
{
  "user": {
    "id": "user_123",
    "name": "Nikhil",
    "phone": "+918519913550",
    "country": "IN",
    "region": "in",
    "language": "en"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

Frontend files:

- `src/components/PhoneAuthModal.jsx`
- `src/context/AuthContext.jsx`
- `src/App.jsx`

Current state:

- `PhoneAuthModal.jsx` already calls `POST /api/auth/send-phone-otp` and `POST /api/auth/verify-phone-otp`.
- It falls back to demo OTP when the backend is unavailable.

Backend integration work:

- Keep the same endpoint names to avoid large frontend changes.
- Return `user`, `accessToken`, and `refreshToken`.
- In `AuthContext.jsx`, add `GET /api/auth/me` bootstrapping so frontend does not rely only on saved localStorage user data.
- In `App.jsx`, keep region/language enforcement but trust backend `user.country`, `user.region`, and `user.language` after login.

### Catalog

Endpoints:

- `GET /api/catalog/home?region=in&language=en`
- `GET /api/catalog/categories?region=in`
- `GET /api/catalog/categories/:category?region=in&page=1&limit=24&sort=default`
- `GET /api/catalog/products/:productId?region=in`
- `GET /api/catalog/search?q=rice&region=in&language=en`
- `GET /api/catalog/products/:productId/related?region=in`

Product shape:

```json
{
  "id": "in_r_001",
  "_uid": "in_r_001",
  "name": "Daawat Basmati Rice",
  "brand": "Daawat",
  "category": "rice",
  "_cat": "rice",
  "price": 220,
  "oldPrice": 253,
  "currency": "INR",
  "standard": "1kg",
  "imageUrl": "/assets/redrice.png",
  "images": ["/assets/redrice.png"],
  "units": [
    { "label": "1kg", "price": 220, "oldPrice": 253, "unitKey": "1kg" }
  ],
  "stars": 4.7,
  "reviews": 312,
  "stock": 20,
  "inStock": true
}
```

Frontend files:

- `src/pages/HomePage.jsx`
- `src/pages/CategoryPage.jsx`
- `src/pages/ProductDetailPage.jsx`
- `src/components/SearchBox.jsx`
- `src/services/groqService.js`
- `src/data/catalogFallback.js`
- `src/data/india_products.js`
- `src/data/kenya_products.js`
- `src/firebase.js`

Current state:

- Home/category/detail read Firebase directly for India when config exists.
- Kenya mostly uses local data.
- Fallback helpers protect region-safe catalog behavior.

Backend integration work:

- Add `src/services/catalogApi.js`.
- Replace direct Firebase `get(ref(...))` calls in `HomePage.jsx`, `CategoryPage.jsx`, and `ProductDetailPage.jsx` with `catalogApi` calls.
- Keep fallback data as emergency fallback only.
- Backend must enforce region filtering so India never receives Kenya-only products and Kenya never receives India-only products unless intentionally shared.
- Backend should return stable product IDs, not array-index IDs.

### Cart

Endpoints:

- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:lineId`
- `DELETE /api/cart/items/:lineId`
- `POST /api/cart/merge-guest`
- `DELETE /api/cart`

Add item request:

```json
{
  "productId": "in_r_001",
  "unitKey": "1kg",
  "quantity": 1,
  "source": "product-card"
}
```

Cart response:

```json
{
  "items": [
    {
      "lineId": "cart_line_123",
      "productId": "in_r_001",
      "_uid": "in_r_001",
      "name": "Daawat Basmati Rice",
      "brand": "Daawat",
      "unitKey": "1kg",
      "selectedUnit": "1kg",
      "quantity": 2,
      "price": 220,
      "imageUrl": "/assets/redrice.png",
      "fromWishlist": false
    }
  ],
  "summary": {
    "subtotal": 440,
    "itemCount": 2
  }
}
```

Frontend files:

- `src/App.jsx`
- `src/pages/CartPage.jsx`
- `src/components/ProductCard.jsx`
- `src/pages/WishlistPage.jsx`
- `src/pages/ProductDetailPage.jsx`

Current localStorage key:

- `pb_cart`

Backend integration work:

- Add `src/services/cartApi.js`.
- In `App.jsx`, replace `addToCart`, `removeFromCart`, `updateCartQty`, `decreaseQuantity`, and `clearCart` local-only behavior with API mutations.
- Keep optimistic UI if desired, but always reconcile with backend cart response.
- Preserve current frontend rule: merge by product ID plus normalized unit key.
- Backend must validate product, stock, quantity, and unit.

### Wishlist

Endpoints:

- `GET /api/wishlist`
- `POST /api/wishlist/items`
- `DELETE /api/wishlist/items/:productId`
- `DELETE /api/wishlist`
- `POST /api/wishlist/move-to-cart`

Move to cart request:

```json
{
  "productId": "in_r_001",
  "unitKey": "1kg",
  "quantity": 1
}
```

Frontend files:

- `src/App.jsx`
- `src/pages/WishlistPage.jsx`
- `src/components/ProductCard.jsx`
- `src/pages/ProductDetailPage.jsx`

Current localStorage key:

- `pb_wishlist`

Backend integration work:

- Add `src/services/wishlistApi.js`.
- Keep wishlist product-only; do not store cart quantity in wishlist.
- Preserve current UX: moving item to cart removes it from wishlist.
- Preserve current restore behavior: if item originally came from wishlist and is removed from cart later, it may return to wishlist if not manually removed.

### Addresses

Endpoints:

- `GET /api/addresses`
- `POST /api/addresses`
- `PATCH /api/addresses/:addressId`
- `DELETE /api/addresses/:addressId`
- `PATCH /api/addresses/:addressId/default`

Address shape:

```json
{
  "id": "addr_123",
  "label": "Home",
  "receiverName": "Nikhil",
  "phone": "+918519913550",
  "house": "Flat 402",
  "building": "Prime Towers",
  "locality": "KPHB Phase 1",
  "landmark": "Near metro",
  "city": "Hyderabad",
  "state": "Telangana",
  "pincode": "500085",
  "country": "IN",
  "lat": 17.4923,
  "lng": 78.3934,
  "isDefault": true
}
```

Frontend files:

- `src/components/AddressModal.jsx`
- `src/pages/CartPage.jsx`
- `src/pages/AccountPage.jsx`

Current localStorage key:

- `pb_saved_addresses`

Backend integration work:

- Add `src/services/addressApi.js`.
- Keep frontend validation in `AddressModal.jsx`.
- Backend must repeat validation server-side for pincode, phone, country, and required fields.
- Cart checkout should fetch/select backend saved addresses instead of localStorage addresses.

### Checkout and Orders

Endpoints:

- `POST /api/checkout/quote`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:orderId`
- `GET /api/orders/:orderId/tracking`
- `POST /api/orders/:orderId/reorder`
- `POST /api/orders/:orderId/rating`
- `DELETE /api/orders/:orderId`

Checkout quote request:

```json
{
  "addressId": "addr_123",
  "promoCode": "SAVE10",
  "paymentMethod": "card"
}
```

Quote response:

```json
{
  "subtotal": 440,
  "delivery": 20,
  "tax": 18,
  "handlingFee": 5,
  "discount": 30,
  "total": 453,
  "currency": "INR",
  "cartVersion": "cart_version_123"
}
```

Order shape:

```json
{
  "orderId": "PB12345678",
  "status": "Out for Delivery",
  "items": [],
  "address": {},
  "payment": {
    "method": "card",
    "status": "paid"
  },
  "summary": {
    "total": 453,
    "currency": "INR"
  },
  "timeline": [
    { "status": "Order Confirmed", "time": "2026-05-27T06:30:00.000Z" }
  ]
}
```

Frontend files:

- `src/pages/CartPage.jsx`
- `src/pages/PaymentPage.jsx`
- `src/pages/OrderSuccessPage.jsx`
- `src/pages/OrderTrackingPage.jsx`
- `src/pages/OrderDetailPage.jsx`
- `src/pages/RateOrderPage.jsx`
- `src/pages/AccountPage.jsx`
- `src/App.jsx`

Current localStorage keys:

- `pb_orders`
- `pb_order_reviews`
- `pb_marked_orders`

Backend integration work:

- Add `src/services/checkoutApi.js`.
- Add `src/services/orderApi.js`.
- `CartPage.jsx` should request quote before payment.
- `PaymentPage.jsx` should only call success after backend order/payment confirmation.
- `AccountPage.jsx` should load order history from backend.
- `OrderTrackingPage.jsx` should display backend timeline instead of only simulation.

### Payments

Endpoints:

- `POST /api/payments/create-intent`
- `POST /api/payments/confirm`
- `POST /api/payments/webhook`
- `GET /api/payments/methods`
- `GET /api/payments/saved`
- `POST /api/payments/saved`
- `DELETE /api/payments/saved/:methodId`

Frontend files:

- `src/pages/PaymentPage.jsx`
- `src/components/payment/PaymentMethods.jsx`
- `src/config/paymentConfig.js`
- `src/pages/AccountPage.jsx`

Current localStorage keys:

- `pb_saved_cards`
- `pb_gift_cards`

Backend integration work:

- Add `src/services/paymentApi.js`.
- Payment final verification must happen on backend.
- Wallet deduction should be backend-owned.
- Saved cards should use provider tokens, not raw card data.
- Webhook should be the source of truth for paid/failed status.

### Wallet

Endpoints:

- `GET /api/wallet`
- `POST /api/wallet/top-up`
- `POST /api/wallet/debit`
- `GET /api/wallet/transactions`

Frontend files:

- `src/context/TrackingContext.jsx`
- `src/pages/AccountPage.jsx`
- `src/pages/PaymentPage.jsx`

Current localStorage key:

- `wallet`

Backend integration work:

- Add `src/services/walletApi.js`.
- Replace local wallet balance mutation in `TrackingContext.jsx`.
- Wallet balance should come from backend.
- Wallet debit/credit should return transaction IDs.

### Refunds and Returns

Endpoints:

- `POST /api/refunds`
- `GET /api/refunds`
- `GET /api/refunds/:refundId`
- `POST /api/refunds/:refundId/proofs`
- `PATCH /api/refunds/:refundId/status`

Refund request shape:

```json
{
  "orderId": "PB12345678",
  "itemId": "in_bi_001",
  "flowType": "return",
  "reason": "damaged_product",
  "details": "Packet was damaged",
  "refundMethod": "Original Payment"
}
```

Refund status stages:

- `Return Requested`
- `Refund Requested`
- `Under Review`
- `Approved`
- `Rejected`
- `Pickup Scheduled`
- `Picked Up`
- `Refund Processing`
- `Refunded`

Frontend files:

- `src/pages/AccountPage.jsx`
- `src/pages/OrderDetailPage.jsx`

Current localStorage keys:

- `refund_requests`
- `pb_refunds`

Backend integration work:

- Add `src/services/refundApi.js`.
- Replace local simulated refund timers with backend status updates.
- Proof uploads should go to backend or object storage through signed upload URLs.
- Wallet refunds must credit wallet only after backend confirms `Refunded`.

### Notifications

Endpoints:

- `GET /api/notifications`
- `PATCH /api/notifications/:notificationId/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/notifications/:notificationId`
- `DELETE /api/notifications`

Notification shape:

```json
{
  "id": "note_123",
  "title": "Order update",
  "message": "Your order is out for delivery.",
  "type": "delivery",
  "read": false,
  "createdAt": "2026-05-27T06:30:00.000Z",
  "metadata": {
    "orderId": "PB12345678"
  }
}
```

Frontend files:

- `src/App.jsx`
- `src/components/Header.jsx`
- `src/pages/AccountPage.jsx`

Current localStorage key:

- `pb_notifications`

Backend integration work:

- Add `src/services/notificationApi.js`.
- `Header.jsx` can keep the current display behavior.
- `App.jsx` should load notifications from backend after login.
- Auto cleanup can stay frontend-friendly, but backend should enforce retention rules.

### Chatbot and AI Proxy

Endpoints:

- `POST /api/chat/message`
- `POST /api/chat/product-suggestions`

Frontend files:

- `src/services/groqService.js`
- `src/components/ChatWindow.jsx`
- `src/components/ChatbotWidget.jsx`

Backend integration work:

- Add `src/services/chatApi.js`.
- Move `GROQ_API_KEY` to backend environment only.
- Frontend should send user message, region, language, cart context, and page context.
- Backend should call Groq/OpenAI/provider and return safe response.
- Add rate limiting, moderation, and logging on backend.

## File-by-File Frontend Migration Map

### `src/utils/network.js`

Keep this file.

Add or reuse it inside `src/services/apiClient.js`.

### `src/context/AuthContext.jsx`

Change from localStorage-only session to backend-backed session.

Add:

- `bootstrapSession()`
- `refreshSession()`
- `logout()` calling backend
- `updateUser()` calling backend profile update

Keep:

- localStorage tokens as short-term persistence if using JWT
- `isAuthenticated`, `user`, `login`, `logout`, `updateUser` context API

### `src/components/PhoneAuthModal.jsx`

Already close to backend-ready.

Keep:

- `POST /api/auth/send-phone-otp`
- `POST /api/auth/verify-phone-otp`

Change:

- remove demo fallback for production builds, or guard it behind `VITE_ENABLE_DEMO_AUTH=true`
- use `authApi.sendOtp()` and `authApi.verifyOtp()` instead of direct `fetch()`

### `src/App.jsx`

This is the largest migration file.

Replace these localStorage-owned flows gradually:

- `pb_cart`
- `pb_wishlist`
- `pb_orders`
- `pb_notifications`
- `pb_saved_addresses`
- `pb_saved_cards`
- `pb_refunds`
- `refund_requests`
- `wallet`

Immediate backend hooks to add:

- load user cart after login
- load wishlist after login
- load orders after login
- load notifications after login
- reconcile guest cart on login
- replace `handlePaymentSuccess()` with backend order response
- replace cart mutation helpers with API-backed helpers

Do not rewrite the whole file at once. Use service adapters first.

### `src/pages/HomePage.jsx`

Replace direct Firebase/home fallback fetching with:

- `catalogApi.getHome({ region, language })`

Keep fallback data as emergency fallback.

### `src/pages/CategoryPage.jsx`

Replace category fetching with:

- `catalogApi.getCategoryProducts({ category, region, page, limit, filters, sort })`
- `catalogApi.searchProducts({ query, region, language })`

Important:

- Preserve current state restore behavior.
- Preserve pre-paint fresh filter reset.
- Backend should support filters, but frontend can keep UI filter state.

### `src/pages/ProductDetailPage.jsx`

Replace product and related fetches with:

- `catalogApi.getProduct(productId, { region })`
- `catalogApi.getRelatedProducts(productId, { region })`

Keep:

- zoom/lightbox UI
- wishlist/cart controls
- region-aware image fallback as a safety net

### `src/pages/CartPage.jsx`

Connect:

- addresses from `addressApi`
- checkout quote from `checkoutApi`
- promo validation from backend

Do not calculate final totals only on frontend.

### `src/pages/PaymentPage.jsx`

Connect:

- `paymentApi.createIntent()`
- `paymentApi.confirmPayment()`
- `orderApi.placeOrder()`

Important:

- Do not call order success until backend confirms payment/order.
- Wallet deduction must be backend-confirmed.

### `src/pages/AccountPage.jsx`

Connect:

- profile via auth/user API
- orders via `orderApi`
- refunds via `refundApi`
- wallet via `walletApi`
- notifications via `notificationApi`
- saved cards/payment methods via `paymentApi`

Keep:

- current staged refund UI
- proof upload preview
- timeline rendering

Remove later:

- simulated refund timers after backend status updates exist

### `src/context/TrackingContext.jsx`

Connect:

- active order tracking via backend order status
- wallet balance via `walletApi`

Remove later:

- localStorage wallet mutation logic

### `src/services/groqService.js`

Replace provider-direct call with backend call.

Frontend should call:

- `chatApi.sendMessage()`

Backend should call Groq/OpenAI/provider.

## LocalStorage Replacement Table

| Current key | Backend owner | Frontend replacement |
| --- | --- | --- |
| `user` | Auth service | `GET /api/auth/me` |
| `accessToken` | Auth service | keep token, refresh via API |
| `refreshToken` | Auth service | keep token, refresh via API |
| `pb_cart` | Cart service | `GET /api/cart` |
| `pb_wishlist` | Wishlist service | `GET /api/wishlist` |
| `pb_orders` | Order service | `GET /api/orders` |
| `pb_notifications` | Notification service | `GET /api/notifications` |
| `pb_saved_addresses` | Address service | `GET /api/addresses` |
| `wallet` | Wallet service | `GET /api/wallet` |
| `refund_requests` | Refund service | `GET /api/refunds` |
| `pb_refunds` | Refund service | `GET /api/refunds` |
| `pb_saved_cards` | Payment service | `GET /api/payments/saved` |
| `pb_gift_cards` | Promo/payment service | `GET /api/promos/user` |
| `pb_order_reviews` | Review/order service | `GET /api/orders/reviews` |
| `pb_active_tracking` | Order tracking service | `GET /api/orders/:id/tracking` |

Some UI preferences can stay local:

- `pb_lang`
- `pb_region`
- `pb_theme`
- navigation cache/session scroll cache

## Suggested Integration Order

### Phase 1: Foundation

1. Add `src/services/apiClient.js`.
2. Add domain service files.
3. Configure `VITE_API_BASE_URL`.
4. Confirm CORS and auth headers.
5. Keep current fallbacks active.

### Phase 2: Auth

1. Keep existing OTP endpoints.
2. Make backend return user + tokens.
3. Update `AuthContext.jsx` to call `/api/auth/me`.
4. Add logout endpoint.
5. Remove demo OTP fallback from production.

### Phase 3: Catalog

1. Add home catalog endpoint.
2. Add category endpoint.
3. Add product detail endpoint.
4. Add related products endpoint.
5. Keep local data only as fallback.

### Phase 4: Cart and Wishlist

1. Load cart/wishlist after login.
2. Replace add/update/remove cart helpers.
3. Replace wishlist toggle.
4. Add guest cart merge.
5. Reconcile badges from backend response.

### Phase 5: Addresses and Checkout

1. Replace saved address localStorage with API.
2. Add checkout quote endpoint.
3. Validate promo/fees/tax server-side.
4. Send quote result to payment.

### Phase 6: Payments and Orders

1. Create payment intent/session backend-side.
2. Confirm payment backend-side.
3. Create order only after payment success or valid COD.
4. Fetch order success/tracking from backend.
5. Move order history to backend.

### Phase 7: Wallet, Refunds, Notifications

1. Move wallet balance/transactions to backend.
2. Move refund requests and proof upload to backend.
3. Move notification list/read/delete to backend.
4. Wire backend events to notification creation.

### Phase 8: Chatbot Proxy

1. Remove provider key from frontend.
2. Add backend chat proxy.
3. Add product/cart context on backend.
4. Add rate limits and moderation.

## Backend Validation Rules

Backend must validate these even if frontend already validates them:

- phone country and digit length
- region/country compatibility
- language allowed for region
- product exists and belongs to active region
- unit exists for product
- stock availability
- cart quantity limits
- address required fields
- pincode/postal code format
- payment amount matches backend quote
- wallet balance before debit
- refund eligibility by order status
- proof upload file type and size

## Security Checklist

- Use HTTPS in production.
- Store provider/payment secrets only on backend.
- Verify payment webhooks server-side.
- Use short-lived access tokens.
- Add refresh-token rotation.
- Add rate limits for OTP, login, checkout, and chatbot.
- Add CORS allowlist for `https://prime-basket.in`.
- Do not trust product price from frontend.
- Do not trust cart total from frontend.
- Do not trust wallet deduction from frontend.
- Do not expose Firebase admin credentials to browser.

## CORS Setup

Backend should allow:

```txt
https://prime-basket.in
http://localhost:5173
http://localhost:4173
```

Allowed headers:

```txt
Content-Type
Authorization
X-Request-Id
```

Allowed methods:

```txt
GET
POST
PATCH
PUT
DELETE
OPTIONS
```

## Production QA Checklist

Before release, test:

- fresh install / first load
- India login and Kenya login
- logout region reset behavior
- catalog by region
- product image correctness
- add to cart
- update cart quantity
- move wishlist item to cart
- remove wishlist-origin item from cart
- saved address create/edit/delete
- checkout quote
- payment success
- payment failure
- COD order
- order tracking
- delivered rating
- refund request
- proof upload
- refund tracking
- wallet top-up
- wallet debit
- notifications read/delete
- chatbot product suggestions
- mobile Safari
- mobile Chrome
- desktop Chrome/Edge
- dark mode
- slow network
- backend offline/error responses

## Minimum Backend Needed For First Production Beta

If you want a practical first beta, implement at least:

- Auth OTP
- Catalog API
- Cart API
- Address API
- Checkout quote
- Order creation/history
- Payment confirmation or COD-only order creation
- Notifications

Can wait until later:

- Wallet top-up
- Full refund proof uploads
- Advanced chatbot personalization
- Saved cards
- Admin dashboard

## Final Recommendation

Start backend integration now.

Do not rewrite the entire frontend first. Add the service layer, connect one backend domain at a time, keep current fallbacks during migration, and only remove localStorage/demo flows after each backend feature is stable.
