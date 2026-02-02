import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export type DownloadProgress = {
  progress: number;
  totalBytes: number;
  downloadedBytes: number;
};

export class MediaDownloader {
  private downloadResumable: FileSystem.DownloadResumable | null = null;

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

      const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        onProgress?.({
          progress: progress * 100,
          totalBytes: downloadProgress.totalBytesExpectedToWrite,
          downloadedBytes: downloadProgress.totalBytesWritten,
        });
      };

      this.downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        callback
      );

      const result = await this.downloadResumable.downloadAsync();
      
      if (!result) {
        throw new Error('Download failed');
      }

      const asset = await MediaLibrary.createAssetAsync(result.uri);
      await MediaLibrary.createAlbumAsync('SuperApp', asset, false);

      return result.uri;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  async pauseDownload(): Promise<FileSystem.DownloadPauseState | null> {
    if (this.downloadResumable) {
      return await this.downloadResumable.pauseAsync();
    }
    return null;
  }

  async resumeDownload(): Promise<void> {
    if (this.downloadResumable) {
      await this.downloadResumable.resumeAsync();
    }
  }

  async cancelDownload(): Promise<void> {
    if (this.downloadResumable) {
      await this.downloadResumable.cancelAsync();
      this.downloadResumable = null;
    }
  }
}

export const mediaDownloader = new MediaDownloader();
