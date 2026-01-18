#!/usr/bin/env node
/**
 * YSnag Release Cleanup Script
 * Organizes build artifacts into version-specific folders.
 *
 * - Creates version subfolder in _RELEASE (e.g., _RELEASE/1.4.4/)
 * - Moves final installers (AppImage, Setup.exe) to version folder
 * - Removes build artifacts (linux-unpacked, win-unpacked, etc.)
 * - Preserves existing installers in version folder (Windows build won't delete Linux, etc.)
 * - Older version folders are never touched
 */

const fs = require("fs");
const path = require("path");

const RELEASE_DIR = path.join(__dirname, "..", "_RELEASE");
const PACKAGE_JSON = path.join(__dirname, "..", "package.json");

// Patterns for files to KEEP (and move to version folder)
const KEEP_PATTERNS = [
  /\.AppImage$/, // Linux AppImage
  /-Setup\.exe$/, // Windows NSIS installer
  /^latest.*\.yml$/, // Auto-updater metadata (latest.yml, latest-linux.yml, etc.)
];

function shouldKeep(filename) {
  return KEEP_PATTERNS.some((pattern) => pattern.test(filename));
}

function getVersion() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
  return pkg.version;
}

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

function isVersionFolder(name) {
  // Version folders match pattern like "1.4.4", "2.0.0", etc.
  return /^\d+\.\d+\.\d+$/.test(name);
}

function cleanRelease() {
  if (!fs.existsSync(RELEASE_DIR)) {
    console.log("[Clean] No _RELEASE directory found.");
    return;
  }

  const version = getVersion();
  const versionDir = path.join(RELEASE_DIR, version);

  console.log(`[Clean] Organizing release for version ${version}...`);

  // Create version folder if it doesn't exist
  if (!fs.existsSync(versionDir)) {
    fs.mkdirSync(versionDir, { recursive: true });
    console.log(`[Clean] Created version folder: ${version}/`);
  }

  const items = fs.readdirSync(RELEASE_DIR);
  let moved = 0;
  let removed = 0;

  for (const item of items) {
    const itemPath = path.join(RELEASE_DIR, item);
    const stat = fs.lstatSync(itemPath);

    // Skip version folders (don't touch them)
    if (stat.isDirectory() && isVersionFolder(item)) {
      console.log(`[Clean] Skipping version folder: ${item}/`);
      continue;
    }

    if (stat.isDirectory()) {
      // Remove build directories (linux-unpacked, win-unpacked, etc.)
      console.log(`[Clean] Removing build directory: ${item}/`);
      deleteFolderRecursive(itemPath);
      removed++;
    } else if (shouldKeep(item)) {
      // Move installer to version folder (overwrite if exists)
      const destPath = path.join(versionDir, item);
      console.log(`[Clean] Moving to ${version}/: ${item}`);
      fs.renameSync(itemPath, destPath);
      moved++;
    } else {
      // Remove other build artifacts
      console.log(`[Clean] Removing file: ${item}`);
      fs.unlinkSync(itemPath);
      removed++;
    }
  }

  // List what's in the version folder now
  const versionItems = fs.readdirSync(versionDir);
  console.log(`\n[Clean] Version ${version}/ contains:`);
  for (const item of versionItems) {
    console.log(`  - ${item}`);
  }

  console.log(
    `\n[Clean] Done! Moved ${moved} installer(s), removed ${removed} build artifact(s).`,
  );
}

cleanRelease();
