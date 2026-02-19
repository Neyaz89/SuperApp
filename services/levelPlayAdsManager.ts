import { 
  IronSource, 
  LevelPlay,
  LevelPlayInitListener,
  LevelPlayInitRequest,
  LevelPlayInitError,
  LevelPlayConfiguration,
  AdFormat
} from 'ironsource-mediation';

// Your ironSource App Key
const APP_KEY = '2549fce2d';

// Placement IDs from your setup
export const PLACEMENT_IDS = {
  BANNER_BOTTOM: 's9v9hfkefzda26ut',
  BANNER_PREVIEW: '8qln6wmtxc5tzhhi',
  INTERSTITIAL: 'ocllxnulp749s32x',
  REWARDED: '1c6x1u5pidvv5h8d',
};

class LevelPlayAdsManager {
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    return new Promise((resolve) => {
      const initListener: LevelPlayInitListener = {
        onInitSuccess: (configuration: LevelPlayConfiguration) => {
          console.log('LevelPlay initialized successfully', configuration);
          this.isInitialized = true;
          resolve(true);
        },
        onInitFailed: (error: LevelPlayInitError) => {
          console.error('LevelPlay initialization failed:', error);
          this.isInitialized = false;
          resolve(false);
        },
      };

      // Create init request with legacy ad formats
      const initRequest = LevelPlayInitRequest.builder(APP_KEY)
        .withLegacyAdFormats([AdFormat.BANNER, AdFormat.INTERSTITIAL, AdFormat.REWARDED])
        .build();

      LevelPlay.init(initRequest, initListener);
    });
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  // Enable test mode for debugging
  enableTestMode() {
    IronSource.setMetaData('is_test_suite', ['enable']);
  }

  // Launch test suite after init
  launchTestSuite() {
    if (this.isInitialized) {
      IronSource.launchTestSuite();
    }
  }

  // Enable adapter debug logs
  enableDebugLogs() {
    IronSource.setAdaptersDebug(true);
  }
}

export default new LevelPlayAdsManager();
