const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const platform = detectPlatform(url);
    console.log('Extracting:', url, 'Platform:', platform);

    let result;
    
    // Try multiple extraction services in order
    const extractors = [
      { name: 'Cobalt', fn: () => extractWithCobalt(url) },
      { name: 'AllTube', fn: () => extractWithAllTube(url) },
      { name: 'Y2Mate', fn: () => extractWithY2Mate(url) },
    ];

    for (const extractor of extractors) {
      try {
        console.log(`Trying ${extractor.name}...`);
        result = await extractor.fn();
        if (result && result.qualities && result.qualities.length > 0) {
          console.log(`${extractor.name} succeeded!`);
          return res.json(result);
        }
      } catch (e) {
        console.log(`${extractor.name} failed:`, e.message);
      }
    }

    throw new Error('All extraction methods failed');

  } catch (error) {
    console.error('Extraction error:', error);
    return res.status(500).json({ 
      error: 'Failed to extract video',
      message: error.message 
    });
  }
};

// Method 1: Cobalt API
async function extractWithCobalt(url) {
  const response = await axios.post('https://api.cobalt.tools/api/json', {
    url: url,
    vCodec: 'h264',
    vQuality: '1080',
    aFormat: 'mp3',
    filenamePattern: 'basic',
    downloadMode: 'auto'
  }, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });

  const data = response.data;
  
  if (data.status === 'error' || data.status === 'rate-limit') {
    throw new Error(data.text || 'Cobalt failed');
  }

  const videoUrl = data.url;
  const audioUrl = data.audio;
  
  if (!videoUrl) {
    throw new Error('No video URL from Cobalt');
  }

  return {
    title: 'Video',
    thumbnail: data.thumb || 'https://via.placeholder.com/640x360',
    duration: '0:00',
    qualities: [
      { quality: '1080p', format: 'mp4', size: 'Unknown', url: videoUrl },
      { quality: '720p', format: 'mp4', size: 'Unknown', url: videoUrl },
      { quality: '480p', format: 'mp4', size: 'Unknown', url: videoUrl }
    ],
    audioFormats: audioUrl ? [
      { quality: '128kbps', format: 'mp3', size: 'Unknown', url: audioUrl }
    ] : [],
    platform: detectPlatform(url)
  };
}

// Method 2: AllTube Download API
async function extractWithAllTube(url) {
  const response = await axios.get('https://api.alltubedownload.org/api/info', {
    params: { url },
    timeout: 10000
  });

  const data = response.data;
  
  if (!data || !data.formats || data.formats.length === 0) {
    throw new Error('No formats from AllTube');
  }

  const videoFormats = data.formats
    .filter(f => f.vcodec !== 'none' && f.acodec !== 'none')
    .sort((a, b) => (b.height || 0) - (a.height || 0))
    .slice(0, 5);

  const audioFormats = data.formats
    .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
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
    thumbnail: data.thumbnail || 'https://via.placeholder.com/640x360',
    duration: data.duration ? formatDuration(data.duration) : '0:00',
    qualities: qualities.length > 0 ? qualities : [
      { quality: '720p', format: 'mp4', size: 'Unknown', url: videoFormats[0]?.url }
    ],
    audioFormats: audioQualities.length > 0 ? audioQualities : [],
    platform: detectPlatform(url)
  };
}

// Method 3: Y2Mate API
async function extractWithY2Mate(url) {
  // First request to get video info
  const infoResponse = await axios.post('https://www.y2mate.com/mates/analyzeV2/ajax', 
    new URLSearchParams({
      k_query: url,
      k_page: 'home',
      hl: 'en',
      q_auto: '0'
    }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 10000
  });

  const info = infoResponse.data;
  
  if (info.status !== 'ok' || !info.links) {
    throw new Error('Y2Mate analysis failed');
  }

  const videoLinks = info.links.mp4 || {};
  const audioLinks = info.links.mp3 || {};

  const qualities = Object.entries(videoLinks)
    .filter(([quality, data]) => data.size && data.k)
    .map(([quality, data]) => ({
      quality: quality,
      format: 'mp4',
      size: data.size,
      url: `https://www.y2mate.com/mates/convertV2/index?k=${data.k}`,
      k: data.k
    }));

  const audioQualities = Object.entries(audioLinks)
    .filter(([quality, data]) => data.size && data.k)
    .map(([quality, data]) => ({
      quality: quality,
      format: 'mp3',
      size: data.size,
      url: `https://www.y2mate.com/mates/convertV2/index?k=${data.k}`,
      k: data.k
    }));

  return {
    title: info.title || 'Video',
    thumbnail: `https://i.ytimg.com/vi/${info.vid}/maxresdefault.jpg`,
    duration: info.t || '0:00',
    qualities: qualities.length > 0 ? qualities : [],
    audioFormats: audioQualities.length > 0 ? audioQualities : [],
    platform: 'youtube'
  };
}

// Helper functions
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
  };

  for (const [platform, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) {
      return platform;
    }
  }

  return 'unknown';
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
