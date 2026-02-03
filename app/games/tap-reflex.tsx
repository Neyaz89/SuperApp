import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { adManager } from '@/services/adManager';

export default function TapReflexGame() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [gameState, setGameState] = useState<'ready' | 'waiting' | 'tap' | 'result'>('ready');
  const [score, setScore] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startGame = () => {
    setGameState('waiting');
    const delay = Math.random() * 3000 + 1000;
    
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = Date.now();
      setGameState('tap');
    }, delay);
  };

  const handleTap = () => {
    if (gameState === 'waiting') {
      setGameState('result');
      setReactionTime(-1);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else if (gameState === 'tap') {
      const time = Date.now() - startTimeRef.current;
      setReactionTime(time);
      setScore(score + 1);
      
      if (!bestTime || time < bestTime) {
        setBestTime(time);
      }
      
      setGameState('result');
    }
  };

  const playAgain = () => {
    setGameState('ready');
    setReactionTime(0);
  };

  const quitGame = async () => {
    if (score > 0) {
      await adManager.showInterstitial();
    }
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={quitGame} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>← Quit</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Tap Reflex</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Score</Text>
        <Text style={[styles.scoreValue, { color: theme.primary }]}>{score}</Text>
        {bestTime && (
          <Text style={[styles.bestTime, { color: theme.textSecondary }]}>
            Best: {bestTime}ms
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.gameArea,
          {
            backgroundColor:
              gameState === 'ready' ? theme.card :
              gameState === 'waiting' ? '#FF3B30' :
              gameState === 'tap' ? '#34C759' :
              theme.card
          }
        ]}
        onPress={handleTap}
        activeOpacity={1}
        disabled={gameState === 'ready' || gameState === 'result'}
      >
        {gameState === 'ready' && (
          <Text style={[styles.instruction, { color: theme.text }]}>
            Tap "Start" to begin
          </Text>
        )}
        {gameState === 'waiting' && (
          <Text style={styles.waitText}>Wait for GREEN...</Text>
        )}
        {gameState === 'tap' && (
          <Text style={styles.tapText}>TAP NOW!</Text>
        )}
        {gameState === 'result' && (
          <View style={styles.resultContainer}>
            {reactionTime === -1 ? (
              <>
                <Text style={[styles.resultTitle, { color: '#FF3B30' }]}>Too Early!</Text>
                <Text style={[styles.resultSubtitle, { color: theme.textSecondary }]}>
                  Wait for green
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.resultTitle, { color: '#34C759' }]}>
                  {reactionTime}ms
                </Text>
                <Text style={[styles.resultSubtitle, { color: theme.textSecondary }]}>
                  {reactionTime < 200 ? 'Lightning Fast!' :
                   reactionTime < 300 ? 'Great!' :
                   reactionTime < 400 ? 'Good!' : 'Keep Practicing!'}
                </Text>
              </>
            )}
          </View>
        )}
      </TouchableOpacity>

      {gameState === 'ready' && (
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: theme.primary }]}
          onPress={startGame}
        >
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
      )}

      {gameState === 'result' && (
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: theme.primary }]}
          onPress={playAgain}
        >
          <Text style={styles.startButtonText}>Play Again</Text>
        </TouchableOpacity>
      )}
    </View>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
  },
  bestTime: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  gameArea: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instruction: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  waitText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tapText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  startButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
