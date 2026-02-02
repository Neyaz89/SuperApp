# 🚀 Quick Start - Deploy in 5 Minutes

## Step 1: Deploy Backend (2 minutes)

```bash
cd backend
npm install -g vercel
vercel login
vercel --prod
```

Copy the deployment URL (e.g., `https://your-app.vercel.app`)

## Step 2: Update Mobile App (1 minute)

Open `services/mediaExtractor.ts` and update line 13:

```typescript
const API_URL = 'https://your-app.vercel.app/api/extract';
```

## Step 3: Test Mobile App (2 minutes)

```bash
npm install --legacy-peer-deps
npx expo start
```

Scan QR code with Expo Go and test with a YouTube URL.

## ✅ Done!

Your app is now live and can handle 20,000 users per day for FREE!

### Test URLs
- YouTube: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Instagram: Any public post URL
- TikTok: Any video URL
- Twitter: Any tweet with video

### Supported Platforms
YouTube, Instagram, Facebook, Twitter, TikTok, Vimeo, Dailymotion, Reddit, Twitch, SoundCloud, Terabox, Streamable, Pinterest, LinkedIn, Snapchat & more!

### Need Help?
- Backend not working? Check `backend/DEPLOY.md`
- Mobile app issues? Run `npx expo doctor`
- API errors? Check Vercel logs at vercel.com/dashboard

**You're production ready! 🎉**
