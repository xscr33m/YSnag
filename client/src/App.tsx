import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import i18n from "./i18n";
import "./App.css";
import {
  Header,
  DownloadTab,
  HistoryTab,
  SettingsTab,
  FolderPicker,
  FloatingStatus,
  FloatingCopyright,
  FloatingLegal,
  InfoTab,
  AboutTab,
  useToast,
  ShortcutsDialog,
  ConfirmDialog,
} from "./components";
import type {
  Tab,
  Settings,
  HistoryItem,
  FolderBrowser,
  QueueItem,
  CookieStatus,
} from "./types";
import { API_URL } from "./types";

function App() {
  const { t } = useTranslation();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("download");
  const mainRef = useRef<HTMLElement>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<Settings>({
    downloadPath: "",
    browserForCookies: "firefox",
  });
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [folderBrowser, setFolderBrowser] = useState<FolderBrowser | null>(
    null,
  );
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [cookieStatus, setCookieStatus] = useState<CookieStatus>({
    hasCookies: false,
    needsLogin: false,
    message: "",
    checking: false,
    checkedBrowser: undefined,
  });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
    confirmText?: string;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  // Ref to track active polling intervals
  const pollingRef = useRef<Map<string, boolean>>(new Map());
  // Ref to access current queue in callbacks
  const queueRef = useRef<QueueItem[]>(queue);
  queueRef.current = queue;

  // Check cookie status for a browser (cached per session)
  const checkCookieStatus = useCallback(
    async (browser: string, forceRefresh = false) => {
      if (!browser || browser === "none") {
        setCookieStatus({
          hasCookies: false,
          needsLogin: false,
          message: "",
          checking: false,
          checkedBrowser: browser,
        });
        return;
      }

      // Check sessionStorage cache first (unless forced refresh)
      const cacheKey = `cookieStatus_${browser}`;
      if (!forceRefresh) {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const cachedStatus = JSON.parse(cached);
            setCookieStatus({
              ...cachedStatus,
              checking: false,
              checkedBrowser: browser,
            });
            return;
          } catch (e) {
            console.error("Failed to parse cached cookie status:", e);
          }
        }
      }

      setCookieStatus((prev) => ({ ...prev, checking: true }));

      try {
        const res = await fetch(`${API_URL}/api/check-cookies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ browser }),
        });
        const data = await res.json();
        const newStatus = {
          hasCookies: data.hasCookies,
          needsLogin: data.needsLogin,
          cookieError: data.cookieError,
          message: data.message,
          checking: false,
          checkedBrowser: browser,
        };
        // Cache the result in sessionStorage
        sessionStorage.setItem(cacheKey, JSON.stringify(newStatus));
        setCookieStatus(newStatus);
      } catch (err) {
        console.error("Failed to check cookie status:", err);
        // Don't cache errors - allow retry on next load
        setCookieStatus({
          hasCookies: false,
          needsLogin: false,
          message: "Failed to check cookies",
          checking: false,
          checkedBrowser: browser,
        });
      }
    },
    [],
  );

  // Fetch settings and auto-detect browser if needed
  const fetchSettingsWithAutoDetect = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`);
      const data = await res.json();

      let browserToCheck = data.browserForCookies;

      // If browser was auto-detected (not manually set), try to detect again
      if (data.browserAutoDetected !== false) {
        try {
          const detectRes = await fetch(`${API_URL}/api/detect-browser`);
          const detectData = await detectRes.json();

          if (detectData.recommended && detectData.recommended !== "none") {
            browserToCheck = detectData.recommended;
            // Update settings with detected browser
            const updateRes = await fetch(`${API_URL}/api/settings`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                browserForCookies: detectData.recommended,
                browserAutoDetected: true,
              }),
            });
            const updatedSettings = await updateRes.json();
            setSettings(updatedSettings);
            // Check cookies for the detected browser
            checkCookieStatus(browserToCheck);
            return;
          }
        } catch (e) {
          console.error("Failed to auto-detect browser:", e);
        }
      }

      setSettings(data);
      // Check cookies for the current browser setting
      if (browserToCheck && browserToCheck !== "none") {
        checkCookieStatus(browserToCheck);
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, [checkCookieStatus]);

  // Initial data fetch
  useEffect(() => {
    fetchSettingsWithAutoDetect();
    fetchHistory();

    // Sync language to Electron main process for updater dialogs
    if (window.electron?.setLanguage) {
      window.electron.setLanguage(i18n.language);
    }
  }, [fetchSettingsWithAutoDetect]);

  // Cleanup polling on unmount
  useEffect(() => {
    const currentPollingRef = pollingRef.current;
    return () => {
      // Stop all active polling when component unmounts
      currentPollingRef.forEach((_, queueId) => {
        currentPollingRef.set(queueId, false);
      });
      currentPollingRef.clear();
    };
  }, []);

  // Global keyboard shortcut for ? to show shortcuts dialog
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "?") {
        setShowShortcuts(true);
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/history`);
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  };

  const clearHistory = async () => {
    setConfirmDialog({
      isOpen: true,
      title: t("confirm.clearHistory.title"),
      message: t("confirm.clearHistory.message"),
      confirmText: t("confirm.clearHistory.confirm"),
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await fetch(`${API_URL}/api/history`, { method: "DELETE" });
          setHistory([]);
          toast.success(t("toast.historyCleared"));
        } catch (e) {
          console.error("Failed to clear history:", e);
        }
      },
    });
  };

  const browseFolders = async (path?: string) => {
    try {
      const res = await fetch(
        `${API_URL}/api/browse?path=${encodeURIComponent(path || "")}`,
      );
      const data = await res.json();
      setFolderBrowser(data);
    } catch (e) {
      console.error("Failed to browse folders:", e);
    }
  };

  const selectFolder = async (path: string) => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadPath: path }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setShowFolderPicker(false);
      }
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  // Generate unique queue ID
  const generateQueueId = () =>
    Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

  // Validate YouTube URL
  const isValidYouTubeUrl = (url: string) => {
    const patterns = [
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=.+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=.+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/.+/,
      /^(https?:\/\/)?(www\.)?youtu\.be\/.+/,
      /^(https?:\/\/)?(music\.)?youtube\.com\/.+/,
    ];
    return patterns.some((pattern) => pattern.test(url));
  };

  // Check if URL is a playlist
  const isPlaylistUrl = (url: string) =>
    url.includes("list=") || url.includes("/playlist");

  // Fetch single video info
  const fetchVideoInfo = async (
    videoUrl: string,
    queueId: string,
  ): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/api/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl }),
        signal: AbortSignal.timeout(60000), // 60 second timeout
      });

      const data = await res.json();

      if (!res.ok) {
        // Check if it's a login required error
        if (data.requiresLogin) {
          toast.addToast({
            type: "warning",
            title: t("errors.loginRequired"),
            message: t("errors.loginRequiredMessage"),
            duration: 15000,
            action: {
              label: t("errors.openYouTube"),
              href: "https://www.youtube.com",
            },
          });
        }
        throw new Error(data.error || "Failed to fetch video info");
      }

      setQueue((prev) =>
        prev.map((item) =>
          item.queueId === queueId
            ? { ...item, videoInfo: data, status: "ready" }
            : item,
        ),
      );
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An error occurred";
      setQueue((prev) =>
        prev.map((item) =>
          item.queueId === queueId
            ? { ...item, status: "error", error: errorMessage }
            : item,
        ),
      );
    }
  };

  // Add URL to queue and fetch video info
  const addToQueue = async () => {
    if (!url.trim()) return;

    const currentUrl = url.trim();

    // Validate YouTube URL
    if (!isValidYouTubeUrl(currentUrl)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setUrl(""); // Clear input immediately so user can add more
    setError("");
    setLoading(true);

    // Check if it's a playlist
    if (isPlaylistUrl(currentUrl)) {
      try {
        const res = await fetch(`${API_URL}/api/playlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: currentUrl }),
          signal: AbortSignal.timeout(60000), // 60 second timeout
        });

        const data = await res.json();

        // Check if it's a login required error
        if (!res.ok && data.requiresLogin) {
          toast.addToast({
            type: "warning",
            title: t("errors.loginRequired"),
            message: t("errors.loginRequiredMessage"),
            duration: 15000,
            action: {
              label: t("errors.openYouTube"),
              href: "https://www.youtube.com",
            },
          });
          setLoading(false);
          return;
        }

        if (res.ok && data.isPlaylist && data.videos) {
          // Add all playlist videos to queue
          const newItems: QueueItem[] = data.videos.map(
            (video: { id: string; url: string; title: string }) => ({
              queueId: generateQueueId(),
              url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
              videoInfo: null,
              status: "fetching" as const,
              selectedFormat: "best",
              audioOnly: false,
              progress: 0,
              statusMessage: "",
              error: null,
              downloadId: null,
              isPlaylist: true,
            }),
          );

          setQueue((prev) => [...prev, ...newItems]);
          setLoading(false);

          // Show info toast for playlist
          toast.info(
            t("toast.playlistAdded"),
            t("toast.playlistAddedMessage", { count: newItems.length }),
          );

          // Fetch info for each video (with delay to avoid rate limiting)
          for (const item of newItems) {
            await fetchVideoInfo(item.url, item.queueId);
            await new Promise((r) => setTimeout(r, 300)); // Small delay between requests
          }
          return;
        }
      } catch {
        // If playlist fetch fails, try as single video
        console.log("Playlist fetch failed, trying as single video");
      }
    }

    // Single video
    const queueId = generateQueueId();

    const newItem: QueueItem = {
      queueId,
      url: currentUrl,
      videoInfo: null,
      status: "fetching",
      selectedFormat: "best",
      audioOnly: false,
      progress: 0,
      statusMessage: "",
      error: null,
      downloadId: null,
    };

    setQueue((prev) => [...prev, newItem]);

    await fetchVideoInfo(currentUrl, queueId);
    setLoading(false);
  };

  // Update format for a queue item
  const updateFormat = (queueId: string, format: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.queueId === queueId ? { ...item, selectedFormat: format } : item,
      ),
    );
  };

  // Update audio only for a queue item
  const updateAudioOnly = (queueId: string, audioOnly: boolean) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.queueId === queueId ? { ...item, audioOnly } : item,
      ),
    );
  };

  // Remove item from queue
  const removeFromQueue = (queueId: string) => {
    // Stop polling if active
    pollingRef.current.set(queueId, false);
    setQueue((prev) => prev.filter((item) => item.queueId !== queueId));
  };

  // Retry a failed/cancelled download
  const retryDownload = (queueId: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.queueId === queueId
          ? { ...item, status: "ready" as const, progress: 0, error: null }
          : item,
      ),
    );
  };

  // Clear completed/cancelled items
  const clearCompleted = () => {
    setQueue((prev) =>
      prev.filter(
        (item) => item.status !== "complete" && item.status !== "cancelled",
      ),
    );
  };

  // Set all items to audio-only or video mode
  const setAllAudioOnly = (audioOnly: boolean) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.status === "ready" || item.status === "queued"
          ? { ...item, audioOnly }
          : item,
      ),
    );
  };

  // Cancel all fetching items
  const cancelAllFetching = () => {
    setQueue((prev) => prev.filter((item) => item.status !== "fetching"));
  };

  // Cancel all downloading items
  const cancelAllDownloads = async () => {
    const downloadingItems = queue.filter(
      (item) => item.status === "downloading",
    );
    if (downloadingItems.length === 0) return;

    for (const item of downloadingItems) {
      if (item.downloadId) {
        await cancelDownload(item.queueId);
      }
    }

    toast.info(
      t("toast.downloadsCancelled"),
      t("toast.downloadsCancelledMessage", { count: downloadingItems.length }),
    );
  };

  // Toggle selection of an item
  const toggleItemSelection = (queueId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(queueId)) {
        newSet.delete(queueId);
      } else {
        newSet.add(queueId);
      }
      return newSet;
    });
  };

  // Select all ready/queued items
  const selectAllReady = () => {
    const readyItems = queue.filter(
      (item) => item.status === "ready" || item.status === "queued",
    );
    setSelectedItems(new Set(readyItems.map((item) => item.queueId)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Download selected items
  const downloadSelected = async () => {
    const selectedArray = Array.from(selectedItems);
    const itemsToDownload = queue.filter(
      (item) =>
        selectedArray.includes(item.queueId) &&
        (item.status === "ready" || item.status === "queued"),
    );
    for (const item of itemsToDownload) {
      await startDownload(item.queueId);
    }
    clearSelection();
  };

  // Remove selected items
  const removeSelected = () => {
    setQueue((prev) => prev.filter((item) => !selectedItems.has(item.queueId)));
    clearSelection();
  };

  // Poll download status
  const pollDownloadStatus = useCallback(
    async (queueId: string, downloadId: string) => {
      // Check if polling should continue
      if (!pollingRef.current.get(queueId)) {
        return;
      }

      try {
        const statusRes = await fetch(
          `${API_URL}/api/download/status/${downloadId}`,
        );
        const status = await statusRes.json();

        if (!statusRes.ok) {
          throw new Error(status.error || "Failed to get download status");
        }

        setQueue((prev) =>
          prev.map((item) => {
            if (item.queueId !== queueId) return item;

            if (status.status === "complete") {
              pollingRef.current.set(queueId, false);
              fetchHistory(); // Refresh history
              // Show success toast
              const title = item.videoInfo?.title || "Video";
              toast.success(
                t("toast.downloadComplete"),
                title.length > 50 ? title.substring(0, 50) + "..." : title,
              );
              return {
                ...item,
                status: "complete",
                progress: 100,
                statusMessage: "Download complete!",
              };
            }

            if (status.status === "error") {
              pollingRef.current.set(queueId, false);
              // Check if it's a login required error
              if (status.requiresLogin) {
                toast.addToast({
                  type: "warning",
                  title: t("errors.loginRequired"),
                  message: t("errors.loginRequiredMessage"),
                  duration: 15000,
                  action: {
                    label: t("errors.openYouTube"),
                    href: "https://www.youtube.com",
                  },
                });
              } else {
                // Show error toast
                toast.error(
                  t("toast.downloadFailed"),
                  status.error || "Download failed",
                );
              }
              return {
                ...item,
                status: "error",
                error: status.error || "Download failed",
              };
            }

            if (status.status === "cancelled") {
              pollingRef.current.set(queueId, false);
              return {
                ...item,
                status: "cancelled",
                statusMessage: "Download cancelled",
              };
            }

            return {
              ...item,
              progress: status.progress,
              statusMessage: status.message,
            };
          }),
        );

        // Continue polling if still downloading
        if (
          status.status === "downloading" &&
          pollingRef.current.get(queueId)
        ) {
          setTimeout(() => pollDownloadStatus(queueId, downloadId), 500);
        }
      } catch (e) {
        pollingRef.current.set(queueId, false);
        const errorMessage =
          e instanceof Error ? e.message : "Failed to poll status";
        toast.error(t("toast.downloadFailed"), errorMessage);
        setQueue((prev) =>
          prev.map((item) =>
            item.queueId === queueId
              ? { ...item, status: "error", error: errorMessage }
              : item,
          ),
        );
      }
    },
    [t, toast],
  );

  // Internal function to start a download (used by both manual start and auto-start)
  const startDownloadInternal = useCallback(
    async (queueId: string) => {
      // Get current queue state
      const currentQueue = queue;
      const item = currentQueue.find((i) => i.queueId === queueId);
      if (!item || !item.videoInfo) return;

      // Update status to downloading
      setQueue((prev) =>
        prev.map((i) =>
          i.queueId === queueId
            ? {
                ...i,
                status: "downloading",
                progress: 0,
                statusMessage: "Initializing...",
              }
            : i,
        ),
      );

      try {
        const startRes = await fetch(`${API_URL}/api/download/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: item.url,
            format: item.selectedFormat === "best" ? null : item.selectedFormat,
            audioOnly: item.audioOnly,
            videoInfo: {
              id: item.videoInfo.id,
              title: item.videoInfo.title,
              thumbnail: item.videoInfo.thumbnail,
              uploader: item.videoInfo.uploader,
              duration: item.videoInfo.duration,
            },
          }),
        });

        const startData = await startRes.json();

        if (!startRes.ok) {
          throw new Error(startData.error || "Failed to start download");
        }

        const { downloadId } = startData;

        // Store downloadId and start polling
        setQueue((prev) =>
          prev.map((i) => (i.queueId === queueId ? { ...i, downloadId } : i)),
        );

        // Enable polling for this item
        pollingRef.current.set(queueId, true);
        pollDownloadStatus(queueId, downloadId);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Download failed";
        setQueue((prev) =>
          prev.map((i) =>
            i.queueId === queueId
              ? { ...i, status: "error", error: errorMessage }
              : i,
          ),
        );
      }
    },
    [queue, pollDownloadStatus],
  );

  // Auto-start next download when current one finishes (only when downloadAll is active)
  useEffect(() => {
    if (!isDownloadingAll) return;

    const hasActiveDownload = queue.some(
      (item) => item.status === "downloading",
    );
    const nextQueued = queue.find(
      (item) => item.status === "queued" && item.videoInfo,
    );

    if (!hasActiveDownload && nextQueued) {
      // Start next download in the queue
      startDownloadInternal(nextQueued.queueId);
    } else if (!hasActiveDownload && !nextQueued) {
      // All downloads complete
      setIsDownloadingAll(false);
    }
  }, [queue, isDownloadingAll, startDownloadInternal]);

  // Start download for a queue item (public wrapper)
  const startDownload = async (queueId: string) => {
    const item = queue.find((i) => i.queueId === queueId);
    if (!item || !item.videoInfo) return;

    // Check if another download is already active
    const hasActiveDownload = queue.some((i) => i.status === "downloading");
    if (hasActiveDownload) {
      // Queue it - will be started automatically when current finishes
      return;
    }

    await startDownloadInternal(queueId);
  };

  // Cancel download
  const cancelDownload = async (queueId: string) => {
    const item = queue.find((i) => i.queueId === queueId);
    if (!item || !item.downloadId) return;

    // Stop polling
    pollingRef.current.set(queueId, false);

    try {
      await fetch(`${API_URL}/api/download/cancel/${item.downloadId}`, {
        method: "POST",
      });

      setQueue((prev) =>
        prev.map((i) =>
          i.queueId === queueId
            ? { ...i, status: "cancelled", statusMessage: "Cancelled" }
            : i,
        ),
      );
    } catch (e) {
      console.error("Failed to cancel download:", e);
    }
  };

  // Download all ready items in queue
  const downloadAll = async () => {
    const readyItems = queue.filter(
      (item) => item.status === "ready" && item.videoInfo,
    );

    if (readyItems.length === 0) return;

    // Mark all ready items (except the first) as queued
    if (readyItems.length > 1) {
      const queuedIds = readyItems.slice(1).map((item) => item.queueId);
      setQueue((prev) =>
        prev.map((item) =>
          queuedIds.includes(item.queueId)
            ? { ...item, status: "queued" }
            : item,
        ),
      );
    }

    // Enable auto-start for subsequent downloads
    setIsDownloadingAll(true);

    // Start the first one (rest will be auto-started via useEffect)
    await startDownloadInternal(readyItems[0].queueId);
  };

  const handleOpenFolderPicker = () => {
    setShowFolderPicker(true);
    browseFolders(settings.downloadPath);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f] text-white overflow-hidden">
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          // Reset scroll position when switching tabs
          mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
        }}
      />

      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-3 py-4 md:px-4 md:py-8">
          {activeTab === "download" && (
            <div key="download-tab" className="tab-content-enter">
              <DownloadTab
                url={url}
                onUrlChange={setUrl}
                loading={loading}
                onFetch={addToQueue}
                error={error}
                queue={queue}
                onFormatChange={updateFormat}
                onAudioOnlyChange={updateAudioOnly}
                onDownload={startDownload}
                onDownloadAll={downloadAll}
                onCancel={cancelDownload}
                onRemove={removeFromQueue}
                onRetry={retryDownload}
                onClearCompleted={clearCompleted}
                isActive={activeTab === "download"}
                onSetAllAudioOnly={setAllAudioOnly}
                onCancelAllFetching={cancelAllFetching}
                onCancelAllDownloads={cancelAllDownloads}
                selectedItems={selectedItems}
                onToggleSelection={toggleItemSelection}
                onSelectAllReady={selectAllReady}
                onClearSelection={clearSelection}
                onDownloadSelected={downloadSelected}
                onRemoveSelected={removeSelected}
              />
            </div>
          )}

          {activeTab === "history" && (
            <div key="history-tab" className="tab-content-enter">
              <HistoryTab history={history} onClearHistory={clearHistory} />
            </div>
          )}

          {activeTab === "info" && (
            <div key="info-tab" className="tab-content-enter">
              <InfoTab />
            </div>
          )}

          {activeTab === "about" && (
            <div key="about-tab" className="tab-content-enter">
              <AboutTab />
            </div>
          )}

          {activeTab === "settings" && (
            <div key="settings-tab" className="tab-content-enter">
              <SettingsTab
                settings={settings}
                onSettingsChange={setSettings}
                onOpenFolderPicker={handleOpenFolderPicker}
                cookieStatus={cookieStatus}
                onCheckCookies={checkCookieStatus}
              />
            </div>
          )}
        </div>
      </main>

      {showFolderPicker && folderBrowser && (
        <FolderPicker
          folderBrowser={folderBrowser}
          onBrowse={browseFolders}
          onSelect={selectFolder}
          onClose={() => setShowFolderPicker(false)}
        />
      )}

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsDialog
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
      />

      {/* Floating System Status */}
      <FloatingStatus />

      {/* Floating Copyright Badge */}
      <FloatingCopyright />

      {/* Floating Legal Badge */}
      <FloatingLegal />
    </div>
  );
}

export default App;
