# 🐳 Studio CMS - Docker Quick Start

## ⚡ Super Easy Setup (No Node.js Required!)

### Step 1: Install Docker Desktop

Download and install Docker Desktop:
- **Windows**: https://www.docker.com/products/docker-desktop/

### Step 2: Start the Server

**Easiest Way (Windows):**
- Double-click `docker-start.bat`

**Or use PowerShell:**
```powershell
docker-compose up dev
```

### Step 3: Access Your Site

- **Website**: http://localhost:3000
- **CMS Admin**: http://localhost:3000/admin

That's it! 🎉

---

## 🛑 Stop the Server

**Easiest Way:**
- Double-click `docker-stop.bat`

**Or press:**
- `Ctrl + C` in the terminal

**Or use PowerShell:**
```powershell
docker-compose down
```

---

## 📝 Edit Content

1. Go to http://localhost:3000/admin
2. Click any section (Home, Services, Packages, Team, Works)
3. Edit content
4. Click "Save"
5. Refresh your website to see changes

All changes are saved to the `content/` folder on your computer!

---

## 🖼️ Upload Images

1. In the CMS, click on any image field
2. Upload your image
3. Images are saved to `public/images/`

---

## 🔄 Common Tasks

### Rebuild After Changing Dependencies
```powershell
docker-compose up --build dev
```

### Run in Background
```powershell
docker-compose up -d dev
```

### View Logs
```powershell
docker-compose logs -f dev
```

### Clean Everything
```powershell
docker-compose down -v
docker system prune -a
```

---

## 📁 Project Structure

```
content/              ← Your content (JSON/Markdown)
├── home.json
├── siteSettings.json
├── services/
├── packages/
├── team/
└── works/

public/
├── admin/           ← CMS configuration
└── images/          ← Uploaded images

app/                 ← Next.js pages
components/          ← React components
```

---

## ❓ Troubleshooting

### Docker not found
→ Install Docker Desktop from the link above

### Port 3000 already in use
→ Stop other apps using port 3000, or edit `docker-compose.yml` to use a different port

### Container won't start
→ Check logs: `docker-compose logs dev`

### Changes not showing
→ Refresh browser (Ctrl + F5)

### Out of disk space
→ Clean Docker: `docker system prune -a`

---

## 🚀 Production Build

To test production build locally:

```powershell
docker-compose up prod
```

---

## 📚 More Information

- **Detailed Docker Guide**: See `DOCKER_SETUP.md`
- **CMS Configuration**: See `LOCAL_SETUP.md`
- **Project Overview**: See `README.md`

---

## 🎯 Advantages of Docker

✅ No Node.js installation needed  
✅ Consistent environment across all machines  
✅ Easy to start and stop  
✅ Isolated from your system  
✅ Same setup for development and production  

---

## 🌐 Deploy to Production

When ready to deploy:

1. Push to GitHub
2. Deploy to Vercel/Netlify/Railway
3. They'll use the Dockerfile automatically!

---

## 💡 Tips

- Keep Docker Desktop running while developing
- Use `docker-start.bat` for easiest startup
- All your content is saved locally in `content/`
- You can edit files directly or use the CMS
- Images go to `public/images/`

---

## 🆘 Need Help?

Check the detailed guides:
- `DOCKER_SETUP.md` - Complete Docker documentation
- `LOCAL_SETUP.md` - CMS configuration details
- `README.md` - Project overview

Or check Docker logs:
```powershell
docker-compose logs -f dev
```

