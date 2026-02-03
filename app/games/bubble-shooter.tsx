import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const COLORS = ['#FF3B30', '#34C759', '#007AFF', '#FFCC00', '#FF9500'];

export default function BubbleShooterGame() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [score, setScore] = useState(0);
  const [bubbles, setBubbles] = useState(
    Array.from({ length: 5 }, () => 
      Array.from({ length: 8 }, () => COLORS[Math.floor(Math.random() * COLORS.length)])
    )
  );

  const shootBubble = (col: number) => {
    const newBubbles = [...bubbles];
    const color = newBubbles[0][col];
    let matches = 1;
    
    // Simple match logic
    if (col > 0 && newBubbles[0][col - 1] === color) matches++;
    if (col < 7 && newBubbles[0][col + 1] === color) matches++;
    
    if (matches >= 2) {
      newBubbles[0][col] = '';
      if (col > 0 && newBubbles[0][col - 1] === color) newBubbles[0][col - 1] = '';
      if (col < 7 && newBubbles[0][col + 1] === color) newBubbles[0][col + 1] = '';
      setScore(score + matches * 10);
    }
    
    setBubbles(newBubbles);
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

      <View style={styles.grid}>
        {bubbles.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((color, j) => (
              <TouchableOpacity
                key={j}
                style={[styles.bubble, { backgroundColor: color || theme.card }]}
                onPress={() => shootBubble(j)}
              />
            ))}
          </View>
        ))}
      </View>

      <Text style={[styles.instruction, { color: theme.textSecondary }]}>
        Tap bubbles to match 2 or more of the same color!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 40, marginBottom: 20 },
  backText: { fontSize: 16, fontWeight: '600' },
  score: { fontSize: 18, fontWeight: '700' },
  grid: { alignSelf: 'center', gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  bubble: { width: 40, height: 40, borderRadius: 20 },
  instruction: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
