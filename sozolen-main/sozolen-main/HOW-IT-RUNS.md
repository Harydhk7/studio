# How the Frontend and Backend Run

SOZOLEN 3D is a **monolith**: one Node.js process serves both the **API (backend)** and the **React app (frontend)**. You use a single port and a single command to run the app in monolith mode.

---

## Architecture Overview (monolith runtime)

```
┌─────────────────────────────────────────────────────────────┐
│  Single Node.js process (Express)                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  API routes (/api/*)  →  server/routes.ts               │  │
│  │  Static files (production)  →  dist/public              │  │
│  │  Dev: Vite middleware  →  client/ (live reload)        │  │
│  └───────────────────────────────────────────────────────┘  │
│  Listens on: PORT (default 5000)                              │
└─────────────────────────────────────────────────────────────┘
```

- **One server, one port** — The backend and frontend are not separate services. The Express server handles both API requests and serving the React app.
- **Frontend** — React app in `client/` (Vite + React). In dev it’s served by Vite with HMR; in production it’s pre-built and served as static files from `dist/public`.
- **Backend** — Express in `server/`: API routes, auth, DB (Drizzle + PostgreSQL), file uploads (Supabase Storage). Entry point is `server/index.ts`.

---

## Development (`npm run dev`)

**Command:** `npm run dev`  
**Runs:** `cross-env NODE_ENV=development tsx server/index.ts`

1. **Express starts** and loads `server/index.ts`.
2. **Routes** are registered from `server/routes.ts` (all `/api/*` endpoints).
3. **Vite is not started as a separate process.** Instead, the dev server uses **Vite in middleware mode** (`server/vite.ts`):
   - Vite is created with `middlewareMode: true` and attached to the same HTTP server as Express.
   - Requests that don’t match `/api/*` go to Vite.
   - Vite serves the app from `client/`, compiles React/TS on the fly, and injects **HMR (Hot Module Replacement)** for live reload.
4. **Single URL** — You open **http://localhost:5000** (or whatever `PORT` is in `.env`). The same origin is used for both the React app and API calls, so no CORS setup is needed in dev.

**Summary:** One process. Backend = Express; frontend = Vite middleware on the same server. No separate “frontend dev server” to start.

---

## Production (`npm run build` then `npm start`) — monolith

### Build (`npm run build`)

**Runs:** `tsx script/build.ts`

1. **Client build** — Vite builds the React app from `client/` and outputs to **`dist/public`** (HTML, JS, CSS, assets).
2. **Server build** — esbuild bundles `server/index.ts` into **`dist/index.cjs`** (CommonJS). Most `node_modules` are marked external and loaded at runtime; only a small allowlist is bundled to keep the server bundle small and improve cold start.

After the build you have:

- `dist/public/` — static frontend (index.html + JS/CSS)
- `dist/index.cjs` — backend entry point

### Run (`npm start`)

**Command:** `npm start`  
**Runs:** `NODE_ENV=production node dist/index.cjs`

1. **Express starts** from the compiled `dist/index.cjs`.
2. **Routes** are registered as in dev (API, auth, uploads, etc.).
3. **No Vite** — In production, `server/index.ts` sees `NODE_ENV === "production"` and calls **`serveStatic(app)`** from `server/static.ts` instead of setting up Vite.
4. **Static serving** — `serveStatic` mounts `dist/public` so that:
   - Requests for files (e.g. `/assets/…`) get the built JS/CSS.
   - Any other non-API request (e.g. `/`, `/products`) is served `dist/public/index.html` so the React SPA can handle routing.

**Summary:** One process runs the compiled server; it serves the API and the pre-built frontend from `dist/public` on the same port.

In the current hosted setup you can also:

- Deploy the backend/API to Render (Node service).
- Deploy the built frontend to Netlify.
- Use `netlify.toml` to proxy `/api/*` to the Render backend and CORS in `server/index.ts` to allow the Netlify origin.

---

## Port and URL

| Env / Context | Port | Where it’s set |
|---------------|------|----------------|
| Development  | `process.env.PORT` or **5000** | `.env` or default in `server/index.ts` |
| Production   | `process.env.PORT` (required on Render etc.) | Host sets it (e.g. Render sets `PORT`) |

The server binds to **`0.0.0.0`** so it’s reachable from other machines (e.g. Replit, Render).

---

## Quick Reference

| Task              | Command        | What runs |
|-------------------|----------------|-----------|
| Dev (frontend + backend) | `npm run dev`   | Express + Vite middleware on one port |
| Build for production    | `npm run build` | Vite → `dist/public`, esbuild → `dist/index.cjs` |
| Run production          | `npm start`     | `node dist/index.cjs` serves API + `dist/public` |
| Type-check              | `npm run check` | `tsc` |
| DB schema push          | `npm run db:push` | Drizzle push to DB |

---

## File / Folder Roles

| Path | Role |
|------|------|
| `server/index.ts` | Express app entry; starts server, wires routes, Vite (dev) or static (prod). |
| `server/vite.ts` | Dev-only: configures Vite in middleware mode and catch-all for `index.html`. |
| `server/static.ts` | Prod-only: serves `dist/public` and SPA fallback. |
| `server/routes.ts` | All API and auth routes. |
| `client/` | React app (Vite root). Entry: `client/src/main.tsx` → `App.tsx`. |
| `vite.config.ts` | Vite config; `root` = `client`, build `outDir` = `dist/public`. |
| `script/build.ts` | Build script: Vite build + esbuild server bundle. |
| `dist/public/` | Built frontend (created by `npm run build`). |
| `dist/index.cjs` | Built server (created by `npm run build`). |
