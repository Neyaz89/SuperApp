import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useDownload } from '@/contexts/DownloadContext';
import { LinearGradient } from '@/components/LinearGradient';
import { Ionicons } from '@expo/vector-icons';

type MediaType = 'video' | 'audio';

export default function QualityScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { mediaInfo, setSelectedQuality } = useDownload();
  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scaleAnim = new Animated.Value(0);
  const bounceAnim = new Animated.Value(1);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedIndex]);

  if (!mediaInfo) {
    router.replace('/');
    return null;
  }

  const currentOptions = mediaType === 'video' ? mediaInfo.qualities : mediaInfo.audioFormats;

  if (!currentOptions || currentOptions.length === 0) {
    return (
      <LinearGradient colors={['#FF6B9D', '#C44569', '#8B2E5F']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>✨ Pick Quality ✨</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>😢</Text>
            <Text style={styles.emptyText}>
              No {mediaType} formats available
            </Text>
            <TouchableOpacity
              style={styles.switchEmptyButton}
              onPress={() => setMediaType(mediaType === 'video' ? 'audio' : 'video')}
              activeOpacity={0.8}
            >
              <Text style={styles.switchEmptyButtonText}>
                Try {mediaType === 'video' ? '🎵 Audio' : '🎬 Video'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  const safeSelectedIndex = Math.min(selectedIndex, currentOptions.length - 1);

  const handleDownload = () => {
    if (!currentOptions || currentOptions.length === 0) return;
    const selected = currentOptions[safeSelectedIndex];
    if (!selected) return;
    
    setSelectedQuality({
      ...selected,
      type: mediaType,
    });
    router.push('/download');
  };

  return (
    <LinearGradient colors={['#FF6B9D', '#C44569', '#8B2E5F']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>✨ Pick Quality ✨</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.toggleContainer, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              mediaType === 'video' && styles.toggleButtonActive,
            ]}
            onPress={() => {
              setMediaType('video');
              setSelectedIndex(0);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleEmoji, mediaType === 'video' && styles.toggleEmojiActive]}>
              🎬
            </Text>
            <Text style={[styles.toggleText, mediaType === 'video' && styles.toggleTextActive]}>
              Video
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              mediaType === 'audio' && styles.toggleButtonActive,
            ]}
            onPress={() => {
              setMediaType('audio');
              setSelectedIndex(0);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleEmoji, mediaType === 'audio' && styles.toggleEmojiActive]}>
              🎵
            </Text>
            <Text style={[styles.toggleText, mediaType === 'audio' && styles.toggleTextActive]}>
              Audio
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>
            Pick your vibe! 🔥
          </Text>

          {currentOptions.map((option, index) => (
            <Animated.View
              key={index}
              style={{
                transform: [{ scale: selectedIndex === index ? bounceAnim : 1 }],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  selectedIndex === index && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedIndex(index)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View style={[
                    styles.qualityBadge,
                    selectedIndex === index && styles.qualityBadgeSelected,
                  ]}>
                    <Text style={styles.qualityEmoji}>
                      {option.quality.includes('1080') ? '🌟' : 
                       option.quality.includes('720') ? '⭐' : 
                       option.quality.includes('480') ? '✨' : '💫'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.qualityText}>{option.quality}</Text>
                    <Text style={styles.formatText}>
                      {option.format.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.optionRight}>
                  <View style={styles.sizeBadge}>
                    <Text style={styles.sizeText}>📦 {option.size}</Text>
                  </View>
                  {selectedIndex === index && (
                    <Ionicons name="checkmark-circle" size={32} color="#FFD93D" />
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownload}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#FFD93D', '#FFA500', '#FF6B35']} style={styles.downloadGradient}>
            <Ionicons name="download" size={28} color="#FFF" />
            <Text style={styles.downloadButtonText}>
              🚀 Download {currentOptions[safeSelectedIndex]?.quality || 'Now'}!
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
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
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FFD93D',
  },
  toggleEmoji: {
    fontSize: 20,
    opacity: 0.6,
  },
  toggleEmojiActive: {
    opacity: 1,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    opacity: 0.6,
  },
  toggleTextActive: {
    color: '#2C3E50',
    opacity: 1,
  },
  optionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  optionCardSelected: {
    backgroundColor: '#FFD93D',
    transform: [{ scale: 1.02 }],
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  qualityBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityBadgeSelected: {
    backgroundColor: '#FFF',
  },
  qualityEmoji: {
    fontSize: 24,
  },
  qualityText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 2,
  },
  formatText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  optionRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  sizeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  sizeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C3E50',
  },
  downloadButton: {
    margin: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  downloadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  downloadButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  switchEmptyButton: {
    backgroundColor: '#FFD93D',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  switchEmptyButtonText: {
    color: '#2C3E50',
    fontSize: 18,
    fontWeight: '800',
  },
});
