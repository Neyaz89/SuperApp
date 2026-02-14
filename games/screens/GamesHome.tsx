import React from 'react';
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
import { BannerAd } from '@/components/BannerAd';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Game = {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  route: string;
};

const GAMES: Game[] = [
  { id: '3', name: '2048', icon: '🎯', tagline: 'Classic puzzle game', route: 'games/game-2048' },
  { id: '4', name: 'Memory Match', icon: '🧠', tagline: 'Find matching pairs', route: 'games/memory-match' },
  { id: '5', name: 'Snake', icon: '🐍', tagline: 'Classic snake game', route: 'games/snake' },
  { id: '6', name: 'Tic Tac Toe', icon: '⭕', tagline: 'Beat the AI', route: 'games/tic-tac-toe' },
  { id: '8', name: 'Quiz Master', icon: '❓', tagline: 'Test your knowledge', route: 'games/quiz' },
  { id: '10', name: 'Stack Blocks', icon: '📦', tagline: 'Perfect timing game', route: 'games/stack-blocks' },
];

const HTML5_FEATURED = {
  id: 'html5',
  name: 'Online Games',
  icon: '🎮',
  tagline: '24 Premium Ad-Free Games',
  route: 'games/html5-browser' as const,
};

export default function GamesHome() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        translucent
        backgroundColor="transparent"
      />
      
      <View style={[styles.header, { 
        borderBottomColor: theme.border,
        paddingTop: insets.top + 20
      }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Games</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Play & Earn Rewards
        </Text>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
        showsVerticalScrollIndicator={false}
      >
        {/* HTML5 Games Featured Card */}
        <TouchableOpacity
          style={[styles.featuredCard, { backgroundColor: theme.primary }]}
          onPress={() => router.push(HTML5_FEATURED.route as any)}
          activeOpacity={0.8}
        >
          <View style={styles.featuredContent}>
            <Text style={styles.featuredIcon}>{HTML5_FEATURED.icon}</Text>
            <View style={styles.featuredText}>
              <Text style={styles.featuredName}>{HTML5_FEATURED.name}</Text>
              <Text style={styles.featuredTagline}>{HTML5_FEATURED.tagline}</Text>
            </View>
          </View>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>NEW</Text>
          </View>
        </TouchableOpacity>

        {/* Built-in Games Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Built-in Games</Text>
        </View>

        <View style={styles.grid}>
          {GAMES.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[styles.gameCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push(game.route as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.gameIcon}>{game.icon}</Text>
              <Text style={[styles.gameName, { color: theme.text }]}>{game.name}</Text>
              <Text style={[styles.gameTagline, { color: theme.textSecondary }]}>
                {game.tagline}
              </Text>
              <View style={[styles.playButton, { backgroundColor: theme.primary }]}>
                <Text style={styles.playButtonText}>Play</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <BannerAd />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  featuredCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featuredIcon: {
    fontSize: 56,
    marginRight: 16,
  },
  featuredText: {
    flex: 1,
  },
  featuredName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featuredTagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  featuredBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featuredBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#8B5CF6',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  gameCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  gameIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  gameTagline: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  playButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
