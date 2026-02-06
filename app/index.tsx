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
import { Ionicons } from '@expo/vector-icons';
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
  const bounceAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation for circles
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

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
    // Bounce animation on button press
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

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
      if (!platform || platform === null) {
        setError('Invalid URL. Please enter a valid video URL from any supported site.');
        return;
      }

      setLoading(true);
      setError('');

      console.log('Starting extraction for:', url);
      
      // For Terabox, use WebView extraction (client-side)
      if (platform === 'terabox' || url.includes('terabox')) {
        console.log('🔵 Terabox detected - routing to WebView extraction');
        setLoading(false);
        router.push({
          pathname: '/terabox-extract',
          params: { url },
        });
        return;
      }
      
      // Fetch real media info for other platforms
      const mediaData = await mediaExtractor.extractMediaInfo(url, platform);
      
      console.log('Extraction successful:', mediaData.title);
      console.log('Video qualities received:', mediaData.qualities.length);
      console.log('Audio formats received:', mediaData.audioFormats.length);
      
      setMediaInfo({
        url,
        platform,
        title: mediaData.title,
        thumbnail: mediaData.thumbnail,
        duration: mediaData.duration,
        qualities: mediaData.qualities,
        audioFormats: mediaData.audioFormats,
      });

      console.log('MediaInfo stored in context - navigating to preview');
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

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Animated gradient circles */}
      <Animated.View
        style={[
          styles.decorCircle1,
          { transform: [{ rotate: spin }, { scale: pulseAnim }] },
        ]}
      />
      <Animated.View
        style={[
          styles.decorCircle2,
          { transform: [{ rotate: spin }] },
        ]}
      />
      <Animated.View
        style={[
          styles.decorCircle3,
          { transform: [{ rotate: spin }] },
        ]}
      />
      
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
            <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
              <Text style={[styles.logo, { color: theme.primary }]}>
                SuperApp
              </Text>
              <View style={styles.logoUnderline} />
            </Animated.View>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>
              Download from 1000+ sites 🔥
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.card,
                  borderColor: error ? '#FF6B6B' : 'transparent',
                  shadowColor: error ? '#FF6B6B' : theme.primary,
                },
              ]}
            >
              <View style={styles.inputIconContainer}>
                <Ionicons name="link-outline" size={24} color={theme.primary} />
              </View>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Paste link here..."
                placeholderTextColor={theme.textSecondary + '80'}
                value={url}
                onChangeText={(text) => {
                  setUrl(text);
                  setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity
                onPress={handlePaste}
                style={[styles.pasteButton, { backgroundColor: theme.primary }]}
                activeOpacity={0.7}
              >
                <Ionicons name="clipboard-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {error ? (
              <Animated.View style={[styles.errorContainer, { backgroundColor: '#FF6B6B15' }]}>
                <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            <View style={styles.platformsContainer}>
              <Text style={[styles.platformsLabel, { color: theme.textSecondary }]}>
                1800+ Supported Sites
              </Text>
              <View style={styles.platformIcons}>
                <View style={[styles.platformBadge, { backgroundColor: '#FF000015' }]}>
                  <PlatformIcon platform="youtube" size={28} />
                </View>
                <View style={[styles.platformBadge, { backgroundColor: '#E136B615' }]}>
                  <PlatformIcon platform="instagram" size={28} />
                </View>
                <View style={[styles.platformBadge, { backgroundColor: '#1877F215' }]}>
                  <PlatformIcon platform="facebook" size={28} />
                </View>
                <View style={[styles.platformBadge, { backgroundColor: '#1DA1F215' }]}>
                  <PlatformIcon platform="twitter" size={28} />
                </View>
                <View style={[styles.platformBadge, { backgroundColor: '#00ADEF15' }]}>
                  <PlatformIcon platform="vimeo" size={28} />
                </View>
                <View style={[styles.platformBadge, { backgroundColor: '#00000015' }]}>
                  <Text style={{ fontSize: 20, fontWeight: '800' }}>+1795</Text>
                </View>
              </View>
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
            <TouchableOpacity
              style={[
                styles.analyzeButton,
                loading && styles.analyzeButtonDisabled,
              ]}
              onPress={handleAnalyze}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isDark ? ['#4ECDC4', '#3AAFA9'] : ['#FF6B6B', '#EE5A6F']}
                style={styles.analyzeGradient}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.analyzeButtonText}>  Analyzing...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.analyzeButtonText}>Analyze</Text>
                    <View style={styles.analyzeIcon}>
                      <Ionicons name="rocket" size={20} color="#FFFFFF" />
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: isDark ? '#1A1A2E' : '#F8F9FA' }]}
              onPress={() => router.push('/games')}
              activeOpacity={0.7}
            >
              <View style={[styles.secondaryButtonIcon, { backgroundColor: '#4ECDC420' }]}>
                <Ionicons name="game-controller" size={20} color="#4ECDC4" />
              </View>
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Games</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: isDark ? '#1A1A2E' : '#F8F9FA' }]}
              onPress={() => router.push('/settings')}
              activeOpacity={0.7}
            >
              <View style={[styles.secondaryButtonIcon, { backgroundColor: '#FFE66D20' }]}>
                <Ionicons name="settings" size={20} color="#FFB800" />
              </View>
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorCircle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#FF6B6B15',
    top: -100,
    right: -80,
  },
  decorCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#4ECDC415',
    bottom: 150,
    left: -90,
  },
  decorCircle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFE66D15',
    top: 200,
    left: 30,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 8,
  },
  logoUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
    alignSelf: 'center',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 2,
    paddingHorizontal: 6,
    paddingVertical: 6,
    height: 68,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  inputIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  pasteButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 10,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  platformsContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  platformsLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  platformIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  platformBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeButton: {
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  analyzeGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  analyzeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  secondaryButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
