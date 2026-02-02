# SuperApp - Universal Media Downloader

A professional mobile app for downloading videos and audio from multiple platforms.

## Features
- 🎥 Download from YouTube, Instagram, Facebook, Twitter, Vimeo
- 🎵 Extract audio in multiple formats
- 📱 Clean, modern UI with dark/light themes
- ⚡ Fast and reliable extraction
- 🆓 100% Free

## Tech Stack
- **Frontend**: React Native + Expo SDK 54
- **Backend**: Node.js serverless functions on Vercel
- **Language**: TypeScript

## Quick Start

### Mobile App
```bash
npm install --legacy-peer-deps
npx expo start
```

Scan QR code with Expo Go or build development build:
```bash
eas build --profile development --platform android
```

### Backend API
```bash
cd backend
npm install
vercel
```

## Project Structure
```
├── app/              # Expo Router screens
├── components/       # Reusable UI components
├── contexts/         # React Context (theme, download state)
├── services/         # API clients and business logic
├── utils/            # Helper functions
└── backend/          # Vercel serverless API
    └── api/          # API endpoints
```

## API Endpoint
- **URL**: https://super-app-blue-pi.vercel.app/api/extract
- **Method**: POST
- **Body**: `{ "url": "https://youtube.com/..." }`

## Deployment
See `backend/DEPLOY.md` for detailed deployment instructions.

## License
MIT

A professional media downloader mobile application.
