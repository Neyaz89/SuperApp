// Custom YouTube Extractor - Direct API access (faster than yt-dlp)
const fetch = require('node-fetch');

const YOUTUBE_API = 'https://www.youtube.com/youtubei/v1/player';
const API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'; // Public YouTube API key

async function extractYouTubeCustom(url) {
  console.log('🔴 YouTube Custom: Starting extraction...');
  
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const response = await fetch(`${YOUTUBE_API}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        videoId: videoId,
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240101.00.00'
          }
        }
      }),
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`YouTube API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.videoDetails) {
      throw new Error('No video details in response');
    }

    return formatYouTubeResponse(data);
    
  } catch (error) {
    console.error('❌ YouTube Custom failed:', error.message);
    throw error;
  }
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function formatYouTubeResponse(data) {
  const details = data.videoDetails;
  const streamingData = data.streamingData || {};
  
  const result = {
    title: details.title || 'YouTube Video',
    thumbnail: details.thumbnail?.thumbnails?.[0]?.url || 'https://via.placeholder.com/640x360',
    duration: formatDuration(details.lengthSeconds),
    qualities: [],
    audioFormats: []
  };

  // Extract video formats
  const formats = streamingData.formats || [];
  const adaptiveFormats = streamingData.adaptiveFormats || [];
  
  // Regular formats (video + audio combined)
  formats.forEach(format => {
    if (format.mimeType?.includes('video')) {
      result.qualities.push({
        quality: `${format.qualityLabel || format.quality || 'Unknown'}`,
        format: getExtension(format.mimeType),
        size: formatSize(format.contentLength),
        url: format.url || format.signatureCipher
      });
    }
  });

  // Adaptive formats (separate video/audio)
  adaptiveFormats.forEach(format => {
    if (format.mimeType?.includes('video')) {
      result.qualities.push({
        quality: `${format.qualityLabel || format.quality || 'Unknown'}`,
        format: getExtension(format.mimeType),
        size: formatSize(format.contentLength),
        url: format.url || format.signatureCipher
      });
    } else if (format.mimeType?.includes('audio')) {
      result.audioFormats.push({
        quality: `${format.audioQuality || format.bitrate || 'Unknown'}`,
        format: getExtension(format.mimeType),
        size: formatSize(format.contentLength),
        url: format.url || format.signatureCipher
      });
    }
  });

  // Remove duplicates and sort by quality
  result.qualities = removeDuplicates(result.qualities);
  result.audioFormats = removeDuplicates(result.audioFormats);

  console.log('✅ YouTube Custom extraction successful');
  return result;
}

function formatDuration(seconds) {
  if (!seconds) return 'Unknown';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getExtension(mimeType) {
  if (!mimeType) return 'mp4';
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('mp3')) return 'mp3';
  if (mimeType.includes('m4a')) return 'm4a';
  return 'mp4';
}

function formatSize(bytes) {
  if (!bytes) return 'Unknown';
  const mb = (bytes / (1024 * 1024)).toFixed(2);
  return `${mb} MB`;
}

function removeDuplicates(arr) {
  const seen = new Set();
  return arr.filter(item => {
    const key = `${item.quality}-${item.format}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = { extractYouTubeCustom };
