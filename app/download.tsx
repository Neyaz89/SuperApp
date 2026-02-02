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
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

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

      setStatus('Connecting to server...');
      await simulateProgress(0, 15, 500);

      setStatus('Downloading...');
      await simulateProgress(15, 95, 3000);

      setStatus('Saving to gallery...');
      await simulateProgress(95, 100, 500);

      const fileUri = `${FileSystem.documentDirectory}download_${Date.now()}.${selectedQuality.format}`;
      
      setDownloadedFile({
        uri: fileUri,
        type: selectedQuality.type,
        quality: selectedQuality.quality,
        format: selectedQuality.format,
      });

      setTimeout(() => {
        router.replace('/complete');
      }, 500);
    } catch (error) {
      setStatus('Download failed. Please try again.');
      console.error('Download error:', error);
    }
  };

  const simulateProgress = (start: number, end: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const steps = 20;
      const increment = (end - start) / steps;
      const stepDuration = duration / steps;
      let current = start;

      const interval = setInterval(() => {
        current += increment;
        if (current >= end) {
          setProgress(end);
          clearInterval(interval);
          resolve();
        } else {
          setProgress(current);
        }
      }, stepDuration);
    });
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
