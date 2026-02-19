# AppLovin Migration Guide - Replace AdMob

## Why AppLovin for Sideloaded Apps?

### AppLovin Advantages:
✅ Better support for non-Google Play apps
✅ Higher fill rates for alternative stores
✅ Better eCPM for sideloaded apps
✅ Works well with IndusAppStore, Oppo Store, etc.
✅ More flexible ad formats
✅ Better for high-traffic apps outside Play Store

### AdMob Limitations:
❌ Requires Google Play Services
❌ Lower fill rates for sideloaded apps
❌ Stricter policies for non-Play Store apps
❌ May limit impressions for high traffic

---

## Migration Steps

### Step 1: Create AppLovin Account

1. Go to https://www.applovin.com/
2. Click "Sign Up" → Choose "Publisher"
3. Fill in details:
   - Company/Developer name
   - Email
   - Phone number
   - App details

4. Verify email and complete profile

### Step 2: Create App in AppLovin Dashboard

1. Login to https://dash.applovin.com/
2. Click "Apps" → "Add App"
3. Fill in app details:
   - App Name: SuperHub
   - Package Name: com.superhub.media
   - Platform: Android
   - Category: Tools/Entertainment
   - Store: Other (for sideloaded apps)

4. Get your SDK Key (you'll need this)

### Step 3: Create Ad Units

Create these ad units in AppLovin dashboard:

#### Banner Ad Units:
1. **Home Banner** - 320x50 banner
2. **Quality Banner** - 320x50 banner
3. **Download Banner** - 320x50 banner
4. **Complete Banner** - 320x50 banner
5. **Games Banner** - 320x50 banner

#### Interstitial Ad Units:
1. **Download Interstitial** - Full screen
2. **Quality Interstitial** - Full screen

#### Rewarded Ad Units:
1. **Extract Rewarded** - Rewarded video

Save all Ad Unit IDs - you'll need them for configuration.

---

## Code Changes

### Step 1: Remove AdMob Dependencies

**File: `package.json`**

Remove:
```json
"react-native-google-mobile-ads": "^16.0.3"
```

Add:
```json
"react-native-applovin-max": "^3.0.0"
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

Add AppLovin plugin:
```json
[
  "react-native-applovin-max",
  {
    "androidAppId": "YOUR_APPLOVIN_SDK_KEY",
    "iosAppId": "YOUR_APPLOVIN_SDK_KEY"
  }
]
```

### Step 2: Install Dependencies

```bash
npm uninstall react-native-google-mobile-ads
npm install react-native-applovin-max
npx expo prebuild --clean
```

### Step 3: Update Ad Manager Service

**File: `services/adManager.ts`**

Replace entire file with AppLovin implementation:

```typescript
import AppLovinMAX from 'react-native-applovin-max';

// AppLovin Ad Unit IDs
const AD_UNITS = {
  banner: {
    home: 'YOUR_HOME_BANNER_ID',
    quality: 'YOUR_QUALITY_BANNER_ID',
    download: 'YOUR_DOWNLOAD_BANNER_ID',
    complete: 'YOUR_COMPLETE_BANNER_ID',
    games: 'YOUR_GAMES_BANNER_ID',
  },
  interstitial: {
    download: 'YOUR_DOWNLOAD_INTERSTITIAL_ID',
    quality: 'YOUR_QUALITY_INTERSTITIAL_ID',
  },
  rewarded: {
    extract: 'YOUR_EXTRACT_REWARDED_ID',
  },
};

class AdManager {
  private interstitialReady = false;
  private rewardedReady = false;

  async initialize() {
    try {
      console.log('Initializing AppLovin MAX SDK...');
      
      await AppLovinMAX.initialize('YOUR_SDK_KEY');
      
      // Set user consent (GDPR/CCPA)
      AppLovinMAX.setHasUserConsent(true);
      AppLovinMAX.setIsAgeRestrictedUser(false);
      
      // Load interstitial
      this.loadInterstitial();
      
      // Load rewarded
      this.loadRewarded();
      
      console.log('AppLovin initialized successfully');
    } catch (error) {
      console.error('AppLovin initialization failed:', error);
    }
  }

  // Interstitial Ads
  private loadInterstitial() {
    AppLovinMAX.loadInterstitial(AD_UNITS.interstitial.download);
    
    AppLovinMAX.addEventListener('OnInterstitialLoadedEvent', () => {
      console.log('Interstitial ad loaded');
      this.interstitialReady = true;
    });
    
    AppLovinMAX.addEventListener('OnInterstitialLoadFailedEvent', (error) => {
      console.error('Interstitial ad failed to load:', error);
      this.interstitialReady = false;
      // Retry after 30 seconds
      setTimeout(() => this.loadInterstitial(), 30000);
    });
    
    AppLovinMAX.addEventListener('OnInterstitialHiddenEvent', () => {
      console.log('Interstitial ad closed');
      this.loadInterstitial(); // Load next ad
    });
  }

  async showInterstitial(): Promise<void> {
    if (this.interstitialReady) {
      const isReady = await AppLovinMAX.isInterstitialReady(AD_UNITS.interstitial.download);
      if (isReady) {
        console.log('Showing interstitial ad');
        await AppLovinMAX.showInterstitial(AD_UNITS.interstitial.download);
      } else {
        console.log('Interstitial not ready, loading...');
        this.loadInterstitial();
      }
    } else {
      console.log('Interstitial not ready yet');
    }
  }

  // Rewarded Ads
  private loadRewarded() {
    AppLovinMAX.loadRewardedAd(AD_UNITS.rewarded.extract);
    
    AppLovinMAX.addEventListener('OnRewardedAdLoadedEvent', () => {
      console.log('Rewarded ad loaded');
      this.rewardedReady = true;
    });
    
    AppLovinMAX.addEventListener('OnRewardedAdLoadFailedEvent', (error) => {
      console.error('Rewarded ad failed to load:', error);
      this.rewardedReady = false;
      setTimeout(() => this.loadRewarded(), 30000);
    });
    
    AppLovinMAX.addEventListener('OnRewardedAdReceivedRewardEvent', (reward) => {
      console.log('User earned reward:', reward);
    });
    
    AppLovinMAX.addEventListener('OnRewardedAdHiddenEvent', () => {
      console.log('Rewarded ad closed');
      this.loadRewarded();
    });
  }

  async showRewarded(): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (this.rewardedReady) {
        const isReady = await AppLovinMAX.isRewardedAdReady(AD_UNITS.rewarded.extract);
        if (isReady) {
          console.log('Showing rewarded ad');
          
          const rewardListener = (reward: any) => {
            console.log('Reward received:', reward);
            AppLovinMAX.removeEventListener('OnRewardedAdReceivedRewardEvent', rewardListener);
            resolve(true);
          };
          
          AppLovinMAX.addEventListener('OnRewardedAdReceivedRewardEvent', rewardListener);
          await AppLovinMAX.showRewardedAd(AD_UNITS.rewarded.extract);
        } else {
          console.log('Rewarded ad not ready');
          resolve(false);
        }
      } else {
        console.log('Rewarded ad not loaded yet');
        resolve(false);
      }
    });
  }

  isRewardedReady(): boolean {
    return this.rewardedReady;
  }

  // Banner Ad Unit IDs
  getBannerAdUnit(screen: 'home' | 'quality' | 'download' | 'complete' | 'games'): string {
    return AD_UNITS.banner[screen];
  }
}

export const adManager = new AdManager();
```

### Step 4: Update Banner Component

**File: `components/BannerAd.tsx`**

Replace with AppLovin banner:

```typescript
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { AdView } from 'react-native-applovin-max';

type BannerAdProps = {
  adUnitId: string;
  size?: 'banner' | 'leader' | 'mrec';
};

export function BannerAd({ adUnitId, size = 'banner' }: BannerAdProps) {
  const [adHeight, setAdHeight] = useState(50);

  useEffect(() => {
    // Set height based on size
    if (size === 'banner') setAdHeight(50);
    else if (size === 'leader') setAdHeight(90);
    else if (size === 'mrec') setAdHeight(250);
  }, [size]);

  return (
    <View style={[styles.container, { height: adHeight }]}>
      <AdView
        adUnitId={adUnitId}
        adFormat={size === 'mrec' ? 'MREC' : 'BANNER'}
        style={styles.ad}
        onAdLoaded={() => console.log('✅ Banner ad loaded:', adUnitId)}
        onAdLoadFailed={(error) => console.error('❌ Banner ad failed:', error)}
        onAdClicked={() => console.log('Banner ad clicked')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ad: {
    width: '100%',
    height: '100%',
  },
});
```

### Step 5: Update All Screens

Update banner ad usage in all screens:

**Example: `app/index.tsx`**

Change from:
```typescript
<BannerAd 
  size="custom" 
  adUnitId="ca-app-pub-3940256099942544/6300978111"
/>
```

To:
```typescript
<BannerAd 
  size="banner" 
  adUnitId={adManager.getBannerAdUnit('home')}
/>
```

Apply similar changes to:
- `app/quality.tsx`
- `app/download.tsx`
- `app/complete.tsx`
- `app/preview.tsx`
- `games/screens/GamesHome.tsx`

---

## Configuration File

Create a new config file for easy management:

**File: `config/ads.ts`**

```typescript
export const ADS_CONFIG = {
  sdkKey: 'YOUR_APPLOVIN_SDK_KEY',
  
  banners: {
    home: 'YOUR_HOME_BANNER_ID',
    quality: 'YOUR_QUALITY_BANNER_ID',
    download: 'YOUR_DOWNLOAD_BANNER_ID',
    complete: 'YOUR_COMPLETE_BANNER_ID',
    games: 'YOUR_GAMES_BANNER_ID',
  },
  
  interstitials: {
    download: 'YOUR_DOWNLOAD_INTERSTITIAL_ID',
    quality: 'YOUR_QUALITY_INTERSTITIAL_ID',
  },
  
  rewarded: {
    extract: 'YOUR_EXTRACT_REWARDED_ID',
  },
  
  // Test mode
  testMode: __DEV__,
};
```

---

## Testing

### Test Mode

AppLovin provides test ads automatically in development mode.

### Test Checklist:

- [ ] Banner ads load on all screens
- [ ] Interstitial shows before download
- [ ] Rewarded ad shows before extraction
- [ ] Ads don't crash the app
- [ ] Proper error handling
- [ ] Ads reload after being shown

### Test Commands:

```bash
# Clear cache and rebuild
npx expo start -c

# Build for testing
eas build --platform android --profile preview
```

---

## Revenue Comparison

### Expected eCPM (Earnings per 1000 impressions):

| Ad Network | Play Store | Sideloaded | Alternative Stores |
|------------|-----------|------------|-------------------|
| AdMob | $2-5 | $0.50-1 | $0.50-1 |
| AppLovin | $3-7 | $2-4 | $2-5 |

### Estimated Monthly Revenue (10,000 active users):

**AdMob:**
- Play Store: $200-500
- Sideloaded: $50-100

**AppLovin:**
- Play Store: $300-700
- Sideloaded: $200-400
- Alternative Stores: $200-500

---

## Migration Checklist

- [ ] Create AppLovin account
- [ ] Create app in AppLovin dashboard
- [ ] Create all ad units
- [ ] Save SDK key and ad unit IDs
- [ ] Remove AdMob dependencies
- [ ] Install AppLovin SDK
- [ ] Update adManager.ts
- [ ] Update BannerAd component
- [ ] Update all screens with new ad units
- [ ] Test in development
- [ ] Build and test APK
- [ ] Monitor revenue in AppLovin dashboard

---

## Support & Resources

### AppLovin Resources:
- Dashboard: https://dash.applovin.com/
- Documentation: https://dash.applovin.com/documentation/mediation/react-native/getting-started
- Support: support@applovin.com

### Integration Help:
- React Native SDK: https://github.com/AppLovin/AppLovin-MAX-React-Native
- Sample App: https://github.com/AppLovin/AppLovin-MAX-React-Native/tree/master/example

---

*Last Updated: February 14, 2026*
*Migration Status: Ready to implement*
*Estimated Time: 2-3 hours*
