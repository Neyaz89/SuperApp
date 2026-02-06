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

    const html = response.data;
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
      // Direct video files
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

    // Convert Set to Array and create qualities
    const uniqueUrls = Array.from(videoUrls);
    
    if (uniqueUrls.length === 0) {
      throw new Error('No video URLs found on page');
    }

    console.log(`✅ Universal Scraper found ${uniqueUrls.length} video URL(s)`);

    // Create quality entries
    uniqueUrls.forEach((videoUrl, index) => {
      const quality = guessQuality(videoUrl);
      const format = guessFormat(videoUrl);
      
      qualities.push({
        quality: quality || `Video ${index + 1}`,
        format: format,
        size: 'Unknown',
        url: videoUrl,
        hasAudio: true,
        hasVideo: true,
      });
    });

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
    };

  } catch (error) {
    console.error('❌ Universal Scraper failed:', error.message);
    throw error;
  }
}

function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  const lowerUrl = url.toLowerCase();
  
  // Check for video file extensions
  if (/\.(mp4|webm|m4v|mov|avi|mkv|flv|wmv|m3u8|mpd)(\?|$)/i.test(lowerUrl)) {
    return true;
  }
  
  // Check for common video CDN patterns
  if (/(?:video|media|cdn|stream|player)/i.test(lowerUrl)) {
    return true;
  }
  
  // Exclude common non-video URLs
  if (/\.(jpg|jpeg|png|gif|svg|css|js|json|xml|txt|html)(\?|$)/i.test(lowerUrl)) {
    return false;
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
  if (/1080p|1920x1080|fullhd|fhd/i.test(lowerUrl)) return '1080p';
  if (/720p|1280x720|hd/i.test(lowerUrl)) return '720p';
  if (/480p|854x480|sd/i.test(lowerUrl)) return '480p';
  if (/360p|640x360/i.test(lowerUrl)) return '360p';
  if (/240p|426x240/i.test(lowerUrl)) return '240p';
  
  // Check for quality in filename
  const match = url.match(/(\d{3,4})p/i);
  if (match) return match[1] + 'p';
  
  return 'Unknown';
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

module.exports = { extractUniversal };
