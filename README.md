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
Set `VITE_API_BASE_URL` in the Vercel project environment to the deployed Render API URL. For local builds, copy `.env.example` to `.env` in the repository root or set the variable in your shell.

### Render backend

Create a Render Web Service with the repository root directory set to `backend`. Render uses `backend/render.yaml`, runs `npm install`, and starts `npm start`. Attach the persistent disk configured in that file so the JSON store survives deploys.

Set `FRONTEND_ORIGIN` to the deployed Vercel URL and configure the admin credentials and session secret in Render.

### Free enquiry email notifications

The enquiry API stores every submission and can notify an inbox through Resend's free tier. Create a Resend account, add and verify `spotfreezephotography.in`, and add these DNS records in Cloudflare exactly as Resend shows them. Keep Cloudflare proxying enabled only where Resend permits it; mail-related records should remain DNS-only.

Add these Render environment variables:

- `RESEND_API_KEY`: the Resend API key
- `SENDER_EMAIL`: a verified sender such as `hello@spotfreezephotography.in`
- `NOTIFICATION_EMAIL`: the personal inbox where enquiries should arrive

Cloudflare Email Routing can separately create `hello@spotfreezephotography.in` and forward incoming mail to a personal inbox. Email Routing is for receiving mail; Resend handles the website notification sent by the API.

### Search engine indexing

The frontend includes `robots.txt`, `sitemap.xml`, canonical metadata, and social metadata. In Google Search Console, add the domain property, verify it with the DNS TXT record Google provides in Cloudflare, submit `https://spotfreezephotography.in/sitemap.xml`, and request indexing for the home, portfolio, and contact URLs. Also add the site to Bing Webmaster Tools and submit the same sitemap. Indexing is not immediate, and a new domain can take days or weeks to appear.
