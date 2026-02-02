@echo off
echo ========================================
echo SuperApp - Installation Script
echo ========================================
echo.

echo [1/3] Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Please check your internet connection and try again
    pause
    exit /b 1
)

echo.
echo [2/3] Checking Expo CLI...
call npx expo --version

echo.
echo [3/3] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Start development server:
echo    npx expo start
echo.
echo 2. Run on Android:
echo    npx expo start --android
echo.
echo 3. Run on iOS:
echo    npx expo start --ios
echo.
echo ========================================
echo Documentation:
echo ========================================
echo.
echo - Quick Start: QUICKSTART.md
echo - Full Setup: SETUP.md
echo - Architecture: ARCHITECTURE.md
echo - Features: FEATURES.md
echo.
echo ========================================
echo.

pause
