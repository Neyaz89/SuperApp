import { Platform } from 'react-native';

export type AdType = 'banner' | 'interstitial' | 'rewarded';

export class AdManager {
  private static instance: AdManager;
  private interstitialLoaded = false;
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
    } catch (error) {
      console.error('Failed to initialize ads:', error);
    }
  }

  getBannerAdUnitId(): string {
    return Platform.select({
      ios: 'ca-app-pub-3940256099942544/2934735716',
      android: 'ca-app-pub-3940256099942544/6300978111',
    }) || '';
  }

  getInterstitialAdUnitId(): string {
    return Platform.select({
      ios: 'ca-app-pub-3940256099942544/4411468910',
      android: 'ca-app-pub-3940256099942544/1033173712',
    }) || '';
  }

  getRewardedAdUnitId(): string {
    return Platform.select({
      ios: 'ca-app-pub-3940256099942544/1712485313',
      android: 'ca-app-pub-3940256099942544/5224354917',
    }) || '';
  }

  async loadInterstitial(): Promise<void> {
    try {
      console.log('Loading interstitial ad...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.interstitialLoaded = true;
    } catch (error) {
      console.error('Failed to load interstitial:', error);
    }
  }

  async showInterstitial(): Promise<boolean> {
    try {
      if (!this.interstitialLoaded) {
        await this.loadInterstitial();
      }
      
      console.log('Showing interstitial ad');
      await new Promise(resolve => setTimeout(resolve, 500));
      this.interstitialLoaded = false;
      
      this.loadInterstitial();
      return true;
    } catch (error) {
      console.error('Failed to show interstitial:', error);
      return false;
    }
  }

  async loadRewarded(): Promise<void> {
    try {
      console.log('Loading rewarded ad...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.rewardedLoaded = true;
    } catch (error) {
      console.error('Failed to load rewarded:', error);
    }
  }

  async showRewarded(): Promise<boolean> {
    try {
      if (!this.rewardedLoaded) {
        await this.loadRewarded();
      }
      
      console.log('Showing rewarded ad');
      await new Promise(resolve => setTimeout(resolve, 500));
      this.rewardedLoaded = false;
      
      this.loadRewarded();
      return true;
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
