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
  useWebView?: boolean; // Flag to indicate WebView extraction needed
  webViewUrl?: string; // URL to load in WebView
};

// Render API URL - Production Backend
const API_URL = 'https://superapp-api-d3y5.onrender.com/api/extract';

export class MediaExtractor {
  async extractMediaInfo(url: string, platform: string): Promise<MediaData> {
    console.log('=== MediaExtractor: Starting extraction ===');
    console.log('URL:', url);
    console.log('Platform:', platform);
    console.log('API URL:', API_URL);

    // Try API extraction with retries for all platforms (including Terabox)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Attempt ${attempt}/3: Calling API...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for Universal Scraper

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
          audioCount: data.audioFormats?.length,
          platform: data.platform,
          extractionMethod: data.extractionMethod,
          useWebView: data.useWebView
        });

        // Check if WebView extraction is needed (BEFORE validating qualities)
        if (data.useWebView) {
          console.log('✅ WebView extraction required - returning WebView instruction');
          return data;
        }

        // Log first 3 video URLs for debugging
        if (data.qualities && data.qualities.length > 0) {
          console.log('First 3 video qualities:', JSON.stringify(data.qualities.slice(0, 3), null, 2));
        }

        // Validate response
        if (!data.qualities || data.qualities.length === 0) {
          console.warn('⚠️ No qualities in response');
          
          if (attempt < 3) {
            console.log('Retrying...');
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          
          throw new Error('No video qualities found. The video might be private, unavailable, or the link is invalid.');
        }

        // Validate that URLs are actual video URLs (not images/labels)
        const validQualities = data.qualities.filter((q: any) => {
          const url = q.url?.toLowerCase() || '';
          // Filter out common non-video URLs
          const isInvalidUrl = 
            url.includes('rta-label') ||
            url.includes('logo') ||
            url.includes('banner') ||
            url.includes('placeholder') ||
            url.endsWith('.jpg') ||
            url.endsWith('.jpeg') ||
            url.endsWith('.png') ||
            url.endsWith('.gif') ||
            url.endsWith('.svg') ||
            url.includes('/images/') ||
            url.includes('/static/images/');
          
          return !isInvalidUrl;
        });

        if (validQualities.length === 0) {
          console.warn('⚠️ All URLs appear to be invalid (images/labels)');
          
          if (attempt < 3) {
            console.log('Retrying with different method...');
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          
          throw new Error('Could not extract valid video URL. This site may require special handling.');
        }

        // Replace qualities with validated ones
        data.qualities = validQualities;

        console.log('=== Extraction successful - Returning to app ===');
        return data;
        
      } catch (error: any) {
        console.error(`Attempt ${attempt} failed:`, error.message);
        
        if (error.name === 'AbortError') {
          console.error('Request timed out');
        }
        
        if (attempt === 3) {
          console.log('All attempts failed, throwing error');
          throw new Error(error.message || 'Failed to extract video information. Please check the link and try again.');
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    // Should never reach here, but just in case
    throw new Error('Failed to extract video information after all attempts.');
  }
}

export const mediaExtractor = new MediaExtractor();
