// Download Proxy - Proxies video downloads with proper headers
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url, referer } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('🔽 Proxying download:', url);
    console.log('🔗 Referer:', referer || 'none');

    // Extract domain from URL for referer
    const urlObj = new URL(url);
    const defaultReferer = `${urlObj.protocol}//${urlObj.hostname}/`;
    const finalReferer = referer || defaultReferer;

    // Detect if this is a Terabox URL or Ashlynn proxy
    const isTerabox = url.includes('terabox') || url.includes('dubox') || url.includes('1024tera');
    const isAshlynnProxy = url.includes('ashlynn.workers.dev');

    // For sites that need session cookies, fetch the referer page first
    let cookies = '';
    
    // Detect adult sites that need special handling
    const isAdultSite = url.includes('desikahani') || 
                        url.includes('hdtube.porn') || 
                        url.includes('xvideos') ||
                        url.includes('pornhub') ||
                        url.includes('get_file');
    
    // For Ashlynn proxy, it handles cookies internally - just pass through
    if (isAshlynnProxy) {
      console.log('🔵 Ashlynn proxy detected - letting proxy handle authentication');
      // Ashlynn proxy handles cookies internally, no need to add them
    }
    // For direct Terabox URLs, add authentication cookies
    else if (isTerabox) {
      console.log('🔵 Terabox detected - adding authentication cookies');
      
      // Terabox requires these cookies for download authentication
      cookies = [
        'browserid=ECp8myR7LciVVyrKxhjseu5DsPlsBGfcO2llDtQXqlF9ol1xSxrOyu-zQOo=',
        '__bid_n=18de05eca9a9ef426f4207',
        'ndus=Ye4ozFx5eHuiHedfAOmdECQ1cUYjXwfZF6VF4QbD',
        'TSID=JmuRgIKcaPqMjlzvZE5wXOJD96SkO594',
        'PANWEB=1',
        'csrfToken=8nN5Q8Y5H71nPyC8NHxBYAcr',
        'lang=en',
        'ndut_fmt=A66A9E7BD20D40C268FB5C44A4E512FB76288B038CE8454BBB5B6BA0DB474814'
      ].join('; ');
      
      console.log('✓ Added Terabox authentication cookies');
    }
    // For adult sites, fetch session cookies
    else if (isAdultSite) {
      try {
        console.log('🍪 Fetching session cookies from:', finalReferer);
        const pageResponse = await axios.get(finalReferer, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          timeout: 10000,
          maxRedirects: 5,
        });
        
        // Extract cookies from response
        if (pageResponse.headers['set-cookie']) {
          cookies = pageResponse.headers['set-cookie']
            .map(cookie => cookie.split(';')[0])
            .join('; ');
          console.log('✓ Got session cookies:', cookies.substring(0, 100) + '...');
        }
      } catch (e) {
        console.log('⚠️ Could not fetch session cookies:', e.message);
      }
    }

    // Build headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': finalReferer,
      'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'identity',
      'Range': req.headers.range || 'bytes=0-',
    };

    // Add cookies if we got them
    if (cookies) {
      headers['Cookie'] = cookies;
    }

    console.log('📥 Downloading with headers...');

    // Stream the video with proper headers
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: headers,
      timeout: 300000, // 5 minutes
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Accept redirects and client errors
    });

    // Check if we got an error response
    if (response.status === 404) {
      console.error('❌ Video URL returned 404 - URL may be expired or invalid');
      return res.status(404).json({ 
        error: 'Video not found',
        message: 'The video URL may have expired. Please try extracting again.' 
      });
    }

    if (response.status === 403) {
      console.error('❌ Access forbidden - may need authentication');
      return res.status(403).json({ 
        error: 'Access forbidden',
        message: 'This video requires authentication or has restricted access.' 
      });
    }

    // Set response headers
    res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
    res.setHeader('Content-Length', response.headers['content-length'] || '0');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (response.headers['content-range']) {
      res.setHeader('Content-Range', response.headers['content-range']);
      res.status(206); // Partial Content
    }

    console.log('✓ Streaming video...');

    // Pipe the video stream to response
    response.data.pipe(res);

    response.data.on('error', (error) => {
      console.error('❌ Stream error:', error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error' });
      }
    });

    res.on('close', () => {
      console.log('✅ Download proxy stream closed');
      response.data.destroy();
    });

  } catch (error) {
    console.error('❌ Download proxy error:', error.message);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Download proxy failed',
        message: error.message 
      });
    }
  }
};
