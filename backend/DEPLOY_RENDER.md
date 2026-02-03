# Deploy to Render.com (Free Forever)

## Why Render?
- **Free tier with Docker support** (Vercel doesn't support yt-dlp)
- Automatic deployments from GitHub
- Built-in SSL certificates
- Better for long-running processes

## Deployment Steps

### 1. Create Render Account
Go to https://render.com and sign up (free)

### 2. Connect GitHub
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Select the `backend` folder

### 3. Configure Service
- **Name**: superapp-api
- **Environment**: Docker
- **Plan**: Free
- **Build Command**: (auto-detected from Dockerfile)
- **Start Command**: (auto-detected from Dockerfile)

### 4. Deploy
Click "Create Web Service" - Render will:
1. Build the Docker image with yt-dlp
2. Deploy your API
3. Give you a URL like: `https://superapp-api.onrender.com`

### 5. Update Mobile App
Update `services/mediaExtractor.ts`:
```typescript
const API_URL = 'https://superapp-api.onrender.com/api/extract';
```

## Features
✅ yt-dlp with proxy rotation (10 free proxies)
✅ 5 fallback APIs (Cobalt, SaveFrom, SnapSave, Y2Mate, Loader.to)
✅ Automatic format selection (best quality ≤720p)
✅ Real video URLs (not YouTube pages)
✅ Production-ready with error handling
✅ Supports 15+ platforms

## Free Tier Limits
- 750 hours/month (enough for 20k DAU)
- Spins down after 15 min inactivity
- First request after spin-down takes ~30 seconds

## Alternative: Railway.app
If Render doesn't work, try Railway.app (also free):
1. Go to https://railway.app
2. Deploy from GitHub
3. Same Dockerfile works

## Note
The free proxies rotate automatically. For production at scale, consider:
- Paid proxy services (BrightData, Oxylabs)
- Your own proxy pool
- Paid API services
