# Backend Deployment Guide

## Current Status
- **Platform**: Vercel
- **URL**: https://super-app-blue-pi.vercel.app
- **API Endpoint**: POST /api/extract

## Deploy to Vercel

### Option 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from backend folder:
```bash
cd backend
vercel
```

4. Follow prompts:
   - Set up and deploy? Yes
   - Which scope? Your account
   - Link to existing project? No (first time) or Yes (updates)
   - Project name: super-app-api (or your choice)
   - Directory: ./
   - Override settings? No

5. For production deployment:
```bash
vercel --prod
```

### Option 2: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository
3. Set root directory to `backend`
4. Click Deploy

## Update Mobile App

After deployment, update the API URL in `services/mediaExtractor.ts`:

```typescript
const API_URL = 'https://your-new-url.vercel.app/api/extract';
```

## Testing the API

Test with curl:
```bash
curl -X POST https://super-app-blue-pi.vercel.app/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## API Features

### Extraction Methods (in order):
1. **Cobalt API** - Supports YouTube, Instagram, Twitter, TikTok, Facebook
2. **AllTube** - YouTube only (fallback)
3. **Invidious** - YouTube only (fallback)

### Supported Platforms:
- YouTube (including Shorts)
- Instagram
- Facebook
- Twitter/X
- Vimeo
- TikTok

## Limitations

- Vercel serverless functions have 10-second timeout
- Some videos may fail due to platform restrictions
- Rate limiting may apply from third-party APIs

## Troubleshooting

### 404 Error
- Make sure `vercel.json` is in the backend folder
- Redeploy with `vercel --prod`

### Timeout Errors
- Video extraction can take time
- Mobile app has 15-second timeout with 3 retries
- Falls back to mock data if all attempts fail

### CORS Issues
- API has CORS enabled for all origins
- Check browser console for specific errors

## Free Forever?

Yes! Vercel free tier includes:
- 100GB bandwidth/month
- Unlimited API requests
- Serverless functions
- No credit card required

Perfect for starting out. Upgrade only when you need more bandwidth.
