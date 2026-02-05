// Terabox API Extractor - Direct API approach
const fetch = require('node-fetch');
const fs = require('fs');

async function extractTeraboxAPI(url) {
  console.log('🔵 Terabox: Starting direct API extraction...');
  
  // Extract share ID
  let shareId = '';
  const patterns = [
    /\/s\/([a-zA-Z0-9_-]+)/,
    /surl=([a-zA-Z0-9_-]+)/,
    /terabox(?:app)?\.com\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      shareId = match[1];
      break;
    }
  }
  
  if (!shareId) {
    throw new Error('Invalid Terabox URL - could not extract share ID');
  }
  
  console.log('📋 Share ID:', shareId);
  
  // Load cookies
  const cookieFile = '/app/terabox_cookies.txt';
  let ndus_cookie = '';
  
  if (fs.existsSync(cookieFile)) {
    const cookieContent = fs.readFileSync(cookieFile, 'utf8');
    
    // Parse Netscape cookie format
    const lines = cookieContent.split('\n');
    for (const line of lines) {
      if (line.startsWith('#') || line.trim() === '') continue;
      
      const parts = line.split('\t');
      if (parts.length >= 7) {
        const cookieName = parts[5];
        const cookieValue = parts[6];
        
        if (cookieName === 'ndus') {
          ndus_cookie = cookieValue;
          console.log('✅ Found ndus cookie');
          break;
        }
      }
    }
    
    if (!ndus_cookie) {
      console.log('⚠️ No ndus cookie found in file');
    }
  }
  
  try {
    // Step 1: Get file list from share
    console.log('📡 Step 1: Getting file list...');
    
    const listUrl = `https://www.terabox.com/share/list?app_id=250528&web=1&channel=dubox&clienttype=0&jsToken=&dp-logid=&page=1&num=20&by=name&order=asc&site_referer=&shorturl=${shareId}&root=1`;
    
    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `https://www.terabox.com/s/${shareId}`,
        'Cookie': ndus_cookie ? `ndus=${ndus_cookie}` : '',
        'Origin': 'https://www.terabox.com'
      },
      timeout: 20000
    });
    
    if (!listResponse.ok) {
      throw new Error(`List API returned ${listResponse.status}`);
    }
    
    const listData = await listResponse.json();
    console.log('📦 List response errno:', listData.errno);
    
    if (listData.errno !== 0) {
      throw new Error(`API error: ${listData.errno} - ${listData.errmsg || 'Unknown error'}`);
    }
    
    if (!listData.list || listData.list.length === 0) {
      throw new Error('No files found in share');
    }
    
    const fileInfo = listData.list[0];
    console.log('📄 File:', fileInfo.server_filename);
    console.log('🆔 FS ID:', fileInfo.fs_id);
    
    // Check if dlink is already in the response (sometimes it is)
    let downloadLink = fileInfo.dlink;
    
    if (!downloadLink) {
      // Step 2: Get download link if not in list response
      console.log('📡 Step 2: Getting download link...');
      
      const downloadUrl = `https://www.terabox.com/share/download?app_id=250528&web=1&channel=dubox&clienttype=0&sign=${listData.sign}&timestamp=${listData.timestamp}&shareid=${listData.shareid}&uk=${listData.uk}&primaryid=${listData.shareid}&fid_list=[${fileInfo.fs_id}]`;
      
      const downloadResponse = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': `https://www.terabox.com/s/${shareId}`,
          'Cookie': ndus_cookie ? `ndus=${ndus_cookie}` : '',
          'Origin': 'https://www.terabox.com'
        },
        timeout: 20000
      });
      
      if (!downloadResponse.ok) {
        throw new Error(`Download API returned ${downloadResponse.status}`);
      }
      
      const downloadData = await downloadResponse.json();
      console.log('💾 Download response errno:', downloadData.errno);
      
      if (downloadData.errno !== 0) {
        throw new Error(`Download API error: ${downloadData.errno}`);
      }
      
      if (!downloadData.list || downloadData.list.length === 0) {
        throw new Error('No download link returned');
      }
      
      downloadLink = downloadData.list[0].dlink;
    }
    
    if (!downloadLink) {
      throw new Error('Download link is empty');
    }
    
    console.log('✅ SUCCESS! Got download link');
    
    // Format response
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
      extractionMethod: 'Terabox Direct API'
    };
    
  } catch (error) {
    console.log('❌ Terabox Direct API failed:', error.message);
    throw error;
  }
}

module.exports = { extractTeraboxAPI };
