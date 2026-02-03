const ytdl = require('@distube/ytdl-core');
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
    
    switch (platform) {
      case 'youtube':
        result = await extractYouTube(url);
        break;
      case 'instagram':
        result = await extractInstagram(url);
        break;
      case 'facebook':
        result = await extractFacebook(url);
        break;
      case 'twitter':
        result = await extractTwitter(url);
        break;
      case 'tiktok':
        result = await extractTikTok(url);
        break;
      default:
        result = await extractGeneric(url, platform);
    }

    return res.json(result);

  } catch (error) {
    console.error('Extraction error:', error);
    return res.status(500).json({ 
      error: 'Failed to extract video',
      message: error.message 
    });
  }
};

// YouTube extraction using ytdl-core
async function extractYouTube(url) {
  try {
    const info = await ytdl.getInfo(url);
    const videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    const qualities = videoFormats
      .filter(f => f.hasVideo && f.hasAudio)
      .sort((a, b) => (b.height || 0) - (a.height || 0))
      .slice(0, 5)
      .map(format => ({
        quality: `${format.height}p`,
        format: format.container || 'mp4',
        size: format.contentLength ? formatBytes(parseInt(format.contentLength)) : 'Unknown',
        url: format.url,
        itag: format.itag
      }));

    const audioQualities = audioFormats
      .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))
      .slice(0, 3)
      .map(format => ({
        quality: `${format.audioBitrate}kbps`,
        format: 'mp3',
        size: format.contentLength ? formatBytes(parseInt(format.contentLength)) : 'Unknown',
        url: format.url,
        itag: format.itag
      }));

    return {
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      duration: formatDuration(parseInt(info.videoDetails.lengthSeconds)),
      qualities: qualities.length > 0 ? qualities : [
        { quality: '720p', format: 'mp4', size: 'Unknown', url: videoFormats[0]?.url || url }
      ],
      audioFormats: audioQualities.length > 0 ? audioQualities : [
        { quality: '128kbps', format: 'mp3', size: 'Unknown', url: audioFormats[0]?.url || url }
      ],
      platform: 'youtube'
    };
  } catch (error) {
    console.error('YouTube extraction failed:', error);
    throw error;
  }
}

// Instagram extraction
async function extractInstagram(url) {
  try {
    // Method 1: Direct API approach
    const postId = url.match(/\/p\/([^\/\?]+)/)?.[1] || url.match(/\/reel\/([^\/\?]+)/)?.[1];
    
    if (!postId) {
      throw new Error('Invalid Instagram URL');
    }

    const apiUrl = `https://www.instagram.com/p/${postId}/?__a=1&__d=dis`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000
    });

    const data = response.data;
    const media = data.items?.[0] || data.graphql?.shortcode_media;

    if (!media) {
      throw new Error('Could not extract Instagram media');
    }

    const videoUrl = media.video_url || media.video_versions?.[0]?.url;
    const imageUrl = media.display_url || media.image_versions2?.candidates?.[0]?.url;
    const isVideo = !!videoUrl;

    return {
      title: media.caption?.text?.substring(0, 100) || 'Instagram Post',
      thumbnail: media.thumbnail_url || imageUrl || 'https://via.placeholder.com/640x360',
      duration: isVideo ? formatDuration(media.video_duration || 0) : '0:00',
      qualities: isVideo ? [
        { quality: '720p', format: 'mp4', size: 'Unknown', url: videoUrl }
      ] : [
        { quality: 'Original', format: 'jpg', size: 'Unknown', url: imageUrl }
      ],
      audioFormats: [],
      platform: 'instagram'
    };
  } catch (error) {
    console.error('Instagram extraction failed:', error);
    // Fallback to Cobalt
    return await extractWithCobalt(url, 'instagram');
  }
}

// Facebook extraction
async function extractFacebook(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const html = response.data;
    
    // Extract HD and SD video URLs from Facebook's HTML
    const hdMatch = html.match(/"playable_url_quality_hd":"([^"]+)"/);
    const sdMatch = html.match(/"playable_url":"([^"]+)"/);
    
    const hdUrl = hdMatch ? hdMatch[1].replace(/\\u0025/g, '%').replace(/\\\//g, '/') : null;
    const sdUrl = sdMatch ? sdMatch[1].replace(/\\u0025/g, '%').replace(/\\\//g, '/') : null;

    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1] : 'Facebook Video';

    const qualities = [];
    if (hdUrl) qualities.push({ quality: '720p', format: 'mp4', size: 'Unknown', url: hdUrl });
    if (sdUrl) qualities.push({ quality: '480p', format: 'mp4', size: 'Unknown', url: sdUrl });

    if (qualities.length === 0) {
      throw new Error('No video URLs found');
    }

    return {
      title,
      thumbnail: 'https://via.placeholder.com/640x360',
      duration: '0:00',
      qualities,
      audioFormats: [],
      platform: 'facebook'
    };
  } catch (error) {
    console.error('Facebook extraction failed:', error);
    return await extractWithCobalt(url, 'facebook');
  }
}

// Twitter extraction
async function extractTwitter(url) {
  try {
    // Use Twitter's syndication API
    const tweetId = url.match(/status\/(\d+)/)?.[1];
    
    if (!tweetId) {
      throw new Error('Invalid Twitter URL');
    }

    const apiUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const data = response.data;
    const video = data.video;

    if (!video || !video.variants) {
      throw new Error('No video found in tweet');
    }

    const videoVariants = video.variants
      .filter(v => v.type === 'video/mp4')
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    const qualities = videoVariants.map((v, i) => ({
      quality: i === 0 ? '720p' : i === 1 ? '480p' : '360p',
      format: 'mp4',
      size: 'Unknown',
      url: v.url
    }));

    return {
      title: data.text?.substring(0, 100) || 'Twitter Video',
      thumbnail: data.photos?.[0]?.url || 'https://via.placeholder.com/640x360',
      duration: '0:00',
      qualities,
      audioFormats: [],
      platform: 'twitter'
    };
  } catch (error) {
    console.error('Twitter extraction failed:', error);
    return await extractWithCobalt(url, 'twitter');
  }
}

// TikTok extraction
async function extractTikTok(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const html = response.data;
    
    // Extract video URL from TikTok's HTML
    const videoMatch = html.match(/"downloadAddr":"([^"]+)"/);
    const videoUrl = videoMatch ? videoMatch[1] : null;

    const titleMatch = html.match(/"desc":"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : 'TikTok Video';

    if (!videoUrl) {
      throw new Error('No video URL found');
    }

    return {
      title,
      thumbnail: 'https://via.placeholder.com/640x360',
      duration: '0:00',
      qualities: [
        { quality: '720p', format: 'mp4', size: 'Unknown', url: videoUrl }
      ],
      audioFormats: [],
      platform: 'tiktok'
    };
  } catch (error) {
    console.error('TikTok extraction failed:', error);
    return await extractWithCobalt(url, 'tiktok');
  }
}

// Generic extraction for other platforms
async function extractGeneric(url, platform) {
  return await extractWithCobalt(url, platform);
}

// Cobalt fallback
async function extractWithCobalt(url, platform) {
  try {
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
    
    if (data.status === 'error') {
      throw new Error(data.text || 'Cobalt extraction failed');
    }

    const videoUrl = data.url;
    
    return {
      title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
      thumbnail: data.thumb || 'https://via.placeholder.com/640x360',
      duration: '0:00',
      qualities: [
        { quality: '720p', format: 'mp4', size: 'Unknown', url: videoUrl }
      ],
      audioFormats: data.audio ? [
        { quality: '128kbps', format: 'mp3', size: 'Unknown', url: data.audio }
      ] : [],
      platform
    };
  } catch (error) {
    console.error('Cobalt fallback failed:', error);
    throw new Error('All extraction methods failed');
  }
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
    terabox: /terabox\.com/,
    streamable: /streamable\.com/,
    pinterest: /pinterest\.com/,
    linkedin: /linkedin\.com/,
    snapchat: /snapchat\.com/
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
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
