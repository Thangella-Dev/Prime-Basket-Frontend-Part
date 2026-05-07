# Backend Integration Guide

## Current Situation

The frontend already behaves like a functional storefront, but several important systems are still frontend/demo oriented:

- authentication
- cart persistence
- order creation
- payment confirmation
- refund handling
- saved cards
- notifications
- chatbot API access

To make this production-safe, these flows should move behind a backend.

## Minimum Backend Services To Add

### 1. Authentication Service

Needed for:

- login and logout
- phone/email identity verification
- session refresh
- user profile storage

Recommended backend responsibilities:

- issue access token and refresh token
- verify OTP or auth provider token
- return normalized user profile

### 2. Catalog API

Needed for:

- unified product listing
- region-aware pricing
- category listing
- stock status
- search

Current frontend can still keep Firebase for catalog if preferred, but production teams usually add:

- API validation layer
- inventory rules
- region-based product filtering
- caching

### 3. Cart API

Needed for:

- persistent cross-device cart
- quantity updates
- coupon application
- cart validation before checkout

### 4. Checkout and Order API

Needed for:

- address attachment
- shipping fee calculation
- tax calculation
- order creation
- order history retrieval
- status updates

### 5. Payment Backend

Needed for:

- secure order payment initiation
- payment verification webhooks
- wallet top-up confirmation
- refund initiation

This should never remain purely client-side in production.

### 6. Notification Service

Needed for:

- order events
- refund status updates
- offer notifications
- read/unread sync across devices

### 7. Chatbot Proxy / AI Backend

Needed for:

- secure AI key handling
- controlled prompt building
- rate limiting
- logging and moderation
- optional retrieval and order/cart context injection

## Suggested Backend Stack Options

Any of the following would work well:

- `Node.js + Express/NestJS`
- `Next.js API routes / server actions`
- `Firebase Functions`
- `Python FastAPI`

## Recommended API Surface

Suggested endpoint groups:

- `POST /auth/login`
- `POST /auth/verify-otp`
- `POST /auth/refresh`
- `GET /me`
- `PATCH /me`
- `GET /products`
- `GET /products/:id`
- `GET /categories`
- `GET /search`
- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/:id`
- `DELETE /cart/items/:id`
- `POST /checkout/quote`
- `POST /orders`
- `GET /orders`
- `GET /orders/:id`
- `POST /payments/create`
- `POST /payments/webhook`
- `GET /notifications`
- `PATCH /notifications/read`
- `POST /chat`

## Frontend Changes Needed To Attach Backend

### Authentication

Replace:

- localStorage-only session bootstrapping

With:

- token-based API login
- secure refresh flow
- backend user profile sync

### Cart and wishlist

Replace:

- browser-only persistence

With:

- API-backed user cart
- optional guest cart merge

### Orders and tracking

Replace:

- simulated tracking progression

With:

- real order status retrieval from backend

### Payments

Replace:

- demo completion flow

With:

- backend-generated payment intent/session
- backend webhook confirmation

### Chatbot

Replace:

- direct client-side AI coupling

With:

- backend chatbot endpoint

## Environment Variables Already Relevant

Current frontend already expects:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_GROQ_API_KEY`
- `VITE_GROQ_API_URL`
- `VITE_GROQ_MODEL`

For production, AI keys and sensitive payment logic should not be exposed from the client.

## Recommended Integration Order

1. Authentication
2. Catalog API normalization
3. Cart API
4. Checkout and order creation
5. Payment verification
6. Notifications
7. Chatbot backend proxy

## Production Readiness Advice

Before attaching the backend fully, also add:

- request validation
- error monitoring
- analytics
- test coverage
- role-based admin tools
- audit logging for orders and refunds
