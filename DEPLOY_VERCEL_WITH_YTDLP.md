# Deploy to Vercel with yt-dlp

## What Changed

Added `@distube/yt-dlp` npm package to make yt-dlp work on Vercel!

### Files Modified:
- ✅ `backend/package.json` - Added `@distube/yt-dlp` dependency
- ✅ `backend/api/extract.js` - Updated to use npm yt-dlp binary

## How It Works

The `@distube/yt-dlp` package:
1. Downloads yt-dlp binary on first run
2. Stores it in node_modules
3. Works on Vercel serverless functions
4. No Docker needed!

## Deploy to Vercel

### Step 1: Push Changes to GitHub

```bash
git add backend/package.json
git add backend/api/extract.js
git commit -m "Add yt-dlp npm package for Vercel compatibility"
git push origin main
```

### Step 2: Vercel Auto-Deploy

Vercel will automatically:
1. Detect the push
2. Install dependencies (including @distube/yt-dlp)
3. Download yt-dlp binary
4. Deploy

**Wait 2-3 minutes for deployment**

### Step 3: Test on Vercel

```powershell
# Test Instagram
$body = @{url="https://www.instagram.com/p/C8vPexGSGVu/"} | ConvertTo-Json
Invoke-RestMethod -Uri "https://super-app-blue-pi.vercel.app/api/extract" -Method Post -Body $body -ContentType "application/json"

# Test Terabox (🤞)
$body = @{url="https://teraboxapp.com/s/1PDAUak5v6Ai3o6iTp8k_Ow"} | ConvertTo-Json
Invoke-RestMethod -Uri "https://super-app-blue-pi.vercel.app/api/extract" -Method Post -Body $body -ContentType "application/json"

# Test YouTube (🤞)
$body = @{url="https://youtu.be/X5TN9IPuojI"} | ConvertTo-Json
Invoke-RestMethod -Uri "https://super-app-blue-pi.vercel.app/api/extract" -Method Post -Body $body -ContentType "application/json"
```

## Expected Results

### If yt-dlp installs successfully:

**Instagram:** ✅ Should work
```json
{
  "title": "Instagram Video",
  "qualities": [...]
}
```

**Terabox:** ⚠️ 50/50 chance
- ✅ If Vercel IPs aren't blocked
- ❌ If Cloudflare still blocks

**YouTube:** ⚠️ 30% chance
- ✅ If Vercel IPs work
- ❌ If YouTube blocks cloud IPs

### If yt-dlp fails to install:

```json
{
  "error": "yt-dlp not available"
}
```

## Troubleshooting

### Issue: "yt-dlp not available"

**Cause:** Binary didn't download on Vercel

**Solution:** Check Vercel logs:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click on latest deployment
4. Check "Build Logs"
5. Look for yt-dlp download errors

### Issue: "Function timeout"

**Cause:** Vercel free tier has 10s timeout

**Solutions:**
1. Upgrade to Pro ($20/month) for 60s timeout
2. Use Render for slow extractions
3. Implement hybrid approach

### Issue: Still getting 403 Forbidden

**Cause:** Vercel IPs are also blocked

**Solution:** Need residential proxies or accept reality

## Comparison After yt-dlp Install

| Platform | Render | Vercel (with yt-dlp) |
|----------|--------|----------------------|
| Instagram | ✅ Works | ✅ Should work |
| TikTok | ✅ Works | ✅ Should work |
| Facebook | ✅ Works | ✅ Should work |
| Terabox | ❌ Blocked | ⚠️ Might work |
| YouTube | ❌ Blocked | ⚠️ Might work |
| Timeout | 15 min | 10s (60s Pro) |
| Cold Start | ~30s | ~2s |

## If Terabox Works on Vercel

### Update Mobile App

**File:** `services/mediaExtractor.ts`

```typescript
const API_URL = 'https://super-app-blue-pi.vercel.app/api/extract';
```

### Push and Test

```bash
git add services/mediaExtractor.ts
git commit -m "Switch to Vercel API - Terabox working!"
git push origin main
```

## If Terabox Still Doesn't Work

### Option 1: Hybrid Approach

Use both Vercel and Render:

```typescript
// Try Vercel first (faster, better IPs)
const VERCEL_API = 'https://super-app-blue-pi.vercel.app/api/extract';
const RENDER_API = 'https://superapp-api-d3y5.onrender.com/api/extract';

async extractMediaInfo(url: string) {
  try {
    const response = await fetch(VERCEL_API, ...);
    if (response.ok) return await response.json();
  } catch (e) {
    // Fallback to Render
    return await fetch(RENDER_API, ...);
  }
}
```

### Option 2: Accept Reality

Focus on 1000+ sites that work:
- Instagram ✅
- TikTok ✅
- Facebook ✅
- Twitter ✅
- Dailymotion ✅
- Reddit ✅
- Vimeo ✅

## Next Steps

1. ✅ Push changes to GitHub
2. ✅ Wait for Vercel deployment (2-3 min)
3. ✅ Test Instagram (should work)
4. ✅ Test Terabox (moment of truth!)
5. ✅ Test YouTube (bonus)
6. ✅ Update mobile app if it works
7. ✅ Celebrate or implement hybrid approach

## Git Commands

```bash
git add backend/package.json backend/api/extract.js
git commit -m "Add yt-dlp npm package for Vercel - testing Terabox"
git push origin main
```

**Now push and let's see if Vercel + yt-dlp + better IPs = Terabox working!** 🚀
