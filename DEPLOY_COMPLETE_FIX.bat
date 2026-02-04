@echo off
echo ========================================
echo  COMPLETE FIX DEPLOYMENT
echo ========================================
echo.
echo This will deploy ALL fixes:
echo  - YouTube PO Token workaround
echo  - Cobalt community instances
echo  - Platform-specific cookies
echo  - requirements.txt for yt-dlp
echo.
pause
echo.

echo [1/5] Checking git status...
git status
echo.

echo [2/5] Adding all changes...
git add .
echo.

echo [3/5] Committing changes...
git commit -m "fix: Complete multi-extractor system - YouTube PO Token workaround, Cobalt community instances, platform cookies, requirements.txt"
echo.

echo [4/5] Pushing to Render...
git push
echo.

echo [5/5] Deployment initiated!
echo.
echo ========================================
echo  DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Render will now:
echo  1. Pull latest code
echo  2. Build Docker image
echo  3. Install Python + yt-dlp
echo  4. Deploy new version
echo  5. Restart server
echo.
echo Wait 3-5 minutes, then test:
echo.
echo curl -X POST https://superapp-api-d3y5.onrender.com/api/extract \
echo   -H "Content-Type: application/json" \
echo   -d "{\"url\": \"https://youtu.be/X5TN9IPuojI\"}"
echo.
echo ========================================
echo Expected: SUCCESS with tv_embedded client
echo ========================================
pause
