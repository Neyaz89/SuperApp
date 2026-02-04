// Cookie Manager - Maintains fresh cookies for platforms
const fs = require('fs');
const path = require('path');

class CookieManager {
  constructor() {
    this.cookiesPath = path.join(__dirname, '..', 'cookies');
    this.cookies = this.loadCookies();
  }

  loadCookies() {
    const cookies = {
      youtube: this.loadCookieFile('youtube_cookies.txt'),
      instagram: this.loadCookieFile('instagram_cookies.txt'),
      facebook: this.loadCookieFile('facebook_cookies.txt'),
      tiktok: this.loadCookieFile('tiktok_cookies.txt'),
      twitter: this.loadCookieFile('twitter_cookies.txt')
    };

    console.log('🍪 Cookie Manager initialized');
    return cookies;
  }

  loadCookieFile(filename) {
    try {
      const filePath = path.join(this.cookiesPath, filename);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return this.parseCookies(content);
      }
    } catch (error) {
      console.log(`⚠️ Could not load ${filename}`);
    }
    return null;
  }

  parseCookies(content) {
    // Parse Netscape cookie format
    const lines = content.split('\n');
    const cookies = {};

    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;
      
      const parts = line.split('\t');
      if (parts.length >= 7) {
        const name = parts[5];
        const value = parts[6];
        cookies[name] = value;
      }
    }

    return Object.keys(cookies).length > 0 ? cookies : null;
  }

  getCookieString(platform) {
    const platformCookies = this.cookies[platform];
    if (!platformCookies) return '';

    return Object.entries(platformCookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  getCookieHeader(platform) {
    const cookieString = this.getCookieString(platform);
    return cookieString ? { 'Cookie': cookieString } : {};
  }

  // Get user agent for platform
  getUserAgent(platform) {
    const userAgents = {
      youtube: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      instagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      tiktok: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      facebook: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      twitter: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    return userAgents[platform] || userAgents.default;
  }

  // Get complete headers for platform
  getHeaders(platform) {
    return {
      'User-Agent': this.getUserAgent(platform),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      ...this.getCookieHeader(platform)
    };
  }
}

// Create singleton instance
const cookieManager = new CookieManager();

module.exports = { cookieManager };
