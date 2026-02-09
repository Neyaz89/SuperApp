import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface TeraboxWebViewExtractorProps {
  url: string;
  onExtractSuccess: (data: {
    title: string;
    downloadUrl: string;
    size: number;
    thumbnail?: string;
  }) => void;
  onExtractError: (error: string) => void;
}

export default function TeraboxWebViewExtractor({
  url,
  onExtractSuccess,
  onExtractError,
}: TeraboxWebViewExtractorProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [extractionStatus, setExtractionStatus] = useState('Loading downloader...');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // Extract directly from TeraBox - bypass third-party sites
  const downloaderUrl = url;

  const addDebugLog = (message: string) => {
    console.log(`[Terabox Debug] ${message}`);
    setDebugInfo(prev => [...prev, message]);
  };

  // JavaScript to inject - automate the user interaction
  const injectedJavaScript = `
    (function() {
      const TERABOX_URL = '${url.replace(/'/g, "\\'")}';
      
      // Send logs to React Native
      function log(message) {
        console.log(message);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          message: message
        }));
      }
      
      log('🔵 Starting automated Terabox extraction...');
      log('🔵 Target URL: ' + TERABOX_URL);
      log('🔵 Page URL: ' + window.location.href);
      
      let checkAttempts = 0;
      const maxAttempts = 60; // 60 seconds max
      
      // Step 1: Fill in the input field and click download button
      function automateExtraction() {
        log('🤖 Step 1: Looking for input field...');
        
        // Find the input field - try multiple selectors
        const inputField = document.querySelector('input[type="url"]') ||
                          document.querySelector('input[type="text"]') || 
                          document.querySelector('input[placeholder*="link"]') ||
                          document.querySelector('input[placeholder*="URL"]') ||
                          document.querySelector('input[placeholder*="Paste"]') ||
                          document.querySelector('input[name="url"]') ||
                          document.querySelector('#url') ||
                          document.querySelector('.url-input') ||
                          document.querySelector('[name="link"]');
        
        if (!inputField) {
          log('❌ Could not find input field');
          log('📄 Available inputs: ' + document.querySelectorAll('input').length);
          const inputs = document.querySelectorAll('input');
          for (let i = 0; i < Math.min(inputs.length, 3); i++) {
            log('Input ' + i + ': type=' + inputs[i].type + ', name=' + inputs[i].name + ', id=' + inputs[i].id);
          }
          return false;
        }
        
        log('✅ Found input field: ' + inputField.tagName + ' (type=' + inputField.type + ')');
        
        // Fill in the URL
        inputField.value = TERABOX_URL;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
        inputField.dispatchEvent(new Event('keyup', { bubbles: true }));
        
        log('✅ Filled input with URL');
        
        // Find and click the download/submit button
        const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"], a.button, .button, [role="button"]');
        let downloadButton = null;
        
        log('🔍 Found ' + buttons.length + ' buttons');
        
        for (let btn of buttons) {
          const text = (btn.textContent || btn.value || btn.innerText || '').toLowerCase().trim();
          log('Button text: "' + text + '"');
          
          if (text.includes('download') || text.includes('get') || text.includes('submit') || 
              text.includes('extract') || text.includes('fetch') || text.includes('generate')) {
            downloadButton = btn;
            log('✅ Found button: "' + text + '"');
            break;
          }
        }
        
        if (!downloadButton) {
          log('❌ Could not find download button');
          // Try to click the first button as fallback
          if (buttons.length > 0) {
            downloadButton = buttons[0];
            log('⚠️ Using first button as fallback');
          } else {
            return false;
          }
        }
        
        // Click the button
        downloadButton.click();
        log('🖱️ Clicked download button!');
        log('⏳ Waiting for extraction...');
        
        return true;
      }
      
      function isValidDownloadUrl(url) {
        if (!url || typeof url !== 'string') return false;
        if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
        if (url.includes('#') || url.includes('javascript:')) return false;
        if (url.includes('.css') || url.includes('.js') || url.includes('.png') || url.includes('.jpg') || url.includes('.gif') || url.includes('.svg') || url.includes('.ico')) return false;
        
        // Look for TeraBox CDN domains
        if (url.includes('d.terabox.com') || url.includes('data.terabox.com') || 
            url.includes('cdn.terabox.com') || url.includes('teraboxcdn.com')) {
          return true;
        }
        
        const hasVideoExtension = /\\.(mp4|mkv|avi|mov|webm|flv|m4v)($|\\?)/i.test(url);
        const hasVideoKeywords = /download|dlink|stream|video|media|file/i.test(url);
        
        return hasVideoExtension || hasVideoKeywords;
      }
      
      function findDownloadLink() {
        checkAttempts++;
        
        if (checkAttempts === 1) {
          const videoCount = document.querySelectorAll('video').length;
          const linkCount = document.querySelectorAll('a[href]').length;
          const buttonCount = document.querySelectorAll('button').length;
          
          log('📊 Page elements: ' + videoCount + ' videos, ' + linkCount + ' links, ' + buttonCount + ' buttons');
        }
        
        if (checkAttempts % 5 === 0) {
          log('🔍 Attempt ' + checkAttempts + '/' + maxAttempts);
        }
        
        // Method 1: Video element
        const videos = document.querySelectorAll('video');
        if (videos.length > 0) {
          const videoSrc = videos[0].src || videos[0].querySelector('source')?.src;
          log('🎥 Video found: ' + (videoSrc || 'no src'));
          if (videoSrc && isValidDownloadUrl(videoSrc)) {
            log('✅ Valid video URL found!');
            sendResult(videoSrc, document.title || 'Terabox Video');
            return true;
          }
        }
        
        // Method 2: Data attributes
        const dataElements = document.querySelectorAll('[data-url], [data-download], [data-link], [data-src], [data-video], [data-file]');
        for (let elem of dataElements) {
          const url = elem.getAttribute('data-url') || elem.getAttribute('data-download') || 
                      elem.getAttribute('data-link') || elem.getAttribute('data-src') ||
                      elem.getAttribute('data-video') || elem.getAttribute('data-file');
          if (url) {
            log('🔗 Data attr found: ' + url.substring(0, 50));
            if (isValidDownloadUrl(url)) {
              log('✅ Valid data URL found!');
              sendResult(url, elem.textContent?.trim() || 'Terabox Video');
              return true;
            }
          }
        }
        
        // Method 3: Links with video extensions
        const links = document.querySelectorAll('a[href]');
        for (let link of links) {
          const href = link.href;
          if (isValidDownloadUrl(href) && /\\.(mp4|mkv|avi|mov|webm)($|\\?)/i.test(href)) {
            log('✅ Video link found: ' + href.substring(0, 50));
            sendResult(href, link.textContent?.trim() || 'Terabox Video');
            return true;
          }
        }
        
        // Method 4: Download buttons
        const buttons = document.querySelectorAll('button, a, [role="button"]');
        for (let btn of buttons) {
          const text = (btn.textContent || '').toLowerCase();
          if ((text.includes('download') || text.includes('get') || text.includes('save')) && 
              !text.includes('downloader')) {
            const href = btn.getAttribute('href') || '';
            const onclick = btn.getAttribute('onclick') || '';
            const dataUrl = btn.getAttribute('data-url') || '';
            
            if (checkAttempts === 10) {
              log('🔘 Download button: "' + text.substring(0, 30) + '" href: ' + href.substring(0, 30));
            }
            
            // Check href
            if (href && isValidDownloadUrl(href)) {
              log('✅ Button href valid: ' + href.substring(0, 50));
              sendResult(href, 'Terabox Video');
              return true;
            }
            
            // Check onclick
            const urlMatch = onclick.match(/https?:\\/\\/[^"'\\s)]+/);
            if (urlMatch && isValidDownloadUrl(urlMatch[0])) {
              log('✅ Button onclick valid: ' + urlMatch[0].substring(0, 50));
              sendResult(urlMatch[0], 'Terabox Video');
              return true;
            }
            
            // Check data-url
            if (dataUrl && isValidDownloadUrl(dataUrl)) {
              log('✅ Button data-url valid: ' + dataUrl.substring(0, 50));
              sendResult(dataUrl, 'Terabox Video');
              return true;
            }
          }
        }
        
        // Method 5: Scripts
        if (checkAttempts === 15) {
          const scripts = document.querySelectorAll('script');
          log('📜 Checking ' + scripts.length + ' scripts...');
          
          for (let script of scripts) {
            const content = script.textContent || '';
            const urlMatches = content.match(/https?:\\/\\/[^"'\\s]+\\.(mp4|mkv|avi|mov|webm)[^"'\\s]*/gi);
            if (urlMatches && urlMatches.length > 0) {
              log('✅ Video URL in script: ' + urlMatches[0].substring(0, 50));
              sendResult(urlMatches[0], 'Terabox Video');
              return true;
            }
          }
        }
        
        return false;
      }
      
      function sendResult(downloadUrl, title) {
        log('📤 Sending result: ' + downloadUrl.substring(0, 50));
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'result',
          success: true,
          title: title || 'Terabox Video',
          downloadUrl: downloadUrl,
          size: 0,
          thumbnail: ''
        }));
      }
      
      function sendError(message) {
        log('❌ Error: ' + message);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'result',
          success: false,
          error: message
        }));
      }
      
      // Start extraction from TeraBox directly
      setTimeout(() => {
        log('⏰ Starting direct TeraBox extraction...');
        log('🔍 Looking for download links...');
        
        const interval = setInterval(() => {
          if (findDownloadLink()) {
            clearInterval(interval);
            return;
          }
          
          if (checkAttempts >= maxAttempts) {
            clearInterval(interval);
            log('⏱️ Timeout after ' + maxAttempts + ' attempts');
            
            // Try to find download button and click it
            const downloadBtn = document.querySelector('[class*="download"]') || 
                               document.querySelector('[id*="download"]') ||
                               document.querySelector('button:not([class*="share"])');
            
            if (downloadBtn && checkAttempts === maxAttempts) {
              log('🖱️ Found potential download button, clicking...');
              downloadBtn.click();
              checkAttempts = 0; // Reset and try again
            } else {
              log('📄 Page HTML sample: ' + document.body.innerHTML.substring(0, 300));
              sendError('Could not find download link. The file may be private or require authentication.');
            }
          }
        }, 1000);
        
      }, 3000); // Wait 3 seconds for page to load
      
    })();
    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      // Handle log messages
      if (data.type === 'log') {
        addDebugLog(data.message);
        return;
      }
      
      // Handle result messages
      if (data.type === 'result') {
        console.log('📦 Received from WebView:', data);
        
        if (data.success && data.downloadUrl) {
          console.log('✅ Extraction successful!');
          addDebugLog('✅ Download link found!');
          setIsLoading(false);
          onExtractSuccess({
            title: data.title,
            downloadUrl: data.downloadUrl,
            size: data.size,
            thumbnail: data.thumbnail,
          });
        } else if (data.error) {
          console.log('❌ Extraction failed:', data.error);
          addDebugLog('❌ ' + data.error);
          setIsLoading(false);
          onExtractError(data.error);
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      addDebugLog('❌ Parse error: ' + error);
      setIsLoading(false);
      onExtractError('Failed to extract download link');
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setExtractionStatus('Loading TeraBox...');
    addDebugLog('🌐 Loading TeraBox directly...');
  };

  const handleLoadEnd = () => {
    setExtractionStatus('Extracting download link...');
    addDebugLog('✅ Page loaded, starting extraction...');
  };

  const handleError = () => {
    setIsLoading(false);
    addDebugLog('❌ WebView error - failed to load page');
    onExtractError('Failed to load downloader website');
  };

  return (
    <View style={styles.container}>
      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>{extractionStatus}</Text>
          <Text style={styles.subText}>This may take a few seconds...</Text>
        </View>
      )}
      
      {/* WebView - Hidden from user */}
      <WebView
        ref={webViewRef}
        source={{ uri: downloaderUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        cacheEnabled={false}
        incognito={true}
        userAgent="Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    opacity: 0, // Hide WebView - user only sees loading screen
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 1000,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  subText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
});
