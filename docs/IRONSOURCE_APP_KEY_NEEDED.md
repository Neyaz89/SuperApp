# ⚠️ ACTION REQUIRED: Get ironSource App Key

## Current Status
✅ ironSource SDK installed (`ironsource-mediation@^3.2.0`)  
✅ Placement IDs configured  
✅ Banner ad components created  
✅ App layout updated to initialize ads  
❌ **ironSource App Key NOT configured yet**

## What You Need To Do

### Step 1: Get Your ironSource App Key

1. Go to https://platform.ironsrc.com/
2. Login with your account
3. Select your app (or create a new one)
4. Copy the **App Key** (looks like: `1234abcd`)

### Step 2: Update the Code

Open `services/levelPlayAdsManager.ts` and replace:
```typescript
const APP_KEY = 'YOUR_IRONSOURCE_APP_KEY';
```

With your actual App Key:
```typescript
const APP_KEY = '1234abcd'; // Your actual key from ironSource dashboard
```

### Step 3: Link Unity Ads to ironSource

In your ironSource dashboard:
1. Go to **Mediation** → **Setup** → **SDK Networks**
2. Select **Unity Ads** from available networks
3. Enter your Unity Game ID: `6049201`
4. Map your placements:
   - Banner Bottom: `s9v9hfkefzda26ut`
   - Banner Preview: `8qln6wmtxc5tzhhi`
   - Interstitial: `ocllxnulp749s32x`
   - Rewarded: `1c6x1u5pidvv5h8d`

### Step 4: Build the App

```bash
# Install dependencies
npm install

# Build for Android
eas build --platform android --profile preview
```

## Why ironSource?

Unity Ads doesn't have a standalone React Native SDK. The official way to use Unity Ads in React Native is through **ironSource LevelPlay mediation**.

Benefits:
- Official Unity solution for React Native
- Supports multiple ad networks (not just Unity Ads)
- Better fill rates through mediation
- Modern, maintained SDK

## Your Placement IDs

Already configured in the code:
- **Bottom Screen Banner**: `s9v9hfkefzda26ut`
- **Preview/Download Banner**: `8qln6wmtxc5tzhhi`
- **Interstitial**: `ocllxnulp749s32x`
- **Rewarded**: `1c6x1u5pidvv5h8d`

## Files Modified

1. ✅ `package.json` - Added `ironsource-mediation`
2. ✅ `services/levelPlayAdsManager.ts` - Ads manager (needs App Key)
3. ✅ `components/LevelPlayBannerAd.tsx` - Banner component
4. ✅ `app/_layout.tsx` - Initialize ads
5. ✅ `app/index.tsx` - Home screen with banner
6. ✅ `app/download.tsx` - Download screen with banner
7. ✅ `app.json` - Added AD_ID permission

## Next Build

Once you add the App Key, the build should succeed and ads will work!
