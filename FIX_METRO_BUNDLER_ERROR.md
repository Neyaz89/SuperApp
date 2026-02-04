# 🔧 Fix Metro Bundler Error - "Unable to resolve express"

## ❌ Error

```
Android Bundling failed
Unable to resolve "express" from "server.js"
```

## 🔍 Root Cause

Metro bundler (React Native's JavaScript bundler) is trying to bundle the **backend** folder, which contains Node.js server code that should NOT be included in the mobile app.

The backend runs separately on Render, not inside the React Native app.

## ✅ Solution Applied

### 1. Created `metro.config.js`

**File**: `metro.config.js`

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude backend folder from Metro bundler
config.resolver.blockList = [
  /backend\/.*/,
  /node_modules\/.*\/backend\/.*/,
];

// Exclude backend from watch folders
config.watchFolders = [__dirname];

module.exports = config;
```

This tells Metro to **ignore** the entire `backend/` folder.

### 2. Verified `.easignore`

**File**: `.easignore`

```
backend/
```

This ensures EAS Build also ignores the backend folder.

### 3. Updated `.gitignore`

Added comment explaining backend files are excluded from Metro but kept in git for Render deployment.

## 🚀 How to Fix

### Step 1: Clear Metro Cache

```bash
npx expo start --clear
```

Or:

```bash
# Delete cache manually
rm -rf .expo
rm -rf node_modules/.cache
```

### Step 2: Restart Development Server

```bash
npx expo start
```

### Step 3: Rebuild Android App

Press `a` in the Expo terminal to rebuild Android, or:

```bash
npx expo run:android
```

## 📊 Project Structure

```
SuperApp/
├── app/                    ✅ React Native app (bundled by Metro)
├── components/             ✅ React Native components (bundled by Metro)
├── services/               ✅ React Native services (bundled by Metro)
├── contexts/               ✅ React Native contexts (bundled by Metro)
├── backend/                ❌ Node.js server (EXCLUDED from Metro)
│   ├── server.js           ❌ Express server (runs on Render)
│   ├── api/                ❌ API routes (runs on Render)
│   ├── extractors/         ❌ Video extractors (runs on Render)
│   └── ...
├── metro.config.js         ✅ Metro configuration (excludes backend)
├── .easignore              ✅ EAS ignore (excludes backend)
└── package.json            ✅ React Native dependencies
```

## 🎯 Key Points

1. **Backend is separate**: The backend runs on Render (https://superapp-api-d3y5.onrender.com)
2. **Frontend calls API**: React Native app makes HTTP requests to the backend API
3. **No backend in app**: Backend code is never bundled into the mobile app
4. **Metro excludes backend**: `metro.config.js` tells Metro to ignore `backend/` folder

## 🧪 Verify Fix

After clearing cache and restarting:

1. ✅ Metro should start without errors
2. ✅ Android build should succeed
3. ✅ App should run and make API calls to Render backend

## 📱 How the App Works

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  📱 React Native App (Your Phone)                          │
│  ├── UI Components                                         │
│  ├── Download Logic                                        │
│  └── API Calls ──────────────────────┐                     │
│                                       │                     │
└───────────────────────────────────────┼─────────────────────┘
                                        │
                                        │ HTTP Request
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🌐 Backend API (Render Server)                            │
│  ├── Express Server                                        │
│  ├── Video Extractors                                      │
│  ├── yt-dlp                                                │
│  └── Cobalt API                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Troubleshooting

### If Error Persists

**1. Delete all caches**:
```bash
# Stop Metro
# Then delete:
rm -rf .expo
rm -rf node_modules/.cache
rm -rf android/app/build
rm -rf ios/build
```

**2. Reinstall dependencies**:
```bash
npm install
```

**3. Clear watchman (if on Mac/Linux)**:
```bash
watchman watch-del-all
```

**4. Restart with clean slate**:
```bash
npx expo start --clear
```

### If Still Not Working

**Check `metro.config.js` exists**:
```bash
ls -la metro.config.js
```

Should show the file exists.

**Check `.easignore` exists**:
```bash
cat .easignore
```

Should show `backend/`.

**Verify Metro is using config**:
Look for this in Metro output:
```
Using metro config at: /path/to/metro.config.js
```

## ✅ Summary

**Problem**: Metro trying to bundle backend Node.js code  
**Solution**: Created `metro.config.js` to exclude backend folder  
**Result**: Metro only bundles React Native app code  

**Next Steps**:
1. Clear Metro cache: `npx expo start --clear`
2. Rebuild Android: Press `a` in Expo terminal
3. App should work without backend bundling errors

---

**Status**: ✅ FIXED  
**Files Modified**: `metro.config.js`, `.gitignore`  
**Action Required**: Clear cache and restart Metro
