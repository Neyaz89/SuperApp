import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useDownload } from '@/contexts/DownloadContext';
import { LinearGradient } from '@/components/LinearGradient';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd } from '@/components/BannerAd';

export default function CompleteScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { downloadedFile } = useDownload();
  const insets = useSafeAreaInsets();

  if (!downloadedFile) {
    router.replace('/');
    return null;
  }

  const handleShare = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(downloadedFile.uri);
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share file');
    }
  };

  const handleDownloadAnother = () => {
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        translucent
        backgroundColor="transparent"
      />
      
      {/* Animated circles */}
      <View style={[styles.decorCircle1, { backgroundColor: '#6EE7B720' }]} />
      <View style={[styles.decorCircle2, { backgroundColor: '#60A5FA20' }]} />
      
      <View style={[styles.content, { 
        paddingTop: Math.max(insets.top, 20),
        paddingBottom: Math.max(insets.bottom, 20)
      }]}>
        {/* Success animation */}
        <View style={[styles.successCircle, { backgroundColor: '#6EE7B720' }]}>
          <View style={[styles.successInner, { backgroundColor: '#6EE7B730' }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Complete!</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Saved to your gallery
        </Text>

        {/* Banner Ad */}
        <View style={styles.bannerAdContainer}>
          <BannerAd 
            size="mediumRectangle" 
            adUnitId="ca-app-pub-4846583305979583/5794145204"
          />
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.primaryGradient}
            >
              <Ionicons name="share-outline" size={24} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Share</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.card }]}
            onPress={handleDownloadAnother}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
              Process Another
            </Text>
          </TouchableOpacity>
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
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -60,
  },
  decorCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: 100,
    left: -80,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 56,
    fontWeight: '700',
    color: '#10B981',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  bannerAdContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  actions: {
    width: '100%',
  },
  primaryButton: {
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
