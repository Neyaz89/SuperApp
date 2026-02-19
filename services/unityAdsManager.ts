// Unity Ads Manager - Replace AdMob with Unity Ads
import UnityAds, {
  UnityAdsInitializationListener,
  UnityAdsLoadListener,
  UnityAdsShowListener,
} from 'react-native-unity-ads';

// Unity Ads Configuration
const UNITY_CONFIG = {
  gameId: '6049201', // Your Unity Game ID
  testMode: __DEV__, // true for development, false for production
  
  placements: {
    banner: 'Banner_Android',
    interstitial: 'Interstitial_Android',
    rewarded: 'Rewarded_Android',
  },
};

class UnityAdsManager {
  private initialized = false;
  private interstitialReady = false;
  private rewardedReady = false;

  /**
   * Initialize Unity Ads
   * Call this once when app starts
   */
  async initialize(): Promise<void> {
    try {
      console.log('🎮 Initializing Unity Ads...');
      console.log('Game ID:', UNITY_CONFIG.gameId);
      console.log('Test Mode:', UNITY_CONFIG.testMode);

      const listener: UnityAdsInitializationListener = {
        onInitializationComplete: () => {
          console.log('✅ Unity Ads initialized successfully');
          this.initialized = true;
          
          // Load ads after initialization
          this.loadInterstitial();
          this.loadRewarded();
        },
        onInitializationFailed: (error, message) => {
          console.error('❌ Unity Ads initialization failed:', error, message);
          this.initialized = false;
        },
      };

      await UnityAds.initialize(
        UNITY_CONFIG.gameId,
        UNITY_CONFIG.testMode,
        listener
      );
    } catch (error) {
      console.error('❌ Unity Ads initialization error:', error);
    }
  }

  /**
   * Check if Unity Ads is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ==================== BANNER ADS ====================

  /**
   * Show banner ad
   * @param position 'top' or 'bottom'
   */
  async showBanner(position: 'top' | 'bottom' = 'bottom'): Promise<void> {
    try {
      if (!this.initialized) {
        console.log('⚠️ Unity Ads not initialized yet');
        return;
      }

      console.log('📊 Showing banner ad at:', position);
      
      await UnityAds.Banner.show(
        UNITY_CONFIG.placements.banner,
        position === 'top' ? 'TOP_CENTER' : 'BOTTOM_CENTER'
      );
      
      console.log('✅ Banner ad shown');
    } catch (error) {
      console.error('❌ Banner ad error:', error);
    }
  }

  /**
   * Hide banner ad
   */
  async hideBanner(): Promise<void> {
    try {
      await UnityAds.Banner.hide();
      console.log('Banner ad hidden');
    } catch (error) {
      console.error('❌ Hide banner error:', error);
    }
  }

  // ==================== INTERSTITIAL ADS ====================

  /**
   * Load interstitial ad
   */
  private loadInterstitial(): void {
    try {
      console.log('📥 Loading interstitial ad...');

      const loadListener: UnityAdsLoadListener = {
        onUnityAdsAdLoaded: (placementId) => {
          console.log('✅ Interstitial ad loaded:', placementId);
          this.interstitialReady = true;
        },
        onUnityAdsFailedToLoad: (placementId, error, message) => {
          console.error('❌ Interstitial failed to load:', error, message);
          this.interstitialReady = false;
          
          // Retry after 30 seconds
          setTimeout(() => this.loadInterstitial(), 30000);
        },
      };

      UnityAds.load(UNITY_CONFIG.placements.interstitial, loadListener);
    } catch (error) {
      console.error('❌ Load interstitial error:', error);
    }
  }

  /**
   * Show interstitial ad
   */
  async showInterstitial(): Promise<void> {
    try {
      if (!this.initialized) {
        console.log('⚠️ Unity Ads not initialized');
        return;
      }

      if (!this.interstitialReady) {
        console.log('⚠️ Interstitial ad not ready, loading...');
        this.loadInterstitial();
        return;
      }

      console.log('📺 Showing interstitial ad...');

      const showListener: UnityAdsShowListener = {
        onUnityAdsShowComplete: (placementId, state) => {
          console.log('✅ Interstitial ad completed:', state);
          this.interstitialReady = false;
          this.loadInterstitial(); // Load next ad
        },
        onUnityAdsShowFailed: (placementId, error, message) => {
          console.error('❌ Interstitial show failed:', error, message);
          this.interstitialReady = false;
          this.loadInterstitial();
        },
        onUnityAdsShowStart: (placementId) => {
          console.log('▶️ Interstitial ad started');
        },
        onUnityAdsShowClick: (placementId) => {
          console.log('👆 Interstitial ad clicked');
        },
      };

      await UnityAds.show(UNITY_CONFIG.placements.interstitial, showListener);
    } catch (error) {
      console.error('❌ Show interstitial error:', error);
    }
  }

  /**
   * Check if interstitial is ready
   */
  isInterstitialReady(): boolean {
    return this.interstitialReady;
  }

  // ==================== REWARDED ADS ====================

  /**
   * Load rewarded ad
   */
  private loadRewarded(): void {
    try {
      console.log('📥 Loading rewarded ad...');

      const loadListener: UnityAdsLoadListener = {
        onUnityAdsAdLoaded: (placementId) => {
          console.log('✅ Rewarded ad loaded:', placementId);
          this.rewardedReady = true;
        },
        onUnityAdsFailedToLoad: (placementId, error, message) => {
          console.error('❌ Rewarded failed to load:', error, message);
          this.rewardedReady = false;
          
          // Retry after 30 seconds
          setTimeout(() => this.loadRewarded(), 30000);
        },
      };

      UnityAds.load(UNITY_CONFIG.placements.rewarded, loadListener);
    } catch (error) {
      console.error('❌ Load rewarded error:', error);
    }
  }

  /**
   * Show rewarded ad
   * @returns Promise<boolean> - true if user earned reward
   */
  async showRewarded(): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        if (!this.initialized) {
          console.log('⚠️ Unity Ads not initialized');
          resolve(false);
          return;
        }

        if (!this.rewardedReady) {
          console.log('⚠️ Rewarded ad not ready, loading...');
          this.loadRewarded();
          resolve(false);
          return;
        }

        console.log('🎁 Showing rewarded ad...');

        const showListener: UnityAdsShowListener = {
          onUnityAdsShowComplete: (placementId, state) => {
            console.log('✅ Rewarded ad completed:', state);
            this.rewardedReady = false;
            this.loadRewarded(); // Load next ad
            
            // User earned reward if they watched completely
            const earnedReward = state === 'COMPLETED';
            if (earnedReward) {
              console.log('🎉 User earned reward!');
            }
            resolve(earnedReward);
          },
          onUnityAdsShowFailed: (placementId, error, message) => {
            console.error('❌ Rewarded show failed:', error, message);
            this.rewardedReady = false;
            this.loadRewarded();
            resolve(false);
          },
          onUnityAdsShowStart: (placementId) => {
            console.log('▶️ Rewarded ad started');
          },
          onUnityAdsShowClick: (placementId) => {
            console.log('👆 Rewarded ad clicked');
          },
        };

        await UnityAds.show(UNITY_CONFIG.placements.rewarded, showListener);
      } catch (error) {
        console.error('❌ Show rewarded error:', error);
        resolve(false);
      }
    });
  }

  /**
   * Check if rewarded ad is ready
   */
  isRewardedReady(): boolean {
    return this.rewardedReady;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get Unity Ads SDK version
   */
  async getVersion(): Promise<string> {
    try {
      const version = await UnityAds.getVersion();
      console.log('Unity Ads SDK version:', version);
      return version;
    } catch (error) {
      console.error('❌ Get version error:', error);
      return 'unknown';
    }
  }

  /**
   * Set user consent for GDPR/CCPA
   */
  async setPrivacyConsent(hasConsent: boolean): Promise<void> {
    try {
      // Unity Ads handles privacy automatically
      // But you can implement custom logic here if needed
      console.log('Privacy consent set:', hasConsent);
    } catch (error) {
      console.error('❌ Set privacy consent error:', error);
    }
  }
}

// Export singleton instance
export const unityAdsManager = new UnityAdsManager();

// Export config for easy access
export const UNITY_ADS_CONFIG = UNITY_CONFIG;
