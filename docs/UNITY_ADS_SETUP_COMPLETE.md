# Unity Ads Integration - Complete Setup Guide

## ✅ Files Created

1. `services/unityAdsManager.ts` - Main Unity Ads manager
2. `components/UnityBannerAd.tsx` - Banner ad component

## 📋 Setup Steps

### Step 1: Install Unity Ads Package

```bash
npm install react-native-unity-ads
npx expo prebuild --clean
```

### Step 2: Get Your Unity Ads IDs

1. Login to Unity Dashboard: https://dashboard.unity3d.com/
2. Go to your project "SuperHub"
3. Navigate to **Monetization** → **Ad Units**
4. Create these placements:
   - **Banner_Android** (Banner ad)
   - **Interstitial_Android** (Interstitial ad)
   - **Rewarded_Android** (Rewarded video ad)
5. Copy your **Game ID** (found in project settings)

### Step 3: Configure Unity Ads

**File: `services/unityAdsManager.ts`**

Replace these values (lines 10-17):

```typescript
const UNITY_CONFIG = {
  gameId: 'YOUR_GAME_ID', // ← Replace with your Game ID
  testMode: __DEV__,
  
  placements: {
    banner: 'Banner_Android',      // ← Your banner placement ID
    interstitial: 'Interstitial_Android', // ← Your interstitial placement ID
    rewarded: 'Rewarded_Android',  // ← Your rewarded placement ID
  },
};
```

### Step 4: Initialize Unity Ads in App

**File: `app/_layout.tsx`**

Add initialization:

```typescript
import { unityAdsManager } from '@/services/unityAdsManager';

export default function RootLayout() {
  useEffect(() => {
    // Initialize Unity Ads
    unityAdsManager.initialize();
  }, []);

  // ... rest of your code
}
```

### Step 5: Replace AdMob Components

#### Update Home Screen (`app/index.tsx`):

**Remove:**
```typescript
import { BannerAd } from '@/components/BannerAd';
import { adManager } from '@/services/adManager';
```

**Add:**
```typescript
import { UnityBannerAd } from '@/components/UnityBannerAd';
import { unityAdsManager } from '@/services/unityAdsManager';
```

**Replace banner ads:**
```typescript
// Old AdMob banner
<BannerAd 
  size="custom" 
  adUnitId="ca-app-pub-3940256099942544/6300978111"
/>

// New Unity banner
<UnityBannerAd position="bottom" />
```

**Replace interstitial:**
```typescript
// Old
await adManager.showInterstitial();

// New
await unityAdsManager.showInterstitial();
```

**Replace rewarded:**
```typescript
// Old
const rewarded = await adManager.showRewarded();

// New
const rewarded = await unityAdsManager.showRewarded();
```

### Step 6: Update All Screens

Apply the same changes to these files:
- `app/quality.tsx`
- `app/download.tsx`
- `app/complete.tsx`
- `app/preview.tsx`
- `games/screens/GamesHome.tsx`

### Step 7: Remove AdMob Dependencies

**File: `package.json`**

Remove:
```json
"react-native-google-mobile-ads": "^16.0.3"
```

**File: `app.json`**

Remove AdMob plugin:
```json
[
  "react-native-google-mobile-ads",
  {
    "androidAppId": "ca-app-pub-4846583305979583~7315110438",
    "iosAppId": "ca-app-pub-4846583305979583~7315110438"
  }
]
```

Then run:
```bash
npm uninstall react-native-google-mobile-ads
npx expo prebuild --clean
```

---

## 🎮 Usage Examples

### Show Banner Ad

```typescript
import { UnityBannerAd } from '@/components/UnityBannerAd';

// In your component
<UnityBannerAd position="bottom" />
```

### Show Interstitial Ad

```typescript
import { unityAdsManager } from '@/services/unityAdsManager';

// Before download
await unityAdsManager.showInterstitial();
```

### Show Rewarded Ad

```typescript
import { unityAdsManager } from '@/services/unityAdsManager';

// Before extraction
const earnedReward = await unityAdsManager.showRewarded();

if (earnedReward) {
  // User watched the ad, proceed with extraction
  startExtraction();
} else {
  // User didn't watch, show message
  Alert.alert('Please watch the ad to continue');
}
```

### Check Ad Availability

```typescript
// Check if interstitial is ready
if (unityAdsManager.isInterstitialReady()) {
  await unityAdsManager.showInterstitial();
}

// Check if rewarded is ready
if (unityAdsManager.isRewardedReady()) {
  await unityAdsManager.showRewarded();
}
```

---

## 🧪 Testing

### Test Mode

Unity Ads automatically uses test ads in development mode (`__DEV__ = true`).

### Test on Device

```bash
# Build and test
eas build --platform android --profile preview

# Or run locally
npx expo run:android
```

### Verify Ads Work

1. ✅ Banner appears at bottom of screens
2. ✅ Interstitial shows before download
3. ✅ Rewarded shows before extraction
4. ✅ Ads don't crash the app
5. ✅ Proper error handling

---

## 📊 Expected Revenue

### With 10,000 Active Users:

**Banner Ads:**
- Impressions: 150,000/month (5 per user/day)
- eCPM: $3
- Revenue: $450/month

**Interstitial Ads:**
- Impressions: 60,000/month (2 per user/day)
- eCPM: $5
- Revenue: $300/month

**Rewarded Ads:**
- Impressions: 30,000/month (1 per user/day)
- eCPM: $8
- Revenue: $240/month

**Total: $990/month**

### With 50,000 Active Users:
**Total: $4,950/month**

### With 100,000 Active Users:
**Total: $9,900/month**

---

## 🔧 Troubleshooting

### Ads Not Showing?

1. **Check initialization:**
   ```typescript
   console.log('Unity Ads initialized:', unityAdsManager.isInitialized());
   ```

2. **Check Game ID:**
   - Make sure it's correct in `unityAdsManager.ts`
   - Verify in Unity Dashboard

3. **Check placement IDs:**
   - Must match exactly with Unity Dashboard
   - Case-sensitive

4. **Check test mode:**
   - Should be `true` in development
   - Should be `false` in production

### Banner Not Visible?

1. Check if `UnityBannerAd` component is rendered
2. Check console for errors
3. Try different position ('top' or 'bottom')

### Interstitial/Rewarded Not Loading?

1. Wait 30 seconds after initialization
2. Check console logs for load errors
3. Verify placement IDs are correct

---

## 📱 App.json Configuration

**File: `app.json`**

No special configuration needed for Unity Ads! It works out of the box.

---

## 🚀 Deployment

### Build for Production

```bash
# Build APK
eas build --platform android --profile production

# Build AAB for Play Store
eas build --platform android --profile production
```

### Before Publishing:

1. ✅ Set `testMode: false` in production
2. ✅ Test all ad placements
3. ✅ Verify Game ID is correct
4. ✅ Check Unity Dashboard for approval status

---

## 📈 Monitoring

### Unity Dashboard

1. Login: https://dashboard.unity3d.com/
2. Go to **Monetization** → **Statistics**
3. Monitor:
   - Impressions
   - eCPM
   - Revenue
   - Fill rate

### Key Metrics:

- **Fill Rate:** Should be >90%
- **eCPM:** $3-8 for sideloaded apps
- **Revenue:** Track daily/monthly

---

## ✅ Migration Checklist

- [ ] Install `react-native-unity-ads`
- [ ] Get Game ID from Unity Dashboard
- [ ] Create ad placements (Banner, Interstitial, Rewarded)
- [ ] Update `unityAdsManager.ts` with IDs
- [ ] Initialize Unity Ads in `_layout.tsx`
- [ ] Replace AdMob components in all screens
- [ ] Remove AdMob dependencies
- [ ] Test banner ads
- [ ] Test interstitial ads
- [ ] Test rewarded ads
- [ ] Build and test APK
- [ ] Monitor revenue in Unity Dashboard

---

## 🎯 Next Steps

1. **Complete the setup** following steps above
2. **Test thoroughly** on real device
3. **Monitor performance** in Unity Dashboard
4. **Optimize placements** based on data
5. **Scale up** as user base grows

---

*Last Updated: February 14, 2026*
*Status: Ready for implementation*
*Estimated Setup Time: 2-3 hours*
