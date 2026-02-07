const { exec } = require('child_process');
const { promisify } = require('util');
const axios = require('axios');

const execAsync = promisify(exec);

// Free proxy list - rotates automatically
const FREE_PROXIES = [
  'socks5://proxy.toolip.gr:4145',
  'socks5://198.8.94.170:4145',
  'socks5://72.195.34.58:4145',
  'socks5://184.178.172.25:15291',
  'socks5://72.210.252.134:46164',
  'socks5://184.178.172.17:4145',
  'socks5://72.195.34.59:4145',
  'socks5://72.195.34.60:27391',
  'socks5://184.178.172.26:4145',
  'socks5://72.210.221.223:4145'
];

let currentProxyIndex = 0;

function getNextProxy() {
  const proxy = FREE_PROXIES[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % FREE_PROXIES.length;
  return proxy;
}

module.exports = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('Extracting:', url);
    console.log('yt-dlp version: 2026.02.04');

    // Try yt-dlp first (supports 1000+ websites)
    try {
      const result = await extractWithYtDlp(url);
      
      // Check if this is a WebView instruction (Terabox)
      if (result && result.useWebView) {
        console.log('✅ Returning WebView instruction to client - skipping fallbacks');
        return res.json(result);
      }
      
      if (result && result.qualities && result.qualities.length > 0) {
        console.log(`✅ yt-dlp SUCCESS - Returning ${result.qualities.length} qualities to client`);
        console.log('Sample quality:', JSON.stringify(result.qualities[0]));
        return res.json(result);
      } else {
        console.log('yt-dlp returned empty qualities, trying fallbacks...');
      }
    } catch (e) {
      console.log('yt-dlp failed:', e.message);
      console.error('yt-dlp error stack:', e.stack);
    }

    // Fallback to API methods
    try {
      const fallbackResult = await extractWithFallbackAPIs(url);
      if (fallbackResult && fallbackResult.qualities && fallbackResult.qualities.length > 0) {
        console.log(`✅ API Fallback SUCCESS - Returning ${fallbackResult.qualities.length} qualities to client`);
        console.log('Sample quality:', JSON.stringify(fallbackResult.qualities[0]));
        return res.json(fallbackResult);
      } else {
        console.log('API fallbacks returned empty qualities, trying Universal Scraper...');
      }
    } catch (apiError) {
      console.log('API fallbacks failed:', apiError.message);
    }

    // Final fallback: Universal HTML scraper (tries to extract from ANY site)
    console.log('🌐 Trying Universal HTML Scraper as last resort...');
    const { extractUniversal } = require('../extractors/universal-scraper');
    const universalResult = await extractUniversal(url);
    
    // Check if we got valid results
    if (universalResult && universalResult.qualities && universalResult.qualities.length > 0) {
      console.log(`✅ Universal Scraper SUCCESS - Returning ${universalResult.qualities.length} video options to client`);
      console.log('Sample videos:', JSON.stringify(universalResult.qualities.slice(0, 3), null, 2));
      console.log('Full response being sent to client:', JSON.stringify({
        title: universalResult.title,
        qualityCount: universalResult.qualities.length,
        audioCount: universalResult.audioFormats.length
      }));
      return res.json(universalResult);
    }
    
    // If Universal Scraper also found nothing, return error
    console.log('❌ Universal Scraper found no videos');
    throw new Error('No video URLs found by any method');

  } catch (error) {
    console.error('❌ ALL extraction methods failed:', error.message);
    
    // Return graceful fallback only if ALL methods failed
    return res.json({
      title: 'Video',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '0:00',
      qualities: [],
      audioFormats: [],
      platform: detectPlatform(req.body.url),
      extractionFailed: true,
      message: 'Video extraction temporarily unavailable. Please try again.'
    });
  }
};

// Method 1: yt-dlp (Supports 1000+ websites) - PRODUCTION READY
async function extractWithYtDlp(url) {
  try {
    // Check if yt-dlp is installed
    try {
      const { stdout } = await execAsync('yt-dlp --version', { timeout: 5000 });
      console.log('yt-dlp version:', stdout.trim());
    } catch (e) {
      console.error('yt-dlp not installed');
      throw new Error('yt-dlp not available');
    }
    
    const platform = detectPlatform(url);
    console.log('Extracting from:', platform);
    
    // For YouTube, use robust extraction strategy
    if (platform === 'youtube') {
      return await extractYouTubeRobust(url);
    }
    
    // For Terabox, use server-side API extraction
    if (platform === 'terabox') {
      console.log('🔵 Terabox detected - using server-side API extraction');
      return await extractTeraboxServerSide(url);
    }
    
    // For non-YouTube sites, use standard extraction with fallback
    return await extractGenericSite(url);

  } catch (error) {
    console.error('yt-dlp failed:', error.message);
    throw error;
  }
}

// Robust YouTube extraction using Python yt-dlp library
async function extractYouTubeRobust(url) {
  const fs = require('fs');
  const cookieFile = '/app/cookies.txt';
  const hasCookies = fs.existsSync(cookieFile);
  
  if (!hasCookies) {
    console.log('⚠️ No cookies.txt found - YouTube may fail due to bot detection');
  } else {
    console.log('✓ Using Python yt-dlp library with cookies');
  }

  try {
    // Use Python script for better control
    const pythonScript = '/app/ytdlp_extract.py';
    const command = hasCookies 
      ? `python3 ${pythonScript} "${url}" "${cookieFile}"`
      : `python3 ${pythonScript} "${url}"`;
    
    console.log('Running Python yt-dlp...');
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 45000,
      maxBuffer: 10 * 1024 * 1024
    });

    if (stderr && stderr.includes('ERROR')) {
      console.error('Python error:', stderr);
      throw new Error(stderr);
    }

    const result = JSON.parse(stdout);
    
    // Check if extraction failed (new format check)
    if (result.error || !result.qualities || result.qualities.length === 0) {
      throw new Error(result.error || 'No formats available');
    }

    console.log(`✓ SUCCESS with ${result.extractionMethod} client!`);
    console.log(`✓ Got ${result.qualities.length} video qualities, ${result.audioFormats.length} audio formats`);
    
    // Result is already in correct format
    return result;
    
  } catch (error) {
    console.error('Python yt-dlp failed:', error.message);
    throw error;
  }
}

// Extract from Terabox using server-side APIs
async function extractTeraboxServerSide(url) {
  console.log('🔵 Terabox: Using server-side API extraction...');
  
  const methods = [
    {
      name: 'TeraboxDown.com API',
      fn: async () => {
        console.log('📡 Method 1: Trying TeraboxDown.com API...');
        
        // This is a working public API
        const apiUrl = 'https://www.teraboxdown.com/api/download';
        
        const response = await axios.post(apiUrl, {
          url: url
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Origin': 'https://www.teraboxdown.com',
            'Referer': 'https://www.teraboxdown.com/'
          }
        });
        
        const data = response.data;
        console.log('TeraboxDown response:', JSON.stringify(data).substring(0, 500));
        
        if (data && data.status === 'success' && data.download_url) {
          console.log('✅ Got download URL from TeraboxDown!');
          
          const fileSize = parseInt(data.file_size) || 0;
          const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
          
          return {
            title: data.file_name || 'Terabox File',
            thumbnail: data.thumbnail || 'https://via.placeholder.com/640x360',
            duration: '0:00',
            qualities: [
              {
                quality: 'Original',
                format: data.file_name?.split('.').pop()?.toLowerCase() || 'mp4',
                size: `${sizeMB} MB`,
                url: data.download_url,
                hasAudio: true,
                hasVideo: true,
                needsProxy: true
              }
            ],
            audioFormats: [],
            platform: 'terabox',
            extractionMethod: 'teraboxdown'
          };
        }
        
        throw new Error('No download URL in TeraboxDown response');
      }
    },
    {
      name: 'GetInDevice.com API',
      fn: async () => {
        console.log('📡 Method 2: Trying GetInDevice.com API...');
        
        const apiUrl = 'https://getindevice.com/wp-json/aio-dl/video-data/';
        
        const response = await axios.post(apiUrl, 
          new URLSearchParams({
            url: url,
            token: 'c2FsdXRhdGlvbnM='
          }), {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });
        
        const data = response.data;
        console.log('GetInDevice response:', JSON.stringify(data).substring(0, 500));
        
        if (data && data.medias && data.medias.length > 0) {
          const media = data.medias[0];
          
          if (media.url) {
            console.log('✅ Got download URL from GetInDevice!');
            
            return {
              title: data.title || 'Terabox File',
              thumbnail: data.thumbnail || 'https://via.placeholder.com/640x360',
              duration: '0:00',
              qualities: data.medias.map(m => ({
                quality: m.quality || 'Original',
                format: m.extension || 'mp4',
                size: m.formattedSize || 'Unknown',
                url: m.url,
                hasAudio: true,
                hasVideo: true,
                needsProxy: false
              })),
              audioFormats: [],
              platform: 'terabox',
              extractionMethod: 'getindevice'
            };
          }
        }
        
        throw new Error('No download URL in GetInDevice response');
      }
    },
    {
      name: 'Terabox API via RapidAPI',
      fn: async () => {
        console.log('📡 Method 3: Trying direct Terabox share API...');
        
        // Extract share ID
        const shareIdMatch = url.match(/\/s\/([a-zA-Z0-9_-]+)/);
        if (!shareIdMatch) throw new Error('Invalid share ID');
        const shareId = shareIdMatch[1];
        
        // Try the mobile API endpoint which is less restricted
        const apiUrl = `https://www.terabox.app/api/shorturlinfo?shorturl=${shareId}&root=1`;
        
        const response = await axios.get(apiUrl, {
          timeout: 20000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': url
          }
        });
        
        console.log('Terabox mobile API response:', JSON.stringify(response.data).substring(0, 500));
        const data = response.data;
        
        if (data && data.errno === 0 && data.list && data.list.length > 0) {
          const file = data.list[0];
          console.log('✅ Got file info from Terabox mobile API!');
          
          // Construct download URL
          const downloadUrl = file.dlink || `https://www.terabox.app/share/download?shareid=${data.shareid}&uk=${data.uk}&fid=${file.fs_id}`;
          
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
                url: downloadUrl,
                hasAudio: true,
                hasVideo: true,
                needsProxy: true
              }
            ],
            audioFormats: [],
            platform: 'terabox',
            extractionMethod: 'terabox-mobile-api'
          };
        }
        
        throw new Error('No file info in Terabox mobile API response');
      }
    }
  ];
  
  // Try each method
  for (const method of methods) {
    try {
      console.log(`⏳ Trying ${method.name}...`);
      const result = await method.fn();
      console.log(`✅ ${method.name} succeeded!`);
      return result;
    } catch (e) {
      console.log(`❌ ${method.name} failed:`, e.message);
      if (e.response) {
        console.log(`   Response status: ${e.response.status}`);
        console.log(`   Response data: ${JSON.stringify(e.response.data).substring(0, 200)}`);
      }
      continue;
    }
  }
  
  console.error('❌ ALL Terabox server-side methods failed');
  throw new Error('Terabox extraction failed. The file may be private, expired, or require authentication.');
}

// Extract from Terabox using yt-dlp with cookies
async function extractTeraboxWithYtDlp(url) {
  console.log('🔵 Terabox: Using yt-dlp with cookies...');
  
  const fs = require('fs');
  const cookieFile = '/app/cookies/terabox_cookies.txt';
  
  // Check if Terabox cookies exist
  if (!fs.existsSync(cookieFile)) {
    console.error('❌ Terabox cookies not found at:', cookieFile);
    console.log('📝 Please add Terabox cookies to backend/cookies/terabox_cookies.txt');
    throw new Error('Terabox requires authentication cookies. Please configure cookies.');
  }
  
  console.log('✓ Using Terabox cookies from:', cookieFile);
  
  try {
    const command = `yt-dlp --cookies ${cookieFile} --no-check-certificate --skip-download --dump-json --no-warnings --no-playlist "${url}"`;
    
    console.log('Running yt-dlp with Terabox cookies...');
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 45000,
      maxBuffer: 10 * 1024 * 1024
    });

    if (stderr && stderr.includes('ERROR')) {
      console.error('yt-dlp error:', stderr);
      throw new Error(stderr);
    }

    if (!stdout || stdout.trim().length === 0) {
      throw new Error('No output from yt-dlp');
    }

    const data = JSON.parse(stdout);
    console.log('✓ yt-dlp extraction success! Title:', data.title);
    
    return formatYtDlpResponse(data, url);
    
  } catch (error) {
    console.error('❌ yt-dlp Terabox extraction failed:', error.message);
    throw error;
  }
}

// Extract from Terabox using third-party downloaders
async function extractTeraboxThirdParty(url) {
  console.log('🔵 Terabox: Trying multiple third-party downloaders...');
  
  const downloaders = [
    {
      name: 'TeraSnap (Ashlynn)',
      fn: async () => {
        console.log('📡 Method 1: Trying TeraSnap API...');
        const apiUrl = 'https://terasnap.netlify.app/api/download';
        
        const response = await axios.post(apiUrl, {
          link: url,
          cookies: 'ndus=default' // Will work without cookies for public files
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.data && response.data.download_link) {
          console.log('✅ TeraSnap SUCCESS');
          return {
            title: response.data.file_name || 'Terabox File',
            thumbnail: response.data.thumbnail || 'https://via.placeholder.com/640x360',
            duration: '0:00',
            qualities: [
              {
                quality: 'Original',
                format: response.data.file_name?.split('.').pop()?.toLowerCase() || 'mp4',
                size: response.data.file_size || 'Unknown',
                url: response.data.download_link,
                hasAudio: true,
                hasVideo: true,
                needsProxy: false
              }
            ],
            audioFormats: [],
            platform: 'terabox',
            extractionMethod: 'terasnap'
          };
        }
        throw new Error('No download link in response');
      }
    },
    {
      name: 'TeraBox.hnn.workers.dev',
      fn: async () => {
        console.log('📡 Method 2: Trying terabox.hnn.workers.dev...');
        const shareIdMatch = url.match(/\/s\/([a-zA-Z0-9_-]+)/);
        if (!shareIdMatch) throw new Error('Invalid share ID');
        
        const shareId = shareIdMatch[1];
        const infoUrl = `https://terabox.hnn.workers.dev/api/get-info?shorturl=${shareId}&pwd=`;
        
        const infoResponse = await axios.get(infoUrl, {
          timeout: 20000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });
        
        const fileInfo = infoResponse.data;
        if (!fileInfo || !fileInfo.list || fileInfo.list.length === 0) {
          throw new Error('No file info');
        }
        
        const file = fileInfo.list[0];
        const downloadUrl = 'https://terabox.hnn.workers.dev/api/get-download';
        
        const downloadResponse = await axios.post(downloadUrl, {
          shareid: fileInfo.shareid,
          uk: fileInfo.uk,
          sign: fileInfo.sign,
          timestamp: fileInfo.timestamp,
          fs_id: file.fs_id
        }, {
          timeout: 20000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (downloadResponse.data && downloadResponse.data.downloadLink) {
          console.log('✅ terabox.hnn.workers.dev SUCCESS');
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
                url: downloadResponse.data.downloadLink,
                hasAudio: true,
                hasVideo: true,
                needsProxy: true
              }
            ],
            audioFormats: [],
            platform: 'terabox',
            extractionMethod: 'terabox.hnn.workers.dev'
          };
        }
        throw new Error('No download link');
      }
    },
    {
      name: 'FastTeraboxDownloader',
      fn: async () => {
        console.log('📡 Method 3: Trying FastTeraboxDownloader...');
        const apiUrl = 'https://fastterabox.com/api/download';
        
        const response = await axios.post(apiUrl, {
          url: url
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.data && response.data.downloadUrl) {
          console.log('✅ FastTeraboxDownloader SUCCESS');
          return {
            title: response.data.fileName || 'Terabox File',
            thumbnail: response.data.thumbnail || 'https://via.placeholder.com/640x360',
            duration: '0:00',
            qualities: [
              {
                quality: 'Original',
                format: 'mp4',
                size: response.data.fileSize || 'Unknown',
                url: response.data.downloadUrl,
                hasAudio: true,
                hasVideo: true,
                needsProxy: false
              }
            ],
            audioFormats: [],
            platform: 'terabox',
            extractionMethod: 'fastterabox'
          };
        }
        throw new Error('No download URL');
      }
    }
  ];
  
  // Try each downloader
  for (const downloader of downloaders) {
    try {
      console.log(`⏳ Trying ${downloader.name}...`);
      const result = await downloader.fn();
      console.log(`✅ ${downloader.name} succeeded!`);
      return result;
    } catch (e) {
      console.log(`❌ ${downloader.name} failed:`, e.message);
      continue;
    }
  }
  
  console.error('❌ ALL Terabox downloaders failed');
  throw new Error('All Terabox extraction methods failed. The file may be private or require authentication.');
}

// Extract from Terabox using Apify API (free tier available)
// Extract from Terabox - Use multiple working methods with proper error handling
async function extractTerabox(url) {
  console.log('🔵 Terabox: Starting extraction with multiple methods...');
  
  // Extract share ID from various Terabox URL formats
  const shareIdMatch = url.match(/\/s\/([a-zA-Z0-9_-]+)/);
  const shareId = shareIdMatch ? shareIdMatch[1] : null;
  
  if (!shareId) {
    console.error('❌ Could not extract share ID from URL:', url);
    throw new Error('Invalid Terabox URL - could not extract share ID');
  }
  
  console.log('📋 Share ID extracted:', shareId);
  
  // Method 1: terabox.hnn.workers.dev API (2-step process)
  try {
    console.log('📡 Method 1: Trying terabox.hnn.workers.dev API...');
    
    // Step 1: Get file info
    const infoUrl = `https://terabox.hnn.workers.dev/api/get-info?shorturl=${shareId}&pwd=`;
    console.log('📥 Step 1: Fetching file info from:', infoUrl);
    
    const infoResponse = await axios.get(infoUrl, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://terabox.hnn.workers.dev/',
        'Origin': 'https://terabox.hnn.workers.dev'
      }
    });
    
    console.log('📊 Info response status:', infoResponse.status);
    console.log('📊 Info response data keys:', Object.keys(infoResponse.data || {}));
    
    const fileInfo = infoResponse.data;
    
    // Validate response structure
    if (!fileInfo || !fileInfo.list || fileInfo.list.length === 0) {
      console.error('❌ Invalid response structure from get-info API');
      throw new Error('Invalid file info response');
    }
    
    const file = fileInfo.list[0];
    console.log('✅ File info retrieved:', {
      filename: file.server_filename,
      size: file.size,
      fs_id: file.fs_id
    });
    
    // Step 2: Get download link
    const downloadApiUrl = 'https://terabox.hnn.workers.dev/api/get-download';
    console.log('📥 Step 2: Requesting download link from:', downloadApiUrl);
    
    const downloadPayload = {
      shareid: fileInfo.shareid,
      uk: fileInfo.uk,
      sign: fileInfo.sign,
      timestamp: fileInfo.timestamp,
      fs_id: file.fs_id
    };
    
    console.log('📤 Download payload:', downloadPayload);
    
    const downloadResponse = await axios.post(downloadApiUrl, downloadPayload, {
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://terabox.hnn.workers.dev',
        'Referer': 'https://terabox.hnn.workers.dev/',
        'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
      }
    });
    
    console.log('� Download response status:', downloadResponse.status);
    console.log('📊 Download response data:', JSON.stringify(downloadResponse.data).substring(0, 200));
    
    // Check if we got a valid download link
    if (downloadResponse.data && downloadResponse.data.downloadLink) {
      const downloadLink = downloadResponse.data.downloadLink;
      console.log('✅ SUCCESS! Got download link from Method 1');
      console.log('🔗 Download URL:', downloadLink.substring(0, 100) + '...');
      
      const fileSize = file.size || 0;
      const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      
      return {
        title: file.server_filename || 'Terabox File',
        thumbnail: file.thumbs?.url3 || file.thumbs?.url2 || file.thumbs?.url1 || 'https://via.placeholder.com/640x360',
        duration: '0:00',
        qualities: [
          {
            quality: 'Original',
            format: file.server_filename?.split('.').pop()?.toLowerCase() || 'mp4',
            size: `${sizeMB} MB`,
            url: downloadLink,
            hasAudio: true,
            hasVideo: true,
            needsProxy: true // Terabox requires proxy with cookies
          }
        ],
        audioFormats: [],
        platform: 'terabox',
        extractionMethod: 'terabox.hnn.workers.dev'
      };
    } else {
      console.error('❌ No downloadLink in response:', downloadResponse.data);
      throw new Error('Download link not found in API response');
    }
  } catch (e) {
    console.error('❌ Method 1 (terabox.hnn.workers.dev) failed:', e.message);
    if (e.response) {
      console.error('Response status:', e.response.status);
      console.error('Response data:', JSON.stringify(e.response.data).substring(0, 200));
    }
  }
  
  // Method 2: Try teraboxdownloader.com API
  try {
    console.log('📡 Method 2: Trying teraboxdownloader.com API...');
    const apiUrl = `https://www.teraboxdownloader.com/api/get-info?url=${encodeURIComponent(url)}`;
    
    const response = await axios.get(apiUrl, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (response.data && response.data.downloadLink) {
      console.log('✅ SUCCESS! Got download link from Method 2');
      
      return {
        title: response.data.fileName || 'Terabox File',
        thumbnail: response.data.thumbnail || 'https://via.placeholder.com/640x360',
        duration: '0:00',
        qualities: [
          {
            quality: 'Original',
            format: 'mp4',
            size: response.data.fileSize || 'Unknown',
            url: response.data.downloadLink,
            hasAudio: true,
            hasVideo: true,
            needsProxy: true
          }
        ],
        audioFormats: [],
        platform: 'terabox',
        extractionMethod: 'teraboxdownloader.com'
      };
    }
  } catch (e) {
    console.error('❌ Method 2 (teraboxdownloader.com) failed:', e.message);
  }
  
  // Method 3: Try playterabox.com API
  try {
    console.log('📡 Method 3: Trying playterabox.com API...');
    const apiUrl = `https://playterabox.com/api/download?url=${encodeURIComponent(url)}`;
    
    const response = await axios.get(apiUrl, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (response.data && response.data.download_url) {
      console.log('✅ SUCCESS! Got download link from Method 3');
      
      return {
        title: response.data.file_name || 'Terabox File',
        thumbnail: response.data.thumbnail || 'https://via.placeholder.com/640x360',
        duration: '0:00',
        qualities: [
          {
            quality: 'Original',
            format: 'mp4',
            size: response.data.file_size || 'Unknown',
            url: response.data.download_url,
            hasAudio: true,
            hasVideo: true,
            needsProxy: true
          }
        ],
        audioFormats: [],
        platform: 'terabox',
        extractionMethod: 'playterabox.com'
      };
    }
  } catch (e) {
    console.error('❌ Method 3 (playterabox.com) failed:', e.message);
  }
  
  console.error('❌ ALL Terabox extraction methods failed');
  throw new Error('Terabox extraction failed - all API methods exhausted. The file may be private or the link may be expired.');
}

// Format Python yt-dlp response
function formatPythonYtDlpResponse(data, url) {
  const allFormats = data.formats || [];
  
  // Get combined video+audio formats
  const combinedFormats = allFormats
    .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url)
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  // Get video-only formats
  const videoOnlyFormats = allFormats
    .filter(f => f.vcodec !== 'none' && f.acodec === 'none' && f.url)
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  // Get audio-only formats
  const audioFormats = allFormats
    .filter(f => f.vcodec === 'none' && f.acodec !== 'none' && f.url)
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  // Prefer combined, fallback to video-only
  const videoFormats = combinedFormats.length > 0 ? combinedFormats : videoOnlyFormats;

  // Build quality list
  const qualities = videoFormats.slice(0, 5).map(f => ({
    quality: f.height ? `${f.height}p` : (f.quality || 'Unknown'),
    format: f.ext || 'mp4',
    size: f.filesize ? formatBytes(f.filesize) : 'Unknown',
    url: f.url,
    hasAudio: f.acodec !== 'none',
    hasVideo: f.vcodec !== 'none'
  }));

  // Build audio list
  const audioQualities = audioFormats.slice(0, 3).map(f => ({
    quality: f.quality || '128kbps',
    format: f.ext || 'mp3',
    size: f.filesize ? formatBytes(f.filesize) : 'Unknown',
    url: f.url
  }));

  // Fallback if no formats
  if (qualities.length === 0 && allFormats.length > 0) {
    qualities.push({
      quality: 'best',
      format: 'mp4',
      size: 'Unknown',
      url: allFormats[0].url,
      hasAudio: true,
      hasVideo: true
    });
  }

  return {
    title: data.title || 'Video',
    thumbnail: data.thumbnail || 'https://via.placeholder.com/640x360',
    duration: data.duration ? formatDuration(data.duration) : '0:00',
    qualities: qualities,
    audioFormats: audioQualities,
    platform: 'youtube',
    extractionMethod: 'python-yt-dlp',
    extractor: data.extractor
  };
}

// Execute yt-dlp command with robust configuration
async function executeYtDlpCommand(url, extractorArgs, cookieFile) {
  // Build command with minimal flags (removed problematic ones)
  const baseFlags = [
    '--no-check-certificate',
    '--skip-download',
    '--dump-json',
    '--no-warnings',
    '--no-playlist'
  ];

  // Add cookies (required for YouTube)
  if (cookieFile) {
    baseFlags.push(`--cookies ${cookieFile}`);
  }

  // Add extractor args if provided
  if (extractorArgs) {
    baseFlags.push(extractorArgs);
  }

  const command = `yt-dlp ${baseFlags.join(' ')} "${url}"`;
  
  console.log('Command:', command.substring(0, 150) + '...');
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    });

    // Check for errors in stderr
    if (stderr && (stderr.includes('ERROR') || stderr.includes('Sign in to confirm'))) {
      throw new Error(stderr);
    }

    if (!stdout || stdout.trim().length === 0) {
      throw new Error('No output from yt-dlp');
    }

    const data = JSON.parse(stdout);
    
    // Validate we got usable data
    if (!data.formats || data.formats.length === 0) {
      throw new Error('No formats available');
    }

    console.log(`✓ Got ${data.formats.length} formats for: ${data.title}`);
    return formatYtDlpResponse(data, url);
  } catch (error) {
    // Re-throw with cleaned error message
    const errorMsg = error.message || 'Unknown error';
    if (errorMsg.includes('Requested format is not available')) {
      throw new Error('Format unavailable - trying next strategy');
    }
    throw error;
  }
}

// Extract from generic (non-YouTube) sites
async function extractGenericSite(url) {
  console.log('Extracting generic site...');
  
  const fs = require('fs');
  const platform = detectPlatform(url);
  
  // Check for platform-specific cookies
  let cookieArg = '';
  const platformCookies = {
    'instagram': '/app/cookies/instagram_cookies.txt',
    'facebook': '/app/cookies/facebook_cookies.txt',
    'tiktok': '/app/cookies/tiktok_cookies.txt',
    'twitter': '/app/cookies/twitter_cookies.txt'
  };
  
  if (platformCookies[platform] && fs.existsSync(platformCookies[platform])) {
    cookieArg = `--cookies ${platformCookies[platform]}`;
    console.log(`✓ Using ${platform} cookies`);
  } else if (fs.existsSync('/app/cookies.txt')) {
    cookieArg = '--cookies /app/cookies.txt';
    console.log('✓ Using generic cookies');
  }
  
  // For Dailymotion, request specific format to get direct MP4
  let formatArg = '';
  if (platform === 'dailymotion') {
    // Request best MP4 format with audio
    formatArg = '--format "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"';
    console.log('✓ Using Dailymotion MP4 format selector');
  }
  
  try {
    const command = `yt-dlp --no-check-certificate --skip-download --dump-json --no-warnings --no-playlist ${cookieArg} ${formatArg} "${url}"`;
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    });

    if (stdout && !stderr.includes('ERROR')) {
      const data = JSON.parse(stdout);
      console.log('✓ Generic extraction success! Title:', data.title);
      return formatYtDlpResponse(data, url);
    }
  } catch (e) {
    console.log('Generic extraction failed:', e.message);
  }

  throw new Error('Generic site extraction failed');
}

function formatYtDlpResponse(data, url) {
  // Handle both merged and separate video/audio formats
  const allFormats = data.formats || [];
  
  // For Dailymotion, prioritize progressive MP4 formats
  const platform = detectPlatform(url);
  if (platform === 'dailymotion') {
    // Filter for direct MP4 URLs only (no HLS/DASH)
    const mp4Formats = allFormats.filter(f => 
      f.url && 
      f.ext === 'mp4' &&
      f.protocol === 'https' &&
      !f.url.includes('.m3u8') && 
      !f.url.includes('.mpd') &&
      !f.url.includes('manifest') &&
      !f.format_id?.includes('hls') &&
      !f.format_id?.includes('dash')
    );
    
    if (mp4Formats.length > 0) {
      console.log(`✓ Found ${mp4Formats.length} direct MP4 formats for Dailymotion`);
      return formatDailymotionResponse(data, mp4Formats, url);
    }
  }
  
  // Filter out HLS/DASH manifests - prefer direct URLs
  const directFormats = allFormats.filter(f => 
    f.url && 
    !f.url.includes('.m3u8') && 
    !f.url.includes('.mpd') &&
    !f.url.includes('manifest')
  );
  
  // If no direct formats, use all formats (will include manifests)
  const usableFormats = directFormats.length > 0 ? directFormats : allFormats;
  
  // Get combined video+audio formats (preferred)
  const combinedFormats = usableFormats
    .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url)
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  // Get video-only formats
  const videoOnlyFormats = usableFormats
    .filter(f => f.vcodec !== 'none' && f.acodec === 'none' && f.url)
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  // Get audio-only formats
  const audioFormats = usableFormats
    .filter(f => f.vcodec === 'none' && f.acodec !== 'none' && f.url)
    .sort((a, b) => (b.abr || 0) - (a.abr || 0));

  // Prefer combined formats, fallback to video-only
  const videoFormats = combinedFormats.length > 0 ? combinedFormats : videoOnlyFormats;

  // Build quality list (top 5 qualities)
  const qualities = videoFormats.slice(0, 5).map(f => ({
    quality: f.height ? `${f.height}p` : (f.format_note || 'Unknown'),
    format: f.ext || 'mp4',
    size: f.filesize ? formatBytes(f.filesize) : (f.filesize_approx ? formatBytes(f.filesize_approx) : 'Unknown'),
    url: f.url,
    hasAudio: f.acodec !== 'none',
    hasVideo: f.vcodec !== 'none',
    protocol: f.protocol || 'https'
  }));

  // Build audio quality list (top 3)
  const audioQualities = audioFormats.slice(0, 3).map(f => ({
    quality: f.abr ? `${Math.round(f.abr)}kbps` : (f.format_note || '128kbps'),
    format: f.ext || 'mp3',
    size: f.filesize ? formatBytes(f.filesize) : (f.filesize_approx ? formatBytes(f.filesize_approx) : 'Unknown'),
    url: f.url
  }));

  // Fallback if no formats found
  if (qualities.length === 0 && data.url) {
    qualities.push({
      quality: '720p',
      format: 'mp4',
      size: 'Unknown',
      url: data.url,
      hasAudio: true,
      hasVideo: true,
      protocol: 'https'
    });
  }

  // Log format info for debugging
  console.log(`Formats: ${qualities.length} video, ${audioQualities.length} audio`);
  if (qualities.length > 0) {
    console.log(`Best quality: ${qualities[0].quality} (${qualities[0].protocol})`);
  }

  return {
    title: data.title || 'Video',
    thumbnail: data.thumbnail || data.thumbnails?.[0]?.url || 'https://via.placeholder.com/640x360',
    duration: data.duration ? formatDuration(data.duration) : '0:00',
    qualities: qualities,
    audioFormats: audioQualities,
    platform: detectPlatform(url),
    extractionMethod: 'yt-dlp'
  };
}

// Fallback: Multiple API methods
async function extractWithFallbackAPIs(url) {
  console.log('🔄 Trying fallback APIs...');
  
  // Import the new Cobalt extractor with community instances
  const { extractWithCobalt: extractWithCobaltNew } = require('../extractors/cobalt-extractor');
  
  const methods = [
    { name: 'Cobalt (Community)', fn: () => extractWithCobaltNew(url) },
    { name: 'Cobalt (Old)', fn: () => extractWithCobalt(url) },
    { name: 'SaveFrom', fn: () => extractWithSaveFrom(url) },
    { name: 'SnapSave', fn: () => extractWithSnapSave(url) },
    { name: 'Y2Mate', fn: () => extractWithY2Mate(url) },
    { name: 'Loader', fn: () => extractWithLoader(url) }
  ];

  for (const method of methods) {
    try {
      console.log(`⏳ Trying ${method.name}...`);
      const result = await method.fn();
      if (result && result.qualities && result.qualities.length > 0) {
        console.log(`✅ ${method.name} succeeded!`);
        return result;
      }
    } catch (e) {
      console.log(`❌ ${method.name} failed:`, e.message);
      continue;
    }
  }

  throw new Error('All methods failed');
}

// Cobalt API
async function extractWithCobalt(url) {
  const instances = [
    'https://api.cobalt.tools/api/json',
    'https://co.wuk.sh/api/json'
  ];

  for (const instance of instances) {
    try {
      const response = await axios.post(instance, {
        url: url,
        vCodec: 'h264',
        vQuality: '720',
        aFormat: 'mp3',
        isAudioOnly: false
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const data = response.data;
      
      if (data.status === 'redirect' || data.status === 'stream') {
        return formatResponse(data.url, data.audio, null, 'Video');
      }
    } catch (e) {
      continue;
    }
  }

  throw new Error('Cobalt failed');
}

// SaveFrom.net
async function extractWithSaveFrom(url) {
  const response = await axios.get('https://api.savefrom.net/info', {
    params: { url: url },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 10000
  });

  const data = response.data;
  
  if (!data || !data[0] || !data[0].url || !data[0].url[0]) {
    throw new Error('SaveFrom failed');
  }

  const videoUrl = data[0].url[0].url;
  return formatResponse(videoUrl, null, data[0].thumb, data[0].title);
}

// SnapSave
async function extractWithSnapSave(url) {
  const response = await axios.post('https://snapsave.app/action.php', 
    new URLSearchParams({ url: url }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0'
    },
    timeout: 10000
  });

  const html = response.data;
  const urlMatch = html.match(/href="([^"]+download[^"]+)"/);
  
  if (!urlMatch) {
    throw new Error('SnapSave failed');
  }

  return formatResponse(urlMatch[1], null, null, 'Video');
}

// Y2Mate
async function extractWithY2Mate(url) {
  const response = await axios.post('https://www.y2mate.com/mates/analyzeV2/ajax', 
    new URLSearchParams({
      k_query: url,
      k_page: 'home',
      hl: 'en',
      q_auto: '0'
    }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    timeout: 10000
  });

  const data = response.data;
  
  if (data.status !== 'ok' || !data.links || !data.links.mp4) {
    throw new Error('Y2Mate failed');
  }

  const qualities = Object.values(data.links.mp4);
  const bestQuality = qualities[0];
  
  if (!bestQuality || !bestQuality.k) {
    throw new Error('No quality found');
  }

  const convertResponse = await axios.post('https://www.y2mate.com/mates/convertV2/index',
    new URLSearchParams({
      vid: data.vid,
      k: bestQuality.k
    }), {
    timeout: 10000
  });

  const convertData = convertResponse.data;
  const dlinkMatch = convertData.dlink;
  
  if (!dlinkMatch) {
    throw new Error('No download link');
  }

  return formatResponse(dlinkMatch, null, null, data.title);
}

// Loader.to
async function extractWithLoader(url) {
  const response = await axios.get('https://loader.to/ajax/download.php', {
    params: {
      format: 'mp4',
      url: url,
      api: 'dfcb6d76f2f6a9894gjkege8a4ab232222'
    },
    timeout: 10000
  });

  const data = response.data;
  
  if (!data.success || !data.download_url) {
    throw new Error('Loader.to failed');
  }

  return formatResponse(data.download_url, null, data.thumbnail, data.title);
}

// Helper functions
function formatResponse(videoUrl, audioUrl, thumbnail, title) {
  if (!videoUrl) {
    throw new Error('No video URL');
  }

  return {
    title: title || 'Video',
    thumbnail: thumbnail || 'https://via.placeholder.com/640x360',
    duration: '0:00',
    qualities: [
      { quality: '720p', format: 'mp4', size: 'Unknown', url: videoUrl },
      { quality: '480p', format: 'mp4', size: 'Unknown', url: videoUrl },
      { quality: '360p', format: 'mp4', size: 'Unknown', url: videoUrl }
    ],
    audioFormats: audioUrl ? [
      { quality: '128kbps', format: 'mp3', size: 'Unknown', url: audioUrl }
    ] : [],
    platform: 'youtube'
  };
}

function detectPlatform(url) {
  const patterns = {
    youtube: /(?:youtube\.com|youtu\.be)/,
    instagram: /instagram\.com/,
    facebook: /facebook\.com|fb\.watch/,
    twitter: /(?:twitter\.com|x\.com)/,
    tiktok: /tiktok\.com/,
    vimeo: /vimeo\.com/,
    dailymotion: /(?:dailymotion\.com|dai\.ly)/,
    reddit: /reddit\.com/,
    twitch: /twitch\.tv/,
    soundcloud: /soundcloud\.com/,
    pinterest: /pinterest\.com/,
    linkedin: /linkedin\.com/,
    snapchat: /snapchat\.com/,
    tumblr: /tumblr\.com/,
    vk: /vk\.com/,
    bilibili: /bilibili\.com/,
    niconico: /nicovideo\.jp/,
    streamable: /streamable\.com/,
    imgur: /imgur\.com/,
    flickr: /flickr\.com/,
    '9gag': /9gag\.com/,
    bandcamp: /bandcamp\.com/,
    mixcloud: /mixcloud\.com/,
    terabox: /(?:terabox\.com|teraboxapp\.com|1024tera\.com)/,
    pornhub: /pornhub\.com/,
    xvideos: /xvideos\.com/,
    xhamster: /xhamster\.com/
  };

  for (const [platform, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) {
      return platform;
    }
  }

  return 'generic';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDailymotionResponse(data, mp4Formats, url) {
  // Sort by quality (height)
  mp4Formats.sort((a, b) => (b.height || 0) - (a.height || 0));
  
  // Build quality list with direct MP4 URLs
  const qualities = mp4Formats.map(f => ({
    quality: f.height ? `${f.height}p` : (f.format_note || f.quality || 'Unknown'),
    format: 'mp4',
    size: f.filesize ? formatBytes(f.filesize) : (f.filesize_approx ? formatBytes(f.filesize_approx) : 'Unknown'),
    url: f.url,
    hasAudio: f.acodec !== 'none',
    hasVideo: f.vcodec !== 'none',
    protocol: 'https'
  }));
  
  // Get audio formats if available
  const audioFormats = data.formats?.filter(f => 
    f.vcodec === 'none' && 
    f.acodec !== 'none' && 
    f.url &&
    !f.url.includes('.m3u8')
  ) || [];
  
  audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0));
  
  const audioQualities = audioFormats.slice(0, 3).map(f => ({
    quality: f.abr ? `${Math.round(f.abr)}kbps` : '128kbps',
    format: f.ext || 'mp3',
    size: f.filesize ? formatBytes(f.filesize) : 'Unknown',
    url: f.url
  }));
  
  console.log(`✓ Dailymotion: ${qualities.length} MP4 qualities, ${audioQualities.length} audio formats`);
  
  return {
    title: data.title || 'Dailymotion Video',
    thumbnail: data.thumbnail || data.thumbnails?.[0]?.url || 'https://via.placeholder.com/640x360',
    duration: data.duration ? formatDuration(data.duration) : '0:00',
    qualities: qualities,
    audioFormats: audioQualities,
    platform: 'dailymotion',
    extractionMethod: 'yt-dlp-mp4'
  };
}
