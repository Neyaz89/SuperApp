const ytdl = require('ytdl-core');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
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

    if (platform === 'youtube') {
      return await handleYouTube(url, res);
    }

    // Fallback for other platforms
    return res.json({
      title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
      thumbnail: 'https://via.placeholder.com/640x360',
      duration: '0:00',
      qualities: [
        { quality: '720p', format: 'mp4', size: 'Unknown', url }
      ],
      audioFormats: [],
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

async function handleYouTube(url, res) {
  try {
    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    const qualities = formats
      .filter(f => f.qualityLabel)
      .map(f => ({
        quality: f.qualityLabel,
        format: f.container,
        size: f.contentLength ? formatBytes(f.contentLength) : 'Unknown',
        url: f.url,
        itag: f.itag
      }))
      .sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

    const audio = audioFormats
      .filter(f => f.audioBitrate)
      .map(f => ({
        quality: `${f.audioBitrate}kbps`,
        format: f.container,
        size: f.contentLength ? formatBytes(f.contentLength) : 'Unknown',
        url: f.url,
        itag: f.itag
      }))
      .sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

    return res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      duration: formatDuration(info.videoDetails.lengthSeconds),
      qualities: qualities.slice(0, 6),
      audioFormats: audio.slice(0, 3),
      platform: 'youtube'
    });
  } catch (error) {
    throw new Error('Failed to extract YouTube video: ' + error.message);
  }
}

function detectPlatform(url) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('instagram.com')) return 'instagram';
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) return 'facebook';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter';
  if (lowerUrl.includes('vimeo.com')) return 'vimeo';
  return 'unknown';
}

function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(0) + ' MB';
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
