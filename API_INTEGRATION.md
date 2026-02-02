# SuperApp - API Integration Guide

This guide explains how to integrate real backend services for media extraction and downloading.

## Overview

Currently, the app uses mock data for demonstration. To make it production-ready, you need to integrate with actual media extraction APIs.

## Recommended Solutions

### Option 1: yt-dlp API (Self-Hosted)

**Best for**: Full control, privacy, cost-effectiveness

#### Setup

1. **Deploy yt-dlp API Server**

```bash
# Using Docker
docker run -d -p 8080:8080 \
  --name ytdlp-api \
  ghcr.io/alexta69/metube:latest
```

2. **Or use a hosted service**
- Deploy on Railway, Render, or Heroku
- Use environment variables for configuration

#### Integration

Update `services/mediaExtractor.ts`:

```typescript
private async extractYouTube(url: string): Promise<MediaData> {
  const API_URL = 'https://your-api.com/api/info';
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    const data = await response.json();
    
    return {
      title: data.title,
      thumbnail: data.thumbnail,
      duration: this.formatDuration(data.duration),
      qualities: data.formats
        .filter(f => f.vcodec !== 'none')
        .map(f => ({
          quality: f.height + 'p',
          format: f.ext,
          size: this.formatSize(f.filesize),
          url: f.url,
        })),
      audioFormats: data.formats
        .filter(f => f.acodec !== 'none' && f.vcodec === 'none')
        .map(f => ({
          quality: f.abr + 'kbps',
          format: f.ext,
          size: this.formatSize(f.filesize),
          url: f.url,
        })),
    };
  } catch (error) {
    console.error('YouTube extraction failed:', error);
    throw new Error('Failed to extract YouTube video');
  }
}

private formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

private formatSize(bytes: number): string {
  if (!bytes) return 'Unknown';
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(0) + ' MB';
}
```

### Option 2: RapidAPI Services

**Best for**: Quick setup, multiple platforms, managed service

#### Popular APIs

1. **YouTube Video Downloader API**
2. **Instagram Downloader API**
3. **TikTok Downloader API**
4. **All-in-One Downloader API**

#### Setup

1. Sign up at [RapidAPI](https://rapidapi.com)
2. Subscribe to desired APIs
3. Get API key

#### Integration

Create `services/rapidApiClient.ts`:

```typescript
const RAPIDAPI_KEY = 'your-api-key';
const RAPIDAPI_HOST = 'youtube-video-download-info.p.rapidapi.com';

export async function fetchYouTubeInfo(videoId: string) {
  const response = await fetch(
    `https://${RAPIDAPI_HOST}/dl?id=${videoId}`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('API request failed');
  }
  
  return await response.json();
}
```

### Option 3: Custom Backend

**Best for**: Full customization, advanced features, scalability

#### Tech Stack Options

**Node.js + Express:**
```javascript
const express = require('express');
const ytdl = require('ytdl-core');

app.post('/api/extract', async (req, res) => {
  const { url } = req.body;
  const info = await ytdl.getInfo(url);
  res.json({
    title: info.videoDetails.title,
    thumbnail: info.videoDetails.thumbnails[0].url,
    formats: info.formats,
  });
});
```

**Python + FastAPI:**
```python
from fastapi import FastAPI
import yt_dlp

app = FastAPI()

@app.post("/api/extract")
async def extract_media(url: str):
    ydl_opts = {'quiet': True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return {
            'title': info['title'],
            'thumbnail': info['thumbnail'],
            'formats': info['formats']
        }
```

## Implementation Steps

### Step 1: Environment Configuration

Create `.env` file:

```env
API_BASE_URL=https://your-api.com
API_KEY=your-api-key
RAPIDAPI_KEY=your-rapidapi-key
```

Install dotenv:
```bash
npm install react-native-dotenv
```

Configure babel.config.js:
```javascript
module.exports = {
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }]
  ]
};
```

### Step 2: Create API Client

Create `services/apiClient.ts`:

```typescript
import { API_BASE_URL, API_KEY } from '@env';

class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.apiKey = API_KEY;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async extractMedia(url: string, platform: string) {
    return this.request('/extract', {
      method: 'POST',
      body: JSON.stringify({ url, platform }),
    });
  }

  async getDownloadUrl(videoId: string, quality: string) {
    return this.request('/download', {
      method: 'POST',
      body: JSON.stringify({ videoId, quality }),
    });
  }
}

export const apiClient = new ApiClient();
```

### Step 3: Update Media Extractor

Update `services/mediaExtractor.ts`:

```typescript
import { apiClient } from './apiClient';

export class MediaExtractor {
  async extractMediaInfo(url: string, platform: string): Promise<MediaData> {
    try {
      const data = await apiClient.extractMedia(url, platform);
      
      return {
        title: data.title,
        thumbnail: data.thumbnail,
        duration: data.duration,
        qualities: data.qualities.map(q => ({
          quality: q.resolution,
          format: q.format,
          size: q.size,
          url: q.downloadUrl,
        })),
        audioFormats: data.audioFormats.map(a => ({
          quality: a.bitrate,
          format: a.format,
          size: a.size,
          url: a.downloadUrl,
        })),
      };
    } catch (error) {
      console.error('Media extraction failed:', error);
      throw new Error('Failed to extract media information');
    }
  }
}
```

### Step 4: Error Handling

Create `utils/errorHandler.ts`:

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: any): string {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        return 'Invalid URL or unsupported platform';
      case 401:
        return 'Authentication failed';
      case 403:
        return 'Access denied';
      case 404:
        return 'Media not found';
      case 429:
        return 'Too many requests. Please try again later';
      case 500:
        return 'Server error. Please try again';
      default:
        return error.message;
    }
  }
  
  if (error.message.includes('Network')) {
    return 'Network error. Check your connection';
  }
  
  return 'An unexpected error occurred';
}
```

### Step 5: Caching Layer

Create `services/cacheManager.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

class CacheManager {
  private prefix = '@superapp_cache:';
  private ttl = 3600000; // 1 hour

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(this.prefix + key);
      if (!item) return null;

      const { data, timestamp } = JSON.parse(item);
      
      if (Date.now() - timestamp > this.ttl) {
        await this.remove(key);
        return null;
      }

      return data as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, data: T): Promise<void> {
    try {
      const item = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        this.prefix + key,
        JSON.stringify(item)
      );
    } catch (error) {
      console.error('Cache set failed:', error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Cache remove failed:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.prefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
  }
}

export const cacheManager = new CacheManager();
```

Update media extractor to use cache:

```typescript
async extractMediaInfo(url: string, platform: string): Promise<MediaData> {
  const cacheKey = `media:${url}`;
  
  // Try cache first
  const cached = await cacheManager.get<MediaData>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch from API
  const data = await apiClient.extractMedia(url, platform);
  const mediaData = this.transformApiResponse(data);
  
  // Cache the result
  await cacheManager.set(cacheKey, mediaData);
  
  return mediaData;
}
```

## Platform-Specific Integration

### YouTube

```typescript
async extractYouTube(url: string): Promise<MediaData> {
  const videoId = extractVideoId(url, 'youtube');
  const response = await apiClient.request(`/youtube/${videoId}`);
  
  return {
    title: response.snippet.title,
    thumbnail: response.snippet.thumbnails.high.url,
    duration: this.parseDuration(response.contentDetails.duration),
    qualities: await this.fetchYouTubeQualities(videoId),
    audioFormats: await this.fetchYouTubeAudio(videoId),
  };
}
```

### Instagram

```typescript
async extractInstagram(url: string): Promise<MediaData> {
  const postId = extractVideoId(url, 'instagram');
  const response = await apiClient.request(`/instagram/${postId}`);
  
  return {
    title: response.caption || 'Instagram Video',
    thumbnail: response.thumbnail_url,
    duration: response.video_duration,
    qualities: response.video_versions.map(v => ({
      quality: v.height + 'p',
      format: 'mp4',
      size: this.estimateSize(v.height, response.video_duration),
      url: v.url,
    })),
    audioFormats: [],
  };
}
```

## Rate Limiting

Implement rate limiting to avoid API throttling:

```typescript
class RateLimiter {
  private requests: number[] = [];
  private limit = 10; // requests
  private window = 60000; // per minute

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.window);
    
    if (this.requests.length >= this.limit) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  async waitForSlot(): Promise<void> {
    while (!(await this.checkLimit())) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

export const rateLimiter = new RateLimiter();
```

## Testing

Create `services/__tests__/mediaExtractor.test.ts`:

```typescript
import { mediaExtractor } from '../mediaExtractor';

describe('MediaExtractor', () => {
  it('should extract YouTube video info', async () => {
    const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ';
    const result = await mediaExtractor.extractMediaInfo(url, 'youtube');
    
    expect(result.title).toBeDefined();
    expect(result.qualities.length).toBeGreaterThan(0);
  });

  it('should handle invalid URLs', async () => {
    const url = 'invalid-url';
    
    await expect(
      mediaExtractor.extractMediaInfo(url, 'youtube')
    ).rejects.toThrow();
  });
});
```

## Security Best Practices

1. **Never expose API keys in code**
   - Use environment variables
   - Use secure storage for sensitive data

2. **Validate all inputs**
   - Check URL format
   - Sanitize user input
   - Validate API responses

3. **Use HTTPS only**
   - Enforce secure connections
   - Validate SSL certificates

4. **Implement request signing**
   - Add request signatures
   - Verify response integrity

5. **Handle errors gracefully**
   - Don't expose internal errors
   - Log errors securely
   - Provide user-friendly messages

## Monitoring

Implement API monitoring:

```typescript
class ApiMonitor {
  async logRequest(endpoint: string, duration: number, success: boolean) {
    // Send to analytics service
    console.log({
      endpoint,
      duration,
      success,
      timestamp: Date.now(),
    });
  }
}
```

## Cost Optimization

1. **Implement caching** - Reduce API calls
2. **Use CDN** - Cache static content
3. **Batch requests** - Combine multiple requests
4. **Lazy loading** - Load data on demand
5. **Compression** - Reduce bandwidth usage

## Deployment Checklist

- [ ] API keys configured
- [ ] Environment variables set
- [ ] Error handling implemented
- [ ] Caching enabled
- [ ] Rate limiting configured
- [ ] Monitoring setup
- [ ] Security measures in place
- [ ] Testing completed
- [ ] Documentation updated

---

**Next Steps**: Choose an API solution, implement integration, test thoroughly, and deploy to production.
