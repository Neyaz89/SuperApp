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
  
  // Use working Terabox downloader website
  const downloaderUrl = `https://playterabox.com/?url=${encodeURIComponent(url)}`;

  // JavaScript to inject - automatically extracts download link
  const injectedJavaScript = `
    (function() {
      console.log('🔵 Starting automatic Terabox extraction...');
      
      let checkAttempts = 0;
      const maxAttempts = 30; // 30 seconds max
      
      function findDownloadLink() {
        checkAttempts++;
        console.log('🔍 Attempt ' + checkAttempts + '/' + maxAttempts);
        
        // Method 1: Look for download button/link
        const downloadButtons = document.querySelectorAll('a[href*="download"], button[onclick*="download"], a[download]');
        for (let btn of downloadButtons) {
          const href = btn.getAttribute('href') || btn.getAttribute('data-url');
          if (href && (href.includes('.mp4') || href.includes('terabox') || href.includes('dlink'))) {
            console.log('✅ Found download link via button:', href);
            sendResult(href, btn.textContent || 'Terabox Video');
            return true;
          }
        }
        
        // Method 2: Look for video element
        const videos = document.querySelectorAll('video');
        if (videos.length > 0) {
          const videoSrc = videos[0].src || videos[0].querySelector('source')?.src;
          if (videoSrc && videoSrc.startsWith('http')) {
            console.log('✅ Found video element:', videoSrc);
            sendResult(videoSrc, 'Terabox Video');
            return true;
          }
        }
        
        // Method 3: Look for direct links in page
        const links = document.querySelectorAll('a[href]');
        for (let link of links) {
          const href = link.href;
          if (href && (href.includes('.mp4') || href.includes('.mkv') || href.includes('dlink'))) {
            console.log('✅ Found direct video link:', href);
            sendResult(href, link.textContent || 'Terabox Video');
            return true;
          }
        }
        
        // Method 4: Check for data in page scripts/JSON
        const scripts = document.querySelectorAll('script');
        for (let script of scripts) {
          const content = script.textContent || '';
          // Look for download URLs in JavaScript
          const urlMatch = content.match(/(https?:\\/\\/[^"'\\s]+\\.(mp4|mkv|avi|mov))/i);
          if (urlMatch) {
            console.log('✅ Found URL in script:', urlMatch[1]);
            sendResult(urlMatch[1], 'Terabox Video');
            return true;
          }
        }
        
        // Method 5: Look for download info in window object
        if (typeof window.downloadUrl !== 'undefined' && window.downloadUrl) {
          console.log('✅ Found window.downloadUrl:', window.downloadUrl);
          sendResult(window.downloadUrl, 'Terabox Video');
          return true;
        }
        
        return false;
      }
      
      function sendResult(downloadUrl, title) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          success: true,
          title: title || 'Terabox Video',
          downloadUrl: downloadUrl,
          size: 0,
          thumbnail: ''
        }));
      }
      
      function sendError(message) {
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
            sendError('Could not find download link. Please try again.');
          }
        }, 1000); // Check every second
      }, 2000); // Wait 2 seconds for page to load
      
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
