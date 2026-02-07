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
    
    // CRITICAL: Try to extract file info and download link directly from HTML FIRST
    // This is more reliable than API calls which return errno 105
    const localsPatterns = [
      /window\.locals\s*=\s*({[\s\S]*?});/,
      /var\s+locals\s*=\s*({[\s\S]*?});/,
    ];
    
    for (const pattern of localsPatterns) {
      const localsMatch = html.match(pattern);
      if (localsMatch) {
        try {
          // Try to parse the locals object
          const localsStr = localsMatch[1];
          console.log('✅ Found window.locals in HTML');
          console.log('Locals string length:', localsStr.length);
          
          // Try to extract file_list from the string
          const fileListMatch = localsStr.match(/"file_list"\s*:\s*\[([\s\S]*?)\]/);
          if (fileListMatch) {
            console.log('✅ Found file_list in locals');
            
            // Extract dlink from file_list
            const dlinkMatch = fileListMatch[1].match(/"dlink"\s*:\s*"([^"]+)"/);
            const filenameMatch = fileListMatch[1].match(/"server_filename"\s*:\s*"([^"]+)"/);
            const sizeMatch = fileListMatch[1].match(/"size"\s*:\s*(\d+)/);
            
            if (dlinkMatch) {
              console.log('✅ SUCCESS! Found dlink in HTML locals');
              
              const downloadLink = dlinkMatch[1];
              const filename = filenameMatch ? filenameMatch[1] : 'Terabox File';
              const fileSize = sizeMatch ? parseInt(sizeMatch[1]) : 0;
              const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
              
              return {
                title: filename,
                thumbnail: 'https://via.placeholder.com/640x360',
                duration: '0:00',
                qualities: [
                  {
                    quality: 'Original',
                    format: filename.split('.').pop() || 'mp4',
                    size: `${sizeMB} MB`,
                    url: downloadLink,
                    hasAudio: true,
                    hasVideo: true,
                    needsProxy: false
                  }
                ],
                audioFormats: [],
                platform: 'terabox',
                extractionMethod: 'Terabox HTML Direct'
              };
            }
          }
        } catch (e) {
          console.log('⚠️ Failed to parse locals:', e.message);
        }
      }
    }
    
    console.log('⚠️ No dlink found in HTML, will try API with jsToken...');
    
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
    
    // If we have jsToken, make API call with ALL required parameters
    if (jsToken) {
      console.log('📡 Making API call with jsToken...');
      
      // Try multiple API endpoints that might work
      const apiAttempts = [
        {
          name: 'List API with all params',
          url: `https://www.terabox.app/share/list?app_id=250528&web=1&channel=dubox&clienttype=0&jsToken=${jsToken}&dp-logid=&page=1&num=20&by=name&order=asc&site_referer=&shorturl=${shareId}&root=1&pwd=`,
        },
        {
          name: 'List API alternate',
          url: `https://www.terabox.app/api/list?app_id=250528&web=1&channel=dubox&clienttype=0&jsToken=${jsToken}&shorturl=${shareId}&root=1`,
        },
      ];

      for (const attempt of apiAttempts) {
        try {
          console.log(`⏳ Trying ${attempt.name}...`);
          console.log('URL:', attempt.url);
          
          const apiResponse = await fetch(attempt.url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Referer': pageUrl,
              'Origin': 'https://www.terabox.app',
              'Connection': 'keep-alive',
            },
            timeout: 20000
          });
        
          if (!apiResponse.ok) {
            console.log(`⚠️ ${attempt.name} returned ${apiResponse.status}`);
            continue;
          }
          
          const apiData = await apiResponse.json();
          console.log('📦 API response errno:', apiData.errno);
          
          if (apiData.errno === 0 && apiData.list && apiData.list.length > 0) {
            const fileInfo = apiData.list[0];
            console.log('📄 File:', fileInfo.server_filename);
            
            let downloadLink = fileInfo.dlink;
            
            // If no dlink, try download API
            if (!downloadLink && apiData.sign && apiData.timestamp) {
              console.log('📡 Requesting download link...');
              const downloadUrl = `https://www.terabox.app/share/download?app_id=250528&web=1&channel=dubox&clienttype=0&sign=${apiData.sign}&timestamp=${apiData.timestamp}&shareid=${apiData.shareid}&uk=${apiData.uk}&primaryid=${apiData.shareid}&fid_list=[${fileInfo.fs_id}]&jsToken=${jsToken}`;
              
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
                if (downloadData.errno === 0 && downloadData.list && downloadData.list[0]) {
                  downloadLink = downloadData.list[0].dlink;
                  console.log('✅ Got download link from download API');
                }
              }
            }
            
            if (downloadLink) {
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
                    url: downloadLink,
                    hasAudio: true,
                    hasVideo: true,
                    needsProxy: false
                  }
                ],
                audioFormats: [],
                platform: 'terabox',
                extractionMethod: 'Terabox Scraper'
              };
            }
          }
          
          console.log(`❌ ${attempt.name} failed: errno ${apiData.errno}`);
        } catch (e) {
          console.log(`❌ ${attempt.name} error:`, e.message);
          continue;
        }
      }
      
      console.log('⚠️ All API attempts failed');
    }
    
  } catch (error) {
    console.log('❌ Terabox Scraper failed:', error.message);
    throw error;
  }
}

module.exports = { extractTeraboxScraper };
