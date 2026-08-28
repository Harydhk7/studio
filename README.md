# Spot Freeze Photography

Spot Freeze is a Vite/React photography frontend with a small Express API for enquiries and studio administration.

## Project structure

- `frontend/` - Vercel deployment. The Vite source is in `frontend/client`.
- `backend/` - Render deployment. The Express API is in `backend/server` and persists data in `backend/data`.

## Local development

```powershell
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/api` to the API at `http://localhost:5000`.

To install and run each deployment folder independently:

```powershell
npm install --prefix frontend
npm install --prefix backend
npm run build --prefix frontend
npm start --prefix backend
```

Set `VITE_API_BASE_URL` in the frontend environment when the API is hosted separately. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`, and `FRONTEND_ORIGIN` in the backend environment.

## Deployment

### Vercel frontend

Create a Vercel project with the repository root directory set to `frontend`. Vercel uses `frontend/vercel.json`, runs `npm run build`, and publishes `dist`.

Set `VITE_API_BASE_URL` to the deployed Render API URL.

### Render backend

Create a Render Web Service with the repository root directory set to `backend`. Render uses `backend/render.yaml`, runs `npm install`, and starts `npm start`. Attach the persistent disk configured in that file so the JSON store survives deploys.

Set `FRONTEND_ORIGIN` to the deployed Vercel URL and configure the admin credentials and session secret in Render.
