import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DownloadProvider } from '@/contexts/DownloadContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
        </Stack>
      </DownloadProvider>
    </ThemeProvider>
  );
}
