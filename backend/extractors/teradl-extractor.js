const axios = require('axios');

/**
 * TeraDL API Extractor
 * Uses the proven TeraDL API from https://github.com/Dapunta/TeraDL
 * API: https://teradl-api.dapuntaratya.com/
 */

async function extractWithTeraDL(url) {
  console.log('🔵 TeraDL: Starting extraction...');
  console.log('🔗 URL:', url);
  
  try {
    // TeraDL API endpoint
    const apiUrl = 'https://teradl-api.dapuntaratya.com/generate';
    
    console.log('📡 Calling TeraDL API:', apiUrl);
    
    const response = await axios.post(apiUrl, {
      url: url
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://teradl.dapuntaratya.com',
        'Referer': 'https://teradl.dapuntaratya.com/'
      }
    });
    
    console.log('📊 TeraDL response status:', response.status);
    console.log('📊 TeraDL response data:', JSON.stringify(response.data).substring(0, 300));
    
    const data = response.data;
    
    // Check if extraction was successful
    if (!data || data.status !== 'success') {
      const errorMsg = data?.message || 'Unknown error';
      console.error('❌ TeraDL API returned error:', errorMsg);
      throw new Error(`TeraDL API error: ${errorMsg}`);
    }
    
    // Extract file information
    const fileInfo = data.data;
    
    if (!fileInfo || !fileInfo.download_url) {
      console.error('❌ No download URL in TeraDL response');
      throw new Error('No download URL found');
    }
    
    console.log('✅ TeraDL SUCCESS!');
    console.log('📁 File:', fileInfo.file_name);
    console.log('📏 Size:', fileInfo.file_size);
    console.log('🔗 Download URL:', fileInfo.download_url.substring(0, 100) + '...');
    
    // Parse file size
    const fileSizeStr = fileInfo.file_size || '0 MB';
    const sizeMatch = fileSizeStr.match(/([\d.]+)\s*(MB|GB|KB)/i);
    let sizeMB = 'Unknown';
    
    if (sizeMatch) {
      const value = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2].toUpperCase();
      
      if (unit === 'GB') {
        sizeMB = (value * 1024).toFixed(2);
      } else if (unit === 'MB') {
        sizeMB = value.toFixed(2);
      } else if (unit === 'KB') {
        sizeMB = (value / 1024).toFixed(2);
      }
      sizeMB = `${sizeMB} MB`;
    }
    
    // Get file extension
    const fileName = fileInfo.file_name || 'Terabox File';
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'mp4';
    
    return {
      title: fileName,
      thumbnail: fileInfo.thumbnail || 'https://via.placeholder.com/640x360',
      duration: '0:00',
      qualities: [
        {
          quality: 'Original',
          format: fileExt,
          size: sizeMB,
          url: fileInfo.download_url,
          hasAudio: true,
          hasVideo: true,
          needsProxy: false // TeraDL provides direct download links
        }
      ],
      audioFormats: [],
      platform: 'terabox',
      extractionMethod: 'teradl-api'
    };
    
  } catch (error) {
    console.error('❌ TeraDL extraction failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data).substring(0, 200));
    }
    
    throw error;
  }
}

module.exports = { extractWithTeraDL };
