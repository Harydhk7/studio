# Spot Freeze Deployment

Spot Freeze can run in two ways:

1. Full-stack on one Node host such as Render or Railway.
2. Frontend on Vercel and backend on Render.

The second option is usually cleaner for this project.

## Local Development

```bash
npm.cmd install
npm.cmd run dev
```

- Frontend: `http://localhost:5173`
- Backend/API: `http://localhost:5000`
- Admin: `http://localhost:5173/admin`

Local `.env` values:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=local-development-secret
FRONTEND_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5000
```

## Production Build Test

```bash
npm.cmd run build
npm.cmd start
```

Open `http://localhost:5000`.

## Backend on Render

Create a Render Web Service from the GitHub repo.

Settings:

- Runtime: `Node`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`

Environment variables:

```bash
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-strong-password
SESSION_SECRET=a-long-random-secret
FRONTEND_ORIGIN=https://your-vercel-site.vercel.app
```

Persistent disk:

- Mount path: `/opt/render/project/src/data`
- Size: `1 GB` or higher

After deploy, copy the backend URL, for example:

```bash
https://spotfreeze-api.onrender.com
```

## Frontend on Vercel

Create a Vercel project from the same GitHub repo.

Settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

Environment variable:

```bash
VITE_API_BASE_URL=https://spotfreeze-api.onrender.com
```

Replace the URL with your actual Render backend URL.

After Vercel gives you the frontend URL, go back to Render and update:

```bash
FRONTEND_ORIGIN=https://your-vercel-site.vercel.app
```

Redeploy Render after changing `FRONTEND_ORIGIN`.

## Admin Login

Admin URL:

```bash
https://your-vercel-site.vercel.app/admin
```

Login uses the Render backend through `VITE_API_BASE_URL`.

## One-Host Render Deployment

You can also deploy only to Render and skip Vercel.

Use:

- Build command: `npm install && npm run build`
- Start command: `npm start`

Then open:

```bash
https://spotfreeze-api.onrender.com
https://spotfreeze-api.onrender.com/admin
```

## Important

The current app stores management data in `data/spotfreeze-db.json`. On Render, use a persistent disk mounted to `/opt/render/project/src/data`; otherwise admin changes can be lost during redeploys.
