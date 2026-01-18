// Electron API types for TypeScript
// This file declares the types for the electron bridge exposed via preload.js

export interface UpdateStatus {
  status:
    | "checking"
    | "available"
    | "not-available"
    | "downloading"
    | "downloaded"
    | "error";
  data?: {
    version?: string;
    percent?: number;
    message?: string;
  };
}

export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  getAppInfo: () => Promise<{
    version: string;
    platform: string;
    arch: string;
    electron: string;
    node: string;
    isDev: boolean;
  }>;
  onDependencyProgress: (callback: (message: string) => void) => void;

  // Auto-update functions
  checkForUpdates: () => Promise<{ status: string; result?: unknown }>;
  downloadUpdate: () => Promise<{ status: string; message?: string }>;
  installUpdate: () => void;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => void;

  // Language sync for updater dialogs
  setLanguage: (lang: string) => Promise<string>;
  getLanguage: () => Promise<string>;

  isElectron: boolean;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

// Helper to check if running in Electron
export const isElectron = (): boolean => {
  return (
    typeof window !== "undefined" &&
    window.electron !== undefined &&
    window.electron.isElectron === true
  );
};
