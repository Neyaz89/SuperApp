import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from './LinearGradient';
import { useTheme } from '@/contexts/ThemeContext';

type PermissionDialogProps = {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
};

export function PermissionDialog({ visible, onAllow, onDeny }: PermissionDialogProps) {
  const { theme, isDark } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: fadeAnim },
        ]}
      >
        <Animated.View
          style={[
            styles.dialogContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={[styles.dialog, { backgroundColor: theme.card }]}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: '#A78BFA20' }]}>
              <View style={[styles.iconInner, { backgroundColor: '#A78BFA30' }]}>
                <Ionicons name="images" size={48} color="#A78BFA" />
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.text }]}>
              Gallery Access
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              SuperHub needs access to your gallery to save media files. Your privacy is important to us.
            </Text>

            {/* Features */}
            <View style={styles.features}>
              <View style={styles.feature}>
                <View style={[styles.featureIcon, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="checkmark" size={16} color="#10B981" />
                </View>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  Save media to your device
                </Text>
              </View>
              <View style={styles.feature}>
                <View style={[styles.featureIcon, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="checkmark" size={16} color="#10B981" />
                </View>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  Organize in albums
                </Text>
              </View>
              <View style={styles.feature}>
                <View style={[styles.featureIcon, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="checkmark" size={16} color="#10B981" />
                </View>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  Access anytime, anywhere
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.allowButton}
                onPress={onAllow}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isDark ? ['#C4B5FD', '#A78BFA'] : ['#A78BFA', '#8B5CF6']}
                  style={styles.allowGradient}
                >
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.allowButtonText}>Allow Access</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.denyButton, { backgroundColor: theme.background }]}
                onPress={onDeny}
                activeOpacity={0.7}
              >
                <Text style={[styles.denyButtonText, { color: theme.textSecondary }]}>
                  Not Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
  },
  dialog: {
    borderRadius: 32,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  features: {
    marginBottom: 28,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  buttons: {
    gap: 12,
  },
  allowButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  allowGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  denyButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  denyButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
