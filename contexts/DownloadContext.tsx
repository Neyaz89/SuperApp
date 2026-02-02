import React, { createContext, useContext, useState } from 'react';

type QualityOption = {
  quality: string;
  format: string;
  size: string;
  url: string;
};

type MediaInfo = {
  url: string;
  platform: string;
  title: string;
  thumbnail: string;
  duration: string;
  qualities: QualityOption[];
  audioFormats: QualityOption[];
};

type SelectedQuality = QualityOption & {
  type: 'video' | 'audio';
};

type DownloadedFile = {
  uri: string;
  type: 'video' | 'audio';
  quality: string;
  format: string;
};

type DownloadContextType = {
  mediaInfo: MediaInfo | null;
  setMediaInfo: (info: MediaInfo) => void;
  selectedQuality: SelectedQuality | null;
  setSelectedQuality: (quality: SelectedQuality) => void;
  downloadedFile: DownloadedFile | null;
  setDownloadedFile: (file: DownloadedFile) => void;
};

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<SelectedQuality | null>(null);
  const [downloadedFile, setDownloadedFile] = useState<DownloadedFile | null>(null);

  return (
    <DownloadContext.Provider
      value={{
        mediaInfo,
        setMediaInfo,
        selectedQuality,
        setSelectedQuality,
        downloadedFile,
        setDownloadedFile,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownload() {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownload must be used within DownloadProvider');
  }
  return context;
}
