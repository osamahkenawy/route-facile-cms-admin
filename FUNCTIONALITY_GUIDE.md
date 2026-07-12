# Autostrad Admin Panel - Complete Functionality Guide

> **Purpose:** This document captures every feature, API call, business rule, and UI behavior from the current CoreUI-based admin panel. Use this as the single source of truth when rebuilding the UI in a new theme.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Environment Configuration](#2-environment-configuration)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [State Management](#4-state-management)
5. [API Layer (Setup.js)](#5-api-layer-setupjs)
6. [All API Endpoints (ConfigWeb.js)](#6-all-api-endpoints-configwebjs)
7. [Routing & Navigation](#7-routing--navigation)
8. [Layout Structure](#8-layout-structure)
9. [Dashboard](#9-dashboard)
10. [Bookings Module](#10-bookings-module)
11. [Car Management Module](#11-car-management-module)
12. [CMS Module](#12-cms-module)
13. [Pricing Module](#13-pricing-module)
14. [Dynamic Pricing Module](#14-dynamic-pricing-module)
15. [User Management Module](#15-user-management-module)
16. [User Requests Module](#16-user-requests-module)
17. [Stop Sale Module](#17-stop-sale-module)
18. [Misc Settings Module](#18-misc-settings-module)
19. [Voting / Surveys Module](#19-voting--surveys-module)
20. [Shared Components](#20-shared-components)
21. [Utility Functions & Custom Hooks](#21-utility-functions--custom-hooks)
22. [Notification System](#22-notification-system)
23. [Export Features (PDF & Excel)](#23-export-features-pdf--excel)
24. [Stub/Placeholder Pages](#24-stubplaceholder-pages)
25. [Key Libraries & Dependencies](#25-key-libraries--dependencies)

---

## 1. Architecture Overview

```
index.js
  └─ AppState (React Context Provider - auth)
       └─ Redux Provider (sidebar + theme)
            └─ App.js (BrowserRouter)
                 ├─ /login → Login (public)
                 ├─ /register → RegisterNew (public)
                 ├─ /404 → Page404 (public)
                 ├─ /500 → Page500 (public)
                 └─ /* → ProtectedRoute → DefaultLayout
                              ├─ AppSidebar (role-filtered navigation)
                              │    └─ AppSidebarNav (recursive renderer)
                              ├─ AppHeader
                              │    └─ AppHeaderDropdown (logout + auto-expiry timer)
                              ├─ AppContent (role-filtered route renderer)
                              │    └─ <Routes> rendered from routes.js
                              └─ AppFooter (empty)
```

### Key Architectural Decisions
- **No centralized data store** — all business data is managed via local `useState` in each page component
- **Redux** is only used for UI state: sidebar visibility (`sidebarShow`) and theme (`theme`)
- **React Context** (`AppContext` / `AppState`) holds `isAuthenticated` and `logoutCheck` but is mostly unused — real auth relies on `localStorage`
- **All API calls** go through helper functions in `Setup.js` — no Axios, no React Query
- **Role-based access** is implemented at both route level (`AppContent.js`) and nav level (`AppSidebar.js`)
- Theme is forced to `"light"` mode

---

## 2. Environment Configuration

### Environment Variables (from `.env` / `.env.staging` / `.env.production`)

| Variable | Purpose |
|---|---|
| `PORT` | Dev server port (default 3000) |
| `REACT_APP_API_KEY` | API key for backend authentication |
| `REACT_APP_NODE_HOST` | Base URL for all API calls (e.g., `https://api.example.com/api/v1/`) |
| `REACT_APP_FILE_SERVER` | Base URL for serving uploaded files/images (e.g., `https://files.example.com/`) |
| `REACT_APP_LOCAL_ENCRYPTION_KEY` | AES encryption key for encrypting user role in localStorage |

### Build Scripts
| Command | Purpose |
|---|---|
| `npm start` | Development with default `.env` |
| `npm run start:staging` | Development with `.env.staging` |
| `npm run start:prod` | Development with `.env.production` |
| `npm run build` | Production build |
| `npm run build:staging` | Staging build |
| `npm run docker:staging` | Docker staging deployment |

---

## 3. Authentication & Authorization

### Login Flow (`src/views/pages/login/Login.js`)

**API Call:**
- `POST {BASE_URL}admin/login` with body `{ email, password }`
- Uses `simplePostCall` (no auth headers)

**On Successful Login:**
1. Stores token in `localStorage("token")` as JSON:
   ```json
   {
     "access_token": "the-jwt-token",
     "user_id": "user-id-from-response",
     "expiry": 1234567890000  // Date.now() + 2 hours in ms
   }
   ```
2. Encrypts user role with AES: `CryptoJS.AES.encrypt(response.type, REACT_APP_LOCAL_ENCRYPTION_KEY)`
3. Stores encrypted role in `localStorage("autostrad_user_role")`
4. Navigates to `/` (which redirects to `/dashboard`)

**Login Form Fields:**
| Field | Type | Validation |
|---|---|---|
| Email | email input | HTML5 required + email format |
| Password | password input (with eye toggle) | HTML5 required |
| Remember Me | checkbox | No server-side implementation |

**UI Layout:** Split-panel — left side shows `admin_login_page.png` image, right side has the form with Autostrad logo.

### Token Expiry & Auto-Logout (`AppHeaderDropdown.js`)

- On mount, reads `localStorage("token")`, calculates time remaining until `expiry`
- Sets a `setTimeout` that auto-removes the token and redirects to `/login` at expiry
- Manual "Logout" button removes both `"token"` and `"autostrad_user_role"` from localStorage

### Route Protection (`ProtectedRoute.js`)

- Runs on every route change via `useEffect` with `location` dependency
- Reads and parses `localStorage("token")`
- If token is missing, expired, or malformed → removes token → `<Navigate to="/login">`
- If valid → renders the protected `element` (DefaultLayout)

### Role-Based Access Control

**Two roles identified:** `"admin"` (full access) and `"counter"` (limited access)

**How role is used:**

1. **AppContent.js** — Decrypts `localStorage("autostrad_user_role")` via AES
   - Admin: shows ALL routes
   - Non-admin: filters routes to only those with matching `roles` array
   - Wrong URL redirect: admin → `/dashboard`, counter → `/bookings`

2. **AppSidebar.js** — Same decryption, filters navigation items
   - Admin: shows all nav items
   - Non-admin: shows only items whose `roles` includes their role

**Routes with explicit role restrictions:**
| Route | Allowed Roles |
|---|---|
| `/bookings` (all bookings) | `["counter"]` |
| `/users/documents` | `["counter"]` |
| All other routes | Admin only (no `roles` specified = admin-only) |

### Registration Page (`RegisterNew.js`)
- Has form fields (first_name, last_name, email, password) but **submit logic is commented out**
- Not connected to any API — purely a UI shell

---

## 4. State Management

### Redux Store (`src/store.js`)

**Initial State:**
```js
{ sidebarShow: true, theme: 'light' }
```

**Single reducer action:** `type: "set"` — merges any properties into state.

**Usage across the app:**
| Component | Redux State Used | Dispatches |
|---|---|---|
| `AppSidebar` | `sidebarShow`, `sidebarUnfoldable` | `set: { sidebarShow }`, `set: { sidebarUnfoldable }` |
| `AppHeader` | `sidebarShow` | `set: { sidebarShow: !sidebarShow }` |
| `App.js` | `theme` (read only, unused) | None |

### React Context (`AppContext.js` / `AppState.js`)

Provides `{ isAuthenticated, logoutCheck }` but `isAuthenticated` is always `false` — auth is handled via localStorage directly.

---

## 5. API Layer (Setup.js)

**File:** `src/components/config.js/Setup.js`

This is the centralized HTTP utility library. All API calls in the app flow through one of these functions.

### Authentication Strategies

| Strategy | Header | Token Source |
|---|---|---|
| Bearer Token | `Authorization: Bearer {token}` | `JSON.parse(localStorage.token).access_token` |
| API Key | `x-api-key: {key}` | Hardcoded in Setup.js |
| Auth Token | `auth_token: {token}` | `localStorage.auth_token` |
| Legacy Token | `Authorization: Token {token}` | `localStorage.auth_token` |
| No Auth | No auth header | — |

### Commonly Used Functions

| Function | Method | Auth | Content-Type | Used For |
|---|---|---|---|---|
| `simplePostCall(url, body)` | POST (XHR) | API Key | JSON | Login |
| `simplePostCallAuth(url, body)` | POST | Bearer | JSON | Create operations (JSON) |
| `simplePutCallAuth(url, body)` | PUT | Bearer | JSON | Update operations (JSON) |
| `simpleGetCallAuth(url)` | GET | Bearer | — | All authenticated GET calls |
| `simpleGetCall(url)` | GET (XHR) | API Key | — | Unauthenticated GET calls |
| `simpleDeleteCallAuth(url)` | DELETE | Bearer | JSON | Delete operations |
| `multipartPostCall(url, body)` | POST | Bearer | multipart | File uploads (create) |
| `multipartPutWithAuthCall(url, body)` | PUT | Bearer | multipart | File uploads (update) |

### Utility Functions
| Function | Purpose |
|---|---|
| `getLocationName(latLng)` | Reverse geocodes via OpenStreetMap Nominatim |
| `getResult(data)` | Parses JSON from raw text |

---

## 6. All API Endpoints (ConfigWeb.js)

**File:** `src/components/config.js/ConfigWeb.js`

**Base URL:** `process.env.REACT_APP_NODE_HOST || "http://localhost:3001/api/v1/"`

### Authentication
| Key | Endpoint |
|---|---|
| `POST_LOGIN` | `admin/login` |

### Dashboard
| Key | Endpoint |
|---|---|
| `GET_DASHBOARD_STATS(type, from, to)` | `admin/dashboard/{type}?from={from}&to={to}` |
| `GET_DASHBOARD_STATS_COUNTS` | `admin/dashboard` |

### Bookings
| Key | Endpoint |
|---|---|
| `GET_BOOKINGS` | `admin/booking` |
| `GET_BOOKING_LOGS` | `admin/booking/log` |
| `GET_INCOMPLETE_BOOKING` | `admin/booking/incomplete` |
| `GET_REFUNDS` | `admin/refund` |
| `GET_REPORT` | `admin/booking/report` |

### Emirates
| Key | Endpoint |
|---|---|
| `GET_EMIRATES` / `GET_EMIRATE_LIST` | `admin/emirate` |
| `GET_EMIRATE_DETAILS(id)` / `PUT_EMIRATE_UPDATE(id)` | `admin/emirate/{id}` |

### Locations
| Key | Endpoint |
|---|---|
| `GET_LOCATIONS` / `GET_LOCATION_LIST` / `POST_CREATE_LOCATION` | `admin/location` |
| `GET_LOCATION_DETAILS(id)` / `PUT_LOCATION(id)` | `admin/location/{id}` |
| `*_LOCATION_EXCEPTION_HOURS(id)` | `admin/location/opening/hour/exception/{id}` |

### Homepage Banners
| Key | Endpoint |
|---|---|
| `GET_HOMEPAGE_BANNER_LIST` / `POST_HOMEPAGE_BANNER_CREATE` | `admin/home/banner` |
| `GET_HOMEPAGE_BANNER_DETAILS(id)` / `PUT_HOMEPAGE_BANNER_UPDATE(id)` / `DELETE_HOMEPAGE_BANNER(id)` | `admin/home/banner/{id}` |

### Special Offers
| Key | Endpoint |
|---|---|
| `GET_SPECIAL_OFFER_LIST` / `POST_SPECIAL_OFFER_CREATE` | `admin/offer` |
| `GET_SPECIAL_OFFER_DETAILS(id)` / `PUT_SPECIAL_OFFER_UPDATE(id)` / `DELETE_SPECIAL_OFFER(id)` | `admin/offer/{id}` |

### Awards & Certificates
| Key | Endpoint |
|---|---|
| `GET_AWARDS_AND_CERTIFICATE_LIST` / `POST_AWARDS_AND_CERTIFICATE_CREATE` | `admin/award/certificate` |
| `GET_AWARDS_AND_CERTIFICATE_DETAILS(id)` / `PUT_AWARDS_AND_CERTIFICATE_UPDATE(id)` / `DELETE_AWARDS_AND_CERTIFICATE(id)` | `admin/award/certificate/{id}` |

### Admin Pages (CMS Pages)
| Key | Endpoint |
|---|---|
| `GET_ADMIN_PAGES_LISTING` / `POST_ADMIN_PAGES_CREATE` | `admin/page` |
| `GET_ADMIN_PAGES_DETAILS(id)` / `PUT_ADMIN_PAGES_UPDATE(id)` | `admin/page/{id}` |

### Car Brands
| Key | Endpoint |
|---|---|
| `GET_BRANDS` / `POST_CAR_BRANDS` | `admin/car-brand` |
| `GET_CAR_BRAND_DETAILS(id)` / `PUT_CAR_BRAND_UPDATE(id)` / `DELETE_CAR_BRAND(id)` | `admin/car-brand/{id}` |

### Car Categories
| Key | Endpoint |
|---|---|
| `GET_CAR_CATEGORIES` / `POST_CAR_CATEGORIES` | `admin/car-category` |
| `GET_CAR_CATEGORY_DETAILS(id)` / `PUT_CAR_CATEGORY_UPDATE(id)` / `DELETE_CAR_CATEGORY(id)` | `admin/car-category/{id}` |

### Cars
| Key | Endpoint |
|---|---|
| `GET_CAR_LIST` / `POST_CAR_CREATE` | `admin/car` |
| `GET_CAR_DETAILS(id)` / `PUT_CAR_UPDATE(id)` / `DELETE_CAR(id)` | `admin/car/{id}` |
| `GET_CAR_FUEL_TYPE` | `admin/car-fuel_type` |
| `GET_CAR_TRANSMISSION` | `admin/car-transmission` |

### Car Groups
| Key | Endpoint |
|---|---|
| `GET_CAR_GROUPS` / `GET_CAR_GROUP_LIST` / `POST_CAR_GROUP` | `admin/car-group` |
| `GET_CAR_GROUP_DETAIL(id)` / `PUT_CAR_GROUP(id)` / `DELETE_CAR_GROUP(id)` | `admin/car-group/{id}` |

### Pricing
| Key | Endpoint |
|---|---|
| `POST_DAILY_PRICE` / `GET_DAILY_PRICE` | `admin/rate/daily` |
| `POST_MONTHLY_PRICE` / `GET_MONTHLY_PRICE` | `admin/rate/monthly/v2` |
| `POST_RANGE_PRICE` / `GET_RANGE_PRICE` | `admin/rate/range` |

### Dynamic Pricing — Discount Coupons
| Key | Endpoint |
|---|---|
| `POST_DISCOUNT_COUPON` / `GET_DISCOUNT_COUPON` | `admin/discount/coupon` |
| `GET_DISCOUNT_COUPON_DETAILS(id)` / `PUT_DISCOUNT_COUPON(id)` / `DELETE_DISCOUNT_COUPON(id)` | `admin/discount/coupon/{id}` |
| `GET_MONTHLY_DISCOUNT_COUPON_LIST` | `admin/discount/coupon` (with `?type=monthly`) |

### Dynamic Pricing — Surge
| Key | Endpoint |
|---|---|
| `POST_SURGE` / `GET_SURGE` | `admin/surge` |
| `GET_SURGE_DETAILS(id)` / `PUT_SURGE(id)` / `DELETE_SURGE(id)` | `admin/surge/{id}` |

### Dynamic Pricing — Range Discount
| Key | Endpoint |
|---|---|
| `PUT_RANGE_PRICING_CREATE` / `GET_RANGE_PRICING_LIST` | `admin/discount/range` |
| `PUT_RANGE_PRICING_UPDATE(id)` / `DELETE_RANGE_PRICING(id)` | `admin/discount/range/{id}` |

### User Requests
| Key | Endpoint |
|---|---|
| `GET_ENQUIRY_LIST` | `admin/user-enquiry` |
| `GET_LOST_AND_FOUND_LIST` | `admin/user-lost-found-request` |
| `GET_SUBSCRIPTION_LIST` | `admin/user/newsletter/subscription` |
| `GET_OFFER_LIST` | `admin/user-offer-enquiry` |

### Users
| Key | Endpoint |
|---|---|
| `GET_USER_DOCUMENT_LIST` | `admin/user/document` |
| `GET_USER_BOOKING_LIST` | `admin/user/booking` |

### Stop Sale
| Key | Endpoint |
|---|---|
| `GET_STOP_SALE_LIST` / `POST_CREATE_STOP_SALE` | `admin/stop/sale` |
| `GET_DETAIL_STOP_SALE(id)` / `PUT_UPDATE_STOP_SALE(id)` / `DELETE_STOP_SALE(id)` | `admin/stop/sale/{id}` |

### Misc Settings
| Key | Endpoint |
|---|---|
| `GET_OTHER_CHARGES_LIST` / `PUT_OTHER_CHARGES` | `admin/charges/other` |
| `GET_INTER_EMIRATE_CHARGES_LIST` / `PUT_INTER_EMIRATE_CHARGES` | `admin/charges/inter_emirates` |
| `DELETE_INTER_EMIRATE_CHARGES(id)` | `admin/charges/inter_emirates/{id}` |

### Teachers Rental
| Key | Endpoint |
|---|---|
| `TEACHERS_RATE` | `admin/rate/teacher` |

### UI Vote
| Key | Endpoint |
|---|---|
| `GET_UI_VOTE` | `ui-vote` |
| `GET_UI_VOTE_ALL` | `ui-vote/all` |

### EDC Promo
| Key | Endpoint |
|---|---|
| `GET_EDC_PROMO` / `PUT_EDC_PROMO` | `admin/edc/promo` |
| `GET_EDC_TERMS` / `POST_EDC_TERM` | `admin/edc/terms` |
| `GET_EDC_TERM_DETAILS(id)` / `PUT_EDC_TERM(id)` / `DELETE_EDC_TERM(id)` | `admin/edc/terms/{id}` |
| `PUT_EDC_TERMS_REORDER` | `admin/edc/terms/reorder` |

### Promo Ticker
| Key | Endpoint |
|---|---|
| `GET_PROMO_TICKER_LIST` / `POST_PROMO_TICKER_CREATE` | `admin/promo-ticker` |
| `GET_PROMO_TICKER_DETAILS(id)` / `PUT_PROMO_TICKER_UPDATE(id)` / `DELETE_PROMO_TICKER(id)` | `admin/promo-ticker/{id}` |

---

## 7. Routing & Navigation

### Route Configuration (`src/routes.js`)

All routes are defined as objects with `{ path, name, element, exact?, roles? }`. Lazy loading is NOT used for individual views — components are directly imported.

#### Dashboard
| Path | Component | Description |
|---|---|---|
| `/dashboard` | `Dashboard` | Main analytics dashboard |

#### Car Management
| Path | Component | Description |
|---|---|---|
| `/car/brand` | `CarBrand` | Car brand list |
| `/car/create-brand` | `CreateCarBrand` | Create car brand form |
| `/car/edit-brand/:id` | `CreateCarBrand` | Edit car brand form |
| `/car/category` | `CarCategoryList` | Car category list |
| `/car/create-category` | `CreateCarCategory` | Create car category form |
| `/car/edit-category/:id` | `CreateCarCategory` | Edit car category form |
| `/car/cardatabase` | `Cardatabase` | Car database list |
| `/car/create-car` | `CreateCar` | Create car form |
| `/car/edit-car/:id` | `CreateCar` | Edit car form |
| `/car/group` | `CarGroupList` | Car group list |
| `/car/create-group` | `CreateCarGroup` | Create car group form |
| `/car/edit-group/:id` | `CreateCarGroup` | Edit car group form |

#### CMS
| Path | Component | Description |
|---|---|---|
| `/cms/homepagebanners` | `HomepageBanner` | Banner list |
| `/cms/create-home-banner` | `CreateHomePageBanner` | Create banner form |
| `/cms/edit-home-banner/:id` | `CreateHomePageBanner` | Edit banner form |
| `/cms/emirates` | `Emirates` | Emirates list |
| `/cms/edit-emirate/:id` | `EditEmirate` | Edit emirate form |
| `/cms/locations` | `Locations` | Locations list |
| `/cms/create-location` | `CreateLocation` | Create location form |
| `/cms/edit-location/:id` | `CreateLocation` | Edit location form |
| `/cms/special-offers` | `SpecialOffers` | Special offers list |
| `/cms/create-special-offer` | `CreateSpecialOffers` | Create special offer form |
| `/cms/edit-special-offer/:id` | `CreateSpecialOffers` | Edit special offer form |
| `/cms/admin-pages` | `AdminPages` | Admin pages list |
| `/cms/create-admin-pages` | `CreateAdminPages` | Create admin page |
| `/cms/edit-admin-pages/:id` | `CreateAdminPages` | Edit admin page |
| `/cms/awards-and-recognition` | `AwardRecognition` | Awards list |
| `/cms/create-awards-and-recognition` | `CreateAwardRecognition` | Create award form |
| `/cms/edit-awards-and-recognition/:id` | `CreateAwardRecognition` | Edit award form |
| `/cms/teachers-rental` | `TeachersRental` | Teachers rental rates list |
| `/cms/promo-ticker` | `PromoTickerList` | Promo ticker list |
| `/cms/create-promo-ticker` | `CreatePromoTicker` | Create promo ticker form |
| `/cms/edit-promo-ticker/:id` | `CreatePromoTicker` | Edit promo ticker form |
| `/cms/edc-promo` | `EdcPromo` | EDC promo settings |
| `/cms/edc-terms` | `EdcTerms` | EDC terms & conditions |

#### Pricing
| Path | Component | Description |
|---|---|---|
| `/pricing/upload-daily-pricing` | `Uploaddailypricing` | Upload daily pricing Excel |
| `/pricing/upload-monthly-pricing` | `Uploadmonthlypricing` | Upload monthly pricing Excel |
| `/pricing/monthly-price-list` | `Monthlypricelist` | Monthly pricing list |
| `/pricing/upload-range-pricing` | `UploadRangePricing` | Upload range pricing Excel |
| `/pricing/range-pricing-list` | `Rangepricinglist` | Range pricing list |

#### Dynamic Pricing
| Path | Component | Description |
|---|---|---|
| `/dynamicpricing/coupon-code` | `CouponCode` | Daily coupon list |
| `/dynamic-pricing/create-discount-coupon` | `CreateCouponCode` | Create daily coupon |
| `/dynamic-pricing/edit-discount-coupon/:id` | `CreateCouponCode` | Edit daily coupon |
| `/dynamicpricing/monthly-coupon-code` | `MonthlyCouponCodeList` | Monthly coupon list |
| `/dynamicpricing/create-monthly-coupon-code` | `CreateMonthlyCouponCode` | Create monthly coupon |
| `/dynamicpricing/edit-monthly-coupon-code/:id` | `CreateMonthlyCouponCode` | Edit monthly coupon |
| `/dynamic-pricing/surge-pricing` | `SurgeList` | Surge pricing list |
| `/dynamic-pricing/create-surge` | `CreateSurge` | Create surge pricing |
| `/dynamic-pricing/edit-surge/:id` | `CreateSurge` | Edit surge pricing |
| `/dynamic-pricing/range-pricing` | `CreateRangePricing` | Range pricing discounts |

#### Bookings
| Path | Component | Description |
|---|---|---|
| `/bookings/all-bookings` | `Bookings` | Main bookings list (roles: `["counter"]`) |
| `/bookings/logs` | `BookingLogs` | Booking transaction logs |
| `/bookings/incomplete` | `IncompleteBookings` | Incomplete/failed bookings |
| `/bookings/refunds` | `RefundList` | Refunds list |
| `/download-report` | `DownloadReport` | Excel report download |

#### Users
| Path | Component | Description |
|---|---|---|
| `/users` | `UserBookings` | Users with booking stats |
| `/users/documents` | `DocumentList` | User documents (roles: `["counter"]`) |

#### User Requests
| Path | Component | Description |
|---|---|---|
| `/user-request/enquiry-request` | `EnquiryRequest` | User enquiries |
| `/user-request/lost-and-found-request` | `LostAndFoundRequest` | Lost & found requests |
| `/user-request/subscription-request` | `SubscriptionRequest` | Newsletter subscriptions |
| `/user-request/offer-request` | `OfferRequest` | Offer enquiries |

#### Stop Sale
| Path | Component | Description |
|---|---|---|
| `/stop-sale/stop-sale-list` | `StopSaleList` | Stop sale list |
| `/stop-sale/create-stop-sale` | `CreateStopSale` | Create stop sale |
| `/stop-sale/edit-stop-sale/:id` | `CreateStopSale` | Edit stop sale |

#### Misc Settings
| Path | Component | Description |
|---|---|---|
| `/misc-setting/other-charges` | `OtherCharges` | Global charges settings |
| `/misc-setting/inter-emirate-charges` | `InterEmirateCharges` | Inter-emirate charges |

#### Other
| Path | Component | Description |
|---|---|---|
| `/new-design-vote` | `NewDesignVote` | UI design vote dashboard |
| `/ui-vote` | `UIVote` | UI vote dashboard (duplicate of above) |

### Sidebar Navigation (`src/_nav.js`)

The sidebar is organized into these groups (each with sub-items):
1. **Dashboard** — `/dashboard`
2. **Car** — Brand, Category, Cars, Car Groups
3. **CMS** — Homepage Banners, Emirates, Locations, Special Offers, Pages, Awards, Teachers Rental, Promo Ticker
4. **EDC Promotions** — EDC Promo Code, EDC Terms & Conditions
5. **User Request** — Enquiry, Lost & Found, Subscription, Offer
6. **Pricing** (nested sub-groups) — Daily (upload/list), Monthly (upload/list), Range (upload/list)
7. **Dynamic Pricing** — Range Discount, Daily Coupon, Monthly Coupon, Surge Pricing
8. **Users** — Documents (roles: `["counter"]`), Users
9. **Bookings** — Bookings (roles: `["counter"]`), Booking Logs, Incomplete, Refunds, Download Report
10. **Misc. Settings** — Other Charges, Inter Emirate Charges
11. **New Design Vote**

---

## 8. Layout Structure

### DefaultLayout (`src/layout/DefaultLayout.js`)
- Sidebar on the left, content area on the right
- Special CSS class `"logs-page"` added to `<div id="root">` when path is `/bookings/logs` or `/bookings` (enables full-width styling)
- ToastContainer rendered here for notifications

### AppHeader
- Fixed top navbar
- Left: sidebar toggle button (double-arrow icons)
- Right: Admin dropdown with logout
- Adds `shadow-sm` class on scroll
- Dark/light mode toggle is commented out

### AppSidebar
- Full logo from file server: `{REACT_APP_FILE_SERVER}all-images/logo.png`
- Small logo for collapsed mode: local `logo_small.png`
- Collapsible via Redux `sidebarUnfoldable`
- Close button visible only on mobile (`d-lg-none`)
- Navigation items filtered by user role

### AppSidebarNav
- Recursively renders navigation tree
- Supports nested `CNavGroup` with collapsible togglers
- Uses `NavLink` from react-router-dom for active state highlighting
- Custom scrollbar via `simplebar-react`

---

## 9. Dashboard

### Container: `src/views/dashboard/Dashboard.js`
### Presentation: `src/views/dashboard/DashboardPresentation.js`

### Stat Cards (4 cards at top)
| Card | Value Source | Icon |
|---|---|---|
| Total Bookings | `countsStats.total_bookings` | Calendar |
| Incomplete Bookings | `countsStats.incomplete_bookings` | Warning |
| Active Cars | `countsStats.total_cars` | Car |
| Total Users | `countsStats.total_users` | Users |

### Charts (12 chart types)

| Chart | Type | Data Source | Description |
|---|---|---|---|
| `booking_date` | Line | Last 7 days from bookings | Daily booking trend |
| `booking_month` | Bar | Last 6 months from bookings | Monthly booking volume |
| `pickup_type` | Pie | Frequency count | Self pickup vs delivery |
| `dropoff_type` | Pie | Frequency count | Self dropoff vs collection |
| `type` | Pie | Frequency count | Daily vs monthly bookings |
| `payment_type` | Pie | Frequency count | Pay now vs pay later |
| `emirate` | Doughnut | Dashboard API | Bookings per emirate |
| `action` | Pie | Dashboard API | Booking actions (new/edit/extend/cancel) |
| `booking_source` | Pie | Frequency count | Web vs mobile vs API |
| `car` | Doughnut | Dashboard API (top 10) | Most booked cars |
| `group` | Doughnut | Dashboard API | Bookings by car group |
| `location` | Doughnut | Dashboard API | Bookings by location |

### Data Fetching Strategy
1. First fetches all bookings from `GET admin/booking`
2. Computes stats locally: total bookings, unique users, unique cars, unique locations, incomplete count
3. Generates charts from booking data for 7 types (booking_date, booking_month, pickup_type, dropoff_type, type, payment_type, booking_source)
4. Falls back to individual `GET admin/dashboard/{type}?from=&to=` calls for remaining 5 types
5. On any API error, falls back to hardcoded dummy data

### Date Range Filter
- Presets: Today, Yesterday, Last 3/7 Days, This Month, Last 3/6 Months, This Year, Custom Range
- Custom range uses `react-daterange-picker` calendar component
- Default: current month (1st to today)
- Re-fetches all data on selection change

### Chart Features
- Zoom plugin (mouse wheel + pinch)
- Pan on x-axis
- Custom legend with values: `"(count) label"`
- Dark tooltips with locale-formatted numbers

### Fallback Dummy Data
If APIs fail, shows hardcoded realistic data to prevent blank dashboard.

---

## 10. Bookings Module

### 10.1 All Bookings (`src/views/base/Bookings/Bookings.js`)

**API:** `GET admin/booking` with extensive query params

**Search Filters (13 filters):**
| Filter | Type | Values |
|---|---|---|
| Booking Created Date From/To | Date picker | — |
| Pickup Date From/To | Date picker | — |
| Booking Number | Text input | — |
| User Email | Text input | Pre-filled from URL `?user_email=` |
| Payment Type | Dropdown | Pay Now, Pay Later |
| Booking Type | Dropdown | Daily, Monthly |
| Status | Dropdown | Booked, Edited, Extended, Cancelled |
| Pickup Type | Dropdown | Self, Delivery |
| Dropoff Type | Dropdown | Self, Collection |
| Emirate | Dropdown (from API) | Dynamic |
| Location | Dropdown (from API, filtered by emirate) | Dynamic |
| Booking Source | Dropdown | Web, Mobile |
| Promo Code | Text input | — |

**Table Columns (35):**
Sr No, ARC Number, Booking ID, Source, Booking Date, Status, Type, Payment, Days, Months, Extra Days, User Name, User Email, User Phone, Car, Pickup Type, Pickup Location, Pickup Emirate, Pickup DateTime, Pickup Address, Dropoff Type, Dropoff Location, Dropoff Emirate, Dropoff DateTime, Dropoff Address, Payfort ID, Car Rate, Inter Emirate Charges, Parking Charges, VMD Charges, Delivery Charges, Collect Charges, Coupon Code, Tax Amount, Booking Amount

**Summary Data:** Total Bookings, Total Revenue, Date Range (from API response `summary` field)

**Export:** PDF + Excel (see Section 23)

**Server-side pagination** with page size options: 10, 25, 50, 100, 500, 1000

### 10.2 Booking Logs (`src/views/base/Bookings/BookingLogs.js`)

**API:** `GET admin/booking/log` with filters: `user_email`, `payment_type`, `booking_number`, `booking_log_number`

**Search Filters:**
| Filter | Type |
|---|---|
| Payment Type | Dropdown (Pay Now / Pay Later) |
| Booking Number | Text input |
| Log Number | Text input |
| Email | Text input |

**Table Columns (29):**
ID, Source (web/mobile icon), Action, ARC#, Log#, Type, Payment, Days, Months, Extra Days, Booking Date, User Name, Email, Phone, Pickup (type/location/address/datetime), Dropoff (type/location/address/datetime), Car, Group, Payment Triggered, Payment Status, Payfort ID, Car Extras (tooltip), Payfort Response (tooltip)

**Special Features:**
- Address fields link to Google Maps: `https://www.google.com/maps/place/{lat},{lng}`
- Car Extras shown in tooltip/popover component
- Payfort Response shown in tooltip/popover component

### 10.3 Incomplete Bookings (`src/views/base/Bookings/IncompleteBookings.js`)

**API:** `GET admin/booking/incomplete` with filters: `from`, `to`, `user_email`

**Search Filters:** From Date, To Date, User Email

**Table Columns (29):** Same as Booking Logs

**Special Features:**
- Source icons (blue globe for web, green phone for mobile)
- `TruncateWithTooltip` component for long text (address, payfort response)

### 10.4 Refund List (`src/views/base/Bookings/RefundList.js`)

**API:** `GET admin/refund` with filters: `email`, `booking_number`

**Search Filters:** Email, Booking Number

**Table Columns:** Similar to booking logs with refund-specific data

### 10.5 Download Report (`src/views/base/Bookings/DownloadReport/DownloadReport.js`)

**API:** `POST admin/booking/report` with body `{ from: ID }`

**Form Fields:** Single "ID From" number field

**Functionality:** Submits starting ID, API returns an Excel file, auto-downloads as "Report.xlsx"

---

## 11. Car Management Module

### 11.1 Car Brands

**List:** `src/views/base/car/CarBrand/CarBrand.js`
- **API:** `GET admin/car-brand?page=&page_size=`
- **Table:** #, Name, Image, Status, Created By, Created At, Action (edit/delete)
- **Image:** `{REACT_APP_FILE_SERVER}admin/car/brand/{image}`
- **Delete:** `DELETE admin/car-brand/{id}` with confirmation modal

**Create/Edit:** `src/views/base/car/CarBrand/CreateCarBrand.js`
- **API Create:** `POST admin/car-brand` (multipart FormData)
- **API Update:** `PUT admin/car-brand/{id}` (multipart FormData)
- **Form Fields:** Status (Active/Inactive), Brand Name EN, Brand Name AE, Brand Image (file upload with preview)

### 11.2 Car Categories

**List:** `src/views/base/car/CarCategory/CarCategoryList.js`
- Same pattern as Car Brands
- **API:** `GET admin/car-category`, `DELETE admin/car-category/{id}`
- **Image:** `{REACT_APP_FILE_SERVER}admin/car/category/{image}`

**Create/Edit:** `src/views/base/car/CarCategory/CreateCarCategory.js`
- Same pattern as CreateCarBrand
- **API:** `POST/PUT admin/car-category`
- **Form Fields:** Status, Category Name EN, Category Name AE, Category Image

### 11.3 Car Database

**List:** `src/views/base/car/carDataBase/Cardatabase.js`
- **API:** `GET admin/car?name_en=&category_id=&group_id=&page=&page_size=`
- **Filters:** Car Name (text), Category (dropdown from API), Group (dropdown from API)
- **Delete:** `DELETE admin/car/{id}`

**Create/Edit:** `src/views/base/car/carDataBase/CreateCar.js`

This is the **most complex form** in the entire application.

**API Calls on Mount (6 parallel):**
1. `GET admin/car-brand?page_size=9999` → Brands dropdown
2. `GET admin/car-category?page_size=9999` → Categories dropdown
3. `GET admin/car-group?page_size=9999` → Groups dropdown
4. `GET admin/car-fuel_type?page_size=9999` → Fuel type dropdown
5. `GET admin/car-transmission?page_size=9999` → Transmission dropdown
6. `GET admin/emirate?page_size=1000` → Emirates for special rates

**API Create:** `POST admin/car` (multipart FormData)
**API Update:** `PUT admin/car/{id}` (multipart FormData)

**Form Sections:**

**1. Basic Information:**
| Field | Type | Validation |
|---|---|---|
| Status | Select (Active/Inactive) | Required |
| Name EN | Text | Required |
| Name AE | Text | Required |
| Brand | Select (from API) | Required |
| Category | Select (from API) | Required |
| Group | Select (from API) | Required |
| Fuel Type | Select (from API) | Required |
| Transmission | Select (from API) | Required |

**2. Specifications:**
| Field | EN | AE (Arabic numerals) |
|---|---|---|
| Doors | Number | Number |
| Passengers | Number | Number |
| Suitcases | Number | Number |

**3. Features (Toggle Switches):**
Air Bags, Parking Sensors, Bluetooth, Infotainment System, Cruise Control, Sunroof, Rear Camera, Electric

Each feature stores "0" or "1".

**4. Images:**
| Image Field | Exact Required Dimensions | Validation |
|---|---|---|
| Main Car Image | 1000 x 525 px | Pixel-exact dimension check |
| Banner Image | 1600 x 500 px | Pixel-exact dimension check |
| Gallery Images | No restriction | Multiple file upload |
| Special Rates Image | Max 2MB, JPG/PNG only | File type + size check |

**5. Special Rates per Emirate:**
- Radio selection: None / All Emirates / Specific Emirates
- If "Specific": checkboxes for each emirate from API
- Sent as JSON: `{ all: true }` or `{ all: false, ids: [1, 2, 3] }`

**6. Description:**
- CKEditor for English description
- CKEditor for Arabic description (RTL)

### 11.4 Car Groups

**List:** `src/views/base/car/CarGroup/Listing.js`
- **API:** `GET admin/car-group?page=&page_size=`
- **Table:** #, Name, Status, Action
- **Delete:** `DELETE admin/car-group/{id}`

**Create/Edit:** `src/views/base/car/CarGroup/Create.js`
- **API:** `POST/PUT admin/car-group`
- **Form Fields:** Status, Name EN, Name AE

---

## 12. CMS Module

### 12.1 Homepage Banners

**List:** `src/views/base/cms/HomePageBanner/HomepageBanner.js`
- **API:** `GET admin/home/banner?page=1&page_size=1000`
- **Client-side filtering:** Status filter, Sort by order (ASC/DESC), Active-only toggle, Text search
- **Table:** #, Image, Alt Text, URL, Status (checkmark/cross), Order (badge), Action
- **Image:** `{REACT_APP_FILE_SERVER}admin/banner/{desktop}`
- **Delete:** `DELETE admin/home/banner/{id}`

**Create/Edit:** `src/views/base/cms/HomePageBanner/CreateHomePageBanner.js`
- **API Create:** `POST admin/home/banner` (multipart)
- **API Update:** `PUT admin/home/banner/{id}` (multipart)
- **Form Fields:** Status, Order (number), Image Alt Text, URL, Mobile Image (file), Desktop Image (file)

### 12.2 Emirates

**List:** `src/views/base/cms/Emirates/Emirates.js`
- **API:** `GET admin/emirate?page=1&page_size=1000`
- **Table:** ID, Name (EN + AE), Buffer Hours, Status, Action
- **No create** — only edit available

**Edit:** `src/views/base/cms/Emirates/EditEmirate.js`
- **API Fetch:** `GET admin/emirate/{id}`
- **API Update:** `PUT admin/emirate/{id}`
- **Form Fields:**
  - Name EN, Name AE, Status, Buffer Hours, Contact Number
  - Recipients (comma-separated emails, sent as array)
  - **Weekly Opening Hours:** 7 days × 1 shift, each with From Time, To Time, and "Closed" checkbox
  - Times stored as decimal hours (e.g., 4.5 = 4:30 AM, 13.75 = 1:45 PM)

### 12.3 Locations

**List:** `src/views/base/cms/Locations/Locations.js`
- **API:** `GET admin/location?page=1&page_size=1000&is_virtual=`
- **Filters:** Virtual/Non-Virtual/All toggle buttons
- **Table:** ID, Name (EN + AE), Timing (EN + AE), Status, Is Virtual (YES/NO), Action

**Create/Edit:** `src/views/base/cms/Locations/CreateLocation.js`

This is one of the **most complex forms** — includes opening hours management.

- **API Create:** `POST admin/location` (JSON)
- **API Update:** `PUT admin/location/{id}` (JSON)

**Form Fields:**
| Field | Type |
|---|---|
| Name EN / AE | Text |
| Address EN / AE | Text |
| Status | Select |
| Is Virtual | Select |
| Order | Number |
| Buffer Hours | Number |
| Pickup Available | Select (Yes/No) |
| Dropoff Available | Select (Yes/No) |
| Recipients | Text (comma-separated) |
| Latitude | Number |
| Longitude | Number |
| Contact Number | Text |
| Timing Detail EN / AE | Text |
| Parking Charges | Number |
| Emirate | Select (from API) |

**Opening Hours (7 days × 2 shifts):**
For each day (Sunday–Saturday), for each shift (Shift 1, Shift 2):
- From Time (time input)
- To Time (time input)
- Closed checkbox (sets `is_closed: 1`)
- Times converted to decimal hours for API

**Exception Hours (dynamic rows):**
- Start Date, End Date, Day, Shift (1/2), From Hours, To Hours
- CRUD: Create, Update, Delete individual exception rows
- API: `POST/PUT/DELETE admin/location/opening/hour/exception/{id}`

### 12.4 Special Offers

**List:** `src/views/base/cms/SpecialOffers/SpecialOffers.js`
- **API:** `GET admin/offer?status=&page=1&page_size=1000`
- **Table:** #, Image, Title, Start Date, End Date, Status, Action
- **Image:** `{REACT_APP_FILE_SERVER}admin/offer/{desktop}`
- **Delete:** `DELETE admin/offer/{id}`

**Create/Edit:** `src/views/base/cms/SpecialOffers/CreateSpecialOffers.js`
- **API Create:** `POST admin/offer` (multipart)
- **API Update:** `PUT admin/offer/{id}` (multipart)
- **Form Fields:** Status, Featured (Yes/No), Title EN, Title AE, Image Alt Text, Start Date, End Date, Emirate (dropdown from API), Mobile Image (file), Desktop Image (file), Description EN (**CKEditor**), Description AE (**CKEditor**)

### 12.5 Admin Pages (CMS Static Pages)

**List:** `src/views/base/cms/AdminPages/AdminPages.js`
- **API:** `GET admin/page?status=&page=1&page_size=1000`
- **Table:** #, Key (type), Title, Status, Action

**Create/Edit:** `src/views/base/cms/AdminPages/CreateAdminPages.js`
- **API Create:** `POST admin/page` (JSON)
- **API Update:** `PUT admin/page/{id}` (JSON)
- **Form Fields:** Title EN, Title AE, Type (text), Status, Content EN (**CKEditor**), Content AE (**CKEditor**)
- **UI:** Tabbed interface switching between EN/AE content

### 12.6 Awards & Recognition

**List:** `src/views/base/cms/AwardsAndRecognition.js/AwardRecognition.js`
- **API:** `GET admin/award/certificate?status=&type=&page=1&page_size=1000`
- **Filters:** Status + Type (award/certificate)
- **Table:** #, Image, Title, Type, Link, Status, Action
- **Image:** `{REACT_APP_FILE_SERVER}admin/awards_and_certificates/{desktop}`
- **Delete:** `DELETE admin/award/certificate/{id}`

### 12.7 Teachers Rental

**List:** `src/views/base/cms/TeachersRental/TeachersRental.js`
- **API:** `GET admin/rate/teacher`
- **Table:** Car ID, Car Name, Rate
- **Read-only** — no edit/delete

### 12.8 Promo Ticker

**List:** `src/views/base/cms/PromoTicker/PromoTickerList.js`
- **API:** `GET admin/promo-ticker?page=1&page_size=1000`
- **Special Features:**
  - "LIVE" badge on tickers currently active (date range includes today AND status=1)
  - **Inline status toggle** — clicking status sends full PUT with toggled value
  - Sort by order, active-only filter
- **Table:** ID, Text EN (with LIVE badge), Status (clickable), Date Range, Sort Order, Actions
- **Delete:** `DELETE admin/promo-ticker/{id}`
- **Toggle Status:** `PUT admin/promo-ticker/{id}` (full body with flipped status)

**Create/Edit:** `src/views/base/cms/PromoTicker/CreatePromoTicker.js`
- **API Create:** `POST admin/promo-ticker` (JSON)
- **API Update:** `PUT admin/promo-ticker/{id}` (JSON)
- **Form Fields:** Text EN (textarea, 255 max), Text AE (textarea, RTL, 255 max), Description EN, Description AE, Link, Start Date, End Date, Sort Order, Status (radio buttons)
- **Validation:** Character count limits (255), end date >= start date, status must be 0 or 1

### 12.9 EDC Promo Code

**Settings Page:** `src/views/base/cms/EdcPromo/EdcPromo.js`
- Single settings form (not a list)
- **API Fetch:** `GET admin/edc/promo`
- **API Update:** `PUT admin/edc/promo`
- **Form Fields:**
  | Field | Type |
  |---|---|
  | Promo Code | Text |
  | Discount Type | Select (percentage / fixed_amount) |
  | Discount Percentage | Number (shown when percentage type) |
  | Fixed Discount Amount | Number with AED (shown when fixed type) |
  | Is Active | Checkbox |
  | Valid From / Until | Date pickers |
  | Max Uses | Number |
  | Max Uses Per User | Number |
  | Current Uses | Read-only display |
  | Min Rental Days | Number |
  | Applicable Vehicles | Select (all/economy/sedan/suv/luxury) |
  | Description EN / AE | Textarea |

### 12.10 EDC Terms & Conditions

**CRUD Page:** `src/views/base/cms/EdcPromo/EdcTerms.js`
- **API List:** `GET admin/edc/terms?page=&page_size=`
- **API Create:** `POST admin/edc/terms`
- **API Update:** `PUT admin/edc/terms/{id}`
- **API Delete:** `DELETE admin/edc/terms/{id}`
- **API Reorder:** `PUT admin/edc/terms/reorder` with body `{ items: [{ id, sort_order }, ...] }`
- **Table:** #, Term (English), Term (Arabic), Status, Actions (up/down arrows, edit, delete)
- **Inline modal** for create/edit
- **Drag reorder** via up/down arrows that trigger bulk reorder API
- **Form Fields (in modal):** Text EN, Text AE, Is Active, Sort Order

---

## 13. Pricing Module

### 13.1 Upload Daily Pricing

**File:** `src/views/base/pricing/Uploaddailypricing.js`
- **API:** `POST admin/rate/daily` (multipart FormData)
- **Form Fields:** Year (select 2021-2030), Emirate (react-select multi), Excel File (file upload)
- **Sample Download:** `Pricing_Master_sample.xlsx` template
- **Body:** FormData with `year`, `file` (Excel), `emirate_ids` (comma-separated)

### 13.2 Upload Monthly Pricing

**File:** `src/views/base/pricing/Uploadmonthlypricing.js`
- **API:** `POST admin/rate/monthly/v2` (multipart FormData)
- **Form Fields:** Year, Vehicle Model Year (select 2020-2026, optional), Emirate (multi), Excel File
- **Sample Download:** `Monthly_Pricing_Master_Sample.xlsx`

### 13.3 Monthly Price List

**File:** `src/views/base/pricing/Monthlypricelist.js`
- **API:** `GET admin/rate/monthly/v2?car_id=&year=&vehicle_model_year=&group_id=&emirate_id=&page=&page_size=`
- **Filters:** Year, Vehicle Model Year, Emirate, Car Group, Car Name (all from API dropdowns)
- **Table (19 columns):** Year, Vehicle Model Year, Emirate, Group, Months, Car Name, Rate, Mileage, CDW, SCDW, PAI, Driver Fee, Baby Seat, GPS, Extra 1000/2000/3000 KM Rate, Created By, Created At

### 13.4 Upload Range Pricing

**File:** `src/views/base/pricing/UploadRangePricing.js`
- **API:** `POST admin/rate/range` (multipart FormData)
- **Form Fields:** Emirate (multi), Delivery Rates toggle (disables location), Location (multi, auto-filtered by emirate, virtual locations labeled), Start/End Date (optional override), Excel File
- **Two Sample Templates:** "Simple Template" (auto-generated CSV with group/day/amount columns) and "Full Template" (.xlsx)
- **Special Logic:**
  - Locations filtered by selected emirates
  - Active locations only (status=1)
  - Virtual locations get "(Virtual)" suffix
  - Dates override Excel file dates when provided
  - Uses custom hook `useFilterByIds` for emirate→location filtering

### 13.5 Range Pricing List

**File:** `src/views/base/pricing/Rangepricinglist.js`
- **API:** `GET admin/rate/range?group_id=&emirate_id=&location_id=&start_date=&end_date=&page=&page_size=`
- **Filters:** Emirate, Car Group, Location, Date Range (From/To)
- **Table (10 columns):** Car Group, Location, Emirate, Start Date, End Date, Start Day, End Day, Total Amount, Created By, Created At

---

## 14. Dynamic Pricing Module

### 14.1 Daily Coupon Codes

**List:** `src/views/base/dynamicPricing/CouponCode.js`
- **API:** `GET admin/discount/coupon?page=&page_size=`
- **Table:** Code, From Date, To Date, Status, CDW, SCDW, PAI, GPS, Baby Seat, Driver, Rate, Created By, Created At, Action
- **Delete:** `DELETE admin/discount/coupon/{id}`

**Create/Edit:** `src/views/base/dynamicPricing/CreateCouponCode.js`
- **API Create:** `POST admin/discount/coupon` (JSON)
- **API Update:** `PUT admin/discount/coupon/{id}` (JSON)
- **Form Sections:**

  **Basic Info:** Coupon Code, Status (Active/Inactive), Applicable For (checkboxes: Web/API/Mobile), Note

  **Validity:** Start Date, End Date

  **Discount Rates (%):** Rate, CDW, SCDW, PAI, GPS, Baby Seat, Driver

  **Applicability (all react-select multi with "All" option):**
  - Emirate → Location (filtered by emirate) → Car Group → Car
  - When "All" selected: `{ all: true, ids: [] }`
  - When specific items: `{ all: false, ids: [1, 2, 3] }`

- **Request Body:**
  ```json
  {
    "type": "daily",
    "discount_type": "percentage",
    "code": "SUMMER50",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "rate": 10,
    "cdw": 5,
    "scdw": 5,
    "pai": 5,
    "gps": 0,
    "baby_seat": 0,
    "driver": 0,
    "status": 1,
    "car_ids": { "all": false, "ids": [1, 2] },
    "emirate_ids": { "all": true, "ids": [] },
    "group_ids": { "all": true, "ids": [] },
    "location_ids": { "all": true, "ids": [] },
    "applicable_for": ["web", "mobile"],
    "note": "Summer promotion"
  }
  ```

### 14.2 Monthly Coupon Codes

**List:** `src/views/base/dynamicPricing/MonthlyCouponCode/MonthlyCouponCodeList.js`
- **API:** `GET admin/discount/coupon?type=monthly&page=&page_size=` (note: same endpoint, filtered by `type=monthly`)
- Same table as daily coupons

**Create/Edit:** `src/views/base/dynamicPricing/MonthlyCouponCode/CreateMonthlyCouponCode.js`
- Nearly identical to daily coupons with these differences:
  - `type: "monthly"` instead of `"daily"`
  - Adds **Discount Type** selector (percentage / value)
  - Only shows Rate field (CDW/SCDW/PAI/etc. default to 0)
  - Navigates to `/dynamicpricing/monthly-coupon-code` on success

### 14.3 Surge Pricing

**List:** `src/views/base/dynamicPricing/SurgeList.js`
- **API:** `GET admin/surge?page=&page_size=`
- **Table:** Name (EN), Name (AR), From Date, To Date, Status, CDW, SCDW, PAI, GPS, Baby Seat, Driver, Rate, Created By, Created At, Action
- **Delete:** `DELETE admin/surge/{id}`

**Create/Edit:** `src/views/base/dynamicPricing/CreateSurge.js`
- **API Create:** `POST admin/surge` (JSON)
- **API Update:** `PUT admin/surge/{id}` (JSON)
- **Form Fields:** Name EN, Name AR, Status, Start Date, End Date, Rate, CDW, SCDW, PAI, GPS, Baby Seat, Driver
- **Applicability:** Same multi-select pattern as coupons (Emirate, Location, Car Group, Car with "All" option)

### 14.4 Range Pricing Discounts

**Create/Manage:** `src/views/base/dynamicPricing/RangePricing/CreateRangePricing.js`

This is a unique form — manages discount rates per addon type with dynamic rows.

**API:**
- `GET admin/discount/range` (list all)
- `PUT admin/discount/range` (create new — uses PUT, not POST)
- `PUT admin/discount/range/{id}` (update existing)
- `DELETE admin/discount/range/{id}` (delete)

**Six addon sections, each with dynamic rows:**

| Section | Fields per Row |
|---|---|
| CDW | From Days, To Days, Discount |
| SCDW | From Days, To Days, Discount |
| PAI | From Days, To Days, Discount |
| GPS | From Days, To Days, Discount |
| Baby Seat | From Days, To Days, Discount |
| Additional Driver | From Days, To Days, Discount |

- Each row can be individually saved (Add/Update button per row)
- Existing rows can be deleted with confirmation modal
- Per-row loading states

---

## 15. User Management Module

### 15.1 Users & Bookings (`src/views/base/Users/UserBookings.js`)

**API:** `GET admin/user/booking` with filters

**Search Filters:**
| Filter | Type | Values |
|---|---|---|
| Gender | Dropdown | All, Male, Female |
| Email | Text input | — |
| Sort by Booking Count | Dropdown | Default, High→Low, Low→High |
| Min Booking Count | Dropdown | All, Above 2/5/10/20/30/50 |
| Registration Date From/To | Date pickers | — |

**Table Columns:**
| Column | Data |
|---|---|
| User | NamePhoto component (avatar, name, email, phone, gender) |
| Gender | Text |
| DOB | Formatted date |
| Country | Text |
| Total Bookings | Badge with count |
| Booked At | Date |
| Registered At | Date |
| View Details | Eye icon button |

**Summary Cards:** Total Users, Users with Bookings, Total Bookings, Unique Countries

**Booking Details Modal:**
- Opens on eye icon click
- Shows user info (Name, Email, Phone, Gender, DOB, Country, Registered At, Total Bookings)
- Table of user's bookings: Booking #, Booking ID, Date, Status (color-coded), Type, Car, Total Amount
- **API:** `GET admin/booking?user_email=&page=1&page_size=100`

**Export:** PDF + Excel (see Section 23)

### 15.2 User Documents (`src/views/base/Users/documents.js`)

**API:** `GET admin/user/document?user_email=&page=&page_size=`

**Search Filter:** Email (text input)

**Table Columns:** #, Email, Phone, Username, Documents

**Documents Column Logic:**
- `documents` field is a JSON string in the API response
- Parsed with `JSON.parse()` to get array of `{ front_image, doc_type }`
- Each doc type rendered as clickable text
- Underscores in `doc_type` replaced with spaces

**Document Viewer Modal (`ViewDocumentPopup`):**
- Renders PDF via `<object>` embed tag
- Download button with `<FaDownload>` icon
- Falls back to link if PDF fails to load

---

## 16. User Requests Module

All four request pages are **read-only** views with server-side pagination.

### 16.1 Enquiry Requests (`EnquiryRequest.js`)

**API:** `GET admin/user-enquiry?car_id=&type=&email=&duration=&emirate_id=&page=&page_size=`

**Filters:** Type (Individual/Corporate), Duration (Daily/Weekly/Monthly/Yearly), Emirate (from API), Email, Car (from API)

**Table:** #, Name, Number, Email, Type, Duration, Car, Emirate, Date, Details

### 16.2 Lost & Found Requests (`LostAndFoundRequest.js`)

**API:** `GET admin/user-lost-found-request?reference_number=&emirate_id=&email=&page=&page_size=`

**Filters:** Reference Number, Emirate (from API), Email

**Table:** #, Name, Number, Email, Reference Number, Emirate, Date, Details

### 16.3 Subscription Requests (`SubscriptionRequest.js`)

**API:** `GET admin/user/newsletter/subscription?page=&page_size=`

**No filters**

**Table:** #, Email, Date

### 16.4 Offer Requests (`OfferRequest.js`)

**API:** `GET admin/user-offer-enquiry?offer_id=&email=&page=&page_size=`

**Filters:** Offer (dropdown from `GET admin/offer?page_size=9999`), Email

**Table:** #, Name, Number, Email, Address, Offer Title, Date

---

## 17. Stop Sale Module

### List (`StopSaleList.js`)
- **API:** `GET admin/stop/sale?page=&page_size=`
- **Table:** #, Start Date, End Date, Emirate, Location, Status (Active/Inactive badge), Cars ("All" or comma-separated IDs), Action, Created By, Created At
- **Delete:** `DELETE admin/stop/sale/{id}` with modal confirmation

### Create/Edit (`CreateStopSale.js`)
- **API Create:** `POST admin/stop/sale` (JSON)
- **API Update:** `PUT admin/stop/sale/{id}` (JSON)
- **API Fetch:** `GET admin/stop/sale/{id}` (for edit mode)
- **Form Fields:**
  | Field | Type |
  |---|---|
  | Start Date | Date picker |
  | End Date | Date picker |
  | Emirate | Select (from API) |
  | Location | Select (from API) |
  | Status | Select (Active/Inactive) |
  | Cars | react-select multi with "All" option |

- **Car IDs structure:** `{ all: boolean, ids: number[] }` (same pattern as coupon codes)

---

## 18. Misc Settings Module

### 18.1 Other Charges (`OtherCharges.js`)

**API Fetch:** `GET admin/charges/other`
**API Update:** `PUT admin/charges/other`

**Fields (each with individual Update button):**
| Field | Description |
|---|---|
| VAT Percentage | Tax percentage |
| Pay Now Discount | Discount for pay-now |
| Delivery Charges | Default delivery fee |
| Collection Charges | Default collection fee |
| Monthly Pay Now Discount | Monthly booking pay-now discount |

**Key Logic:** Each field updates independently. Reads from API list, matches by key, uses item `id` for update.

### 18.2 Inter-Emirate Charges (`InterEmirateCharges.js`)

**API:**
- `GET admin/charges/inter_emirates` (list)
- `PUT admin/charges/inter_emirates` (create/update)
- `DELETE admin/charges/inter_emirates/{id}` (delete)
- `GET admin/emirate` (for dropdowns)

**Dynamic rows, each row has:**
| Field | Type |
|---|---|
| Pickup Emirate | Select (from API) |
| Dropoff Emirate | Select (from API) |
| Charges | Number input |

- Each row is independently saveable (Add/Update button)
- Existing rows show "Update", new rows show "Add"
- Delete with confirmation modal

---

## 19. Voting / Surveys Module

### NewDesignVote (`NewDesignVote.js`) and UIVote (`UIVote.js`)

These two pages are **functionally identical** (duplicate code).

**API:**
- `GET ui-vote?page=&page_size=` (paginated table data)
- `GET ui-vote/all` (all data for stats + export)

**Note:** These endpoints use `simpleGetCall` (not `simpleGetCallAuth`) — they don't require Bearer auth, only API key.

**Summary Cards:** Total Votes, New UI Count, Old UI Count

**Choice Mapping:** `"first"` = New UI, `"second"` = Old UI

**Table:** Columns include vote choice (with colored badge), voter info, timestamp

**Export:** PDF + Excel (see Section 23)

---

## 20. Shared Components

### 20.1 GridTable (`src/components/GridTable/GridTable.js`)

A fully **client-side** reusable data table.

**Props:**
| Prop | Type | Description |
|---|---|---|
| `columns` | array | Column definitions (string or `{ name, key, label, width, formatter }`) |
| `data` | array | Row data |
| `loading` | boolean | Shows spinner |
| `pagination` | object | `{ enabled: true, limit: 25 }` |
| `search` | boolean | Enable search bar |
| `sort` | boolean | Enable column sorting |
| `onEdit` | function | Edit callback (receives row) |
| `onDelete` | function | Delete callback (receives row) |
| `actionColumnConfig` | object | `{ showEdit: true, showDelete: false }` |

**Pipeline:** filter (search) → sort → paginate (all via `useMemo`)

**Features:**
- Custom column `formatter` functions (can return React elements)
- Sliding-window pagination (5 visible pages)
- Sort toggle on column headers (asc/desc with icons)
- Page size selector (10/25/50/100)

### 20.2 CustomPagination (`src/components/CustomPagination/CustomPagination.js`)

**Props:**
| Prop | Description |
|---|---|
| `totalRecords` | Total records |
| `recordsPerPage` | Page size |
| `onPageChange` | Callback |
| `currentPage` | Active page |

Shows up to 10 pages with ellipsis for larger sets. Used by most list pages.

### 20.3 NamePhoto (`src/components/NamePhoto/NamePhoto.jsx`)

**Props:**
| Prop | Description |
|---|---|
| `name` | Display name |
| `photo` | Photo URL (optional — shows initials if missing) |
| `description` | Secondary text |
| `phone` | Phone number (shows copy modal on click) |
| `email` | Email (shows copy modal on click) |
| `address` | Address (tooltip) |
| `extra` | Extra info line |
| `iconOnly` | Boolean — avatar only mode |
| `gender` | Unused currently |
| `onClick` | Click callback |

**Features:**
- Auto-generates initials from name (e.g., "John Doe" → "JD")
- Email/phone click → centered Bootstrap Modal with "Copy" button
- Copy uses `navigator.clipboard.writeText`

### 20.4 CKEditorComponent (`src/components/CKEditor/CKEditor.js`)

**Props:**
| Prop | Default | Description |
|---|---|---|
| `language` | "en" | Editor language |
| `onContentChange` | — | Callback for content changes |
| `contentW` | — | Initial content |

Wraps CKEditor 5 ClassicEditor with image upload support (via `/upload-image` endpoint).

---

## 21. Utility Functions & Custom Hooks

### Utility Functions (`src/views/base/CustomHooks/reusableFunctions.js`)

| Function | Description |
|---|---|
| `formatDateTimeUAE(dateTimeString)` | Formats date to UAE timezone (Asia/Dubai), returns `"YYYY-MM-DD HH:mm"` |
| `stringToArray(string)` | Parses JSON string to array (validates 2-number arrays) |
| `fetchData({ url, setter, onError, onFinally })` | Generic async data fetcher using `simpleGetCallAuth` |
| `filterArrayByProperty(arrayOfObjects, filterKey, propertyName)` | Filters array where `item[propertyName]` is in `filterKey` array |

### Custom Hooks

**`useFilterByIds(array, ids)`** (`src/views/base/CustomHooks/useFilterById.js`)
- Filters array by `emirate_id` matching any of `ids`
- Used in UploadRangePricing for location filtering

**`useCountUp(end, duration)`** (`src/views/dashboard/useCountUp.js`)
- Animates number from 0 to `end` over `duration` ms
- Used in StatCard for dashboard numbers

### Common Inline Patterns

**`formatDate(isoString)`** — Duplicated across 4+ files:
```js
const formatDate = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};
```

**`calculatePaginationMessage()`** — Duplicated across most list pages:
```js
const calculatePaginationMessage = () => {
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);
  return `Showing ${startRecord} to ${endRecord} of ${totalRecords} entries`;
};
```

---

## 22. Notification System

**File:** `src/components/notify/notify.js`

Uses `react-toastify` with consistent configuration:

| Function | Toast Type | Auto-Close |
|---|---|---|
| `notifySuccess(message)` | Green success | 2 seconds |
| `notifyError(message)` | Red error | 2 seconds |
| `notificationMsg(message)` | Blue info | 5 seconds |

**Common config:** Position: top-right, progress bar visible, close on click, pause on hover, draggable, light theme.

**ToastContainer** rendered in `DefaultLayout.js`.

---

## 23. Export Features (PDF & Excel)

### PDF Reports (using jsPDF + jspdf-autotable)

Used in: Bookings, UserBookings, NewDesignVote, UIVote

**Common PDF structure:**
1. Page setup: Landscape A4
2. Company logo top-left (loaded from file server or local asset)
3. Report title centered
4. Timestamp top-right
5. Summary cards row (colored rectangles with stats)
6. Data table with auto-formatting
7. Status cells color-coded (Green=Booked, Red=Cancelled, Yellow=Extended, Blue=Edited)
8. Values truncated for fit (booking IDs: 12 chars, names: 15 chars, emails: 20 chars)
9. Monetary values formatted as `AED X.XX`

### Excel Reports (using xlsx library)

Used in: Bookings, UserBookings, NewDesignVote, UIVote

**Common Excel structure:**
1. Multiple sheets: "Summary" sheet + data sheet
2. Full data (not truncated)
3. All monetary values formatted as `AED X.XX`
4. Auto-sized column widths

### Bookings Export Specifics
- **PDF:** 14 priority columns in table
- **Excel:** 34 full columns with all booking data
- Both fetch all data with `page_size=10000` before generating

---

## 24. Stub/Placeholder Pages

These pages exist in the codebase but have **no implementation** (render only text):

| Component | Renders | File |
|---|---|---|
| `Allbookings` | "All bookings" | `Bookings/Allbookings.js` |
| `Currentbookings` | "Currentbookings booking" | `Bookings/Currentbookings.js` |
| `Pendingrefundlist` | "Pendingrefundlist" | `Refund/Pendingrefundlist.js` |
| `QuotationRequest` | "quotationrequest" | `quotationReq/QuotationRequest.js` |
| `Lostandfound` | "lost and found" | `lostandfound/Lostandfound.js` |
| `Allusers` | "all users" | `user/Allusers.js.js` |
| `InactiveUsers` | "inactive users" | `user/InactiveUsers.js` |
| `Userfeedback` | "user feedback" | `user/Userfeedback.js` |
| `InterEmiratePricing` | "interemiratepricing" | `pricing/InterEmiratePricing.js` |
| `GroupcarPricing` | "groupcarpricing" | `pricing/GroupcarPricing.js` |
| `RangePricing` | "Range pricing" | `dynamicPricing/RangePricing.js` |
| `CouponCodeMonthly` | "CouponCodeMonthly" | `dynamicPricing/CouponCodeMonthly.js` |
| `BookNowDis` | "BookNowDis" | `dynamicPricing/BookNowDis.js` |
| `AdvanceBooking` | "Advance booking" | `dynamicPricing/AdvanceBooking.js` |

---

## 25. Key Libraries & Dependencies

| Library | Version | Used For |
|---|---|---|
| `react` | ^18.3.1 | Core framework |
| `react-router-dom` | ^6.27.0 | Routing |
| `react-redux` / `redux` | ^9.1.2 / ^5.0.1 | Sidebar + theme state only |
| `@coreui/react` | ^5.4.0 | **Current UI component library (to be replaced)** |
| `@coreui/icons` / `@coreui/icons-react` | ^3.0.1 / ^2.3.0 | **Current icon library** |
| `react-bootstrap` | ^2.10.5 | Modals, dropdowns, forms, badges |
| `react-icons` | ^5.5.0 | Additional icons (Themify, FontAwesome) |
| `react-toastify` | ^10.0.6 | Toast notifications |
| `react-select` | ^5.8.2 | Multi-select dropdowns |
| `chart.js` / `react-chartjs-2` | ^4.4.5 / ^5.3.0 | Dashboard charts |
| `chartjs-plugin-zoom` | ^2.2.0 | Chart zoom/pan |
| `@ckeditor/ckeditor5-react` | ^9.3.1 | Rich text editor |
| `crypto-js` | ^4.2.0 | AES encryption for user role |
| `jspdf` / `jspdf-autotable` | ^2.5.2 / ^3.8.4 | PDF report generation |
| `xlsx` | ^0.18.5 | Excel report generation |
| `dayjs` | ^1.11.13 | Date manipulation |
| `moment` / `moment-range` | 2.24.0 / 4.0.2 | Date range picker |
| `react-daterange-picker` | 2.0.1 | Calendar date range selector |
| `recharts` | ^2.15.2 | Alternative chart library (may be unused) |
| `simplebar-react` | ^3.2.6 | Custom scrollbar for sidebar |
| `sass` | ^1.80.4 | SCSS compilation |

### Libraries Safe to Remove (CoreUI-specific):
- `@coreui/react`, `@coreui/coreui`, `@coreui/chartjs`, `@coreui/react-chartjs`, `@coreui/utils`, `@coreui/icons`, `@coreui/icons-react`

### Libraries to Keep:
- Everything else — `react-bootstrap`, `react-select`, `chart.js`, `react-chartjs-2`, `chartjs-plugin-zoom`, `jspdf`, `xlsx`, `crypto-js`, `react-toastify`, `@ckeditor/*`, `moment`, `react-daterange-picker`, `react-icons`, `simplebar-react`

---

## File-to-Functionality Quick Reference

| File | Module | Functionality |
|---|---|---|
| `src/App.js` | Core | Router setup, theme, lazy routes |
| `src/index.js` | Core | React DOM mount, providers |
| `src/store.js` | Core | Redux store (sidebar/theme) |
| `src/routes.js` | Core | All 90+ route definitions |
| `src/_nav.js` | Core | Sidebar menu structure |
| `src/ProtectedRoute.js` | Auth | Token validation guard |
| `src/layout/DefaultLayout.js` | Layout | Sidebar + Header + Content wrapper |
| `src/components/AppContent.js` | Layout | Role-filtered route renderer |
| `src/components/AppSidebar.js` | Layout | Role-filtered sidebar |
| `src/components/AppSidebarNav.js` | Layout | Recursive nav tree renderer |
| `src/components/AppHeader.js` | Layout | Top navbar with toggle |
| `src/components/header/AppHeaderDropdown.js` | Auth | Logout + auto-expiry timer |
| `src/components/config.js/Setup.js` | API | All HTTP helper functions |
| `src/components/config.js/ConfigWeb.js` | API | All endpoint URL definitions |
| `src/components/context/AppContext.js` | State | React context creation |
| `src/components/context/AppState.js` | State | Context provider (auth state) |
| `src/components/notify/notify.js` | UI | Toast notification functions |
| `src/components/GridTable/GridTable.js` | UI | Reusable client-side table |
| `src/components/CustomPagination/CustomPagination.js` | UI | Reusable pagination |
| `src/components/NamePhoto/NamePhoto.jsx` | UI | User avatar + info component |
| `src/components/CKEditor/CKEditor.js` | UI | Rich text editor wrapper |
| `src/views/dashboard/Dashboard.js` | Dashboard | Data fetching + transformation |
| `src/views/dashboard/DashboardPresentation.js` | Dashboard | Charts + stat cards rendering |
| `src/views/dashboard/StatCard.js` | Dashboard | Animated stat card |
| `src/views/dashboard/chartConfig.js` | Dashboard | Chart color/style config |
| `src/views/dashboard/useCountUp.js` | Dashboard | Number animation hook |
| `src/views/dashboard/DateRangeFilter/*` | Dashboard | Date range picker (container/presentation/calendar) |
| `src/views/pages/login/Login.js` | Auth | Login form + API call |
| `src/views/pages/register/RegisterNew.js` | Auth | Registration form (non-functional) |
| `src/views/pages/page404/Page404.js` | Error | 404 page |
| `src/views/pages/page500/Page500.js` | Error | 500 page |
| `src/views/base/Bookings/Bookings.js` | Bookings | Main bookings list + export |
| `src/views/base/Bookings/BookingLogs.js` | Bookings | Transaction logs |
| `src/views/base/Bookings/IncompleteBookings.js` | Bookings | Failed/incomplete bookings |
| `src/views/base/Bookings/RefundList.js` | Bookings | Refunds list |
| `src/views/base/Bookings/DownloadReport/DownloadReport.js` | Bookings | Excel report download |
| `src/views/base/car/CarBrand/*` | Cars | Brand CRUD |
| `src/views/base/car/CarCategory/*` | Cars | Category CRUD |
| `src/views/base/car/carDataBase/*` | Cars | Car database CRUD |
| `src/views/base/car/CarGroup/*` | Cars | Car group CRUD |
| `src/views/base/cms/HomePageBanner/*` | CMS | Banner CRUD |
| `src/views/base/cms/Emirates/*` | CMS | Emirate edit (with opening hours) |
| `src/views/base/cms/Locations/*` | CMS | Location CRUD (with opening hours + exceptions) |
| `src/views/base/cms/SpecialOffers/*` | CMS | Offer CRUD (with CKEditor) |
| `src/views/base/cms/AdminPages/*` | CMS | Page CRUD (with CKEditor) |
| `src/views/base/cms/AwardsAndRecognition.js/*` | CMS | Award/certificate CRUD |
| `src/views/base/cms/TeachersRental/*` | CMS | Teacher rates (read-only) |
| `src/views/base/cms/PromoTicker/*` | CMS | Promo ticker CRUD (with live status) |
| `src/views/base/cms/EdcPromo/*` | CMS | EDC promo settings + terms CRUD |
| `src/views/base/pricing/*` | Pricing | Upload + list daily/monthly/range pricing |
| `src/views/base/dynamicPricing/*` | Dynamic Pricing | Coupon, surge, range discount CRUD |
| `src/views/base/Users/*` | Users | User list + documents |
| `src/views/base/UserRequests/*` | Requests | 4 request type views (read-only) |
| `src/views/base/StopSale/*` | Stop Sale | Stop sale CRUD |
| `src/views/base/MiscSetting/*` | Settings | Global charges + inter-emirate charges |
| `src/views/base/NewDesignVote/*` | Voting | Vote dashboard + export |
| `src/views/base/UIVote/*` | Voting | Vote dashboard (duplicate) |
| `src/views/base/CustomHooks/*` | Utils | Shared utility functions + hooks |

---

*Document generated on: Feb 13, 2026*
*Source codebase: autostrad-admin (CoreUI React template)*
