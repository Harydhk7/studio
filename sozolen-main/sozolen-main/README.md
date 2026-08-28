# SOZOLEN 3D

SOZOLEN 3D is a full-stack e-commerce and custom-request platform for 3D printed products.

It includes:
- Customer storefront (products, cart, checkout, profile, order tracking)
- Admin panel (categories, products, orders, customers, custom requests)
- Invoice template management + paid-order invoice generation
- Reporting downloads (super admin)

## Tech Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Express + TypeScript
- Database: PostgreSQL (Drizzle ORM)
- Auth: JWT (admin + customer flows)
- Storage: Supabase Storage (uploads)

## Monorepo Structure

- `client/` - React frontend
- `server/` - Express API and server runtime
- `shared/` - shared route contracts and schema
- `script/` - build utilities

## Prerequisites

- Node.js 20+
- PostgreSQL database (or Supabase Postgres)

## Environment Variables

Create a `.env` in the project root.

## Install

```bash
npm install
```

## Run Locally

```bash
npm run db:push
npm run dev
```

App starts on `http://localhost:5000` by default.

## Scripts

- `npm run dev` - run development server
- `npm run build` - build frontend + backend bundle
- `npm run start` - run production server from `dist`
- `npm run check` - TypeScript type checking
- `npm run db:push` - push Drizzle schema to database

## Deployment

This project can be deployed in two ways:

- **Current production setup**
  - **Frontend**: static React build on **Netlify** (`https://sozolen.netlify.app`)
  - **Backend/API**: Node/Express app on **Render** (`https://sozolen.onrender.com`)
  - Netlify forwards `/api/*` → Render via `netlify.toml`:
    - `from = "/api/*"` → `to = "https://sozolen.onrender.com/api/:splat"`
  - CORS on the backend allows `https://sozolen.netlify.app` and local dev.
- **Monolith option (alternative)**
  - Single Node service (API + frontend) on **Render** using the existing build pipeline.
  - See `DEPLOYMENT.md` for details on both approaches.

## Notes

- Uploaded files are served from Supabase Storage when configured.
- Invoice is generated when an order payment status changes to `paid`.
- In admin reports, super admin can download CSV sheets for categories, products, orders, custom requests, and customers.

