import React from 'react';
import { View, StyleSheet } from 'react-native';

type LinearGradientProps = {
  colors: string[];
  style?: any;
  children?: React.ReactNode;
};

export function LinearGradient({ colors, style, children }: LinearGradientProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors[0] }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
