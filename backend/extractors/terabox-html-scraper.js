// Terabox HTML Scraper - Extracts download links directly from HTML like Universal Scraper
const axios = require('axios');
const cheerio = require('cheerio');

async function extractTeraboxHTML(url) {
  console.log('🔵 Terabox HTML Scraper: Extracting dlink from page...');
  
  try {
    // Fetch the page HTML with proper headers to avoid blocking
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.terabox.app/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    });

    console.log('📄 Response status:', response.status);
    console.log('📄 Content-Type:', response.headers['content-type']);

    // Check if response is JSON error (Terabox blocking)
    if (response.headers['content-type']?.includes('application/json')) {
      const jsonData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      console.log('⚠️ Got JSON response:', jsonData);
      if (jsonData.errno) {
        throw new Error(`Terabox blocked: errno ${jsonData.errno} - ${jsonData.errmsg || 'verification required'}`);
      }
    }
    
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    
    if (html.length < 1000) {
      console.log('⚠️ Response too short, likely blocked');
      throw new Error('Terabox returned minimal response - likely blocked');
    }
    
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
        console.log('Keys:', Object.keys(locals));
        
        if (locals.file_list && locals.file_list.length > 0) {
          const file = locals.file_list[0];
          console.log('File keys:', Object.keys(file));
          title = file.server_filename || title;
          fileSize = file.size || 0;
          thumbnail = file.thumbs?.url3 || file.thumbs?.url2 || '';
          
          if (file.dlink) {
            console.log('✅ Found dlink in window.locals:', file.dlink.substring(0, 100) + '...');
            videoUrls.add(file.dlink);
          } else {
            console.log('⚠️ No dlink in file object');
          }
        } else {
          console.log('⚠️ No file_list in locals');
        }
      } catch (e) {
        console.log('⚠️ Failed to parse window.locals:', e.message);
      }
    } else {
      console.log('⚠️ window.locals not found in HTML');
      
      // Try to find any JSON data in the HTML
      const jsonMatches = html.match(/{[^{}]*"dlink"[^{}]*}/g);
      if (jsonMatches) {
        console.log(`Found ${jsonMatches.length} potential JSON objects with dlink`);
        jsonMatches.forEach((match, i) => {
          console.log(`JSON ${i}:`, match.substring(0, 200));
        });
      }
    }

    // Method 2: Look for video URLs in script tags
    console.log('🔍 Searching script tags for dlink...');
    let scriptCount = 0;
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html();
      if (!scriptContent) return;
      scriptCount++;
      
      // Look for dlink patterns
      const dlinkMatches = scriptContent.match(/"dlink"\s*:\s*"([^"]+)"/g);
      if (dlinkMatches) {
        console.log(`✅ Found ${dlinkMatches.length} dlink(s) in script ${i}`);
        dlinkMatches.forEach(match => {
          const urlMatch = match.match(/"dlink"\s*:\s*"([^"]+)"/);
          if (urlMatch) {
            let cleanUrl = urlMatch[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
            console.log('Extracted dlink:', cleanUrl.substring(0, 100) + '...');
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
    console.log(`Searched ${scriptCount} script tags`);

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
