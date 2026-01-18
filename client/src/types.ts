export const API_URL = "http://localhost:3001";

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  durationString: string;
  uploader: string;
  viewCount: number;
  formats: Format[];
}

export interface Format {
  formatId: string;
  ext: string;
  resolution: string;
  fps: number;
  filesize: number;
  quality: number;
  formatNote: string;
}

export interface Settings {
  downloadPath: string;
  browserForCookies: string;
  browserAutoDetected?: boolean;
  cookieFilePath?: string;
  videoFormat?: string;
  autoCheckUpdates?: boolean;
}

export interface CookieStatus {
  hasCookies: boolean;
  needsLogin: boolean;
  cookieError?: boolean;
  message: string;
  checking: boolean;
  checkedBrowser?: string;
}

export const SUPPORTED_VIDEO_FORMATS = [
  {
    value: "mkv",
    label: "MKV",
    description: "Best compatibility (recommended)",
  },
  { value: "mp4", label: "MP4", description: "Universal format" },
  { value: "webm", label: "WebM", description: "Web-optimized format" },
];

export interface HistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  uploader: string;
  duration: number;
  audioOnly: boolean;
  format: string;
  downloadedAt: string;
  filePath: string;
}

export interface FolderBrowser {
  current: string;
  parent: string;
  folders: { name: string; path: string }[];
}

export const SUPPORTED_BROWSERS = [
  { value: "none", label: "None (No cookies)", icon: "none" },
  { value: "firefox", label: "Firefox", icon: "firefox" },
  { value: "chrome", label: "Chrome", icon: "chrome" },
  { value: "chromium", label: "Chromium", icon: "chrome" },
  { value: "edge", label: "Edge", icon: "edge" },
  { value: "opera", label: "Opera", icon: "opera" },
  { value: "brave", label: "Brave", icon: "brave" },
  { value: "vivaldi", label: "Vivaldi", icon: "chrome" },
  { value: "safari", label: "Safari", icon: "safari" },
];

export type Tab = "download" | "history" | "settings" | "info" | "about";

// Queue item status
export type QueueItemStatus =
  | "fetching"
  | "ready"
  | "queued"
  | "downloading"
  | "complete"
  | "error"
  | "cancelled";

// Queue item for download queue
export interface QueueItem {
  queueId: string;
  url: string;
  videoInfo: VideoInfo | null;
  status: QueueItemStatus;
  selectedFormat: string;
  audioOnly: boolean;
  progress: number;
  statusMessage: string;
  error: string | null;
  downloadId: string | null;
  isPlaylist?: boolean;
}

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (!bytes) return "Unknown";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const formatViews = (views: number): string => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return `${views}`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
