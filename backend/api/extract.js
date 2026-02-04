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

    // Fallback to API methods
    const fallbackResult = await extractWithFallbackAPIs(url);
    return res.json(fallbackResult);

  } catch (error) {
    console.error('Extraction error:', error.message);
    
    // Return graceful fallback
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

// Method 1: yt-dlp (Supports 1000+ websites)
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
    
    // Use --flat-playlist to avoid downloading playlists
    // Use --no-warnings to reduce noise
    // Use --extractor-args to pass site-specific options
    const command = `yt-dlp --no-check-certificate --skip-download --dump-json --no-warnings --flat-playlist --format "best" --extractor-args "youtube:player_client=android" "${url}"`;
    
    console.log('Running yt-dlp...');
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    });

    if (!stdout) {
      console.error('No output from yt-dlp');
      console.error('stderr:', stderr);
      throw new Error('No output from yt-dlp');
    }

    if (stderr && stderr.includes('ERROR')) {
      console.error('yt-dlp error:', stderr);
      throw new Error('yt-dlp extraction failed: ' + stderr);
    }

    const data = JSON.parse(stdout);
    console.log('✓ yt-dlp success! Title:', data.title);
    console.log('Formats found:', data.formats?.length || 0);
    
    return formatYtDlpResponse(data, url);

  } catch (error) {
    console.error('yt-dlp failed:', error.message);
    throw error;
  }
}

function formatYtDlpResponse(data, url) {
  // Extract formats
  const videoFormats = (data.formats || [])
    .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url)
    .sort((a, b) => (b.height || 0) - (a.height || 0))
    .slice(0, 5);

  const audioFormats = (data.formats || [])
    .filter(f => f.vcodec === 'none' && f.acodec !== 'none' && f.url)
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))
    .slice(0, 3);

  const qualities = videoFormats.map(f => ({
    quality: `${f.height}p`,
    format: f.ext || 'mp4',
    size: f.filesize ? formatBytes(f.filesize) : 'Unknown',
    url: f.url
  }));

  const audioQualities = audioFormats.map(f => ({
    quality: `${Math.round(f.abr || 128)}kbps`,
    format: f.ext || 'mp3',
    size: f.filesize ? formatBytes(f.filesize) : 'Unknown',
    url: f.url
  }));

  return {
    title: data.title || 'Video',
    thumbnail: data.thumbnail || data.thumbnails?.[0]?.url || 'https://via.placeholder.com/640x360',
    duration: data.duration ? formatDuration(data.duration) : '0:00',
    qualities: qualities.length > 0 ? qualities : [
      { quality: '720p', format: 'mp4', size: 'Unknown', url: data.url }
    ],
    audioFormats: audioQualities,
    platform: detectPlatform(url)
  };
}

// Fallback: Multiple API methods
async function extractWithFallbackAPIs(url) {
  const methods = [
    () => extractWithCobalt(url),
    () => extractWithSaveFrom(url),
    () => extractWithSnapSave(url),
    () => extractWithY2Mate(url),
    () => extractWithLoader(url)
  ];

  for (const method of methods) {
    try {
      const result = await method();
      if (result && result.qualities && result.qualities.length > 0) {
        return result;
      }
    } catch (e) {
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
