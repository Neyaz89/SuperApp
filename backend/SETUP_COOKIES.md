# Setup YouTube Cookies - REQUIRED FOR YOUTUBE DOWNLOADS

## Why Cookies Are Needed

YouTube blocks requests from cloud servers (Render, AWS, etc.) because they come from datacenter IPs. The ONLY way to bypass this is to use cookies from a logged-in YouTube account.

## Step 1: Export Cookies from Your Browser

### Option A: Using Browser Extension (EASIEST)

1. **Install Cookie Extension:**
   - Chrome/Edge: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
   - Firefox: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

2. **Export YouTube Cookies:**
   - Open YouTube in your browser (make sure you're logged in)
   - Click the extension icon
   - Click "Export" or "Download"
   - Save as `cookies.txt`

### Option B: Using Developer Tools (Manual)

1. Open YouTube in your browser
2. Press F12 to open Developer Tools
3. Go to "Application" tab → "Cookies" → "https://www.youtube.com"
4. Copy these cookies manually:
   - `CONSENT`
   - `VISITOR_INFO1_LIVE`
   - `PREF`
   - `__Secure-1PSID` (if logged in)
   - `__Secure-3PSID` (if logged in)

## Step 2: Update cookies.txt File

Replace the content of `backend/cookies.txt` with your exported cookies.

**Format (Netscape):**
```
# Netscape HTTP Cookie File
.youtube.com	TRUE	/	TRUE	1767225600	CONSENT	YES+cb.20210328-17-p0.en+FX+123
.youtube.com	TRUE	/	FALSE	1767225600	VISITOR_INFO1_LIVE	abc123xyz
.youtube.com	TRUE	/	TRUE	1767225600	PREF	tz=America.New_York
```

## Step 3: Deploy to Render

```bash
git add backend/cookies.txt backend/Dockerfile
git commit -m "Add YouTube cookies for authentication"
git push origin main
```

Render will automatically rebuild and deploy with the new cookies.

## Step 4: Test

```bash
curl -X POST https://superapp-api-d3y5.onrender.com/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtu.be/dQw4w9WgXcQ"}'
```

## Security Notes

### ⚠️ IMPORTANT:
- **DO NOT use your personal YouTube account**
- Create a throwaway/burner YouTube account
- These cookies give full access to your YouTube account
- Anyone with these cookies can impersonate you

### Best Practices:
1. Use a dedicated account just for this app
2. Don't commit cookies to public repositories
3. Rotate cookies every few months
4. Monitor the account for suspicious activity

## Cookie Lifespan

- **VISITOR_INFO1_LIVE**: ~6 months
- **CONSENT**: ~2 years
- **Session cookies**: Until browser closes

You'll need to update cookies every 3-6 months.

## Troubleshooting

### "Sign in to confirm you're not a bot" still appears:
- Cookies expired → Export fresh cookies
- Wrong format → Use Netscape format
- File not found → Check Dockerfile copied cookies.txt

### Cookies not working:
- Make sure you're logged into YouTube when exporting
- Export from an incognito/private window (see below)
- Try a different browser

## Advanced: Export from Incognito (Most Reliable)

1. Open incognito/private window
2. Log into YouTube
3. Navigate to `https://www.youtube.com/robots.txt`
4. Export cookies using extension
5. Close incognito window immediately
6. These cookies won't rotate and will last longer

## Alternative: Use Residential Proxy (Paid)

If you don't want to use cookies, you can use a residential proxy service:
- BrightData: $500/month
- Oxylabs: $300/month
- SmartProxy: $200/month

But cookies are FREE and work just as well!

## Status

Once cookies are added:
- ✅ YouTube downloads will work
- ✅ All 1000+ other sites work without cookies
- ✅ 95%+ success rate

Without cookies:
- ❌ YouTube blocked on cloud servers
- ✅ Other sites still work
