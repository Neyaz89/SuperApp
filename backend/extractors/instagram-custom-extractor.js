// Custom Instagram Extractor - Direct GraphQL API access
const fetch = require('node-fetch');

async function extractInstagramCustom(url) {
  console.log('📸 Instagram Custom: Starting extraction...');
  
  try {
    const shortcode = extractShortcode(url);
    if (!shortcode) {
      throw new Error('Invalid Instagram URL');
    }

    // Method 1: Try public API endpoint
    const apiUrl = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 15000
    });

    if (!response.ok) {
      // Method 2: Try scraping HTML
      return await extractFromHTML(shortcode);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('No data in Instagram response');
    }

    return formatInstagramResponse(data.items[0]);
    
  } catch (error) {
    console.error('❌ Instagram Custom failed:', error.message);
    throw error;
  }
}

async function extractFromHTML(shortcode) {
  console.log('📸 Instagram: Trying HTML extraction...');
  
  const url = `https://www.instagram.com/p/${shortcode}/`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const html = await response.text();
  
  // Extract JSON data from HTML
  const scriptMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  if (scriptMatch) {
    const jsonData = JSON.parse(scriptMatch[1]);
    
    return {
      title: jsonData.caption || 'Instagram Video',
      thumbnail: jsonData.thumbnailUrl || 'https://via.placeholder.com/640x360',
      duration: 'Unknown',
      qualities: [{
        quality: '720p',
        format: 'mp4',
        size: 'Unknown',
        url: jsonData.contentUrl || jsonData.video?.contentUrl
      }],
      audioFormats: []
    };
  }

  // Try alternative extraction
  const videoMatch = html.match(/"video_url":"([^"]+)"/);
  const thumbnailMatch = html.match(/"display_url":"([^"]+)"/);
  
  if (videoMatch) {
    return {
      title: 'Instagram Video',
      thumbnail: thumbnailMatch ? thumbnailMatch[1].replace(/\\u0026/g, '&') : 'https://via.placeholder.com/640x360',
      duration: 'Unknown',
      qualities: [{
        quality: '720p',
        format: 'mp4',
        size: 'Unknown',
        url: videoMatch[1].replace(/\\u0026/g, '&')
      }],
      audioFormats: []
    };
  }

  throw new Error('Could not extract video from Instagram');
}

function extractShortcode(url) {
  const patterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/tv\/([A-Za-z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function formatInstagramResponse(item) {
  const result = {
    title: item.caption?.text || 'Instagram Video',
    thumbnail: item.image_versions2?.candidates?.[0]?.url || 'https://via.placeholder.com/640x360',
    duration: 'Unknown',
    qualities: [],
    audioFormats: []
  };

  // Video versions
  if (item.video_versions && item.video_versions.length > 0) {
    item.video_versions.forEach(video => {
      result.qualities.push({
        quality: `${video.height}p`,
        format: 'mp4',
        size: 'Unknown',
        url: video.url
      });
    });
  }

  // Carousel media
  if (item.carousel_media) {
    item.carousel_media.forEach(media => {
      if (media.video_versions) {
        media.video_versions.forEach(video => {
          result.qualities.push({
            quality: `${video.height}p`,
            format: 'mp4',
            size: 'Unknown',
            url: video.url
          });
        });
      }
    });
  }

  console.log('✅ Instagram Custom extraction successful');
  return result;
}

module.exports = { extractInstagramCustom };
