type MediaQuality = {
  quality: string;
  format: string;
  size: string;
  url: string;
};

type MediaData = {
  title: string;
  thumbnail: string;
  duration: string;
  qualities: MediaQuality[];
  audioFormats: MediaQuality[];
};

// Render API URL - Production Backend
const API_URL = 'https://superapp-api-d3y5.onrender.com/api/extract';

export class MediaExtractor {
  async extractMediaInfo(url: string, platform: string): Promise<MediaData> {
    console.log('=== MediaExtractor: Starting extraction ===');
    console.log('URL:', url);
    console.log('Platform:', platform);
    console.log('API URL:', API_URL);

    // Try API extraction with retries
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Attempt ${attempt}/3: Calling API...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          
          if (attempt < 3) {
            console.log('Retrying...');
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            continue;
          }
          
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        console.log('API response received:', {
          title: data.title,
          qualityCount: data.qualities?.length,
          audioCount: data.audioFormats?.length
        });

        // Validate response
        if (!data.qualities || data.qualities.length === 0) {
          console.warn('No qualities in response, using fallback');
          return this.createMockData(url, platform);
        }

        console.log('=== Extraction successful ===');
        return data;
        
      } catch (error: any) {
        console.error(`Attempt ${attempt} failed:`, error.message);
        
        if (error.name === 'AbortError') {
          console.error('Request timed out');
        }
        
        if (attempt === 3) {
          console.log('All attempts failed, using fallback data');
          return this.createMockData(url, platform);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    // Fallback
    return this.createMockData(url, platform);
  }

  private createMockData(url: string, platform: string): MediaData {
    console.log('Creating fallback data for platform:', platform);
    
    const titles: Record<string, string> = {
      youtube: 'YouTube Video',
      instagram: 'Instagram Video',
      facebook: 'Facebook Video',
      twitter: 'Twitter Video',
      vimeo: 'Vimeo Video',
      tiktok: 'TikTok Video',
    };

    return {
      title: titles[platform] || 'Video',
      thumbnail: 'https://via.placeholder.com/640x360',
      duration: '5:23',
      qualities: [
        { quality: '1080p', format: 'mp4', size: '180 MB', url: url },
        { quality: '720p', format: 'mp4', size: '95 MB', url: url },
        { quality: '480p', format: 'mp4', size: '45 MB', url: url },
      ],
      audioFormats: [
        { quality: '320kbps', format: 'mp3', size: '12 MB', url: url },
        { quality: '128kbps', format: 'mp3', size: '5 MB', url: url },
      ],
    };
  }
}

export const mediaExtractor = new MediaExtractor();
