import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useDownload } from '@/contexts/DownloadContext';
import TeraboxWebViewExtractor from '@/components/TeraboxWebViewExtractor';
import { BannerAd } from '@/components/BannerAd';

export default function TeraboxExtractScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { setMediaInfo } = useDownload();
  const params = useLocalSearchParams();
  const url = params.url as string;
  const [isExtracting, setIsExtracting] = useState(true);

  useEffect(() => {
    // Don't show interstitial ad here - it already showed on homepage
    // Showing it again causes the app to go to background and triggers unwanted redirects
  }, []);

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
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeButton, { backgroundColor: theme.primary + '15' }]}
        >
          <Ionicons name="close" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Banner Ad at top */}
      <View style={styles.topAdContainer}>
        <BannerAd size="banner" adUnitId="ca-app-pub-4846583305979583/3193602836" />
      </View>

      {/* WebView Extractor */}
      {url && (
        <TeraboxWebViewExtractor
          url={url}
          onExtractSuccess={handleExtractSuccess}
          onExtractError={handleExtractError}
        />
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
  closeButton: {
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
  topAdContainer: {
    width: '100%',
    backgroundColor: '#F5F5F5',
  },
});
