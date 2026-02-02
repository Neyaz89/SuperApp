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
import { adManager } from '@/services/adManager';
import { downloadAsync } from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export default function DownloadScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { selectedQuality, setDownloadedFile } = useDownload();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Preparing download...');
  const progressAnim = new Animated.Value(0);

  useEffect(() => {
    if (!selectedQuality) {
      router.replace('/');
      return;
    }

    showAdAndDownload();
  }, []);

  const showAdAndDownload = async () => {
    await adManager.showInterstitial();
    startDownload();
  };

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
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

      setStatus('Starting download...');
      setProgress(5);

      // Check if documentDirectory is available
      if (!FileSystem.documentDirectory) {
        throw new Error('File system not available. Use a development build.');
      }

      const filename = `SuperApp_${Date.now()}.${selectedQuality.format}`;
      const fileUri = FileSystem.documentDirectory + filename;

      console.log('Downloading to:', fileUri);
      console.log('From URL:', selectedQuality.url);

      setStatus('Downloading...');

      // Use legacy API to avoid deprecation error
      const downloadResult = await downloadAsync(
        selectedQuality.url,
        fileUri
      );

      console.log('Download result:', downloadResult);

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      setProgress(95);
      setStatus('Saving to gallery...');

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      
      try {
        await MediaLibrary.createAlbumAsync('SuperApp', asset, false);
      } catch (e) {
        // Album might already exist, try to get it
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
      
      // Retry option after 2 seconds
      setTimeout(() => {
        setStatus('Tap to retry or go back');
      }, 2000);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.iconText, { color: theme.primary }]}>↓</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Downloading</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {selectedQuality?.quality} • {selectedQuality?.format.toUpperCase()}
        </Text>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.card }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: theme.primary, width: progressWidth },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.text }]}>
            {Math.round(progress)}%
          </Text>
        </View>

        <Text style={[styles.status, { color: theme.textSecondary }]}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 48,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 48,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  status: {
    fontSize: 15,
    fontWeight: '500',
  },
});
