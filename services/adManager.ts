import { Platform } from 'react-native';
import { InterstitialAd, RewardedAd, AdEventType, TestIds, RewardedAdEventType } from 'react-native-google-mobile-ads';

export type AdType = 'banner' | 'interstitial' | 'rewarded';

// Replace with your actual Ad Unit IDs from AdMob
const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-4846583305979583/3193602836';

const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-4846583305979583/3727228956';

export class AdManager {
  private static instance: AdManager;
  private interstitial: InterstitialAd | null = null;
  private interstitialLoaded = false;
  private rewarded: RewardedAd | null = null;
  private rewardedLoaded = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  private async initialize() {
    try {
      console.log('Ad Manager initialized');
      this.loadInterstitial();
      this.loadRewarded();
    } catch (error) {
      console.error('Failed to initialize ads:', error);
    }
  }

  async loadInterstitial(): Promise<void> {
    try {
      console.log('Loading interstitial ad...');
      
      this.interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: false,
      });

      this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
        console.log('Interstitial ad loaded');
        this.interstitialLoaded = true;
      });

      this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Interstitial ad closed');
        this.interstitialLoaded = false;
        // Preload next ad
        this.loadInterstitial();
      });

      this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('Interstitial ad error:', error);
        this.interstitialLoaded = false;
      });

      await this.interstitial.load();
    } catch (error) {
      console.error('Failed to load interstitial:', error);
      this.interstitialLoaded = false;
    }
  }

  async showInterstitial(): Promise<boolean> {
    try {
      if (!this.interstitialLoaded || !this.interstitial) {
        console.log('Interstitial not ready, loading...');
        await this.loadInterstitial();
        // Wait a bit for the ad to load
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (this.interstitialLoaded && this.interstitial) {
        console.log('Showing interstitial ad');
        await this.interstitial.show();
        return true;
      } else {
        console.log('Interstitial still not ready, skipping');
        return false;
      }
    } catch (error) {
      console.error('Failed to show interstitial:', error);
      return false;
    }
  }

  async loadRewarded(): Promise<void> {
    try {
      console.log('Loading rewarded ad...');
      
      this.rewarded = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: false,
      });

      this.rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        console.log('Rewarded ad loaded');
        this.rewardedLoaded = true;
      });

      this.rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
        console.log('User earned reward:', reward);
      });

      this.rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Rewarded ad closed');
        this.rewardedLoaded = false;
        // Preload next ad
        this.loadRewarded();
      });

      this.rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('Rewarded ad error:', error);
        this.rewardedLoaded = false;
      });

      await this.rewarded.load();
    } catch (error) {
      console.error('Failed to load rewarded:', error);
      this.rewardedLoaded = false;
    }
  }

  async showRewarded(): Promise<boolean> {
    try {
      if (!this.rewardedLoaded || !this.rewarded) {
        console.log('Rewarded ad not ready, loading...');
        await this.loadRewarded();
        // Wait a bit for the ad to load
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (this.rewardedLoaded && this.rewarded) {
        console.log('Showing rewarded ad');
        await this.rewarded.show();
        return true;
      } else {
        console.log('Rewarded ad still not ready, skipping');
        return false;
      }
    } catch (error) {
      console.error('Failed to show rewarded:', error);
      return false;
    }
  }

  isInterstitialReady(): boolean {
    return this.interstitialLoaded;
  }

  isRewardedReady(): boolean {
    return this.rewardedLoaded;
  }
}

export const adManager = AdManager.getInstance();
