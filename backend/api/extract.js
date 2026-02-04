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

    // Try yt-dlp first (supports 1000+ websites)
    try {
      const result = await extractWithYtDlp(url);
      if (result && result.qualities && result.qualities.length > 0) {
        return res.json(result);
      }
    } catch (e) {
      console.log('yt-dlp failed, trying API fallbacks...');
    }

    // Fallback to API methods - don't catch errors, let them propagate
    const fallbackResult = await extractWithFallbackAPIs(url);
    return res.json(fallbackResult);

  } catch (error) {
    console.error('Extraction error:', error.message);
    
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
    
    // For Terabox, use generic extractor
    if (platform === 'terabox') {
      return await extractTerabox(url);
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

// Extract from Terabox using yt-dlp generic extractor
async function extractTerabox(url) {
  console.log('✓ Trying yt-dlp generic extractor for Terabox');

  try {
    // Use yt-dlp's generic extractor - it can handle many sites
    const command = `yt-dlp --no-check-certificate --skip-download --dump-json --no-warnings --no-playlist --force-generic-extractor "${url}"`;
    
    console.log('Running yt-dlp generic extractor...');
    
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
    console.log('yt-dlp generic failed:', e.message);
  }

  throw new Error('Terabox extraction failed - file may be private or require authentication');
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
  
  try {
    const command = `yt-dlp --no-check-certificate --skip-download --dump-json --no-warnings --no-playlist ${cookieArg} "${url}"`;
    
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
    dailymotion: /dailymotion\.com/,
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
