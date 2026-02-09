import React, { useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  
  // Use working Terabox downloader website
  const downloaderUrl = `https://playterabox.com/?url=${encodeURIComponent(url)}`;

  const handleLoadStart = () => {
    setIsLoading(true);
    setLoadProgress(0);
  };

  const handleLoadProgress = ({ nativeEvent }: any) => {
    setLoadProgress(nativeEvent.progress);
  };

  const handleLoadEnd = () => {
    // Hide loading after a short delay to ensure page is fully rendered
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleError = () => {
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading Terabox downloader...</Text>
          <Text style={styles.progressText}>{Math.round(loadProgress * 100)}%</Text>
        </View>
      )}
      
      {/* Header Info */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Terabox Downloader</Text>
        <Text style={styles.subHeaderText}>Powered by PlayTerabox.com</Text>
      </View>
      
      {/* WebView */}
      <WebView
        source={{ uri: downloaderUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        onLoadStart={handleLoadStart}
        onLoadProgress={handleLoadProgress}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        cacheEnabled={true}
        incognito={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Performance optimizations
        androidLayerType="hardware"
        androidHardwareAccelerationDisabled={false}
        // Allow file downloads
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subHeaderText: {
    color: '#999',
    fontSize: 12,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  progressText: {
    color: '#FF6B6B',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
});
