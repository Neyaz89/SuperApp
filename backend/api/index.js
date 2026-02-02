module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.json({ 
    status: 'ok', 
    message: 'SuperApp Video Downloader API',
    version: '2.0.0',
    endpoints: {
      extract: 'POST /api/extract - Extract video info from URL'
    },
    usage: {
      method: 'POST',
      url: '/api/extract',
      body: {
        url: 'https://youtube.com/watch?v=...'
      }
    }
  });
};
