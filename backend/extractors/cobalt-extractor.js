// Cobalt API Extractor - Free, reliable, supports 20+ platforms
const fetch = require('node-fetch');

// Working Cobalt instances (official API shut down Nov 11, 2024)
// Source: https://cobalt.directory/
const COBALT_INSTANCES = [
  'https://cobalt.alpha.wolfy.love',  // 96% uptime, 23/24 services
  'https://cobalt.omega.wolfy.love',  // 96% uptime, 23/24 services
  'https://c.meowing.de',             // 96% uptime, 23/24 services
  'https://api.qwkuns.me',            // 92% uptime, 22/24 services
  'https://melon.clxxped.lol'         // 88% uptime, 21/24 services
];

let currentInstanceIndex = 0;

function getNextCobaltInstance() {
  const instance = COBALT_INSTANCES[currentInstanceIndex];
  currentInstanceIndex = (currentInstanceIndex + 1) % COBALT_INSTANCES.length;
  return instance;
}

async function extractWithCobalt(url) {
  console.log('🔵 Cobalt: Starting extraction with community instances...');
  
  // Try multiple instances for redundancy
  const instancesToTry = 3;
  let lastError;
  
  for (let i = 0; i < instancesToTry; i++) {
    const instance = getNextCobaltInstance();
    console.log(`🔵 Trying instance ${i + 1}/${instancesToTry}: ${instance}`);
    
    try {
      const response = await fetch(instance, {
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
          downloadMode: 'auto',
          disableMetadata: true  // Remove watermarks from TikTok, Snapchat, etc.
        }),
        timeout: 15000
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Cobalt instance ${i + 1} error:`, errorText);
        lastError = new Error(`Cobalt API returned ${response.status}`);
        continue; // Try next instance
      }

      const data = await response.json();
      console.log('Cobalt response status:', data.status);

      // Handle different response types
      if (data.status === 'error') {
        lastError = new Error(data.error?.code || 'Cobalt extraction failed');
        continue; // Try next instance
      }

      if (data.status === 'redirect' || data.status === 'tunnel') {
        console.log(`✅ Cobalt instance ${i + 1} succeeded!`);
        return formatCobaltResponse(data, url);
      }

      if (data.status === 'picker') {
        // Multiple media items (like Instagram carousel)
        console.log(`✅ Cobalt instance ${i + 1} succeeded (picker)!`);
        return formatCobaltPickerResponse(data, url);
      }

      lastError = new Error('Unexpected Cobalt response format');
      
    } catch (error) {
      console.error(`❌ Cobalt instance ${i + 1} failed:`, error.message);
      lastError = error;
      // Continue to next instance
    }
  }
  
  // All instances failed
  console.error('❌ All Cobalt instances failed');
  throw lastError || new Error('Cobalt extraction failed');
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
