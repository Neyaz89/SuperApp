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
import { adManager } from '@/services/adManager';
import { downloadAsync, cacheDirectory, documentDirectory } from 'expo-file-system/legacy';
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
      setProgress(5);
      const filename = `SuperApp_${Date.now()}.${selectedQuality.format}`;
      const fileUri = baseDir + filename;

      setStatus('Downloading...');

      // Check if URL needs proxy (for adult sites)
      const needsProxy = (selectedQuality as any).needsProxy || false;
      const PROXY_API_URL = 'https://superapp-api-d3y5.onrender.com/api/download-proxy';
      
      let downloadUrl = selectedQuality.url;
      if (needsProxy) {
        console.log('🔄 Using download proxy for adult site');
        // Use the original source URL as referer (from mediaInfo)
        const sourceUrl = (mediaInfo as any)?.url || selectedQuality.url;
        const referer = sourceUrl;
        downloadUrl = `${PROXY_API_URL}?url=${encodeURIComponent(selectedQuality.url)}&referer=${encodeURIComponent(referer)}`;
        console.log('📍 Referer:', referer);
      }

      const downloadResult = await downloadAsync(
        downloadUrl,
        fileUri
      );

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
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
      setStatus(`Download failed: ${error.message || 'Unknown error'}`);
      
      setTimeout(() => {
        setStatus('Tap to retry or go back');
      }, 2000);
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
        paddingBottom: Math.max(insets.bottom, 20)
      }]}>
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
            <View style={[styles.iconInner, { backgroundColor: theme.primary + '30' }]}>
              <Text style={styles.iconText}>⬇️</Text>
            </View>
          </View>
        </Animated.View>

        <Text style={[styles.title, { color: theme.text }]}>Downloading</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {selectedQuality?.quality} • {selectedQuality?.format.toUpperCase()}
        </Text>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.card }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressWidth },
              ]}
            >
              <LinearGradient
                colors={isDark ? ['#4ECDC4', '#3AAFA9'] : ['#FF6B6B', '#EE5A6F']}
                style={styles.progressGradient}
              />
            </Animated.View>
          </View>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: theme.primary }]}>
              {Math.round(progress)}%
            </Text>
            <Text style={[styles.progressStatus, { color: theme.textSecondary }]}>
              {status}
            </Text>
          </View>
        </View>

        <View style={[styles.statusCard, { backgroundColor: theme.card }]}>
          <View style={styles.statusIconContainer}>
            <Text style={styles.statusIcon}>
              {progress < 30 ? '🚀' : progress < 70 ? '⚡' : progress < 100 ? '✨' : '🎉'}
            </Text>
          </View>
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            {progress < 30 ? 'Starting download...' : 
             progress < 70 ? 'Downloading at full speed...' : 
             progress < 100 ? 'Almost there...' : 
             'Complete!'}
          </Text>
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
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 56,
    fontWeight: '700',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 48,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  progressBar: {
    width: '100%',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
  },
  progressGradient: {
    flex: 1,
  },
  progressInfo: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 32,
    fontWeight: '900',
  },
  progressStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 20,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
});
