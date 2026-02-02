export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export function detectPlatform(url: string): string | null {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  if (lowerUrl.includes('instagram.com')) {
    return 'instagram';
  }
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) {
    return 'facebook';
  }
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    return 'twitter';
  }
  if (lowerUrl.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (lowerUrl.includes('tiktok.com')) {
    return 'tiktok';
  }

  if (lowerUrl.match(/\.(mp4|webm|mov|avi|mkv|mp3|m4a|wav)$/)) {
    return 'direct';
  }

  return null;
}

export function extractVideoId(url: string, platform: string): string | null {
  try {
    const urlObj = new URL(url);

    switch (platform) {
      case 'youtube': {
        if (url.includes('youtu.be/')) {
          return urlObj.pathname.slice(1);
        }
        return urlObj.searchParams.get('v');
      }
      case 'instagram': {
        const match = url.match(/\/p\/([^\/]+)/);
        return match ? match[1] : null;
      }
      case 'facebook': {
        const match = url.match(/\/videos\/(\d+)/);
        return match ? match[1] : null;
      }
      case 'twitter': {
        const match = url.match(/\/status\/(\d+)/);
        return match ? match[1] : null;
      }
      case 'vimeo': {
        const match = url.match(/vimeo\.com\/(\d+)/);
        return match ? match[1] : null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}
