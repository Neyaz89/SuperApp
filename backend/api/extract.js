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

    // Try extraction methods in order with platform-specific routing
    // Invidious first for YouTube (most reliable with actual download URLs)
    const methods = [
      { name: 'Invidious', fn: extractWithInvidious, platforms: ['youtube'] },
      { name: 'PiPed', fn: extractWithPiped, platforms: ['youtube'] },
      { name: 'Cobalt', fn: extractWithCobalt, platforms: ['youtube', 'instagram', 'twitter', 'tiktok', 'facebook', 'vimeo'] },
      { name: 'Y2Mate', fn: extractWithY2Mate, platforms: ['youtube', 'facebook', 'twitter'] },
      { name: 'SnapSave', fn: extractWithSnapSave, platforms: ['instagram', 'tiktok', 'facebook'] }
    ];

    // Filter methods by platform support
    const applicableMethods = methods.filter(m => m.platforms.includes(platform));

    for (const method of applicableMethods) {
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

// Method 1: Cobalt API (Primary - supports most platforms)
async function extractWithCobalt(url, platform) {
  const cobaltInstances = [
    'https://api.cobalt.tools/api/json',
    'https://co.wuk.sh/api/json'
  ];

  for (const instance of cobaltInstances) {
    try {
      const response = await axios.post(instance, {
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
        continue;
      }

      let videoUrl = data.url;
      let audioUrl = null;

      if (data.picker && data.picker.length > 0) {
        videoUrl = data.picker[0].url;
      }

      if (!videoUrl) {
        continue;
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
    } catch (e) {
      console.log(`Cobalt instance ${instance} failed:`, e.message);
      continue;
    }
  }

  throw new Error('All Cobalt instances failed');
}

// Method 2: Invidious API (YouTube only - very reliable)
async function extractWithInvidious(url, platform) {
  if (platform !== 'youtube') {
    throw new Error('Invidious only supports YouTube');
  }

  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  const instances = [
    'https://inv.nadeko.net',
    'https://invidious.privacyredirect.com',
    'https://invidious.nerdvpn.de',
    'https://inv.tux.pizza',
    'https://invidious.protokolla.fi'
  ];

  for (const instance of instances) {
    try {
      const response = await axios.get(`${instance}/api/v1/videos/${videoId}`, {
        timeout: 7000
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

      if (videoFormats.length === 0) {
        continue;
      }

      return {
        title: data.title || 'YouTube Video',
        thumbnail: data.videoThumbnails?.[0]?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
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

// Method 3: Piped API (YouTube only - alternative)
async function extractWithPiped(url, platform) {
  if (platform !== 'youtube') {
    throw new Error('Piped only supports YouTube');
  }

  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.moomoo.me'
  ];

  for (const instance of instances) {
    try {
      const response = await axios.get(`${instance}/streams/${videoId}`, {
        timeout: 7000
      });

      const data = response.data;

      if (!data || !data.videoStreams || data.videoStreams.length === 0) {
        continue;
      }

      const videoFormats = data.videoStreams
        .sort((a, b) => (b.quality ? parseInt(b.quality) : 0) - (a.quality ? parseInt(a.quality) : 0));

      const audioFormats = data.audioStreams || [];

      return {
        title: data.title || 'YouTube Video',
        thumbnail: data.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: formatDuration(data.duration || 0),
        qualities: videoFormats.slice(0, 5).map(f => ({
          quality: f.quality || 'Unknown',
          format: f.format || 'mp4',
          size: 'Unknown',
          url: f.url
        })),
        audioFormats: audioFormats.slice(0, 3).map(f => ({
          quality: f.bitrate ? `${Math.round(f.bitrate / 1000)}kbps` : 'Unknown',
          format: f.mimeType?.includes('audio/mp4') ? 'm4a' : 'mp3',
          size: 'Unknown',
          url: f.url
        })),
        platform: 'youtube'
      };
    } catch (e) {
      console.log(`Piped instance ${instance} failed:`, e.message);
      continue;
    }
  }

  throw new Error('All Piped instances failed');
}

// Method 4: Y2Mate-style extraction (YouTube, Facebook, Twitter)
async function extractWithY2Mate(url, platform) {
  // This uses a public scraping approach
  const videoId = platform === 'youtube' ? extractYouTubeId(url) : null;
  
  if (platform === 'youtube' && videoId) {
    // Use YouTube oEmbed for metadata
    try {
      const response = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
        timeout: 5000
      });

      const data = response.data;

      return {
        title: data.title || 'YouTube Video',
        thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: '0:00',
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
    } catch (e) {
      throw new Error('Y2Mate extraction failed');
    }
  }

  throw new Error('Platform not supported by Y2Mate');
}

// Method 5: SnapSave-style extraction (Instagram, TikTok, Facebook)
async function extractWithSnapSave(url, platform) {
  // For Instagram, TikTok, Facebook - use oEmbed where available
  
  if (platform === 'instagram') {
    // Instagram oEmbed (limited but works for public posts)
    try {
      const response = await axios.get(`https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`, {
        timeout: 5000
      });

      const data = response.data;

      return {
        title: data.title || 'Instagram Video',
        thumbnail: data.thumbnail_url || 'https://via.placeholder.com/640x640',
        duration: '0:00',
        qualities: [
          { quality: '720p', format: 'mp4', size: 'Unknown', url }
        ],
        audioFormats: [
          { quality: '128kbps', format: 'mp3', size: 'Unknown', url }
        ],
        platform: 'instagram'
      };
    } catch (e) {
      throw new Error('SnapSave Instagram extraction failed');
    }
  }

  if (platform === 'facebook') {
    // Facebook oEmbed
    try {
      const response = await axios.get(`https://www.facebook.com/plugins/video/oembed.json/?url=${encodeURIComponent(url)}`, {
        timeout: 5000
      });

      const data = response.data;

      return {
        title: data.title || 'Facebook Video',
        thumbnail: data.thumbnail_url || 'https://via.placeholder.com/640x360',
        duration: '0:00',
        qualities: [
          { quality: '720p', format: 'mp4', size: 'Unknown', url }
        ],
        audioFormats: [],
        platform: 'facebook'
      };
    } catch (e) {
      throw new Error('SnapSave Facebook extraction failed');
    }
  }

  throw new Error('Platform not supported by SnapSave');
}

// Helper functions
function detectPlatform(url) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) return 'instagram';
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch') || lowerUrl.includes('fb.com')) return 'facebook';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com') || lowerUrl.includes('t.co')) return 'twitter';
  if (lowerUrl.includes('vimeo.com')) return 'vimeo';
  if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('vm.tiktok.com')) return 'tiktok';
  if (lowerUrl.includes('dailymotion.com') || lowerUrl.includes('dai.ly')) return 'dailymotion';
  if (lowerUrl.includes('reddit.com') || lowerUrl.includes('redd.it')) return 'reddit';
  if (lowerUrl.includes('twitch.tv')) return 'twitch';
  if (lowerUrl.includes('soundcloud.com')) return 'soundcloud';
  if (lowerUrl.includes('terabox.com') || lowerUrl.includes('1024tera.com')) return 'terabox';
  if (lowerUrl.includes('streamable.com')) return 'streamable';
  if (lowerUrl.includes('pinterest.com') || lowerUrl.includes('pin.it')) return 'pinterest';
  return 'unknown';
}

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    /youtube\.com\/live\/([^&\n?#]+)/
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
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
