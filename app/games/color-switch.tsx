import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const COLORS = ['#FF3B30', '#34C759', '#007AFF', '#FFCC00'];

export default function ColorSwitchGame() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [targetColor, setTargetColor] = useState(COLORS[0]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameState('gameover');
    }
  }, [gameState, timeLeft]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
    setTargetColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
  };

  const handleColorPress = (color: string) => {
    if (color === targetColor) {
      setScore(score + 1);
      setTargetColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    } else {
      setTimeLeft(Math.max(0, timeLeft - 2));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Color Switch</Text>
        <View style={{ width: 60 }} />
      </View>

      {gameState === 'ready' && (
        <View style={styles.centerContent}>
          <Text style={[styles.instruction, { color: theme.text }]}>
            Tap the matching color as fast as you can!
          </Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={startGame}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameState === 'playing' && (
        <>
          <View style={styles.stats}>
            <Text style={[styles.statText, { color: theme.text }]}>Score: {score}</Text>
            <Text style={[styles.statText, { color: theme.text }]}>Time: {timeLeft}s</Text>
          </View>

          <View style={[styles.targetBox, { backgroundColor: targetColor }]}>
            <Text style={styles.targetText}>Match This!</Text>
          </View>

          <View style={styles.colorGrid}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorButton, { backgroundColor: color }]}
                onPress={() => handleColorPress(color)}
              />
            ))}
          </View>
        </>
      )}

      {gameState === 'gameover' && (
        <View style={styles.centerContent}>
          <Text style={[styles.gameOverTitle, { color: '#FF3B30' }]}>Time's Up!</Text>
          <Text style={[styles.finalScore, { color: theme.text }]}>Final Score: {score}</Text>
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
  title: { fontSize: 24, fontWeight: '800' },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  instruction: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 },
  button: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 40 },
  statText: { fontSize: 20, fontWeight: '700' },
  targetBox: { width: 200, height: 200, borderRadius: 100, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 60 },
  targetText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20 },
  colorButton: { width: 120, height: 120, borderRadius: 60 },
  gameOverTitle: { fontSize: 36, fontWeight: '800', marginBottom: 16 },
  finalScore: { fontSize: 24, fontWeight: '700', marginBottom: 32 },
});
