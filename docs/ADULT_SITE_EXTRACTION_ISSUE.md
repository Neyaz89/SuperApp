# Adult Site Extraction Issue - Client-Side Validation Added

## Problem Identified

When extracting from adult sites (like nudzr.com), the API is returning **wrong URLs**:

```json
{
  "quality": "HD",
  "format": "avi",
  "size": "~500 MB",
  "url": "https://static.nudzr.com/static/images/rta-label.avi"
}
```

**Issues:**
1. ❌ URL is `rta-label.avi` - this is an RTA (Restricted to Adults) label image, NOT the video
2. ❌ Size shows "~500 MB" for a 2-minute video (unrealistic)
3. ❌ User downloads a label image instead of the actual video

## Root Cause

The **backend universal scraper** is incorrectly identifying the RTA label as the video source. Adult sites often have:
- RTA compliance labels
- Preview thumbnails
- Watermark images
- Advertisement images

The scraper is picking up these instead of the actual video `<video>` tag or streaming URL.

## Client-Side Fix Applied

Added **URL validation** in `mediaExtractor.ts` to filter out obvious non-video URLs:

```typescript
// Validate that URLs are actual video URLs (not images/labels)
const validQualities = data.qualities.filter((q: any) => {
  const url = q.url?.toLowerCase() || '';
  
  // Filter out common non-video URLs
  const isInvalidUrl = 
    url.includes('rta-label') ||
    url.includes('logo') ||
    url.includes('banner') ||
    url.includes('placeholder') ||
    url.endsWith('.jpg') ||
    url.endsWith('.jpeg') ||
    url.endsWith('.png') ||
    url.endsWith('.gif') ||
    url.endsWith('.svg') ||
    url.includes('/images/') ||
    url.includes('/static/images/');
  
  return !isInvalidUrl;
});

if (validQualities.length === 0) {
  throw new Error('Could not extract valid video URL. This site may require special handling.');
}
```

## What This Does

### Before:
1. API returns RTA label URL
2. App shows it as "HD" quality
3. User downloads it
4. Gets a label image instead of video

### After:
1. API returns RTA label URL
2. Client detects it's an image URL
3. Filters it out
4. If no valid URLs remain, shows error: "Could not extract valid video URL"
5. User knows immediately the site isn't supported

## Backend Fix Needed

The **real fix** needs to be in the backend API (`backend/extractors/universal-scraper.js`):

### Current Issue:
```javascript
// Backend is probably doing something like:
const videoUrl = $('video source').attr('src'); // Wrong selector
// Or finding first .avi/.mp4 link (which is the RTA label)
```

### Proper Fix:
```javascript
// Should look for actual video sources:
1. Check <video> tag sources
2. Look for streaming URLs (m3u8, mpd)
3. Check for player initialization scripts
4. Parse JSON-LD video metadata
5. Look for download buttons/links
6. Avoid /images/, /static/, label URLs
```

### Adult Site Specific Challenges:
- Often use JavaScript players
- Video URLs are dynamically loaded
- May require authentication/cookies
- Use anti-scraping measures
- Embed videos from CDNs

## Recommended Backend Improvements

### 1. Better Selector Priority
```javascript
// Priority order for finding video URLs:
1. <video> tag src/sources
2. Player config JSON (window.playerConfig, etc.)
3. m3u8/mpd manifest URLs
4. Download button hrefs
5. Meta tags (og:video, twitter:player)
```

### 2. URL Validation
```javascript
// Backend should validate URLs before returning:
function isValidVideoUrl(url) {
  const invalid = [
    'rta-label',
    'logo',
    'banner',
    '/images/',
    '/static/images/',
  ];
  
  const validExtensions = [
    '.mp4', '.webm', '.m3u8', 
    '.mpd', '.avi', '.mov'
  ];
  
  // Check if URL is likely a video
  return !invalid.some(i => url.includes(i)) &&
         validExtensions.some(e => url.includes(e));
}
```

### 3. Adult Site Specific Extractors
Consider creating dedicated extractors for popular adult sites:
- `backend/extractors/nudzr-extractor.js`
- `backend/extractors/xvideos-extractor.js`
- etc.

Each with site-specific logic to find the actual video source.

## Testing

To test if the fix works:

1. ✅ **Valid video URL**: Should work normally
2. ✅ **RTA label URL**: Should be filtered out, show error
3. ✅ **Image URLs**: Should be filtered out
4. ✅ **Mixed results**: Should keep only valid video URLs

## User Experience

### Before Fix:
```
User: Downloads "HD" video
Result: Gets a 500MB RTA label image
Reaction: WTF? 😡
```

### After Fix:
```
User: Tries to download
Result: Error - "Could not extract valid video URL. This site may require special handling."
Reaction: Okay, this site isn't supported yet 👍
```

## Next Steps

1. ✅ **Client-side validation** - DONE (filters bad URLs)
2. ⏳ **Backend fix** - NEEDED (improve universal scraper)
3. ⏳ **Site-specific extractors** - RECOMMENDED (for popular adult sites)
4. ⏳ **Better error messages** - Show which sites are supported

## Files Modified
- `services/mediaExtractor.ts` - Added URL validation filter

## Backend Files to Fix
- `backend/extractors/universal-scraper.js` - Improve video URL detection
- `backend/extractors/` - Add site-specific extractors for adult sites
