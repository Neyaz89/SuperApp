# SuperApp - Quick Start Guide

Get your app running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- A smartphone with Expo Go app installed

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including Expo, React Native, and TypeScript.

## Step 2: Start Development Server

```bash
npx expo start
```

You'll see a QR code in your terminal.

## Step 3: Run on Your Device

### Option A: Using Expo Go (Easiest)

1. Install **Expo Go** from:
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android)
   - [App Store](https://apps.apple.com/app/expo-go/id982107779) (iOS)

2. Scan the QR code:
   - **Android**: Use Expo Go app
   - **iOS**: Use Camera app, then open in Expo Go

3. Wait for the app to load

### Option B: Using Emulator

**Android:**
```bash
npx expo start --android
```

**iOS (macOS only):**
```bash
npx expo start --ios
```

## Step 4: Test the App

1. **Home Screen**: Paste a video URL
2. **Preview**: View media information
3. **Quality**: Select download quality
4. **Download**: Watch progress
5. **Complete**: Share or download another

## Common Issues

### "Metro bundler not starting"
```bash
npx expo start -c
```

### "Dependencies not found"
```bash
rm -rf node_modules
npm install
```

### "Port already in use"
```bash
npx expo start --port 8082
```

## Next Steps

- Read [SETUP.md](SETUP.md) for production deployment
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for code structure
- Customize theme colors in `contexts/ThemeContext.tsx`
- Add your own app icons in `assets/` folder

## Development Tips

### Hot Reload
- Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
- Select "Enable Fast Refresh"

### Debug Menu
- Shake device to open developer menu
- Enable "Debug Remote JS" for debugging

### Clear Cache
```bash
npx expo start -c
```

## File Structure Overview

```
app/          → Screens (pages)
components/   → Reusable UI components
contexts/     → Global state management
services/     → Business logic
utils/        → Helper functions
```

## Making Changes

### Change App Name
Edit `app.json`:
```json
{
  "expo": {
    "name": "Your App Name"
  }
}
```

### Change Theme Colors
Edit `contexts/ThemeContext.tsx`:
```typescript
const lightTheme = {
  primary: '#007AFF',  // Change this
  // ...
};
```

### Add New Screen
1. Create file in `app/` folder: `app/newscreen.tsx`
2. Navigate to it: `router.push('/newscreen')`

## Building for Production

### Android APK
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

### Play Store AAB
```bash
eas build --platform android --profile production
```

## Support

- **Documentation**: Check README.md
- **Issues**: Review error messages carefully
- **Expo Docs**: https://docs.expo.dev

## Quick Commands Reference

```bash
# Start development
npx expo start

# Start with cache clear
npx expo start -c

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios

# Install new package
npm install package-name

# Build for Android
eas build --platform android

# Check for issues
npx expo doctor
```

## Success Checklist

- [ ] Dependencies installed
- [ ] Development server running
- [ ] App loads on device/emulator
- [ ] Can paste URL
- [ ] Can navigate between screens
- [ ] Theme switching works
- [ ] Settings accessible

## What's Next?

1. **Customize Branding**
   - Replace app icons
   - Update splash screen
   - Change color scheme

2. **Add Features**
   - Implement real API integration
   - Add more platforms
   - Enhance UI animations

3. **Prepare for Launch**
   - Create app store assets
   - Write privacy policy
   - Set up AdMob account
   - Test on multiple devices

4. **Deploy**
   - Build production version
   - Submit to Play Store
   - Monitor user feedback

---

**Congratulations!** 🎉 You now have a fully functional media downloader app running on your device.

For detailed setup and deployment instructions, see [SETUP.md](SETUP.md).
