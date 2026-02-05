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
  
  // Extract share ID from URL - handle both /s/ and direct share URLs
  let shareId = '';
  const patterns = [
    /\/s\/([a-zA-Z0-9_-]+)/,  // /s/1qp35pIpbJKDRroew5fELNQ
    /surl=([a-zA-Z0-9_-]+)/,   // ?surl=1qp35pIpbJKDRroew5fELNQ
    /terabox(?:app)?\.com\/([a-zA-Z0-9_-]+)/ // teraboxapp.com/1qp35pIpbJKDRroew5fELNQ
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      shareId = match[1];
      break;
    }
  }
  
  if (!shareId) {
    throw new Error('Invalid Terabox URL format - could not extract share ID');
  }
  
  console.log('Share ID:', shareId);
  
  // Try each API
  for (const api of TERABOX_APIS) {
    try {
      console.log(`⏳ Trying ${api.name}...`);
      
      // Step 1: Get file info
      const apiUrl = `${api.url}?shorturl=${shareId}&pwd=`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 20000
      });
      
      if (!response.ok) {
        console.log(`❌ ${api.name} returned ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log('File info response:', JSON.stringify(data).substring(0, 200));
      
      // Check if we got file info
      if (!data.list || data.list.length === 0) {
        console.log(`❌ ${api.name} returned no files`);
        continue;
      }
      
      const fileInfo = data.list[0];
      console.log('File name:', fileInfo.server_filename);
      
      // Step 2: Get download link
      const downloadApiUrl = api.url.replace('/get-info', '/get-download');
      
      const downloadPayload = {
        shareid: data.shareid,
        uk: data.uk,
        sign: data.sign,
        timestamp: data.timestamp,
        fs_id: fileInfo.fs_id
      };
      
      console.log('Download payload:', downloadPayload);
      
      const downloadResponse = await fetch(downloadApiUrl, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Content-Type': 'application/json',
          'Origin': 'https://terabox.hnn.workers.dev',
          'Referer': 'https://terabox.hnn.workers.dev/'
        },
        body: JSON.stringify(downloadPayload),
        timeout: 20000
      });
      
      if (!downloadResponse.ok) {
        console.log(`❌ ${api.name} download API returned ${downloadResponse.status}`);
        const errorText = await downloadResponse.text();
        console.log('Error response:', errorText.substring(0, 200));
        continue;
      }
      
      const downloadData = await downloadResponse.json();
      console.log('Download response:', JSON.stringify(downloadData).substring(0, 200));
      
      const downloadLink = downloadData.downloadLink;
      
      if (!downloadLink) {
        console.log(`❌ ${api.name} returned no download link`);
        continue;
      }
      
      console.log(`✅ ${api.name} succeeded!`);
      console.log('Download link:', downloadLink.substring(0, 100) + '...');
      
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
