import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type PlatformIconProps = {
  platform: string;
  size?: number;
};

export function PlatformIcon({ platform, size = 24 }: PlatformIconProps) {
  const getIcon = () => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return { emoji: '▶️', color: '#FF0000' };
      case 'instagram':
        return { emoji: '📷', color: '#E4405F' };
      case 'facebook':
        return { emoji: '👥', color: '#1877F2' };
      case 'twitter':
      case 'x':
        return { emoji: '🐦', color: '#1DA1F2' };
      case 'vimeo':
        return { emoji: '🎬', color: '#1AB7EA' };
      case 'tiktok':
        return { emoji: '🎵', color: '#000000' };
      default:
        return { emoji: '🎥', color: '#666666' };
    }
  };

  const { emoji, color } = getIcon();

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor: color + '20' }]}>
      <Text style={[styles.emoji, { fontSize: size * 0.6 }]}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
});
