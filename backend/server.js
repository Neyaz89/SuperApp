const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SuperApp Video Downloader API v2.0',
    version: '2.0.0',
    endpoints: {
      extract: 'POST /api/extract - Extract video info from URL'
    }
  });
});

// Import extraction handler
const extractHandler = require('./api/extract');
app.post('/api/extract', extractHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
