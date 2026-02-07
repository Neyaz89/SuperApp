// Terabox Public API Extractor - Uses third-party Terabox downloader APIs
const axios = require('axios');

async function extractTeraboxPublicAPI(url) {
  console.log('🔵 Terabox Public API: Starting extraction...');
  
  // Extract share ID from URL
  const shareIdMatch = url.match(/\/s\/([a-zA-Z0-9_-]+)/);
  const shareId = shareIdMatch ? shareIdMatch[1] : null;
  
  if (!shareId) {
    throw new Error('Could not extract share ID from URL');
  }
  
  console.log('📋 Share ID:', shareId);
  
  // List of working public Terabox downloader APIs
  const apis = [
    {
      name: 'Terabox Downloader API (Primary)',
      url: 'https://terabox-downloader.vercel.app/api/download',
      method: 'POST',
      format: (url) => ({ url: url }),
      parse: (data) => {
        if (data.response && data.response.length > 0) {
          const file = data.response[0];
          return {
            title: file.filename || 'Terabox File',
            downloadUrl: file.downloadLink || file.download_link,
            thumbnail: file.thumbnail,
            size: file.size
          };
        }
        return null;
      }
    },
    {
      name: 'Terabox API v2',
      url: `https://api-terabox.vercel.app/api/download?url=${encodeURIComponent(url)}`,
      method: 'GET',
      format: () => ({}),
      parse: (data) => {
        if (data.success && data.downloadUrl) {
          return {
            title: data.fileName || 'Terabox File',
            downloadUrl: data.downloadUrl,
            thumbnail: data.thumbnail,
            size: data.fileSize
          };
        }
        return null;
      }
    },
    {
      name: 'Terabox Direct Link API',
      url: 'https://terabox.hnn.workers.dev/api/get-download',
      method: 'POST',
      format: (url) => ({ shorturl: shareId }),
      parse: (data) => {
        if (data.ok && data.downloadLink) {
          return {
            title: data.fileName || 'Terabox File',
            downloadUrl: data.downloadLink,
            thumbnail: data.thumbnail,
            size: data.fileSize
          };
        }
        return null;
      }
    },
    {
      name: 'Terabox Nephobox API',
      url: `https://nephobox.com/api/download?url=${encodeURIComponent(url)}`,
      method: 'GET',
      format: () => ({}),
      parse: (data) => {
        if (data.downloadUrl || data.download_url) {
          return {
            title: data.filename || data.fileName || 'Terabox File',
            downloadUrl: data.downloadUrl || data.download_url,
            thumbnail: data.thumbnail,
            size: data.size || data.fileSize
          };
        }
        return null;
      }
    }
  ];

  // Try each API
  for (const api of apis) {
    try {
      console.log(`⏳ Trying ${api.name}...`);
      
      const config = {
        method: api.method,
        url: api.url,
        timeout: 20000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        validateStatus: (status) => status < 500
      };

      if (api.method === 'POST') {
        config.data = api.format(url);
      }

      const response = await axios(config);
      
      // Check if response is valid
      if (response.status !== 200) {
        console.log(`❌ ${api.name} returned status ${response.status}`);
        continue;
      }

      const result = api.parse(response.data);

      if (result && result.downloadUrl) {
        console.log(`✅ ${api.name} succeeded!`);
        console.log('📥 Download URL:', result.downloadUrl.substring(0, 100) + '...');
        
        // Format file size
        let sizeFormatted = 'Unknown';
        if (result.size) {
          if (typeof result.size === 'number') {
            sizeFormatted = (result.size / (1024 * 1024)).toFixed(2) + ' MB';
          } else if (typeof result.size === 'string') {
            sizeFormatted = result.size;
          }
        }

        return {
          title: result.title,
          thumbnail: result.thumbnail || 'https://via.placeholder.com/640x360',
          duration: '0:00',
          qualities: [
            {
              quality: 'Original',
              format: 'mp4',
              size: sizeFormatted,
              url: result.downloadUrl,
              hasAudio: true,
              hasVideo: true,
              needsProxy: false
            }
          ],
          audioFormats: [],
          platform: 'terabox',
          extractionMethod: api.name
        };
      }

      console.log(`❌ ${api.name} returned no download link`);
      
    } catch (error) {
      console.log(`❌ ${api.name} failed:`, error.message);
      continue;
    }
  }

  throw new Error('All Terabox public APIs failed');
}

module.exports = { extractTeraboxPublicAPI };
