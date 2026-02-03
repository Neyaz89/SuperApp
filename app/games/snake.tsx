import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 15;
const CELL_SIZE = 20;

export default function SnakeGame() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [snake, setSnake] = useState<Position[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Position>({ x: 10, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const gameLoopRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(moveSnake, 150);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, snake, direction]);

  const moveSnake = () => {
    setSnake(prev => {
      const head = prev[0];
      let newHead: Position;

      switch (direction) {
        case 'UP': newHead = { x: head.x, y: head.y - 1 }; break;
        case 'DOWN': newHead = { x: head.x, y: head.y + 1 }; break;
        case 'LEFT': newHead = { x: head.x - 1, y: head.y }; break;
        case 'RIGHT': newHead = { x: head.x + 1, y: head.y }; break;
      }

      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE ||
          prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameState('gameover');
        return prev;
      }

      const newSnake = [newHead, ...prev];
      
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  };

  const startGame = () => {
    setSnake([{ x: 7, y: 7 }]);
    setDirection('RIGHT');
    setScore(0);
    setGameState('playing');
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

      <View style={[styles.grid, { backgroundColor: theme.card }]}>
        {Array.from({ length: GRID_SIZE }).map((_, y) =>
          Array.from({ length: GRID_SIZE }).map((_, x) => {
            const isSnake = snake.some(s => s.x === x && s.y === y);
            const isFood = food.x === x && food.y === y;
            return (
              <View
                key={`${x}-${y}`}
                style={[
                  styles.cell,
                  { backgroundColor: isSnake ? theme.primary : isFood ? '#FF3B30' : 'transparent' }
                ]}
              />
            );
          })
        )}
      </View>

      {gameState !== 'playing' && (
        <View style={styles.overlay}>
          <Text style={[styles.title, { color: theme.text }]}>
            {gameState === 'ready' ? 'Snake Game' : 'Game Over!'}
          </Text>
          {gameState === 'gameover' && (
            <Text style={[styles.finalScore, { color: theme.text }]}>Score: {score}</Text>
          )}
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={startGame}>
            <Text style={styles.buttonText}>{gameState === 'ready' ? 'Start' : 'Play Again'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameState === 'playing' && (
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.card }]} onPress={() => setDirection('UP')}>
            <Text style={styles.arrow}>↑</Text>
          </TouchableOpacity>
          <View style={styles.controlRow}>
            <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.card }]} onPress={() => setDirection('LEFT')}>
              <Text style={styles.arrow}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.card }]} onPress={() => setDirection('DOWN')}>
              <Text style={styles.arrow}>↓</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.card }]} onPress={() => setDirection('RIGHT')}>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>
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
  grid: { width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE, flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center', borderRadius: 8 },
  cell: { width: CELL_SIZE, height: CELL_SIZE },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 16 },
  finalScore: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  button: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  controls: { alignItems: 'center', marginTop: 20 },
  controlRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  controlBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 24, fontWeight: '700' },
});
