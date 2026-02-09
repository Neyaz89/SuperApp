import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, AppState } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';

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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [extractionStatus, setExtractionStatus] = useState('Loading 1024terabox...');
  const [hasOpenedExternalBrowser, setHasOpenedExternalBrowser] = useState(false);
  
  // Use 1024teradownloader.com - working downloader
  const downloaderUrl = `https://1024teradownloader.com/?url=${encodeURIComponent(url)}`;

  const addDebugLog = (message: string) => {
    console.log(`[Terabox Debug] ${message}`);
  };

  // Detect when app comes back from background (Chrome)
  useEffect(() => {
    let wentToBackground = false;
    
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background (Chrome opened)
        wentToBackground = true;
        console.log('📱 App went to background - Chrome likely opened');
      } else if (nextAppState === 'active' && wentToBackground) {
        // App came back to foreground
        console.log('📱 App came back from Chrome - redirecting to homepage');
        addDebugLog('📱 Redirecting to homepage...');
        
        // Navigate to homepage
        router.replace('/');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  // JavaScript to capture download link when user clicks
  const injectedJavaScript = `
    (function() {
      function log(message) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          message: message
        }));
      }
      
      log('🔵 Intercepting all downloads...');
      
      function isValidDownloadUrl(url) {
        if (!url || typeof url !== 'string') return false;
        if (!url.startsWith('http')) return false;
        
        // Check if this is a Terabox CDN URL
        const isTeraboxCDN = url.includes('d.terabox.com') || url.includes('data.terabox.com') || 
                            url.includes('cdn.terabox.com') || url.includes('d1.terabox.com');
        const isDuboxAPI = url.includes('dubox.com') && (url.includes('/api/download') || url.includes('dlink='));
        
        return isTeraboxCDN || isDuboxAPI;
      }
      
      function sendResult(downloadUrl) {
        log('✅ Sending download link to app!');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'result',
          success: true,
          title: document.title || 'Terabox File',
          downloadUrl: downloadUrl,
          size: 0,
          thumbnail: ''
        }));
      }
      
      // Override window.open to intercept download links
      const originalOpen = window.open;
      window.open = function(url, target, features) {
        log('🔗 window.open intercepted: ' + url);
        if (url && isValidDownloadUrl(url)) {
          log('✅ Captured from window.open!');
          sendResult(url);
          return null;
        }
        return originalOpen.call(window, url, target, features);
      };
      
      // Override window.location to intercept redirects
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        get: function() {
          return originalLocation;
        },
        set: function(url) {
          log('🔗 location.href intercepted: ' + url);
          if (url && isValidDownloadUrl(url)) {
            log('✅ Captured from location.href!');
            sendResult(url);
            return;
          }
          originalLocation.href = url;
        }
      });
      
      // Intercept all clicks
      document.addEventListener('click', function(e) {
        let element = e.target;
        for (let i = 0; i < 5; i++) {
          if (!element) break;
          
          const href = element.href || element.getAttribute('href');
          const download = element.getAttribute('download');
          
          if (href && isValidDownloadUrl(href)) {
            log('🖱️ Download link clicked!');
            e.preventDefault();
            e.stopPropagation();
            sendResult(href);
            return false;
          }
          
          element = element.parentElement;
        }
      }, true);
      
      // Monitor for download links appearing on page
      let checkCount = 0;
      const interval = setInterval(() => {
        checkCount++;
        
        const downloadLinks = document.querySelectorAll('a[href*="terabox"], a[href*="dubox"], a[download]');
        for (let link of downloadLinks) {
          const href = link.href;
          
          if (isValidDownloadUrl(href)) {
            log('✅ Auto-detected download link!');
            clearInterval(interval);
            sendResult(href);
            return;
          }
        }
        
        if (checkCount >= 60) {
          clearInterval(interval);
          log('⏱️ Waiting for user to click download...');
        }
      }, 1000);
      
    })();
    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'log') {
        addDebugLog(data.message);
        return;
      }
      
      if (data.type === 'result') {
        if (data.success && data.downloadUrl) {
          console.log('✅ Got download link:', data.downloadUrl);
          setIsLoading(false);
          onExtractSuccess({
            title: data.title,
            downloadUrl: data.downloadUrl,
            size: data.size,
            thumbnail: data.thumbnail,
          });
        } else if (data.error) {
          console.log('❌ Error:', data.error);
          setIsLoading(false);
          onExtractError(data.error);
        }
      }
    } catch (error) {
      console.error('Parse error:', error);
      setIsLoading(false);
      onExtractError('Failed to extract download link');
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setExtractionStatus('Loading 1024teradownloader...');
    addDebugLog('🌐 Loading 1024teradownloader.com...');
  };

  const handleLoadEnd = () => {
    setExtractionStatus('Click download button on the page');
    addDebugLog('✅ Page loaded - user can now click download');
    
    // Hide loading overlay so user can see the page
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    // Inject script after page loads
    setTimeout(() => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(injectedJavaScript);
        addDebugLog('💉 Monitoring script injected');
      }
    }, 2000);
  };

  const handleNavigationStateChange = (navState: any) => {
    const url = navState.url;
    
    console.log('🔗 Navigation to:', url);
    addDebugLog('🔗 URL: ' + url.substring(0, 50));
    
    // Check if this is the actual Terabox CDN download link
    const isTeraboxCDN = 
      (url.includes('d.terabox.com') || url.includes('data.terabox.com') || 
       url.includes('cdn.terabox.com') || url.includes('d1.terabox.com')) &&
      !url.includes('.css') && !url.includes('.js') && !url.includes('.png') &&
      !url.includes('.jpg') && !url.includes('.ico') && !url.includes('.html');
    
    // Check if this is a Dubox API download link
    const isDuboxAPI = url.includes('dubox.com') && 
                       (url.includes('/api/download') || url.includes('dlink='));
    
    if (isTeraboxCDN || isDuboxAPI) {
      console.log('✅ Captured Terabox CDN download link!');
      addDebugLog('✅ Captured download link!');
      
      // Mark that external browser will open
      setHasOpenedExternalBrowser(true);
      
      // Stop the WebView and capture the link
      if (webViewRef.current) {
        webViewRef.current.stopLoading();
      }
      
      setIsLoading(false);
      onExtractSuccess({
        title: 'Terabox File',
        downloadUrl: url,
        size: 0,
        thumbnail: '',
      });
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url;
    
    console.log('🔗 Should start load:', url);
    
    // Check if this is the actual Terabox CDN download link
    const isTeraboxCDN = 
      (url.includes('d.terabox.com') || url.includes('data.terabox.com') || 
       url.includes('cdn.terabox.com') || url.includes('d1.terabox.com')) &&
      !url.includes('.css') && !url.includes('.js') && !url.includes('.png') &&
      !url.includes('.jpg') && !url.includes('.ico') && !url.includes('.html');
    
    // Check if this is a Dubox API download link
    const isDuboxAPI = url.includes('dubox.com') && 
                       (url.includes('/api/download') || url.includes('dlink='));
    
    if (isTeraboxCDN || isDuboxAPI) {
      console.log('✅ Intercepted download link before navigation!');
      addDebugLog('✅ Captured download link!');
      
      // Mark that external browser will open
      setHasOpenedExternalBrowser(true);
      
      setIsLoading(false);
      onExtractSuccess({
        title: 'Terabox File',
        downloadUrl: url,
        size: 0,
        thumbnail: '',
      });
      
      return false; // Block the navigation
    }
    
    // Allow all other navigations
    return true;
  };

  const handleError = () => {
    setIsLoading(false);
    addDebugLog('❌ Failed to load page');
    onExtractError('Failed to load 1024teradownloader');
  };

  return (
    <View style={styles.container}>
      {/* Loading/Instruction Overlay */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>{extractionStatus}</Text>
          <Text style={styles.subText}>The page will load below</Text>
        </View>
      )}
      
      {/* WebView - Visible to user */}
      <WebView
        ref={webViewRef}
        source={{ uri: downloaderUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
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
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
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
