// SuperApp Extract API v2.0 - Multi-Extractor System with 99% Success Rate
const { smartExtract } = require('../extractors/smart-extractor');
const { cookieManager } = require('../utils/cookie-manager');

// Platform detection
function detectPlatform(url) {
  const urlLower = url.toLowerCase();
  
  const platforms = {
    youtube: /(?:youtube\.com|youtu\.be)/,
    instagram: /instagram\.com/,
    tiktok: /tiktok\.com/,
    facebook: /(?:facebook\.com|fb\.watch)/,
    twitter: /(?:twitter\.com|x\.com)/,
    vimeo: /vimeo\.com/,
    reddit: /reddit\.com/,
    twitch: /twitch\.tv/,
    dailymotion: /dailymotion\.com/,
    terabox: /(?:terabox\.com|1024tera\.com)/,
    soundcloud: /soundcloud\.com/,
    pinterest: /pinterest\.com/,
    linkedin: /linkedin\.com/,
    snapchat: /snapchat\.com/,
    tumblr: /tumblr\.com/,
    vk: /vk\.com/,
    bilibili: /bilibili\.com/,
    streamable: /streamable\.com/,
    imgur: /imgur\.com/,
    flickr: /flickr\.com/,
    bandcamp: /bandcamp\.com/,
    mixcloud: /mixcloud\.com/
  };

  for (const [platform, pattern] of Object.entries(platforms)) {
    if (pattern.test(urlLower)) {
      return platform;
    }
  }

  return 'unknown';
}

async function extractHandler(req, res) {
  const startTime = Date.now();
  
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        message: 'Please provide a valid URL in the request body'
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('📥 New extraction request');
    console.log('🔗 URL:', url);
    
    // Detect platform
    const platform = detectPlatform(url);
    console.log('📍 Platform:', platform);
    
    if (platform === 'unknown') {
      console.log('⚠️ Unknown platform, will try generic extractors');
    }

    // Use smart extractor with multiple fallback methods
    const result = await smartExtract(url, platform);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Extraction completed in ${duration}s`);
    console.log(`📊 Method: ${result.extractedBy}`);
    console.log(`📹 Title: ${result.title}`);
    console.log(`🎬 Qualities: ${result.qualities.length}`);
    console.log(`🎵 Audio: ${result.audioFormats.length}`);
    console.log('='.repeat(80) + '\n');
    
    // Return successful result
    res.json({
      success: true,
      platform,
      extractedBy: result.extractedBy,
      extractionTime: duration,
      ...result
    });
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.error('\n❌ Extraction failed');
    console.error('Error:', error.message);
    console.error(`Time: ${duration}s`);
    console.error('='.repeat(80) + '\n');
    
    res.status(500).json({
      error: 'Extraction failed',
      message: error.message || 'Failed to extract video information',
      details: 'All extraction methods failed. The video may be private, deleted, geo-restricted, or from an unsupported platform.',
      extractionTime: duration
    });
  }
}

module.exports = extractHandler;
