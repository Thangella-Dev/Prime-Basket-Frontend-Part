# Tech Stack and Architecture

## Core Stack

- `React 18`
- `Vite 7`
- `React DOM`
- `Firebase Realtime Database`
- `i18next`
- `react-i18next`
- `react-router-dom` is installed, but the app mainly uses internal page state instead of full router-driven navigation
- `Tailwind CSS 4` is installed, but the current UI is mostly custom CSS driven

## Styling Approach

The application currently uses:

- Large shared stylesheet in `public/style.css`
- Page-specific CSS such as `src/pages/Account.css`
- Inline styles in some page-level components

This means the current visual system is powerful but mixed. A future cleanup could move more repeated styles into reusable components or shared tokens.

## Main Frontend Architecture

### App Shell

- `src/App.jsx`
  Controls top-level state such as page navigation, region, language, theme, cart, wishlist, checkout state, orders, and login modal state.

- `src/components/Layout.jsx`
  Wraps the shared page shell.

- `src/components/Header.jsx`
  Handles header behavior, region/language UI, notification dropdown, search overlay, and mobile drawer.

- `src/components/Footer.jsx`
  Shared footer.

### State and Context

- `src/context/AuthContext.jsx`
  Manages session and user data with localStorage-backed persistence.

- `src/context/TrackingContext.jsx`
  Handles active order tracking simulation and wallet state.

### Main Pages

- `src/pages/HomePage.jsx`
- `src/pages/CategoryPage.jsx`
  Handles category browsing, all-products mode, compact desktop filter controls, and category-specific product-grid presentation.
- `src/pages/ProductDetailPage.jsx`
- `src/pages/CartPage.jsx`
  Handles cart, mobile checkout presentation, promo flow, address selection, and recommended/special-deal product surfaces.
- `src/pages/PaymentPage.jsx`
- `src/pages/AccountPage.jsx`
- `src/pages/WishlistPage.jsx`
- `src/pages/OrderSuccessPage.jsx`
- `src/pages/OrderTrackingPage.jsx`
- `src/pages/OrderDetailPage.jsx`
- `src/pages/RateOrderPage.jsx`

### Supporting Systems

- `src/firebase.js`
  Firebase app and Realtime Database setup through environment variables.

- `src/services/groqService.js`
  Chatbot-related product selection and AI prompt preparation.

- `src/utils/productUtils.js`
  Product normalization and currency formatting utilities.

- `src/config/paymentConfig.js`
  Payment configuration logic.

- `src/i18n/translations.js`
  Translation content and language text handling.

## Navigation Model

The app is not currently router-first. It mostly uses:

- `page` state in `App.jsx`
- callback-based navigation
- some window events for cross-page actions

This works, but a future production refactor could move more navigation to a cleaner route-driven model.

## Data Model Summary

### Catalog

- Firebase Realtime Database for live catalog paths
- local data fallback for some region-specific flows

### User and commerce state

- localStorage-backed frontend persistence

### Chatbot

- client-side chatbot UI
- AI service prompt-building logic
- should be moved behind a backend proxy for safer production use

## Current Architecture Quality

What is already good:

- Clear enough page separation
- Reusable shell and shared state
- Good utility reuse in product/currency handling
- Context usage where it matters
- Major pages are already split

What should improve later:

- Reduce giant page-level inline styles
- Reduce amount of state living in `App.jsx`
- Move from demo persistence to real API persistence
- Consider route-driven navigation for long-term maintainability
- Introduce testing and stronger data contracts
