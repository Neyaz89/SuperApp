import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DownloadProvider } from '@/contexts/DownloadContext';
import levelPlayAdsManager from '@/services/levelPlayAdsManager';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Initialize LevelPlay (ironSource with Unity Ads mediation)
    const initAds = async () => {
      const success = await levelPlayAdsManager.initialize();
      if (success) {
        console.log('LevelPlay ads initialized successfully');
      } else {
        console.error('Failed to initialize LevelPlay ads');
      }
    };
    
    initAds();
  }, []);

  return (
    <ThemeProvider>
      <DownloadProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="preview" />
          <Stack.Screen name="quality" />
          <Stack.Screen name="download" />
          <Stack.Screen name="complete" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="games" />
          <Stack.Screen name="games/game-2048" />
          <Stack.Screen name="games/memory-match" />
          <Stack.Screen name="games/snake" />
          <Stack.Screen name="games/tic-tac-toe" />
          <Stack.Screen name="games/quiz" />
          <Stack.Screen name="games/stack-blocks" />
          <Stack.Screen name="games/html5-browser" />
          <Stack.Screen name="games/html5-player" />
        </Stack>
      </DownloadProvider>
    </ThemeProvider>
  );
}
