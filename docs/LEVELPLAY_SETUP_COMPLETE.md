# LevelPlay (ironSource) Integration Complete

## Overview
Successfully migrated from `react-native-unity-ads` (incompatible) to `ironsource-mediation` SDK which supports Unity Ads through mediation.

## Why ironSource LevelPlay?
- Unity Ads does NOT have a standalone React Native SDK
- The `react-native-unity-ads` package is outdated and uses deprecated Gradle syntax (`compile()` instead of `implementation()`)
- ironSource LevelPlay is Unity's official mediation platform for React Native
- Supports Unity Ads + multiple other ad networks through mediation

## Installation
```bash
npm install ironsource-mediation@^3.2.0
```

## Configuration

### Placement IDs (from your ironSource dashboard)
- **Bottom Screen Banner**: `s9v9hfkefzda26ut`
- **Preview/Download Banner**: `8qln6wmtxc5tzhhi`
- **Interstitial**: `ocllxnulp749s32x`
- **Rewarded**: `1c6x1u5pidvv5h8d`

### Required: Get Your ironSource App Key
You need to get your ironSource App Key from the ironSource dashboard:

1. Go to https://platform.ironsrc.com/
2. Navigate to your app
3. Copy the App Key
4. Update `services/levelPlayAdsManager.ts`:
   ```typescript
   const APP_KEY = 'YOUR_IRONSOURCE_APP_KEY'; // Replace with actual key
   ```

## Implementation

### Files Created/Updated

1. **services/levelPlayAdsManager.ts** - Main ads manager
   - Initializes LevelPlay SDK
   - Manages ad lifecycle
   - Contains placement IDs

2. **components/LevelPlayBannerAd.tsx** - Banner ad component
   - Displays banner ads
   - Handles ad events
   - Auto-cleanup on unmount

3. **app/_layout.tsx** - Initialize ads on app start
   ```typescript
   await levelPlayAdsManager.initialize();
   ```

4. **app/index.tsx** - Home screen with banner
   - Banner at bottom: `PLACEMENT_IDS.BANNER_BOTTOM`
   - Rewarded ad (TODO): `PLACEMENT_IDS.REWARDED`

5. **app/download.tsx** - Download screen with ads
   - Banner at bottom: `PLACEMENT_IDS.BANNER_PREVIEW`
   - Interstitial ad (TODO): `PLACEMENT_IDS.INTERSTITIAL`

## Android Configuration Required

Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-ads-identifier:18.0.1'
    implementation 'com.google.android.gms:play-services-basement:18.3.0'
    implementation 'com.google.android.gms:play-services-appset:16.0.2'
    implementation 'com.unity3d.ads-mediation:adquality-sdk:7.24.1'
}
```

Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="com.google.android.gms.permission.AD_ID"/>
```

## iOS Configuration Required

Add to `Info.plist`:
```xml
<!-- SKAdNetwork for ironSource -->
<key>SKAdNetworkItems</key>
<array>
   <dict>
      <key>SKAdNetworkIdentifier</key>
      <string>su67r6k2v3.skadnetwork</string>
   </dict>
</array>

<!-- Universal SKAN Reporting -->
<key>NSAdvertisingAttributionReportEndpoint</key>
<string>https://postbacks-is.com</string>

<!-- App Transport Security -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

Add to `ios/Podfile`:
```ruby
pod 'IronSourceAdQualitySDK','7.24.1'
```

## Next Steps

1. **Get ironSource App Key**
   - Login to ironSource dashboard
   - Get your App Key
   - Update `services/levelPlayAdsManager.ts`

2. **Run prebuild** (if using Expo)
   ```bash
   npx expo prebuild --clean
   ```

3. **Test Integration**
   - Enable test mode: `levelPlayAdsManager.enableTestMode()`
   - Launch test suite: `levelPlayAdsManager.launchTestSuite()`

4. **Implement Interstitial & Rewarded Ads**
   - Currently marked as TODO in the code
   - Need to implement using ironSource APIs
   - See: https://docs.unity.com/grow/levelplay/sdk/react/

5. **Build and Test**
   ```bash
   eas build --platform android --profile preview
   ```

## Unity Ads Mediation Setup

Your Unity Ads (Game ID: 6049201) will work through ironSource mediation:

1. In ironSource dashboard, add Unity Ads as a mediated network
2. Enter your Unity Game ID: `6049201`
3. Map your Unity placement IDs to ironSource placements
4. Unity Ads will serve through ironSource SDK

## Documentation
- ironSource React Native: https://docs.unity.com/grow/levelplay/sdk/react/
- Unity Ads Integration: https://docs.unity.com/grow/levelplay/sdk/react/networks/guides/unity-ads

## Notes
- Banner ads are implemented and ready
- Interstitial and Rewarded ads need implementation (marked as TODO)
- Test mode available for debugging
- Supports both Android and iOS
