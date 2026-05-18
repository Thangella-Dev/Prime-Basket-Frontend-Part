# Backend Readme

## Short Answer

Yes, backend integration can start now.

The frontend is already strong enough for backend attachment. It does **not** need to become “perfect first” before backend work begins. In fact, for this app, the best next step is to integrate backend services now and then do a final joint QA pass after real APIs are connected.

So the right approach is:

1. Start backend integration now
2. Replace demo/localStorage flows one by one
3. Re-test the app end to end with real backend responses
4. Do final frontend polish only where real API behavior exposes gaps

## Is More Frontend Work Still Needed Before Backend?

Not as a blocker.

Some frontend cleanup is still useful later:

- more page-level style refactoring
- more automated testing
- final browser/device QA outside this sandbox
- final dark-mode consistency sweep

But those are **not** reasons to delay backend integration.

The app is already good enough to connect:

- auth
- catalog
- cart
- checkout
- orders
- wallet
- refunds
- notifications
- chatbot proxy

## What Should Be Added in Backend First

### 1. Authentication API

Add these backend responsibilities:

- send OTP
- verify OTP
- return user profile
- issue access token / refresh token
- logout / token invalidation

Frontend files to connect:

- [src/components/PhoneAuthModal.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/components/PhoneAuthModal.jsx)
  This already calls:
  - `POST /api/auth/send-phone-otp`
  - `POST /api/auth/verify-phone-otp`

- [src/context/AuthContext.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/context/AuthContext.jsx)
  Replace demo/localStorage-only session persistence with backend-backed session lifecycle.

- [src/App.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/App.jsx)
  Keep region/language bootstrapping, but trust backend user profile/session state instead of browser-only assumptions.

### 2. Catalog API

Add these backend responsibilities:

- region-aware products
- category listing
- search
- pricing
- stock
- product detail
- related products

Frontend files to connect:

- [src/pages/HomePage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/HomePage.jsx)
  Home sections currently read Firebase/fallback catalog data.

- [src/pages/CategoryPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/CategoryPage.jsx)
  Category listing, all-products mode, filtering, and region-aware browsing.

- [src/pages/ProductDetailPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/ProductDetailPage.jsx)
  Single product fetch, related products, detail rendering.

- [src/hooks/useSearch.js](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/hooks/useSearch.js)
  Search should eventually use backend search results instead of mixed fallback indexing.

- [src/firebase.js](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/firebase.js)
  If Firebase remains the source, backend can still sit in front as a validation/filtering layer.

### 3. Cart API

Add these backend responsibilities:

- get user cart
- add item
- update quantity
- remove item
- merge guest cart after login
- validate units and stock

Frontend files to connect:

- [src/App.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/App.jsx)
  Main cart state currently lives here and is persisted to localStorage.

- [src/pages/CartPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/CartPage.jsx)
  Cart display, address gating, promo, and checkout transition.

- [src/components/ProductCard.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/components/ProductCard.jsx)
  Add/decrease interactions should trigger API mutations.

- [src/pages/WishlistPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/WishlistPage.jsx)
  Move-to-cart should call real cart mutation and then sync wishlist.

### 4. Wishlist API

Add these backend responsibilities:

- get wishlist
- add item
- remove item
- keep wishlist product-only

Frontend files to connect:

- [src/App.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/App.jsx)
  Wishlist state is still browser-persisted.

- [src/pages/WishlistPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/WishlistPage.jsx)

- [src/components/ProductCard.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/components/ProductCard.jsx)

### 5. Address API

Add these backend responsibilities:

- list saved addresses
- create address
- update address
- delete address
- mark default address

Frontend files to connect:

- [src/components/AddressModal.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/components/AddressModal.jsx)

- [src/pages/AccountPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/AccountPage.jsx)

- [src/pages/CartPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/CartPage.jsx)

Current local key that should be replaced:

- `pb_saved_addresses`

### 6. Orders and Checkout API

Add these backend responsibilities:

- checkout quote
- shipping calculation
- taxes
- place order
- fetch orders
- fetch order detail
- order status timeline
- reorder / buy again

Frontend files to connect:

- [src/pages/CartPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/CartPage.jsx)
  For checkout start and cart validation.

- [src/pages/PaymentPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/PaymentPage.jsx)
  For payment intent/session creation and confirmed order finalization.

- [src/App.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/App.jsx)
  Orders are currently stored in `pb_orders`; this should become API-driven.

- [src/pages/OrderSuccessPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/OrderSuccessPage.jsx)

- [src/pages/OrderTrackingPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/OrderTrackingPage.jsx)

- [src/pages/OrderDetailPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/OrderDetailPage.jsx)

- [src/pages/AccountPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/AccountPage.jsx)
  For order history and `Buy Again`.

### 7. Payment Backend

Add these backend responsibilities:

- create payment session / intent
- verify payment result
- webhook handling
- wallet top-up confirmation
- COD rules

Frontend files to connect:

- [src/pages/PaymentPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/PaymentPage.jsx)

- [src/config/paymentConfig.js](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/config/paymentConfig.js)

Important:

- do **not** keep final payment verification in frontend only
- wallet deduction and order success should only happen after backend confirmation

### 8. Wallet API

Add these backend responsibilities:

- get wallet balance
- add money
- debit during payment
- refund to wallet
- transaction history

Frontend files to connect:

- [src/context/TrackingContext.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/context/TrackingContext.jsx)
  Wallet is currently demo/localStorage-driven.

- [src/pages/AccountPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/AccountPage.jsx)

- [src/pages/PaymentPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/PaymentPage.jsx)

Current local key that should be replaced:

- `wallet`

### 9. Refund API

Add these backend responsibilities:

- create refund request
- list refund requests
- refund status updates
- refund destination method
- wallet-credit confirmation

Frontend files to connect:

- [src/pages/AccountPage.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/pages/AccountPage.jsx)

Current local keys that should be replaced:

- `refund_requests`
- `pb_refunds`

### 10. Notifications API

Add these backend responsibilities:

- list notifications
- read/unread state
- offer notifications
- order/refund/payment events

Frontend files to connect:

- [src/App.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/App.jsx)

- [src/components/Header.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/components/Header.jsx)

Current local key that should be replaced:

- `pb_notifications`

### 11. Chatbot Backend / Proxy

Add these backend responsibilities:

- secure AI key handling
- product retrieval
- cart/order context injection
- moderation
- rate limiting
- logs

Frontend files to connect:

- [src/services/groqService.js](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/services/groqService.js)
  This should stop calling AI/provider-facing logic directly from the browser.

- [src/components/ChatWindow.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/components/ChatWindow.jsx)

- [src/components/ChatbotWidget.jsx](C:/Users/THANGELLA/Desktop/Prime%20Basket%20Updated/Prime-Basket%20Frontend/src/components/ChatbotWidget.jsx)

## What Frontend Parts Are Already Ready Enough

These are already good enough to integrate now:

- premium shell and navigation
- home/category/product discovery
- cart UX
- checkout layout
- account structure
- wallet/refund UI
- auth modal flow
- region/language model

So backend work does **not** need to wait for more frontend perfection.

## What Should Still Be Improved Later

These are not blockers, but should still happen:

- extract more logic from `src/App.jsx`
- reduce page-level inline styles over time
- add automated tests
- do full live browser/device QA
- finish all production monitoring and analytics wiring

## Best Integration Order

Do it in this order:

1. Auth
2. Catalog normalization / product API
3. Cart
4. Addresses
5. Checkout + orders
6. Payments
7. Wallet
8. Refunds
9. Notifications
10. Chatbot proxy

This order keeps the app usable while backend is attached step by step.

## Suggested Backend Stack

Any of these are fine:

- `Node.js + Express`
- `NestJS`
- `FastAPI`
- `Firebase Functions`
- `Next.js API routes`

If you want the easiest match with the current frontend, a simple `Node.js + Express` or `FastAPI` backend is a practical choice.

## Environment Variables To Add For Real Backend

Current frontend already uses:

- `VITE_API_BASE_URL`

For production, this should point to your real backend domain, for example:

```env
VITE_API_BASE_URL=https://api.prime-basket.in
```

Do not keep sensitive AI/payment secrets in `VITE_*` frontend variables.

## Final Recommendation

Backend can be added now itself.

The frontend is already at the right maturity level for backend integration. The smarter path is:

- start backend now
- connect one domain at a time
- keep frontend adjustments only where real API behavior needs them

That will get this app to production readiness faster than trying to “perfect frontend forever” before connecting real services.
