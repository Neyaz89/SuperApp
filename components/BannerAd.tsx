import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type BannerAdProps = {
  size?: 'banner' | 'largeBanner' | 'mediumRectangle';
};

export function BannerAd({ size = 'banner' }: BannerAdProps) {
  const { theme } = useTheme();

  const getHeight = () => {
    switch (size) {
      case 'banner':
        return 50;
      case 'largeBanner':
        return 100;
      case 'mediumRectangle':
        return 250;
      default:
        return 50;
    }
  };

  return (
    <View style={[styles.container, { height: getHeight(), backgroundColor: theme.card }]}>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
