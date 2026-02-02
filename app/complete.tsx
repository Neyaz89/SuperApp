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
      
      <View style={styles.content}>
        <View style={[styles.successCircle, { backgroundColor: theme.primary + '20' }]}>
          <Text style={[styles.checkmark, { color: theme.primary }]}>✓</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Download Complete!</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your {downloadedFile.type} has been saved to your gallery
        </Text>

        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Quality</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {downloadedFile.quality}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Format</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {downloadedFile.format.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Type</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {downloadedFile.type.charAt(0).toUpperCase() + downloadedFile.type.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.border }]}
            onPress={handleDownloadAnother}
            activeOpacity={0.8}
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  checkmark: {
    fontSize: 56,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 40,
  },
  infoCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  actions: {
    width: '100%',
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
