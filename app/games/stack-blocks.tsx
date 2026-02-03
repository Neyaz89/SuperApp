import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function StackBlocksGame() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const [blockWidth, setBlockWidth] = useState(200);
  const blockX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (gameState === 'playing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blockX, { toValue: 200, duration: 1000, useNativeDriver: true }),
          Animated.timing(blockX, { toValue: -200, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setBlockWidth(200);
    setGameState('playing');
  };

  const dropBlock = () => {
    const currentX = JSON.parse(JSON.stringify(blockX));
    const offset = Math.abs(currentX._value);
    
    if (offset < 20) {
      setScore(score + 1);
      setBlockWidth(Math.max(50, blockWidth - 5));
    } else if (offset < 50) {
      setScore(score + 1);
      setBlockWidth(Math.max(50, blockWidth - 10));
    } else {
      setGameState('gameover');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.score, { color: theme.text }]}>Score: {score}</Text>
      </View>

      {gameState === 'ready' && (
        <View style={styles.centerContent}>
          <Text style={[styles.title, { color: theme.text }]}>Stack Blocks</Text>
          <Text style={[styles.instruction, { color: theme.textSecondary }]}>
            Tap to drop the block at the perfect moment!
          </Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={startGame}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameState === 'playing' && (
        <TouchableOpacity style={styles.gameArea} onPress={dropBlock} activeOpacity={1}>
          <Animated.View
            style={[
              styles.movingBlock,
              { backgroundColor: theme.primary, width: blockWidth, transform: [{ translateX: blockX }] }
            ]}
          />
          
          <View style={styles.stackArea}>
            {Array.from({ length: score }).map((_, i) => (
              <View
                key={i}
                style={[styles.stackedBlock, { backgroundColor: theme.card, width: blockWidth + (score - i) * 5 }]}
              />
            ))}
          </View>
        </TouchableOpacity>
      )}

      {gameState === 'gameover' && (
        <View style={styles.centerContent}>
          <Text style={[styles.gameOverTitle, { color: '#FF3B30' }]}>Game Over!</Text>
          <Text style={[styles.finalScore, { color: theme.text }]}>Height: {score}</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={startGame}>
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 40, marginBottom: 20 },
  backText: { fontSize: 16, fontWeight: '600' },
  score: { fontSize: 18, fontWeight: '700' },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 12 },
  instruction: { fontSize: 16, fontWeight: '500', textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 },
  button: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  gameArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  movingBlock: { height: 40, borderRadius: 8, position: 'absolute', top: 100 },
  stackArea: { position: 'absolute', bottom: 100, alignItems: 'center' },
  stackedBlock: { height: 40, borderRadius: 8, marginTop: 2 },
  gameOverTitle: { fontSize: 36, fontWeight: '800', marginBottom: 16 },
  finalScore: { fontSize: 24, fontWeight: '700', marginBottom: 32 },
});
