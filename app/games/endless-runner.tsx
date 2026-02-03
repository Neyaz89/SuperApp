import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { adManager } from '@/services/adManager';

export default function EndlessRunnerGame() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  
  const playerY = useRef(new Animated.Value(0)).current;
  const obstacleX = useRef(new Animated.Value(300)).current;
  const gameLoopRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    obstacleX.setValue(300);
    
    // Move obstacle
    Animated.loop(
      Animated.timing(obstacleX, {
        toValue: -50,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Game loop
    let currentScore = 0;
    gameLoopRef.current = setInterval(() => {
      currentScore += 1;
      setScore(currentScore);
    }, 100);
  };

  const jump = () => {
    if (isJumping || gameState !== 'playing') return;
    
    setIsJumping(true);
    Animated.sequence([
      Animated.timing(playerY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(playerY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setIsJumping(false));
  };

  const gameOver = async () => {
    setGameState('gameover');
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (score > highScore) setHighScore(score);
    await adManager.showInterstitial();
  };

  const quitGame = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    router.back();
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.background }]}
      onPress={jump}
      activeOpacity={1}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={quitGame} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>← Quit</Text>
        </TouchableOpacity>
        <Text style={[styles.score, { color: theme.text }]}>Score: {score}</Text>
        <View style={{ width: 60 }} />
      </View>

      {gameState === 'ready' && (
        <View style={styles.centerContent}>
          <Text style={[styles.title, { color: theme.text }]}>Endless Runner</Text>
          <Text style={[styles.instruction, { color: theme.textSecondary }]}>
            Tap to jump over obstacles
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={startGame}
          >
            <Text style={styles.buttonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameState === 'playing' && (
        <View style={styles.gameArea}>
          <Animated.View
            style={[
              styles.player,
              { backgroundColor: theme.primary, transform: [{ translateY: playerY }] }
            ]}
          >
            <Text style={styles.playerIcon}>🏃</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.obstacle,
              { backgroundColor: '#FF3B30', transform: [{ translateX: obstacleX }] }
            ]}
          />

          <View style={[styles.ground, { backgroundColor: theme.border }]} />
        </View>
      )}

      {gameState === 'gameover' && (
        <View style={styles.centerContent}>
          <Text style={[styles.gameOverTitle, { color: '#FF3B30' }]}>Game Over!</Text>
          <Text style={[styles.finalScore, { color: theme.text }]}>Score: {score}</Text>
          {highScore > 0 && (
            <Text style={[styles.highScore, { color: theme.textSecondary }]}>
              High Score: {highScore}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={startGame}
          >
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
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
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  player: {
    position: 'absolute',
    left: 50,
    bottom: 100,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerIcon: {
    fontSize: 30,
  },
  obstacle: {
    position: 'absolute',
    right: 0,
    bottom: 100,
    width: 30,
    height: 50,
    borderRadius: 4,
  },
  ground: {
    height: 4,
    width: '100%',
  },
  gameOverTitle: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 16,
  },
  finalScore: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  highScore: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 32,
  },
});
