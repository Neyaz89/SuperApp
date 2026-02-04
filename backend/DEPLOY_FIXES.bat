@echo off
echo ========================================
echo  Multi-Extractor System - Deploy Fixes
echo ========================================
echo.

echo [1/4] Checking git status...
git status
echo.

echo [2/4] Adding all changes...
git add .
echo.

echo [3/4] Committing changes...
git commit -m "fix: Multi-extractor system - Use community Cobalt instances, fix yt-dlp format, add cookies support"
echo.

echo [4/4] Pushing to Render...
git push
echo.

echo ========================================
echo  Deployment initiated!
echo ========================================
echo.
echo Render will automatically:
echo  - Build the new version
echo  - Deploy to production
echo  - Restart the server
echo.
echo Wait 2-3 minutes, then test:
echo.
echo Test YouTube:
echo curl -X POST https://superapp-api-d3y5.onrender.com/api/extract/v2 ^
echo   -H "Content-Type: application/json" ^
echo   -d "{\"url\": \"https://youtu.be/dQw4w9WgXcQ\"}"
echo.
echo ========================================
pause
