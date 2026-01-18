const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");

// Get the app data directory for storing binaries
function getAppDataDir() {
  const appName = "ysnag";
  switch (process.platform) {
    case "win32":
      // Check LOCALAPPDATA first (where our installer puts binaries)
      // Then fallback to APPDATA
      return path.join(
        process.env.LOCALAPPDATA || process.env.APPDATA || os.homedir(),
        appName,
      );
    case "darwin":
      return path.join(os.homedir(), "Library", "Application Support", appName);
    default: // Linux
      return path.join(
        process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share"),
        appName,
      );
  }
}

function getBinDir() {
  return path.join(getAppDataDir(), "bin");
}

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

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        fs.unlinkSync(dest);
        downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on("finish", () => {
        file.close();
        resolve();
      });
    });

    request.on("error", (err) => {
      fs.unlink(dest, () => {}); // Delete partial file
      reject(err);
    });

    file.on("error", (err) => {
      fs.unlink(dest, () => {}); // Delete partial file
      reject(err);
    });
  });
}

async function installYtDlp(onProgress) {
  const binDir = getBinDir();
  const isWindows = process.platform === "win32";
  const ytdlpPath = path.join(binDir, isWindows ? "yt-dlp.exe" : "yt-dlp");

  // Check if already installed in our bin dir
  if (fs.existsSync(ytdlpPath)) {
    onProgress?.("yt-dlp already installed");
    return ytdlpPath;
  }

  // Create bin directory
  fs.mkdirSync(binDir, { recursive: true });

  onProgress?.("Downloading yt-dlp...");

  const downloadUrl = isWindows
    ? "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
    : "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";

  await downloadFile(downloadUrl, ytdlpPath);

  // Make executable on Unix
  if (!isWindows) {
    fs.chmodSync(ytdlpPath, "755");
  }

  onProgress?.("yt-dlp installed successfully");
  return ytdlpPath;
}

async function installFfmpeg(onProgress) {
  const binDir = getBinDir();
  const isWindows = process.platform === "win32";

  // Check if ffmpeg is in PATH
  if (commandExists("ffmpeg")) {
    onProgress?.("ffmpeg found in system PATH");
    return "ffmpeg";
  }

  // Check if already in our bin dir
  const ffmpegPath = path.join(binDir, isWindows ? "ffmpeg.exe" : "ffmpeg");
  if (fs.existsSync(ffmpegPath)) {
    onProgress?.("ffmpeg already installed");
    return ffmpegPath;
  }

  onProgress?.(
    "ffmpeg not found. Please install ffmpeg manually for video merging.",
  );

  // ffmpeg is more complex to auto-download due to size and platform variants
  // For now, we'll rely on system installation or guide the user
  // In a future update, we could bundle ffmpeg or download it

  if (isWindows) {
    onProgress?.(
      "Windows: Install via 'winget install ffmpeg' or download from https://ffmpeg.org",
    );
  } else {
    onProgress?.(
      "Linux: Install via your package manager (apt install ffmpeg, pacman -S ffmpeg, etc.)",
    );
  }

  return null;
}

async function installNodeJS(onProgress) {
  const binDir = getBinDir();
  const isWindows = process.platform === "win32";

  // Only needed on Windows - Linux typically has node or uses /usr/bin/node
  if (!isWindows) {
    if (commandExists("node")) {
      onProgress?.("Node.js found in system PATH");
      return "node";
    }
    // On Linux, check common paths
    if (fs.existsSync("/usr/bin/node")) {
      return "/usr/bin/node";
    }
    return null;
  }

  // Check if node is in PATH
  if (commandExists("node")) {
    onProgress?.("Node.js found in system PATH");
    return "node";
  }

  // Check if already in our bin dir
  const nodePath = path.join(binDir, "node.exe");
  if (fs.existsSync(nodePath)) {
    onProgress?.("Node.js already installed");
    return nodePath;
  }

  onProgress?.("Downloading Node.js (required for YouTube extraction)...");

  // Download Node.js portable for Windows
  try {
    const nodeVersion = "v20.18.0";
    const tempZip = path.join(os.tmpdir(), "nodejs.zip");
    const tempExtract = path.join(os.tmpdir(), "nodejs-extract");
    const downloadUrl = `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-win-x64.zip`;

    await downloadFile(downloadUrl, tempZip);

    // Extract using PowerShell (built into Windows)
    const { execSync } = require("child_process");
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Path '${tempZip}' -DestinationPath '${tempExtract}' -Force"`,
      { stdio: "ignore" },
    );

    // Find and copy node.exe
    const extractedDir = fs
      .readdirSync(tempExtract)
      .find((d) => d.startsWith("node-"));
    if (extractedDir) {
      const nodeExeSrc = path.join(tempExtract, extractedDir, "node.exe");
      if (fs.existsSync(nodeExeSrc)) {
        fs.copyFileSync(nodeExeSrc, nodePath);
        onProgress?.("Node.js installed successfully");
      }
    }

    // Cleanup
    try {
      fs.unlinkSync(tempZip);
      fs.rmSync(tempExtract, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    if (fs.existsSync(nodePath)) {
      return nodePath;
    }
  } catch (error) {
    onProgress?.(`Failed to download Node.js: ${error.message}`);
  }

  onProgress?.(
    "Node.js not found. Please install via 'winget install OpenJS.NodeJS.LTS'",
  );
  return null;
}

async function checkAndInstallDependencies(onProgress) {
  onProgress?.("Checking dependencies...");

  const binDir = getBinDir();
  const isWindows = process.platform === "win32";

  // Ensure bin directory exists
  fs.mkdirSync(binDir, { recursive: true });

  // On Windows, also check LOCALAPPDATA\ysnag\bin (where installer puts binaries)
  const additionalPaths = [];
  if (isWindows) {
    const localAppDataBin = path.join(
      process.env.LOCALAPPDATA || "",
      "ysnag",
      "bin",
    );
    if (localAppDataBin && fs.existsSync(localAppDataBin)) {
      additionalPaths.push(localAppDataBin);
    }
  }

  // Install/check yt-dlp
  let ytdlpPath = null;
  try {
    // First check if yt-dlp is in system PATH
    if (commandExists("yt-dlp")) {
      onProgress?.("yt-dlp found in system PATH");
      ytdlpPath = "yt-dlp";
    } else {
      // Check our bin directories
      const ytdlpExe = isWindows ? "yt-dlp.exe" : "yt-dlp";
      for (const dir of [binDir, ...additionalPaths]) {
        const possiblePath = path.join(dir, ytdlpExe);
        if (fs.existsSync(possiblePath)) {
          onProgress?.(`yt-dlp found at ${possiblePath}`);
          ytdlpPath = possiblePath;
          break;
        }
      }

      // If still not found, try to install to our bin directory
      if (!ytdlpPath) {
        ytdlpPath = await installYtDlp(onProgress);
      }
    }
  } catch (error) {
    onProgress?.(`Failed to install yt-dlp: ${error.message}`);
  }

  // Check ffmpeg
  let ffmpegPath = null;
  try {
    // First check if ffmpeg is in system PATH
    if (commandExists("ffmpeg")) {
      onProgress?.("ffmpeg found in system PATH");
      ffmpegPath = "ffmpeg";
    } else {
      // Check our bin directories
      const ffmpegExe = isWindows ? "ffmpeg.exe" : "ffmpeg";
      for (const dir of [binDir, ...additionalPaths]) {
        const possiblePath = path.join(dir, ffmpegExe);
        if (fs.existsSync(possiblePath)) {
          onProgress?.(`ffmpeg found at ${possiblePath}`);
          ffmpegPath = possiblePath;
          break;
        }
      }

      // If still not found, show guidance
      if (!ffmpegPath) {
        ffmpegPath = await installFfmpeg(onProgress);
      }
    }
  } catch (error) {
    onProgress?.(`ffmpeg check failed: ${error.message}`);
  }

  // Check Node.js (required for yt-dlp YouTube extraction)
  let nodePath = null;
  try {
    // First check if node is in system PATH
    if (commandExists("node")) {
      onProgress?.("Node.js found in system PATH");
      nodePath = "node";
    } else {
      // Check our bin directories
      const nodeExe = isWindows ? "node.exe" : "node";
      for (const dir of [binDir, ...additionalPaths]) {
        const possiblePath = path.join(dir, nodeExe);
        if (fs.existsSync(possiblePath)) {
          onProgress?.(`Node.js found at ${possiblePath}`);
          nodePath = possiblePath;
          break;
        }
      }

      // On Linux, check common path
      if (!nodePath && !isWindows && fs.existsSync("/usr/bin/node")) {
        nodePath = "/usr/bin/node";
        onProgress?.("Node.js found at /usr/bin/node");
      }

      // If still not found on Windows, try to install
      if (!nodePath && isWindows) {
        nodePath = await installNodeJS(onProgress);
      }
    }
  } catch (error) {
    onProgress?.(`Node.js check failed: ${error.message}`);
  }

  // Add bin directories to PATH for this process
  const pathSeparator = isWindows ? ";" : ":";
  const allBinDirs = [binDir, ...additionalPaths].filter(Boolean);
  for (const dir of allBinDirs) {
    if (!process.env.PATH.includes(dir)) {
      process.env.PATH = dir + pathSeparator + process.env.PATH;
    }
  }

  onProgress?.("Dependency check complete");

  return {
    ytdlp: ytdlpPath,
    ffmpeg: ffmpegPath,
    node: nodePath,
    binDir,
  };
}

module.exports = {
  checkAndInstallDependencies,
  getAppDataDir,
  getBinDir,
  commandExists,
};
