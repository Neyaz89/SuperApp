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
  
  // Use a more reliable Terabox downloader that auto-extracts
  const downloaderUrl = `https://teraboxdl.site/?url=${encodeURIComponent(url)}`;

  // JavaScript to inject - automatically extracts download link
  const injectedJavaScript = `
    (function() {
      console.log('🔵 Starting automatic Terabox extraction...');
      console.log('🔵 Page URL:', window.location.href);
      console.log('🔵 Page Title:', document.title);
      
      let checkAttempts = 0;
      const maxAttempts = 40; // 40 seconds max
      
      function isValidDownloadUrl(url) {
        if (!url || typeof url !== 'string') return false;
        
        // Must be absolute URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
        
        // Must not be navigation links
        if (url.includes('/tools/') || url.includes('/download-page') || url.includes('#')) return false;
        
        // Should contain video indicators
        const hasVideoExtension = /\\.(mp4|mkv|avi|mov|webm|flv|m4v)($|\\?)/i.test(url);
        const hasVideoKeywords = /download|dlink|stream|video|media|file/i.test(url);
        
        return hasVideoExtension || hasVideoKeywords;
      }
      
      function findDownloadLink() {
        checkAttempts++;
        console.log('🔍 Attempt ' + checkAttempts + '/' + maxAttempts);
        
        // Debug: Log page structure
        if (checkAttempts === 1) {
          console.log('📄 Videos found:', document.querySelectorAll('video').length);
          console.log('📄 Links found:', document.querySelectorAll('a[href]').length);
          console.log('📄 Buttons found:', document.querySelectorAll('button').length);
        }
        
        // Method 1: Look for video element (most reliable)
        const videos = document.querySelectorAll('video');
        if (videos.length > 0) {
          const videoSrc = videos[0].src || videos[0].querySelector('source')?.src;
          console.log('🎥 Video src:', videoSrc);
          if (videoSrc && isValidDownloadUrl(videoSrc)) {
            console.log('✅ Found video element:', videoSrc);
            sendResult(videoSrc, document.title || 'Terabox Video');
            return true;
          }
        }
        
        // Method 2: Look for download button with data attributes
        const downloadButtons = document.querySelectorAll('[data-url], [data-download], [data-link], [data-src], [data-video]');
        for (let btn of downloadButtons) {
          const url = btn.getAttribute('data-url') || btn.getAttribute('data-download') || 
                      btn.getAttribute('data-link') || btn.getAttribute('data-src') ||
                      btn.getAttribute('data-video');
          console.log('🔗 Data attribute URL:', url);
          if (url && isValidDownloadUrl(url)) {
            console.log('✅ Found download URL in data attribute:', url);
            sendResult(url, btn.textContent?.trim() || 'Terabox Video');
            return true;
          }
        }
        
        // Method 3: Look for links with video extensions
        const allLinks = document.querySelectorAll('a[href]');
        for (let link of allLinks) {
          const href = link.href;
          if (isValidDownloadUrl(href) && /\\.(mp4|mkv|avi|mov|webm)($|\\?)/i.test(href)) {
            console.log('✅ Found video link:', href);
            sendResult(href, link.textContent?.trim() || 'Terabox Video');
            return true;
          }
        }
        
        // Method 4: Search in page scripts for download URLs
        const scripts = document.querySelectorAll('script');
        for (let script of scripts) {
          const content = script.textContent || '';
          
          // Look for direct video URLs in JavaScript
          const urlMatches = content.match(/https?:\\/\\/[^"'\\s]+\\.(mp4|mkv|avi|mov|webm)[^"'\\s]*/gi);
          if (urlMatches && urlMatches.length > 0) {
            const videoUrl = urlMatches[0];
            console.log('✅ Found video URL in script:', videoUrl);
            sendResult(videoUrl, 'Terabox Video');
            return true;
          }
          
          // Look for download URLs with keywords
          const dlinkMatch = content.match(/["']([^"']*(?:download|dlink|stream)[^"']*\\.(?:mp4|mkv|avi|mov|webm)[^"']*)["']/i);
          if (dlinkMatch) {
            const url = dlinkMatch[1];
            if (isValidDownloadUrl(url)) {
              console.log('✅ Found dlink in script:', url);
              sendResult(url, 'Terabox Video');
              return true;
            }
          }
        }
        
        // Method 5: Look for download button by text content
        const buttons = document.querySelectorAll('button, a');
        for (let btn of buttons) {
          const text = btn.textContent?.toLowerCase() || '';
          if ((text.includes('download') || text.includes('get')) && !text.includes('downloader')) {
            const onclick = btn.getAttribute('onclick') || '';
            const href = btn.getAttribute('href') || '';
            
            console.log('🔘 Download button found:', text, 'href:', href);
            
            // Extract URL from onclick
            const urlMatch = onclick.match(/https?:\\/\\/[^"'\\s)]+/);
            if (urlMatch && isValidDownloadUrl(urlMatch[0])) {
              console.log('✅ Found URL in onclick:', urlMatch[0]);
              sendResult(urlMatch[0], 'Terabox Video');
              return true;
            }
            
            if (href && isValidDownloadUrl(href)) {
              console.log('✅ Found URL in download button href:', href);
              sendResult(href, 'Terabox Video');
              return true;
            }
          }
        }
        
        // Method 6: Check window object for download data
        if (typeof window.downloadLink !== 'undefined' && window.downloadLink) {
          console.log('✅ Found window.downloadLink:', window.downloadLink);
          if (isValidDownloadUrl(window.downloadLink)) {
            sendResult(window.downloadLink, 'Terabox Video');
            return true;
          }
        }
        
        return false;
      }
      
      function sendResult(downloadUrl, title) {
        console.log('📤 Sending result to app:', downloadUrl);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          success: true,
          title: title || 'Terabox Video',
          downloadUrl: downloadUrl,
          size: 0,
          thumbnail: ''
        }));
      }
      
      function sendError(message) {
        console.log('📤 Sending error to app:', message);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          success: false,
          error: message
        }));
      }
      
      // Start checking after page loads
      setTimeout(() => {
        const interval = setInterval(() => {
          if (findDownloadLink()) {
            clearInterval(interval);
            return;
          }
          
          if (checkAttempts >= maxAttempts) {
            clearInterval(interval);
            console.log('❌ Extraction timeout - no download link found');
            console.log('📄 Final page HTML sample:', document.body.innerHTML.substring(0, 500));
            sendError('Could not find download link. The file may be private or the link expired.');
          }
        }, 1000); // Check every second
      }, 3000); // Wait 3 seconds for page to load
      
    })();
    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📦 Received from WebView:', data);
      
      if (data.success && data.downloadUrl) {
        console.log('✅ Extraction successful!');
        setIsLoading(false);
        onExtractSuccess({
          title: data.title,
          downloadUrl: data.downloadUrl,
          size: data.size,
          thumbnail: data.thumbnail,
        });
      } else if (data.error) {
        console.log('❌ Extraction failed:', data.error);
        setIsLoading(false);
        onExtractError(data.error);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      setIsLoading(false);
      onExtractError('Failed to extract download link');
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setExtractionStatus('Loading downloader...');
  };

  const handleLoadEnd = () => {
    setExtractionStatus('Extracting download link...');
  };

  const handleError = () => {
    setIsLoading(false);
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
