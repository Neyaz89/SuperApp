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
    (function() {
      console.log('🔵 Terabox WebView: Starting extraction...');
      
      // Function to extract file data
      function extractFileData() {
        try {
          // Method 1: Check window.locals (most reliable)
          if (window.locals && window.locals.file_list && window.locals.file_list.length > 0) {
            const file = window.locals.file_list[0];
            console.log('✅ Found file data in window.locals');
            
            const data = {
              success: true,
              title: file.server_filename || 'Terabox File',
              downloadUrl: file.dlink || '',
              size: file.size || 0,
              thumbnail: file.thumbs?.url3 || file.thumbs?.url2 || '',
              shareid: window.locals.shareid,
              uk: window.locals.uk,
              fs_id: file.fs_id
            };
            
            // If no direct download link, we have the data to request it
            if (!data.downloadUrl && data.shareid && data.uk && data.fs_id) {
              console.log('📡 No direct link, will request download URL...');
              
              // Make API call to get download link
              const downloadUrl = 'https://www.terabox.app/share/download?app_id=250528&web=1&channel=dubox&clienttype=0&shareid=' + 
                data.shareid + '&uk=' + data.uk + '&primaryid=' + data.shareid + '&fid_list=[' + data.fs_id + ']';
              
              fetch(downloadUrl)
                .then(response => response.json())
                .then(downloadData => {
                  if (downloadData.errno === 0 && downloadData.list && downloadData.list[0]) {
                    data.downloadUrl = downloadData.list[0].dlink;
                    console.log('✅ Got download URL from API');
                    window.ReactNativeWebView.postMessage(JSON.stringify(data));
                  } else {
                    console.log('❌ Download API failed:', downloadData.errno);
                    window.ReactNativeWebView.postMessage(JSON.stringify(data));
                  }
                })
                .catch(err => {
                  console.log('❌ Download API error:', err);
                  window.ReactNativeWebView.postMessage(JSON.stringify(data));
                });
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify(data));
            }
            
            return true;
          }
          
          // Method 2: Try to find data in page elements
          const fileNameElement = document.querySelector('.file-name, .filename, [class*="filename"]');
          if (fileNameElement) {
            console.log('⚠️ Found file element but no window.locals');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              success: false,
              error: 'File found but download link not available yet'
            }));
            return false;
          }
          
          console.log('⚠️ No file data found yet');
          return false;
          
        } catch (error) {
          console.log('❌ Extraction error:', error.message);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            success: false,
            error: error.message
          }));
          return false;
        }
      }
      
      // Try extraction immediately
      if (extractFileData()) {
        return;
      }
      
      // If not found, wait and try again
      let attempts = 0;
      const maxAttempts = 10;
      const interval = setInterval(() => {
        attempts++;
        console.log('🔄 Extraction attempt', attempts);
        
        if (extractFileData() || attempts >= maxAttempts) {
          clearInterval(interval);
          
          if (attempts >= maxAttempts) {
            console.log('❌ Max attempts reached');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              success: false,
              error: 'Could not extract file data after ' + maxAttempts + ' attempts'
            }));
          }
        }
      }, 1000);
      
    })();
    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📦 Received data from WebView:', data);
      
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
        
        if (extractionAttempts >= 3) {
          setIsLoading(false);
          onExtractError(data.error || 'Failed to extract download link');
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
        source={{ uri: url }}
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
