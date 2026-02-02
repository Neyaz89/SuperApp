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

// Your Vercel API URL
const API_URL = 'https://super-app-blue-pi.vercel.app/api/extract';

export class MediaExtractor {
  async extractMediaInfo(url: string, platform: string): Promise<MediaData> {
    try {
      console.log('Fetching from API:', API_URL);
      console.log('URL to extract:', url);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      return data;
      
    } catch (error: any) {
      console.error('API extraction failed:', error);
      console.error('Error details:', error.message);
      // Fallback to mock data
      return this.createMockData(url, platform);
    }
  }

  private createMockData(url: string, platform: string): MediaData {
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
