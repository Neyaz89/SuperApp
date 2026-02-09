const axios = require('axios');
const cloudscraper = require('cloudscraper');

/**
 * TeraDL API Extractor with Cloudflare Bypass
 * Uses cloudscraper to bypass Cloudflare protection
 */

async function extractWithTeraDL(url) {
  console.log('🔵 HNN Workers API: Starting extraction with Cloudflare bypass...');
  console.log('🔗 URL:', url);
  
  try {
    // Extract share ID from URL
    const shareIdMatch = url.match(/\/s\/([a-zA-Z0-9_-]+)/);
    if (!shareIdMatch) {
      throw new Error('Invalid Terabox URL - could not extract share ID');
    }
    const shareId = shareIdMatch[1];
    console.log('📋 Share ID:', shareId);
    
    // Step 1: Get file info using cloudscraper
    const infoUrl = `https://terabox.hnn.workers.dev/api/get-info?shorturl=${shareId}&pwd=`;
    console.log('📡 Step 1: Getting file info with Cloudflare bypass...');
    
    const infoResponse = await cloudscraper.get(infoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://terabox.hnn.workers.dev/',
        'Origin': 'https://terabox.hnn.workers.dev'
      }
    });
    
    console.log('📊 Info response received');
    
    const fileInfo = typeof infoResponse === 'string' ? JSON.parse(infoResponse) : infoResponse;
    
    if (!fileInfo || !fileInfo.list || fileInfo.list.length === 0) {
      throw new Error('No file info found');
    }
    
    const file = fileInfo.list[0];
    console.log('✅ File info retrieved:', file.server_filename);
    
    // Step 2: Get download link using cloudscraper
    const downloadUrl = 'https://terabox.hnn.workers.dev/api/get-download';
    console.log('📡 Step 2: Getting download link with Cloudflare bypass...');
    
    const downloadPayload = {
      shareid: fileInfo.shareid,
      uk: fileInfo.uk,
      sign: fileInfo.sign,
      timestamp: fileInfo.timestamp,
      fs_id: file.fs_id
    };
    
    const downloadResponse = await cloudscraper.post(downloadUrl, {
      json: downloadPayload,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://terabox.hnn.workers.dev/',
        'Origin': 'https://terabox.hnn.workers.dev'
      }
    });
    
    console.log('📊 Download response received');
    
    const downloadData = typeof downloadResponse === 'string' ? JSON.parse(downloadResponse) : downloadResponse;
    
    if (!downloadData || !downloadData.downloadLink) {
      throw new Error('No download link in response');
    }
    
    const downloadLink = downloadData.downloadLink;
    console.log('✅ SUCCESS! Got download link with Cloudflare bypass');
    
    const fileSize = file.size || 0;
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    
    return {
      title: file.server_filename || 'Terabox File',
      thumbnail: file.thumbs?.url3 || file.thumbs?.url2 || 'https://via.placeholder.com/640x360',
      duration: '0:00',
      qualities: [
        {
          quality: 'Original',
          format: file.server_filename?.split('.').pop()?.toLowerCase() || 'mp4',
          size: `${sizeMB} MB`,
          url: downloadLink,
          hasAudio: true,
          hasVideo: true,
          needsProxy: false
        }
      ],
      audioFormats: [],
      platform: 'terabox',
      extractionMethod: 'hnn-workers-api-cloudscraper'
    };
    
  } catch (error) {
    console.error('❌ HNN Workers API extraction failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data).substring(0, 200));
    }
    
    throw error;
  }
}

module.exports = { extractWithTeraDL };
