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
      },
      body: JSON.stringify({
        url: url,
        vQuality: '1080',
        filenamePattern: 'basic',
        isAudioOnly: false,
        disableMetadata: false
      }),
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`Cobalt API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('Cobalt response:', data);

    // Cobalt returns different response formats
    if (data.status === 'error' || data.status === 'rate-limit') {
      throw new Error(data.text || 'Cobalt extraction failed');
    }

    // Success - format the response
    if (data.status === 'redirect' || data.status === 'stream') {
      return formatCobaltResponse(data, url);
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
    thumbnail: data.thumb || 'https://via.placeholder.com/640x360',
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

module.exports = { extractWithCobalt };
