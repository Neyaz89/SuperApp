// SaveFrom.net API Extractor - Supports YouTube, Facebook, Vimeo, etc.
const fetch = require('node-fetch');

const SAVEFROM_API = 'https://api.savefrom.net/info';

async function extractWithSaveFrom(url) {
  console.log('🟢 SaveFrom: Starting extraction...');
  
  try {
    const apiUrl = `${SAVEFROM_API}?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`SaveFrom API returned ${response.status}`);
    }

    const text = await response.text();
    
    // SaveFrom returns JSONP, need to parse it
    const jsonMatch = text.match(/\[{.*}\]/);
    if (!jsonMatch) {
      throw new Error('Invalid SaveFrom response format');
    }

    const data = JSON.parse(jsonMatch[0]);
    console.log('SaveFrom response:', data);

    if (!data || data.length === 0) {
      throw new Error('No data from SaveFrom');
    }

    return formatSaveFromResponse(data[0]);
    
  } catch (error) {
    console.error('❌ SaveFrom failed:', error.message);
    throw error;
  }
}

function formatSaveFromResponse(data) {
  const result = {
    title: data.meta?.title || 'Video',
    thumbnail: data.meta?.image || 'https://via.placeholder.com/640x360',
    duration: data.meta?.duration || 'Unknown',
    qualities: [],
    audioFormats: []
  };

  // Extract video qualities
  if (data.url && Array.isArray(data.url)) {
    data.url.forEach(format => {
      if (format.type === 'video') {
        result.qualities.push({
          quality: format.quality || format.name || 'Unknown',
          format: format.ext || 'mp4',
          size: format.size || 'Unknown',
          url: format.url
        });
      } else if (format.type === 'audio') {
        result.audioFormats.push({
          quality: format.quality || '128kbps',
          format: format.ext || 'mp3',
          size: format.size || 'Unknown',
          url: format.url
        });
      }
    });
  }

  console.log('✅ SaveFrom extraction successful');
  return result;
}

module.exports = { extractWithSaveFrom };
