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
  { id: '1', name: 'Tap Reflex', icon: '⚡', tagline: 'Test your reaction speed', route: '/games/tap-reflex' },
  { id: '2', name: 'Endless Runner', icon: '🏃', tagline: 'Run and dodge obstacles', route: '/games/endless-runner' },
  { id: '3', name: '2048', icon: '🎯', tagline: 'Classic puzzle game', route: '/games/game-2048' },
  { id: '4', name: 'Memory Match', icon: '🧠', tagline: 'Find matching pairs', route: '/games/memory-match' },
  { id: '5', name: 'Snake', icon: '🐍', tagline: 'Classic snake game', route: '/games/snake' },
  { id: '6', name: 'Tic Tac Toe', icon: '⭕', tagline: 'Beat the AI', route: '/games/tic-tac-toe' },
  { id: '7', name: 'Bubble Shooter', icon: '🎈', tagline: 'Pop matching bubbles', route: '/games/bubble-shooter' },
  { id: '8', name: 'Quiz Master', icon: '❓', tagline: 'Test your knowledge', route: '/games/quiz' },
  { id: '9', name: 'Color Switch', icon: '🎨', tagline: 'Match the colors fast', route: '/games/color-switch' },
  { id: '10', name: 'Stack Blocks', icon: '📦', tagline: 'Perfect timing game', route: '/games/stack-blocks' },
];

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
