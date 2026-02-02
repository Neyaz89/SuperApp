# SuperApp - Command Reference

Complete reference for all commands and scripts.

## 📦 Installation

### Initial Setup
```bash
# Install dependencies
npm install

# Or using Windows batch script
install.bat
```

### Update Dependencies
```bash
# Update all packages
npm update

# Update specific package
npm update expo

# Check for outdated packages
npm outdated
```

## 🚀 Development

### Start Development Server
```bash
# Start Expo development server
npx expo start

# Or using Windows batch script
start.bat

# Start with cache cleared
npx expo start -c

# Start on specific port
npx expo start --port 8082

# Start in LAN mode
npx expo start --lan

# Start in tunnel mode
npx expo start --tunnel
```

### Run on Devices
```bash
# Run on Android device/emulator
npx expo start --android

# Run on iOS device/simulator (macOS only)
npx expo start --ios

# Run on web browser
npx expo start --web
```

### Development Tools
```bash
# Open developer menu on device
# Shake device or press:
# - Android: Cmd+M or Ctrl+M
# - iOS: Cmd+D

# Reload app
# Press 'r' in terminal

# Open DevTools
# Press 'd' in terminal
```

## 🔨 Building

### EAS Build Setup
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Configure EAS for your project
eas build:configure
```

### Android Builds
```bash
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production

# Build with specific profile
eas build --platform android --profile development

# Build locally (requires Android SDK)
eas build --platform android --local
```

### iOS Builds
```bash
# Build for App Store
eas build --platform ios --profile production

# Build for TestFlight
eas build --platform ios --profile preview

# Build for simulator
eas build --platform ios --profile development
```

### Build Management
```bash
# List all builds
eas build:list

# View build details
eas build:view [BUILD_ID]

# Cancel build
eas build:cancel [BUILD_ID]

# Clear build cache
eas build --clear-cache
```

## 📱 Submission

### Android Submission
```bash
# Submit to Google Play
eas submit --platform android

# Submit specific build
eas submit --platform android --id [BUILD_ID]

# Submit with service account
eas submit --platform android --service-account-key-path ./key.json
```

### iOS Submission
```bash
# Submit to App Store
eas submit --platform ios

# Submit specific build
eas submit --platform ios --id [BUILD_ID]
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- path/to/test.ts
```

### Type Checking
```bash
# Check TypeScript types
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

### Linting
```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

## 🔍 Debugging

### Expo Doctor
```bash
# Check for common issues
npx expo doctor

# Fix issues automatically
npx expo doctor --fix-dependencies
```

### Clear Cache
```bash
# Clear Expo cache
npx expo start -c

# Clear npm cache
npm cache clean --force

# Clear watchman cache (macOS/Linux)
watchman watch-del-all

# Clear Metro bundler cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
```

### Reset Project
```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Remove and reinstall with cache clear
rm -rf node_modules
npm cache clean --force
npm install
```

## 📊 Analytics & Monitoring

### View Logs
```bash
# View Android logs
npx expo start --android
# Then press 'a' to open Android logs

# View iOS logs
npx expo start --ios
# Then press 'i' to open iOS logs

# View all logs
npx expo start --dev-client
```

### Performance Profiling
```bash
# Enable performance monitor
# In app: Shake device → Performance Monitor

# React DevTools
npm install -g react-devtools
react-devtools
```

## 🔧 Maintenance

### Update Expo SDK
```bash
# Update to latest Expo SDK
npx expo upgrade

# Update to specific version
npx expo upgrade 52.0.0
```

### Manage Dependencies
```bash
# Add new dependency
npm install package-name

# Add dev dependency
npm install --save-dev package-name

# Remove dependency
npm uninstall package-name

# List installed packages
npm list

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Clean Project
```bash
# Remove build artifacts
rm -rf .expo
rm -rf dist
rm -rf build

# Full clean
rm -rf node_modules
rm -rf .expo
rm -rf dist
npm install
```

## 🌐 Environment Management

### Environment Variables
```bash
# Create .env file
echo "API_KEY=your-key" > .env

# Load environment variables
# Automatically loaded by react-native-dotenv
```

### Multiple Environments
```bash
# Development
npx expo start

# Staging
npx expo start --config app.staging.json

# Production
npx expo start --config app.production.json
```

## 📦 Package Scripts

### Available Scripts
```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web

# Run tests
npm test

# Build for production
npm run build
```

### Custom Scripts
Add to `package.json`:
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios",
    "clean": "rm -rf node_modules .expo dist"
  }
}
```

## 🔐 Credentials Management

### EAS Credentials
```bash
# List credentials
eas credentials

# Configure Android credentials
eas credentials --platform android

# Configure iOS credentials
eas credentials --platform ios

# Remove credentials
eas credentials:remove
```

## 📱 Device Management

### iOS Devices
```bash
# List iOS devices
eas device:list

# Register iOS device
eas device:create

# View device details
eas device:view [DEVICE_ID]
```

### Android Devices
```bash
# List connected Android devices
adb devices

# Install APK on device
adb install path/to/app.apk

# Uninstall app
adb uninstall com.superapp.media

# View device logs
adb logcat
```

## 🚀 Deployment

### Pre-deployment
```bash
# Check for issues
npx expo doctor

# Run tests
npm test

# Type check
npx tsc --noEmit

# Build production version
eas build --platform android --profile production
```

### Post-deployment
```bash
# Monitor crashes
# Use Sentry or Firebase Crashlytics

# Track analytics
# Use Firebase Analytics or similar

# Monitor performance
# Use Firebase Performance or similar
```

## 🔄 Version Management

### Update Version
```bash
# Update version in app.json
# Manually edit: "version": "1.0.1"

# Update version in package.json
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
```

### Git Tags
```bash
# Create version tag
git tag -a v1.0.0 -m "Version 1.0.0"

# Push tags
git push --tags

# List tags
git tag -l
```

## 🐛 Troubleshooting Commands

### Common Issues

**Metro bundler issues:**
```bash
npx expo start -c
```

**Port conflicts:**
```bash
npx expo start --port 8082
```

**Dependency issues:**
```bash
rm -rf node_modules
npm install
```

**Build failures:**
```bash
eas build --clear-cache --platform android
```

**Simulator issues:**
```bash
# iOS
xcrun simctl erase all

# Android
adb kill-server
adb start-server
```

## 📚 Documentation Commands

### Generate Documentation
```bash
# Generate TypeScript documentation
npx typedoc --out docs src

# Generate API documentation
npx jsdoc -c jsdoc.json
```

## 🔍 Search & Find

### Find in Project
```bash
# Find text in files
grep -r "search term" .

# Find files by name
find . -name "*.tsx"

# Find and replace
find . -name "*.tsx" -exec sed -i 's/old/new/g' {} +
```

## 💾 Backup & Restore

### Backup
```bash
# Backup project
tar -czf superapp-backup.tar.gz .

# Backup specific folders
tar -czf superapp-src.tar.gz app components services
```

### Restore
```bash
# Restore from backup
tar -xzf superapp-backup.tar.gz
npm install
```

## 🎯 Quick Reference

### Most Used Commands
```bash
# Development
npx expo start              # Start dev server
npx expo start --android    # Run on Android
npx expo start -c           # Clear cache

# Building
eas build --platform android --profile production
eas build --platform ios --profile production

# Maintenance
npm install                 # Install dependencies
npm update                  # Update packages
npx expo doctor            # Check for issues

# Debugging
npx expo start -c          # Clear cache
rm -rf node_modules        # Clean install
npm install
```

## 📞 Help Commands

### Get Help
```bash
# Expo help
npx expo --help

# EAS help
eas --help

# Specific command help
npx expo start --help
eas build --help

# Version info
npx expo --version
eas --version
node --version
npm --version
```

## 🔗 Useful Aliases

Add to your shell profile (`.bashrc`, `.zshrc`, etc.):
```bash
# Expo aliases
alias es="npx expo start"
alias esc="npx expo start -c"
alias ea="npx expo start --android"
alias ei="npx expo start --ios"

# EAS aliases
alias eb="eas build"
alias eba="eas build --platform android"
alias ebi="eas build --platform ios"

# npm aliases
alias ni="npm install"
alias nu="npm update"
alias nt="npm test"
```

---

## 📝 Notes

- All commands assume you're in the project root directory
- Some commands require specific tools installed (Android SDK, Xcode, etc.)
- Replace `[BUILD_ID]` and `[DEVICE_ID]` with actual IDs
- Windows users: Use `install.bat` and `start.bat` for convenience

---

**Need more help?** Check the [documentation](README.md) or run `npx expo --help`

---

Last Updated: February 2, 2026
