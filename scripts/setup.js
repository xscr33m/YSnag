#!/usr/bin/env node
/**
 * YSnag Setup Script
 * Checks and installs all required dependencies before starting the app.
 */

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT_DIR = path.join(__dirname, "..");

function log(message) {
  console.log(`[Setup] ${message}`);
}

function error(message) {
  console.error(`[Setup] ERROR: ${message}`);
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

function installYtDlp() {
  log("yt-dlp not found. Attempting to install...");

  const platform = os.platform();

  if (platform === "win32") {
    // Windows - try multiple methods

    // Method 1: pip (most reliable for Windows)
    const pip = commandExists("pip3")
      ? "pip3"
      : commandExists("pip")
      ? "pip"
      : null;
    if (pip) {
      log(`Installing yt-dlp via ${pip}...`);
      try {
        execSync(`${pip} install --upgrade yt-dlp`, { stdio: "inherit" });
        log("yt-dlp installed successfully!");
        return true;
      } catch (e) {
        error(`${pip} installation failed.`);
      }
    }

    // Method 2: winget (may require terminal restart)
    if (commandExists("winget")) {
      log("Installing yt-dlp via winget...");
      try {
        execSync(
          "winget install yt-dlp.yt-dlp --accept-source-agreements --accept-package-agreements",
          { stdio: "inherit" }
        );
        log("yt-dlp installed successfully!");
        log(
          "NOTE: You may need to restart your terminal for yt-dlp to be available."
        );
        return true;
      } catch (e) {
        error("winget installation failed.");
      }
    }

    // Method 3: Direct download as last resort
    log("Attempting direct download of yt-dlp.exe...");
    try {
      const ytdlpPath = path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Microsoft",
        "WindowsApps"
      );
      const downloadUrl =
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
      execSync(
        `powershell -Command "Invoke-WebRequest -Uri '${downloadUrl}' -OutFile '${path.join(
          ytdlpPath,
          "yt-dlp.exe"
        )}'"`,
        { stdio: "inherit" }
      );
      log("yt-dlp downloaded successfully!");
      return true;
    } catch (e) {
      error("Direct download failed.");
    }
  } else {
    // Linux/macOS
    if (commandExists("pacman")) {
      // Arch Linux / CachyOS
      log("Installing yt-dlp via pacman (requires sudo)...");
      try {
        execSync("sudo pacman -S --noconfirm yt-dlp", { stdio: "inherit" });
        log("yt-dlp installed successfully!");
        return true;
      } catch (e) {
        error("pacman installation failed.");
      }
    }

    if (commandExists("apt")) {
      // Debian/Ubuntu
      log("Installing yt-dlp via apt (requires sudo)...");
      try {
        execSync("sudo apt update && sudo apt install -y yt-dlp", {
          stdio: "inherit",
          shell: true,
        });
        log("yt-dlp installed successfully!");
        return true;
      } catch (e) {
        error("apt installation failed.");
      }
    }

    if (commandExists("dnf")) {
      // Fedora
      log("Installing yt-dlp via dnf (requires sudo)...");
      try {
        execSync("sudo dnf install -y yt-dlp", { stdio: "inherit" });
        log("yt-dlp installed successfully!");
        return true;
      } catch (e) {
        error("dnf installation failed.");
      }
    }

    if (commandExists("brew")) {
      // macOS with Homebrew
      log("Installing yt-dlp via brew...");
      try {
        execSync("brew install yt-dlp", { stdio: "inherit" });
        log("yt-dlp installed successfully!");
        return true;
      } catch (e) {
        error("brew installation failed.");
      }
    }

    // Fallback to pip
    const pip = commandExists("pip3")
      ? "pip3"
      : commandExists("pip")
      ? "pip"
      : null;
    if (pip) {
      log(`Installing yt-dlp via ${pip}...`);
      try {
        execSync(`${pip} install --user yt-dlp`, { stdio: "inherit" });
        log("yt-dlp installed successfully!");
        return true;
      } catch (e) {
        error(`${pip} installation failed.`);
      }
    }
  }

  error("Could not install yt-dlp automatically.");
  error("Please install it manually:");
  error("  - Linux (Arch): sudo pacman -S yt-dlp");
  error("  - Linux (Debian/Ubuntu): sudo apt install yt-dlp");
  error("  - Windows: winget install yt-dlp.yt-dlp");
  error("  - Or visit: https://github.com/yt-dlp/yt-dlp#installation");
  return false;
}

function installNodeModules(dir, name) {
  const nodeModulesPath = path.join(dir, "node_modules");
  if (!fs.existsSync(nodeModulesPath)) {
    log(`Installing ${name} dependencies...`);
    try {
      execSync("npm install", { cwd: dir, stdio: "inherit" });
      log(`${name} dependencies installed.`);
    } catch (e) {
      error(`Failed to install ${name} dependencies.`);
      process.exit(1);
    }
  }
}

function main() {
  log("Checking dependencies...");

  // Check yt-dlp
  if (!commandExists("yt-dlp")) {
    if (!installYtDlp()) {
      // Don't exit, just warn - the server will show a friendly error
      log("Continuing without yt-dlp - you will see an error in the app.");
    }
  } else {
    log("yt-dlp is installed.");
  }

  // Check ffmpeg (required for merging video+audio)
  if (!commandExists("ffmpeg")) {
    log("ffmpeg not found. This is required for merging video and audio.");
    installFfmpeg();
  } else {
    log("ffmpeg is installed.");
  }

  // Check npm dependencies
  installNodeModules(ROOT_DIR, "root");
  installNodeModules(path.join(ROOT_DIR, "server"), "server");
  installNodeModules(path.join(ROOT_DIR, "client"), "client");

  log("All dependencies are ready!");
}

function installFfmpeg() {
  const platform = os.platform();

  if (platform === "win32") {
    log("Installing ffmpeg for Windows...");

    // Try winget first
    if (commandExists("winget")) {
      log("Installing ffmpeg via winget...");
      try {
        execSync(
          "winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements",
          { stdio: "inherit" }
        );
        log("ffmpeg installed successfully!");
        log(
          "NOTE: You may need to restart your terminal for ffmpeg to be available."
        );
        return true;
      } catch (e) {
        error("winget installation failed.");
      }
    }

    // Try chocolatey
    if (commandExists("choco")) {
      log("Installing ffmpeg via chocolatey...");
      try {
        execSync("choco install ffmpeg -y", { stdio: "inherit" });
        log("ffmpeg installed successfully!");
        return true;
      } catch (e) {
        error("chocolatey installation failed.");
      }
    }

    error("Could not install ffmpeg automatically.");
    error("Please install ffmpeg manually:");
    error("  - Download from: https://ffmpeg.org/download.html");
    error("  - Or run: winget install Gyan.FFmpeg");
    error("  - ffmpeg is required for merging video and audio streams.");
    return false;
  } else {
    // Linux/macOS
    if (commandExists("pacman")) {
      log("Installing ffmpeg via pacman...");
      try {
        execSync("sudo pacman -S --noconfirm ffmpeg", { stdio: "inherit" });
        log("ffmpeg installed successfully!");
        return true;
      } catch (e) {
        error("pacman installation failed.");
      }
    }

    if (commandExists("apt")) {
      log("Installing ffmpeg via apt...");
      try {
        execSync("sudo apt update && sudo apt install -y ffmpeg", {
          stdio: "inherit",
          shell: true,
        });
        log("ffmpeg installed successfully!");
        return true;
      } catch (e) {
        error("apt installation failed.");
      }
    }

    if (commandExists("dnf")) {
      log("Installing ffmpeg via dnf...");
      try {
        execSync("sudo dnf install -y ffmpeg", { stdio: "inherit" });
        log("ffmpeg installed successfully!");
        return true;
      } catch (e) {
        error("dnf installation failed.");
      }
    }

    if (commandExists("brew")) {
      log("Installing ffmpeg via brew...");
      try {
        execSync("brew install ffmpeg", { stdio: "inherit" });
        log("ffmpeg installed successfully!");
        return true;
      } catch (e) {
        error("brew installation failed.");
      }
    }

    error("Could not install ffmpeg automatically.");
    error("Please install it manually using your package manager.");
    return false;
  }
}

main();
