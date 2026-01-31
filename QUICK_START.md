# 🚀 Quick Start - Studio CMS

## ⚡ Super Fast Start

### Windows Users (Easiest Way)

1. **Double-click** `start-dev.bat`
2. Wait for it to install and start
3. Open browser to http://localhost:3000

That's it! 🎉

---

## 📋 Manual Start

### First Time Setup

```powershell
# 1. Install Node.js from https://nodejs.org/ (if not installed)

# 2. Install dependencies
npm install

# 3. Start the server
npm run dev:cms
```

### Every Time After

```powershell
npm run dev:cms
```

---

## 🌐 Access Your Site

- **Main Website**: http://localhost:3000
- **CMS Admin Panel**: http://localhost:3000/admin

---

## 📝 Edit Content

1. Go to http://localhost:3000/admin
2. Click on any section (Home, Services, Packages, etc.)
3. Edit the content
4. Click "Save"
5. Refresh your main site to see changes

---

## 📁 Where Content is Stored

All content is saved in the `content/` folder:

```
content/
├── home.json           ← Homepage content
├── siteSettings.json   ← Site-wide settings
├── services/           ← Service items
├── packages/           ← Pricing packages
├── team/               ← Team members
└── works/              ← Portfolio items
```

You can edit these files directly OR use the CMS at `/admin`

---

## 🖼️ Upload Images

1. Go to http://localhost:3000/admin
2. Edit any content with an image field
3. Click the image field
4. Upload your image
5. Images are saved to `public/images/`

---

## 🛑 Stop the Server

Press `Ctrl + C` in the terminal/PowerShell window

---

## ❓ Troubleshooting

### "npm is not recognized"
→ Install Node.js from https://nodejs.org/

### Port 3000 already in use
→ Stop other apps using port 3000, or change the port

### CMS not loading
→ Make sure you're running `npm run dev:cms` (not just `npm run dev`)

### Changes not showing
→ Refresh the browser (Ctrl + F5)

---

## 📚 More Info

- **Full Setup Guide**: See `INSTALLATION_GUIDE.md`
- **Local CMS Details**: See `LOCAL_SETUP.md`
- **Project Overview**: See `README.md`

---

## 🚀 Deploy to Production

When ready to go live:

1. Push code to GitHub
2. Connect to Vercel or Netlify
3. Deploy!

For production CMS with GitHub auth, see `LOCAL_SETUP.md`

