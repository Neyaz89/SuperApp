// Cobalt API Extractor - Free, reliable, supports 20+ platforms
const fetch = require('node-fetch');

const COBALT_API = 'https://api.cobalt.tools/api/json';

async function extractWithCobalt(url) {
  console.log('🔵 Cobalt: Starting extraction...');
  
  try {
    const response = await fetch(COBALT_API, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        url: url,
        videoQuality: '1080',
        audioFormat: 'mp3',
        filenameStyle: 'basic',
        downloadMode: 'auto'
      }),
      timeout: 15000
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cobalt error response:', errorText);
      throw new Error(`Cobalt API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('Cobalt response status:', data.status);

    // Handle different response types
    if (data.status === 'error') {
      throw new Error(data.error?.code || 'Cobalt extraction failed');
    }

    if (data.status === 'redirect' || data.status === 'tunnel') {
      return formatCobaltResponse(data, url);
    }

    if (data.status === 'picker') {
      // Multiple media items (like Instagram carousel)
      return formatCobaltPickerResponse(data, url);
    }

    throw new Error('Unexpected Cobalt response format');
    
  } catch (error) {
    console.error('❌ Cobalt failed:', error.message);
    throw error;
  }
}

function formatCobaltResponse(data, originalUrl) {
  const result = {
    title: data.filename || 'Video',
    thumbnail: 'https://via.placeholder.com/640x360',
    duration: 'Unknown',
    qualities: [],
    audioFormats: []
  };

  // Video URL
  if (data.url) {
    result.qualities.push({
      quality: '1080p',
      format: 'mp4',
      size: 'Unknown',
      url: data.url
    });
    result.qualities.push({
      quality: '720p',
      format: 'mp4',
      size: 'Unknown',
      url: data.url
    });
    result.qualities.push({
      quality: '480p',
      format: 'mp4',
      size: 'Unknown',
      url: data.url
    });
  }

  // Audio URL
  if (data.audio) {
    result.audioFormats.push({
      quality: '320kbps',
      format: 'mp3',
      size: 'Unknown',
      url: data.audio
    });
  }

  console.log('✅ Cobalt extraction successful');
  return result;
}

function formatCobaltPickerResponse(data, originalUrl) {
  const result = {
    title: 'Media Collection',
    thumbnail: data.picker?.[0]?.thumb || 'https://via.placeholder.com/640x360',
    duration: 'Unknown',
    qualities: [],
    audioFormats: []
  };

  // Add all picker items as qualities
  if (data.picker && Array.isArray(data.picker)) {
    data.picker.forEach((item, index) => {
      if (item.url) {
        result.qualities.push({
          quality: `Item ${index + 1}`,
          format: item.type === 'photo' ? 'jpg' : 'mp4',
          size: 'Unknown',
          url: item.url
        });
      }
    });
  }

  // Audio if available
  if (data.audio) {
    result.audioFormats.push({
      quality: '320kbps',
      format: 'mp3',
      size: 'Unknown',
      url: data.audio
    });
  }

  console.log('✅ Cobalt picker extraction successful');
  return result;
}

module.exports = { extractWithCobalt };
