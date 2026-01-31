# Complete Installation Guide - Studio CMS

## Prerequisites

You need to install Node.js first.

### Install Node.js on Windows

1. **Download Node.js**
   - Go to: https://nodejs.org/
   - Download the **LTS version** (recommended)
   - Run the installer (.msi file)

2. **Verify Installation**
   Open PowerShell and run:
   ```powershell
   node --version
   npm --version
   ```
   You should see version numbers (e.g., v20.x.x and 10.x.x)

---

## Setup Steps

### Step 1: Install Dependencies

Open PowerShell in the project folder and run:

```powershell
npm install
```

This will install all required packages (Next.js, React, Tailwind CSS, etc.)

### Step 2: Run the Development Server

**Option A: With CMS (Recommended)**
```powershell
npm run dev:cms
```

**Option B: Without CMS**
```powershell
npm run dev
```

### Step 3: Open in Browser

- **Website**: http://localhost:3000
- **CMS Admin**: http://localhost:3000/admin

---

## What I've Configured for You

✅ **Local CMS Backend** - No GitHub authentication needed for local development
✅ **Decap CMS** - Content management at `/admin`
✅ **Auto-save to files** - Changes save directly to `content/` folder
✅ **Development scripts** - Easy commands to run everything

---

## CMS Features

The CMS at `/admin` lets you edit:

1. **Home Page** - Title, subtitle, hero image, CTA button
2. **Services** - Add/edit service offerings
3. **Packages** - Pricing packages
4. **Team** - Team member profiles
5. **Works** - Portfolio/project showcase
6. **Site Settings** - Email, phone, address

All changes are saved as JSON/Markdown files in the `content/` folder.

---

## File Structure

```
content/              ← All your content (editable via CMS)
├── home.json
├── siteSettings.json
├── services/
├── packages/
├── team/
└── works/

public/
├── admin/           ← CMS configuration
└── images/          ← Upload images here via CMS

app/                 ← Next.js pages
components/          ← React components
```

---

## Common Commands

```powershell
# Install dependencies
npm install

# Run dev server with CMS
npm run dev:cms

# Run dev server only
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

---

## Next Steps After Installation

1. Run `npm install`
2. Run `npm run dev:cms`
3. Visit http://localhost:3000/admin
4. Start editing your content!

---

## Production Deployment

When ready to deploy:

1. Push to GitHub repository
2. Deploy to Vercel/Netlify
3. Configure GitHub OAuth for CMS (see LOCAL_SETUP.md)

---

## Need Help?

- Check `LOCAL_SETUP.md` for detailed CMS setup
- Check `README.md` for project overview

