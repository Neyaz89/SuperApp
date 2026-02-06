import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useDownload } from '@/contexts/DownloadContext';
import { PlatformIcon } from '@/components/PlatformIcon';
import { LinearGradient } from '@/components/LinearGradient';

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
      
      {/* Header with gradient */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Preview</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Thumbnail with floating badge */}
        <View style={styles.thumbnailWrapper}>
          <View style={[styles.thumbnailContainer, { backgroundColor: theme.card }]}>
            <Image
              source={{ uri: mediaInfo.thumbnail }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={28} color="#FF6B6B" style={{ marginLeft: 4 }} />
              </View>
            </View>
            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={14} color="#FFFFFF" />
              <Text style={styles.durationText}>{mediaInfo.duration}</Text>
            </View>
          </View>
        </View>

        {/* Platform badge */}
        <View style={styles.platformContainer}>
          <View style={[styles.platformBadge, { backgroundColor: theme.card }]}>
            <PlatformIcon platform={mediaInfo.platform} size={24} />
            <Text style={[styles.platformName, { color: theme.text }]}>
              {mediaInfo.platform.charAt(0).toUpperCase() + mediaInfo.platform.slice(1)}
            </Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={3}>
            {mediaInfo.title}
          </Text>
        </View>

        {/* Stats cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#FF6B6B15' }]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="videocam" size={28} color="#FF6B6B" />
            </View>
            <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
              {mediaInfo.qualities.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Video Qualities
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#4ECDC415' }]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="musical-notes" size={28} color="#4ECDC4" />
            </View>
            <Text style={[styles.statValue, { color: '#4ECDC4' }]}>
              {mediaInfo.audioFormats.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Audio Formats
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFE66D15' }]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time" size={28} color="#FFB800" />
            </View>
            <Text style={[styles.statValue, { color: '#FFB800' }]}>
              {mediaInfo.duration}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Duration
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/quality')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isDark ? ['#4ECDC4', '#3AAFA9'] : ['#FF6B6B', '#EE5A6F']}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryButtonText}>Choose Quality</Text>
              <View style={styles.primaryButtonIcon}>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.card }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
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
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  thumbnailWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  thumbnailContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  platformContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  platformName: {
    fontSize: 15,
    fontWeight: '700',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  primaryButton: {
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#FF6B6B',
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
  primaryButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
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
