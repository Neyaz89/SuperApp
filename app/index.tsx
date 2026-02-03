import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/contexts/ThemeContext';
import { useDownload } from '@/contexts/DownloadContext';
import { detectPlatform, validateUrl } from '@/utils/urlParser';
import { LinearGradient } from '@/components/LinearGradient';
import { PlatformIcon } from '@/components/PlatformIcon';

import { mediaExtractor } from '@/services/mediaExtractor';

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { setMediaInfo } = useDownload();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    checkClipboard();
  }, []);

  const checkClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (clipboardContent && validateUrl(clipboardContent)) {
        setUrl(clipboardContent);
      }
    } catch (err) {
      console.log('Clipboard check failed');
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      setUrl(clipboardContent);
      setError('');
    } catch (err) {
      setError('Failed to paste from clipboard');
    }
  };

  const handleAnalyze = async () => {
    try {
      if (!url.trim()) {
        setError('Please enter a valid URL');
        return;
      }

      if (!validateUrl(url)) {
        setError('Invalid URL format');
        return;
      }

      const platform = detectPlatform(url);
      if (!platform) {
        setError('Unsupported platform. We support YouTube, Instagram, Facebook, Twitter, TikTok, Vimeo, Reddit, Twitch, Dailymotion, Terabox & more.');
        return;
      }

      setLoading(true);
      setError('');

      console.log('Starting extraction for:', url);
      
      // Fetch real media info
      const mediaData = await mediaExtractor.extractMediaInfo(url, platform);
      
      console.log('Extraction successful:', mediaData.title);
      
      setMediaInfo({
        url,
        platform,
        title: mediaData.title,
        thumbnail: mediaData.thumbnail,
        duration: mediaData.duration,
        qualities: mediaData.qualities,
        audioFormats: mediaData.audioFormats,
      });

      setLoading(false);
      router.push('/preview');
    } catch (err: any) {
      console.error('Error in handleAnalyze:', err);
      let errorMessage = 'Failed to analyze media. ';
      
      if (err.message?.includes('Network request failed')) {
        errorMessage += 'Check your internet connection.';
      } else if (err.message?.includes('API request failed')) {
        errorMessage += 'Server is busy, please try again.';
      } else if (err.message?.includes('timeout')) {
        errorMessage += 'Request timed out, please try again.';
      } else {
        errorMessage += err.message || 'Please try again.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.logo, { color: theme.primary }]}>SuperApp</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>
              Download videos & audio from anywhere
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: error ? '#FF3B30' : theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Paste video or audio link here..."
                placeholderTextColor={theme.textSecondary}
                value={url}
                onChangeText={(text) => {
                  setUrl(text);
                  setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
                <Text style={[styles.pasteText, { color: theme.primary }]}>Paste</Text>
              </TouchableOpacity>
            </View>
            
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <View style={styles.platformsContainer}>
              <Text style={[styles.platformsLabel, { color: theme.textSecondary }]}>
                Supported: YouTube, Instagram, Facebook, Twitter, TikTok, Vimeo, Reddit, Twitch, Dailymotion, Terabox & more
              </Text>
              <View style={styles.platformIcons}>
                <PlatformIcon platform="youtube" size={32} />
                <PlatformIcon platform="instagram" size={32} />
                <PlatformIcon platform="facebook" size={32} />
                <PlatformIcon platform="twitter" size={32} />
                <PlatformIcon platform="vimeo" size={32} />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.analyzeButton,
              { backgroundColor: theme.primary },
              loading && styles.analyzeButtonDisabled,
            ]}
            onPress={handleAnalyze}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.analyzeButtonText}>Analyze Media</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Text style={[styles.settingsText, { color: theme.textSecondary }]}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gamesButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/games')}
          >
            <Text style={styles.gamesButtonText}>🎮 Play Games</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  pasteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pasteText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },
  platformsContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  platformsLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  platformIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  analyzeButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  settingsButton: {
    marginTop: 24,
    alignItems: 'center',
    padding: 12,
  },
  settingsText: {
    fontSize: 16,
    fontWeight: '500',
  },
  gamesButton: {
    marginTop: 16,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  gamesButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
