import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getGameById } from '@/services/html5GamesService';
import { adManager } from '@/services/adManager';

export default function HTML5GamePlayer() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [adShown, setAdShown] = useState(false);

  const game = gameId ? getGameById(gameId) : null;

  // Show interstitial ad before game loads
  useEffect(() => {
    if (game && !adShown) {
      // Show ad after a short delay
      const timer = setTimeout(() => {
        adManager.showInterstitial()
          .then(() => {
            console.log('Interstitial ad shown before game');
          })
          .catch((err: Error) => {
            console.log('No ad available:', err.message);
          });
        setAdShown(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [game, adShown]);

  // Handle back button - show ad on exit
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (!game) {
      Alert.alert('Error', 'Game not found', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [game]);

  const handleExit = () => {
    // Show interstitial ad when exiting
    adManager.showInterstitial()
      .then(() => {
        console.log('Exit interstitial ad shown');
      })
      .catch((err: Error) => {
        console.log('No exit ad available:', err.message);
      })
      .finally(() => {
        router.back();
      });
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
    Alert.alert(
      'Loading Error',
      'Failed to load the game. Please check your internet connection and try again.',
      [
        { text: 'Retry', onPress: () => { setError(false); setLoading(true); } },
        { text: 'Go Back', onPress: handleExit }
      ]
    );
  };

  if (!game) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // WebView configuration to block external ads
  const injectedJavaScript = `
    // Block common ad networks
    (function() {
      const adDomains = [
        'doubleclick.net',
        'googlesyndication.com',
        'googleadservices.com',
        'adnxs.com',
        'advertising.com',
        'criteo.com',
        'outbrain.com',
        'taboola.com',
      ];
      
      // Override fetch to block ad requests
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && adDomains.some(domain => url.includes(domain))) {
          return Promise.reject(new Error('Blocked'));
        }
        return originalFetch.apply(this, args);
      };
      
      // Block ad-related iframes
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            if (node.tagName === 'IFRAME') {
              const src = node.src || '';
              if (adDomains.some(domain => src.includes(domain))) {
                node.remove();
              }
            }
          });
        });
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
    })();
    true;
  `;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        translucent
        backgroundColor="transparent"
        hidden={isFullscreen}
      />

      {/* Header with Banner Ad Space */}
      {!isFullscreen && (
        <View style={[styles.header, { 
          paddingTop: insets.top + 16,
          backgroundColor: theme.card,
          borderBottomColor: theme.border,
        }]}>
          <TouchableOpacity
            onPress={handleExit}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={[styles.gameTitle, { color: theme.text }]} numberOfLines={1}>
              {game.title}
            </Text>
            <View style={styles.gameStats}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {game.rating}
              </Text>
              <Text style={[styles.separator, { color: theme.textSecondary }]}>•</Text>
              <Ionicons name="play" size={14} color={theme.primary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {game.plays}
              </Text>
              {game.offline && (
                <>
                  <Text style={[styles.separator, { color: theme.textSecondary }]}>•</Text>
                  <Ionicons name="cloud-offline" size={14} color="#10B981" />
                </>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => setIsFullscreen(!isFullscreen)}
            style={styles.headerButton}
          >
            <Ionicons 
              name={isFullscreen ? "contract" : "expand"} 
              size={24} 
              color={theme.text} 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Game WebView */}
      <View style={styles.gameContainer}>
        {!error && (
          <WebView
            source={{ uri: game.url }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={handleError}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            injectedJavaScript={injectedJavaScript}
            // Cache for offline play
            cacheEnabled={true}
            cacheMode="LOAD_CACHE_ELSE_NETWORK"
            // Security settings
            allowsBackForwardNavigationGestures={false}
            allowFileAccess={false}
            allowUniversalAccessFromFileURLs={false}
            // Show loading indicator in WebView itself
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Loading {game.title}...
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Fullscreen Toggle Button */}
      {isFullscreen && (
        <TouchableOpacity
          style={[styles.fullscreenButton, { backgroundColor: theme.card }]}
          onPress={() => setIsFullscreen(false)}
        >
          <Ionicons name="contract" size={24} color={theme.text} />
        </TouchableOpacity>
      )}

      {/* Ad Info Badge */}
      {!isFullscreen && (
        <View style={[styles.adInfoBadge, { backgroundColor: theme.primary }]}>
          <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
          <Text style={styles.adInfoText}>Ad-Free Game</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  gameStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    fontSize: 12,
    fontWeight: '600',
  },
  gameContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webviewLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  fullscreenButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  adInfoBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  adInfoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
