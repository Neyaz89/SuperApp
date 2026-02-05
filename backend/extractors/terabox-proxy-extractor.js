// Terabox Proxy Extractor - Uses working third-party services
const fetch = require('node-fetch');

// Working Terabox proxy services
const PROXY_SERVICES = [
  {
    name: 'TeraboxDL Service 1',
    getInfo: async (shareId) => {
      const url = `https://terabox-dl.qtcloud.workers.dev/api/get-info?shorturl=${shareId}&pwd=`;
      const response = await fetch(url, { timeout: 15000 });
      return response.json();
    },
    getDownload: async (data) => {
      const url = 'https://terabox-dl.qtcloud.workers.dev/api/get-download';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareid: data.shareid,
          uk: data.uk,
          sign: data.sign,
          timestamp: data.timestamp,
          fs_id: data.list[0].fs_id
        }),
        timeout: 15000
      });
      return response.json();
    }
  },
  {
    name: 'TeraboxDL Service 2',
    getInfo: async (shareId) => {
      const url = `https://terabox.hnn.workers.dev/api/get-info?shorturl=${shareId}&pwd=`;
      const response = await fetch(url, { timeout: 15000 });
      return response.json();
    },
    getDownload: async (data) => {
      const url = 'https://terabox.hnn.workers.dev/api/get-download';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareid: data.shareid,
          uk: data.uk,
          sign: data.sign,
          timestamp: data.timestamp,
          fs_id: data.list[0].fs_id
        }),
        timeout: 15000
      });
      return response.json();
    }
  }
];

async function extractTeraboxProxy(url) {
  console.log('🔵 Terabox Proxy: Starting extraction...');
  
  // Extract share ID
  let shareId = '';
  const patterns = [
    /\/s\/([a-zA-Z0-9_-]+)/,
    /surl=([a-zA-Z0-9_-]+)/,
    /terabox(?:app)?\.com\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      shareId = match[1];
      break;
    }
  }
  
  if (!shareId) {
    throw new Error('Invalid Terabox URL');
  }
  
  console.log('📋 Share ID:', shareId);
  
  // Try each proxy service
  for (const service of PROXY_SERVICES) {
    try {
      console.log(`⏳ Trying ${service.name}...`);
      
      // Get file info
      const infoData = await service.getInfo(shareId);
      
      if (!infoData.list || infoData.list.length === 0) {
        console.log(`❌ ${service.name}: No files found`);
        continue;
      }
      
      const fileInfo = infoData.list[0];
      console.log(`📄 File: ${fileInfo.server_filename}`);
      
      // Get download link
      const downloadData = await service.getDownload(infoData);
      
      if (!downloadData.downloadLink) {
        console.log(`❌ ${service.name}: No download link`);
        continue;
      }
      
      console.log(`✅ ${service.name} SUCCESS!`);
      
      const fileSize = fileInfo.size || 0;
      const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      
      return {
        title: fileInfo.server_filename || 'Terabox File',
        thumbnail: fileInfo.thumbs?.url3 || fileInfo.thumbs?.url2 || 'https://via.placeholder.com/640x360',
        duration: '0:00',
        qualities: [
          {
            quality: 'Original',
            format: fileInfo.server_filename?.split('.').pop() || 'mp4',
            size: `${sizeMB} MB`,
            url: downloadData.downloadLink
          }
        ],
        audioFormats: [],
        platform: 'terabox',
        extractionMethod: service.name
      };
      
    } catch (error) {
      console.log(`❌ ${service.name} failed:`, error.message);
      continue;
    }
  }
  
  throw new Error('All Terabox proxy services failed');
}

module.exports = { extractTeraboxProxy };
