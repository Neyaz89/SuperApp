// Terabox Working Extractor - Uses reliable third-party service
const axios = require('axios');

async function extractTeraboxWorking(url) {
  console.log('🔵 Terabox Working: Using reliable extraction service...');
  
  // Extract share ID
  const shareIdMatch = url.match(/\/s\/([a-zA-Z0-9_-]+)/);
  const shareId = shareIdMatch ? shareIdMatch[1] : null;
  
  if (!shareId) {
    throw new Error('Could not extract share ID from URL');
  }
  
  console.log('📋 Share ID:', shareId);
  
  // Working Terabox APIs that actually work
  const workingAPIs = [
    {
      name: 'Terabox Downloader (teraboxdownloader.online)',
      url: 'https://teraboxdownloader.online/api/download',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://teraboxdownloader.online',
        'Referer': 'https://teraboxdownloader.online/'
      },
      body: { url: url },
      parse: (data) => {
        if (data.downloadLink || data.download_link) {
          return {
            title: data.fileName || data.filename || 'Terabox File',
            downloadUrl: data.downloadLink || data.download_link,
            thumbnail: data.thumbnail,
            size: data.fileSize || data.size
          };
        }
        return null;
      }
    },
    {
      name: 'Terabox API (getterabox.com)',
      url: `https://getterabox.com/api/download?url=${encodeURIComponent(url)}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://getterabox.com/'
      },
      body: null,
      parse: (data) => {
        if (data.url || data.downloadUrl) {
          return {
            title: data.name || data.filename || 'Terabox File',
            downloadUrl: data.url || data.downloadUrl,
            thumbnail: data.thumbnail,
            size: data.size
          };
        }
        return null;
      }
    },
    {
      name: 'Terabox Direct (terabox-dl.com)',
      url: 'https://terabox-dl.com/api/get-link',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      body: { shorturl: shareId },
      parse: (data) => {
        if (data.dlink || data.downloadLink) {
          return {
            title: data.server_filename || data.filename || 'Terabox File',
            downloadUrl: data.dlink || data.downloadLink,
            thumbnail: data.thumbnail,
            size: data.size
          };
        }
        return null;
      }
    }
  ];

  // Try each working API
  for (const api of workingAPIs) {
    try {
      console.log(`⏳ Trying ${api.name}...`);
      
      const config = {
        method: api.method,
        url: api.url,
        headers: api.headers,
        timeout: 30000,
        validateStatus: (status) => status < 500
      };

      if (api.method === 'POST' && api.body) {
        config.data = api.body;
      }

      const response = await axios(config);
      
      console.log(`Response status: ${response.status}`);
      
      if (response.status !== 200) {
        console.log(`❌ ${api.name} returned status ${response.status}`);
        continue;
      }

      const result = api.parse(response.data);

      if (result && result.downloadUrl) {
        console.log(`✅ ${api.name} succeeded!`);
        console.log('📥 Download URL found');
        
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
              format: result.title.split('.').pop() || 'mp4',
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

  throw new Error('All working Terabox APIs failed');
}

module.exports = { extractTeraboxWorking };
