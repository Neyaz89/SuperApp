import { downloadAsync } from 'expo-file-system/legacy';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export type DownloadProgress = {
  progress: number;
  totalBytes: number;
  downloadedBytes: number;
};

// Render API URL
const PROXY_API_URL = 'https://superapp-api-d3y5.onrender.com/api/download-proxy';

export class MediaDownloader {
  async downloadMedia(
    url: string,
    filename: string,
    onProgress?: (progress: DownloadProgress) => void,
    needsProxy?: boolean,
    referer?: string
  ): Promise<string> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission not granted');
      }

      // Use proxy for URLs that need it (adult sites, auth-required sites)
      let downloadUrl = url;
      if (needsProxy) {
        console.log('🔄 Using download proxy for:', url);
        downloadUrl = `${PROXY_API_URL}?url=${encodeURIComponent(url)}${referer ? `&referer=${encodeURIComponent(referer)}` : ''}`;
      }

      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      console.log('⬇️ Starting download:', needsProxy ? 'via proxy' : 'direct');

      // Use legacy API
      const downloadResult = await downloadAsync(
        downloadUrl,
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

      console.log('✅ Download complete, saving to gallery...');

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

      console.log('✅ Saved to gallery successfully');

      return downloadResult.uri;
    } catch (error) {
      console.error('❌ Download error:', error);
      throw error;
    }
  }
}

export const mediaDownloader = new MediaDownloader();
