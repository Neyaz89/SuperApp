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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MediaType = 'video' | 'audio';

export default function QualityScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { mediaInfo, setSelectedQuality } = useDownload();
  const insets = useSafeAreaInsets();
  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scaleAnim = new Animated.Value(0);
  const bounceAnim = new Animated.Value(1);
  const buttonScaleAnim = new Animated.Value(1);
  const shineAnim = new Animated.Value(0);

  useEffect(() => {
    // Log what we received
    console.log('=== Quality Screen Loaded ===');
    console.log('MediaInfo:', mediaInfo ? {
      title: mediaInfo.title,
      platform: mediaInfo.platform,
      videoQualities: mediaInfo.qualities.length,
      audioFormats: mediaInfo.audioFormats.length
    } : 'NULL');
    
    if (mediaInfo && mediaInfo.qualities.length > 0) {
      console.log('First 3 video qualities:', JSON.stringify(mediaInfo.qualities.slice(0, 3), null, 2));
    }
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Shine animation for button
    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
      ])
    ).start();
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
      <LinearGradient colors={['#8B5CF6', '#A78BFA', '#C4B5FD']} style={styles.container}>
        <StatusBar 
          barStyle="light-content" 
          translucent
          backgroundColor="transparent"
        />
        
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
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
    
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedQuality({
      ...selected,
      type: mediaType,
    });
    router.push('/download');
  };

  const shineTranslate = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const shineOpacity = shineAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.6, 0],
  });

  return (
    <LinearGradient colors={['#8B5CF6', '#A78BFA', '#C4B5FD']} style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        translucent
        backgroundColor="transparent"
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
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
                    <Ionicons name="checkmark-circle" size={32} color="#3B82F6" />
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            style={[styles.downloadButton, { marginBottom: Math.max(insets.bottom + 8, 20) }]}
            onPress={handleDownload}
            activeOpacity={0.85}
          >
            <View style={styles.downloadButtonInner}>
              <View style={styles.downloadIconCircle}>
                <Ionicons name="download" size={32} color="#8B5CF6" />
              </View>
              
              <View style={styles.downloadContent}>
                <Text style={styles.downloadTitle}>Save to Gallery</Text>
                <Text style={styles.downloadSubtitle}>
                  {currentOptions[safeSelectedIndex]?.quality} • {currentOptions[safeSelectedIndex]?.format.toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.downloadCheckCircle}>
                <Ionicons name="arrow-forward" size={24} color="#8B5CF6" />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
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
    backgroundColor: '#60A5FA',
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
    backgroundColor: '#C4B5FD',
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
    backgroundColor: '#8B5CF6',
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
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  downloadButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 16,
  },
  downloadIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadContent: {
    flex: 1,
  },
  downloadTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  downloadSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  downloadCheckCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#60A5FA',
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
