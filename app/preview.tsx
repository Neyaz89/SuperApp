import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useDownload } from '@/contexts/DownloadContext';
import { PlatformIcon } from '@/components/PlatformIcon';

export default function PreviewScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { mediaInfo } = useDownload();

  if (!mediaInfo) {
    router.replace('/');
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Media Preview</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.thumbnailContainer, { backgroundColor: theme.card }]}>
          <Image
            source={{ uri: mediaInfo.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{mediaInfo.duration}</Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.platformRow}>
            <PlatformIcon platform={mediaInfo.platform} size={28} />
            <Text style={[styles.platformName, { color: theme.textSecondary }]}>
              {mediaInfo.platform.charAt(0).toUpperCase() + mediaInfo.platform.slice(1)}
            </Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]} numberOfLines={3}>
            {mediaInfo.title}
          </Text>

          <View style={styles.statsRow}>
            <View style={[styles.statBadge, { backgroundColor: theme.card }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Qualities</Text>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {mediaInfo.qualities.length}
              </Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: theme.card }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Audio</Text>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {mediaInfo.audioFormats.length}
              </Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: theme.card }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Duration</Text>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {mediaInfo.duration}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/quality')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Choose Quality & Download</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.border }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
              Try Another Link
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  thumbnailContainer: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  platformName: {
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statBadge: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  actionButton: {
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
  actionButtonText: {
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
