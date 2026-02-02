import { downloadAsync } from 'expo-file-system/legacy';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export type DownloadProgress = {
  progress: number;
  totalBytes: number;
  downloadedBytes: number;
};

export class MediaDownloader {
  async downloadMedia(
    url: string,
    filename: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission not granted');
      }

      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // Use legacy API
      const downloadResult = await downloadAsync(
        url,
        fileUri,
        {
          progressCallback: (downloadProgress) => {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            onProgress?.({
              progress: progress * 100,
              totalBytes: downloadProgress.totalBytesExpectedToWrite,
              downloadedBytes: downloadProgress.totalBytesWritten,
            });
          }
        }
      );

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      
      try {
        await MediaLibrary.createAlbumAsync('SuperApp', asset, false);
      } catch (e) {
        // Album might already exist
        const album = await MediaLibrary.getAlbumAsync('SuperApp');
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      }

      return downloadResult.uri;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
}

export const mediaDownloader = new MediaDownloader();
