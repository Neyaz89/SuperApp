import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useDownload } from '@/contexts/DownloadContext';
import { LinearGradient } from '@/components/LinearGradient';
import LevelPlayBannerAd from '@/components/LevelPlayBannerAd';
import levelPlayAdsManager, { PLACEMENT_IDS } from '@/services/levelPlayAdsManager';
import { createDownloadResumable, cacheDirectory, documentDirectory, getInfoAsync } from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DownloadScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { selectedQuality, setDownloadedFile, mediaInfo } = useDownload();
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Preparing download...');
  const progressAnim = new Animated.Value(0);
  const pulseAnim = new Animated.Value(1);
  const rotateAnim = new Animated.Value(0);

  useEffect(() => {
    if (!selectedQuality) {
      router.replace('/');
      return;
    }

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    showAdAndDownload();
  }, []);

  const showAdAndDownload = async () => {
    // TODO: Implement interstitial ad with IronSource
    // await levelPlayAdsManager.showInterstitial(PLACEMENT_IDS.INTERSTITIAL);
    startDownload();
  };

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      friction: 5,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const startDownload = async () => {
    try {
      console.log('=== DOWNLOAD STARTED ===');
      console.log('Selected Quality:', JSON.stringify(selectedQuality, null, 2));
      
      const { status: permissionStatus } = await MediaLibrary.requestPermissionsAsync();
      
      if (permissionStatus !== 'granted') {
        console.error('❌ Permission denied');
        setStatus('Permission denied');
        return;
      }

      if (!selectedQuality?.url) {
        console.error('❌ No download URL available');
        setStatus('No download URL available');
        return;
      }

      let baseDir = cacheDirectory || documentDirectory;
      
      if (!baseDir) {
        baseDir = 'file:///data/user/0/com.superapp.media/cache/';
      }

      setStatus('Starting download...');
      setProgress(1);
      const filename = `SuperHub_${Date.now()}.${selectedQuality.format}`;
      const fileUri = baseDir + filename;

      console.log('📁 Download path:', fileUri);

      setStatus('Downloading...');

      // Check if URL needs proxy (for adult sites or sites with auth)
      const needsProxy = (selectedQuality as any).needsProxy || false;
      const platform = (mediaInfo as any)?.platform || 'generic';
      
      // Auto-detect if proxy is needed based on URL patterns
      // IMPORTANT: Token-based URLs (v-acctoken) should NOT use proxy
      // because the token is tied to the user's session/IP
      const hasToken = selectedQuality.url.includes('v-acctoken') || 
                       selectedQuality.url.includes('token=') ||
                       selectedQuality.url.includes('_token=');
      
      const requiresProxy = !hasToken && (
        needsProxy || 
        selectedQuality.url.includes('xvideos') ||
        selectedQuality.url.includes('pornhub')
      );
      
      const PROXY_API_URL = 'https://superapp-api-d3y5.onrender.com/api/download-proxy';
      
      let downloadUrl = selectedQuality.url;
      if (requiresProxy) {
        console.log('🔄 Using download proxy (detected protected URL)');
        const sourceUrl = (mediaInfo as any)?.url || selectedQuality.url;
        const referer = sourceUrl;
        downloadUrl = `${PROXY_API_URL}?url=${encodeURIComponent(selectedQuality.url)}&referer=${encodeURIComponent(referer)}`;
        console.log('📍 Referer:', referer);
        console.log('🔗 Proxy URL:', downloadUrl);
      } else {
        if (hasToken) {
          console.log('⚡ Direct download (token-based URL, proxy would break it)');
        } else {
          console.log('⚡ Direct download (no proxy needed)');
        }
        console.log('🔗 Direct URL:', downloadUrl);
      }

      // Use createDownloadResumable for real progress tracking
      console.log('📥 Creating download resumable...');
      const downloadResumable = createDownloadResumable(
        downloadUrl,
        fileUri,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36',
            'Referer': (mediaInfo as any)?.url || 'https://www.desikahani2.net/',
            'Accept': 'video/webm,video/ogg,video/*;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Fetch-Dest': 'video',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'same-origin',
          }
        },
        (downloadProgress) => {
          // Safely calculate progress percentage
          if (downloadProgress.totalBytesExpectedToWrite > 0) {
            const progressPercent = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
            setProgress(Math.min(Math.max(progressPercent, 0), 95)); // Clamp between 0-95%
            
            console.log(`📊 Progress: ${progressPercent.toFixed(1)}% (${downloadProgress.totalBytesWritten}/${downloadProgress.totalBytesExpectedToWrite} bytes)`);
            
            // Update status based on progress
            if (progressPercent < 25) {
              setStatus('Starting download...');
            } else if (progressPercent < 75) {
              setStatus('Downloading...');
            } else {
              setStatus('Almost done...');
            }
          } else {
            // If size is unknown, show indeterminate progress
            console.log(`📊 Progress: ${downloadProgress.totalBytesWritten} bytes (size unknown)`);
            setStatus('Downloading...');
          }
        }
      );

      console.log('⏳ Starting download async...');
      const downloadResult = await downloadResumable.downloadAsync();
      console.log('✅ Download result:', downloadResult);

      if (!downloadResult || !downloadResult.uri) {
        throw new Error('Download failed - no file received');
      }

      // Check response status if available
      if (downloadResult.status && downloadResult.status !== 200 && downloadResult.status !== 206) {
        console.error('❌ Bad response status:', downloadResult.status);
        
        // If proxy failed with 403, try direct download as fallback
        if (downloadResult.status === 403 && requiresProxy) {
          console.log('🔄 Proxy failed with 403, trying direct download as fallback...');
          
          const directDownloadResumable = createDownloadResumable(
            selectedQuality.url, // Use original URL directly
            fileUri,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36',
                'Referer': (mediaInfo as any)?.url || 'https://www.desikahani2.net/',
                'Accept': 'video/webm,video/ogg,video/*;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Fetch-Dest': 'video',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'same-origin',
              }
            },
            (downloadProgress) => {
              if (downloadProgress.totalBytesExpectedToWrite > 0) {
                const progressPercent = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
                setProgress(Math.min(Math.max(progressPercent, 0), 95));
                console.log(`📊 Direct download progress: ${progressPercent.toFixed(1)}%`);
              }
            }
          );
          
          try {
            const directResult = await directDownloadResumable.downloadAsync();
            console.log('✅ Direct download result:', directResult);
            
            // Check if direct download actually succeeded
            if (directResult && directResult.uri) {
              // Check status code
              if (directResult.status && directResult.status !== 200 && directResult.status !== 206) {
                console.error('❌ Direct download also failed with status:', directResult.status);
                throw new Error(`Direct download failed with status ${directResult.status}`);
              }
              
              // Check file validity
              const directFileInfo = await getInfoAsync(directResult.uri);
              console.log('📄 Direct download file info:', directFileInfo);
              
              if (directFileInfo.exists && 'size' in directFileInfo && directFileInfo.size > 1000) {
                console.log('✅ Direct download file is valid, size:', directFileInfo.size);
                // Continue with this result
                setProgress(95);
                setStatus('Saving to gallery...');
                
                const asset = await MediaLibrary.createAssetAsync(directResult.uri);
                
                try {
                  await MediaLibrary.createAlbumAsync('SuperApp', asset, false);
                } catch (e) {
                  const album = await MediaLibrary.getAlbumAsync('SuperApp');
                  if (album) {
                    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
                  }
                }
                
                setProgress(100);
                setStatus('Download complete!');
                console.log('🎉 DOWNLOAD COMPLETE (via direct fallback)!');
                
                setDownloadedFile({
                  uri: directResult.uri,
                  type: selectedQuality.type,
                  quality: selectedQuality.quality,
                  format: selectedQuality.format,
                });
                
                setTimeout(() => {
                  router.replace('/complete');
                }, 500);
                return; // Exit successfully
              } else {
                const sizeInfo = 'size' in directFileInfo ? directFileInfo.size : 'unknown';
                console.error('❌ Direct download file is invalid or too small:', sizeInfo);
                throw new Error('Direct download file is invalid');
              }
            } else {
              console.error('❌ Direct download returned no result');
              throw new Error('Direct download returned no result');
            }
          } catch (directError: any) {
            console.error('❌ Direct download also failed:', directError.message);
          }
        }
        
        // If we get here, both proxy and direct failed
        if (downloadResult.status === 403) {
          throw new Error('Access forbidden - authentication failed (tried both proxy and direct)');
        } else if (downloadResult.status === 404) {
          throw new Error('Video not found - URL may have expired');
        } else {
          throw new Error(`Download failed with status ${downloadResult.status}`);
        }
      }

      // Check if file actually exists and has content
      const fileInfo = await getInfoAsync(downloadResult.uri);
      console.log('📄 File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Downloaded file does not exist');
      }
      
      if ('size' in fileInfo && (fileInfo.size === 0 || fileInfo.size < 1000)) {
        throw new Error('Downloaded file is empty or too small (likely an error response)');
      }

      setProgress(95);
      setStatus('Saving to gallery...');
      console.log('💾 Saving to gallery...');

      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      console.log('✅ Asset created:', asset.id);
      
      try {
        await MediaLibrary.createAlbumAsync('SuperApp', asset, false);
        console.log('✅ Album created');
      } catch (e) {
        console.log('📁 Album exists, adding to existing...');
        const album = await MediaLibrary.getAlbumAsync('SuperApp');
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          console.log('✅ Added to existing album');
        }
      }

      setProgress(100);
      setStatus('Download complete!');
      console.log('🎉 DOWNLOAD COMPLETE!');

      setDownloadedFile({
        uri: downloadResult.uri,
        type: selectedQuality.type,
        quality: selectedQuality.quality,
        format: selectedQuality.format,
      });

      setTimeout(() => {
        router.replace('/complete');
      }, 500);
    } catch (error: any) {
      console.error('❌ DOWNLOAD ERROR:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      let errorType = 'extraction';
      let errorMessage = 'Download failed. ';
      
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        errorType = 'extraction';
        errorMessage = 'The download link has expired or is invalid. This happens with some platforms.';
      } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        errorType = 'extraction';
        errorMessage = 'Access denied. The video may be protected or require authentication.';
      } else if (error.message?.includes('Network') || error.message?.includes('network')) {
        errorType = 'network';
        errorMessage = 'Network error. Check your internet connection.';
      } else if (error.message?.includes('timeout')) {
        errorType = 'timeout';
        errorMessage = 'Download took too long. Try again.';
      } else if (error.message?.includes('empty') || error.message?.includes('0 bytes')) {
        errorType = 'extraction';
        errorMessage = 'Downloaded file is empty. The video URL may be invalid.';
      } else {
        errorMessage = error.message || 'Unknown error. Please try again.';
      }
      
      // Navigate to error screen
      router.replace({
        pathname: '/error',
        params: {
          type: errorType,
          message: errorMessage,
          url: (mediaInfo as any)?.url || '',
        },
      });
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        translucent
        backgroundColor="transparent"
      />
      
      {/* Animated gradient circles */}
      <Animated.View
        style={[
          styles.decorCircle1,
          { backgroundColor: '#FF6B6B15', transform: [{ rotate: spin }, { scale: pulseAnim }] },
        ]}
      />
      <Animated.View
        style={[
          styles.decorCircle2,
          { backgroundColor: '#4ECDC415', transform: [{ rotate: spin }] },
        ]}
      />
      <Animated.View
        style={[
          styles.decorCircle3,
          { backgroundColor: '#FFE66D15', transform: [{ rotate: spin }] },
        ]}
      />
      
      <View style={[styles.content, { 
        paddingTop: Math.max(insets.top, 20),
      }]}>
        {/* Clean Header */}
        <View style={styles.headerSection}>
          <View style={[styles.downloadIcon, { backgroundColor: theme.primary + '15' }]}>
            <Text style={styles.downloadIconText}>📥</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Downloading</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {selectedQuality?.quality} • {selectedQuality?.format.toUpperCase()}
          </Text>
        </View>

        {/* Professional Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: theme.card }]}>
          {/* Large Percentage Display */}
          <View style={styles.percentageContainer}>
            <Text style={[styles.percentageText, { color: theme.primary }]}>
              {Math.round(progress)}%
            </Text>
            <Text style={[styles.percentageLabel, { color: theme.textSecondary }]}>
              {status}
            </Text>
          </View>

          {/* Clean Progress Bar */}
          <View style={[styles.progressBarWrapper, { backgroundColor: theme.primary + '15' }]}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { 
                  width: progressWidth,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>

          {/* Status Message */}
          <View style={styles.statusMessageContainer}>
            <View style={[styles.statusDot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.statusMessage, { color: theme.textSecondary }]}>
              {progress < 25 ? 'Initializing download...' : 
               progress < 50 ? 'Downloading your file...' : 
               progress < 75 ? 'More than halfway there...' :
               progress < 95 ? 'Almost complete...' : 
               progress < 100 ? 'Saving to gallery...' :
               'Download complete!'}
            </Text>
          </View>
        </View>

        {/* Banner Ad at bottom */}
        <View style={[styles.bannerAdContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <LevelPlayBannerAd placementId={PLACEMENT_IDS.BANNER_PREVIEW} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -100,
    right: -70,
  },
  decorCircle2: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    bottom: 150,
    left: -85,
  },
  decorCircle3: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    top: 250,
    right: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  downloadIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  downloadIconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressCard: {
    width: '100%',
    padding: 28,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 32,
  },
  percentageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  percentageText: {
    fontSize: 56,
    fontWeight: '900',
    marginBottom: 4,
  },
  percentageLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarWrapper: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusMessage: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  bannerAdContainer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
});
