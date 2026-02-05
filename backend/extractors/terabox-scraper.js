// Terabox Scraper - Extracts like a browser does
const fetch = require('node-fetch');

async function extractTeraboxScraper(url) {
  console.log('🔵 Terabox Scraper: Starting browser-like extraction...');
  
  // Extract share ID
  let shareId = '';
  const patterns = [
    /\/s\/([a-zA-Z0-9_-]+)/,
    /surl=([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      shareId = match[1];
      break;
    }
  }
  
  if (!shareId) {
    throw new Error('Invalid Terabox URL');
  }
  
  console.log('📋 Share ID:', shareId);
  
  try {
    // Step 1: Get the share page HTML (like a browser)
    console.log('📡 Fetching share page...');
    
    const pageUrl = `https://www.terabox.app/sharing/link?surl=${shareId}`;
    
    const pageResponse = await fetch(pageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.terabox.app/',
        'Connection': 'keep-alive'
      },
      redirect: 'follow',
      timeout: 30000
    });
    
    if (!pageResponse.ok) {
      throw new Error(`Page returned ${pageResponse.status}`);
    }
    
    const html = await pageResponse.text();
    console.log('📄 Got page HTML, length:', html.length);
    
    // Step 2: Extract data from HTML (Terabox embeds JSON in the page)
    // Look for window.jsToken, window.locals, or embedded JSON
    
    // Try to find jsToken
    const jsTokenMatch = html.match(/window\.jsToken\s*=\s*["']([^"']+)["']/);
    const jsToken = jsTokenMatch ? jsTokenMatch[1] : '';
    
    // Try to find share data
    const shareDataMatch = html.match(/window\.share\s*=\s*({[^;]+})/);
    let shareData = null;
    
    if (shareDataMatch) {
      try {
        shareData = JSON.parse(shareDataMatch[1]);
        console.log('✅ Found share data in HTML');
      } catch (e) {
        console.log('⚠️ Failed to parse share data');
      }
    }
    
    // Try to find file list data
    const fileListMatch = html.match(/window\.locals\s*=\s*({[^;]+})/);
    let fileList = null;
    
    if (fileListMatch) {
      try {
        const locals = JSON.parse(fileListMatch[1]);
        if (locals.file_list) {
          fileList = locals.file_list;
          console.log('✅ Found file list in HTML');
        }
      } catch (e) {
        console.log('⚠️ Failed to parse file list');
      }
    }
    
    // Step 3: Make API call with extracted data
    console.log('📡 Making API call...');
    
    const apiUrl = `https://www.terabox.app/share/list?app_id=250528&web=1&channel=dubox&clienttype=0&jsToken=${jsToken}&page=1&num=20&by=name&order=asc&shorturl=${shareId}&root=1`;
    
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': pageUrl,
        'Origin': 'https://www.terabox.app'
      },
      timeout: 20000
    });
    
    if (!apiResponse.ok) {
      throw new Error(`API returned ${apiResponse.status}`);
    }
    
    const apiData = await apiResponse.json();
    console.log('📦 API response errno:', apiData.errno);
    
    if (apiData.errno !== 0) {
      throw new Error(`API error: ${apiData.errno}`);
    }
    
    if (!apiData.list || apiData.list.length === 0) {
      throw new Error('No files found');
    }
    
    const fileInfo = apiData.list[0];
    console.log('📄 File:', fileInfo.server_filename);
    
    // Check for direct download link
    let downloadLink = fileInfo.dlink;
    
    if (!downloadLink) {
      // Try to get download link via API
      const downloadUrl = `https://www.terabox.app/share/download?app_id=250528&web=1&channel=dubox&clienttype=0&sign=${apiData.sign}&timestamp=${apiData.timestamp}&shareid=${apiData.shareid}&uk=${apiData.uk}&primaryid=${apiData.shareid}&fid_list=[${fileInfo.fs_id}]`;
      
      const downloadResponse = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': pageUrl
        },
        timeout: 20000
      });
      
      if (downloadResponse.ok) {
        const downloadData = await downloadResponse.json();
        if (downloadData.list && downloadData.list[0]) {
          downloadLink = downloadData.list[0].dlink;
        }
      }
    }
    
    if (!downloadLink) {
      throw new Error('No download link found');
    }
    
    console.log('✅ SUCCESS! Got download link');
    
    const fileSize = fileInfo.size || 0;
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    
    return {
      title: fileInfo.server_filename || 'Terabox File',
      thumbnail: fileInfo.thumbs?.url3 || fileInfo.thumbs?.url2 || 'https://via.placeholder.com/640x360',
      duration: '0:00',
      qualities: [
        {
          quality: 'Original',
          format: fileInfo.server_filename?.split('.').pop() || 'mp4',
          size: `${sizeMB} MB`,
          url: downloadLink
        }
      ],
      audioFormats: [],
      platform: 'terabox',
      extractionMethod: 'Terabox Scraper'
    };
    
  } catch (error) {
    console.log('❌ Terabox Scraper failed:', error.message);
    throw error;
  }
}

module.exports = { extractTeraboxScraper };
