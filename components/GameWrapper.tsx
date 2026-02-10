import React, { useEffect, useState } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { BannerAd } from './BannerAd';
import { adManager } from '@/services/adManager';

type GameWrapperProps = {
  children: React.ReactNode;
  showBanner?: boolean;
  gameName?: string;
};

export function GameWrapper({ children, showBanner = true, gameName = 'game' }: GameWrapperProps) {
  const router = useRouter();
  const [adShown, setAdShown] = useState(false);

  // Show interstitial ad when game opens
  useEffect(() => {
    if (!adShown) {
      const timer = setTimeout(() => {
        adManager.showInterstitial()
          .then(() => {
            console.log(`Interstitial ad shown before ${gameName}`);
          })
          .catch((err: Error) => {
            console.log('No ad available:', err.message);
          });
        setAdShown(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [adShown, gameName]);

  // Show interstitial ad when exiting game
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleExit = () => {
    adManager.showInterstitial()
      .then(() => {
        console.log(`Exit interstitial ad shown for ${gameName}`);
      })
      .catch((err: Error) => {
        console.log('No exit ad available:', err.message);
      })
      .finally(() => {
        router.back();
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.gameContent}>
        {children}
      </View>
      
      {showBanner && (
        <View style={styles.bannerContainer}>
          <BannerAd size="banner" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gameContent: {
    flex: 1,
  },
  bannerContainer: {
    alignItems: 'center',
    backgroundColor: '#00000010',
    paddingVertical: 4,
  },
});
