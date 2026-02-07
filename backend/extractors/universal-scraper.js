// Universal Video Scraper - Attempts to extract videos from ANY website
const axios = require('axios');
const cheerio = require('cheerio');

async function extractUniversal(url) {
  console.log('🌐 Universal Scraper: Attempting extraction from', url);
  
  try {
    // Fetch the page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': url,
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    // Check if response is JSON (not HTML)
    if (response.headers['content-type']?.includes('application/json')) {
      console.log('⚠️ Response is JSON, not HTML - site may be blocking');
      throw new Error('Site returned JSON instead of HTML (likely blocking)');
    }
    
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    
    // Validate we got HTML
    if (!html || html.length < 100) {
      throw new Error('Response too short or empty');
    }
    
    const $ = cheerio.load(html);
    
    const videoUrls = new Set();
    const qualities = [];

    // Method 1: Find <video> tags with src
    $('video').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && isVideoUrl(src)) {
        videoUrls.add(resolveUrl(src, url));
      }
      
      // Check <source> tags inside <video>
      $(elem).find('source').each((j, source) => {
        const srcAttr = $(source).attr('src');
        if (srcAttr && isVideoUrl(srcAttr)) {
          videoUrls.add(resolveUrl(srcAttr, url));
        }
      });
    });

    // Method 2: Find video URLs in page source using regex
    const videoPatterns = [
      // Direct video files (prioritize non-preview)
      /(https?:\/\/[^\s"'<>]+\.(?:mp4|webm|m4v|mov|avi|mkv|flv|wmv)(?:\?[^\s"'<>]*)?)/gi,
      // HLS streams
      /(https?:\/\/[^\s"'<>]+\.m3u8(?:\?[^\s"'<>]*)?)/gi,
      // DASH streams
      /(https?:\/\/[^\s"'<>]+\.mpd(?:\?[^\s"'<>]*)?)/gi,
      // Common video CDN patterns
      /(https?:\/\/[^\s"'<>]*(?:video|media|cdn|stream)[^\s"'<>]*\.(?:mp4|m3u8|mpd)(?:\?[^\s"'<>]*)?)/gi,
    ];

    videoPatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanUrl = match.replace(/['"\\]/g, '');
          // Skip preview/thumbnail videos
          if (cleanUrl.includes('preview') || cleanUrl.includes('thumb') || cleanUrl.includes('screenshot')) {
            return;
          }
          if (isVideoUrl(cleanUrl)) {
            videoUrls.add(cleanUrl);
          }
        });
      }
    });

    // Method 3: Check common video player data attributes
    const playerSelectors = [
      '[data-video-url]',
      '[data-src]',
      '[data-video-src]',
      '[data-mp4]',
      '[data-file]',
      '[data-video]',
      '.video-player',
      '#video-player',
    ];

    playerSelectors.forEach(selector => {
      $(selector).each((i, elem) => {
        const attrs = ['data-video-url', 'data-src', 'data-video-src', 'data-mp4', 'data-file', 'data-video', 'src', 'href'];
        attrs.forEach(attr => {
          const val = $(elem).attr(attr);
          if (val && isVideoUrl(val)) {
            videoUrls.add(resolveUrl(val, url));
          }
        });
      });
    });

    // Method 4: Look for JSON-LD structured data
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const json = JSON.parse($(elem).html());
        if (json.contentUrl && isVideoUrl(json.contentUrl)) {
          videoUrls.add(json.contentUrl);
        }
        if (json.embedUrl && isVideoUrl(json.embedUrl)) {
          videoUrls.add(json.embedUrl);
        }
        if (json.video && json.video.contentUrl) {
          videoUrls.add(json.video.contentUrl);
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    });

    // Method 5: Check meta tags
    const metaTags = [
      'og:video',
      'og:video:url',
      'og:video:secure_url',
      'twitter:player:stream',
      'twitter:player',
    ];

    metaTags.forEach(tag => {
      const content = $(`meta[property="${tag}"]`).attr('content') || $(`meta[name="${tag}"]`).attr('content');
      if (content && isVideoUrl(content)) {
        videoUrls.add(content);
      }
    });

    // Convert Set to Array and filter out preview/thumbnail videos
    const uniqueUrls = Array.from(videoUrls).filter(url => {
      const lowerUrl = url.toLowerCase();
      // Skip preview, thumbnail, screenshot videos
      if (lowerUrl.includes('preview') || lowerUrl.includes('thumb') || lowerUrl.includes('screenshot')) {
        return false;
      }
      // Skip very small videos (likely previews)
      if (lowerUrl.includes('_small') || lowerUrl.includes('_tiny')) {
        return false;
      }
      return true;
    });
    
    if (uniqueUrls.length === 0) {
      throw new Error('No downloadable video URLs found on page (only previews/thumbnails found)');
    }

    console.log(`✅ Universal Scraper found ${uniqueUrls.length} downloadable video URL(s) (filtered out previews)`);

    // Create quality entries with real file sizes
    const sizePromises = uniqueUrls.map(async (videoUrl, index) => {
      const quality = guessQuality(videoUrl);
      const format = guessFormat(videoUrl);
      
      // Check if URL needs proxy (adult sites, sites with auth)
      const needsProxy = requiresProxy(videoUrl);
      
      // Try to fetch real file size
      let size = await fetchFileSize(videoUrl);
      
      // Fallback to estimate if HEAD request failed
      if (!size) {
        size = estimateFileSize(quality, format);
      }
      
      return {
        quality: quality || `Video ${index + 1}`,
        format: format,
        size: size,
        url: videoUrl,
        hasAudio: true,
        hasVideo: true,
        needsProxy: needsProxy, // Flag for frontend
      };
    });
    
    // Wait for all size fetches to complete
    const resolvedQualities = await Promise.all(sizePromises);
    qualities.push(...resolvedQualities);

    // Extract title
    const title = $('title').text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('meta[name="twitter:title"]').attr('content') || 
                  'Video';

    // Extract thumbnail
    const thumbnail = $('meta[property="og:image"]').attr('content') || 
                      $('meta[name="twitter:image"]').attr('content') || 
                      $('video').attr('poster') ||
                      'https://via.placeholder.com/640x360';

    return {
      title: title.substring(0, 100), // Limit title length
      thumbnail: resolveUrl(thumbnail, url),
      duration: '0:00',
      qualities: qualities,
      audioFormats: [],
      platform: 'generic',
      extractionMethod: 'universal-scraper',
      sourceUrl: url, // Store source URL for re-extraction if needed
    };

  } catch (error) {
    console.error('❌ Universal Scraper failed:', error.message);
    throw error;
  }
}

function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  const lowerUrl = url.toLowerCase();
  
  // CRITICAL: Exclude JavaScript, CSS, and other non-video files
  if (/\.(js|css|json|xml|txt|html|jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot|ico)(\?|$)/i.test(lowerUrl)) {
    return false;
  }
  
  // Check for video file extensions
  if (/\.(mp4|webm|m4v|mov|avi|mkv|flv|wmv|m3u8|mpd)(\?|$)/i.test(lowerUrl)) {
    return true;
  }
  
  // Check for common video CDN patterns (but not if it's a JS file)
  if (/(?:video|media|stream).*\.(mp4|webm|m4v|mov|avi|mkv|flv|wmv)/i.test(lowerUrl)) {
    return true;
  }
  
  return false;
}

function resolveUrl(relativeUrl, baseUrl) {
  if (!relativeUrl) return '';
  
  // Already absolute
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  
  // Protocol-relative
  if (relativeUrl.startsWith('//')) {
    return 'https:' + relativeUrl;
  }
  
  // Relative to base
  try {
    const base = new URL(baseUrl);
    if (relativeUrl.startsWith('/')) {
      return base.origin + relativeUrl;
    } else {
      return base.origin + '/' + relativeUrl;
    }
  } catch (e) {
    return relativeUrl;
  }
}

function guessQuality(url) {
  const lowerUrl = url.toLowerCase();
  
  // Check for quality indicators in URL
  if (/2160p|4k|uhd|3840x2160/i.test(lowerUrl)) return '2160p';
  if (/1440p|2k|2560x1440/i.test(lowerUrl)) return '1440p';
  if (/1080p|1920x1080|fullhd|fhd/i.test(lowerUrl)) return '1080p';
  if (/720p|1280x720|hd/i.test(lowerUrl)) return '720p';
  if (/480p|854x480|sd/i.test(lowerUrl)) return '480p';
  if (/360p|640x360/i.test(lowerUrl)) return '360p';
  if (/240p|426x240/i.test(lowerUrl)) return '240p';
  
  // Check for quality in filename
  const match = url.match(/(\d{3,4})p/i);
  if (match) return match[1] + 'p';
  
  // For adult sites, check common patterns
  if (/_hd\b|_high\b/i.test(lowerUrl)) return '720p';
  if (/_sd\b|_low\b|_mobile\b/i.test(lowerUrl)) return '480p';
  
  // Default based on file path structure
  if (lowerUrl.includes('/hd/') || lowerUrl.includes('/high/')) return '720p';
  if (lowerUrl.includes('/sd/') || lowerUrl.includes('/low/')) return '480p';
  
  return 'HD';
}

function guessFormat(url) {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('.mp4')) return 'mp4';
  if (lowerUrl.includes('.webm')) return 'webm';
  if (lowerUrl.includes('.m3u8')) return 'm3u8';
  if (lowerUrl.includes('.mpd')) return 'mpd';
  if (lowerUrl.includes('.mov')) return 'mov';
  if (lowerUrl.includes('.avi')) return 'avi';
  if (lowerUrl.includes('.mkv')) return 'mkv';
  if (lowerUrl.includes('.flv')) return 'flv';
  
  return 'mp4'; // Default
}

function requiresProxy(url) {
  const lowerUrl = url.toLowerCase();
  
  // Terabox requires cookies for authentication
  if (lowerUrl.includes('terabox') || lowerUrl.includes('dubox') || lowerUrl.includes('1024tera')) {
    return true;
  }
  
  // Adult sites that require referer/cookies
  const proxyDomains = [
    'pornhub.com',
    'xvideos.com',
    'xhamster.com',
    'xnxx.com',
    'redtube.com',
    'youporn.com',
    'tube8.com',
    'spankbang.com',
    'eporner.com',
    'hdtube.porn',
    'txxx.com',
    'hclips.com',
    'upornia.com',
    'drtuber.com',
    'tnaflix.com',
    'empflix.com',
    'motherless.com',
    'heavy-r.com',
  ];
  
  return proxyDomains.some(domain => lowerUrl.includes(domain));
}

async function fetchFileSize(url) {
  try {
    // Make HEAD request to get Content-Length
    const response = await axios.head(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      },
      timeout: 5000,
      maxRedirects: 5,
    });
    
    const contentLength = response.headers['content-length'];
    if (contentLength) {
      const bytes = parseInt(contentLength);
      return formatBytes(bytes);
    }
  } catch (e) {
    // HEAD request failed, ignore
  }
  return null;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function estimateFileSize(quality, format) {
  // Estimate file size based on quality (assuming ~10 min video)
  // These are rough estimates for better UX
  const estimates = {
    '2160p': '~1.8 GB',
    '1440p': '~1.2 GB',
    '1080p': '~800 MB',
    '720p': '~400 MB',
    '480p': '~200 MB',
    '360p': '~100 MB',
    '240p': '~50 MB',
    'HD': '~500 MB',
  };
  
  // For HLS/DASH streams, show "Streaming"
  if (format === 'm3u8' || format === 'mpd') {
    return 'Streaming';
  }
  
  return estimates[quality] || '~300 MB';
}

module.exports = { extractUniversal };
