const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld("electron", {
  // App info
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getPlatform: () => ipcRenderer.invoke("get-platform"),
  getAppInfo: () => ipcRenderer.invoke("get-app-info"),

  // Dependency progress listener
  onDependencyProgress: (callback) => {
    ipcRenderer.on("dependency-progress", (_event, message) =>
      callback(message),
    );
  },

  // Auto-update functions
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  onUpdateStatus: (callback) => {
    ipcRenderer.on("update-status", (_event, status) => callback(status));
  },

  // Language sync for native dialogs
  setLanguage: (lang) => ipcRenderer.invoke("set-language", lang),
  getLanguage: () => ipcRenderer.invoke("get-language"),

  // Check if running in Electron
  isElectron: true,
});
