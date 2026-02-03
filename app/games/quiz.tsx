import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const QUESTIONS = [
  { q: 'What is 2 + 2?', options: ['3', '4', '5', '6'], answer: 1 },
  { q: 'Capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], answer: 2 },
  { q: 'Largest planet?', options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], answer: 2 },
  { q: 'Who painted Mona Lisa?', options: ['Picasso', 'Da Vinci', 'Van Gogh', 'Monet'], answer: 1 },
  { q: 'Fastest land animal?', options: ['Lion', 'Cheetah', 'Tiger', 'Leopard'], answer: 1 },
];

export default function QuizGame() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const handleAnswer = (index: number) => {
    setSelected(index);
    if (index === QUESTIONS[currentQ].answer) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(currentQ + 1);
        setSelected(null);
      } else {
        setShowResult(true);
      }
    }, 1000);
  };

  const reset = () => {
    setCurrentQ(0);
    setScore(0);
    setShowResult(false);
    setSelected(null);
  };

  if (showResult) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.resultContainer}>
          <Text style={[styles.resultTitle, { color: theme.text }]}>Quiz Complete!</Text>
          <Text style={[styles.resultScore, { color: theme.primary }]}>
            {score}/{QUESTIONS.length}
          </Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={reset}>
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backText, { color: theme.textSecondary }]}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.progress, { color: theme.text }]}>
          {currentQ + 1}/{QUESTIONS.length}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.question, { color: theme.text }]}>
          {QUESTIONS[currentQ].q}
        </Text>

        <View style={styles.options}>
          {QUESTIONS[currentQ].options.map((option, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.option,
                { backgroundColor: theme.card, borderColor: theme.border },
                selected === i && (i === QUESTIONS[currentQ].answer
                  ? { backgroundColor: '#34C759', borderColor: '#34C759' }
                  : { backgroundColor: '#FF3B30', borderColor: '#FF3B30' })
              ]}
              onPress={() => handleAnswer(i)}
              disabled={selected !== null}
            >
              <Text style={[styles.optionText, { color: selected === i ? '#FFF' : theme.text }]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 40, marginBottom: 40 },
  backText: { fontSize: 16, fontWeight: '600' },
  progress: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1 },
  question: { fontSize: 24, fontWeight: '700', marginBottom: 40, textAlign: 'center' },
  options: { gap: 16 },
  option: { padding: 20, borderRadius: 12, borderWidth: 2 },
  optionText: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 32, fontWeight: '800', marginBottom: 16 },
  resultScore: { fontSize: 48, fontWeight: '800', marginBottom: 40 },
  button: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, marginBottom: 16 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 12 },
});
