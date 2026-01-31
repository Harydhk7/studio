# 🎯 How to Access the CMS

## ✅ Working URL

Use this URL to access the CMS:

**http://localhost:3000/admin/index.html**

This is the direct path to the static CMS admin page.

---

## 📝 Why `/admin` Doesn't Work

Next.js App Router has specific routing behavior that conflicts with serving static HTML files from the `public` folder. The `/admin/index.html` path works perfectly because it directly serves the static file.

---

## 🔖 Bookmark This URL

For easy access, bookmark:
- **http://localhost:3000/admin/index.html**

---

## 🎨 Using the CMS

1. Go to http://localhost:3000/admin/index.html
2. You'll see the Decap CMS interface
3. Click on any collection to edit:
   - Home
   - Services
   - Packages
   - Team
   - Works
   - Site Settings

4. Make your changes
5. Click "Save" or "Publish"
6. Changes save to the `content/` folder
7. Refresh your main site to see updates

---

## 🔧 Technical Details

- **CMS Files**: `public/admin/index.html` and `public/admin/config.yml`
- **Config**: Uses local backend (no GitHub auth needed)
- **Content Storage**: `content/` folder
- **Image Storage**: `public/images/`
- **CMS Proxy**: Running on port 8081

---

## 🚀 Alternative: Create a Bookmark

Create a browser bookmark with:
- **Name**: Studio CMS Admin
- **URL**: http://localhost:3000/admin/index.html

---

## ✨ Everything Works!

The CMS is fully functional at `/admin/index.html`. Just use that URL and you're good to go!

