# Ads Not Showing - Troubleshooting Guide 🎯

## Issue: Ads not showing in preview/production builds

### Root Cause
When you build with EAS, `__DEV__` is `false`, so the app tries to use real ad unit IDs instead of test ads. However, real ads won't show until:
1. AdMob verifies your app (24-48 hours)
2. Your app gets approved in AdMob console
3. Ad units are fully activated

### Solution Applied ✅

Added `USE_TEST_ADS` flag to force test ads in preview builds:

**Files Updated:**
- `services/adManager.ts` - Interstitial & Rewarded ads
- `components/BannerAd.tsx` - Banner ads

**What Changed:**
```typescript
// Before
const AD_UNIT_ID = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxx';

// After
const USE_TEST_ADS = true; // Manual control
const AD_UNIT_ID = USE_TEST_ADS || __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxx';
```

---

## How to Use

### Phase 1: Testing (Current)
**Status:** `USE_TEST_ADS = true`

- Test ads will show in all builds (dev, preview, production)
- Use this while testing app functionality
- Test ads are guaranteed to show

### Phase 2: AdMob Setup
1. Go to https://apps.admob.com/
2. Add your app:
   - App name: SuperHub
   - Platform: Android
   - Package name: `com.superhub.media`
3. Create ad units (if not already created):
   - Banner ad unit
   - Interstitial ad unit
   - Rewarded ad unit
4. Wait 24-48 hours for verification

### Phase 3: Production (After AdMob Approval)
**Status:** `USE_TEST_ADS = false`

1. Open `services/adManager.ts`
2. Change: `const USE_TEST_ADS = false;`
3. Open `components/BannerAd.tsx`
4. Change: `const USE_TEST_ADS = false;`
5. Rebuild with EAS
6. Real ads will now show

---

## Why Ads Don't Show (Common Reasons)

### 1. New Ad Units (Most Common)
**Problem:** Ad units created less than 24 hours ago  
**Solution:** Wait 24-48 hours for Google to activate them  
**Status:** Check AdMob console for "Ready to serve ads"

### 2. App Not Verified
**Problem:** AdMob hasn't verified your app yet  
**Solution:** 
- Submit app to Play Store (or alternative stores)
- Add app in AdMob console
- Wait for verification email

### 3. Low Fill Rate
**Problem:** No ads available for your region/device  
**Solution:**
- Test from different locations
- Try different devices
- Enable mediation in AdMob (add more ad networks)

### 4. Ad Request Limits
**Problem:** Too many ad requests in short time  
**Solution:**
- Don't spam ad requests
- Implement proper ad loading intervals
- Use ad caching (already implemented)

### 5. Invalid Traffic
**Problem:** Google detected suspicious activity  
**Solution:**
- Don't click your own ads
- Don't ask others to click ads
- Use test ads during development

### 6. App Not Published
**Problem:** App not available on any store  
**Solution:**
- Publish to at least one store (Play Store, Amazon, etc.)
- Or use "App not published" option in AdMob

### 7. Payment Info Missing
**Problem:** AdMob account not fully set up  
**Solution:**
- Complete AdMob account setup
- Add payment information
- Verify tax information

---

## Testing Checklist

### ✅ Test Ads (Current Setup)
- [x] Banner ads show on home screen
- [x] Banner ads show on preview screen
- [x] Banner ads show on quality screen
- [x] Banner ads show on complete screen
- [x] Banner ads show in games
- [x] Interstitial ads show before games
- [x] Interstitial ads show after games
- [x] Interstitial ads show before HTML5 games

### ⏳ Real Ads (After AdMob Approval)
- [ ] Set `USE_TEST_ADS = false`
- [ ] Rebuild app
- [ ] Test on real device
- [ ] Verify ads show
- [ ] Check AdMob dashboard for impressions
- [ ] Monitor revenue

---

## AdMob Console Setup

### Step 1: Add Your App
1. Go to https://apps.admob.com/
2. Click "Apps" → "Add App"
3. Select "Android"
4. Choose "No" for "Is your app listed on Google Play?"
5. Enter app name: "SuperHub"
6. Enter package name: `com.superhub.media`
7. Click "Add"

### Step 2: Create Ad Units (If Not Created)

**Banner Ad Unit:**
1. Click "Ad units" → "Add ad unit"
2. Select "Banner"
3. Name: "SuperHub Banner"
4. Click "Create ad unit"
5. Copy ad unit ID: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`

**Interstitial Ad Unit:**
1. Click "Ad units" → "Add ad unit"
2. Select "Interstitial"
3. Name: "SuperHub Interstitial"
4. Click "Create ad unit"
5. Copy ad unit ID

**Rewarded Ad Unit:**
1. Click "Ad units" → "Add ad unit"
2. Select "Rewarded"
3. Name: "SuperHub Rewarded"
4. Click "Create ad unit"
5. Copy ad unit ID

### Step 3: Update Ad Unit IDs

Replace in `services/adManager.ts`:
```typescript
const INTERSTITIAL_AD_UNIT_ID = USE_TEST_ADS || __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-YOUR-ACTUAL-ID/XXXXXXXXXX'; // Replace this
```

Replace in `components/BannerAd.tsx`:
```typescript
const AD_UNIT_IDS = {
  homepage: USE_TEST_ADS || __DEV__ 
    ? TestIds.BANNER 
    : 'ca-app-pub-YOUR-ACTUAL-ID/XXXXXXXXXX', // Replace this
  preview: USE_TEST_ADS || __DEV__
    ? TestIds.BANNER
    : 'ca-app-pub-YOUR-ACTUAL-ID/XXXXXXXXXX', // Replace this
};
```

### Step 4: App Settings
1. Go to "App settings"
2. Enable "App-level ad settings"
3. Set "Store listing" (if published)
4. Add privacy policy URL
5. Enable "COPPA" if targeting children
6. Save changes

---

## Monitoring Ads

### Check Logs
Look for these console logs:
```
🎯 Banner Ad - Unit ID: ca-app-pub-3940256099942544/6300978111
🎯 Banner Ad - Size: banner
🎯 Banner Ad - Dev Mode: false
🎯 Banner Ad - Using Test Ads: true
✅ Banner ad loaded successfully
```

### Check AdMob Dashboard
1. Go to https://apps.admob.com/
2. Click "Reports"
3. Check metrics:
   - Impressions (ad views)
   - Clicks
   - Estimated earnings
   - Fill rate

### Common Log Messages

**Success:**
```
✅ Banner ad loaded successfully
Interstitial ad loaded
Rewarded ad loaded
```

**Errors:**
```
❌ Banner ad failed to load: No fill
❌ Banner ad failed to load: Network error
❌ Banner ad failed to load: Invalid ad unit ID
```

---

## Ad Revenue Expectations

### Test Ads (Current)
- **Revenue:** $0 (test ads don't generate revenue)
- **Purpose:** Testing functionality only
- **Fill rate:** 100% (always available)

### Real Ads (After Approval)
- **Revenue:** Based on impressions and clicks
- **CPM:** $1-5 (varies by region)
- **Fill rate:** 60-90% (varies)
- **Expected:** $3,150/month with 20K DAU (see REVENUE_CALCULATION.md)

---

## Timeline

### Day 1: App Submission
- Build app with `USE_TEST_ADS = true`
- Test thoroughly
- Submit to stores

### Day 2-3: AdMob Setup
- Add app in AdMob console
- Create ad units (if needed)
- Wait for verification

### Day 3-5: Store Approval
- Wait for store approval
- App goes live

### Day 5-7: Switch to Real Ads
- Set `USE_TEST_ADS = false`
- Rebuild and update app
- Monitor AdMob dashboard

### Day 7+: Optimization
- Analyze ad performance
- Adjust ad placements
- Enable mediation
- Optimize revenue

---

## Important Rules

### ❌ DON'T:
1. Click your own ads (account ban)
2. Ask friends/family to click ads (invalid traffic)
3. Use real ads during development (policy violation)
4. Spam ad requests (low fill rate)
5. Hide ad disclosure (policy violation)

### ✅ DO:
1. Use test ads during development
2. Wait 24-48 hours after creating ad units
3. Complete AdMob account setup
4. Add privacy policy
5. Follow AdMob policies
6. Monitor ad performance
7. Respond to policy violations quickly

---

## Quick Fix Commands

### Rebuild with Test Ads
```bash
# Make sure USE_TEST_ADS = true in both files
eas build --profile preview --platform android --clear-cache
```

### Switch to Real Ads
```bash
# 1. Change USE_TEST_ADS = false in:
#    - services/adManager.ts
#    - components/BannerAd.tsx
# 2. Rebuild
eas build --profile production --platform android
```

---

## Support

### AdMob Support
- Help Center: https://support.google.com/admob
- Community: https://groups.google.com/g/google-admob-ads-sdk
- Policy Center: https://support.google.com/admob/answer/6128543

### Common Issues
- **No fill:** Normal for new apps, improves over time
- **Low revenue:** Optimize ad placements, enable mediation
- **Account suspended:** Review policy violations, appeal if needed

---

## Current Status

✅ **Test ads enabled** - Ads will show in all builds  
⏳ **Waiting for AdMob approval** - 24-48 hours  
📝 **Next step:** Set `USE_TEST_ADS = false` after approval

---

## Summary

Your ads are now configured to show test ads in preview builds. This ensures:
1. You can test ad functionality
2. Ads always show (100% fill rate)
3. No policy violations
4. Easy switch to real ads later

Once your app is approved by AdMob (24-48 hours), simply change `USE_TEST_ADS = false` and rebuild!
