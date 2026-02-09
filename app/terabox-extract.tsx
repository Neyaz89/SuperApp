import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useDownload } from '@/contexts/DownloadContext';
import TeraboxWebViewExtractor from '@/components/TeraboxWebViewExtractor';

export default function TeraboxExtractScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { setMediaInfo } = useDownload();
  const params = useLocalSearchParams();
  const url = params.url as string;
  const [isExtracting, setIsExtracting] = useState(true);

  const handleExtractSuccess = (data: {
    title: string;
    downloadUrl: string;
    size: number;
    thumbnail?: string;
  }) => {
    console.log('✅ Terabox extraction successful:', data);
    setIsExtracting(false);

    // Format size
    const sizeMB = data.size > 0 ? (data.size / (1024 * 1024)).toFixed(2) : 'Unknown';

    // Update media info with extracted data
    setMediaInfo({
      url: url,
      title: data.title,
      thumbnail: data.thumbnail || 'https://via.placeholder.com/640x360',
      duration: '0:00',
      qualities: [
        {
          quality: 'Original',
          format: data.title.split('.').pop() || 'mp4',
          size: sizeMB === 'Unknown' ? 'Unknown' : `${sizeMB} MB`,
          url: data.downloadUrl,
          hasAudio: true,
          hasVideo: true,
        } as any,
      ],
      audioFormats: [],
      platform: 'terabox',
    });

    // Navigate to preview screen
    router.replace('/preview');
  };

  const handleExtractError = (error: string) => {
    console.error('❌ Terabox extraction failed:', error);
    setIsExtracting(false);

    Alert.alert(
      'Extraction Failed',
      error || 'Could not extract download link from Terabox. Please try again.',
      [
        {
          text: 'Try Again',
          onPress: () => {
            setIsExtracting(true);
            // Reload the screen
            router.replace(`/terabox-extract?url=${encodeURIComponent(url)}`);
          },
        },
        {
          text: 'Go Back',
          onPress: () => router.back(),
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.primary + '15' }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Terabox Extraction</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* WebView Extractor */}
      {url && (
        <TeraboxWebViewExtractor
          url={url}
          onExtractSuccess={handleExtractSuccess}
          onExtractError={handleExtractError}
        />
      )}

      {/* Cancel button */}
      {isExtracting && (
        <View style={styles.cancelContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.card }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
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
  cancelContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
