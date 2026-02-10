import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameWrapper } from '@/components/GameWrapper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Question = {
  question: string;
  options: string[];
  correct: number;
};

const QUIZ_DATA: { [key: string]: Question[] } = {
  'General Knowledge': [
    { question: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], correct: 2 },
    { question: 'How many continents are there?', options: ['5', '6', '7', '8'], correct: 2 },
    { question: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correct: 3 },
    { question: 'Who painted the Mona Lisa?', options: ['Van Gogh', 'Da Vinci', 'Picasso', 'Monet'], correct: 1 },
    { question: 'What year did World War II end?', options: ['1943', '1944', '1945', '1946'], correct: 2 },
  ],
  'Science': [
    { question: 'What is H2O?', options: ['Oxygen', 'Hydrogen', 'Water', 'Carbon'], correct: 2 },
    { question: 'How many planets in our solar system?', options: ['7', '8', '9', '10'], correct: 1 },
    { question: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'], correct: 0 },
    { question: 'What is the smallest unit of life?', options: ['Atom', 'Molecule', 'Cell', 'Organ'], correct: 2 },
    { question: 'What gas do plants absorb?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correct: 2 },
  ],
  'Technology': [
    { question: 'Who founded Apple?', options: ['Bill Gates', 'Steve Jobs', 'Elon Musk', 'Mark Zuckerberg'], correct: 1 },
    { question: 'What does CPU stand for?', options: ['Central Process Unit', 'Central Processing Unit', 'Computer Personal Unit', 'Central Processor Unit'], correct: 1 },
    { question: 'What year was the first iPhone released?', options: ['2005', '2006', '2007', '2008'], correct: 2 },
    { question: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks Text Mark Language'], correct: 0 },
    { question: 'Who created Facebook?', options: ['Steve Jobs', 'Bill Gates', 'Mark Zuckerberg', 'Jeff Bezos'], correct: 2 },
  ],
  'Sports': [
    { question: 'How many players in a soccer team?', options: ['9', '10', '11', '12'], correct: 2 },
    { question: 'Where were the 2020 Olympics held?', options: ['Beijing', 'Tokyo', 'London', 'Rio'], correct: 1 },
    { question: 'What sport is Wimbledon?', options: ['Golf', 'Cricket', 'Tennis', 'Football'], correct: 2 },
    { question: 'How many rings in Olympic logo?', options: ['4', '5', '6', '7'], correct: 1 },
    { question: 'What is a perfect score in bowling?', options: ['200', '250', '300', '350'], correct: 2 },
  ],
};

export default function QuizGame() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [gameState, setGameState] = useState<'category' | 'playing' | 'result'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const categories = Object.keys(QUIZ_DATA);
  const questions = selectedCategory ? QUIZ_DATA[selectedCategory] : [];

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setGameState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const selectAnswer = (index: number) => {
    if (showResult) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    
    if (index === questions[currentQuestion].correct) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setGameState('result');
    }
  };

  const restartQuiz = () => {
    setGameState('category');
    setSelectedCategory('');
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: any } = {
      'General Knowledge': 'bulb',
      'Science': 'flask',
      'Technology': 'hardware-chip',
      'Sports': 'football',
    };
    return icons[category] || 'help-circle';
  };

  const getCategoryColor = (category: string): [string, string] => {
    const colors: { [key: string]: [string, string] } = {
      'General Knowledge': ['#8B5CF6', '#7C3AED'],
      'Science': ['#10B981', '#059669'],
      'Technology': ['#3B82F6', '#2563EB'],
      'Sports': ['#F59E0B', '#D97706'],
    };
    return colors[category] || ['#8B5CF6', '#7C3AED'];
  };

  return (
    <GameWrapper gameName="Quiz Master">
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.decorCircle1, { backgroundColor: '#8B5CF620' }]} />
      <View style={[styles.decorCircle2, { backgroundColor: '#3B82F620' }]} />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => gameState === 'category' ? router.back() : restartQuiz()}
          style={[styles.backButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.text }]}>Quiz Game</Text>
        
        <View style={{ width: 48 }} />
      </View>

      {/* Category Selection */}
      {gameState === 'category' && (
        <ScrollView style={styles.content} contentContainerStyle={styles.categoryContainer}>
          <Text style={[styles.categoryTitle, { color: theme.text }]}>Choose a Category</Text>
          
          {categories.map((category, index) => {
            const colors = getCategoryColor(category);
            return (
              <TouchableOpacity
                key={index}
                style={styles.categoryCard}
                onPress={() => selectCategory(category)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors}
                  style={styles.categoryGradient}
                >
                  <Ionicons name={getCategoryIcon(category)} size={40} color="#FFFFFF" />
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.questionCount}>{QUIZ_DATA[category].length} Questions</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Quiz Playing */}
      {gameState === 'playing' && questions.length > 0 && (
        <View style={styles.quizContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.card }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                  backgroundColor: getCategoryColor(selectedCategory)[0],
                },
              ]}
            />
          </View>

          <View style={[styles.questionCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.questionNumber, { color: theme.textSecondary }]}>
              Question {currentQuestion + 1} of {questions.length}
            </Text>
            <Text style={[styles.questionText, { color: theme.text }]}>
              {questions[currentQuestion].question}
            </Text>
          </View>

          <ScrollView style={styles.optionsContainer}>
            {questions[currentQuestion].options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === questions[currentQuestion].correct;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    { backgroundColor: theme.card },
                    showCorrect && styles.correctOption,
                    showWrong && styles.wrongOption,
                  ]}
                  onPress={() => selectAnswer(index)}
                  disabled={showResult}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, { color: theme.text }]}>
                    {option}
                  </Text>
                  {showCorrect && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
                  {showWrong && <Ionicons name="close-circle" size={24} color="#EF4444" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {showResult && (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={nextQuestion}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={getCategoryColor(selectedCategory)}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>
                  {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
                </Text>
                <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results */}
      {gameState === 'result' && (
        <View style={styles.resultContainer}>
          <View style={[styles.resultCard, { backgroundColor: theme.card }]}>
            <Text style={styles.resultEmoji}>
              {score === questions.length ? '🏆' : score >= questions.length * 0.7 ? '🎉' : score >= questions.length * 0.5 ? '👍' : '📚'}
            </Text>
            <Text style={[styles.resultTitle, { color: theme.text }]}>
              {score === questions.length ? 'Perfect!' : score >= questions.length * 0.7 ? 'Great Job!' : score >= questions.length * 0.5 ? 'Good Try!' : 'Keep Learning!'}
            </Text>
            <Text style={[styles.resultScore, { color: theme.text }]}>
              {score} / {questions.length}
            </Text>
            <Text style={[styles.resultPercentage, { color: theme.textSecondary }]}>
              {Math.round((score / questions.length) * 100)}% Correct
            </Text>

            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={restartQuiz}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={getCategoryColor(selectedCategory)}
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
    fontSize: 24,
    fontWeight: '900',
  },
  content: {
    flex: 1,
  },
  categoryContainer: {
    padding: 20,
  },
  categoryTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 24,
    textAlign: 'center',
  },
  categoryCard: {
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  categoryGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  questionCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  quizContainer: {
    flex: 1,
    padding: 20,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  questionCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  correctOption: {
    backgroundColor: '#10B98120',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  wrongOption: {
    backgroundColor: '#EF444420',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  nextButton: {
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  resultCard: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 16,
  },
  resultScore: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 8,
  },
  resultPercentage: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 32,
  },
  playAgainButton: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
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
