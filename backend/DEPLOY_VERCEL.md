# Deploy to Vercel - Better IP Reputation

## Why Vercel Might Work Better

**Vercel advantages over Render:**
- ✅ Better IP reputation (not datacenter IPs)
- ✅ Edge network (distributed globally)
- ✅ Less likely to be blocked by Cloudflare
- ✅ Free tier with good limits
- ✅ Faster cold starts

**Potential for:**
- ✅ Terabox might work
- ✅ YouTube might work
- ✅ Better success rates overall

## Prerequisites

1. GitHub account (you have this)
2. Vercel account (free) - https://vercel.com/signup
3. Your backend code pushed to GitHub

## Step 1: Prepare Backend for Vercel

Your backend is already configured! Files ready:
- ✅ `vercel.json` - Routing configuration
- ✅ `api/index.js` - Main API endpoint
- ✅ `api/extract.js` - Extraction logic
- ✅ `package.json` - Dependencies

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click "Add New" → "Project"

2. **Import Your Repository**
   - Select your GitHub repository
   - Choose the `backend` folder as root directory

3. **Configure Project**
   - **Framework Preset:** Other
   - **Root Directory:** `backend`
   - **Build Command:** (leave empty)
   - **Output Directory:** (leave empty)
   - **Install Command:** `npm install`

4. **Add Environment Variables** (if needed)
   - `TERABOX_COOKIE` (optional)
   - `NODE_ENV=production`

5. **Deploy**
   - Click "Deploy"
   - Wait 1-2 minutes
   - Get your URL: `https://your-project.vercel.app`

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to backend folder
cd backend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? superapp-api
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

## Step 3: Test Terabox on Vercel

After deployment, test with:

```bash
# Replace YOUR-VERCEL-URL with your actual URL
curl -X POST https://YOUR-VERCEL-URL/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://teraboxapp.com/s/1PDAUak5v6Ai3o6iTp8k_Ow"}'
```

**Expected outcomes:**

**If it works (🎉):**
```json
{
  "title": "Video Name",
  "qualities": [...],
  "platform": "terabox"
}
```

**If it still fails:**
```json
{
  "error": "403 Forbidden" or "All methods failed"
}
```

## Step 4: Update Mobile App

If Vercel works, update your mobile app to use Vercel URL:

**File:** `services/mediaExtractor.ts`

```typescript
const API_URL = 'https://YOUR-VERCEL-URL.vercel.app/api/extract';
```

## Important Notes

### Vercel Limitations

1. **Serverless Functions**
   - 10 second timeout (Hobby plan)
   - 60 second timeout (Pro plan - $20/month)
   - yt-dlp extraction might timeout for slow sites

2. **No Docker**
   - Can't use Dockerfile
   - Need to install yt-dlp differently
   - Python scripts might not work

3. **Cold Starts**
   - First request after inactivity is slower
   - Subsequent requests are fast

### Solution for yt-dlp on Vercel

Vercel doesn't support Docker, so we need to:

**Option 1: Use yt-dlp as npm package**
```bash
npm install @distube/yt-dlp
```

**Option 2: Use external API**
- Call yt-dlp from external service
- Use Cloudflare Worker as proxy

**Option 3: Hybrid approach**
- Keep Render for yt-dlp heavy lifting
- Use Vercel for API routing
- Vercel calls Render when needed

## Recommended Architecture

### Hybrid Setup (Best of Both Worlds)

```
Mobile App
    ↓
Vercel API (Fast, good IPs)
    ↓
    ├─→ Direct extraction (Instagram, TikTok)
    ├─→ Cloudflare Worker (Terabox)
    └─→ Render.com (yt-dlp for other sites)
```

**Benefits:**
- ✅ Vercel's good IP reputation
- ✅ Render's Docker/yt-dlp support
- ✅ Best of both platforms
- ✅ Fallback if one fails

## Step 5: Implement Hybrid Approach

Create `backend/api/extract.js` for Vercel:

```javascript
// Vercel serverless function
export default async function handler(req, res) {
  const { url } = req.body;
  
  const platform = detectPlatform(url);
  
  // Try Cloudflare Worker for Terabox
  if (platform === 'terabox') {
    try {
      const result = await extractTeraboxCloudflare(url);
      return res.json(result);
    } catch (e) {
      // Fallback to Render
    }
  }
  
  // Fallback to Render for yt-dlp
  try {
    const response = await fetch('https://superapp-api-d3y5.onrender.com/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await response.json();
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Extraction failed' });
  }
}
```

## Testing Checklist

After Vercel deployment:

- [ ] Test Instagram URL
- [ ] Test TikTok URL
- [ ] Test Facebook URL
- [ ] Test Terabox URL (🤞)
- [ ] Test YouTube URL (🤞)
- [ ] Check response times
- [ ] Check error handling
- [ ] Test with mobile app

## Comparison: Render vs Vercel

| Feature | Render | Vercel |
|---------|--------|--------|
| Docker Support | ✅ Yes | ❌ No |
| yt-dlp | ✅ Easy | ⚠️ Complex |
| IP Reputation | ⚠️ Datacenter | ✅ Better |
| Cold Start | ~30s | ~1s |
| Timeout | 15min | 10s (60s Pro) |
| Cost | Free | Free |
| Best For | yt-dlp | API routing |

## My Recommendation

**Deploy to BOTH:**

1. **Keep Render** - For yt-dlp heavy lifting
2. **Add Vercel** - For API routing and Terabox
3. **Vercel calls Render** - When yt-dlp needed

This gives you:
- ✅ Vercel's good IPs (might unblock Terabox)
- ✅ Render's Docker/yt-dlp support
- ✅ Best of both worlds
- ✅ Redundancy

## Quick Start Commands

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to backend
cd backend

# 3. Deploy to Vercel
vercel --prod

# 4. Test deployment
curl -X POST https://YOUR-URL.vercel.app/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://teraboxapp.com/s/1PDAUak5v6Ai3o6iTp8k_Ow"}'

# 5. If it works, update mobile app API URL
```

## Next Steps

1. Deploy to Vercel (5 minutes)
2. Test Terabox (1 minute)
3. If it works: 🎉 Update mobile app
4. If it fails: Implement hybrid approach
5. Keep Render as fallback

**Let's try Vercel and see if it works!** 🚀
