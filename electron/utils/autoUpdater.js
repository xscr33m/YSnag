const { autoUpdater } = require("electron-updater");
const { ipcMain, dialog, app } = require("electron");
const log = require("electron-log");

let updateCheckInProgress = false;
let isManualCheck = false; // Track if update check was triggered manually
let currentLanguage = "en"; // Default language

// Configure electron-log
log.transports.file.level = "info";
log.transports.console.level = "info";

// Fetch settings from local server to check autoCheckUpdates
async function shouldAutoCheckUpdates() {
  try {
    const http = require("http");
    return new Promise((resolve) => {
      const req = http.get("http://localhost:3001/api/settings", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const settings = JSON.parse(data);
            // Default to true if setting doesn't exist
            resolve(settings.autoCheckUpdates !== false);
          } catch {
            resolve(true);
          }
        });
      });
      req.on("error", () => resolve(true)); // Default to true on error
      req.setTimeout(3000, () => {
        req.destroy();
        resolve(true);
      });
    });
  } catch {
    return true;
  }
}

// Translation strings for updater dialogs
const translations = {
  en: {
    available: {
      title: "Update Available",
      message: (version) =>
        `A new version (${version}) is available. Would you like to download it now?`,
      yes: "Yes",
      no: "No",
    },
    downloaded: {
      title: "Update Ready",
      message: (version) =>
        `Version ${version} has been downloaded. The application will now restart to install the update.`,
      ok: "OK",
    },
    downloading: {
      title: "Downloading Update",
      message: (percent) => `Downloading update... ${percent}%`,
    },
    error: {
      title: "Update Error",
      message: (error) => `Failed to download update: ${error}`,
      ok: "OK",
    },
    checking: "Checking for updates...",
    noUpdate: "You are using the latest version.",
  },
  de: {
    available: {
      title: "Update verfügbar",
      message: (version) =>
        `Eine neue Version (${version}) ist verfügbar. Möchten Sie sie jetzt herunterladen?`,
      yes: "Ja",
      no: "Nein",
    },
    downloaded: {
      title: "Update bereit",
      message: (version) =>
        `Version ${version} wurde heruntergeladen. Die Anwendung wird jetzt neu gestartet, um das Update zu installieren.`,
      ok: "OK",
    },
    downloading: {
      title: "Update wird heruntergeladen",
      message: (percent) => `Update wird heruntergeladen... ${percent}%`,
    },
    error: {
      title: "Update-Fehler",
      message: (error) => `Update-Download fehlgeschlagen: ${error}`,
      ok: "OK",
    },
    checking: "Suche nach Updates...",
    noUpdate: "Sie verwenden die neueste Version.",
  },
};

// Get current translation based on language
function t() {
  return translations[currentLanguage] || translations.en;
}

function initAutoUpdater(mainWindow) {
  // Configure auto-updater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Use electron-log for auto-updater logging
  autoUpdater.logger = log;

  log.info("[AutoUpdater] Initializing auto-updater...");
  log.info("[AutoUpdater] Current version:", app.getVersion());

  // IPC handler for language sync
  ipcMain.handle("set-language", (_event, lang) => {
    // Extract base language (e.g., "de-DE" -> "de")
    const baseLang = lang.split("-")[0].toLowerCase();
    currentLanguage = translations[baseLang] ? baseLang : "en";
    log.info(`[AutoUpdater] Language set to: ${currentLanguage}`);
    return currentLanguage;
  });

  ipcMain.handle("get-language", () => {
    return currentLanguage;
  });

  // Log events
  autoUpdater.on("checking-for-update", () => {
    log.info("[AutoUpdater] Checking for updates...");
    sendStatusToWindow(mainWindow, "checking");
  });

  autoUpdater.on("update-available", (info) => {
    log.info("[AutoUpdater] Update available:", info.version);
    log.info("[AutoUpdater] Release info:", JSON.stringify(info, null, 2));
    sendStatusToWindow(mainWindow, "available", info);

    const trans = t();

    // Ask user if they want to download
    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        title: trans.available.title,
        message: trans.available.message(info.version),
        buttons: [trans.available.yes, trans.available.no],
        defaultId: 0,
        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          log.info("[AutoUpdater] User accepted update, starting download...");
          autoUpdater.downloadUpdate().catch((err) => {
            log.error("[AutoUpdater] Download failed:", err);
            const trans = t();
            dialog.showMessageBox(mainWindow, {
              type: "error",
              title: trans.error.title,
              message: trans.error.message(err.message),
              buttons: [trans.error.ok],
            });
          });
        } else {
          log.info("[AutoUpdater] User declined update");
        }
      });
  });

  autoUpdater.on("update-not-available", (info) => {
    log.info("[AutoUpdater] No update available");
    sendStatusToWindow(mainWindow, "not-available", info);

    // Show dialog only for manual checks
    if (isManualCheck) {
      const trans = t();
      dialog.showMessageBox(mainWindow, {
        type: "info",
        title: trans.available.title,
        message: trans.noUpdate,
        buttons: ["OK"],
      });
      isManualCheck = false;
    }
  });

  autoUpdater.on("download-progress", (progress) => {
    log.info(
      `[AutoUpdater] Download progress: ${progress.percent.toFixed(1)}%`,
    );
    sendStatusToWindow(mainWindow, "downloading", progress);
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("[AutoUpdater] Update downloaded:", info.version);
    sendStatusToWindow(mainWindow, "downloaded", info);

    const trans = t();

    // Notify user and restart to install
    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        title: trans.downloaded.title,
        message: trans.downloaded.message(info.version),
        buttons: [trans.downloaded.ok],
        defaultId: 0,
      })
      .then(() => {
        log.info("[AutoUpdater] Installing update and restarting...");
        // On Linux AppImage: quitAndInstall will replace the AppImage and restart
        // On Windows NSIS: quitAndInstall will run the installer
        setImmediate(() => {
          autoUpdater.quitAndInstall(false, true);
        });
      });
  });

  autoUpdater.on("error", (error) => {
    log.error("[AutoUpdater] Error:", error);
    sendStatusToWindow(mainWindow, "error", { message: error.message });

    // For manual checks, show "no updates" instead of error message
    // This handles cases like 404 when repo is private
    if (isManualCheck) {
      const trans = t();
      dialog.showMessageBox(mainWindow, {
        type: "info",
        title: trans.available.title,
        message: trans.noUpdate,
        buttons: ["OK"],
      });
      isManualCheck = false;
    }
  });

  // IPC handlers for manual update checks
  ipcMain.handle("check-for-updates", async () => {
    if (updateCheckInProgress) {
      return { status: "already-checking" };
    }

    try {
      updateCheckInProgress = true;
      isManualCheck = true; // Mark this as a manual check to show "no update" dialog
      const result = await autoUpdater.checkForUpdates();
      return { status: "success", result };
    } catch (error) {
      isManualCheck = false;
      return { status: "error", message: error.message };
    } finally {
      updateCheckInProgress = false;
    }
  });

  ipcMain.handle("download-update", async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { status: "success" };
    } catch (error) {
      return { status: "error", message: error.message };
    }
  });

  ipcMain.handle("install-update", () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // Check for updates on startup (after a delay to allow language sync)
  // Respects the autoCheckUpdates setting
  setTimeout(async () => {
    const shouldCheck = await shouldAutoCheckUpdates();
    if (shouldCheck) {
      log.info("[AutoUpdater] Starting automatic update check...");
      // Ensure isManualCheck is false so errors are suppressed for automatic checks
      isManualCheck = false;
      autoUpdater.checkForUpdates().catch((err) => {
        // Silently log errors for automatic checks (e.g., 404 when repo is private)
        log.warn(
          "[AutoUpdater] Startup check failed (this is normal if repo is private):",
          err.message,
        );
      });
    } else {
      log.info("[AutoUpdater] Automatic update check disabled by user setting");
    }
  }, 5000);
}

function sendStatusToWindow(mainWindow, status, data = null) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update-status", { status, data });
  }
}

module.exports = { initAutoUpdater };
