import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useDownload } from '@/contexts/DownloadContext';

type MediaType = 'video' | 'audio';

export default function QualityScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { mediaInfo, setSelectedQuality } = useDownload();
  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!mediaInfo) {
    router.replace('/');
    return null;
  }

  const currentOptions = mediaType === 'video' ? mediaInfo.qualities : mediaInfo.audioFormats;

  // Validate current options exist
  if (!currentOptions || currentOptions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Select Quality</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No {mediaType} formats available
            </Text>
            <TouchableOpacity
              style={[styles.switchButton, { backgroundColor: theme.primary }]}
              onPress={() => setMediaType(mediaType === 'video' ? 'audio' : 'video')}
            >
              <Text style={styles.switchButtonText}>
                Try {mediaType === 'video' ? 'Audio' : 'Video'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Ensure selectedIndex is valid
  const safeSelectedIndex = Math.min(selectedIndex, currentOptions.length - 1);

  const handleDownload = () => {
    if (!currentOptions || currentOptions.length === 0) {
      return;
    }
    const selected = currentOptions[safeSelectedIndex];
    if (!selected) {
      return;
    }
    setSelectedQuality({
      ...selected,
      type: mediaType,
    });
    router.push('/download');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Select Quality</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.toggleContainer, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              mediaType === 'video' && { backgroundColor: theme.primary },
            ]}
            onPress={() => {
              setMediaType('video');
              setSelectedIndex(0);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                { color: mediaType === 'video' ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              Video
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              mediaType === 'audio' && { backgroundColor: theme.primary },
            ]}
            onPress={() => {
              setMediaType('audio');
              setSelectedIndex(0);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                { color: mediaType === 'audio' ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              Audio Only
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Available {mediaType === 'video' ? 'Video' : 'Audio'} Qualities
          </Text>

          {currentOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                selectedIndex === index && {
                  borderColor: theme.primary,
                  borderWidth: 2,
                },
              ]}
              onPress={() => setSelectedIndex(index)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.radio,
                    { borderColor: theme.border },
                    safeSelectedIndex === index && {
                      borderColor: theme.primary,
                      backgroundColor: theme.primary,
                    },
                  ]}
                >
                  {safeSelectedIndex === index && <View style={styles.radioInner} />}
                </View>
                <View>
                  <Text style={[styles.qualityText, { color: theme.text }]}>
                    {option.quality}
                  </Text>
                  <Text style={[styles.formatText, { color: theme.textSecondary }]}>
                    {option.format.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={[styles.sizeBadge, { backgroundColor: theme.background }]}>
                <Text style={[styles.sizeText, { color: theme.primary }]}>
                  {option.size}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: theme.primary }]}
            onPress={handleDownload}
            activeOpacity={0.8}
          >
            <Text style={styles.downloadButtonText}>
              Download {currentOptions[safeSelectedIndex]?.quality || 'Video'}
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
  toggleContainer: {
    flexDirection: 'row',
    margin: 20,
    padding: 4,
    borderRadius: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  qualityText: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  formatText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sizeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  downloadButton: {
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
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  switchButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  switchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
