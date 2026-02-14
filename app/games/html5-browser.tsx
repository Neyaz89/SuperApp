import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  HTML5_GAMES, 
  getFeaturedGames, 
  getAllCategories, 
  searchGames, 
  getTotalGamesCount,
  type GameCategory 
} from '@/services/html5GamesService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

export default function HTML5GamesBrowser() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'All' | 'Featured'>('Featured');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['Featured', 'All', ...getAllCategories()];

  const getDisplayedGames = () => {
    if (searchQuery) {
      return searchGames(searchQuery);
    }
    
    if (selectedCategory === 'Featured') {
      return getFeaturedGames();
    }
    
    if (selectedCategory === 'All') {
      return HTML5_GAMES;
    }
    
    return HTML5_GAMES.filter(game => game.category === selectedCategory);
  };

  const displayedGames = getDisplayedGames();

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: any } = {
      'Featured': 'star',
      'All': 'grid',
      'Action': 'flash',
      'Puzzle': 'extension-puzzle',
      'Racing': 'car-sport',
      'Sports': 'football',
      'Adventure': 'map',
      'Arcade': 'game-controller',
      'Strategy': 'trophy',
      'Casual': 'happy',
    };
    return icons[category] || 'game-controller';
  };

  const playGame = (gameId: string) => {
    router.push({
      pathname: 'games/html5-player',
      params: { gameId },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.decorCircle1, { backgroundColor: '#8B5CF620' }]} />
      <View style={[styles.decorCircle2, { backgroundColor: '#3B82F620' }]} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: theme.text }]}>Online Games</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {getTotalGamesCount()}+ Ad-Free Games
          </Text>
        </View>
        
        <View style={{ width: 48 }} />
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: theme.primary + '20' }]}>
        <Ionicons name="information-circle" size={20} color={theme.primary} />
        <Text style={[styles.infoText, { color: theme.primary }]}>
          All games are ad-free & open source
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search games..."
            placeholderTextColor={theme.textSecondary + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => {
          const isSelected = category === selectedCategory;
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                { backgroundColor: isSelected ? theme.primary : theme.card },
              ]}
              onPress={() => setSelectedCategory(category as any)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={getCategoryIcon(category)} 
                size={18} 
                color={isSelected ? '#FFFFFF' : theme.text} 
              />
              <Text
                style={[
                  styles.categoryText,
                  { color: isSelected ? '#FFFFFF' : theme.text },
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Games Grid */}
      <ScrollView 
        style={styles.gamesContainer}
        contentContainerStyle={styles.gamesContent}
        showsVerticalScrollIndicator={false}
      >
        {displayedGames.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No games found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Try a different search or category
            </Text>
          </View>
        ) : (
          <View style={styles.gamesGrid}>
            {displayedGames.map((game) => (
              <TouchableOpacity
                key={game.id}
                style={[styles.gameCard, { backgroundColor: theme.card, width: CARD_WIDTH }]}
                onPress={() => playGame(game.id)}
                activeOpacity={0.8}
              >
                <View style={styles.gameThumbnail}>
                  <LinearGradient
                    colors={['#8B5CF6', '#3B82F6']}
                    style={styles.thumbnailGradient}
                  >
                    <Ionicons name="game-controller" size={40} color="#FFFFFF" />
                  </LinearGradient>
                  {game.featured && (
                    <View style={styles.featuredBadge}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                    </View>
                  )}
                  {game.offline && (
                    <View style={styles.offlineBadge}>
                      <Ionicons name="cloud-offline" size={12} color="#10B981" />
                    </View>
                  )}
                </View>
                
                <View style={styles.gameInfo}>
                  <Text style={[styles.gameTitle, { color: theme.text }]} numberOfLines={2}>
                    {game.title}
                  </Text>
                  <Text style={[styles.gameDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                    {game.description}
                  </Text>
                  
                  <View style={styles.gameStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={[styles.statText, { color: theme.textSecondary }]}>
                        {game.rating}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="play" size={14} color={theme.primary} />
                      <Text style={[styles.statText, { color: theme.textSecondary }]}>
                        {game.plays}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.licenseBadge}>
                    <Text style={[styles.licenseText, { color: theme.textSecondary }]}>
                      {game.license}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorCircle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    top: -100,
    right: -80,
  },
  decorCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    bottom: 100,
    left: -90,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  gamesContainer: {
    flex: 1,
  },
  gamesContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gameCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  gameThumbnail: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    position: 'relative',
  },
  thumbnailGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  offlineBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gameInfo: {
    padding: 12,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 8,
  },
  gameStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  licenseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#10B98120',
  },
  licenseText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
});
