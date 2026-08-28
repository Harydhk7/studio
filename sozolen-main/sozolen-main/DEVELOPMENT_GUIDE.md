# DEVELOPMENT GUIDE

This guide explains the SOZOLEN 3D codebase architecture, tech stack, folder/file overview, how the app runs, and how to deploy/redeploy.

---

## 1) Project Architecture

By default SOZOLEN 3D is a **single-service monolith**:

- One Node.js process runs the backend (Express API).
- The same process can serve the frontend (React app).
- In development, Vite runs in middleware mode inside Express.
- In production monolith mode, Express serves prebuilt static files from `dist/public`.

In the current production deployment we use a **split** setup:

- React app is built and hosted as static files on **Netlify**.
- Backend/API runs as a Node service on **Render**.
- Netlify proxies `/api/*` calls to the Render backend, and Express CORS allows the Netlify origin.

### Request flow (monolith runtime)

1. Browser loads frontend from `/` (served by Vite in dev, static files in prod).
2. Frontend calls `/api/*` endpoints.
3. Express routes in `server/routes.ts` validate input using `shared/routes.ts` schemas.
4. Storage/data logic in `server/storage.ts` reads/writes PostgreSQL through Drizzle ORM.
5. Response returns to frontend hooks/pages.

---

## 2) Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI + custom UI wrappers in `client/src/components/ui`
- TanStack Query (server state)
- React Hook Form + Zod Resolver
- Wouter (routing)
- Framer Motion
- Zustand (cart state)

### Backend
- Node.js + Express
- TypeScript (`tsx` for dev runtime)
- Drizzle ORM + PostgreSQL (`pg`)
- Zod for API validation
- JWT auth (admin/customer)
- Multer + Supabase Storage for uploads
- Resend for email OTP/notifications

### DevOps/Build
- esbuild (server bundling through `script/build.ts`)
- Render deployment (`render.yaml`)
- Drizzle schema push (`npm run db:push`)

---

## 3) Root Folder & File Overview

- `package.json` - scripts, dependencies, project metadata.
- `package-lock.json` - dependency lock file.
- `tsconfig.json` - TypeScript configuration.
- `vite.config.ts` - Vite config (client build/dev integration).
- `tailwind.config.ts` - Tailwind theme/config.
- `postcss.config.js` - PostCSS plugins.
- `drizzle.config.ts` - Drizzle database config.
- `components.json` - shadcn/radix UI config metadata.
- `render.yaml` - Render service blueprint.
- `README.md` - quick-start project summary.
- `DEVELOPMENT_GUIDE.md` - this detailed guide.
- `HOW-IT-RUNS.md` - runtime behavior explanation.
- `DEPLOYMENT.md` - deployment setup notes.
- `script/build.ts` - production build pipeline (frontend + backend bundles).

---

## 4) `shared/` (Contracts + Schema)

- `shared/schema.ts`
  - Drizzle table definitions (`products`, `orders`, `custom_requests`, `customers`, etc.).
  - Insert schemas via `drizzle-zod`.
  - Shared TypeScript types.
- `shared/routes.ts`
  - Central API contract object (`api`) with endpoint paths, methods, request/response schemas.
  - Shared URL builder helper (`buildUrl`).

Why important: frontend hooks and backend routes both depend on this, so API stays consistent.

---

## 5) `server/` (Backend)

- `server/index.ts`
  - Express bootstrapping, middleware setup, starts HTTP server.
  - Chooses dev Vite middleware vs production static serving.
- `server/routes.ts`
  - All API endpoints.
  - Auth middleware (admin/customer/both).
  - Product/category/order/custom request/customer/report/invoice logic wiring.
- `server/storage.ts`
  - Data access layer.
  - CRUD for entities, normalization helpers, invoice HTML generation.
- `server/db.ts`
  - PostgreSQL pool and Drizzle DB instance setup.
- `server/supabase.ts`
  - Supabase client and storage bucket helpers.
- `server/email.ts`
  - Email sending logic (OTP, order/custom-request notifications).
- `server/vite.ts`
  - Dev middleware integration (Vite in Express).
- `server/static.ts`
  - Serves built frontend in production.

---

## 6) `client/` (Frontend)

### 6.1 `client/public/`

- `client/public/website-logo.png` - main brand/logo image used in UI/invoice preview.
- `client/public/favicon.png` - browser tab icon.

### 6.2 `client/index.html`

- App shell HTML.
- favicon link.
- site title + meta description.
- root mounting node for React (`#root`).

### 6.3 `client/src` root files

- `client/src/main.tsx` - React entry point; renders app.
- `client/src/App.tsx` - route switch for customer/admin pages and global providers.
- `client/src/index.css` - global CSS/tailwind base styles.

### 6.4 `client/src/lib/`

- `auth.ts` - token storage and header helpers for admin/customer auth.
- `queryClient.ts` - TanStack Query client setup.
- `utils.ts` - shared UI helper utilities.
- `invoice.ts` - frontend helper for opening invoice HTML in a new tab.

### 6.5 `client/src/store/`

- `cart.ts` - Zustand persisted cart with variant-aware item key (color/size/other).

### 6.6 `client/src/hooks/` (API + state hooks)

- `use-auth.ts` - admin auth.
- `use-admins.ts` - admin user management.
- `use-categories.ts` - categories APIs.
- `use-products.ts` - products APIs.
- `use-orders.ts` - admin order APIs.
- `use-customers.ts` - admin customers APIs + customer orders/custom forms.
- `use-custom-requests.ts` - custom requests APIs.
- `use-reviews.ts` - review APIs.
- `use-uploads.ts` - upload/delete file APIs.
- `use-customer-auth.ts` - customer auth.
- `use-customer-orders.ts` - customer’s own orders.
- `use-customer-addresses.ts` - customer addresses APIs.
- `use-invoice-template.ts` - admin invoice template APIs.
- `use-toast.ts` - toast helper wrapper.
- `use-mobile.tsx` - mobile breakpoint helper.

### 6.7 `client/src/pages/` (customer-facing pages)

- `Home.tsx` - landing page.
- `Products.tsx` - product listing.
- `ProductsByCategory.tsx` - category-specific listing.
- `ProductDetail.tsx` - product detail with options and add-to-cart flow.
- `Cart.tsx` - cart page.
- `Checkout.tsx` - checkout flow and order creation.
- `ThankYou.tsx` - post-checkout page.
- `Profile.tsx` - customer profile and order history.
- `OrderDetail.tsx` - customer order detail, review form, invoice button.
- `CustomRequest.tsx` - custom model request submit page.
- `Track.tsx` - track request by tracking ID.
- `CustomerLogin.tsx` - customer login.
- `CustomerRegister.tsx` - customer signup with OTP.
- `ForgotPassword.tsx` - reset password with OTP.
- `not-found.tsx` - fallback 404 page.

### 6.8 `client/src/pages/admin/` (admin pages)

- `AdminLayout.tsx` - admin shell/sidebar/navigation.
- `AdminLogin.tsx` - admin authentication page.
- `AdminDashboard.tsx` - admin KPIs/overview.
- `AdminCategories.tsx` - category CRUD.
- `AdminProducts.tsx` - product CRUD (images, options, pricing inputs).
- `AdminOrders.tsx` - orders table/status management.
- `AdminCustomers.tsx` - customers table + customer detail tabs (orders/custom forms).
- `AdminRequests.tsx` - custom requests list/quote/convert.
- `AdminAdmins.tsx` - super-admin user management.
- `AdminInvoiceTemplate.tsx` - invoice template edit + live preview.
- `AdminReports.tsx` - super-admin report sheet downloads.

### 6.9 `client/src/components/` (feature/shared components)

- `Navbar.tsx` - top navigation/app bar.
- `Footer.tsx` - site footer.
- `Hero.tsx`, `HeroScene.tsx` - homepage hero sections.
- `FeatureCard.tsx` - feature display card.
- `ProductCard.tsx` - reusable product card.
- `ThreeViewer.tsx` - 3D model/fallback viewer.
- `CustomRequestForm.tsx` - custom request form UI.
- `PrinterInfo.tsx` - printer/feature info section.
- `StarRating.tsx` - rating display component.
- `PaginationControls.tsx` - reusable previous/next pagination controls.

### 6.10 `client/src/components/admin/`

- `AdminTableSkeleton.tsx` - loading skeleton for admin tables.
- `OrderDetailModal.tsx` - detailed admin order modal (status/payment/review/invoice).

### 6.11 `client/src/components/ui/` (UI primitives)

These are reusable UI building blocks and wrappers around Radix/shadcn patterns:

- `accordion.tsx`, `alert.tsx`, `alert-dialog.tsx`
- `aspect-ratio.tsx`, `avatar.tsx`, `badge.tsx`, `breadcrumb.tsx`
- `button.tsx`, `calendar.tsx`, `card.tsx`, `carousel.tsx`, `chart.tsx`
- `checkbox.tsx`, `collapsible.tsx`, `command.tsx`, `context-menu.tsx`
- `dialog.tsx`, `drawer.tsx`, `dropdown-menu.tsx`
- `form.tsx`, `hover-card.tsx`, `input.tsx`, `input-otp.tsx`, `label.tsx`
- `menubar.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `password-input.tsx`
- `popover.tsx`, `progress.tsx`, `radio-group.tsx`, `resizable.tsx`
- `scroll-area.tsx`, `select.tsx`, `separator.tsx`, `sheet.tsx`
- `sidebar.tsx`, `skeleton.tsx`, `slider.tsx`, `switch.tsx`
- `table.tsx`, `tabs.tsx`, `textarea.tsx`, `toast.tsx`, `toaster.tsx`
- `toggle.tsx`, `toggle-group.tsx`, `tooltip.tsx`

---

## 7) How the Project Runs

### Development

```bash
npm install
npm run db:push
npm run dev
```

- Starts Express server in dev mode.
- Vite middleware serves React app with HMR.
- API and frontend share same origin/port.

### Type-check

```bash
npm run check
```

### Production build

```bash
npm run build
```

Build output:
- `dist/index.cjs` (server bundle)
- `dist/public/*` (frontend static assets)

### Production run

```bash
npm start
```

---

## 8) How the Project Works (Functional Overview)

### Auth
- Admin and customer auth are separate token flows.
- Admin tokens guard admin APIs/routes.
- Customer tokens guard customer profile/order/custom-request actions.

### Catalog
- Categories and products managed in admin.
- Product options include color, size, and custom “other” option.
- Product detail validates required options before cart add.

### Cart & Checkout
- Cart persisted in local storage via Zustand.
- Checkout creates order records in DB.
- Orders link to customer account when available.

### Custom Requests
- Logged-in customers can submit custom forms with images/details.
- Admin reviews, quotes, and can convert to order.
- Customer can track requests and respond to quote.

### Orders & Invoice
- Admin updates order/payment status.
- Invoice template managed in admin.
- On payment status `paid`, invoice HTML is generated and stored on order.
- Invoice can be viewed by admin and owning customer.

### Reports
- Super admin can download CSV sheets:
  - Categories
  - Products
  - Orders
  - Custom Requests
  - Customers

---

## 9) Deployment & Redeploy

### Current recommended: Render API + Netlify frontend

- **Backend/API**: Render Web Service running the Node/Express app.
- **Frontend**: Netlify site serving the built React app from `client/`.
- **Proxy**: `netlify.toml` routes `/api/*` to the Render backend.
- **CORS**: `server/index.ts` allows `https://sozolen.netlify.app` and local dev origins.

See `DEPLOYMENT.md` for the end-to-end Render + Netlify steps.

### Alternative: Monolith on Render only

You can also deploy as a single monolith (API + frontend) on Render:

1. Configure env vars on Render:
   - `NODE_ENV=production`
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_BUCKET` (optional)
   - `RESEND_API_KEY` and `EMAIL_FROM` (for email features)
2. Build command:
   - `npm install && npm run build`
3. Start command:
   - `npm start`

Reference files:
- `render.yaml`
- `DEPLOYMENT.md`

### Redeploy steps

For code updates:
1. Push changes to the connected Git branch.
2. Render/Netlify auto-deploy (or manual deploys from their dashboards).

For schema updates:
1. Update `shared/schema.ts`.
2. Run `npm run db:push` against the target DB.
3. Deploy app changes.

---

## 10) Quick Commands

```bash
# install deps
npm install

# run db schema changes
npm run db:push

# run app (dev)
npm run dev

# type check
npm run check

# production build
npm run build

# run production build
npm start
```

