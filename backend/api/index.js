module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ 
    status: 'ok', 
    message: 'SuperApp Video Downloader API',
    version: '1.0.0',
    endpoints: {
      extract: '/api/extract (POST)'
    }
  });
};
