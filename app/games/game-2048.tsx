import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

type Board = (number | null)[][];

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
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const move = (direction: 'up' | 'down' | 'left' | 'right') => {
    const newBoard = board.map(row => [...row]);
    let moved = false;
    let newScore = score;

    const moveAndMerge = (line: (number | null)[]) => {
      const filtered = line.filter(cell => cell !== null);
      const merged: number[] = [];
      
      for (let i = 0; i < filtered.length; i++) {
        if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
          merged.push(filtered[i]! * 2);
          newScore += filtered[i]! * 2;
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
    }
  };

  const resetGame = () => {
    setBoard(initializeBoard());
    setScore(0);
  };

  const getTileColor = (value: number | null) => {
    if (!value) return theme.card;
    const colors: Record<number, string> = {
      2: '#EEE4DA',
      4: '#EDE0C8',
      8: '#F2B179',
      16: '#F59563',
      32: '#F67C5F',
      64: '#F65E3B',
      128: '#EDCF72',
      256: '#EDCC61',
      512: '#EDC850',
      1024: '#EDC53F',
      2048: '#EDC22E',
    };
    return colors[value] || '#3C3A32';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>2048</Text>
        <TouchableOpacity onPress={resetGame}>
          <Text style={[styles.resetText, { color: theme.primary }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.scoreContainer}>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>SCORE</Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>{score}</Text>
        </View>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>BEST</Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>{bestScore}</Text>
        </View>
      </View>

      <View style={[styles.board, { backgroundColor: theme.border }]}>
        {board.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((cell, j) => (
              <View
                key={`${i}-${j}`}
                style={[styles.cell, { backgroundColor: getTileColor(cell) }]}
              >
                {cell && (
                  <Text style={[styles.cellText, { color: cell > 4 ? '#FFF' : '#776E65' }]}>
                    {cell}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.card }]} onPress={() => move('up')}>
          <Text style={[styles.arrow, { color: theme.text }]}>↑</Text>
        </TouchableOpacity>
        <View style={styles.controlRow}>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.card }]} onPress={() => move('left')}>
            <Text style={[styles.arrow, { color: theme.text }]}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.card }]} onPress={() => move('down')}>
            <Text style={[styles.arrow, { color: theme.text }]}>↓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.card }]} onPress={() => move('right')}>
            <Text style={[styles.arrow, { color: theme.text }]}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.instruction, { color: theme.textSecondary }]}>
        Use arrow buttons to move tiles. Merge same numbers to reach 2048!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  scoreBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  board: {
    aspectRatio: 1,
    borderRadius: 8,
    padding: 8,
    gap: 8,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flex: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 32,
    fontWeight: '800',
  },
  instruction: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    fontWeight: '500',
  },
  controls: {
    alignItems: 'center',
    marginTop: 20,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 24,
    fontWeight: '700',
  },
});
