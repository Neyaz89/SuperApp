// Unity Ads Banner Component
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { unityAdsManager } from '@/services/unityAdsManager';

type UnityBannerAdProps = {
  position?: 'top' | 'bottom';
  visible?: boolean;
};

export function UnityBannerAd({ 
  position = 'bottom',
  visible = true 
}: UnityBannerAdProps) {
  useEffect(() => {
    if (visible) {
      // Show banner when component mounts
      showBanner();
    }

    // Hide banner when component unmounts
    return () => {
      unityAdsManager.hideBanner();
    };
  }, [visible, position]);

  const showBanner = async () => {
    try {
      await unityAdsManager.showBanner(position);
    } catch (error) {
      console.error('Banner ad error:', error);
    }
  };

  // Unity Ads banner is rendered natively, so we just return a placeholder
  return (
    <View style={styles.container}>
      {/* Banner is rendered by Unity Ads SDK */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50, // Standard banner height
    alignItems: 'center',
    justifyContent: 'center',
  },
});
