// Test to see what's in the Terabox HTML
const https = require('https');

async function testTeraboxHTML() {
  const shareId = '1qp35pIpbJKDRroew5fELNQ';
  const pageUrl = `https://www.terabox.app/sharing/link?surl=${shareId}`;
  
  console.log('Fetching:', pageUrl);
  
  return new Promise((resolve, reject) => {
    https.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (response) => {
      let html = '';
      
      response.on('data', (chunk) => {
        html += chunk;
      });
      
      response.on('end', () => {
        console.log('HTML length:', html.length);
        
        // Look for window.locals
        const localsMatch = html.match(/window\.locals\s*=\s*({[\s\S]{0,5000}?});/);
        if (localsMatch) {
          console.log('\n✅ Found window.locals!');
          console.log('Locals content (first 1000 chars):');
          console.log(localsMatch[1].substring(0, 1000));
          
          try {
            const locals = JSON.parse(localsMatch[1]);
            console.log('\n✅ Parsed locals successfully!');
            console.log('Keys:', Object.keys(locals));
            
            if (locals.file_list) {
              console.log('\n✅ Found file_list!');
              console.log('Files:', locals.file_list.length);
              if (locals.file_list[0]) {
                const file = locals.file_list[0];
                console.log('\nFile info:');
                console.log('- Name:', file.server_filename);
                console.log('- Size:', file.size);
                console.log('- Has dlink:', !!file.dlink);
                if (file.dlink) {
                  console.log('- dlink:', file.dlink.substring(0, 100) + '...');
                }
              }
            }
            
            if (locals.shareid) console.log('shareid:', locals.shareid);
            if (locals.uk) console.log('uk:', locals.uk);
            
          } catch (e) {
            console.log('❌ Failed to parse locals:', e.message);
          }
        } else {
          console.log('\n❌ window.locals not found');
          
          // Try alternative patterns
          console.log('\nTrying alternative patterns...');
          
          const alt1 = html.match(/var\s+locals\s*=\s*({[\s\S]{0,1000}?});/);
          if (alt1) {
            console.log('✅ Found "var locals"');
            console.log(alt1[1].substring(0, 500));
          }
          
          const alt2 = html.match(/locals\s*=\s*({[\s\S]{0,1000}?});/);
          if (alt2) {
            console.log('✅ Found "locals ="');
            console.log(alt2[1].substring(0, 500));
          }
        }
        
        resolve();
      });
    }).on('error', reject);
  });
}

testTeraboxHTML().catch(console.error);
