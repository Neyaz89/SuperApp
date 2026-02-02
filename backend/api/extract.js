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

    // Try extraction methods in order
    const methods = [
      { name: 'Cobalt', fn: extractWithCobalt },
      { name: 'AllTube', fn: extractWithAllTube },
      { name: 'Invidious', fn: extractWithInvidious }
    ];

    for (const method of methods) {
      try {
        console.log(`Trying ${method.name}...`);
        const result = await method.fn(url, platform);
        if (result && result.qualities && result.qualities.length > 0) {
          console.log(`${method.name} succeeded!`);
          return res.json(result);
        }
      } catch (e) {
        console.log(`${method.name} failed:`, e.message);
      }
    }

    // If all fail, return basic info with the original URL
    console.log('All methods failed, returning fallback');
    return res.json({
      title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
      thumbnail: 'https://via.placeholder.com/640x360',
      duration: '0:00',
      qualities: [
        { quality: '720p', format: 'mp4', size: 'Unknown', url }
      ],
      audioFormats: [
        { quality: '128kbps', format: 'mp3', size: 'Unknown', url }
      ],
      platform
    });

  } catch (error) {
    console.error('Extraction error:', error);
    return res.status(500).json({ 
      error: 'Failed to extract video',
      message: error.message 
    });
  }
};

// Method 1: Cobalt API (supports YouTube, Instagram, Twitter, TikTok, etc.)
async function extractWithCobalt(url, platform) {
  const response = await axios.post('https://api.cobalt.tools/api/json', {
    url: url,
    vCodec: 'h264',
    vQuality: '1080',
    aFormat: 'mp3',
    filenamePattern: 'basic'
  }, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    timeout: 9000
  });

  const data = response.data;

  if (data.status === 'error' || data.status === 'rate-limit') {
    throw new Error(data.text || 'Cobalt API error');
  }

  // Handle different response formats
  let videoUrl = data.url;
  let audioUrl = null;

  if (data.picker && data.picker.length > 0) {
    // Multiple quality options
    videoUrl = data.picker[0].url;
  }

  if (!videoUrl) {
    throw new Error('No download URL in response');
  }

  return {
    title: data.filename || `${platform} Video`,
    thumbnail: data.thumb || 'https://via.placeholder.com/640x360',
    duration: '0:00',
    qualities: [
      { quality: '1080p', format: 'mp4', size: 'Unknown', url: videoUrl },
      { quality: '720p', format: 'mp4', size: 'Unknown', url: videoUrl },
      { quality: '480p', format: 'mp4', size: 'Unknown', url: videoUrl }
    ],
    audioFormats: [
      { quality: '320kbps', format: 'mp3', size: 'Unknown', url: audioUrl || videoUrl }
    ],
    platform
  };
}

// Method 2: AllTube (YouTube downloader)
async function extractWithAllTube(url, platform) {
  if (platform !== 'youtube') {
    throw new Error('AllTube only supports YouTube');
  }

  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // Use public AllTube instance
  const response = await axios.get(`https://yt.lemnoslife.com/videos?part=contentDetails&id=${videoId}`, {
    timeout: 9000
  });

  if (!response.data || !response.data.items || response.data.items.length === 0) {
    throw new Error('Video not found');
  }

  const video = response.data.items[0];
  
  return {
    title: video.snippet?.title || 'YouTube Video',
    thumbnail: video.snippet?.thumbnails?.high?.url || 'https://via.placeholder.com/640x360',
    duration: video.contentDetails?.duration || '0:00',
    qualities: [
      { quality: '1080p', format: 'mp4', size: 'Unknown', url: `https://www.youtube.com/watch?v=${videoId}` },
      { quality: '720p', format: 'mp4', size: 'Unknown', url: `https://www.youtube.com/watch?v=${videoId}` },
      { quality: '480p', format: 'mp4', size: 'Unknown', url: `https://www.youtube.com/watch?v=${videoId}` }
    ],
    audioFormats: [
      { quality: '128kbps', format: 'mp3', size: 'Unknown', url: `https://www.youtube.com/watch?v=${videoId}` }
    ],
    platform: 'youtube'
  };
}

// Method 3: Invidious API (YouTube alternative frontend)
async function extractWithInvidious(url, platform) {
  if (platform !== 'youtube') {
    throw new Error('Invidious only supports YouTube');
  }

  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // Try multiple Invidious instances
  const instances = [
    'https://invidious.snopyta.org',
    'https://yewtu.be',
    'https://invidious.kavin.rocks'
  ];

  for (const instance of instances) {
    try {
      const response = await axios.get(`${instance}/api/v1/videos/${videoId}`, {
        timeout: 8000
      });

      const data = response.data;

      if (!data || !data.formatStreams || data.formatStreams.length === 0) {
        continue;
      }

      const videoFormats = data.formatStreams
        .filter(f => f.type && f.type.includes('video'))
        .sort((a, b) => (b.resolution ? parseInt(b.resolution) : 0) - (a.resolution ? parseInt(a.resolution) : 0));

      const audioFormats = data.adaptiveFormats
        ?.filter(f => f.type && f.type.includes('audio'))
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0)) || [];

      return {
        title: data.title || 'YouTube Video',
        thumbnail: data.videoThumbnails?.[0]?.url || 'https://via.placeholder.com/640x360',
        duration: formatDuration(data.lengthSeconds || 0),
        qualities: videoFormats.slice(0, 5).map(f => ({
          quality: f.resolution || f.qualityLabel || 'Unknown',
          format: f.container || 'mp4',
          size: f.size || 'Unknown',
          url: f.url
        })),
        audioFormats: audioFormats.slice(0, 3).map(f => ({
          quality: f.bitrate ? `${Math.round(f.bitrate / 1000)}kbps` : 'Unknown',
          format: f.container || 'mp3',
          size: f.size || 'Unknown',
          url: f.url
        })),
        platform: 'youtube'
      };
    } catch (e) {
      console.log(`Invidious instance ${instance} failed:`, e.message);
      continue;
    }
  }

  throw new Error('All Invidious instances failed');
}

// Helper functions
function detectPlatform(url) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('instagram.com')) return 'instagram';
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) return 'facebook';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter';
  if (lowerUrl.includes('vimeo.com')) return 'vimeo';
  if (lowerUrl.includes('tiktok.com')) return 'tiktok';
  return 'unknown';
}

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
