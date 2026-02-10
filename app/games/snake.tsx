import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameWrapper } from '@/components/GameWrapper';

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 15;
const CELL_SIZE = 22;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SnakeGame() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [snake, setSnake] = useState<Position[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Position>({ x: 10, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const foodPulse = useRef(new Animated.Value(1)).current;
  const scoreAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Food pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(foodPulse, {
          toValue: 1.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(foodPulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      const speed = Math.max(80, 150 - Math.floor(score / 50) * 10);
      gameLoopRef.current = setInterval(moveSnake, speed);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, snake, nextDirection, score]);

  const moveSnake = () => {
    setDirection(nextDirection);
    
    setSnake(prev => {
      const head = prev[0];
      let newHead: Position;

      switch (nextDirection) {
        case 'UP': newHead = { x: head.x, y: head.y - 1 }; break;
        case 'DOWN': newHead = { x: head.x, y: head.y + 1 }; break;
        case 'LEFT': newHead = { x: head.x - 1, y: head.y }; break;
        case 'RIGHT': newHead = { x: head.x + 1, y: head.y }; break;
      }

      // Check collision with walls
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameState('gameover');
        if (score > highScore) setHighScore(score);
        return prev;
      }

      // Check collision with self
      if (prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameState('gameover');
        if (score > highScore) setHighScore(score);
        return prev;
      }

      const newSnake = [newHead, ...prev];
      
      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        
        // Score animation
        Animated.sequence([
          Animated.timing(scoreAnim, {
            toValue: 1.3,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scoreAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Generate new food position
        let newFood: Position;
        do {
          newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
          };
        } while (newSnake.some(s => s.x === newFood.x && s.y === newFood.y));
        
        setFood(newFood);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  };

  const startGame = () => {
    setSnake([{ x: 7, y: 7 }]);
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setFood({ x: 10, y: 10 });
    setGameState('playing');
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleDirectionChange = (newDir: Direction) => {
    // Prevent 180-degree turns
    if (
      (direction === 'UP' && newDir === 'DOWN') ||
      (direction === 'DOWN' && newDir === 'UP') ||
      (direction === 'LEFT' && newDir === 'RIGHT') ||
      (direction === 'RIGHT' && newDir === 'LEFT')
    ) {
      return;
    }
    setNextDirection(newDir);
  };

  const getSnakeSegmentStyle = (index: number) => {
    const isHead = index === 0;
    const opacity = 1 - (index / snake.length) * 0.3;
    
    return {
      backgroundColor: isHead ? '#10B981' : '#34D399',
      opacity,
      borderRadius: isHead ? 4 : 2,
      transform: [{ scale: isHead ? 1 : 0.9 }],
    };
  };

  return (
    <GameWrapper gameName="Snake" showBanner={false}>
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        translucent
        backgroundColor="transparent"
      />

      {/* Decorative background */}
      <View style={[styles.decorCircle1, { backgroundColor: '#10B98120' }]} />
      <View style={[styles.decorCircle2, { backgroundColor: '#F59E0B20' }]} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        
        <View style={styles.scoreContainer}>
          <Animated.View style={{ transform: [{ scale: scoreAnim }] }}>
            <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Score</Text>
            <Text style={[styles.scoreValue, { color: theme.text }]}>{score}</Text>
          </Animated.View>
          {highScore > 0 && (
            <View style={styles.highScoreContainer}>
              <Ionicons name="trophy" size={16} color="#F59E0B" />
              <Text style={[styles.highScoreText, { color: theme.textSecondary }]}>{highScore}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Game Board */}
      <View style={styles.gameContainer}>
        <View style={[styles.gridContainer, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
          {/* Grid lines */}
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <View
              key={`v-${i}`}
              style={[
                styles.gridLine,
                {
                  left: i * CELL_SIZE,
                  width: 1,
                  height: GRID_SIZE * CELL_SIZE,
                  backgroundColor: isDark ? '#374151' : '#E5E7EB',
                },
              ]}
            />
          ))}
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <View
              key={`h-${i}`}
              style={[
                styles.gridLine,
                {
                  top: i * CELL_SIZE,
                  height: 1,
                  width: GRID_SIZE * CELL_SIZE,
                  backgroundColor: isDark ? '#374151' : '#E5E7EB',
                },
              ]}
            />
          ))}

          {/* Food */}
          <Animated.View
            style={[
              styles.food,
              {
                left: food.x * CELL_SIZE + 2,
                top: food.y * CELL_SIZE + 2,
                transform: [{ scale: foodPulse }],
              },
            ]}
          >
            <LinearGradient
              colors={['#F59E0B', '#EF4444']}
              style={styles.foodGradient}
            />
          </Animated.View>

          {/* Snake */}
          {snake.map((segment, index) => (
            <View
              key={`${segment.x}-${segment.y}-${index}`}
              style={[
                styles.snakeSegment,
                {
                  left: segment.x * CELL_SIZE + 2,
                  top: segment.y * CELL_SIZE + 2,
                },
                getSnakeSegmentStyle(index),
              ]}
            >
              {index === 0 && (
                <View style={styles.snakeEyes}>
                  <View style={styles.eye} />
                  <View style={styles.eye} />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Game Over / Start Overlay */}
      {gameState !== 'playing' && (
        <View style={styles.overlay}>
          <Animated.View style={[styles.overlayContent, { transform: [{ scale: scaleAnim }] }]}>
            <View style={[styles.overlayCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.title, { color: theme.text }]}>
                {gameState === 'ready' ? '🐍 Snake Game' : '💀 Game Over!'}
              </Text>
              
              {gameState === 'gameover' && (
                <>
                  <Text style={[styles.finalScore, { color: theme.text }]}>Score: {score}</Text>
                  {score === highScore && score > 0 && (
                    <View style={styles.newRecordBadge}>
                      <Ionicons name="trophy" size={20} color="#F59E0B" />
                      <Text style={styles.newRecordText}>New Record!</Text>
                    </View>
                  )}
                </>
              )}

              <Text style={[styles.instructions, { color: theme.textSecondary }]}>
                {gameState === 'ready' 
                  ? 'Eat the food and grow longer!\nDon\'t hit the walls or yourself.'
                  : 'Try to beat your high score!'}
              </Text>

              <TouchableOpacity
                style={styles.startButton}
                onPress={startGame}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.startButtonGradient}
                >
                  <Ionicons name="play" size={24} color="#FFFFFF" />
                  <Text style={styles.startButtonText}>
                    {gameState === 'ready' ? 'Start Game' : 'Play Again'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}

      {/* Controls */}
      {gameState === 'playing' && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: theme.card }]}
            onPress={() => handleDirectionChange('UP')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-up" size={32} color={theme.primary} />
          </TouchableOpacity>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: theme.card }]}
              onPress={() => handleDirectionChange('LEFT')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={32} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: theme.card }]}
              onPress={() => handleDirectionChange('DOWN')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-down" size={32} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: theme.card }]}
              onPress={() => handleDirectionChange('RIGHT')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={32} color={theme.primary} />
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
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  highScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  highScoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    width: GRID_SIZE * CELL_SIZE,
    height: GRID_SIZE * CELL_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
  },
  snakeSegment: {
    position: 'absolute',
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  snakeEyes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  eye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFF',
  },
  food: {
    position: 'absolute',
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    borderRadius: (CELL_SIZE - 4) / 2,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  foodGradient: {
    flex: 1,
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
  overlayContent: {
    width: '90%',
    maxWidth: 400,
  },
  overlayCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
  },
  finalScore: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  newRecordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  newRecordText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '700',
  },
  instructions: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  startButton: {
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
  startButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  controls: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 20,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  controlBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
});
