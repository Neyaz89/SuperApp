@echo off
echo ================================
echo SuperApp Backend Deployment
echo ================================
echo.

echo Checking Vercel CLI...
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Vercel CLI not found. Installing...
    npm install -g vercel
)

echo.
echo Deploying to Vercel...
echo.

vercel --prod

echo.
echo ================================
echo Deployment Complete!
echo ================================
echo.
echo Don't forget to update the API URL in:
echo services/mediaExtractor.ts
echo.
pause
