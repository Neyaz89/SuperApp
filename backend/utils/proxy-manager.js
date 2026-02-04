// Proxy Manager - Rotate proxies to avoid rate limiting
const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

class ProxyManager {
  constructor() {
    this.proxies = this.loadProxies();
    this.currentIndex = 0;
    this.failedProxies = new Set();
    this.enabled = process.env.USE_PROXY === 'true';
    
    console.log(`🔄 Proxy Manager initialized (${this.enabled ? 'ENABLED' : 'DISABLED'})`);
    if (this.enabled) {
      console.log(`📡 Loaded ${this.proxies.length} proxies`);
    }
  }

  loadProxies() {
    // Load from environment variable or config
    const proxyList = process.env.PROXY_LIST || '';
    
    if (!proxyList) {
      return [];
    }

    // Format: http://user:pass@host:port,http://host:port
    return proxyList.split(',').map(p => p.trim()).filter(p => p);
  }

  getNextProxy() {
    if (!this.enabled || this.proxies.length === 0) {
      return null;
    }

    // Find next working proxy
    let attempts = 0;
    while (attempts < this.proxies.length) {
      const proxy = this.proxies[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length;

      if (!this.failedProxies.has(proxy)) {
        return proxy;
      }

      attempts++;
    }

    // All proxies failed, reset and try again
    console.log('⚠️ All proxies failed, resetting...');
    this.failedProxies.clear();
    return this.proxies[0];
  }

  markProxyFailed(proxy) {
    if (proxy) {
      this.failedProxies.add(proxy);
      console.log(`❌ Proxy marked as failed: ${proxy}`);
    }
  }

  async testProxy(proxy) {
    try {
      const agent = new HttpsProxyAgent(proxy);
      const response = await fetch('https://www.google.com', {
        agent,
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async testAllProxies() {
    console.log('🧪 Testing all proxies...');
    
    const results = await Promise.all(
      this.proxies.map(async (proxy) => {
        const works = await this.testProxy(proxy);
        console.log(`${works ? '✅' : '❌'} ${proxy}`);
        return { proxy, works };
      })
    );

    const workingProxies = results.filter(r => r.works).map(r => r.proxy);
    console.log(`✅ ${workingProxies.length}/${this.proxies.length} proxies working`);
    
    return workingProxies;
  }

  getFetchOptions(url) {
    const proxy = this.getNextProxy();
    
    if (!proxy) {
      return {};
    }

    console.log(`🔄 Using proxy: ${proxy}`);
    
    return {
      agent: new HttpsProxyAgent(proxy)
    };
  }
}

// Create singleton instance
const proxyManager = new ProxyManager();

module.exports = { proxyManager };
