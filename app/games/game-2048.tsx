import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameWrapper } from '@/components/GameWrapper';

type Board = (number | null)[][];
type TileAnimation = { [key: string]: Animated.Value };

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 40, 400);
const CELL_SIZE = (BOARD_SIZE - 40) / 4;

const initializeBoard = (): Board => {
  const board: Board = Array(4).fill(null).map(() => Array(4).fill(null));
  addRandomTile(board);
  addRandomTile(board);
  return board;
};

const addRandomTile = (board: Board) => {
  const empty: [number, number][] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (board[i][j] === null) empty.push([i, j]);
    }
  }
  if (empty.length > 0) {
    const [row, col] = empty[Math.floor(Math.random() * empty.length)];
    board[row][col] = Math.random() < 0.9 ? 2 : 4;
  }
};

export default function Game2048() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  
  const tileAnimations = useRef<TileAnimation>({});
  const scoreAnim = useRef(new Animated.Value(1)).current;

  const getTileKey = (i: number, j: number) => `${i}-${j}`;

  const animateTile = (i: number, j: number) => {
    const key = getTileKey(i, j);
    if (!tileAnimations.current[key]) {
      tileAnimations.current[key] = new Animated.Value(0);
    }
    
    Animated.spring(tileAnimations.current[key], {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const animateScore = () => {
    Animated.sequence([
      Animated.timing(scoreAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scoreAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const checkGameOver = (board: Board): boolean => {
    // Check for empty cells
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === null) return false;
      }
    }
    
    // Check for possible merges
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const current = board[i][j];
        if (j < 3 && board[i][j + 1] === current) return false;
        if (i < 3 && board[i + 1][j] === current) return false;
      }
    }
    
    return true;
  };

  const move = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;
    
    const newBoard = board.map(row => [...row]);
    let moved = false;
    let newScore = score;

    const moveAndMerge = (line: (number | null)[]) => {
      const filtered = line.filter(cell => cell !== null);
      const merged: number[] = [];
      
      for (let i = 0; i < filtered.length; i++) {
        if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
          const mergedValue = filtered[i]! * 2;
          merged.push(mergedValue);
          newScore += mergedValue;
          if (mergedValue === 2048 && !won) {
            setWon(true);
          }
          i++;
        } else {
          merged.push(filtered[i]!);
        }
      }
      
      while (merged.length < 4) merged.push(0);
      return merged.map(v => v === 0 ? null : v);
    };

    if (direction === 'left') {
      for (let i = 0; i < 4; i++) {
        const newRow = moveAndMerge(newBoard[i]);
        if (JSON.stringify(newRow) !== JSON.stringify(newBoard[i])) moved = true;
        newBoard[i] = newRow;
      }
    } else if (direction === 'right') {
      for (let i = 0; i < 4; i++) {
        const reversed = [...newBoard[i]].reverse();
        const newRow = moveAndMerge(reversed).reverse();
        if (JSON.stringify(newRow) !== JSON.stringify(newBoard[i])) moved = true;
        newBoard[i] = newRow;
      }
    } else if (direction === 'up') {
      for (let j = 0; j < 4; j++) {
        const column = newBoard.map(row => row[j]);
        const newColumn = moveAndMerge(column);
        if (JSON.stringify(newColumn) !== JSON.stringify(column)) moved = true;
        for (let i = 0; i < 4; i++) newBoard[i][j] = newColumn[i];
      }
    } else if (direction === 'down') {
      for (let j = 0; j < 4; j++) {
        const column = newBoard.map(row => row[j]).reverse();
        const newColumn = moveAndMerge(column).reverse();
        const oldColumn = newBoard.map(row => row[j]);
        if (JSON.stringify(newColumn) !== JSON.stringify(oldColumn)) moved = true;
        for (let i = 0; i < 4; i++) newBoard[i][j] = newColumn[i];
      }
    }

    if (moved) {
      addRandomTile(newBoard);
      setBoard(newBoard);
      setScore(newScore);
      if (newScore > bestScore) setBestScore(newScore);
      animateScore();
      
      // Animate new tiles
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (newBoard[i][j] !== board[i][j]) {
            animateTile(i, j);
          }
        }
      }
      
      // Check game over
      if (checkGameOver(newBoard)) {
        setGameOver(true);
      }
    }
  };

  const resetGame = () => {
    setBoard(initializeBoard());
    setScore(0);
    setGameOver(false);
    setWon(false);
    tileAnimations.current = {};
  };

  const getTileColors = (value: number | null): [string, string] => {
    if (!value) return ['#CDC1B4', '#CDC1B4'];
    
    const colorMap: Record<number, [string, string]> = {
      2: ['#EEE4DA', '#EEE4DA'],
      4: ['#EDE0C8', '#EDE0C8'],
      8: ['#F2B179', '#F59563'],
      16: ['#F59563', '#F67C5F'],
      32: ['#F67C5F', '#F65E3B'],
      64: ['#F65E3B', '#ED3F23'],
      128: ['#EDCF72', '#EDCC61'],
      256: ['#EDCC61', '#EDC850'],
      512: ['#EDC850', '#EDC53F'],
      1024: ['#EDC53F', '#EDC22E'],
      2048: ['#EDC22E', '#EAB700'],
    };
    
    return colorMap[value] || ['#3C3A32', '#3C3A32'];
  };

  const getTileTextColor = (value: number | null) => {
    if (!value) return 'transparent';
    return value <= 4 ? '#776E65' : '#F9F6F2';
  };

  return (
    <GameWrapper gameName="2048">
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        translucent
        backgroundColor="transparent"
      />

      {/* Decorative background */}
      <View style={[styles.decorCircle1, { backgroundColor: '#EDC22E20' }]} />
      <View style={[styles.decorCircle2, { backgroundColor: '#F59E0B20' }]} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.text }]}>2048</Text>
        
        <TouchableOpacity
          onPress={resetGame}
          style={[styles.resetButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="refresh" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Score Container */}
      <View style={styles.scoreContainer}>
        <Animated.View style={[styles.scoreBox, { backgroundColor: theme.card, transform: [{ scale: scoreAnim }] }]}>
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>SCORE</Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>{score}</Text>
        </Animated.View>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Ionicons name="trophy" size={20} color="#F59E0B" />
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>BEST</Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>{bestScore}</Text>
        </View>
      </View>

      {/* Game Board */}
      <View style={styles.boardContainer}>
        <View style={[styles.board, { backgroundColor: '#BBADA0', width: BOARD_SIZE, height: BOARD_SIZE }]}>
          {board.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((cell, j) => {
                const key = getTileKey(i, j);
                const scale = tileAnimations.current[key] || new Animated.Value(1);
                const [color1, color2] = getTileColors(cell);
                
                return (
                  <Animated.View
                    key={`${i}-${j}`}
                    style={[
                      styles.cell,
                      {
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        transform: [{ scale }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[color1, color2]}
                      style={styles.cellGradient}
                    >
                      {cell && (
                        <Text
                          style={[
                            styles.cellText,
                            {
                              color: getTileTextColor(cell),
                              fontSize: cell >= 1000 ? 28 : cell >= 100 ? 36 : 44,
                            },
                          ]}
                        >
                          {cell}
                        </Text>
                      )}
                    </LinearGradient>
                  </Animated.View>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, { backgroundColor: theme.card }]}
          onPress={() => move('up')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-up" size={32} color={theme.primary} />
        </TouchableOpacity>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: theme.card }]}
            onPress={() => move('left')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={32} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: theme.card }]}
            onPress={() => move('down')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-down" size={32} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: theme.card }]}
            onPress={() => move('right')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={32} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.instruction, { color: theme.textSecondary }]}>
        Merge tiles to reach 2048!
      </Text>

      {/* Game Over / Won Overlay */}
      {(gameOver || won) && (
        <View style={styles.overlay}>
          <View style={[styles.overlayCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.overlayTitle, { color: theme.text }]}>
              {won ? '🎉 You Won!' : '💀 Game Over!'}
            </Text>
            <Text style={[styles.overlayScore, { color: theme.text }]}>
              Score: {score}
            </Text>
            {score === bestScore && score > 0 && (
              <View style={styles.newRecordBadge}>
                <Ionicons name="trophy" size={20} color="#F59E0B" />
                <Text style={styles.newRecordText}>New Record!</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={resetGame}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#F59E0B', '#EF4444']}
                style={styles.playAgainGradient}
              >
                <Ionicons name="refresh" size={24} color="#FFFFFF" />
                <Text style={styles.playAgainText}>Play Again</Text>
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
    fontSize: 36,
    fontWeight: '900',
  },
  resetButton: {
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
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scoreBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  boardContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  board: {
    borderRadius: 16,
    padding: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cellGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontWeight: '900',
  },
  controls: {
    alignItems: 'center',
    paddingTop: 10,
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
  instruction: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 20,
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
  overlayTitle: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 16,
  },
  overlayScore: {
    fontSize: 24,
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
    marginBottom: 24,
  },
  newRecordText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '700',
  },
  playAgainButton: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  playAgainGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  playAgainText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
});
