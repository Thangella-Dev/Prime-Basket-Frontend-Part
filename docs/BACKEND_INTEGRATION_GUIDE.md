# Backend Integration Guide

## Current Docs Note

This file is retained as the older high-level backend guide. The current canonical backend entry point is [BACKEND.md](./BACKEND.md), and the detailed implementation module is [BACKEND_Integration_Modeule.md](./BACKEND_Integration_Modeule.md).

Use this file for a quick overview, and use `BACKEND.md` for the exact migration order, endpoint groups, frontend file map, validation rules, and production checklist.

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

- `POST /api/auth/send-phone-otp`
- `POST /api/auth/verify-phone-otp`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `PATCH /api/users/me`
- `GET /api/catalog/home`
- `GET /api/catalog/products/:id`
- `GET /api/catalog/categories`
- `GET /api/search`
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:id`
- `DELETE /api/cart/items/:id`
- `POST /api/checkout/quote`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/payments/session`
- `POST /api/payments/confirm`
- `POST /api/payments/webhook`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `POST /api/chat`

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
