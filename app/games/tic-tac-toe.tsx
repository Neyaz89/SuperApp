import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

type Board = ('X' | 'O' | null)[];

const checkWinner = (board: Board): 'X' | 'O' | 'Draw' | null => {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(cell => cell) ? 'Draw' : null;
};

const minimax = (board: Board, isMax: boolean): number => {
  const winner = checkWinner(board);
  if (winner === 'O') return 10;
  if (winner === 'X') return -10;
  if (winner === 'Draw') return 0;

  if (isMax) {
    let best = -1000;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O';
        best = Math.max(best, minimax(board, false));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = 1000;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'X';
        best = Math.min(best, minimax(board, true));
        board[i] = null;
      }
    }
    return best;
  }
};

const getBestMove = (board: Board): number => {
  let bestVal = -1000, bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = 'O';
      const moveVal = minimax(board, false);
      board[i] = null;
      if (moveVal > bestVal) {
        bestMove = i;
        bestVal = moveVal;
      }
    }
  }
  return bestMove;
};

export default function TicTacToeGame() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [winner, setWinner] = useState<string | null>(null);

  const handlePress = (index: number) => {
    if (board[index] || winner) return;
    
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result);
      return;
    }

    setTimeout(() => {
      const aiMove = getBestMove(newBoard);
      if (aiMove !== -1) {
        newBoard[aiMove] = 'O';
        setBoard(newBoard);
        const aiResult = checkWinner(newBoard);
        if (aiResult) setWinner(aiResult);
      }
    }, 300);
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Tic Tac Toe</Text>
        <TouchableOpacity onPress={reset}>
          <Text style={[styles.resetText, { color: theme.primary }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.board}>
        {board.map((cell, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.cell, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => handlePress(i)}
          >
            <Text style={[styles.cellText, { color: cell === 'X' ? theme.primary : '#FF3B30' }]}>
              {cell}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {winner && (
        <View style={styles.result}>
          <Text style={[styles.resultText, { color: theme.text }]}>
            {winner === 'Draw' ? "It's a Draw!" : winner === 'X' ? 'You Win!' : 'AI Wins!'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 40, marginBottom: 40 },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800' },
  resetText: { fontSize: 16, fontWeight: '600' },
  board: { flexDirection: 'row', flexWrap: 'wrap', width: 300, height: 300, alignSelf: 'center' },
  cell: { width: '33.33%', height: '33.33%', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 48, fontWeight: '800' },
  result: { marginTop: 40, alignItems: 'center' },
  resultText: { fontSize: 28, fontWeight: '800' },
});
