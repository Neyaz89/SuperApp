const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SuperApp Video Downloader API',
    version: '1.0.0'
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SuperApp API - Use POST /api/extract with {url: "..."}' 
  });
});

// Extract video info
app.post('/api/extract', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const platform = detectPlatform(url);

    switch (platform) {
      case 'youtube':
        return await handleYouTube(url, res);
      case 'instagram':
        return await handleInstagram(url, res);
      case 'facebook':
        return await handleFacebook(url, res);
      case 'twitter':
        return await handleTwitter(url, res);
      case 'vimeo':
        return await handleVimeo(url, res);
      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to extract video',
      message: error.message 
    });
  }
});

// YouTube handler
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

    res.json({
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

// Instagram handler
async function handleInstagram(url, res) {
  res.json({
    title: 'Instagram Video',
    thumbnail: 'https://via.placeholder.com/640x640',
    duration: '0:00',
    qualities: [
      { quality: '720p', format: 'mp4', size: 'Unknown', url }
    ],
    audioFormats: [],
    platform: 'instagram'
  });
}

// Facebook handler
async function handleFacebook(url, res) {
  res.json({
    title: 'Facebook Video',
    thumbnail: 'https://via.placeholder.com/640x360',
    duration: '0:00',
    qualities: [
      { quality: '720p', format: 'mp4', size: 'Unknown', url }
    ],
    audioFormats: [],
    platform: 'facebook'
  });
}

// Twitter handler
async function handleTwitter(url, res) {
  res.json({
    title: 'Twitter Video',
    thumbnail: 'https://via.placeholder.com/640x360',
    duration: '0:00',
    qualities: [
      { quality: '720p', format: 'mp4', size: 'Unknown', url }
    ],
    audioFormats: [],
    platform: 'twitter'
  });
}

// Vimeo handler
async function handleVimeo(url, res) {
  res.json({
    title: 'Vimeo Video',
    thumbnail: 'https://via.placeholder.com/640x360',
    duration: '0:00',
    qualities: [
      { quality: '1080p', format: 'mp4', size: 'Unknown', url }
    ],
    audioFormats: [],
    platform: 'vimeo'
  });
}

// Helper functions
function detectPlatform(url) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('instagram.com')) return 'instagram';
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) return 'facebook';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter';
  if (lowerUrl.includes('vimeo.com')) return 'vimeo';
  return null;
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

// For Vercel serverless
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 SuperApp API running on port ${PORT}`);
  });
}
