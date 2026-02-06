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

  // Video platforms
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) return 'instagram';
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch') || lowerUrl.includes('fb.com')) return 'facebook';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com') || lowerUrl.includes('t.co')) return 'twitter';
  if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('vm.tiktok.com')) return 'tiktok';
  if (lowerUrl.includes('vimeo.com')) return 'vimeo';
  if (lowerUrl.includes('dailymotion.com') || lowerUrl.includes('dai.ly')) return 'dailymotion';
  if (lowerUrl.includes('reddit.com') || lowerUrl.includes('redd.it')) return 'reddit';
  if (lowerUrl.includes('twitch.tv')) return 'twitch';
  if (lowerUrl.includes('soundcloud.com')) return 'soundcloud';
  if (lowerUrl.includes('spotify.com')) return 'spotify';
  if (lowerUrl.includes('hotstar.com') || lowerUrl.includes('jiocinema.com')) return 'hotstar';
  if (lowerUrl.includes('terabox.com') || lowerUrl.includes('teraboxapp.com') || lowerUrl.includes('1024tera.com')) return 'terabox';
  if (lowerUrl.includes('streamable.com')) return 'streamable';
  if (lowerUrl.includes('pinterest.com') || lowerUrl.includes('pin.it')) return 'pinterest';
  if (lowerUrl.includes('linkedin.com')) return 'linkedin';
  if (lowerUrl.includes('snapchat.com')) return 'snapchat';
  if (lowerUrl.includes('tumblr.com')) return 'tumblr';
  if (lowerUrl.includes('vk.com') || lowerUrl.includes('vk.ru')) return 'vk';
  if (lowerUrl.includes('bilibili.com')) return 'bilibili';
  if (lowerUrl.includes('bandcamp.com')) return 'bandcamp';
  if (lowerUrl.includes('mixcloud.com')) return 'mixcloud';

  // Direct media files
  if (lowerUrl.match(/\.(mp4|webm|mov|avi|mkv|mp3|m4a|wav|ogg|flac)$/)) {
    return 'direct';
  }

  // Generic platform - let yt-dlp handle it (supports 1800+ sites)
  // If URL is valid, return 'generic' instead of null
  return 'generic';
}

export function extractVideoId(url: string, platform: string): string | null {
  try {
    const urlObj = new URL(url);

    switch (platform) {
      case 'youtube': {
        if (url.includes('youtu.be/')) {
          return urlObj.pathname.slice(1).split('?')[0];
        }
        if (url.includes('/shorts/')) {
          const match = url.match(/\/shorts\/([^\/\?]+)/);
          return match ? match[1] : null;
        }
        return urlObj.searchParams.get('v');
      }
      case 'instagram': {
        const match = url.match(/\/(p|reel|tv)\/([^\/\?]+)/);
        return match ? match[2] : null;
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
      case 'tiktok': {
        const match = url.match(/\/video\/(\d+)/);
        return match ? match[1] : null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}
