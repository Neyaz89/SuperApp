import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameWrapper } from '@/components/GameWrapper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BLOCK_HEIGHT = 40;
const INITIAL_BLOCK_WIDTH = 200;

type Block = {
  id: number;
  x: number;
  y: number;
  width: number;
  color: [string, string];
};

const COLORS: [string, string][] = [
  ['#EF4444', '#DC2626'],
  ['#F59E0B', '#D97706'],
  ['#10B981', '#059669'],
  ['#3B82F6', '#2563EB'],
  ['#8B5CF6', '#7C3AED'],
  ['#EC4899', '#DB2777'],
];

export default function StackBlocksGame() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [direction, setDirection] = useState(1);
  
  const blockX = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<any>(null);

  useEffect(() => {
    if (gameState === 'playing' && currentBlock) {
      startBlockAnimation();
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [currentBlock, gameState]);

  const startBlockAnimation = () => {
    if (!currentBlock) return;

    const animate = () => {
      Animated.timing(blockX, {
        toValue: direction > 0 ? SCREEN_WIDTH - currentBlock.width : 0,
        duration: 2000 - score * 50, // Speed increases with score
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && gameState === 'playing') {
          setDirection(prev => -prev);
          animate();
        }
      });
    };

    animate();
  };

  const startGame = () => {
    const firstBlock: Block = {
      id: 0,
      x: SCREEN_WIDTH / 2 - INITIAL_BLOCK_WIDTH / 2,
      y: 500,
      width: INITIAL_BLOCK_WIDTH,
      color: COLORS[0],
    };

    setBlocks([firstBlock]);
    setScore(0);
    setGameState('playing');
    spawnNewBlock(firstBlock);
  };

  const spawnNewBlock = (previousBlock: Block) => {
    const newBlock: Block = {
      id: previousBlock.id + 1,
      x: 0,
      y: previousBlock.y - BLOCK_HEIGHT - 5,
      width: previousBlock.width,
      color: COLORS[previousBlock.id % COLORS.length],
    };

    setCurrentBlock(newBlock);
    blockX.setValue(0);
  };

  const dropBlock = () => {
    if (!currentBlock || gameState !== 'playing') return;

    let currentX = 0;
    blockX.stopAnimation((value) => {
      currentX = value;
    });

    const lastBlock = blocks[blocks.length - 1];
    const overlap = calculateOverlap(currentX, currentBlock.width, lastBlock.x, lastBlock.width);

    if (overlap <= 0) {
      // Game over - no overlap
      endGame();
      return;
    }

    // Calculate new block dimensions
    const newX = Math.max(currentX, lastBlock.x);
    const newWidth = overlap;

    const placedBlock: Block = {
      ...currentBlock,
      x: newX,
      width: newWidth,
    };

    setBlocks(prev => [...prev, placedBlock]);
    setScore(prev => prev + 1);

    // Check if perfect placement
    if (Math.abs(currentX - lastBlock.x) < 5) {
      // Perfect! Bonus points
      setScore(prev => prev + 5);
    }

    // Spawn next block
    if (newWidth > 20) {
      spawnNewBlock(placedBlock);
    } else {
      endGame();
    }
  };

  const calculateOverlap = (x1: number, w1: number, x2: number, w2: number): number => {
    const left = Math.max(x1, x2);
    const right = Math.min(x1 + w1, x2 + w2);
    return Math.max(0, right - left);
  };

  const endGame = () => {
    setGameState('gameover');
    if (score > highScore) setHighScore(score);
    setCurrentBlock(null);
    if (animationRef.current) {
      animationRef.current.stop();
    }
  };

  return (
    <GameWrapper gameName="Stack Blocks">
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.decorCircle1, { backgroundColor: '#3B82F620' }]} />
      <View style={[styles.decorCircle2, { backgroundColor: '#10B98120' }]} />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.text }]}>Stack Blocks</Text>
        
        <View style={{ width: 48 }} />
      </View>

      {gameState === 'playing' && (
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreText, { color: theme.text }]}>{score}</Text>
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>blocks</Text>
        </View>
      )}

      {/* Game Area */}
      <TouchableOpacity 
        style={styles.gameArea}
        activeOpacity={1}
        onPress={dropBlock}
        disabled={gameState !== 'playing'}
      >
        {/* Stacked Blocks */}
        {blocks.map((block, index) => (
          <Animated.View
            key={block.id}
            style={[
              styles.block,
              {
                left: block.x,
                bottom: 100 + index * (BLOCK_HEIGHT + 5),
                width: block.width,
                height: BLOCK_HEIGHT,
              },
            ]}
          >
            <LinearGradient
              colors={block.color}
              style={styles.blockGradient}
            />
          </Animated.View>
        ))}

        {/* Current Moving Block */}
        {currentBlock && gameState === 'playing' && (
          <Animated.View
            style={[
              styles.block,
              {
                left: blockX,
                bottom: 100 + blocks.length * (BLOCK_HEIGHT + 5),
                width: currentBlock.width,
                height: BLOCK_HEIGHT,
              },
            ]}
          >
            <LinearGradient
              colors={currentBlock.color}
              style={styles.blockGradient}
            />
          </Animated.View>
        )}

        {/* Base Platform */}
        <View style={[styles.platform, { backgroundColor: theme.card }]}>
          <View style={styles.platformLine} />
        </View>
      </TouchableOpacity>

      {gameState === 'playing' && (
        <View style={styles.tapHint}>
          <Ionicons name="hand-left" size={24} color={theme.primary} />
          <Text style={[styles.tapHintText, { color: theme.text }]}>
            Tap to drop block
          </Text>
        </View>
      )}

      {/* Start / Game Over Screen */}
      {(gameState === 'ready' || gameState === 'gameover') && (
        <View style={styles.overlay}>
          <View style={[styles.overlayCard, { backgroundColor: theme.card }]}>
            <Text style={styles.overlayEmoji}>
              {gameState === 'ready' ? '🏗️' : '📦'}
            </Text>
            <Text style={[styles.overlayTitle, { color: theme.text }]}>
              {gameState === 'ready' ? 'Stack Blocks' : 'Tower Collapsed!'}
            </Text>
            
            {gameState === 'gameover' && (
              <>
                <Text style={[styles.finalScore, { color: theme.text }]}>
                  {score} blocks
                </Text>
                {score === highScore && score > 0 && (
                  <View style={styles.newRecordBadge}>
                    <Ionicons name="trophy" size={20} color="#F59E0B" />
                    <Text style={styles.newRecordText}>New High Score!</Text>
                  </View>
                )}
              </>
            )}

            {highScore > 0 && (
              <View style={styles.highScoreContainer}>
                <Ionicons name="trophy" size={20} color="#F59E0B" />
                <Text style={[styles.highScoreText, { color: theme.textSecondary }]}>
                  Best: {highScore} blocks
                </Text>
              </View>
            )}

            <Text style={[styles.instructions, { color: theme.textSecondary }]}>
              {gameState === 'ready' 
                ? 'Tap to drop blocks and build the tallest tower!\nAlign perfectly for bonus points!'
                : 'Keep practicing to build higher!'}
            </Text>

            <TouchableOpacity
              style={styles.startButton}
              onPress={startGame}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.startButtonGradient}
              >
                <Ionicons name="play" size={24} color="#FFFFFF" />
                <Text style={styles.startButtonText}>
                  {gameState === 'ready' ? 'Start Building' : 'Build Again'}
                </Text>
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
  scoreBox: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  block: {
    position: 'absolute',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  blockGradient: {
    flex: 1,
  },
  platform: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  platformLine: {
    width: '90%',
    height: 2,
    backgroundColor: '#00000020',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'center',
    marginBottom: 40,
  },
  tapHintText: {
    fontSize: 16,
    fontWeight: '700',
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
  overlayCard: {
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
  overlayEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  overlayTitle: {
    fontSize: 32,
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
  highScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  highScoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startButton: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
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
});
