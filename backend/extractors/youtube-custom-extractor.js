// Custom YouTube Extractor - Uses yt-dlp Python library (most reliable)
const { spawn } = require('child_process');
const path = require('path');

async function extractYouTubeCustom(url) {
  console.log('🔴 YouTube Custom: Starting extraction...');
  
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Use yt-dlp Python script (most reliable for YouTube)
    return await extractWithYtDlpPython(url);
    
  } catch (error) {
    console.error('❌ YouTube Custom failed:', error.message);
    throw error;
  }
}

async function extractWithYtDlpPython(url) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '..', 'ytdlp_extract.py');
    const pythonProcess = spawn('python', [pythonScript, url]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput || 'YouTube extraction failed'));
        return;
      }
      
      try {
        const result = JSON.parse(output);
        
        if (result.error) {
          reject(new Error(result.error));
          return;
        }
        
        console.log('✅ YouTube Custom extraction successful');
        resolve(result);
      } catch (error) {
        reject(new Error('Failed to parse YouTube extraction output'));
      }
    });
    
    // Timeout after 20 seconds
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('YouTube extraction timeout'));
    }, 20000);
  });
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

module.exports = { extractYouTubeCustom };
