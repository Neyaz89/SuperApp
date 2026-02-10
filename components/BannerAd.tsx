import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BannerAd as GoogleBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

type BannerAdProps = {
  size?: 'banner' | 'largeBanner' | 'mediumRectangle';
  adUnitId?: string;
};

// Ad Unit IDs
const AD_UNIT_IDS = {
  homepage: __DEV__ 
    ? TestIds.BANNER 
    : 'ca-app-pub-4846583305979583/3887011051',
  preview: __DEV__
    ? TestIds.BANNER
    : 'ca-app-pub-4846583305979583/5794145204',
};

export function BannerAd({ size = 'banner', adUnitId }: BannerAdProps) {
  const { theme } = useTheme();

  const getAdSize = () => {
    switch (size) {
      case 'banner':
        return BannerAdSize.BANNER;
      case 'largeBanner':
        return BannerAdSize.LARGE_BANNER;
      case 'mediumRectangle':
        return BannerAdSize.MEDIUM_RECTANGLE;
      default:
        return BannerAdSize.BANNER;
    }
  };

  // Use provided adUnitId or default to homepage
  const unitId = adUnitId || AD_UNIT_IDS.homepage;

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <GoogleBannerAd
        unitId={unitId}
        size={getAdSize()}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
      />
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
