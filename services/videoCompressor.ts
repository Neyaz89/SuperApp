import { Video } from 'react-native-compressor';

export type CompressionQuality = 'low' | 'medium' | 'high';

export interface CompressionProgress {
  progress: number; // 0-100
}

export class VideoCompressor {
  private static instance: VideoCompressor;

  private constructor() {}

  static getInstance(): VideoCompressor {
    if (!VideoCompressor.instance) {
      VideoCompressor.instance = new VideoCompressor();
    }
    return VideoCompressor.instance;
  }

  /**
   * Compress a video file
   * @param videoUri - URI of the video to compress
   * @param quality - Compression quality (low, medium, high)
   * @param onProgress - Callback for progress updates
   * @returns URI of the compressed video
   */
  async compressVideo(
    videoUri: string,
    quality: CompressionQuality = 'medium',
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      console.log('🎬 Starting video compression...');
      console.log('Input:', videoUri);
      console.log('Quality:', quality);

      const compressionOptions = this.getCompressionOptions(quality);

      const compressedUri = await Video.compress(
        videoUri,
        {
          ...compressionOptions,
          progressDivider: 10, // Update progress every 10%
        },
        (progress) => {
          const progressPercent = Math.round(progress * 100);
          console.log(`Compression progress: ${progressPercent}%`);
          if (onProgress) {
            onProgress(progressPercent);
          }
        }
      );

      console.log('✅ Compression complete!');
      console.log('Output:', compressedUri);

      return compressedUri;
    } catch (error) {
      console.error('❌ Compression failed:', error);
      throw new Error(`Video compression failed: ${error}`);
    }
  }

  /**
   * Get compression options based on quality setting
   */
  private getCompressionOptions(quality: CompressionQuality) {
    switch (quality) {
      case 'low':
        return {
          compressionMethod: 'auto' as const,
          bitrate: 500000, // 500 kbps - very small file
          maxSize: 1920,
        };
      case 'medium':
        return {
          compressionMethod: 'auto' as const,
          bitrate: 1000000, // 1 Mbps - balanced
          maxSize: 1920,
        };
      case 'high':
        return {
          compressionMethod: 'auto' as const,
          bitrate: 2000000, // 2 Mbps - good quality
          maxSize: 1920,
        };
      default:
        return {
          compressionMethod: 'auto' as const,
          bitrate: 1000000,
          maxSize: 1920,
        };
    }
  }

  /**
   * Get estimated compression ratio
   */
  getEstimatedCompressionRatio(quality: CompressionQuality): number {
    switch (quality) {
      case 'low':
        return 0.3; // 70% reduction
      case 'medium':
        return 0.5; // 50% reduction
      case 'high':
        return 0.7; // 30% reduction
      default:
        return 0.5;
    }
  }
}

export const videoCompressor = VideoCompressor.getInstance();
