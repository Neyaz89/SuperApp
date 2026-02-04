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
import { useTheme } from '@/contexts/ThemeContext';
import { useDownload } from '@/contexts/DownloadContext';
import { LinearGradient } from '@/components/LinearGradient';
import * as Sharing from 'expo-sharing';

export default function CompleteScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { downloadedFile } = useDownload();

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
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Animated circles */}
      <View style={[styles.decorCircle1, { backgroundColor: '#51CF6620' }]} />
      <View style={[styles.decorCircle2, { backgroundColor: '#4ECDC420' }]} />
      
      <View style={styles.content}>
        {/* Success animation */}
        <View style={[styles.successCircle, { backgroundColor: '#51CF6615' }]}>
          <View style={[styles.successInner, { backgroundColor: '#51CF6630' }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Download Complete!</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your {downloadedFile.type} is ready 🎉
        </Text>

        {/* Info cards */}
        <View style={styles.infoContainer}>
          <View style={[styles.infoCard, { backgroundColor: '#FF6B6B15' }]}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>🎬</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Quality</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {downloadedFile.quality}
              </Text>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: '#4ECDC415' }]}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>📦</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Format</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {downloadedFile.format.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: '#FFE66D15' }]}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>📁</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Type</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {downloadedFile.type.charAt(0).toUpperCase() + downloadedFile.type.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#51CF66', '#45B85A']}
              style={styles.primaryGradient}
            >
              <View style={styles.primaryButtonIcon}>
                <Text style={styles.primaryButtonIconText}>📤</Text>
              </View>
              <Text style={styles.primaryButtonText}>Share</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.card }]}
            onPress={handleDownloadAnother}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
              Download Another
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
    color: '#51CF66',
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
    marginBottom: 40,
  },
  infoContainer: {
    width: '100%',
    marginBottom: 32,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  actions: {
    width: '100%',
  },
  primaryButton: {
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#51CF66',
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
  primaryButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonIconText: {
    fontSize: 20,
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
