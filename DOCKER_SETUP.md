# 🐳 Docker Setup Guide - Studio CMS

## Why Docker?

✅ **No Node.js installation needed** - Everything runs in containers  
✅ **Consistent environment** - Works the same on any machine  
✅ **Easy setup** - Just one command to start  
✅ **Isolated** - Doesn't affect your system  

---

## Prerequisites

### Install Docker Desktop

1. **Download Docker Desktop**
   - Windows: https://www.docker.com/products/docker-desktop/
   - Download and run the installer
   - Restart your computer if prompted

2. **Verify Installation**
   Open PowerShell and run:
   ```powershell
   docker --version
   docker-compose --version
   ```

---

## 🚀 Quick Start (Development with CMS)

### Option 1: Using Docker Compose (Recommended)

```powershell
# Start development server with CMS
docker-compose up dev
```

That's it! The first time will take a few minutes to download and build.

**Access your site:**
- Website: http://localhost:3000
- CMS Admin: http://localhost:3000/admin

**Stop the server:**
Press `Ctrl + C` in the terminal

**Remove containers:**
```powershell
docker-compose down
```

---

### Option 2: Using Docker Commands

```powershell
# Build the development image
docker build --target development -t studio-dev .

# Run the container
docker run -p 3000:3000 -p 8081:8081 -v ${PWD}:/app -v /app/node_modules studio-dev
```

---

## 🏭 Production Build

To run a production build with Docker:

```powershell
# Using docker-compose
docker-compose up prod

# Or using docker commands
docker build --target production -t studio-prod .
docker run -p 3000:3000 studio-prod
```

---

## 📝 How It Works

### Development Mode (`docker-compose up dev`)

- Runs Next.js in development mode with hot reload
- Runs Decap CMS local backend proxy
- Mounts your code as a volume (changes reflect immediately)
- No need to rebuild when you edit code
- CMS works without GitHub authentication

### Production Mode (`docker-compose up prod`)

- Builds optimized production bundle
- Runs Next.js in production mode
- Smaller image size
- Better performance

---

## 🔄 Common Commands

```powershell
# Start development server
docker-compose up dev

# Start in background (detached mode)
docker-compose up -d dev

# View logs
docker-compose logs -f dev

# Stop containers
docker-compose down

# Rebuild containers (after changing dependencies)
docker-compose up --build dev

# Remove all containers and volumes
docker-compose down -v

# Access container shell
docker-compose exec dev sh
```

---

## 📁 File Persistence

### Content Files
All content in the `content/` folder is automatically saved to your local machine because we mount the entire project directory as a volume.

When you edit content via the CMS at `/admin`, changes are saved to:
- `content/home.json`
- `content/services/*.json`
- `content/packages/*.json`
- `content/team/*.json`
- `content/works/*.md`
- `content/siteSettings.json`

### Uploaded Images
Images uploaded via CMS are saved to `public/images/` on your local machine.

---

## 🛠️ Troubleshooting

### Docker not found
→ Install Docker Desktop from https://www.docker.com/products/docker-desktop/

### Port already in use
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

Or change the port in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### Changes not reflecting
```powershell
# Rebuild the container
docker-compose up --build dev
```

### Container keeps restarting
```powershell
# Check logs
docker-compose logs dev
```

### Out of disk space
```powershell
# Clean up unused Docker resources
docker system prune -a
```

---

## 🎯 Recommended Workflow

### Daily Development

1. **Start the server:**
   ```powershell
   docker-compose up dev
   ```

2. **Edit content:**
   - Go to http://localhost:3000/admin
   - Make changes
   - Save

3. **Edit code:**
   - Edit files in your editor
   - Changes auto-reload in browser

4. **Stop when done:**
   - Press `Ctrl + C`

### After Changing Dependencies

If you modify `package.json`:

```powershell
# Rebuild the container
docker-compose up --build dev
```

---

## 📊 Resource Usage

Docker containers are lightweight:
- **Development**: ~500MB RAM, minimal CPU
- **Production**: ~200MB RAM, minimal CPU

---

## 🚀 Next Steps

1. Start the dev server: `docker-compose up dev`
2. Open http://localhost:3000/admin
3. Start editing your content!

---

## 📚 Additional Resources

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Next.js Docker: https://nextjs.org/docs/deployment#docker-image

