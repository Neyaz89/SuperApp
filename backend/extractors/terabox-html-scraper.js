// Terabox HTML Scraper - Extracts download links directly from HTML like Universal Scraper
const axios = require('axios');
const cheerio = require('cheerio');

async function extractTeraboxHTML(url) {
  console.log('🔵 Terabox HTML Scraper: Extracting like Universal Scraper...');
  
  try {
    // Fetch the page HTML
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.terabox.app/',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    // Check if response is JSON error (Terabox blocking)
    if (response.headers['content-type']?.includes('application/json')) {
      const jsonData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      if (jsonData.errno) {
        throw new Error(`Terabox blocked request: errno ${jsonData.errno} - ${jsonData.errmsg}`);
      }
    }
    
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const $ = cheerio.load(html);
    
    console.log('📄 Got HTML, length:', html.length);
    
    const videoUrls = new Set();
    let title = 'Terabox File';
    let thumbnail = '';
    let fileSize = 0;

    // Method 1: Extract from window.locals (most reliable)
    const localsMatch = html.match(/window\.locals\s*=\s*({[\s\S]*?});/);
    if (localsMatch) {
      try {
        const locals = JSON.parse(localsMatch[1]);
        console.log('✅ Found window.locals');
        
        if (locals.file_list && locals.file_list.length > 0) {
          const file = locals.file_list[0];
          title = file.server_filename || title;
          fileSize = file.size || 0;
          thumbnail = file.thumbs?.url3 || file.thumbs?.url2 || '';
          
          if (file.dlink) {
            console.log('✅ Found dlink in window.locals');
            videoUrls.add(file.dlink);
          }
        }
      } catch (e) {
        console.log('⚠️ Failed to parse window.locals:', e.message);
      }
    }

    // Method 2: Look for video URLs in script tags
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html();
      if (!scriptContent) return;
      
      // Look for dlink patterns
      const dlinkMatches = scriptContent.match(/"dlink"\s*:\s*"([^"]+)"/g);
      if (dlinkMatches) {
        dlinkMatches.forEach(match => {
          const urlMatch = match.match(/"dlink"\s*:\s*"([^"]+)"/);
          if (urlMatch) {
            const cleanUrl = urlMatch[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
            if (cleanUrl.startsWith('http')) {
              videoUrls.add(cleanUrl);
            }
          }
        });
      }
      
      // Look for direct video URLs
      const videoPatterns = [
        /(https?:\/\/[^\s"'<>]+\.(?:mp4|mkv|avi|mov|webm|flv)(?:\?[^\s"'<>]*)?)/gi,
        /(https?:\/\/[^\s"'<>]*terabox[^\s"'<>]*\/[^\s"'<>]+)/gi,
      ];
      
      videoPatterns.forEach(pattern => {
        const matches = scriptContent.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const cleanUrl = match.replace(/['"\\]/g, '');
            if (cleanUrl.includes('terabox') || cleanUrl.match(/\.(mp4|mkv|avi|mov|webm|flv)(\?|$)/i)) {
              videoUrls.add(cleanUrl);
            }
          });
        }
      });
    });

    // Method 3: Look for download buttons/links
    $('a[href*="download"], button[data-url], [data-dlink]').each((i, elem) => {
      const href = $(elem).attr('href');
      const dataUrl = $(elem).attr('data-url');
      const dataDlink = $(elem).attr('data-dlink');
      
      [href, dataUrl, dataDlink].forEach(url => {
        if (url && url.startsWith('http')) {
          videoUrls.add(url);
        }
      });
    });

    // Method 4: Extract title from meta tags if not found
    if (title === 'Terabox File') {
      title = $('title').text().trim() || 
              $('meta[property="og:title"]').attr('content') || 
              $('meta[name="twitter:title"]').attr('content') || 
              'Terabox File';
      
      // Clean up title
      title = title.replace(/ - Share Files.*$/i, '').replace(/ - TeraBox$/i, '').trim();
    }

    // Method 5: Extract thumbnail if not found
    if (!thumbnail) {
      thumbnail = $('meta[property="og:image"]').attr('content') || 
                  $('meta[name="twitter:image"]').attr('content') || 
                  '';
    }

    // Convert Set to Array
    const uniqueUrls = Array.from(videoUrls).filter(url => {
      // Filter out non-video URLs
      return url.includes('terabox') || url.match(/\.(mp4|mkv|avi|mov|webm|flv)(\?|$)/i);
    });

    if (uniqueUrls.length === 0) {
      throw new Error('No video URLs found in HTML');
    }

    console.log(`✅ Found ${uniqueUrls.length} potential download URL(s)`);

    // Format file size
    const sizeMB = fileSize > 0 ? (fileSize / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown';

    // Create qualities array
    const qualities = uniqueUrls.map((videoUrl, index) => ({
      quality: index === 0 ? 'Original' : `Option ${index + 1}`,
      format: title.split('.').pop() || 'mp4',
      size: sizeMB,
      url: videoUrl,
      hasAudio: true,
      hasVideo: true,
      needsProxy: false,
    }));

    return {
      title: title,
      thumbnail: thumbnail || 'https://via.placeholder.com/640x360',
      duration: '0:00',
      qualities: qualities,
      audioFormats: [],
      platform: 'terabox',
      extractionMethod: 'Terabox HTML Scraper',
    };

  } catch (error) {
    console.error('❌ Terabox HTML Scraper failed:', error.message);
    throw error;
  }
}

module.exports = { extractTeraboxHTML };
