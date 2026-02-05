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
    
    // Initialize token variables
    let jsToken = '';
    let bdstoken = '';
    let logid = '';
    
    // Debug: Log a sample of the HTML to see what we're working with
    const htmlSample = html.substring(0, 5000);
    console.log('HTML sample (first 500 chars):', htmlSample.substring(0, 500));
    
    // Look for any script tags with data
    const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    if (scriptMatches) {
      console.log(`Found ${scriptMatches.length} script tags`);
      
      // Check each script for useful data
      for (let i = 0; i < Math.min(scriptMatches.length, 10); i++) {
        const script = scriptMatches[i];
        if (script.includes('locals') || script.includes('jsToken') || script.includes('file_list') || script.includes('decodeURIComponent')) {
          console.log(`Script ${i} contains useful data (length: ${script.length})`);
          console.log(`Script ${i} content:`, script.substring(0, 500));
          
          // Check for encoded jsToken in eval
          if (script.includes('decodeURIComponent') && script.includes('jsToken')) {
            const encodedMatch = script.match(/decodeURIComponent\(`([^`]+)`\)/);
            if (encodedMatch) {
              try {
                const decoded = decodeURIComponent(encodedMatch[1]);
                console.log('Decoded eval:', decoded.substring(0, 200));
                
                // Extract jsToken from decoded string - try fn("TOKEN") pattern first
                const tokenMatch = decoded.match(/fn\(["']([^"']+)["']\)/);
                if (tokenMatch) {
                  jsToken = tokenMatch[1];
                  console.log('✅ Extracted jsToken from fn() call:', jsToken.substring(0, 50) + '...');
                } else {
                  // Try alternative pattern: jsToken = "TOKEN"
                  const altMatch = decoded.match(/jsToken\s*=\s*["']([^"']+)["']/);
                  if (altMatch) {
                    jsToken = altMatch[1];
                    console.log('✅ Extracted jsToken (assignment pattern):', jsToken.substring(0, 50) + '...');
                  }
                }
              } catch (e) {
                console.log('Failed to decode:', e.message);
              }
            }
          }
          
          // Try multiple patterns to extract locals
          const patterns = [
            /locals\s*=\s*({[\s\S]*?});/,
            /locals\s*=\s*({[\s\S]*?})\s*;/,
            /var\s+locals\s*=\s*({[\s\S]*?});/,
            /window\.locals\s*=\s*({[\s\S]*?});/
          ];
          
          for (const pattern of patterns) {
            const localsMatch = script.match(pattern);
            if (localsMatch) {
              console.log('✅ Matched locals with pattern:', pattern.source.substring(0, 50));
              try {
                const locals = JSON.parse(localsMatch[1]);
                console.log('✅ Successfully parsed locals object');
                console.log('Locals keys:', Object.keys(locals));
                
                if (locals.file_list && locals.file_list.length > 0) {
                  const fileInfo = locals.file_list[0];
                  console.log('📄 File:', fileInfo.server_filename);
                  console.log('Has dlink:', !!fileInfo.dlink);
                  
                  if (fileInfo.dlink) {
                    console.log('✅ SUCCESS! Found download link in HTML');
                    
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
                          url: fileInfo.dlink
                        }
                      ],
                      audioFormats: [],
                      platform: 'terabox',
                      extractionMethod: 'Terabox HTML Direct'
                    };
                  }
                }
              } catch (e) {
                console.log('Failed to parse locals:', e.message);
              }
              break;
            }
          }
        }
      }
    }
    
    // Step 2: Extract tokens with better patterns (if not already found)
    
    // Extract jsToken from eval/decodeURIComponent pattern (if not found in scripts)
    if (!jsToken) {
      const evalMatch = html.match(/eval\(decodeURIComponent\(`([^`]+)`\)\)/);
      if (evalMatch) {
        try {
          const decoded = decodeURIComponent(evalMatch[1]);
          console.log('Decoded eval (fallback):', decoded.substring(0, 200));
          
          // Try fn("TOKEN") pattern first
          let tokenMatch = decoded.match(/fn\(["']([^"']+)["']\)/);
          if (tokenMatch) {
            jsToken = tokenMatch[1];
            console.log('✅ Found jsToken from fn() call (fallback):', jsToken.substring(0, 50) + '...');
          } else {
            // Try assignment pattern
            tokenMatch = decoded.match(/jsToken\s*=\s*["']([^"']+)["']/);
            if (tokenMatch) {
              jsToken = tokenMatch[1];
              console.log('✅ Found jsToken from assignment (fallback):', jsToken.substring(0, 50) + '...');
            }
          }
        } catch (e) {
          console.log('Failed to decode eval:', e.message);
        }
      }
    }
    
    // Fallback: Try direct patterns
    if (!jsToken) {
      const jsTokenPatterns = [
        /window\.jsToken\s*=\s*["']([^"']+)["']/,
        /jsToken["']?\s*:\s*["']([^"']+)["']/,
        /"jsToken"\s*:\s*"([^"]+)"/
      ];
      
      for (const pattern of jsTokenPatterns) {
        const match = html.match(pattern);
        if (match) {
          jsToken = match[1];
          console.log('✅ Found jsToken (direct pattern)');
          break;
        }
      }
    }
    
    // Extract bdstoken (if not already found)
    if (!bdstoken) {
      const bdstokenPatterns = [
        /window\.bdstoken\s*=\s*["']([^"']+)["']/,
        /bdstoken["']?\s*:\s*["']([^"']+)["']/,
        /"bdstoken"\s*:\s*"([^"]+)"/
      ];
      
      for (const pattern of bdstokenPatterns) {
        const match = html.match(pattern);
        if (match) {
          bdstoken = match[1];
          console.log('✅ Found bdstoken');
          break;
        }
      }
    }
    
    // Extract logid (if not already found)
    if (!logid) {
      const logidMatch = html.match(/logid["']?\s*:\s*["']([^"']+)["']/);
      if (logidMatch) {
        logid = logidMatch[1];
        console.log('✅ Found logid');
      }
    }
    
    console.log('Tokens:', { jsToken: !!jsToken, bdstoken: !!bdstoken, logid: !!logid });
    
    // Try to extract file info directly from HTML first
    const fileInfoMatch = html.match(/window\.locals\s*=\s*({[\s\S]*?});/);
    if (fileInfoMatch) {
      try {
        const locals = JSON.parse(fileInfoMatch[1]);
        console.log('✅ Found locals data in HTML');
        
        if (locals.file_list && locals.file_list.length > 0) {
          const fileInfo = locals.file_list[0];
          console.log('📄 File from HTML:', fileInfo.server_filename);
          
          // If we have dlink in the HTML, use it directly
          if (fileInfo.dlink) {
            console.log('✅ SUCCESS! Found download link in HTML');
            
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
                  url: fileInfo.dlink
                }
              ],
              audioFormats: [],
              platform: 'terabox',
              extractionMethod: 'Terabox HTML Scraper'
            };
          }
        }
      } catch (e) {
        console.log('⚠️ Failed to parse locals:', e.message);
      }
    }
    
    // If we have jsToken, we can try to get the download link directly from the page
    // by making a proper API call that looks like a real browser
    if (jsToken) {
      console.log('📡 Making API call with jsToken...');
      
      // Build API URL - use exact format that browser uses
      const apiUrl = `https://www.terabox.app/share/list?app_id=250528&web=1&channel=dubox&clienttype=0&jsToken=${jsToken}&page=1&num=20&by=name&order=asc&site_referer=&shorturl=${shareId}&root=1`;
      
      console.log('API URL:', apiUrl);
      
      const apiResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': pageUrl,
          'Origin': 'https://www.terabox.app',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"'
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
    }
    
  } catch (error) {
    console.log('❌ Terabox Scraper failed:', error.message);
    throw error;
  }
}

module.exports = { extractTeraboxScraper };
