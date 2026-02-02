# 🚀 SuperApp - Professional Media Downloader

**A premium, production-ready mobile application for downloading videos and audio from multiple platforms.**

[![Expo](https://img.shields.io/badge/Expo-52.0-blue.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.76-green.svg)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📱 Quick Demo

```
Home Screen → Paste URL → Preview Media → Select Quality → Download → Complete!
```

**Supported Platforms**: YouTube • Instagram • Facebook • Twitter • Vimeo • Direct Links

## Features

✅ **Multi-Platform Support**
- YouTube
- Instagram
- Facebook
- Twitter / X
- Vimeo
- Direct media links

✅ **Quality Selection**
- Multiple video qualities (144p to 4K)
- Audio-only downloads
- Multiple format support (MP4, WebM, MP3, M4A)

✅ **Premium UI/UX**
- Dark & Light mode
- Smooth animations
- Professional design
- Intuitive navigation

✅ **Smart Features**
- Auto-detect clipboard links
- Platform auto-detection
- Progress tracking
- Media library integration

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Router**: Expo Router
- **State Management**: React Context
- **Storage**: AsyncStorage
- **File System**: Expo FileSystem
- **Media**: Expo MediaLibrary

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npx expo start
```

3. Run on Android:
```bash
npx expo start --android
```

4. Run on iOS:
```bash
npx expo start --ios
```

## Building for Production

### Android (APK)
```bash
eas build --platform android --profile preview
```

### Android (AAB for Play Store)
```bash
eas build --platform android --profile production
```

### iOS
```bash
eas build --platform ios --profile production
```

## Project Structure

```
SuperApp/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home screen
│   ├── preview.tsx        # Media preview
│   ├── quality.tsx        # Quality selection
│   ├── download.tsx       # Download progress
│   ├── complete.tsx       # Download complete
│   └── settings.tsx       # Settings screen
├── components/            # Reusable components
│   ├── LinearGradient.tsx
│   └── PlatformIcon.tsx
├── contexts/              # React contexts
│   ├── ThemeContext.tsx
│   └── DownloadContext.tsx
├── services/              # Business logic
│   ├── mediaDownloader.ts
│   └── mediaExtractor.ts
├── utils/                 # Utility functions
│   └── urlParser.ts
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

## Key Features Implementation

### URL Detection
The app automatically detects and validates URLs from:
- Manual input
- Clipboard paste
- Supported platforms

### Media Extraction
Platform-specific extractors fetch:
- Video metadata
- Available qualities
- Thumbnail images
- Duration information

### Download Management
- Real-time progress tracking
- Pause/resume capability
- Automatic media library integration
- Error handling and retry logic

### Theme System
- System-aware theme detection
- Manual theme toggle
- Persistent theme preference
- Smooth theme transitions

## Permissions

The app requires the following permissions:
- **Internet**: Download media files
- **Media Library**: Save downloaded files
- **Storage**: Temporary file storage

## Legal Notice

This app is designed for downloading content from sources where you have the legal right to do so. Users are responsible for ensuring they comply with copyright laws and terms of service of the platforms they download from.

## Privacy

SuperApp does not collect, store, or transmit any personal data. All downloads are processed locally on your device.

## Support

For issues or feature requests, please contact support or open an issue on the repository.

## License

© 2026 SuperApp. All rights reserved.
