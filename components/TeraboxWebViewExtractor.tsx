import React, { useRef, useState } from 'react';
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
  const [extractionAttempts, setExtractionAttempts] = useState(0);

  // JavaScript code to inject into the WebView
  const injectedJavaScript = `
    (async function() {
      console.log('🔵 Terabox WebView: Starting extraction with client-side APIs...');
      
      const teraboxUrl = '${url}';
      
      // Extract share ID
      const shareIdMatch = teraboxUrl.match(/\\/s\\/([a-zA-Z0-9_-]+)/);
      const shareId = shareIdMatch ? shareIdMatch[1] : null;
      
      if (!shareId) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          success: false,
          error: 'Invalid Terabox URL - could not extract share ID'
        }));
        return;
      }
      
      console.log('📋 Share ID:', shareId);
      
      // Method 1: Try terabox.hnn.workers.dev API (from client side)
      async function tryWorkersAPI() {
        try {
          console.log('📡 Method 1: Trying terabox.hnn.workers.dev from client...');
          
          const infoUrl = 'https://terabox.hnn.workers.dev/api/get-info?shorturl=' + shareId + '&pwd=';
          const infoResponse = await fetch(infoUrl);
          
          console.log('Response status:', infoResponse.status);
          
          if (!infoResponse.ok) {
            throw new Error('HTTP ' + infoResponse.status);
          }
          
          const fileInfo = await infoResponse.json();
          console.log('File info received:', JSON.stringify(fileInfo).substring(0, 200));
          
          if (!fileInfo || !fileInfo.list || fileInfo.list.length === 0) {
            throw new Error('No file info in response');
          }
          
          const file = fileInfo.list[0];
          console.log('✅ Got file info:', file.server_filename);
          
          const downloadUrl = 'https://terabox.hnn.workers.dev/api/get-download';
          const downloadResponse = await fetch(downloadUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shareid: fileInfo.shareid,
              uk: fileInfo.uk,
              sign: fileInfo.sign,
              timestamp: fileInfo.timestamp,
              fs_id: file.fs_id
            })
          });
          
          console.log('Download response status:', downloadResponse.status);
          
          if (!downloadResponse.ok) {
            throw new Error('Download API HTTP ' + downloadResponse.status);
          }
          
          const downloadData = await downloadResponse.json();
          console.log('Download data received:', JSON.stringify(downloadData).substring(0, 200));
          
          if (downloadData && downloadData.downloadLink) {
            console.log('✅ Got download link from Workers API!');
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              success: true,
              title: file.server_filename || 'Terabox File',
              downloadUrl: downloadData.downloadLink,
              size: file.size || 0,
              thumbnail: file.thumbs?.url3 || file.thumbs?.url2 || ''
            }));
            return true;
          }
          
          throw new Error('No download link in response');
        } catch (error) {
          console.log('❌ Workers API failed:', error.message);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            success: false,
            debug: 'Workers API error: ' + error.message
          }));
          return false;
        }
      }
      
      // Method 2: Try Ashlynn Workers API (more reliable)
      async function tryAshlynnAPI() {
        try {
          console.log('📡 Method 2: Trying Ashlynn Workers API from client...');
          
          const response = await fetch('https://terabox.ashlynn.workers.dev/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: teraboxUrl
            })
          });
          
          console.log('Ashlynn response status:', response.status);
          
          if (!response.ok) {
            throw new Error('HTTP ' + response.status);
          }
          
          const data = await response.json();
          console.log('Ashlynn data received:', JSON.stringify(data).substring(0, 300));
          
          // Check if we got file info
          if (data && data.file_name && data.dlink) {
            console.log('✅ Got file info from Ashlynn!');
            
            // Construct proxy download URL
            const proxyUrl = 'https://terabox.ashlynn.workers.dev/proxy?url=' + 
              encodeURIComponent(data.dlink) + 
              '&file_name=' + encodeURIComponent(data.file_name) +
              '&cookie=ndus%3Ddefault';
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              success: true,
              title: data.file_name || 'Terabox File',
              downloadUrl: proxyUrl,
              size: parseInt(data.size) || 0,
              thumbnail: data.thumbnail || ''
            }));
            return true;
          }
          
          throw new Error('No file info in response');
        } catch (error) {
          console.log('❌ Ashlynn API failed:', error.message);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            success: false,
            debug: 'Ashlynn error: ' + error.message
          }));
          return false;
        }
      }
      
      // Method 3: Extract from page (fallback)
      function tryPageExtraction() {
        try {
          console.log('📡 Method 3: Trying page extraction...');
          
          if (typeof window.locals !== 'undefined' && window.locals && 
              window.locals.file_list && window.locals.file_list.length > 0) {
            const file = window.locals.file_list[0];
            console.log('✅ Found file in window.locals');
            console.log('File data:', JSON.stringify(file).substring(0, 300));
            
            // Get download link - try dlink first, then other fields
            let downloadUrl = file.dlink || file.path || '';
            
            // If we have shareid and uk, we can construct the download URL
            if (!downloadUrl && window.locals.shareid && window.locals.uk && file.fs_id) {
              console.log('📡 Constructing download URL from file info...');
              downloadUrl = 'https://www.terabox.com/share/download?app_id=250528&web=1&channel=dubox&clienttype=0&shareid=' + 
                window.locals.shareid + '&uk=' + window.locals.uk + '&primaryid=' + window.locals.shareid + '&fid_list=[' + file.fs_id + ']';
              console.log('✓ Constructed download URL');
            }
            
            if (downloadUrl) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                success: true,
                title: file.server_filename || 'Terabox File',
                downloadUrl: downloadUrl,
                size: file.size || 0,
                thumbnail: file.thumbs?.url3 || file.thumbs?.url2 || ''
              }));
              return true;
            } else {
              console.log('⚠️ Found file but no download URL');
            }
          }
          
          return false;
        } catch (error) {
          console.log('❌ Page extraction failed:', error.message);
          return false;
        }
      }
      
      // Try all methods in sequence
      async function extractWithFallbacks() {
        // Wait a bit for page to load first
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try page extraction first (fastest and most reliable)
        console.log('🔍 Attempt 1: Trying page extraction...');
        if (tryPageExtraction()) {
          console.log('✅ Page extraction succeeded on first try!');
          return;
        }
        
        // Wait a bit more and try again
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('🔍 Attempt 2: Trying page extraction...');
        if (tryPageExtraction()) {
          console.log('✅ Page extraction succeeded on second try!');
          return;
        }
        
        // If page extraction failed, try APIs
        console.log('⚠️ Page extraction failed, trying APIs...');
        
        // Try Workers API
        if (await tryWorkersAPI()) return;
        
        // Try Ashlynn API (more reliable)
        if (await tryAshlynnAPI()) return;
        
        // Final attempts with page extraction
        let attempts = 0;
        const maxAttempts = 8;
        const interval = setInterval(() => {
          attempts++;
          console.log('🔄 Final page extraction attempt', attempts + '/' + maxAttempts);
          
          if (tryPageExtraction() || attempts >= maxAttempts) {
            clearInterval(interval);
            
            if (attempts >= maxAttempts) {
              console.log('❌ All methods failed');
              window.ReactNativeWebView.postMessage(JSON.stringify({
                success: false,
                error: 'Could not extract download link. File may be private or require authentication.'
              }));
            }
          }
        }, 1500);
      }
      
      // Start extraction
      await extractWithFallbacks();
      
    })();
    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📦 Received data from WebView:', data);
      
      // Log any debug info
      if (data.debug) {
        console.log('🔍 Debug info:', data.debug);
      }
      
      if (data.success && data.downloadUrl) {
        setIsLoading(false);
        onExtractSuccess({
          title: data.title,
          downloadUrl: data.downloadUrl,
          size: data.size,
          thumbnail: data.thumbnail,
        });
      } else {
        setExtractionAttempts(prev => prev + 1);
        
        // Show error after 3 attempts
        if (extractionAttempts >= 2) {
          setIsLoading(false);
          onExtractError(data.error || 'Failed to extract download link');
        } else {
          console.log('⏳ Retrying... (attempt ' + (extractionAttempts + 1) + '/3)');
        }
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
      setIsLoading(false);
      onExtractError('Failed to parse extraction data');
    }
  };

  const handleLoadEnd = () => {
    console.log('✅ WebView loaded');
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setIsLoading(false);
    onExtractError('Failed to load Terabox page');
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Extracting download link...</Text>
          <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ 
          uri: url,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.terabox.com/',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Upgrade-Insecure-Requests': '1'
          }
        }}
        userAgent="Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36"
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        cacheEnabled={true}
        incognito={false}
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
    opacity: 0, // Hide WebView from user
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
  loadingSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
});
