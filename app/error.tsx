import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ErrorScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const errorType = params.type as string || 'extraction';
  const errorMessage = params.message as string || 'Something went wrong';
  const url = params.url as string;

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getErrorContent = () => {
    switch (errorType) {
      case 'extraction':
        return {
          icon: 'alert-circle-outline',
          iconColor: '#F59E0B',
          title: 'Extraction Failed',
          message: 'We couldn\'t extract the video link right now.',
          tips: [
            'The video might be private or deleted',
            'The platform may have changed their system',
            'Try again in a few moments',
          ],
        };
      case 'network':
        return {
          icon: 'cloud-offline-outline',
          iconColor: '#EF4444',
          title: 'Connection Issue',
          message: 'Unable to reach the server.',
          tips: [
            'Check your internet connection',
            'Try switching between WiFi and mobile data',
            'The server might be temporarily down',
          ],
        };
      case 'unsupported':
        return {
          icon: 'ban-outline',
          iconColor: '#8B5CF6',
          title: 'Unsupported Link',
          message: 'This link is not supported yet.',
          tips: [
            'Make sure you copied the full URL',
            'Check if the link is from a supported platform',
            'Some private or age-restricted content may not work',
          ],
        };
      case 'timeout':
        return {
          icon: 'time-outline',
          iconColor: '#F59E0B',
          title: 'Request Timeout',
          message: 'The request took too long to complete.',
          tips: [
            'The server might be busy',
            'Try again in a few moments',
            'Check your internet speed',
          ],
        };
      default:
        return {
          icon: 'alert-circle-outline',
          iconColor: '#EF4444',
          title: 'Something Went Wrong',
          message: errorMessage,
          tips: [
            'This happens sometimes, don\'t worry',
            'Try again in a few moments',
            'Contact support if the issue persists',
          ],
        };
    }
  };

  const content = getErrorContent();

  const handleTryAgain = () => {
    if (url) {
      // Go back to homepage with the URL pre-filled
      router.replace('/');
    } else {
      router.back();
    }
  };

  const handleGoHome = () => {
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        translucent
        backgroundColor="transparent"
      />

      {/* Decorative circles */}
      <View style={[styles.decorCircle1, { backgroundColor: content.iconColor + '15' }]} />
      <View style={[styles.decorCircle2, { backgroundColor: content.iconColor + '10' }]} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        {/* Error Icon */}
        <View style={[styles.iconContainer, { backgroundColor: content.iconColor + '20' }]}>
          <Ionicons name={content.icon as any} size={80} color={content.iconColor} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>{content.title}</Text>

        {/* Message */}
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {content.message}
        </Text>

        {/* Tips Card */}
        <View style={[styles.tipsCard, { backgroundColor: theme.card }]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={24} color={content.iconColor} />
            <Text style={[styles.tipsTitle, { color: theme.text }]}>What you can try:</Text>
          </View>
          {content.tips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <View style={[styles.tipDot, { backgroundColor: content.iconColor }]} />
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleTryAgain}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isDark ? ['#8B5CF6', '#7C3AED'] : ['#8B5CF6', '#7C3AED']}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="refresh" size={24} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.card }]}
            onPress={handleGoHome}
            activeOpacity={0.7}
          >
            <Ionicons name="home-outline" size={24} color={theme.primary} />
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Go Home</Text>
          </TouchableOpacity>
        </View>

        {/* Support Text */}
        <Text style={[styles.supportText, { color: theme.textSecondary }]}>
          Still having issues? Most problems resolve themselves after a few minutes.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -100,
    right: -100,
  },
  decorCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    bottom: -50,
    left: -50,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  tipsCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonGradient: {
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
    width: '100%',
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  supportText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});
