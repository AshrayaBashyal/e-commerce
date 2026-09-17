# X-Cart

React frontend for the e-commerce API, built with Vite + React Router + Axios.

## Setup

```bash
npm install
cp .env.example .env   # edit VITE_API_BASE if your backend isn't on 127.0.0.1:8000
npm run dev
```

Runs on `http://localhost:5173`. Make sure the Django backend is running on
`http://127.0.0.1:8000` (or whatever you set `VITE_API_BASE` to), and that its
CORS settings allow `localhost:5173`.

### One backend setting to check

The backend's `.env` has `FRONTEND_SUCCESS_URL` / `FRONTEND_CANCEL_URL` for
where Stripe redirects after checkout. They should point at:

```
FRONTEND_SUCCESS_URL=http://localhost:5173/order-success
FRONTEND_CANCEL_URL=http://localhost:5173/order-cancel
```

The success page doesn't rely on Stripe passing the order id back in the
URL — it stashes the order id in `sessionStorage` right before redirecting to
Stripe, and reads it back on `/order-success`. If the redirect does carry an
`?order_id=` query param, that's used too (whichever is present).

## What's here

- **Auth** — JWT access/refresh in `localStorage`, with an axios response
  interceptor that retries a request once after a silent token refresh, and
  force-logs-out if refresh also fails.
- **Cart** — one shared `CartContext` so the nav badge, cart page, and
  checkout button never drift out of sync; every mutation calls
  `refreshCart()` afterward and totals are always re-fetched, never cached.
- **Orders/payments** — checkout creates the order, then a Stripe Checkout
  Session, then redirects the browser to Stripe. The success page polls
  `GET /api/orders/:id/` every few seconds until `payment_status` leaves
  `PENDING` — per the API docs, the redirect itself proves nothing; only the
  webhook (and therefore polling) confirms payment.
- **Roles** — branch entirely off `is_staff` / `is_superuser` from
  `GET /api/auth/me/`, both in nav visibility (`Navbar.jsx`) and route
  guards (`ProtectedRoute.jsx`). No roles are hardcoded anywhere else.
- **Pagination** — every list page keeps a `page` counter for display, but
  relies on the API's own `next`/`previous` cursors for "does another page
  exist," rather than assuming page math from `count`.

## Structure

```
src/
  api/        one thin module per resource, all built on api/client.js
  context/    AuthContext, CartContext
  components/ Navbar, ProductCard, ProtectedRoute, Pagination, StatusBadge, Toast, Spinner
  pages/      customer-facing pages
  pages/admin/      product / category / order management (is_staff)
  pages/superuser/  user role management (is_superuser)
```

## Design system

Flat colors, hairline borders instead of shadows, Public Sans, tabular
numerals on prices/quantities, Lucide icons. Tokens live at the top of
`src/index.css`. See the API reference doc (section 11) for the full
rationale if you're extending this.
