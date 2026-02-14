# Download Troubleshooting Guide

## Issue: Videos Extract Successfully But Don't Download

### What Was Fixed

1. **Enhanced Logging**
   - Added comprehensive console logging throughout download flow
   - Logs now show: URL detection, proxy usage, download progress, file validation
   - Easier to identify where downloads fail

2. **Auto-Detection of Protected URLs**
   - App now automatically detects URLs that need proxy
   - Patterns detected:
     - `desikahani` domains
     - `xvideos`, `pornhub` domains
     - URLs with `v-acctoken` (token-based auth)
     - URLs with `get_file` (protected endpoints)

3. **File Validation**
   - Added file existence check after download
   - Added file size validation (catches 0-byte downloads)
   - Better error messages for empty/missing files

4. **Improved Error Handling**
   - Specific error messages for 403 (Forbidden)
   - Specific error messages for 404 (Not Found)
   - Specific error messages for empty files
   - Better network error detection

5. **Backend Proxy Improvements**
   - Better adult site detection
   - Improved cookie fetching for protected sites
   - Added more headers for compatibility
   - Better error responses

### How to Debug Download Issues

#### Step 1: Check the Logs

Look for these key log messages:

```
=== DOWNLOAD STARTED ===
Selected Quality: {...}
📁 Download path: ...
🔄 Using download proxy (detected protected URL)
📍 Referer: ...
🔗 Proxy URL: ...
📥 Creating download resumable...
⏳ Starting download async...
📊 Progress: X% (bytes/bytes)
✅ Download result: {...}
📄 File info: {...}
💾 Saving to gallery...
🎉 DOWNLOAD COMPLETE!
```

#### Step 2: Identify the Failure Point

**If logs stop at "Creating download resumable":**
- Network issue or URL is invalid
- Check internet connection
- Try the URL in a browser

**If logs show "Download result" but file doesn't exist:**
- File system permission issue
- Storage full
- Check device storage

**If logs show "File info: { size: 0 }":**
- URL returned empty response
- Authentication/cookies failed
- URL may have expired

**If logs show 403/404 error:**
- URL requires authentication
- URL has expired
- Proxy may need updating

#### Step 3: Test URL Patterns

**Direct Download (No Proxy):**
- YouTube, Instagram, Facebook, TikTok
- Most mainstream platforms
- Should see: "⚡ Direct download (no proxy needed)"

**Proxy Required:**
- Adult sites (desikahani, xvideos, pornhub)
- Token-based URLs (v-acctoken)
- Protected endpoints (get_file)
- Should see: "🔄 Using download proxy (detected protected URL)"

### Common Issues & Solutions

#### Issue 1: "Downloaded file is empty (0 bytes)"

**Cause:** URL returned no content or authentication failed

**Solutions:**
1. Check if URL works in browser
2. Verify backend proxy is running
3. Check backend logs for cookie fetching
4. URL may have expired - extract again

#### Issue 2: "Access denied. The video may be protected"

**Cause:** 403 Forbidden response

**Solutions:**
1. Ensure proxy is being used (check logs)
2. Update backend cookies if needed
3. Some videos may be geo-restricted
4. Try extracting again (gets fresh URL)

#### Issue 3: "The download link has expired or is invalid"

**Cause:** 404 Not Found response

**Solutions:**
1. Extract the video again (URLs expire)
2. Check if video is still available on source site
3. Some platforms have short-lived URLs

#### Issue 4: Download starts but never completes

**Cause:** Network timeout or large file

**Solutions:**
1. Check internet connection stability
2. Try on WiFi instead of mobile data
3. Check device storage space
4. Backend timeout may need increasing

### Testing Checklist

When testing downloads:

- [ ] Check console logs for complete flow
- [ ] Verify proxy detection for protected URLs
- [ ] Confirm file exists after download
- [ ] Verify file size is > 0 bytes
- [ ] Check file appears in gallery
- [ ] Test both direct and proxy downloads
- [ ] Test on different network conditions

### Backend Proxy Status

The backend proxy handles:
- ✅ Terabox URLs (with auth cookies)
- ✅ Adult sites (desikahani, xvideos, pornhub)
- ✅ Token-based URLs (v-acctoken)
- ✅ Protected endpoints (get_file)
- ✅ Session cookie fetching
- ✅ Proper headers and referers

### URL Pattern Detection

The app automatically uses proxy for:

```javascript
const requiresProxy = 
  selectedQuality.url.includes('desikahani') ||
  selectedQuality.url.includes('xvideos') ||
  selectedQuality.url.includes('pornhub') ||
  selectedQuality.url.includes('v-acctoken') ||
  selectedQuality.url.includes('get_file');
```

### Next Steps If Still Failing

1. **Capture Full Logs**
   - Run app with console open
   - Copy all logs from extraction to download
   - Look for error messages

2. **Test Backend Directly**
   - Try the proxy URL in browser
   - Check if backend returns video data
   - Verify backend is deployed and running

3. **Check Backend Logs**
   - Look at Render.com logs
   - Check for proxy errors
   - Verify cookie fetching works

4. **Test Different Videos**
   - Try videos from different sites
   - Compare working vs non-working URLs
   - Identify patterns in failures

### Expected Behavior

**Successful Download Flow:**
1. User selects quality
2. App detects if proxy needed
3. Download starts with progress updates
4. File is validated (exists, size > 0)
5. File is saved to gallery
6. User sees completion screen

**Failed Download Flow:**
1. User selects quality
2. Download starts
3. Error occurs (logged to console)
4. User sees error screen with specific message
5. User can try again or go back

---

*Last Updated: February 14, 2026*
*Status: Enhanced logging and error handling implemented*
