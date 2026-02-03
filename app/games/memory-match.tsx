import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const EMOJIS = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎬', '🎵', '🎸'];

type Card = { id: number; emoji: string; flipped: boolean; matched: boolean };

export default function MemoryMatchGame() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
    setCards(shuffled);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
  };

  const handleCardPress = (index: number) => {
    if (flippedIndices.length === 2 || cards[index].flipped || cards[index].matched) return;

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped;
      
      if (cards[first].emoji === cards[second].emoji) {
        newCards[first].matched = true;
        newCards[second].matched = true;
        setCards(newCards);
        setMatches(matches + 1);
        setFlippedIndices([]);
      } else {
        setTimeout(() => {
          newCards[first].flipped = false;
          newCards[second].flipped = false;
          setCards(newCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Memory Match</Text>
        <TouchableOpacity onPress={initializeGame}>
          <Text style={[styles.resetText, { color: theme.primary }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <Text style={[styles.statText, { color: theme.text }]}>Moves: {moves}</Text>
        <Text style={[styles.statText, { color: theme.text }]}>Matches: {matches}/8</Text>
      </View>

      <View style={styles.grid}>
        {cards.map((card, index) => (
          <TouchableOpacity
            key={card.id}
            style={[
              styles.card,
              { backgroundColor: card.flipped || card.matched ? theme.primary : theme.card }
            ]}
            onPress={() => handleCardPress(index)}
            disabled={card.matched}
          >
            <Text style={styles.cardText}>
              {card.flipped || card.matched ? card.emoji : '?'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {matches === 8 && (
        <View style={styles.winContainer}>
          <Text style={[styles.winText, { color: '#34C759' }]}>You Won!</Text>
          <Text style={[styles.winMoves, { color: theme.text }]}>In {moves} moves</Text>
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
  resetText: { fontSize: 16, fontWeight: '600' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  statText: { fontSize: 18, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '22%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardText: { fontSize: 32 },
  winContainer: { position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center' },
  winText: { fontSize: 36, fontWeight: '800' },
  winMoves: { fontSize: 18, fontWeight: '600', marginTop: 8 },
});
