# Spot Freeze Deployment

Spot Freeze is deployed as two services.

## Frontend on Vercel

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://your-api.onrender.com`

The Vercel rewrite in `frontend/vercel.json` provides the SPA fallback.

## Backend on Render

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Blueprint: `backend/render.yaml`

Configure `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`, and `FRONTEND_ORIGIN` in Render. The persistent disk mounted at `/opt/render/project/src/data` stores `spotfreeze-db.json`.

## Local check

```powershell
npm install --prefix frontend
npm install --prefix backend
npm run build --prefix frontend
npm start --prefix backend
```
