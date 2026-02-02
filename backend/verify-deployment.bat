@echo off
echo ================================
echo Verifying Vercel Deployment
echo ================================
echo.

set /p API_URL="Enter your Vercel URL (e.g., https://your-app.vercel.app): "

echo.
echo Testing root endpoint...
curl -s %API_URL%
echo.
echo.

echo Testing extract endpoint...
curl -s -X POST %API_URL%/api/extract ^
  -H "Content-Type: application/json" ^
  -d "{\"url\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}"

echo.
echo.
echo ================================
echo If you see JSON responses above, deployment is working!
echo If you see 404 errors, run: vercel --prod
echo ================================
pause
