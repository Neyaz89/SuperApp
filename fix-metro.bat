@echo off
echo ========================================
echo  Fix Metro Bundler Error
echo ========================================
echo.

echo [1/3] Clearing Metro cache...
rmdir /s /q .expo 2>nul
rmdir /s /q node_modules\.cache 2>nul
echo Done!
echo.

echo [2/3] Clearing Android build cache...
rmdir /s /q android\app\build 2>nul
echo Done!
echo.

echo [3/3] Starting Metro with clean cache...
echo.
echo ========================================
echo  Metro will start now
echo  Press Ctrl+C to stop
echo ========================================
echo.

npx expo start --clear
