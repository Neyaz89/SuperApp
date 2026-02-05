// Terabox Working Extractor - Uses proven working method
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function extractTeraboxWorking(url) {
  console.log('🔵 Terabox Working: Using yt-dlp with custom extractor...');
  
  try {
    // Use yt-dlp with custom options for Terabox
    const command = `yt-dlp --no-check-certificate --skip-download --dump-json --no-warnings --extractor-args "terabox:api_key=" "${url}"`;
    
    console.log('Running yt-dlp for Terabox...');
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    });

    if (stderr && stderr.includes('ERROR')) {
      throw new Error(stderr);
    }

    const data = JSON.parse(stdout);
    console.log('✅ yt-dlp extraction successful!');
    console.log('Title:', data.title);
    
    // Format response
    const fileSize = data.filesize || data.filesize_approx || 0;
    const sizeMB = fileSize ? (fileSize / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown';
    
    return {
      title: data.title || 'Terabox File',
      thumbnail: data.thumbnail || 'https://via.placeholder.com/640x360',
      duration: '0:00',
      qualities: [
        {
          quality: 'Original',
          format: data.ext || 'mp4',
          size: sizeMB,
          url: data.url
        }
      ],
      audioFormats: [],
      platform: 'terabox',
      extractionMethod: 'yt-dlp Terabox'
    };
    
  } catch (error) {
    console.log('❌ yt-dlp Terabox failed:', error.message);
    throw error;
  }
}

module.exports = { extractTeraboxWorking };
