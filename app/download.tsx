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
import { BannerAd } from '@/components/BannerAd';
import { adManager } from '@/services/adManager';
import { createDownloadResumable, cacheDirectory, documentDirectory } from 'expo-file-system/legacy';
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
    await adManager.showInterstitial();
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
      const { status: permissionStatus } = await MediaLibrary.requestPermissionsAsync();
      
      if (permissionStatus !== 'granted') {
        setStatus('Permission denied');
        return;
      }

      if (!selectedQuality?.url) {
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

      setStatus('Downloading...');

      // Check if URL needs proxy (for adult sites)
      const needsProxy = (selectedQuality as any).needsProxy || false;
      const PROXY_API_URL = 'https://superapp-api-d3y5.onrender.com/api/download-proxy';
      
      let downloadUrl = selectedQuality.url;
      if (needsProxy) {
        console.log('🔄 Using download proxy for adult site');
        const sourceUrl = (mediaInfo as any)?.url || selectedQuality.url;
        const referer = sourceUrl;
        downloadUrl = `${PROXY_API_URL}?url=${encodeURIComponent(selectedQuality.url)}&referer=${encodeURIComponent(referer)}`;
        console.log('📍 Referer:', referer);
      }

      // Use createDownloadResumable for real progress tracking
      const downloadResumable = createDownloadResumable(
        downloadUrl,
        fileUri,
        {},
        (downloadProgress) => {
          // Safely calculate progress percentage
          if (downloadProgress.totalBytesExpectedToWrite > 0) {
            const progressPercent = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
            setProgress(Math.min(Math.max(progressPercent, 0), 95)); // Clamp between 0-95%
            
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
            setStatus('Downloading...');
          }
        }
      );

      const downloadResult = await downloadResumable.downloadAsync();

      if (!downloadResult || !downloadResult.uri) {
        throw new Error('Download failed - no file received');
      }

      setProgress(95);
      setStatus('Saving to gallery...');

      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      
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
      console.error('Download error details:', error);
      
      let errorType = 'extraction';
      let errorMessage = 'Download failed. ';
      
      if (error.message?.includes('404')) {
        errorType = 'extraction';
        errorMessage = 'The download link has expired. This happens with some platforms.';
      } else if (error.message?.includes('Network')) {
        errorType = 'network';
        errorMessage = 'Check your internet connection.';
      } else if (error.message?.includes('timeout')) {
        errorType = 'timeout';
        errorMessage = 'Download took too long.';
      } else {
        errorMessage = error.message || 'Please try again.';
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
          <BannerAd 
            size="banner" 
            adUnitId="ca-app-pub-4846583305979583/5794145204"
          />
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
