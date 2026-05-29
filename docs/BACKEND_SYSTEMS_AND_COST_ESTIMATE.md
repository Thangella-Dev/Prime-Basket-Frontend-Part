# Backend Systems And Cost Estimate

Date prepared: 2026-05-29

## Purpose

This document explains what backend systems Prime Basket should use to become a real production ecommerce application, which APIs are needed, which providers are suitable, and what the approximate monthly cost can look like.

Important pricing note:

- Prices change often. Treat this as a planning estimate, not a final quote.
- Payment, SMS, WhatsApp, and AI costs are usage-based and can grow quickly.
- Always verify pricing in the provider dashboard before buying.
- USD to INR changes over time. Keep final budgeting in the currency charged by each provider.

## Short Recommendation

For Prime Basket, the best practical production stack is:

- Frontend hosting: `Vercel`
- Backend API: `Node.js + Express` or `NestJS`
- Backend hosting: `Render` or `Railway`
- Main database: `PostgreSQL` through `Supabase` or `Neon`
- Cache and rate limiting: `Upstash Redis`
- File/proof upload storage: `Cloudflare R2`
- Push notifications: `Firebase Cloud Messaging`
- Email: `Resend`
- India payments: `Razorpay`
- Kenya payments: `Safaricom M-PESA Daraja`
- OTP/SMS: `MSG91` for India, `Africa's Talking`, `Infobip`, or `Twilio` for Kenya/global fallback
- AI/chatbot: `Groq` behind backend proxy
- Error monitoring: `Sentry`
- Uptime/log monitoring: `Better Stack`

This keeps the app production-friendly without making infrastructure too complex.

## Recommended Architecture

```txt
React/Vite Frontend
  |
  | HTTPS API calls
  v
Backend API
  |
  |-- Auth and OTP
  |-- Catalog and Search
  |-- Cart and Wishlist
  |-- Address and Checkout
  |-- Orders and Tracking
  |-- Payments and Webhooks
  |-- Refunds and Returns
  |-- Notifications
  |-- Chatbot Proxy
  |
  |-- PostgreSQL
  |-- Redis
  |-- Object Storage
  |-- Payment Providers
  |-- SMS/Email/Push Providers
```

## Core Backend Modules Needed

### 1. Auth And OTP

Needed features:

- Phone login
- OTP send and verify
- Access token and refresh token
- Logout
- Region lock by phone country code
- Profile update
- Account disable/delete support

Recommended implementation:

- Backend owns user sessions with JWT access tokens and refresh tokens.
- Backend sends OTP through SMS provider.
- Frontend stores only tokens and basic cached user profile.
- Backend enforces `India` or `Kenya` region rules after login.

Recommended APIs:

- `POST /api/auth/send-phone-otp`
- `POST /api/auth/verify-phone-otp`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/users/me`

Provider options:

| Provider | Best use | Pricing notes |
| --- | --- | --- |
| Custom JWT + SMS provider | Best control for production | Backend cost is your server cost plus SMS cost |
| Firebase Auth Phone | Fastest integration | Firebase says phone auth is billed per SMS sent |
| MSG91 | Strong India OTP option | Country-wise credit pricing; verify in MSG91 dashboard |
| Twilio | Global fallback and strong APIs | Twilio India SMS is listed around `$0.0832` per outbound SMS |
| Africa's Talking | Good Kenya/Africa option | Pricing varies by product/country; verify dashboard quote |
| Infobip | Enterprise-grade global SMS | Pay-as-you-go, country/network-specific pricing |

Recommendation:

- Use `custom backend auth + MSG91` for India OTP.
- Use `Africa's Talking`, `Infobip`, or `Twilio` for Kenya OTP depending on delivery tests.
- Keep Firebase Auth only if the team wants fastest setup over cost control.

## 2. Database

Prime Basket should use PostgreSQL for production commerce data.

Why PostgreSQL:

- Orders, payments, refunds, inventory, addresses, wallet, and audit logs are relational.
- It is easier to enforce consistency than with only Firebase Realtime Database.
- It works well with admin reporting and backend APIs.

Recommended tables:

- `users`
- `user_sessions`
- `products`
- `product_images`
- `categories`
- `inventory`
- `carts`
- `cart_items`
- `wishlists`
- `wishlist_items`
- `addresses`
- `orders`
- `order_items`
- `order_status_events`
- `payments`
- `refund_requests`
- `refund_status_events`
- `wallet_accounts`
- `wallet_transactions`
- `notifications`
- `reviews`
- `chat_logs`
- `audit_logs`

Provider options:

| Provider | Best use | Pricing notes |
| --- | --- | --- |
| Supabase | Easiest production Postgres with dashboard, auth options, storage options | Free tier available; Pro starts from `$25/month` |
| Neon | Serverless Postgres with branching and scale-to-zero | Free tier available; Launch has usage-based pricing with typical spend around `$15/month` |
| Render Postgres | Simple if backend is also on Render | Basic plans start low; production-size plans cost more |
| Railway Postgres | Simple if backend is also on Railway | Usage-based within Railway plan |
| Firebase Firestore/Realtime DB | Fast for realtime/demo features | Good for realtime tracking; less ideal as the only commerce ledger |

Recommendation:

- Use `Supabase Pro` if the team wants an easier admin dashboard and predictable start.
- Use `Neon Launch` if the team wants serverless Postgres and cheaper usage-based scaling.
- Keep Firebase only for specific realtime experiences if needed, not as the main order/payment ledger.

## 3. Backend Hosting

Recommended backend stack:

- `Node.js + Express` for simple and fast backend
- `NestJS` if the team wants more structure and enterprise-style modules

Provider options:

| Provider | Best use | Pricing notes |
| --- | --- | --- |
| Render | Simple production web services | Web service Starter is `$7/month`; Standard is `$25/month`; Pro workspace is `$25/month + compute` |
| Railway | Developer-friendly full-stack deployment | Hobby has `$5 minimum usage`; Pro has `$20 minimum usage` |
| Vercel Functions | Good for serverless API if API is lightweight | Pro is `$20/month + usage`; better for functions than long-running workers |
| Firebase Functions | Good if staying Firebase-first | Has free monthly function quota, then usage billing |
| AWS/GCP/Azure | Best at scale | More powerful but needs more DevOps ownership |

Recommendation:

- Start with `Render Standard` or `Railway Pro`.
- Add background worker later for notifications, refund status progression, and order events.

## 4. Cache, Rate Limiting, And Queue

Needed for:

- OTP rate limiting
- Login abuse protection
- Cart/session temporary state
- Payment webhook idempotency
- Background job coordination
- Search/cache acceleration

Provider options:

| Provider | Best use | Pricing notes |
| --- | --- | --- |
| Upstash Redis | Serverless Redis with simple REST API | Free tier includes 500K monthly commands; pay-as-you-go is `$0.20 per 100K commands`; fixed plan starts around `$10/month` |
| Railway Redis | Simple with Railway backend | Included/usage-based depending setup |
| Render Key Value | Simple with Render backend | Starter around `$10/month` for key-value instance |

Recommendation:

- Use `Upstash Redis` for OTP limits, API rate limits, and idempotency keys.

## 5. File Storage

Needed for:

- Product images if not using static assets
- Return/refund proof images
- Return/refund proof videos
- Invoices
- User profile images

Provider options:

| Provider | Best use | Pricing notes |
| --- | --- | --- |
| Cloudflare R2 | Low-cost object storage with no egress fee | Free tier includes 10 GB-month storage; paid standard storage is `$0.015/GB-month`; operations are billed separately |
| Firebase Storage | Easy if using Firebase | Free and paid usage depends on bucket type and region |
| Supabase Storage | Easy if using Supabase | Included on Supabase plans up to plan limits |
| AWS S3 | Enterprise standard | Reliable but egress can be expensive |

Recommendation:

- Use `Cloudflare R2` for refund proof files and future product media.
- Store only file metadata in PostgreSQL.

## 6. Payments

### India Payments

Recommended:

- `Razorpay`

Why:

- Strong India support
- UPI, cards, netbanking, wallets
- Good dashboard and webhooks
- Common ecommerce integration path

Pricing estimate:

- Razorpay standard pricing is shown as `2% + 18% GST` on transactions.
- Example: `Rs. 1,00,000` monthly online payment volume.
- Platform fee: `Rs. 2,000`.
- GST on fee: `Rs. 360`.
- Total gateway cost: about `Rs. 2,360`.

Required backend APIs:

- `POST /api/payments/razorpay/order`
- `POST /api/payments/razorpay/verify`
- `POST /api/webhooks/razorpay`

Important:

- Never verify payments only in frontend.
- Backend must verify Razorpay signature.
- Backend must create order only after payment is verified.

### Kenya Payments

Recommended:

- `Safaricom M-PESA Daraja`

Why:

- Native Kenya payment method
- Supports STK Push
- Better user trust for Kenya customers

Pricing estimate:

- M-PESA merchant charges vary by product and tariff.
- Safaricom business till tariff documentation says the business owner can be charged a maximum of `0.5%`, capped at `KSh 200` per transaction for money collected on the till.

Required backend APIs:

- `POST /api/payments/mpesa/stk-push`
- `POST /api/payments/mpesa/callback`
- `GET /api/payments/mpesa/status/:checkoutRequestId`

Important:

- Daraja callbacks must be server-side.
- Backend must map every callback to an order/payment row.
- Backend must handle pending, failed, cancelled, and timed-out payments.

## 7. Notifications

Notification types needed:

- OTP sent
- Login success
- Order placed
- Order packed
- Out for delivery
- Delivered
- Rating request
- Return submitted
- Refund approved/rejected
- Pickup scheduled
- Refund processed
- Offer/promo notifications

Recommended channels:

- In-app notifications stored in PostgreSQL
- Push notifications through Firebase Cloud Messaging
- Email through Resend
- SMS/WhatsApp only for important transactional events

Provider options:

| Provider | Best use | Pricing notes |
| --- | --- | --- |
| Firebase Cloud Messaging | App/browser push base layer | No-cost according to Firebase pricing |
| OneSignal | Advanced push/email/in-app journeys | Free plan available; Growth starts at `$19/month` plus usage |
| Resend | Transactional email | Free includes 3,000 emails/month; Pro starts at `$20/month` for 50,000 emails |
| SendGrid | Transactional email alternative | Essentials starts around `$19.95/month` |
| Twilio WhatsApp | WhatsApp fallback | Twilio fee is `$0.005/message` plus Meta template fees |

Recommendation:

- Start with `FCM + in-app notifications + Resend`.
- Add OneSignal later if marketing journeys and segmentation become important.
- Use SMS/WhatsApp only for high-value events because it becomes costly.

## 8. AI Chatbot Backend

Current frontend has chatbot UI. For production, the AI key must move to backend.

Recommended:

- Keep `Groq` for fast low-cost responses.
- Backend exposes `POST /api/chat`.
- Backend sends safe product/cart context to Groq.
- Backend rate-limits chat usage by user/IP.

Groq pricing note:

- Groq lists `Llama 3.3 70B Versatile` around `$0.59` per million input tokens and `$0.79` per million output tokens.
- Example: 1M input tokens + 1M output tokens is about `$1.38`.
- Example: 50M input tokens + 50M output tokens is about `$69`.

Important:

- Never expose `VITE_GROQ_API_KEY` in production frontend.
- Add spend limits and abuse protection.

## 9. Monitoring, Logs, And Errors

Needed before public launch:

- Frontend errors
- Backend errors
- API latency
- Payment webhook failures
- OTP delivery failures
- Uptime checks
- Log search
- Alerts to email/Slack/WhatsApp

Provider options:

| Provider | Best use | Pricing notes |
| --- | --- | --- |
| Sentry | Frontend/backend error monitoring | Free developer plan; Team is `$26/month`; Business is `$80/month` |
| Better Stack | Uptime, logs, status page, incidents | Free tier available; paid responder plan starts around `$29-$34/month` depending billing |
| Vercel Analytics/Speed Insights | Frontend traffic/performance | Vercel has included quotas and paid usage |

Recommendation:

- Use `Sentry` from day one.
- Use `Better Stack` for uptime checks and status page.
- Add structured backend logs before payment launch.

## 10. Admin Panel

Prime Basket needs an admin surface before real operations.

Admin features:

- Product create/edit/disable
- Product image upload
- Category management
- Region availability
- Inventory/stock update
- Order list
- Order status update
- Refund review
- Refund approval/rejection
- Pickup scheduling
- Notification sending
- User support view
- Payment/refund reconciliation

Fastest options:

- Build a protected React admin page inside this project.
- Or create a separate `Prime Basket Admin` app.
- Or use Supabase dashboard temporarily for database operations, but not as final operations tooling.

Recommendation:

- Build a separate admin route/app after backend schema is stable.

## Monthly Cost Estimate

These estimates exclude staff/developer cost and payment transaction fees.

### Development / Demo

Expected fixed cost: `$0-$30/month`

Possible stack:

- Vercel Hobby
- Neon Free or Supabase Free
- Upstash Free
- Cloudflare R2 Free
- FCM Free
- Resend Free
- Sentry Free
- Manual/test OTP only

Use this for:

- Internal testing
- Demo deployment
- Manager/client review

Not enough for:

- Real payments
- Real users
- Reliable OTP
- Production support

### MVP Beta

Expected fixed cost: `$60-$150/month` plus SMS/payment usage

Possible stack:

- Vercel Pro: `$20/month`
- Render Starter/Standard or Railway Hobby/Pro: `$7-$25/month`
- Supabase Pro or Neon Launch: `$15-$25/month typical starting range`
- Upstash: `$0-$10/month`
- Cloudflare R2: `$0-$5/month` for small proof uploads
- Resend Free/Pro: `$0-$20/month`
- Sentry Free/Team: `$0-$26/month`
- Better Stack Free or paid: `$0-$34/month`

Use this for:

- Small public beta
- Limited city launch
- Controlled orders

### Early Production

Expected fixed cost: `$200-$600/month` plus SMS/payment usage

Possible stack:

- Vercel Pro with team usage
- Render Standard/Pro or Railway Pro
- Supabase Pro with larger compute or Neon higher usage
- Upstash paid
- Cloudflare R2 paid usage
- Resend Pro
- Sentry Team/Business
- Better Stack paid
- SMS/WhatsApp provider with production sender registration

Use this for:

- Real launch
- Daily users
- Real order operations
- Real support and refunds

### Growth

Expected fixed cost: `$700-$2,000+/month` plus SMS/payment/AI usage

When needed:

- High order volume
- Multiple regions/cities
- High media storage
- High chatbot traffic
- Heavy notifications
- Admin team workflows
- Compliance and audit needs

At this stage:

- Add read replicas
- Add worker queues
- Add analytics warehouse
- Add fraud monitoring
- Negotiate payment/SMS rates
- Consider dedicated infrastructure

## Usage Cost Examples

### Razorpay Example

If India online payment volume is `Rs. 5,00,000/month`:

- Razorpay fee at `2%`: `Rs. 10,000`
- GST on platform fee at `18%`: `Rs. 1,800`
- Estimated monthly payment gateway cost: `Rs. 11,800`

### Twilio India OTP Example

If using Twilio India SMS at about `$0.0832/SMS`:

- 1,000 OTP messages: about `$83.20`
- 10,000 OTP messages: about `$832`

This is why India should use a local OTP provider like MSG91 if delivery tests are good.

### Groq Chatbot Example

For `Llama 3.3 70B Versatile`:

- 1M input + 1M output tokens: about `$1.38`
- 50M input + 50M output tokens: about `$69`

Final cost depends on prompt size, chat frequency, and product context size.

## Backend API Build Checklist

Build these backend modules in this order:

1. `apiClient.js` in frontend and backend base API.
2. Auth and OTP.
3. User profile and region lock.
4. Catalog and category APIs.
5. Product image/media handling.
6. Cart API.
7. Wishlist API.
8. Address API.
9. Checkout quote API.
10. Razorpay and M-PESA payment APIs.
11. Order creation and tracking APIs.
12. Notification APIs.
13. Refund/return request APIs.
14. Wallet APIs if wallet remains in scope.
15. Chatbot proxy API.
16. Admin APIs.
17. Monitoring, logging, rate limits, audit logs.

## Final Recommended Stack For Prime Basket

Use this for the first real production version:

| Area | Recommendation |
| --- | --- |
| Frontend | Vercel Pro |
| Backend | Node.js + Express or NestJS |
| Backend hosting | Render Standard or Railway Pro |
| Database | Supabase Pro or Neon Launch |
| Cache/rate limiting | Upstash Redis |
| Storage | Cloudflare R2 |
| India payment | Razorpay |
| Kenya payment | M-PESA Daraja |
| OTP | MSG91 for India, Africa's Talking/Infobip/Twilio for Kenya after delivery testing |
| Push | Firebase Cloud Messaging |
| Email | Resend |
| WhatsApp | Twilio WhatsApp or local BSP later |
| AI | Groq through backend proxy |
| Error monitoring | Sentry |
| Uptime/logs | Better Stack |

## Sources Checked

- Vercel pricing: https://vercel.com/pricing
- Render pricing: https://render.com/pricing
- Railway pricing: https://railway.com/pricing
- Supabase pricing: https://supabase.com/pricing
- Neon pricing: https://neon.com/pricing
- Upstash pricing: https://upstash.com/pricing
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Firebase pricing: https://firebase.google.com/pricing
- Razorpay pricing: https://razorpay.com/pricing/
- Safaricom M-PESA business till tariff: https://www.safaricom.co.ke/images/Downloads/the-mpesa-business-till-tariff.pdf
- Twilio SMS India pricing: https://www.twilio.com/en-us/sms/pricing/in
- Twilio WhatsApp pricing: https://www.twilio.com/en-us/whatsapp/pricing
- MSG91 pricing guidelines: https://msg91.com/help/all-service-deductions-
- Africa's Talking pricing: https://africastalking.com/pricing
- Infobip SMS pricing: https://www.infobip.com/sms/pricing
- Resend pricing: https://resend.com/docs/knowledge-base/what-is-resend-pricing
- SendGrid pricing: https://sendgrid.com/en-us/pricing
- OneSignal pricing: https://onesignal.com/pricing
- Sentry pricing: https://sentry.io/pricing/
- Better Stack pricing: https://betterstack.com/pricing
- Groq pricing: https://groq.com/pricing
