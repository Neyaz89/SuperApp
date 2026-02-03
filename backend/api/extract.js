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

    // Try 10 different extraction services
    const extractors = [
      { name: 'Cobalt', fn: () => extractWithCobalt(url) },
      { name: 'SaveFrom', fn: () => extractWithSaveFrom(url) },
      { name: 'SnapSave', fn: () => extractWithSnapSave(url) },
      { name: 'Y2Mate', fn: () => extractWithY2Mate(url) },
      { name: 'SSYouTube', fn: () => extractWithSSYouTube(url) },
      { name: 'Loader.to', fn: () => extractWithLoaderTo(url) },
      { name: 'KeepVid', fn: () => extractWithKeepVid(url) },
      { name: 'VidMate', fn: () => extractWithVidMate(url) },
      { name: 'AllTube', fn: () => extractWithAllTube(url) },
      { name: 'DownloadGram', fn: () => extractWithDownloadGram(url) },
    ];

    for (const extractor of extractors) {
      try {
        console.log(`Trying ${extractor.name}...`);
        const result = await extractor.fn();
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
    
    const platform = detectPlatform(req.body.url);
    return res.json({
      title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
      thumbnail: 'https://via.placeholder.com/640x360',
      duration: '0:00',
      qualities: [
        { quality: '720p', format: 'mp4', size: 'Unknown', url: req.body.url, error: 'Extraction temporarily unavailable' }
      ],
      audioFormats: [],
      platform,
      extractionFailed: true,
      message: 'Video extraction is temporarily unavailable. Please try again later.'
    });
  }
};

// 1. Cobalt API (Most reliable)
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
    timeout: 8000
  });

  const data = response.data;
  
  if (data.status === 'error' || data.status === 'rate-limit') {
    throw new Error(data.text || 'Cobalt failed');
  }

  return formatResponse(data.url, data.audio, data.thumb, 'Video');
}

// 2. SaveFrom.net API
async function extractWithSaveFrom(url) {
  const response = await axios.get('https://api.savefrom.net/info', {
    params: {
      url: url,
      lang: 'en'
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 8000
  });

  const data = response.data;
  
  if (!data || !data[0] || !data[0].url || !data[0].url[0]) {
    throw new Error('SaveFrom failed');
  }

  const formats = data[0].url;
  const videoUrl = formats.find(f => f.type === 'video')?.url || formats[0].url;
  
  return formatResponse(videoUrl, null, data[0].thumb, data[0].title);
}

// 3. SnapSave API
async function extractWithSnapSave(url) {
  const response = await axios.post('https://snapsave.app/action.php', 
    new URLSearchParams({
      url: url,
      lang: 'en'
    }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 8000
  });

  const html = response.data;
  const urlMatch = html.match(/href="([^"]+download[^"]+)"/);
  
  if (!urlMatch) {
    throw new Error('SnapSave failed');
  }

  return formatResponse(urlMatch[1], null, null, 'Video');
}

// 4. Y2Mate API
async function extractWithY2Mate(url) {
  const response = await axios.post('https://www.y2mate.com/mates/analyzeV2/ajax', 
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
    timeout: 8000
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

  // Get download link
  const convertResponse = await axios.post('https://www.y2mate.com/mates/convertV2/index',
    new URLSearchParams({
      vid: data.vid,
      k: bestQuality.k
    }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    timeout: 8000
  });

  const convertData = convertResponse.data;
  const dlinkMatch = convertData.dlink || convertData.c_url;
  
  if (!dlinkMatch) {
    throw new Error('No download link');
  }

  return formatResponse(dlinkMatch, null, null, data.title);
}

// 5. SSYouTube (9xbuddy)
async function extractWithSSYouTube(url) {
  const modifiedUrl = url.replace('youtube.com', 'ssyoutube.com');
  
  const response = await axios.get(`https://9xbuddy.org/process`, {
    params: { url: modifiedUrl },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 8000
  });

  const html = response.data;
  const urlMatch = html.match(/href="(https?:\/\/[^"]+\.mp4[^"]*)"/);
  
  if (!urlMatch) {
    throw new Error('SSYouTube failed');
  }

  return formatResponse(urlMatch[1], null, null, 'Video');
}

// 6. Loader.to API
async function extractWithLoaderTo(url) {
  const response = await axios.get('https://loader.to/ajax/download.php', {
    params: {
      format: 'mp4',
      url: url,
      api: 'dfcb6d76f2f6a9894gjkege8a4ab232222'
    },
    timeout: 8000
  });

  const data = response.data;
  
  if (!data.success || !data.download_url) {
    throw new Error('Loader.to failed');
  }

  return formatResponse(data.download_url, null, data.thumbnail, data.title);
}

// 7. KeepVid API
async function extractWithKeepVid(url) {
  const response = await axios.post('https://keepvid.pro/api/convert', {
    url: url
  }, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 8000
  });

  const data = response.data;
  
  if (!data.url) {
    throw new Error('KeepVid failed');
  }

  return formatResponse(data.url, null, data.thumb, data.title);
}

// 8. VidMate API
async function extractWithVidMate(url) {
  const response = await axios.post('https://api.vidmateapp.com/api/convert', {
    url: url,
    quality: 'high'
  }, {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 8000
  });

  const data = response.data;
  
  if (!data.downloadUrl) {
    throw new Error('VidMate failed');
  }

  return formatResponse(data.downloadUrl, null, null, data.title);
}

// 9. AllTube API
async function extractWithAllTube(url) {
  const response = await axios.get('https://api.alltubedownload.org/api/info', {
    params: { url },
    timeout: 8000
  });

  const data = response.data;
  
  if (!data || !data.formats || data.formats.length === 0) {
    throw new Error('AllTube failed');
  }

  const videoFormat = data.formats.find(f => f.vcodec !== 'none' && f.acodec !== 'none');
  
  if (!videoFormat) {
    throw new Error('No video format found');
  }

  return formatResponse(videoFormat.url, null, data.thumbnail, data.title);
}

// 10. DownloadGram (for Instagram)
async function extractWithDownloadGram(url) {
  const response = await axios.post('https://downloadgram.org/api/media', {
    url: url
  }, {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 8000
  });

  const data = response.data;
  
  if (!data.video_url && !data.image_url) {
    throw new Error('DownloadGram failed');
  }

  return formatResponse(data.video_url || data.image_url, null, data.thumbnail, 'Instagram Media');
}

// Helper function to format response
function formatResponse(videoUrl, audioUrl, thumbnail, title) {
  if (!videoUrl) {
    throw new Error('No video URL');
  }

  return {
    title: title || 'Video',
    thumbnail: thumbnail || 'https://via.placeholder.com/640x360',
    duration: '0:00',
    qualities: [
      { quality: '1080p', format: 'mp4', size: 'Unknown', url: videoUrl },
      { quality: '720p', format: 'mp4', size: 'Unknown', url: videoUrl },
      { quality: '480p', format: 'mp4', size: 'Unknown', url: videoUrl }
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
  };

  for (const [platform, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) {
      return platform;
    }
  }

  return 'unknown';
}
