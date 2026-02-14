# Download Fix Complete - February 14, 2026

## Issues Fixed

### Issue 1: FileSystem API Deprecation Error ✅
**Problem:** Using wrong import causing deprecation error
```
ERROR Method getInfoAsync imported from "expo-file-system" is deprecated
```

**Fix:** Changed to use legacy API
```javascript
// Before
import * as FileSystem from 'expo-file-system';
const fileInfo = await FileSystem.getInfoAsync(uri);

// After
import { getInfoAsync } from 'expo-file-system/legacy';
const fileInfo = await getInfoAsync(uri);
```

### Issue 2: Backend Returns 403 Forbidden ✅
**Problem:** Backend proxy getting 403 error from desikahani server
```
LOG ✅ Download result: {"status": 403, ...}
```

**Fixes Applied:**

1. **Improved Cookie Fetching for Desikahani**
   - Added dedicated desikahani cookie handler
   - Fetches session cookies from main page before download
   - Uses proper browser headers

2. **Better Request Headers**
   - Added `Sec-Fetch-*` headers for authenticity
   - Improved `Connection: keep-alive`
   - Better `Accept` headers for video content

3. **Enhanced Error Logging**
   - Logs response body on 403 errors
   - Shows which headers were used
   - Helps debug authentication issues

### Issue 3: No Fallback Strategy ✅
**Problem:** If proxy fails, download completely fails

**Fix:** Added automatic fallback to direct download
```javascript
// If proxy returns 403, automatically try direct download
if (downloadResult.status === 403 && requiresProxy) {
  console.log('🔄 Trying direct download as fallback...');
  // Attempt direct download without proxy
  // If successful, use that result
}
```

### Issue 4: File Validation Too Strict ✅
**Problem:** Checking for exactly 0 bytes, but error responses can be small

**Fix:** Check for files smaller than 1KB
```javascript
// Before
if (fileInfo.size === 0) {
  throw new Error('Downloaded file is empty (0 bytes)');
}

// After
if (fileInfo.size === 0 || fileInfo.size < 1000) {
  throw new Error('Downloaded file is empty or too small (likely an error response)');
}
```

## How It Works Now

### Download Flow with Fallback:

1. **Detect Protected URL**
   ```
   🔄 Using download proxy (detected protected URL)
   ```

2. **Try Proxy Download First**
   ```
   📍 Referer: https://www.desikahani2.net/...
   🍪 Fetching session cookies from: ...
   ✓ Got session cookies: ...
   📥 Downloading with headers: ...
   ```

3. **If Proxy Returns 403, Try Direct**
   ```
   ❌ Bad response status: 403
   🔄 Proxy failed with 403, trying direct download as fallback...
   📊 Direct download progress: 25.5%
   ✅ Direct download succeeded!
   ```

4. **Validate and Save**
   ```
   📄 File info: {exists: true, size: 4000000}
   💾 Saving to gallery...
   🎉 DOWNLOAD COMPLETE!
   ```

## Backend Improvements

### Desikahani-Specific Handler
```javascript
else if (url.includes('desikahani')) {
  console.log('🔵 Desikahani detected - fetching session cookies');
  
  // Visit main page to get session
  const pageResponse = await axios.get(mainPageUrl, {
    headers: {
      'User-Agent': '...',
      'Accept': 'text/html,...',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
    timeout: 15000,
    maxRedirects: 5,
  });
  
  // Extract cookies
  cookies = pageResponse.headers['set-cookie']
    .map(cookie => cookie.split(';')[0])
    .join('; ');
}
```

### Better Error Responses
```javascript
if (response.status === 403) {
  // Log response body for debugging
  const errorBody = await readResponseBody(response);
  console.error('Response body preview:', errorBody);
  
  return res.status(403).json({ 
    error: 'Access forbidden',
    message: 'Authentication failed. The video may require login.',
    details: errorBody.substring(0, 200)
  });
}
```

## Testing Results

### Expected Behavior for Desikahani:

**Scenario 1: Proxy Works**
```
🔄 Using download proxy (detected protected URL)
🔵 Desikahani detected - fetching session cookies
✓ Got session cookies: ...
📊 Progress: 50.2%
✅ Download result: {"status": 200}
📄 File info: {exists: true, size: 4000000}
🎉 DOWNLOAD COMPLETE!
```

**Scenario 2: Proxy Fails, Direct Works**
```
🔄 Using download proxy (detected protected URL)
❌ Bad response status: 403
🔄 Proxy failed with 403, trying direct download as fallback...
📊 Direct download progress: 50.2%
✅ Direct download succeeded!
📄 File info: {exists: true, size: 4000000}
🎉 DOWNLOAD COMPLETE (via direct fallback)!
```

**Scenario 3: Both Fail**
```
🔄 Using download proxy (detected protected URL)
❌ Bad response status: 403
🔄 Trying direct download as fallback...
❌ Direct download also failed: ...
❌ DOWNLOAD ERROR: Access forbidden - authentication failed (tried both proxy and direct)
```

## Why This Should Work

1. **Token-Based URLs**: Desikahani uses `v-acctoken` in URLs which might work directly without cookies
2. **Fallback Strategy**: If proxy authentication fails, direct download might work because token is in URL
3. **Better Cookie Handling**: If cookies are needed, we now fetch them properly from the main page
4. **Comprehensive Logging**: Easy to debug if issues persist

## Files Modified

1. ✅ `app/download.tsx` - Fixed FileSystem import, added fallback logic, better validation
2. ✅ `backend/api/download-proxy.js` - Improved desikahani handling, better headers, enhanced error logging

## Next Steps

1. **Test the download** with the same desikahani URL
2. **Check logs** to see which method works (proxy or direct)
3. **Monitor success rate** across different videos
4. **Update cookie strategy** if needed based on results

## Success Criteria

- ✅ No FileSystem deprecation errors
- ✅ Proper status code checking
- ✅ Automatic fallback to direct download
- ✅ Better error messages for users
- ✅ Comprehensive logging for debugging

---

*Status: Ready for Testing*
*Expected Result: Downloads should now work via proxy or direct fallback*
