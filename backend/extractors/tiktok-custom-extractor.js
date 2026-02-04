// Custom TikTok Extractor - Multiple methods for maximum reliability
const fetch = require('node-fetch');

async function extractTikTokCustom(url) {
  console.log('🎵 TikTok Custom: Starting extraction...');
  
  try {
    // Method 1: Try direct API
    const videoId = await getVideoId(url);
    if (!videoId) {
      throw new Error('Invalid TikTok URL');
    }

    // Method 2: Use TikTok's web API
    const apiUrl = `https://www.tiktok.com/api/item/detail/?itemId=${videoId}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.tiktok.com/',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    if (response.ok) {
      const data = await response.json();
      if (data.itemInfo?.itemStruct) {
        return formatTikTokResponse(data.itemInfo.itemStruct);
      }
    }

    // Method 3: Scrape from HTML
    return await extractFromHTML(url);
    
  } catch (error) {
    console.error('❌ TikTok Custom failed:', error.message);
    throw error;
  }
}

async function getVideoId(url) {
  // If URL contains video ID directly
  const idMatch = url.match(/\/video\/(\d+)/);
  if (idMatch) return idMatch[1];

  // If it's a short URL, follow redirect
  if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const finalUrl = response.url;
      const match = finalUrl.match(/\/video\/(\d+)/);
      if (match) return match[1];
    } catch (e) {
      console.log('Failed to resolve short URL');
    }
  }

  return null;
}

async function extractFromHTML(url) {
  console.log('🎵 TikTok: Trying HTML extraction...');
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const html = await response.text();
  
  // Extract JSON data from script tag
  const scriptMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.*?)<\/script>/);
  
  if (scriptMatch) {
    const jsonData = JSON.parse(scriptMatch[1]);
    const videoData = jsonData.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
    
    if (videoData) {
      return formatTikTokResponse(videoData);
    }
  }

  // Alternative: Look for video URL in HTML
  const videoMatch = html.match(/"downloadAddr":"([^"]+)"/);
  const thumbnailMatch = html.match(/"cover":"([^"]+)"/);
  
  if (videoMatch) {
    return {
      title: 'TikTok Video',
      thumbnail: thumbnailMatch ? thumbnailMatch[1].replace(/\\u002F/g, '/') : 'https://via.placeholder.com/640x360',
      duration: 'Unknown',
      qualities: [{
        quality: '720p',
        format: 'mp4',
        size: 'Unknown',
        url: videoMatch[1].replace(/\\u002F/g, '/')
      }],
      audioFormats: []
    };
  }

  throw new Error('Could not extract video from TikTok');
}

function formatTikTokResponse(data) {
  const video = data.video;
  const author = data.author;
  
  const result = {
    title: data.desc || `TikTok by @${author?.uniqueId || 'user'}`,
    thumbnail: video?.cover || video?.dynamicCover || 'https://via.placeholder.com/640x360',
    duration: video?.duration ? `${Math.floor(video.duration)}s` : 'Unknown',
    qualities: [],
    audioFormats: []
  };

  // Download URL (no watermark)
  if (video?.downloadAddr) {
    result.qualities.push({
      quality: '720p (No Watermark)',
      format: 'mp4',
      size: 'Unknown',
      url: video.downloadAddr
    });
  }

  // Play URL (with watermark)
  if (video?.playAddr) {
    result.qualities.push({
      quality: '720p',
      format: 'mp4',
      size: 'Unknown',
      url: video.playAddr
    });
  }

  // HD URL
  if (video?.bitrateInfo) {
    video.bitrateInfo.forEach(bitrate => {
      if (bitrate.PlayAddr?.UrlList?.[0]) {
        result.qualities.push({
          quality: `${bitrate.GearName || 'HD'}`,
          format: 'mp4',
          size: 'Unknown',
          url: bitrate.PlayAddr.UrlList[0]
        });
      }
    });
  }

  // Music/Audio
  if (data.music?.playUrl) {
    result.audioFormats.push({
      quality: '128kbps',
      format: 'mp3',
      size: 'Unknown',
      url: data.music.playUrl
    });
  }

  console.log('✅ TikTok Custom extraction successful');
  return result;
}

module.exports = { extractTikTokCustom };
