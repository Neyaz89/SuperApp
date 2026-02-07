// Terabox Public API Extractor - Uses third-party Terabox downloader APIs
const axios = require('axios');

async function extractTeraboxPublicAPI(url) {
  console.log('🔵 Terabox Public API: Starting extraction...');
  
  // List of public Terabox downloader APIs
  const apis = [
    {
      name: 'TeraboxVideoDownloader API',
      url: 'https://teraboxvideodownloader.com/api/get-info',
      method: 'POST',
      format: (url) => ({ url: url }),
      parse: (data) => {
        if (data.status === 'success' && data.data) {
          return {
            title: data.data.title || 'Terabox File',
            downloadUrl: data.data.download_url || data.data.url,
            thumbnail: data.data.thumbnail,
            size: data.data.size
          };
        }
        return null;
      }
    },
    {
      name: 'Terabox Downloader API v2',
      url: 'https://api.teraboxdownloader.com/download',
      method: 'POST',
      format: (url) => ({ link: url }),
      parse: (data) => {
        if (data.success && data.download_link) {
          return {
            title: data.file_name || 'Terabox File',
            downloadUrl: data.download_link,
            thumbnail: data.thumbnail,
            size: data.file_size
          };
        }
        return null;
      }
    },
    {
      name: 'Terabox Direct API',
      url: 'https://terabox-dl.qtcloud.workers.dev/api/get-info',
      method: 'GET',
      format: (url) => ({ url: url }),
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
    }
  ];

  // Try each API
  for (const api of apis) {
    try {
      console.log(`⏳ Trying ${api.name}...`);
      
      const config = {
        method: api.method,
        url: api.url,
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };

      if (api.method === 'POST') {
        config.data = api.format(url);
      } else {
        config.params = api.format(url);
      }

      const response = await axios(config);
      const result = api.parse(response.data);

      if (result && result.downloadUrl) {
        console.log(`✅ ${api.name} succeeded!`);
        
        // Format file size
        let sizeFormatted = 'Unknown';
        if (result.size) {
          if (typeof result.size === 'number') {
            sizeFormatted = (result.size / (1024 * 1024)).toFixed(2) + ' MB';
          } else {
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
