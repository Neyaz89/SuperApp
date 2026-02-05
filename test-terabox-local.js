// Test Terabox API locally
const fs = require('fs');

async function testTerabox() {
  const url = 'https://teraboxapp.com/s/1qp35pIpbJKDRroew5fELNQ';
  const shareId = '1qp35pIpbJKDRroew5fELNQ';
  
  console.log('Testing Terabox API locally...');
  console.log('Share ID:', shareId);
  
  // Load cookies
  const cookieFile = 'backend/terabox_cookies.txt';
  let ndus_cookie = '';
  
  if (fs.existsSync(cookieFile)) {
    const cookies = fs.readFileSync(cookieFile, 'utf8');
    const ndusMatch = cookies.match(/ndus=([^;]+)/);
    if (ndusMatch) {
      ndus_cookie = ndusMatch[1];
      console.log('✅ Found ndus cookie:', ndus_cookie.substring(0, 20) + '...');
    }
  } else {
    console.log('❌ No cookie file found');
  }
  
  try {
    // Step 1: Get file list
    console.log('\n📡 Step 1: Getting file list...');
    
    const listUrl = `https://www.terabox.com/share/list?app_id=250528&web=1&channel=dubox&clienttype=0&jsToken=&dp-logid=&page=1&num=20&by=name&order=asc&site_referer=&shorturl=${shareId}&root=1`;
    
    console.log('URL:', listUrl);
    
    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `https://www.terabox.com/s/${shareId}`,
        'Cookie': ndus_cookie ? `ndus=${ndus_cookie}` : '',
        'Origin': 'https://www.terabox.com'
      }
    });
    
    console.log('Status:', listResponse.status);
    
    const listData = await listResponse.json();
    console.log('\n📦 Response:');
    console.log(JSON.stringify(listData, null, 2));
    
    if (listData.errno !== 0) {
      console.log('\n❌ API Error:', listData.errno, listData.errmsg);
      return;
    }
    
    if (!listData.list || listData.list.length === 0) {
      console.log('\n❌ No files found');
      return;
    }
    
    const fileInfo = listData.list[0];
    console.log('\n✅ File found:', fileInfo.server_filename);
    console.log('Size:', (fileInfo.size / (1024 * 1024)).toFixed(2), 'MB');
    console.log('Has dlink:', !!fileInfo.dlink);
    
    if (fileInfo.dlink) {
      console.log('\n✅ SUCCESS! Download link:', fileInfo.dlink.substring(0, 100) + '...');
    } else {
      console.log('\n⚠️ No dlink in response, need to call download API');
    }
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

testTerabox();
