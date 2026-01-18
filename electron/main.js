const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const { startServer, stopServer } = require("../server");
const { checkAndInstallDependencies } = require("./utils/dependencies");
const { initAutoUpdater } = require("./utils/autoUpdater");

// Disable hardware acceleration for better compatibility
app.disableHardwareAcceleration();

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let server = null;
const PORT = 3001;
const isDev = process.env.NODE_ENV === "development";

// Get icon path that works in both dev and production
function getIconPath() {
  if (isDev) {
    return path.join(
      __dirname,
      "../client/public/Logo/ysnag-logo-original.png",
    );
  }
  // In production, icon is in the app resources
  return path.join(process.resourcesPath, "icon.png");
}

function createWindow() {
  console.log("[Electron] Creating window...");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "YSnag",
    icon: getIconPath(),
    backgroundColor: "#0a0a0a",
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Track if window has been shown
  let windowShown = false;

  const showWindow = () => {
    if (!windowShown && mainWindow && !mainWindow.isDestroyed()) {
      windowShown = true;
      console.log("[Electron] Showing window");
      mainWindow.show();
    }
  };

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    console.log("[Electron] Window ready to show");
    showWindow();
  });

  // Fallback: show window after page loads (for systems where ready-to-show doesn't fire)
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[Electron] Page loaded successfully");
    // Small delay to ensure rendering is complete
    setTimeout(showWindow, 100);
  });

  // Add error handling for page load
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error(
        `[Electron] Failed to load: ${errorCode} - ${errorDescription}`,
      );
      showWindow(); // Show window even on error so user sees something
    },
  );

  // Load the app
  if (isDev) {
    // Development: Load from Vite dev server
    console.log("[Electron] Loading dev server...");
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load built files
    const indexPath = path.join(__dirname, "../client/dist/index.html");
    console.log(`[Electron] Loading file: ${indexPath}`);
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error("[Electron] Failed to load file:", err);
      // Fallback: show window anyway with error
      showWindow();
    });
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Handle window close
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Remove menu bar (optional, keep for dev)
  if (!isDev) {
    mainWindow.setMenuBarVisibility(false);
  }
}

async function initialize() {
  console.log("[Electron] Initializing...");

  // Check and install dependencies (yt-dlp, ffmpeg)
  try {
    await checkAndInstallDependencies((message) => {
      console.log(`[Dependencies] ${message}`);
      // Send progress to renderer if window exists
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("dependency-progress", message);
      }
    });
  } catch (error) {
    console.error("[Dependencies] Failed to install:", error);
  }

  // Start the Express server
  try {
    server = startServer(PORT);
    console.log(`[Electron] Server started on port ${PORT}`);
  } catch (error) {
    console.error("[Electron] Failed to start server:", error);
  }

  // Create the main window
  createWindow();

  // Initialize auto-updater (only in production)
  if (!isDev) {
    initAutoUpdater(mainWindow);
  }
}

// App lifecycle events
app.whenReady().then(initialize);

app.on("second-instance", () => {
  // Someone tried to run a second instance, focus our window
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  // Stop server before quitting
  if (server) {
    stopServer(server);
  }
  app.quit();
});

app.on("activate", () => {
  // On macOS re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("get-platform", () => {
  return process.platform;
});

// Handle app info requests
ipcMain.handle("get-app-info", () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
    node: process.versions.node,
    isDev,
  };
});
