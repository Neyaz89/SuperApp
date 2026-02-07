# Terabox Setup - REQUIRED FOR TERABOX TO WORK

Terabox has aggressive anti-bot protection. ALL public APIs are blocked. The ONLY working method is yt-dlp with authentication cookies.

## Steps to Enable Terabox:

### 1. Install Chrome Extension
Install "Get cookies.txt LOCALLY" extension:
https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc

### 2. Login to Terabox
1. Go to https://www.terabox.com
2. Login with your account
3. Open any shared file to verify you're logged in

### 3. Export Cookies
1. Click the extension icon
2. Click "Export" button
3. Save the cookies.txt file

### 4. Add Cookies to Backend
1. Open `backend/cookies/terabox_cookies.txt`
2. Replace ALL content with the exported cookies
3. Save the file

### 5. Deploy
```bash
git add .
git commit -m "Add Terabox cookies"
git push
```

Wait 2-3 minutes for Render to rebuild.

## Important Notes:
- Cookies expire after ~30 days - you'll need to refresh them
- Without cookies, Terabox will NOT work
- This is the ONLY method that works due to Terabox's anti-bot protection
- Your backend already has the code - just needs cookies

## Why Other Methods Don't Work:
- ❌ WebView - Blocked with ERR_CONNECTION_RESET
- ❌ Public APIs - Return 403/404/400 errors
- ❌ Direct API - Requires "verify_v2" captcha
- ✅ yt-dlp with cookies - ONLY working method
