import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameWrapper } from '@/components/GameWrapper';

type Player = 'X' | 'O' | null;
type GameResult = Player | 'draw';
type Board = Player[];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 60, 350);
const CELL_SIZE = BOARD_SIZE / 3;

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6], // Diagonals
];

export default function TicTacToeGame() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<GameResult>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [gameMode, setGameMode] = useState<'pvp' | 'ai' | null>(null);
  
  const cellAnimations = useRef<Animated.Value[]>(
    Array(9).fill(0).map(() => new Animated.Value(0))
  ).current;

  const checkWinner = (board: Board): { winner: GameResult; line: number[] } => {
    for (const combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line: combo };
      }
    }
    
    if (board.every(cell => cell !== null)) {
      return { winner: 'draw', line: [] };
    }
    
    return { winner: null, line: [] };
  };

  const minimax = (board: Board, depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(board);
    
    if (result.winner === 'O') return 10 - depth;
    if (result.winner === 'X') return depth - 10;
    if (result.winner === 'draw') return 0;
    
    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'O';
          const score = minimax(board, depth + 1, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'X';
          const score = minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getBestMove = (board: Board): number => {
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        const score = minimax(board, 0, false);
        board[i] = null;
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    
    return bestMove;
  };

  const handleCellPress = (index: number) => {
    if (board[index] || winner || (gameMode === 'ai' && !isXNext)) return;
    
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    
    // Animate cell
    Animated.spring(cellAnimations[index], {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
    setBoard(newBoard);
    
    const result = checkWinner(newBoard);
    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.line);
      
      if (result.winner === 'X') {
        setScores(prev => ({ ...prev, X: prev.X + 1 }));
      } else if (result.winner === 'O') {
        setScores(prev => ({ ...prev, O: prev.O + 1 }));
      } else {
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      }
    } else {
      setIsXNext(!isXNext);
      
      // AI move
      if (gameMode === 'ai' && isXNext) {
        setTimeout(() => {
          const aiMove = getBestMove(newBoard);
          if (aiMove !== -1) {
            const aiBoard = [...newBoard];
            aiBoard[aiMove] = 'O';
            
            Animated.spring(cellAnimations[aiMove], {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }).start();
            
            setBoard(aiBoard);
            
            const aiResult = checkWinner(aiBoard);
            if (aiResult.winner) {
              setWinner(aiResult.winner);
              setWinningLine(aiResult.line);
              
              if (aiResult.winner === 'O') {
                setScores(prev => ({ ...prev, O: prev.O + 1 }));
              } else {
                setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
              }
            } else {
              setIsXNext(true);
            }
          }
        }, 500);
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine([]);
    cellAnimations.forEach(anim => anim.setValue(0));
  };

  const startNewGame = (mode: 'pvp' | 'ai') => {
    setGameMode(mode);
    resetGame();
    setScores({ X: 0, O: 0, draws: 0 });
  };

  if (!gameMode) {
    return (
      <GameWrapper gameName="Tic-Tac-Toe">
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          translucent
          backgroundColor="transparent"
        />

        <View style={[styles.decorCircle1, { backgroundColor: '#3B82F620' }]} />
        <View style={[styles.decorCircle2, { backgroundColor: '#EC489920' }]} />

        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.card }]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.modeSelection}>
          <Text style={[styles.modeTitle, { color: theme.text }]}>⭕ Tic-Tac-Toe</Text>
          <Text style={[styles.modeSubtitle, { color: theme.textSecondary }]}>
            Choose your game mode
          </Text>

          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => startNewGame('pvp')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.modeButtonGradient}
            >
              <Ionicons name="people" size={32} color="#FFFFFF" />
              <Text style={styles.modeButtonText}>Player vs Player</Text>
              <Text style={styles.modeButtonSubtext}>Play with a friend</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => startNewGame('ai')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#EC4899', '#DB2777']}
              style={styles.modeButtonGradient}
            >
              <Ionicons name="hardware-chip" size={32} color="#FFFFFF" />
              <Text style={styles.modeButtonText}>Player vs AI</Text>
              <Text style={styles.modeButtonSubtext}>Challenge the computer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
      </GameWrapper>
    );
  }

  return (
    <GameWrapper gameName="Tic-Tac-Toe">
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.decorCircle1, { backgroundColor: '#3B82F620' }]} />
      <View style={[styles.decorCircle2, { backgroundColor: '#EC489920' }]} />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => setGameMode(null)}
          style={[styles.backButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        
        <View style={styles.turnIndicator}>
          <Text style={[styles.turnText, { color: theme.text }]}>
            {winner ? (winner === 'draw' ? "It's a Draw!" : `${winner} Wins!`) : `${isXNext ? 'X' : 'O'}'s Turn`}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={resetGame}
          style={[styles.resetButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="refresh" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <View style={[styles.scoreCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: '#3B82F6' }]}>X</Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>{scores.X}</Text>
        </View>
        <View style={[styles.scoreCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Draws</Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>{scores.draws}</Text>
        </View>
        <View style={[styles.scoreCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: '#EC4899' }]}>O</Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>{scores.O}</Text>
        </View>
      </View>

      {/* Game Board */}
      <View style={styles.boardContainer}>
        <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
          {board.map((cell, index) => {
            const isWinningCell = winningLine.includes(index);
            const scale = cellAnimations[index];
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.cell,
                  {
                    width: CELL_SIZE - 8,
                    height: CELL_SIZE - 8,
                    backgroundColor: isWinningCell ? (cell === 'X' ? '#3B82F620' : '#EC489920') : theme.card,
                  },
                ]}
                onPress={() => handleCellPress(index)}
                activeOpacity={0.7}
                disabled={!!cell || !!winner}
              >
                <Animated.View style={{ transform: [{ scale }] }}>
                  {cell === 'X' && (
                    <Ionicons name="close" size={CELL_SIZE * 0.6} color="#3B82F6" />
                  )}
                  {cell === 'O' && (
                    <Ionicons name="ellipse-outline" size={CELL_SIZE * 0.5} color="#EC4899" />
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {winner && (
        <TouchableOpacity
          style={styles.playAgainButton}
          onPress={resetGame}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.playAgainGradient}
          >
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
            <Text style={styles.playAgainText}>Play Again</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  turnIndicator: {
    flex: 1,
    alignItems: 'center',
  },
  turnText: {
    fontSize: 20,
    fontWeight: '800',
  },
  scoreboard: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  scoreCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  boardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 4,
  },
  cell: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  playAgainButton: {
    marginHorizontal: 20,
    marginBottom: 40,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#10B981',
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
  modeSelection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  modeTitle: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 12,
  },
  modeSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 48,
  },
  modeButton: {
    width: '100%',
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modeButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modeButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  modeButtonSubtext: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
});
