import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  border: string;
};

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
};

// SuperHub Logo Theme - Extracted from rocket logo colors
// Purple: #A78BFA, #C4B5FD, #8B5CF6
// Blue/Cyan: #60A5FA, #93C5FD, #3B82F6
// Pink/Coral: #F472B6, #FCA5A5, #FB7185
// Mint: #6EE7B7, #A7F3D0

const lightTheme: Theme = {
  background: '#FAF5FF', // Soft purple tint
  card: '#FFFFFF',
  text: '#5B21B6', // Deep purple from logo
  textSecondary: '#9333EA',
  primary: '#A78BFA', // Main purple from logo
  secondary: '#60A5FA', // Cyan from logo
  accent: '#F472B6', // Pink from logo
  success: '#6EE7B7', // Mint from logo
  border: '#E9D5FF',
};

const darkTheme: Theme = {
  background: '#1E1B4B', // Deep purple from logo
  card: '#2E1065',
  text: '#F3E8FF',
  textSecondary: '#C4B5FD',
  primary: '#C4B5FD', // Light purple from logo
  secondary: '#93C5FD', // Light cyan from logo
  accent: '#FCA5A5', // Light pink from logo
  success: '#A7F3D0', // Light mint from logo
  border: '#5B21B6',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start in light mode (false = light mode)
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
      // If no saved preference, default to light mode (already set in useState)
    } catch (error) {
      console.log('Failed to load theme preference');
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.log('Failed to save theme preference');
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
