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
  Image,
  Dimensions,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useDownload } from '@/contexts/DownloadContext';
import { detectPlatform, validateUrl } from '@/utils/urlParser';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import levelPlayAdsManager, { PLACEMENT_IDS } from '@/services/levelPlayAdsManager';
import LevelPlayBannerAd from '@/components/LevelPlayBannerAd';

import { mediaExtractor } from '@/services/mediaExtractor';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { setMediaInfo } = useDownload();
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const bounceAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const shineAnim = React.useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = React.useRef(new Animated.Value(1)).current;

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

    // Shine animation for button
    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
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
    // Dismiss keyboard
    Keyboard.dismiss();

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScaleAnim, {
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

      // Show rewarded ad and extract media in parallel for best UX
      setLoadingMessage('Preparing...');
      setLoading(true);

      console.log('Starting extraction for:', url);
      
      // Run ad and extraction simultaneously
      const [adResult, mediaData] = await Promise.all([
        // Show rewarded ad
        (async () => {
          setLoadingMessage('Loading ad...');
          // TODO: Implement rewarded ad with IronSource
          // await levelPlayAdsManager.showRewarded(PLACEMENT_IDS.REWARDED);
          return true;
        })(),
        // Extract media info in background while ad plays
        (async () => {
          await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
          setLoadingMessage('Analyzing in background...');
          const data = await mediaExtractor.extractMediaInfo(url, platform);
          return data;
        })()
      ]);

      setLoadingMessage('Processing results...');
      
      // Check if WebView extraction is needed (for Terabox)
      if (mediaData.useWebView && mediaData.webViewUrl) {
        console.log('WebView extraction required - navigating to Terabox WebView screen');
        setLoading(false);
        setLoadingMessage('');
        router.push({
          pathname: '/terabox-extract',
          params: { url: mediaData.webViewUrl }
        });
        return;
      }
      
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

      setLoadingMessage('Success! Redirecting...');
      console.log('MediaInfo stored in context - navigating to preview');
      
      setTimeout(() => {
        setLoading(false);
        setLoadingMessage('');
        router.push('/preview');
      }, 500);
    } catch (err: any) {
      console.error('Error in handleAnalyze:', err);
      
      let errorType = 'extraction';
      let errorMessage = 'Failed to analyze media. ';
      
      if (err.message?.includes('Network request failed')) {
        errorType = 'network';
        errorMessage = 'Check your internet connection.';
      } else if (err.message?.includes('API request failed')) {
        errorType = 'extraction';
        errorMessage = 'Server is busy, please try again.';
      } else if (err.message?.includes('timeout')) {
        errorType = 'timeout';
        errorMessage = 'Request timed out, please try again.';
      } else if (err.message?.includes('Invalid URL')) {
        errorType = 'unsupported';
        errorMessage = err.message || 'This link is not supported.';
      } else {
        errorMessage = err.message || 'Please try again.';
      }
      
      setLoading(false);
      setLoadingMessage('');
      
      // Navigate to error screen with details
      router.push({
        pathname: '/error',
        params: {
          type: errorType,
          message: errorMessage,
          url: url,
        },
      });
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shineTranslate = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const shineOpacity = shineAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 0],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        translucent
        backgroundColor="transparent"
      />
      
      {/* Settings button in top right */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.card }]}
          onPress={() => router.push('/settings')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>
      
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
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.header}>
            <Animated.View style={{ transform: [{ scale: bounceAnim }], alignItems: 'center' }}>
              <Image 
                source={require('@/assets/logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>
            <View style={styles.taglineContainer}>
              <Text style={[styles.taglineText, { color: theme.textSecondary }]}>
                Your all-in-one 
              </Text>
              <Text style={[styles.funText, { 
                color: isDark ? '#C4B5FD' : '#8B5CF6',
              }]}>
                {' '}fun hub
              </Text>
            </View>
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
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
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
                colors={isDark ? ['#7C3AED', '#6D28D9', '#5B21B6'] : ['#7C3AED', '#6D28D9', '#5B21B6']}
                style={styles.analyzeGradient}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.analyzeButtonText}>  {loadingMessage || 'Analyzing...'}</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="search-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.analyzeButtonText}>Search for Fun</Text>
                    
                    {/* Shine effect overlay */}
                    <Animated.View
                      style={[
                        styles.shineOverlay,
                        {
                          opacity: shineOpacity,
                          transform: [{ translateX: shineTranslate }, { rotate: '25deg' }],
                        },
                      ]}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={[styles.gamesCard, { backgroundColor: isDark ? '#2E1065' : '#FFFFFF' }]}
              onPress={() => router.push('/games')}
              activeOpacity={0.85}
            >
              <View style={styles.gamesCardHeader}>
                <View style={styles.gamesIconWrapper}>
                  <LinearGradient
                    colors={['#60A5FA', '#3B82F6']}
                    style={styles.gamesIconGradient}
                  >
                    <Ionicons name="game-controller" size={36} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <View style={styles.gamesArrowWrapper}>
                  <Ionicons name="arrow-forward" size={24} color={theme.primary} />
                </View>
              </View>
              <View style={styles.gamesCardBody}>
                <Text style={[styles.gamesTitle, { color: theme.text }]}>
                  Play Games
                </Text>
                <Text style={[styles.gamesSubtitle, { color: theme.textSecondary }]}>
                  10+ fun games • Have fun
                </Text>
              </View>
              <View style={[styles.gamesCardFooter, { backgroundColor: isDark ? '#3B82F620' : '#60A5FA10' }]}>
                <Text style={[styles.gamesFooterText, { color: theme.primary }]}>
                  Tap to explore games
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Banner Ad at bottom */}
          <View style={styles.bannerAdContainer}>
            <LevelPlayBannerAd placementId={PLACEMENT_IDS.BANNER_BOTTOM} />
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
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 10,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  decorCircle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#C4B5FD20', // Light purple from logo
    top: -100,
    right: -80,
  },
  decorCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#93C5FD20', // Cyan from logo
    bottom: 150,
    left: -90,
  },
  decorCircle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FCA5A520', // Pink from logo
    top: 200,
    left: 30,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    justifyContent: 'flex-start',
    marginTop: 37.5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 0,
  },
  logoImage: {
    width: SCREEN_HEIGHT > 700 ? 240 : 180,
    height: SCREEN_HEIGHT > 700 ? 240 : 180,
    marginBottom: 0,
    marginTop: 0,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 0,
    marginBottom: SCREEN_HEIGHT > 700 ? 16 : 12,
  },
  taglineText: {
    fontSize: SCREEN_HEIGHT > 700 ? 17 : 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  funText: {
    fontSize: SCREEN_HEIGHT > 700 ? 17 : 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: SCREEN_HEIGHT > 700 ? 16 : 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 0,
    marginBottom: SCREEN_HEIGHT > 700 ? 16 : 12,
  },
  inputContainer: {
    marginBottom: SCREEN_HEIGHT > 700 ? 24 : 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 2,
    paddingHorizontal: 6,
    paddingVertical: 6,
    height: SCREEN_HEIGHT > 700 ? 68 : 60,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  inputIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#A78BFA20',
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
    shadowColor: '#A78BFA',
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
    height: SCREEN_HEIGHT > 700 ? 72 : 64,
    borderRadius: SCREEN_HEIGHT > 700 ? 36 : 32,
    overflow: 'hidden',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 32,
    elevation: 16,
    marginBottom: SCREEN_HEIGHT > 700 ? 20 : 12,
  },
  analyzeGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  shineOverlay: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
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
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  bannerAdContainer: {
    marginTop: 16,
    width: '100%',
  },
  gamesCard: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  gamesCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  gamesIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gamesIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gamesArrowWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gamesCardBody: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  gamesTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  gamesSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  gamesCardFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  gamesFooterText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flex: 1,
    height: 104,
    borderRadius: 24,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  secondaryButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
