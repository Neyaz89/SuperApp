import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BannerAd as GoogleBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

type BannerAdProps = {
  size?: 'banner' | 'largeBanner' | 'mediumRectangle' | 'custom';
  adUnitId?: string;
  customWidth?: number;
  customHeight?: number;
};

// Ad Unit IDs
// Use test ads until app is approved by AdMob
const USE_TEST_ADS = false; // Set to false after AdMob approval

const AD_UNIT_IDS = {
  homepage: USE_TEST_ADS || __DEV__ 
    ? TestIds.BANNER 
    : 'ca-app-pub-4846583305979583/3887011051',
  preview: USE_TEST_ADS || __DEV__
    ? TestIds.BANNER
    : 'ca-app-pub-4846583305979583/5794145204',
};

export function BannerAd({ size = 'banner', adUnitId, customWidth, customHeight }: BannerAdProps) {
  const { theme } = useTheme();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  const getAdSize = () => {
    switch (size) {
      case 'banner':
        return BannerAdSize.BANNER;
      case 'largeBanner':
        return BannerAdSize.LARGE_BANNER;
      case 'mediumRectangle':
        return BannerAdSize.MEDIUM_RECTANGLE;
      case 'custom':
        // Return custom size as string in format "WIDTHxHEIGHT"
        if (customWidth && customHeight) {
          return `${customWidth}x${customHeight}`;
        }
        return BannerAdSize.BANNER;
      default:
        return BannerAdSize.BANNER;
    }
  };

  // Use provided adUnitId or default to homepage
  const unitId = adUnitId || AD_UNIT_IDS.homepage;

  console.log('🎯 Banner Ad - Unit ID:', unitId);
  console.log('🎯 Banner Ad - Size:', size);
  console.log('🎯 Banner Ad - Dev Mode:', __DEV__);
  console.log('🎯 Banner Ad - Using Test Ads:', USE_TEST_ADS);

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.card,
      height: customHeight || 'auto',
    }]}>
      <GoogleBannerAd
        unitId={unitId}
        size={getAdSize()}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          console.log('✅ Banner ad loaded successfully');
          setAdLoaded(true);
          setAdError(null);
        }}
        onAdFailedToLoad={(error) => {
          console.error('❌ Banner ad failed to load:', error);
          setAdError(error.message);
        }}
      />
      {__DEV__ && !adLoaded && !adError && (
        <Text style={styles.debugText}>Loading ad...</Text>
      )}
      {__DEV__ && adError && (
        <Text style={styles.errorText}>Ad Error: {adError}</Text>
      )}
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
    minHeight: 50,
    maxHeight: 250,
  },
  debugText: {
    color: '#6B7280',
    fontSize: 12,
    padding: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    padding: 8,
    textAlign: 'center',
  },
});
