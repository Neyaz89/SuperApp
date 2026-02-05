// Terabox Puppeteer Extractor - Uses headless browser to bypass IP blocking
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

async function extractTeraboxPuppeteer(url) {
  console.log('🔵 Terabox Puppeteer: Starting browser extraction...');
  
  let browser = null;
  
  try {
    // Launch headless browser
    console.log('🚀 Launching headless browser...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    
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
    
    // Navigate to Terabox share page
    const pageUrl = `https://www.terabox.app/sharing/link?surl=${shareId}`;
    console.log('📡 Loading page:', pageUrl);
    
    await page.goto(pageUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('✅ Page loaded');
    
    // Wait for the page to fully load and execute JavaScript
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Extract file data from window.locals
    console.log('🔍 Extracting file data...');
    
    const fileData = await page.evaluate(() => {
      // Try to get data from window.locals
      if (window.locals && window.locals.file_list && window.locals.file_list.length > 0) {
        const file = window.locals.file_list[0];
        return {
          success: true,
          title: file.server_filename || 'Terabox File',
          size: file.size || 0,
          dlink: file.dlink || null,
          thumbnail: file.thumbs?.url3 || file.thumbs?.url2 || null,
          fs_id: file.fs_id,
          shareid: window.locals.shareid,
          uk: window.locals.uk,
          sign: window.locals.sign,
          timestamp: window.locals.timestamp
        };
      }
      
      return { success: false };
    });
    
    if (!fileData.success) {
      throw new Error('Could not extract file data from page');
    }
    
    console.log('📄 File:', fileData.title);
    console.log('💾 Size:', (fileData.size / (1024 * 1024)).toFixed(2), 'MB');
    
    let downloadLink = fileData.dlink;
    
    // If no direct link, try to get it via download API
    if (!downloadLink && fileData.fs_id && fileData.shareid && fileData.uk) {
      console.log('🔗 Getting download link...');
      
      const downloadUrl = `https://www.terabox.app/share/download?app_id=250528&web=1&channel=dubox&clienttype=0&sign=${fileData.sign}&timestamp=${fileData.timestamp}&shareid=${fileData.shareid}&uk=${fileData.uk}&primaryid=${fileData.shareid}&fid_list=[${fileData.fs_id}]`;
      
      const downloadData = await page.evaluate(async (url) => {
        try {
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.errno === 0 && data.list && data.list[0]) {
            return { success: true, dlink: data.list[0].dlink };
          }
          
          return { success: false, errno: data.errno };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }, downloadUrl);
      
      if (downloadData.success) {
        downloadLink = downloadData.dlink;
        console.log('✅ Got download link from API');
      } else {
        console.log('⚠️ Download API failed:', downloadData.errno || downloadData.error);
      }
    }
    
    if (!downloadLink) {
      throw new Error('No download link found');
    }
    
    console.log('✅ SUCCESS! Extraction complete');
    
    const sizeMB = (fileData.size / (1024 * 1024)).toFixed(2);
    
    return {
      title: fileData.title,
      thumbnail: fileData.thumbnail || 'https://via.placeholder.com/640x360',
      duration: '0:00',
      qualities: [
        {
          quality: 'Original',
          format: fileData.title.split('.').pop() || 'mp4',
          size: `${sizeMB} MB`,
          url: downloadLink
        }
      ],
      audioFormats: [],
      platform: 'terabox',
      extractionMethod: 'Terabox Puppeteer'
    };
    
  } catch (error) {
    console.log('❌ Terabox Puppeteer failed:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

module.exports = { extractTeraboxPuppeteer };
