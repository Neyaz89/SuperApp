@echo off
echo Fixing Metro bundler cache and routes...
echo.

echo Step 1: Stopping Metro bundler...
taskkill /F /IM node.exe 2>nul

echo Step 2: Clearing Metro cache...
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q .expo 2>nul

echo Step 3: Clearing npm cache...
call npm cache clean --force

echo Step 4: Reinstalling dependencies...
call npm install

echo.
echo ✅ Cache cleared! Now run: npm start
echo.
pause
