# Deploy SOZOLEN 3D (free tier)

This app is a **Node.js monolith**: one server serves both the **API (backend)** and the **built React app (frontend)**. You deploy it as a single service.

---

## Stack (free)

| Layer        | Service      | Role                                                                     |
| ------------ | ------------ | ------------------------------------------------------------------------ |
| **Database** | **Supabase** | PostgreSQL; store users, products, orders, etc.                          |
| **Backend**  | **Render**   | Node.js server (Express API + auth). Uploads go to **Supabase Storage**. |
| **Frontend** | **Render**   | Same service; serves the built React app as static files                 |

So: **Database = Supabase**, **Frontend + Backend = one Render Web Service**. You do not need a separate frontend host unless you later split the app (e.g. static site on Vercel + API on Render).

---

## Can I use Vercel or Netlify?

- **Vercel / Netlify** are best for **static sites** or **serverless functions**. Your app is a **long‑running Node server** that serves both API and frontend.
- **Default (recommended):** Deploy the **whole app** (frontend + backend) on **Render**, and use **Supabase** for the database. No Vercel/Netlify needed.
- **Optional split later:** You could put only the **static frontend** on Vercel/Netlify and run the **backend** on Render, then point the frontend at the API URL. That requires extra config (env, CORS, build).

---

## 1. Database — Supabase

1. Go to [supabase.com](https://supabase.com) and sign up.
2. **New project** → choose org, name (e.g. `sozolen-3d`), password (save it), region.
3. Wait for the project to be ready.
4. **Project Settings** (gear) → **Database** → **Connection string** tab.
5. **Use the Session Pooler (IPv4-compatible), not Direct connection:**
   - Set **Method** to **Session** (or open **Pooler settings** and use the pooler URI).
   - **Type:** URI.
   - Copy the connection string. It should look like:
     ```text
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
     The host must be **`….pooler.supabase.com`** and port **6543**. Do **not** use the Direct connection host (`db.xxx.supabase.co:5432`) — it is IPv6-only and will cause `getaddrinfo ENOTFOUND` on IPv4 networks.
6. Replace `[YOUR-PASSWORD]` in the URI with your database password. Use the result as **`DATABASE_URL`** in `.env` and in Render. Add `?sslmode=require` at the end if the URI does not already include it.

**If you see `ENOTFOUND db.xxx.supabase.co`:** Your `DATABASE_URL` is using the Direct connection. Switch to the **Session** pooler URI (host `….pooler.supabase.com`, port `6543`) as above.

---

## 1b. File uploads — Supabase Storage

Uploaded images and files are stored in **Supabase Storage** (not on Render’s disk), so they persist across redeploys.

1. In your **Supabase** project: **Storage** in the sidebar → **New bucket**.
2. Name the bucket (e.g. `uploads`), set it to **Public** if you want image URLs to work without signed URLs, then create.
3. Get your project URL and **service role** key: **Project Settings** (gear) → **API** → copy **Project URL** and **service_role** (under "Project API keys").
4. Set these in `.env` and in Render environment variables:

| Key                         | Value                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| `SUPABASE_URL`              | Your Supabase **Project URL** (e.g. `https://xxxx.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | The **service_role** API key (keep secret).                      |
| `SUPABASE_BUCKET`           | Bucket name (e.g. `uploads`). Optional; defaults to `uploads`.   |

---

## 2. Backend + Frontend — Render (one service)

The same Render **Web Service** runs your Node server, which:

- Serves the **API** (backend).
- Serves the **built React app** (frontend) from `dist/public`.

### 2.1 Prepare the repo

- Push code to **GitHub** (or GitLab).
- Do **not** commit `.env` (use `.gitignore`). You’ll set env vars in Render.

### 2.2 Create the Web Service on Render

1. Go to [render.com](https://render.com) and sign up (e.g. with GitHub).
2. **New → Web Service**.
3. Connect the repository that contains this project.
4. Configure:
   - **Name:** e.g. `sozolen-3d`
   - **Region:** pick one close to you.
   - **Runtime:** **Node**.
   - **Build Command:** `npm install && npm run build` (or `NPM_CONFIG_PRODUCTION=false npm install && npm run build` if you get `tsx: not found` — see below).
   - **Start Command:** `npm start`
   - **Instance type:** **Free**.

### 2.3 Environment variables (Render dashboard)

Add:

| Key                         | Value                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                  | `production`                                                                                                                         |
| `DATABASE_URL`              | Your **Supabase** connection string from step 1.                                                                                     |
| `SESSION_SECRET`            | Long random string (e.g. `openssl rand -hex 32`).                                                                                    |
| `SUPABASE_URL`              | Your Supabase **Project URL** (for Storage).                                                                                         |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** key (for Storage uploads).                                                                                 |
| `SUPABASE_BUCKET`           | Storage bucket name (e.g. `uploads`). Optional.                                                                                      |
| `RESEND_API_KEY`            | Resend API key for OTP emails (signup / forgot password). Get one at [resend.com](https://resend.com).                               |
| `EMAIL_FROM`                | Sender for OTP emails (e.g. `SOZOLEN 3D <onboarding@resend.dev>` or your verified domain). Optional; defaults to Resend test sender. |

Without `RESEND_API_KEY`, customers will not receive OTP in production.

### 2.4 If build fails with `tsx: not found`

Render can set `NODE_ENV=production` before install, so devDependencies (like `tsx`) are skipped and the build fails. Fix it in either way:

- **Option A (recommended):** In Render → your service → **Environment** → add:
  - **Key:** `NPM_CONFIG_PRODUCTION`
  - **Value:** `false`
    Then **Save Changes** and redeploy. This makes `npm install` include devDependencies so `tsx` is available for the build.

- **Option B:** Change **Build Command** to:
  ```bash
  NPM_CONFIG_PRODUCTION=false npm install && npm run build
  ```

### 2.5 Deploy

Click **Create Web Service**. Render will build and start the app. Your live URL will be like `https://sozolen-3d.onrender.com`.

---

## 3. Run database migrations (one time)

Push the schema to your **Supabase** database:

- **Option A – Local:**  
  In `.env` set `DATABASE_URL` to the **Supabase** URI, then run:
  ```bash
  npm run db:push
  ```
- **Option B – Render Shell:**  
  In Render → your service → **Shell**, run:
  ```bash
  npx drizzle-kit push
  ```
  (Only works if `DATABASE_URL` is set in Render.)

---

## 4. Summary

| Layer        | Where        | What you do                                                                     |
| ------------ | ------------ | ------------------------------------------------------------------------------- |
| **Database** | **Supabase** | New project → Settings → Database → copy URI → use as `DATABASE_URL`.          |
| **Backend**  | **Render**   | One Web Service: Build `npm install && npm run build`, Start `npm start`.      |
| **Frontend** | **Netlify** or **Render** | Netlify static build (current) or same Render service (monolith). |

Checklist:

1. [ ] Code on GitHub.
2. [ ] Create Supabase project and copy `DATABASE_URL`.
3. [ ] Create a **public** Storage bucket in Supabase (e.g. `uploads`) and add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` to env.
4. [ ] On Render: New Web Service → connect repo → Build: `npm install && npm run build`, Start: `npm start`.
5. [ ] Set env vars on Render: `NODE_ENV`, `DATABASE_URL`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optionally `SUPABASE_BUCKET`, `RESEND_API_KEY`, `EMAIL_FROM`.
6. [ ] Run `npm run db:push` once (local or Render Shell).
7. [ ] On Netlify: configure build (`npm run build`), publish dir (`client/dist`), and ensure `netlify.toml` has the `/api/*` proxy.
8. [ ] Open the Netlify URL (frontend) and verify it talks to the Render backend.

---

## Free tier limits

- **Render (free):** Service may sleep after ~15 min inactivity (cold start 30–60 s). **Uploaded files** are stored in **Supabase Storage**, so they persist across redeploys.
- **Supabase (free):** 500 MB database, 1 GB file storage; sufficient for small projects.
