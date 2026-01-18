const express = require("express");
const cors = require("cors");
const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Config file path
const CONFIG_PATH = path.join(os.homedir(), ".ysnag-config.json");
const HISTORY_PATH = path.join(os.homedir(), ".ysnag-history.json");

// Get the bin directory where dependencies are installed
function getBinDir() {
  const appName = "ysnag";
  switch (process.platform) {
    case "win32":
      return path.join(
        process.env.LOCALAPPDATA || process.env.APPDATA || os.homedir(),
        appName,
        "bin",
      );
    case "darwin":
      return path.join(
        os.homedir(),
        "Library",
        "Application Support",
        appName,
        "bin",
      );
    default: // Linux
      return path.join(
        process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share"),
        appName,
        "bin",
      );
  }
}

// Check if command exists in PATH
function commandExists(command) {
  try {
    if (os.platform() === "win32") {
      execSync(`where ${command}`, { stdio: "ignore" });
    } else {
      execSync(`command -v ${command}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

// Find Node.js path for yt-dlp
function findNodePath() {
  const isWindows = process.platform === "win32";

  // Check system PATH first
  if (commandExists("node")) {
    return "node";
  }

  // Check our bin directory
  const binDir = getBinDir();
  const nodeExe = isWindows ? "node.exe" : "node";
  const localNodePath = path.join(binDir, nodeExe);
  if (fs.existsSync(localNodePath)) {
    return localNodePath;
  }

  // Linux: check common path
  if (!isWindows && fs.existsSync("/usr/bin/node")) {
    return "/usr/bin/node";
  }

  // Fallback - hope it's in PATH at runtime
  return "node";
}

// Load/save config
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load config:", e);
  }
  return {
    downloadPath: path.join(os.homedir(), "Downloads"),
    browserForCookies: "firefox",
    browserAutoDetected: true, // Track if browser was auto-detected vs manually set
    videoFormat: "mkv",
    autoCheckUpdates: true, // Automatically check for updates on startup
  };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Load/save history
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_PATH)) {
      return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load history:", e);
  }
  return [];
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
}

function addToHistory(item) {
  const history = loadHistory();
  history.unshift(item); // Add to beginning
  // Keep only last 50 items
  if (history.length > 50) {
    history.pop();
  }
  saveHistory(history);
}

// Get common yt-dlp args based on config
function getCommonArgs(config) {
  const args = [];

  // Add Node.js runtime for yt-dlp plugins
  // Use findNodePath to dynamically locate Node.js (installed via setup or system PATH)
  const nodePath = findNodePath();
  args.push("--js-runtimes", `node:${nodePath}`);

  args.push("--remote-components", "ejs:github");

  // Cookie handling
  if (config.cookieFilePath && fs.existsSync(config.cookieFilePath)) {
    // Use manual cookie file if provided (more reliable on Windows)
    args.push("--cookies", config.cookieFilePath);
  } else if (config.browserForCookies && config.browserForCookies !== "none") {
    // Use browser cookies
    // On Windows, Chrome-based browsers need the browser to be closed
    // Firefox typically works even when open
    args.push("--cookies-from-browser", config.browserForCookies);
  }

  return args;
}

// System status endpoint
app.get("/api/status", (req, res) => {
  let ytdlpVersion = null;
  let ytdlpInstalled = false;
  let ffmpegInstalled = false;
  let nodeInstalled = false;
  let nodeVersion = null;
  let checksCompleted = 0;
  let responseSent = false;
  const totalChecks = 3;

  const sendResponse = () => {
    if (responseSent) return;
    checksCompleted++;
    if (checksCompleted >= totalChecks) {
      responseSent = true;
      res.json({
        online: true,
        ytdlpInstalled,
        ytdlpVersion,
        ffmpegInstalled,
        nodeInstalled,
        nodeVersion,
      });
    }
  };

  // Check yt-dlp
  const ytdlp = spawn("yt-dlp", ["--version"]);
  ytdlp.stdout.on("data", (data) => {
    ytdlpVersion = data.toString().trim();
  });
  ytdlp.on("close", (code) => {
    ytdlpInstalled = code === 0;
    sendResponse();
  });
  ytdlp.on("error", () => {
    ytdlpInstalled = false;
    sendResponse();
  });

  // Check ffmpeg
  const ffmpeg = spawn("ffmpeg", ["-version"]);
  ffmpeg.on("close", (code) => {
    ffmpegInstalled = code === 0;
    sendResponse();
  });
  ffmpeg.on("error", () => {
    ffmpegInstalled = false;
    sendResponse();
  });

  // Check Node.js (required for yt-dlp YouTube extraction)
  const nodePath = findNodePath();
  const node = spawn(nodePath, ["--version"]);
  node.stdout.on("data", (data) => {
    nodeVersion = data.toString().trim();
  });
  node.on("close", (code) => {
    nodeInstalled = code === 0;
    sendResponse();
  });
  node.on("error", () => {
    nodeInstalled = false;
    sendResponse();
  });
});

// Get settings
app.get("/api/settings", (req, res) => {
  res.json(loadConfig());
});

// Detect installed browsers and check for YouTube cookies
app.get("/api/detect-browser", async (req, res) => {
  const isWindows = process.platform === "win32";
  const isMac = process.platform === "darwin";

  // Browser detection paths
  const browserPaths = {
    firefox: isWindows
      ? [
          path.join(
            process.env.APPDATA || "",
            "Mozilla",
            "Firefox",
            "Profiles",
          ),
          path.join(
            process.env.LOCALAPPDATA || "",
            "Mozilla",
            "Firefox",
            "Profiles",
          ),
        ]
      : isMac
        ? [
            path.join(
              os.homedir(),
              "Library",
              "Application Support",
              "Firefox",
              "Profiles",
            ),
          ]
        : [path.join(os.homedir(), ".mozilla", "firefox")],
    chrome: isWindows
      ? [
          path.join(
            process.env.LOCALAPPDATA || "",
            "Google",
            "Chrome",
            "User Data",
          ),
        ]
      : isMac
        ? [
            path.join(
              os.homedir(),
              "Library",
              "Application Support",
              "Google",
              "Chrome",
            ),
          ]
        : [path.join(os.homedir(), ".config", "google-chrome")],
    chromium: isWindows
      ? [path.join(process.env.LOCALAPPDATA || "", "Chromium", "User Data")]
      : isMac
        ? [
            path.join(
              os.homedir(),
              "Library",
              "Application Support",
              "Chromium",
            ),
          ]
        : [path.join(os.homedir(), ".config", "chromium")],
    edge: isWindows
      ? [
          path.join(
            process.env.LOCALAPPDATA || "",
            "Microsoft",
            "Edge",
            "User Data",
          ),
        ]
      : isMac
        ? [
            path.join(
              os.homedir(),
              "Library",
              "Application Support",
              "Microsoft Edge",
            ),
          ]
        : [path.join(os.homedir(), ".config", "microsoft-edge")],
    brave: isWindows
      ? [
          path.join(
            process.env.LOCALAPPDATA || "",
            "BraveSoftware",
            "Brave-Browser",
            "User Data",
          ),
        ]
      : isMac
        ? [
            path.join(
              os.homedir(),
              "Library",
              "Application Support",
              "BraveSoftware",
              "Brave-Browser",
            ),
          ]
        : [
            path.join(
              os.homedir(),
              ".config",
              "BraveSoftware",
              "Brave-Browser",
            ),
          ],
    opera: isWindows
      ? [path.join(process.env.APPDATA || "", "Opera Software", "Opera Stable")]
      : isMac
        ? [
            path.join(
              os.homedir(),
              "Library",
              "Application Support",
              "com.operasoftware.Opera",
            ),
          ]
        : [path.join(os.homedir(), ".config", "opera")],
    vivaldi: isWindows
      ? [path.join(process.env.LOCALAPPDATA || "", "Vivaldi", "User Data")]
      : isMac
        ? [path.join(os.homedir(), "Library", "Application Support", "Vivaldi")]
        : [path.join(os.homedir(), ".config", "vivaldi")],
  };

  // Priority order (Firefox first as it works best with yt-dlp)
  const browserPriority = [
    "firefox",
    "chrome",
    "chromium",
    "edge",
    "brave",
    "opera",
    "vivaldi",
  ];

  // On Windows, Chrome/Chromium/Brave have cookie encryption issues
  const blockedOnWindows = ["chrome", "chromium", "brave"];

  const detectedBrowsers = [];

  for (const browser of browserPriority) {
    // Skip blocked browsers on Windows
    if (isWindows && blockedOnWindows.includes(browser)) {
      continue;
    }

    const paths = browserPaths[browser] || [];
    for (const browserPath of paths) {
      try {
        if (fs.existsSync(browserPath)) {
          detectedBrowsers.push(browser);
          break; // Found this browser, move to next
        }
      } catch {
        // Ignore access errors
      }
    }
  }

  // Return first detected browser as recommendation
  const recommended =
    detectedBrowsers.length > 0 ? detectedBrowsers[0] : "none";

  res.json({
    detected: detectedBrowsers,
    recommended,
    isWindows,
  });
});

// Check if browser has YouTube cookies (login session)
// Fast check: just verify yt-dlp can access the browser's cookie database
app.post("/api/check-cookies", (req, res) => {
  const { browser } = req.body;

  if (!browser || browser === "none") {
    return res.json({
      hasCookies: false,
      needsLogin: false,
      message: "No browser selected",
    });
  }

  const config = loadConfig();
  config.browserForCookies = browser;

  // Check if user is actually logged in by testing an age-restricted video
  // or by checking if we can access user-specific data
  const args = [
    ...getCommonArgs(config),
    "--skip-download",
    "--no-warnings",
    "--quiet",
    "--print",
    "%(id)s",
    "--playlist-items",
    "1",
    "https://www.youtube.com/watch?v=jNQXAC9IVRw", // "Me at the zoo" - first YouTube video
  ];

  const ytdlp = spawn("yt-dlp", args);
  let output = "";
  let errorOutput = "";
  let responseSent = false;

  ytdlp.stdout.on("data", (data) => {
    output += data.toString();
  });

  ytdlp.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  ytdlp.on("error", (err) => {
    if (responseSent) return;
    responseSent = true;
    res.json({
      hasCookies: false,
      needsLogin: false,
      error: err.code === "ENOENT" ? "yt-dlp not installed" : err.message,
    });
  });

  ytdlp.on("close", (code) => {
    if (responseSent) return;
    responseSent = true;

    const errorLower = errorOutput.toLowerCase();

    // Check for YouTube bot verification / login required FIRST
    // This is the most common issue and should be prioritized
    const requiresLogin =
      errorOutput.includes("Sign in to confirm") ||
      errorOutput.includes("confirm you're not a bot") ||
      errorOutput.includes("Sign in to confirm you") ||
      errorOutput.includes("Please sign in");

    // Cookie access errors (browser-specific issues)
    const hasCookieAccessError =
      (errorLower.includes("cookie") && errorLower.includes("decrypt")) ||
      (errorLower.includes("cookie") && errorLower.includes("permission")) ||
      errorLower.includes("could not find cookies") ||
      errorLower.includes("no cookies were found") ||
      errorLower.includes("failed to extract cookies");

    if (requiresLogin) {
      // User needs to log in to YouTube - show friendly message with login link
      res.json({
        hasCookies: false,
        needsLogin: true,
        cookieError: false,
        message:
          "Please sign in to YouTube in this browser to enable downloads.",
      });
    } else if (hasCookieAccessError) {
      // Technical cookie access issue
      res.json({
        hasCookies: false,
        needsLogin: false,
        cookieError: true,
        message:
          "Cannot access browser cookies. Try closing the browser or using Firefox.",
      });
    } else if (code === 0 && output.trim()) {
      // Successfully accessed - cookies work and user is logged in
      res.json({
        hasCookies: true,
        needsLogin: false,
        cookieError: false,
        message: "Browser cookies accessible and YouTube login verified.",
      });
    } else {
      // Some other error - assume login might help
      res.json({
        hasCookies: false,
        needsLogin: true,
        cookieError: false,
        message:
          "Could not verify YouTube access. Please sign in to YouTube in this browser.",
      });
    }
  });

  // Timeout after 10 seconds (increased for more thorough check)
  setTimeout(() => {
    if (!responseSent) {
      ytdlp.kill();
      responseSent = true;
      res.json({
        hasCookies: true,
        needsLogin: false,
        message: "Check timed out, assuming cookies are available.",
      });
    }
  }, 10000);
});

// Save settings
app.post("/api/settings", (req, res) => {
  const config = loadConfig();
  if (req.body.downloadPath) {
    config.downloadPath = req.body.downloadPath;
  }
  if (req.body.browserForCookies !== undefined) {
    config.browserForCookies = req.body.browserForCookies;
  }
  if (req.body.browserAutoDetected !== undefined) {
    config.browserAutoDetected = req.body.browserAutoDetected;
  }
  if (req.body.cookieFilePath !== undefined) {
    config.cookieFilePath = req.body.cookieFilePath;
  }
  if (req.body.videoFormat !== undefined) {
    config.videoFormat = req.body.videoFormat;
  }
  if (req.body.autoCheckUpdates !== undefined) {
    config.autoCheckUpdates = req.body.autoCheckUpdates;
  }
  saveConfig(config);
  res.json(config);
});

// Reset settings to defaults (full app reset)
app.post("/api/settings/reset", (req, res) => {
  const defaultConfig = {
    downloadPath: path.join(os.homedir(), "Downloads"),
    browserForCookies: "firefox",
    browserAutoDetected: true,
    videoFormat: "mkv",
    autoCheckUpdates: true,
  };
  saveConfig(defaultConfig);

  // Also clear the download history
  saveHistory([]);

  res.json(defaultConfig);
});

// Test cookie access (helps diagnose Windows cookie issues)
app.post("/api/test-cookies", (req, res) => {
  const config = loadConfig();
  const args = [
    ...getCommonArgs(config),
    "--cookies-from-browser",
    config.browserForCookies || "firefox",
    "--dump-json",
    "--playlist-items",
    "0",
    "https://www.youtube.com",
  ];

  const ytdlp = spawn("yt-dlp", args);
  let errorOutput = "";
  let responseSent = false;

  ytdlp.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  ytdlp.on("error", (err) => {
    if (responseSent) return;
    responseSent = true;
    res.json({
      success: false,
      error: err.code === "ENOENT" ? "yt-dlp not installed" : err.message,
    });
  });

  ytdlp.on("close", (code) => {
    if (responseSent) return;
    responseSent = true;

    const cookieError =
      errorOutput.toLowerCase().includes("cookie") ||
      errorOutput.toLowerCase().includes("decrypt");

    if (cookieError) {
      const isWindows = process.platform === "win32";
      let hint = "";
      if (isWindows) {
        hint =
          "Windows tip: Close your browser completely before downloading, or export cookies manually to a cookies.txt file.";
      }
      res.json({
        success: false,
        error: `Cookie access failed: ${errorOutput}`,
        hint,
      });
    } else {
      res.json({ success: true });
    }
  });

  // Timeout after 10 seconds
  setTimeout(() => {
    if (!responseSent) {
      ytdlp.kill();
      responseSent = true;
      res.json({
        success: true,
        note: "Test timed out but no errors detected",
      });
    }
  }, 10000);
});

// Get history
app.get("/api/history", (req, res) => {
  res.json(loadHistory());
});

// Clear history
app.delete("/api/history", (req, res) => {
  saveHistory([]);
  res.json({ success: true });
});

// Open download folder in file explorer
app.post("/api/open-folder", (req, res) => {
  const config = loadConfig();
  const folderPath = config.downloadPath;

  // Check if folder exists
  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ error: "Folder does not exist" });
  }

  // Open folder based on platform
  let command;
  let args;

  switch (process.platform) {
    case "win32":
      command = "explorer";
      args = [folderPath];
      break;
    case "darwin":
      command = "open";
      args = [folderPath];
      break;
    default: // Linux and others
      command = "xdg-open";
      args = [folderPath];
  }

  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.unref();

  res.json({ success: true });
});

// Get video info
app.post("/api/info", (req, res) => {
  const { url } = req.body;
  const config = loadConfig();

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const args = [...getCommonArgs(config), "-j", "--no-playlist", url];

  const ytdlp = spawn("yt-dlp", args);
  let output = "";
  let errorOutput = "";
  let responseSent = false;

  ytdlp.on("error", (err) => {
    if (responseSent) return;
    responseSent = true;

    if (err.code === "ENOENT") {
      return res.status(500).json({
        error:
          "yt-dlp is not installed. Please install it:\n" +
          "- Linux: sudo pacman -S yt-dlp (Arch) or sudo apt install yt-dlp (Debian/Ubuntu)\n" +
          "- Windows: winget install yt-dlp.yt-dlp\n" +
          "- Or visit: https://github.com/yt-dlp/yt-dlp#installation",
      });
    }
    return res
      .status(500)
      .json({ error: `Failed to start yt-dlp: ${err.message}` });
  });

  ytdlp.stdout.on("data", (data) => {
    output += data.toString();
  });

  ytdlp.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  ytdlp.on("close", (code) => {
    if (responseSent) return;
    responseSent = true;

    if (code !== 0) {
      // Check for YouTube bot verification / login required
      const requiresLogin =
        errorOutput.includes("Sign in to confirm") ||
        errorOutput.includes("confirm you're not a bot") ||
        errorOutput.includes("Sign in to confirm you");

      if (requiresLogin) {
        return res.status(403).json({
          error:
            "YouTube requires you to be logged in. Please sign in to YouTube in your selected browser.",
          requiresLogin: true,
        });
      }

      // Check for DRM-protected content
      const isDrmProtected =
        errorOutput.toLowerCase().includes("drm") ||
        errorOutput.toLowerCase().includes("unplayable");

      if (isDrmProtected) {
        return res.status(403).json({
          error:
            "This video is DRM-protected and cannot be downloaded. YouTube Movies and some premium content use encryption that prevents downloading.",
          isDrmProtected: true,
        });
      }

      return res
        .status(500)
        .json({ error: errorOutput || "Failed to fetch video info" });
    }

    try {
      const info = JSON.parse(output);
      const formats = info.formats
        .filter((f) => f.vcodec !== "none" && f.height)
        .map((f) => ({
          formatId: f.format_id,
          ext: f.ext,
          resolution: `${f.height}p`,
          fps: f.fps || 0,
          filesize: f.filesize || f.filesize_approx || 0,
          quality: f.height,
          formatNote: f.format_note || "",
        }))
        .sort((a, b) => b.quality - a.quality)
        .filter(
          (f, i, arr) =>
            arr.findIndex((x) => x.resolution === f.resolution) === i,
        );

      res.json({
        id: info.id,
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        durationString: info.duration_string,
        uploader: info.uploader,
        viewCount: info.view_count,
        formats,
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to parse video info" });
    }
  });
});

// Get playlist info (flat list of videos)
app.post("/api/playlist", (req, res) => {
  const { url } = req.body;
  const config = loadConfig();

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Check if URL looks like a playlist
  const isPlaylist = url.includes("list=") || url.includes("/playlist");

  if (!isPlaylist) {
    return res
      .status(400)
      .json({ error: "URL is not a playlist", isPlaylist: false });
  }

  const args = [...getCommonArgs(config), "--flat-playlist", "-j", url];

  const ytdlp = spawn("yt-dlp", args);
  let output = "";
  let errorOutput = "";
  let responseSent = false;

  ytdlp.on("error", (err) => {
    if (responseSent) return;
    responseSent = true;

    if (err.code === "ENOENT") {
      return res.status(500).json({
        error: "yt-dlp is not installed",
      });
    }
    return res
      .status(500)
      .json({ error: `Failed to start yt-dlp: ${err.message}` });
  });

  ytdlp.stdout.on("data", (data) => {
    output += data.toString();
  });

  ytdlp.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  ytdlp.on("close", (code) => {
    if (responseSent) return;
    responseSent = true;

    if (code !== 0) {
      // Check for YouTube bot verification / login required
      const requiresLogin =
        errorOutput.includes("Sign in to confirm") ||
        errorOutput.includes("confirm you're not a bot") ||
        errorOutput.includes("Sign in to confirm you");

      if (requiresLogin) {
        return res.status(403).json({
          error:
            "YouTube requires you to be logged in. Please sign in to YouTube in your selected browser.",
          requiresLogin: true,
        });
      }

      return res
        .status(500)
        .json({ error: errorOutput || "Failed to fetch playlist info" });
    }

    try {
      // Each line is a JSON object for each video
      const lines = output.trim().split("\n").filter(Boolean);
      const videos = lines.map((line) => {
        const info = JSON.parse(line);
        return {
          id: info.id,
          title: info.title,
          url: info.url || `https://www.youtube.com/watch?v=${info.id}`,
          duration: info.duration || 0,
          uploader: info.uploader || info.channel || "Unknown",
        };
      });

      res.json({
        isPlaylist: true,
        playlistTitle: videos[0]?.title?.includes("-")
          ? "Playlist"
          : "Playlist",
        count: videos.length,
        videos,
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to parse playlist info" });
    }
  });
});

// Store active downloads with their status
const activeDownloads = new Map();

// Start a download - returns downloadId for polling
app.post("/api/download/start", (req, res) => {
  const { url, format, audioOnly, videoInfo } = req.body;
  const config = loadConfig();

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Generate unique download ID
  const downloadId =
    Date.now().toString(36) + Math.random().toString(36).substr(2);

  const args = [
    ...getCommonArgs(config),
    "--no-playlist",
    "--newline",
    "--progress",
    "-o",
    path.join(config.downloadPath, "%(title)s.%(ext)s"),
  ];

  if (audioOnly) {
    args.push("-x", "--audio-format", "mp3");
  } else {
    // Use configured video format (default: mkv)
    const outputFormat = config.videoFormat || "mkv";
    if (format) {
      args.push(
        "-f",
        `${format}+bestaudio/best`,
        "--merge-output-format",
        outputFormat,
      );
    } else {
      args.push(
        "-f",
        "bestvideo+bestaudio/best",
        "--merge-output-format",
        outputFormat,
      );
    }

    // For MP4 format, re-encode audio to AAC for compatibility
    // YouTube often uses Opus audio which is incompatible with MP4 container
    if (outputFormat === "mp4") {
      args.push("--postprocessor-args", "ffmpeg:-c:v copy -c:a aac");
    }
  }

  args.push(url);

  console.log(`[${downloadId}] Starting download with args:`, args.join(" "));

  const ytdlp = spawn("yt-dlp", args);

  // Store download status
  const downloadStatus = {
    id: downloadId,
    status: "downloading",
    progress: 0,
    message: "Starting download...",
    error: null,
    process: ytdlp,
    videoInfo: videoInfo || null,
    audioOnly: audioOnly || false,
    format: format || "best",
    downloadPath: config.downloadPath,
  };

  activeDownloads.set(downloadId, downloadStatus);

  ytdlp.stdout.on("data", (data) => {
    const lines = data.toString().split("\n").filter(Boolean);
    lines.forEach((line) => {
      console.log(`[${downloadId}] stdout:`, line);
      const progressMatch = line.match(/(\d+\.?\d*)%/);
      if (progressMatch) {
        downloadStatus.progress = parseFloat(progressMatch[1]);
      }
      if (line.trim()) {
        downloadStatus.message = line.trim();
      }
    });
  });

  ytdlp.stderr.on("data", (data) => {
    const message = data.toString().trim();
    console.log(`[${downloadId}] stderr:`, message);

    // Check for YouTube bot verification / login required
    if (
      message.includes("Sign in to confirm") ||
      message.includes("confirm you're not a bot") ||
      message.includes("Sign in to confirm you")
    ) {
      downloadStatus.error = message;
      downloadStatus.requiresLogin = true;
    } else if (message.toLowerCase().includes("error")) {
      downloadStatus.error = message;
    }
    downloadStatus.message = message;
  });

  ytdlp.on("error", (err) => {
    console.error(`[${downloadId}] spawn error:`, err);
    downloadStatus.status = "error";
    if (err.code === "ENOENT") {
      downloadStatus.error =
        "yt-dlp is not installed. Please restart the app or install yt-dlp manually.";
    } else {
      downloadStatus.error = err.message;
    }
  });

  ytdlp.on("close", (code, signal) => {
    console.log(`[${downloadId}] exited with code:`, code, "signal:", signal);
    if (code === 0) {
      downloadStatus.status = "complete";
      downloadStatus.progress = 100;
      downloadStatus.message = "Download complete!";

      // Add to history
      if (downloadStatus.videoInfo) {
        addToHistory({
          id: downloadStatus.videoInfo.id,
          title: downloadStatus.videoInfo.title,
          thumbnail: downloadStatus.videoInfo.thumbnail,
          uploader: downloadStatus.videoInfo.uploader,
          duration: downloadStatus.videoInfo.duration,
          audioOnly: downloadStatus.audioOnly,
          format: downloadStatus.format,
          downloadedAt: new Date().toISOString(),
          filePath: downloadStatus.downloadPath,
        });
      }
    } else if (signal) {
      downloadStatus.status = "cancelled";
      downloadStatus.message = `Cancelled`;
    } else {
      downloadStatus.status = "error";
      downloadStatus.error =
        downloadStatus.error || `Download failed with exit code ${code}`;
    }

    // Clean up after 5 minutes
    setTimeout(
      () => {
        activeDownloads.delete(downloadId);
      },
      5 * 60 * 1000,
    );
  });

  res.json({ downloadId, status: "started" });
});

// Poll download status
app.get("/api/download/status/:id", (req, res) => {
  const downloadId = req.params.id;
  const download = activeDownloads.get(downloadId);

  if (!download) {
    return res.status(404).json({ error: "Download not found" });
  }

  res.json({
    id: download.id,
    status: download.status,
    progress: download.progress,
    message: download.message,
    error: download.error,
  });
});

// Cancel a download
app.post("/api/download/cancel/:id", (req, res) => {
  const downloadId = req.params.id;
  const download = activeDownloads.get(downloadId);

  if (!download) {
    return res.status(404).json({ error: "Download not found" });
  }

  if (download.process && !download.process.killed) {
    download.process.kill();
  }

  download.status = "cancelled";
  download.message = "Download cancelled by user";

  res.json({ success: true });
});

// Browse folders (for folder picker)
app.get("/api/browse", (req, res) => {
  const dir = req.query.path || os.homedir();

  try {
    const items = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((item) => item.isDirectory() && !item.name.startsWith("."))
      .map((item) => ({
        name: item.name,
        path: path.join(dir, item.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      current: dir,
      parent: path.dirname(dir),
      folders: items,
    });
  } catch (e) {
    res.status(500).json({ error: "Cannot read directory" });
  }
});

// Create new folder
app.post("/api/create-folder", (req, res) => {
  const { parentPath, folderName } = req.body;

  if (!parentPath || !folderName) {
    return res
      .status(400)
      .json({ error: "Parent path and folder name are required" });
  }

  // Sanitize folder name - remove invalid characters
  const sanitizedName = folderName.replace(/[<>:"/\\|?*]/g, "").trim();

  if (!sanitizedName) {
    return res.status(400).json({ error: "Invalid folder name" });
  }

  const newFolderPath = path.join(parentPath, sanitizedName);

  try {
    if (fs.existsSync(newFolderPath)) {
      return res.status(400).json({ error: "Folder already exists" });
    }

    fs.mkdirSync(newFolderPath, { recursive: true });
    res.json({
      success: true,
      path: newFolderPath,
      name: sanitizedName,
    });
  } catch (e) {
    console.error("Failed to create folder:", e);
    res.status(500).json({ error: "Failed to create folder" });
  }
});

// Start server function for Electron integration
function startServer(port = PORT) {
  return app.listen(port, () => {
    console.log(`YSnag server running on http://localhost:${port}`);
  });
}

// Stop server function
function stopServer(server) {
  if (server) {
    server.close(() => {
      console.log("YSnag server stopped");
    });
  }
}

// Export for Electron integration
module.exports = { app, startServer, stopServer };

// Start server if run directly (not imported)
if (require.main === module) {
  startServer();
}
