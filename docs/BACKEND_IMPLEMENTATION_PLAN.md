# Backend Implementation Plan

## Project

Prime Basket E-commerce Application

## Goal

Build a production-ready backend that connects cleanly with the current Prime Basket frontend and supports real users, real orders, real payments, OTP login, notifications, regional catalogs, delivery tracking, refunds, and admin operations.

This backend should not be only a demo API. It should become the real business layer behind the application.

## Current Frontend Readiness

The frontend is ready enough to begin backend integration, but the backend should be added in phases instead of replacing all frontend demo/localStorage behavior at once.

What is already useful for backend integration:

- Region model already supports `India` and `Kenya`.
- Auth flow already has phone/OTP UI.
- Cart, wishlist, checkout, orders, refunds, address, account, notifications, and product browsing flows already exist.
- Product cards, product detail, and cart rows now support product-aware unit choices such as packs, kg, grams, ml, and litres.
- Cart unit changes now update totals and merge duplicate product/unit rows in the frontend, which gives the backend a clear future API contract for cart item variants.
- Home merchandising rails now preserve active-region context and can consume richer backend home-section payloads when available.
- Environment variable pattern already exists through `VITE_API_BASE_URL`.
- Firebase catalog fallback and local demo state can remain as backup during migration.

What should be improved during backend integration:

- Move cart, wishlist, orders, refunds, wallet, notifications, and addresses from localStorage to backend APIs.
- Move Groq/chatbot API usage behind a backend proxy.
- Replace frontend demo OTP with real OTP provider.
- Replace demo payment/order behavior with webhook-driven payment and order status.
- Add backend validation for all critical checkout, refund, payment, and user-profile flows.

## Recommended Backend Stack

### API Framework

Recommended: `Node.js + NestJS`

Why:

- Better structure for a growing ecommerce backend.
- Strong module separation for auth, catalog, orders, payments, refunds, notifications, and admin.
- Easier to test and maintain than one large Express app.

Alternative: `Node.js + Express`

Use Express only if the goal is fastest MVP and a smaller codebase.

### Database

Recommended: `PostgreSQL`

Good managed options:

- Supabase Postgres
- Neon Postgres
- Railway Postgres
- AWS RDS Postgres

Why:

- Strong relational model for users, orders, payments, refunds, products, addresses, and inventory.
- Easier reporting and admin queries.
- Better long-term reliability than using frontend localStorage or only Realtime Database.

### Cache / Sessions / Rate Limiting

Recommended: `Upstash Redis`

Use for:

- OTP cooldowns
- rate limits
- session/token blacklists if needed
- short-lived checkout quotes
- frequently accessed catalog/search cache

### File Storage

Recommended: `Cloudflare R2` or `AWS S3`

Use for:

- product images
- return/refund proof images
- return/refund proof videos
- user profile images if added later

### Authentication

Recommended:

- Phone OTP login
- JWT access tokens
- refresh tokens stored securely
- backend-controlled session validation

OTP providers:

- India: MSG91, Gupshup, Twilio, Firebase Phone Auth, or AWS SNS
- Kenya: Africa's Talking, Twilio, Infobip, or Safaricom-supported SMS providers

### Payments

India:

- Razorpay

Kenya:

- M-PESA Daraja API

Optional global/card support:

- Stripe

Important:

- Never finalize orders only from frontend success callbacks.
- Always confirm payments through backend webhooks.
- Store payment events and webhook payload status.

### Notifications

Push notifications:

- Firebase Cloud Messaging

SMS:

- MSG91 for India
- Africa's Talking or Twilio for Kenya

Email:

- Resend
- SendGrid
- AWS SES

In-app notifications:

- Store in backend database.
- Auto-clean older low-priority notifications.
- Preserve important unread order/refund notifications.

### Search

MVP:

- PostgreSQL full-text search

Better later:

- Meilisearch
- Typesense
- Algolia

### Monitoring

Recommended:

- Sentry for frontend and backend errors
- Better Stack or Logtail for logs
- UptimeRobot or Better Stack uptime monitoring
- Vercel Analytics / Speed Insights for frontend

## Main Backend Modules

### 1. Auth Module

Responsibilities:

- send OTP
- verify OTP
- identify country from phone prefix
- create or update user
- issue access and refresh tokens
- logout and revoke refresh tokens
- enforce OTP rate limits

Important APIs:

- `POST /auth/send-otp`
- `POST /auth/verify-otp`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### 2. User/Profile Module

Responsibilities:

- profile details
- saved phone and email
- default country and language
- wallet summary
- account preferences

Important APIs:

- `GET /users/me`
- `PATCH /users/me`
- `GET /users/me/preferences`
- `PATCH /users/me/preferences`

### 3. Address Module

Responsibilities:

- saved addresses
- address validation
- phone validation by country
- pincode/postal-code validation
- default address selection

Important APIs:

- `GET /addresses`
- `POST /addresses`
- `PATCH /addresses/:id`
- `DELETE /addresses/:id`
- `POST /addresses/:id/default`

### 4. Catalog Module

Responsibilities:

- region-specific products
- categories
- product images
- product units
- price and discount data
- product detail pages
- related products
- featured/trending/top-rated/recent shelves

Important APIs:

- `GET /catalog/categories?country=IN`
- `GET /catalog/products?country=IN&category=rice&sort=popular`
- `GET /catalog/products/:id`
- `GET /catalog/products/:id/related`
- `GET /catalog/home?country=IN`

Rules:

- India users should never receive Kenya-only products unless explicitly allowed by admin.
- Kenya users should never receive India-only products unless explicitly allowed by admin.
- Product image fallback must be category-safe.

### 5. Cart Module

Responsibilities:

- persistent cart
- quantity updates
- item merge rules
- unit-level cart lines
- stock validation
- price quote before checkout

Important APIs:

- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/:itemId`
- `DELETE /cart/items/:itemId`
- `POST /cart/quote`

### 6. Wishlist Module

Responsibilities:

- persistent wishlist
- move-to-cart behavior
- restore to wishlist when cart item came from wishlist and is removed
- product-only wishlist storage

Important APIs:

- `GET /wishlist`
- `POST /wishlist/items`
- `DELETE /wishlist/items/:productId`
- `POST /wishlist/items/:productId/move-to-cart`

### 7. Checkout Module

Responsibilities:

- validate address
- validate cart stock and prices
- calculate taxes/fees/delivery
- apply promo codes
- create checkout session

Important APIs:

- `POST /checkout/quote`
- `POST /checkout/apply-promo`
- `POST /checkout/start`

### 8. Orders Module

Responsibilities:

- create orders after payment confirmation
- order history
- order details
- delivery status tracking
- buy again
- ratings and reviews

Important APIs:

- `GET /orders`
- `GET /orders/:id`
- `POST /orders/:id/buy-again`
- `POST /orders/:id/rating`
- `GET /orders/:id/tracking`

Order statuses:

- `PLACED`
- `CONFIRMED`
- `PACKED`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `CANCELLED`

### 9. Payment Module

Responsibilities:

- create payment orders
- verify payment signatures
- handle Razorpay webhooks
- handle M-PESA callbacks
- store payment attempts
- update order/payment status safely

Important APIs:

- `POST /payments/razorpay/create-order`
- `POST /payments/razorpay/verify`
- `POST /payments/razorpay/webhook`
- `POST /payments/mpesa/stk-push`
- `POST /payments/mpesa/callback`

### 10. Refund/Return Module

Responsibilities:

- return reason selection
- proof image/video upload
- refund review status
- pickup scheduling
- refund timeline
- refund notifications
- wallet/original-payment refund state

Important APIs:

- `POST /returns`
- `GET /returns`
- `GET /returns/:id`
- `POST /returns/:id/proofs`
- `PATCH /returns/:id/status`

Return statuses:

- `RETURN_REQUESTED`
- `UNDER_REVIEW`
- `APPROVED`
- `REJECTED`
- `PICKUP_SCHEDULED`
- `PICKED_UP`
- `REFUND_PROCESSING`
- `REFUNDED`

### 11. Notification Module

Responsibilities:

- in-app notifications
- order updates
- refund updates
- delivery updates
- offline/online messages if backend driven later
- mark read/clear actions
- cleanup old notifications

Important APIs:

- `GET /notifications`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `DELETE /notifications/:id`
- `DELETE /notifications/clear-read`

### 12. Chatbot Proxy Module

Responsibilities:

- protect Groq API key
- add rate limits
- inject region-aware product context
- avoid exposing private prompts on frontend

Important APIs:

- `POST /ai/chat`
- `POST /ai/product-suggestions`

### 13. Admin Module

Responsibilities:

- manage products
- manage categories
- update stock
- manage orders
- approve/reject returns
- schedule pickup
- process refunds
- send notifications
- basic dashboard/reporting

Admin can be built as:

- separate admin panel later
- protected backend dashboard
- temporary internal API endpoints for first release

## Suggested Database Tables

Core tables:

- `users`
- `user_sessions`
- `otp_requests`
- `addresses`
- `countries`
- `languages`
- `categories`
- `products`
- `product_images`
- `product_units`
- `inventory`
- `carts`
- `cart_items`
- `wishlist_items`
- `checkout_quotes`
- `orders`
- `order_items`
- `order_status_events`
- `payments`
- `payment_events`
- `returns`
- `return_items`
- `return_proofs`
- `return_status_events`
- `refunds`
- `notifications`
- `promotions`
- `wallet_transactions`
- `ratings`

## Frontend Integration Points

### Environment Variable

Current frontend should use:

```env
VITE_API_BASE_URL=https://api.prime-basket.in
```

For local backend:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Files/Areas That Will Need API Integration

Likely frontend areas:

- `src/context/AuthContext.jsx`
- `src/App.jsx`
- `src/components/PhoneAuthModal.jsx`
- `src/components/Header.jsx`
- `src/components/SearchBox.jsx`
- `src/components/ChatbotWidget.jsx`
- `src/pages/HomePage.jsx`
- `src/pages/CategoryPage.jsx`
- `src/pages/ProductDetailPage.jsx`
- `src/pages/CartPage.jsx`
- `src/pages/PaymentPage.jsx`
- `src/pages/AccountPage.jsx`
- `src/pages/WishlistPage.jsx`
- `src/pages/OrderSuccessPage.jsx`
- `src/pages/OrderTrackingPage.jsx`
- `src/pages/OrderDetailPage.jsx`
- `src/pages/RateOrderPage.jsx`
- `src/services/groqService.js`
- `src/utils/productUtils.js`

Recommended frontend service files to add:

- `src/services/apiClient.js`
- `src/services/authApi.js`
- `src/services/catalogApi.js`
- `src/services/cartApi.js`
- `src/services/wishlistApi.js`
- `src/services/orderApi.js`
- `src/services/paymentApi.js`
- `src/services/refundApi.js`
- `src/services/notificationApi.js`
- `src/services/addressApi.js`

## Implementation Timeline

### MVP Backend Connected To Current Frontend

Estimated time: `25 to 35 working days`

Includes:

- auth/OTP
- users
- address
- catalog
- cart
- wishlist
- checkout quote
- basic orders
- basic payments
- basic notifications
- basic refunds
- frontend API wiring

### Production-Ready Backend V1

Estimated time: `45 to 60 working days`

Includes:

- all MVP features
- proper payment webhooks
- staged refund workflow
- admin operations
- proof uploads
- rate limiting
- security hardening
- logging and monitoring
- real notification providers
- QA/regression testing
- production deployment setup

### With Two Developers

Estimated time: `25 to 35 working days` for a strong production-ready first release, assuming frontend and backend integration happen in parallel.

## Execution Phases

### Phase 1: Backend Foundation

Estimated time: `4 to 6 days`

Tasks:

- create backend repository or backend folder
- configure NestJS or Express
- configure PostgreSQL
- configure Prisma or TypeORM
- configure environment variables
- add validation layer
- add error response format
- add logging
- add health check API

Deliverables:

- backend runs locally
- database connects
- migrations work
- `/health` API works

### Phase 2: Auth And User Profile

Estimated time: `5 to 7 days`

Tasks:

- OTP send/verify
- phone country detection
- session/token management
- user profile APIs
- logout behavior
- frontend login integration

Deliverables:

- user can sign in with real OTP
- region/language can be set from backend profile
- logout clears account state correctly

### Phase 3: Catalog And Product Media

Estimated time: `6 to 8 days`

Tasks:

- products/categories database
- region-safe product APIs
- image handling
- category-safe fallback rules
- home shelves API
- product detail API
- related products API

Deliverables:

- India and Kenya catalogs load from backend
- product images are deterministic and correct
- category/search/detail pages use backend data

### Phase 4: Cart, Wishlist, And Address

Estimated time: `6 to 8 days`

Tasks:

- persistent cart APIs
- persistent wishlist APIs
- move-to-cart metadata
- address validation APIs
- localStorage-to-backend migration logic

Deliverables:

- cart and wishlist survive refresh/login
- cart badge and wishlist badge stay correct
- checkout address is backend-backed

### Phase 5: Checkout, Orders, And Tracking

Estimated time: `7 to 10 days`

Tasks:

- checkout quote API
- order creation
- order history
- order detail
- order tracking timeline
- buy again
- rating submission

Deliverables:

- order journey works from cart to order success
- tracking state comes from backend
- account order history is backend-backed

### Phase 6: Payments

Estimated time: `8 to 12 days`

Tasks:

- Razorpay integration
- M-PESA integration
- payment webhooks
- payment signature verification
- payment status events
- failure/retry handling

Deliverables:

- orders finalize only after backend payment confirmation
- payment failures are handled safely
- payment events are auditable

### Phase 7: Refunds, Wallet, And Notifications

Estimated time: `8 to 12 days`

Tasks:

- return request API
- reason selection storage
- proof upload
- refund timeline
- refund status transitions
- notification events
- optional wallet ledger

Deliverables:

- refunds no longer happen instantly
- return/refund timeline behaves like real ecommerce flow
- users get in-app updates for return and refund status

### Phase 8: Chatbot Proxy And Admin Basics

Estimated time: `6 to 10 days`

Tasks:

- backend Groq proxy
- rate limit chatbot requests
- region-aware product context
- admin product/order/refund APIs
- admin notification controls

Deliverables:

- AI API key is no longer exposed to frontend
- admin can manage core ecommerce operations

### Phase 9: Full Frontend API Integration

Estimated time: `10 to 15 days`

Tasks:

- replace localStorage flows with APIs gradually
- keep fallback mode during migration
- add loading/error states for API responses
- add optimistic updates where safe
- ensure all page states remain stable

Deliverables:

- frontend uses backend for real ecommerce state
- app remains usable if one API surface fails gracefully

### Phase 10: QA, Security, And Production Deployment

Estimated time: `7 to 10 days`

Tasks:

- full manual QA
- mobile/desktop QA
- API validation tests
- payment webhook tests
- OTP abuse/rate-limit tests
- CORS/security headers
- monitoring setup
- production environment variables
- deployment runbook

Deliverables:

- production-ready API
- stable deployment
- backend monitoring and error visibility

## Required Accounts And Credentials

Before backend implementation starts, prepare:

- backend hosting account
- database provider account
- Redis provider account
- file storage bucket
- Razorpay account for India payments
- M-PESA Daraja access for Kenya payments
- OTP/SMS provider account
- email provider account
- Firebase Cloud Messaging setup
- Sentry project
- production domain for API, for example `api.prime-basket.in`

## Estimated Monthly Cost

Small MVP / early testing:

- Backend hosting: ₹0 to ₹1,500
- PostgreSQL: ₹0 to ₹2,000
- Redis: ₹0 to ₹800
- File storage: ₹0 to ₹500
- Monitoring/logs: ₹0 to ₹1,500
- Email: ₹0 to ₹1,000
- SMS/OTP: usage-based
- Payment gateway: transaction fees

Estimated base monthly cost before heavy traffic:

- `₹1,000 to ₹7,000+`

The largest variable cost will usually be:

- OTP/SMS volume
- payment gateway fees
- image/video storage and bandwidth
- AI/chatbot usage

## Quality And Security Requirements

Must-have:

- backend validation for every request
- rate limits on OTP, auth, checkout, chatbot, and upload APIs
- payment webhook signature verification
- never trust frontend prices
- never trust frontend stock state
- CORS restricted to approved domains
- secure token handling
- audit logs for payments/refunds/admin actions
- file upload type and size validation
- private API keys only on backend

## Testing Plan

### Auth Testing

- India phone login
- Kenya phone login
- invalid phone
- expired OTP
- wrong OTP
- repeated OTP requests
- logout and session refresh

### Catalog Testing

- India products only for India region
- Kenya products only for Kenya region
- product images match product/category
- search results respect region
- category filters do not auto-apply

### Cart/Wishlist Testing

- add item
- update quantity
- remove item
- move wishlist item to cart
- restore wishlist item when removed from cart if applicable
- refresh persistence
- multi-device sync if supported

### Checkout Testing

- no address
- invalid address
- invalid phone
- price changed
- item out of stock
- promo success/failure
- checkout quote accuracy

### Payment Testing

- success
- failure
- cancelled payment
- duplicate webhook
- delayed webhook
- invalid signature
- retry payment

### Order Testing

- order success
- order history
- order detail
- tracking timeline
- delivered rating
- buy again

### Refund Testing

- reason required
- proof upload
- file validation
- under review status
- approved flow
- rejected flow
- pickup flow
- refund processed flow
- refunded flow

### Notification Testing

- order notification
- delivery notification
- refund notification
- read/unread
- clear
- 24-hour cleanup
- mobile responsive panel

## Production Release Checklist

Before public release:

- frontend build passes
- backend tests pass
- API health check passes
- database migrations applied
- production env variables configured
- payment webhooks verified
- OTP provider verified
- file uploads verified
- CORS configured
- monitoring enabled
- rollback plan documented
- admin access secured
- seed catalog reviewed
- privacy policy and terms linked

## Recommended First Backend Milestone

Start with this milestone:

1. Auth with real OTP.
2. Backend user profile.
3. Region-safe catalog API.
4. Backend cart and wishlist.
5. Backend address book.

This gives the frontend a real account and shopping state foundation before moving into payments and refunds.

## Final Recommendation

Yes, this backend can be built for the current Prime Basket frontend.

The best approach is phased integration. Do not replace everything at once. First connect auth, users, catalog, cart, wishlist, and address APIs. Then connect checkout, payments, orders, tracking, refunds, notifications, admin, and chatbot proxy.

With a focused implementation, Prime Basket can move from polished frontend prototype to a real production ecommerce application.
