import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameWrapper } from '@/components/GameWrapper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SIZE = (SCREEN_WIDTH - 80) / 4;

const EMOJIS = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎻'];

type Card = {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
};

export default function MemoryMatchGame() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  
  const flipAnimations = useRef<{ [key: number]: Animated.Value }>({});
  const matchAnimations = useRef<{ [key: number]: Animated.Value }>({});
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (gameStarted && matches < 8) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, matches]);

  useEffect(() => {
    if (matches === 8 && gameStarted) {
      if (!bestTime || timer < bestTime) {
        setBestTime(timer);
      }
    }
  }, [matches]);

  const initializeGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTimer(0);
    setGameStarted(false);
    flipAnimations.current = {};
    matchAnimations.current = {};
  };

  const flipCard = (cardId: number) => {
    if (!gameStarted) setGameStarted(true);
    
    if (flippedCards.length === 2) return;
    if (flippedCards.includes(cardId)) return;
    if (cards[cardId].isMatched) return;

    // Initialize animation if not exists
    if (!flipAnimations.current[cardId]) {
      flipAnimations.current[cardId] = new Animated.Value(0);
    }

    // Flip animation
    Animated.spring(flipAnimations.current[cardId], {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        // Match found!
        setMatches(prev => prev + 1);
        
        setTimeout(() => {
          setCards(prev => prev.map((card, idx) => 
            idx === first || idx === second ? { ...card, isMatched: true } : card
          ));
          
          // Match animation
          [first, second].forEach(id => {
            if (!matchAnimations.current[id]) {
              matchAnimations.current[id] = new Animated.Value(1);
            }
            
            Animated.sequence([
              Animated.timing(matchAnimations.current[id], {
                toValue: 1.2,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(matchAnimations.current[id], {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
          });
          
          setFlippedCards([]);
        }, 500);
      } else {
        // No match - flip back
        setTimeout(() => {
          [first, second].forEach(id => {
            Animated.spring(flipAnimations.current[id], {
              toValue: 0,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }).start();
          });
          
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCardRotation = (cardId: number) => {
    const anim = flipAnimations.current[cardId] || new Animated.Value(0);
    return anim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });
  };

  const getCardScale = (cardId: number) => {
    return matchAnimations.current[cardId] || new Animated.Value(1);
  };

  return (
    <GameWrapper gameName="Memory Match">
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.decorCircle1, { backgroundColor: '#8B5CF620' }]} />
      <View style={[styles.decorCircle2, { backgroundColor: '#EC489920' }]} />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.text }]}>Memory Match</Text>
        
        <TouchableOpacity
          onPress={initializeGame}
          style={[styles.resetButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="refresh" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Ionicons name="time-outline" size={20} color="#8B5CF6" />
          <Text style={[styles.statValue, { color: theme.text }]}>{formatTime(timer)}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Time</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Ionicons name="hand-left-outline" size={20} color="#3B82F6" />
          <Text style={[styles.statValue, { color: theme.text }]}>{moves}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Moves</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
          <Text style={[styles.statValue, { color: theme.text }]}>{matches}/8</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Matches</Text>
        </View>
      </View>

      {bestTime && (
        <View style={[styles.bestTimeCard, { backgroundColor: theme.card }]}>
          <Ionicons name="trophy" size={20} color="#F59E0B" />
          <Text style={[styles.bestTimeText, { color: theme.text }]}>
            Best Time: {formatTime(bestTime)}
          </Text>
        </View>
      )}

      {/* Game Board */}
      <View style={styles.boardContainer}>
        <View style={styles.board}>
          {cards.map((card) => {
            const isFlipped = flippedCards.includes(card.id) || card.isMatched;
            const rotation = getCardRotation(card.id);
            const scale = getCardScale(card.id);
            
            return (
              <TouchableOpacity
                key={card.id}
                onPress={() => flipCard(card.id)}
                activeOpacity={0.8}
                disabled={isFlipped || flippedCards.length === 2}
              >
                <Animated.View
                  style={[
                    styles.card,
                    {
                      width: CARD_SIZE,
                      height: CARD_SIZE,
                      transform: [{ rotateY: rotation }, { scale }],
                    },
                  ]}
                >
                  {/* Card Back */}
                  <Animated.View
                    style={[
                      styles.cardFace,
                      styles.cardBack,
                      {
                        opacity: isFlipped ? 0 : 1,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      style={styles.cardGradient}
                    >
                      <Ionicons name="help" size={CARD_SIZE * 0.4} color="#FFFFFF" />
                    </LinearGradient>
                  </Animated.View>

                  {/* Card Front */}
                  <Animated.View
                    style={[
                      styles.cardFace,
                      styles.cardFront,
                      {
                        backgroundColor: card.isMatched ? '#10B98120' : theme.card,
                        opacity: isFlipped ? 1 : 0,
                      },
                    ]}
                  >
                    <Text style={styles.emoji}>{card.emoji}</Text>
                  </Animated.View>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Win Screen */}
      {matches === 8 && (
        <View style={styles.overlay}>
          <View style={[styles.winCard, { backgroundColor: theme.card }]}>
            <Text style={styles.winEmoji}>🎉</Text>
            <Text style={[styles.winTitle, { color: theme.text }]}>You Won!</Text>
            <Text style={[styles.winStats, { color: theme.textSecondary }]}>
              Time: {formatTime(timer)} • Moves: {moves}
            </Text>
            {timer === bestTime && (
              <View style={styles.newRecordBadge}>
                <Ionicons name="trophy" size={20} color="#F59E0B" />
                <Text style={styles.newRecordText}>New Best Time!</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={initializeGame}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.playAgainGradient}
              >
                <Ionicons name="refresh" size={24} color="#FFFFFF" />
                <Text style={styles.playAgainText}>Play Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
    </GameWrapper>
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
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  resetButton: {
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
  stats: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 10,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  bestTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bestTimeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  boardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backfaceVisibility: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardBack: {},
  cardFront: {},
  cardGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  emoji: {
    fontSize: CARD_SIZE * 0.5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  winCard: {
    width: '85%',
    maxWidth: 350,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  winEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  winTitle: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 12,
  },
  winStats: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  newRecordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  newRecordText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '700',
  },
  playAgainButton: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  playAgainGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  playAgainText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
});
