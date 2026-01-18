# YSnag - Copilot Instructions

## Architecture

Electron app wrapping `yt-dlp` CLI with three layers:

| Layer    | Location    | Stack                              | Purpose                              |
| -------- | ----------- | ---------------------------------- | ------------------------------------ |
| Electron | `electron/` | CommonJS, electron-updater         | Main process, IPC, auto-updates      |
| Server   | `server/`   | Express 5 (CommonJS), port 3001    | REST API, spawns yt-dlp processes    |
| Client   | `client/`   | React 19 + TypeScript + Vite + TW4 | UI, state management, status polling |

**Data flow:** `POST /api/info` → yt-dlp JSON → `POST /api/download/start` → returns `downloadId` → poll `GET /api/download/status/:id`

**User data:** Config at `~/.ysnag-config.json`, history at `~/.ysnag-history.json` (50 items max)

## Development

```bash
npm run dev            # Browser mode: runs setup + server + Vite concurrently
npm run dev:electron   # Full Electron with dev tools (waits for Vite on :5173)
npm run server         # Express only on :3001
npm run client         # Vite only on :5173
```

## Critical Server Patterns

**Always use `getCommonArgs(config)`** when spawning yt-dlp (adds cookies + `--js-runtimes node:path`):

```javascript
const args = [...getCommonArgs(config), "-j", "--no-playlist", url];
const ytdlp = spawn("yt-dlp", args);
```

**Prevent duplicate responses** - yt-dlp emits multiple close/error events:

```javascript
let responseSent = false;
ytdlp.on("close", (code) => {
  if (responseSent) return;
  responseSent = true;
  res.json({
    /* ... */
  });
});
```

**Handle ENOENT** - yt-dlp may not be installed:

```javascript
ytdlp.on("error", (err) => {
  if (err.code === "ENOENT") {
    return res.status(500).json({ error: "yt-dlp is not installed" });
  }
});
```

**Download tracking:** `activeDownloads` Map holds process refs + status; entries auto-delete after 5 min.

## Client Patterns

- **State:** Centralized in `App.tsx` with `useState`/`useEffect` (no Redux/Zustand)
- **Types:** All shared types in `client/src/types.ts` including `API_URL` constant
- **Components:** One per file in `client/src/components/`, barrel export via `index.ts`
- **Async state:** Use `queueRef.current` pattern to read latest state in async callbacks
- **Icons:** `react-icons/fa` for UI, `react-icons/si` for brand logos
- **Electron check:** Use `isElectron()` from `electron.d.ts` before calling `window.electron` APIs

### i18n (Required for all UI text)

Always update **both** `client/src/i18n/locales/en.json` **and** `de.json`. Use `useTranslation()` hook:

```tsx
const { t } = useTranslation();
return <span>{t("download.startButton")}</span>;
```

### Styling (Dark glassmorphism theme)

```tsx
// Card: bg-gradient-to-b from-white/[0.08] to-white/[0.04] rounded-xl border border-white/10
// Primary btn: bg-gradient-to-r from-red-600 to-red-500
// Secondary btn: bg-white/10 hover:bg-white/20
```

### Queue Status Flow

`fetching` → `ready` → `queued` → `downloading` → `complete` | `error` | `cancelled`

## Modification Checklist

| Change        | Files to Update                                                                      |
| ------------- | ------------------------------------------------------------------------------------ |
| API endpoint  | `server/index.js` + types in `client/src/types.ts`                                   |
| Component     | `client/src/components/` + export in `index.ts`                                      |
| yt-dlp option | `getCommonArgs()` or `/api/download/start` args in `server/index.js`                 |
| UI text       | **Both** `en.json` **and** `de.json` in `client/src/i18n/locales/`                   |
| Setting       | `loadConfig()` defaults + `Settings` interface + `SettingsTab.tsx`                   |
| Electron IPC  | `electron/main.js` + `preload.js` + `client/src/electron.d.ts`                       |
| Version bump  | Root `package.json`, `client/package.json`, `server/package.json`, `client/src/config.ts` |

## Platform Notes

- **Windows cookies:** Chrome/Brave extraction often fails → recommend Firefox or manual `cookieFilePath`
- **Cookie priority:** `cookieFilePath` overrides `browserForCookies` if both set
- **Dependencies:** yt-dlp, ffmpeg, Node.js auto-installed to `%LOCALAPPDATA%\ysnag\bin` (Win) or `~/.local/share/ysnag/bin` (Linux)

## Build & Release

```bash
npm run build:linux    # → _RELEASE/YSnag-x.x.x.AppImage
npm run build:win      # Run on native Windows, not WSL → _RELEASE/YSnag-x.x.x-Setup.exe
```

**Release workflow:**

1. Update version in 4 files: root `package.json`, `client/package.json`, `server/package.json`, `client/src/config.ts`
2. Build on both Windows and Linux platforms
3. Create GitHub Release with tag `v1.x.x`
4. Upload `.AppImage` and `-Setup.exe` binaries

Auto-updater uses `electron-updater` checking GitHub Releases (`latest.yml` / `latest-linux.yml`).
