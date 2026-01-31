# Local Setup Guide for Studio CMS

## Quick Start (Local Development with CMS)

### 1. Install Dependencies
```powershell
npm install
```

### 2. Run Development Server with CMS
```powershell
npm run dev:cms
```

This will start:
- Next.js dev server at `http://localhost:3000`
- Decap CMS local backend proxy at `http://localhost:8081`

### 3. Access the Site
- **Website**: http://localhost:3000
- **CMS Admin**: http://localhost:3000/admin

The CMS will work locally without GitHub authentication!

---

## Alternative: Run Without CMS Proxy

If you just want to see the site without using the CMS:

```powershell
npm run dev
```

Then visit http://localhost:3000

---

## Using the CMS Locally

1. Go to http://localhost:3000/admin
2. You'll see the Decap CMS interface
3. Edit content for:
   - Home page
   - Services
   - Packages
   - Team members
   - Works/Portfolio
   - Site Settings

4. Changes are saved directly to the `content/` folder in your project

---

## Production Setup with GitHub

To use the CMS in production with GitHub authentication:

### 1. Update `public/admin/config.yml`

Change the backend section to:

```yaml
backend:
  name: github
  repo: "Harydhk7/studio"
  branch: "main"

# Remove or comment out:
# local_backend: true
```

### 2. Set up GitHub OAuth

Follow the Decap CMS GitHub backend guide:
https://decapcms.org/docs/github-backend/

You'll need to:
- Create a GitHub OAuth App
- Configure the OAuth credentials
- Deploy to a hosting platform (Vercel, Netlify, etc.)

---

## Folder Structure

```
content/              # All CMS content (JSON/Markdown)
├── home.json        # Homepage content
├── siteSettings.json # Site-wide settings
├── services/        # Service items
├── packages/        # Package offerings
├── team/            # Team members
└── works/           # Portfolio items

public/
├── admin/           # CMS configuration
│   ├── config.yml   # CMS settings
│   └── index.html   # CMS entry point
└── images/          # Uploaded media files

app/                 # Next.js pages
components/          # React components
lib/                 # Content loading utilities
```

---

## Troubleshooting

### CMS shows "Error: Failed to load config"
- Make sure both `npm run dev` and `npm run cms-proxy` are running
- Or use `npm run dev:cms` to run both together

### Changes not showing on the site
- Refresh the page after saving in the CMS
- Check the `content/` folder to verify files were updated

### Port already in use
- Kill the process using port 3000 or 8081
- Or change the port in package.json scripts

