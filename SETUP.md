# SuperApp - Setup & Deployment Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI for production builds (`npm install -g eas-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Asset Files

Create the following image files in the `assets/` directory:

- **icon.png** (1024x1024): App icon
- **adaptive-icon.png** (1024x1024): Android adaptive icon
- **splash.png** (1284x2778): Splash screen
- **favicon.png** (48x48): Web favicon

You can use placeholder images for development or create professional assets using design tools.

### 3. Configure App Identifiers

Update `app.json`:
- Change `expo.name` to your app name
- Change `expo.slug` to your app slug
- Update `expo.ios.bundleIdentifier`
- Update `expo.android.package`

## Development

### Start Development Server

```bash
npx expo start
```

### Run on Android

```bash
npx expo start --android
```

### Run on iOS

```bash
npx expo start --ios
```

### Run on Web

```bash
npx expo start --web
```

## Production Build

### Setup EAS

1. Create an Expo account at https://expo.dev
2. Login to EAS:
```bash
eas login
```

3. Configure your project:
```bash
eas build:configure
```

### Build for Android

**APK (for testing):**
```bash
eas build --platform android --profile preview
```

**AAB (for Play Store):**
```bash
eas build --platform android --profile production
```

### Build for iOS

```bash
eas build --platform ios --profile production
```

## Google Play Store Submission

### 1. Prepare Store Listing

- App name: SuperApp (or your chosen name)
- Short description (80 chars)
- Full description (4000 chars)
- Screenshots (at least 2, up to 8)
- Feature graphic (1024x500)
- App icon (512x512)

### 2. Content Rating

Complete the content rating questionnaire in Play Console.

### 3. Privacy Policy

Create and host a privacy policy. Update the link in:
- Play Console
- App settings screen
- app.json

### 4. App Category

- Category: Video Players & Editors
- Tags: video downloader, media downloader, video saver

### 5. Pricing & Distribution

- Free app
- Select countries for distribution
- Confirm content guidelines compliance

## Monetization Setup

### Google AdMob Integration

1. Create AdMob account at https://admob.google.com
2. Create an app in AdMob
3. Create ad units:
   - Banner ad
   - Interstitial ad
   - Rewarded ad

4. Update ad unit IDs in `services/adManager.ts`:
```typescript
getBannerAdUnitId(): string {
  return Platform.select({
    ios: 'YOUR_IOS_BANNER_ID',
    android: 'YOUR_ANDROID_BANNER_ID',
  }) || '';
}
```

5. Add AdMob App ID to `app.json`:
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
      }
    },
    "ios": {
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
      }
    }
  }
}
```

## Environment Variables

Create `.env` file for sensitive data:

```env
ADMOB_ANDROID_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
ADMOB_IOS_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
API_BASE_URL=https://your-api.com
```

## Testing

### Test on Real Device

1. Install Expo Go app on your device
2. Scan QR code from `expo start`
3. Test all features thoroughly

### Test Ads

Use test ad unit IDs during development (already configured in code).

### Test Permissions

- Media library access
- Storage access
- Internet connectivity

## Performance Optimization

### 1. Image Optimization

- Compress all images
- Use appropriate resolutions
- Implement lazy loading

### 2. Code Splitting

- Use dynamic imports where possible
- Optimize bundle size

### 3. Caching

- Implement proper caching strategies
- Clear cache periodically

## Security Considerations

### 1. API Security

- Use HTTPS only
- Implement rate limiting
- Validate all inputs

### 2. Data Privacy

- Don't collect unnecessary data
- Implement proper data encryption
- Follow GDPR/CCPA guidelines

### 3. Content Compliance

- Respect copyright laws
- Implement content filtering
- Add user agreements

## Troubleshooting

### Build Failures

```bash
# Clear cache
expo start -c

# Clear node modules
rm -rf node_modules
npm install

# Clear Expo cache
expo prebuild --clean
```

### Permission Issues

Ensure all permissions are declared in `app.json` and requested at runtime.

### Ad Issues

- Verify ad unit IDs
- Check AdMob account status
- Test with test ad units first

## Maintenance

### Regular Updates

- Update dependencies monthly
- Test on latest Android/iOS versions
- Monitor crash reports
- Respond to user feedback

### Analytics

Consider integrating:
- Firebase Analytics
- Sentry for error tracking
- Custom analytics dashboard

## Legal Requirements

### 1. Terms of Service

Create and display terms of service covering:
- Acceptable use
- Content ownership
- Liability limitations

### 2. Privacy Policy

Must include:
- Data collection practices
- Third-party services (ads)
- User rights
- Contact information

### 3. Copyright Compliance

- Add DMCA compliance
- Implement content reporting
- Respect platform ToS

## Support

For issues or questions:
- Check documentation
- Review GitHub issues
- Contact support team

## Version History

- v1.0.0 (2026-02-02): Initial release
  - Multi-platform support
  - Quality selection
  - Dark/light mode
  - Ad integration

## Next Steps

After successful deployment:
1. Monitor user feedback
2. Track analytics
3. Plan feature updates
4. Optimize performance
5. Expand platform support

---

**Important**: This app is designed for downloading content where users have legal rights. Ensure compliance with all applicable laws and platform terms of service.
