// Terabox API Extractor - Using public APIs
const fetch = require('node-fetch');

// Working Terabox downloader APIs
const TERABOX_APIS = [
  {
    name: 'TeraboxDL API 1',
    url: 'https://terabox-dl.qtcloud.workers.dev/api/get-info',
    method: 'GET'
  },
  {
    name: 'TeraboxDL API 2', 
    url: 'https://terabox.hnn.workers.dev/api/get-info',
    method: 'GET'
  }
];

async function extractTeraboxAPI(url) {
  console.log('🔵 Terabox API: Starting extraction...');
  
  // Extract share ID from URL
  const shareIdMatch = url.match(/\/s\/([a-zA-Z0-9_-]+)/);
  if (!shareIdMatch) {
    throw new Error('Invalid Terabox URL format');
  }
  
  const shareId = shareIdMatch[1];
  console.log('Share ID:', shareId);
  
  // Try each API
  for (const api of TERABOX_APIS) {
    try {
      console.log(`⏳ Trying ${api.name}...`);
      
      const apiUrl = `${api.url}?shorturl=${shareId}&pwd=`;
      
      const response = await fetch(apiUrl, {
        method: api.method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 15000
      });
      
      if (!response.ok) {
        console.log(`❌ ${api.name} returned ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      // Check if we got file info
      if (!data.list || data.list.length === 0) {
        console.log(`❌ ${api.name} returned no files`);
        continue;
      }
      
      const fileInfo = data.list[0];
      
      // Get download link
      const downloadApiUrl = api.url.replace('/get-info', '/get-download');
      
      const downloadResponse = await fetch(downloadApiUrl, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shareid: data.shareid,
          uk: data.uk,
          sign: data.sign,
          timestamp: data.timestamp,
          fs_id: fileInfo.fs_id
        }),
        timeout: 15000
      });
      
      if (!downloadResponse.ok) {
        console.log(`❌ ${api.name} download API returned ${downloadResponse.status}`);
        continue;
      }
      
      const downloadData = await downloadResponse.json();
      const downloadLink = downloadData.downloadLink;
      
      if (!downloadLink) {
        console.log(`❌ ${api.name} returned no download link`);
        continue;
      }
      
      console.log(`✅ ${api.name} succeeded!`);
      
      // Format file size
      const fileSize = fileInfo.size || 0;
      const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      
      return {
        title: fileInfo.server_filename || 'Terabox File',
        thumbnail: (fileInfo.thumbs && fileInfo.thumbs.url3) || 'https://via.placeholder.com/640x360',
        duration: '0:00',
        qualities: [
          {
            quality: 'Original',
            format: fileInfo.server_filename?.split('.').pop() || 'mp4',
            size: `${sizeMB} MB`,
            url: downloadLink
          }
        ],
        audioFormats: [],
        platform: 'terabox',
        extractionMethod: api.name
      };
      
    } catch (error) {
      console.log(`❌ ${api.name} failed:`, error.message);
      continue;
    }
  }
  
  throw new Error('All Terabox APIs failed');
}

module.exports = { extractTeraboxAPI };
