@echo off
echo ========================================
echo Studio CMS - Docker Development Server
echo ========================================
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not installed!
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

echo Docker version:
docker --version
echo.

echo Starting development server with CMS...
echo.
echo This may take a few minutes on first run...
echo.
echo The site will be available at:
echo   - Website: http://localhost:3000
echo   - CMS Admin: http://localhost:3000/admin
echo.
echo Press Ctrl+C to stop the server
echo.

docker-compose up dev

