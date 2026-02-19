import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { 
  IronSourceBanner,
  IronSourceBannerOptions,
  IronSourceBannerEvents
} from 'ironsource-mediation';

interface LevelPlayBannerAdProps {
  placementId: string;
  size?: 'BANNER' | 'LARGE' | 'RECTANGLE';
}

export default function LevelPlayBannerAd({ 
  placementId, 
  size = 'BANNER' 
}: LevelPlayBannerAdProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Set up banner event listeners
    const onBannerAdLoaded = IronSourceBannerEvents.onAdLoaded.addListener(() => {
      console.log('Banner ad loaded');
      setIsLoaded(true);
    });

    const onBannerAdLoadFailed = IronSourceBannerEvents.onAdLoadFailed.addListener((error) => {
      console.error('Banner ad load failed:', error);
      setIsLoaded(false);
    });

    const onBannerAdClicked = IronSourceBannerEvents.onAdClicked.addListener(() => {
      console.log('Banner ad clicked');
    });

    const onBannerAdScreenPresented = IronSourceBannerEvents.onAdScreenPresented.addListener(() => {
      console.log('Banner ad screen presented');
    });

    const onBannerAdScreenDismissed = IronSourceBannerEvents.onAdScreenDismissed.addListener(() => {
      console.log('Banner ad screen dismissed');
    });

    const onBannerAdLeftApplication = IronSourceBannerEvents.onAdLeftApplication.addListener(() => {
      console.log('Banner ad left application');
    });

    // Load banner
    loadBanner();

    // Cleanup
    return () => {
      onBannerAdLoaded.remove();
      onBannerAdLoadFailed.remove();
      onBannerAdClicked.remove();
      onBannerAdScreenPresented.remove();
      onBannerAdScreenDismissed.remove();
      onBannerAdLeftApplication.remove();
      IronSourceBanner.destroyBanner();
    };
  }, [placementId, size]);

  const loadBanner = async () => {
    try {
      const options: IronSourceBannerOptions = {
        position: 'BOTTOM',
        placementName: placementId,
        sizeDescription: size,
      };
      
      await IronSourceBanner.loadBanner(options);
    } catch (error) {
      console.error('Error loading banner:', error);
    }
  };

  // Banner is rendered natively, so we just return an empty view with proper height
  return (
    <View style={styles.container}>
      {/* Native banner will be rendered here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: Platform.select({
      ios: 50,
      android: 50,
    }),
    backgroundColor: 'transparent',
  },
});
