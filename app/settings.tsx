import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import * as FileSystem from 'expo-file-system';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const cacheDir = FileSystem.cacheDirectory;
              if (cacheDir) {
                const files = await FileSystem.readDirectoryAsync(cacheDir);
                await Promise.all(
                  files.map(file => FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true }))
                );
              }
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.profileName, { color: theme.text }]}>SuperApp User</Text>
          <Text style={[styles.profileSubtext, { color: theme.textSecondary }]}>
            Download from 1000+ sites
          </Text>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            APPEARANCE
          </Text>
          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FFE66D20' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={24} color="#FFB800" />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Dark Mode</Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  {isDark ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#E8E8E8', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Storage Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            STORAGE
          </Text>
          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: theme.card }]}
            onPress={handleClearCache}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FF6B6B20' }]}>
                <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Clear Cache</Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  Free up storage space
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            ABOUT
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#4ECDC420' }]}>
                <Text style={styles.settingEmoji}>ℹ️</Text>
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Version</Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  1.0.0
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: theme.card }]}
            onPress={() => Alert.alert('Privacy Policy', 'Your privacy is important to us. We do not collect or store any personal data.')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#9B59B620' }]}>
                <Text style={styles.settingEmoji}>🔒</Text>
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Privacy Policy</Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  How we protect your data
                </Text>
              </View>
            </View>
            <Text style={[styles.arrow, { color: theme.textSecondary }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: theme.card }]}
            onPress={() => Alert.alert('Terms of Service', 'By using this app, you agree to download content only from sources where you have the right to do so.')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#51CF6620' }]}>
                <Text style={styles.settingEmoji}>📄</Text>
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Terms of Service</Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  Usage guidelines
                </Text>
              </View>
            </View>
            <Text style={[styles.arrow, { color: theme.textSecondary }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.footerCard, { backgroundColor: theme.card }]}>
            <Text style={styles.footerEmoji}>❤️</Text>
            <Text style={[styles.footerText, { color: theme.text }]}>
              SuperApp © 2026
            </Text>
            <Text style={[styles.footerSubtext, { color: theme.textSecondary }]}>
              Made with love for creators
            </Text>
          </View>
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
  backIcon: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    margin: 20,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileEmoji: {
    fontSize: 40,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  profileSubtext: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 1.2,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingEmoji: {
    fontSize: 24,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  arrow: {
    fontSize: 22,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  footerCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  footerEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 13,
    fontWeight: '500',
  },
});
