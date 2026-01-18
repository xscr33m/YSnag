import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { QueueItem } from "../types";
import { DownloadQueue } from "./DownloadQueue";
import {
  FaLink,
  FaSpinner,
  FaPlus,
  FaTimes,
  FaKeyboard,
  FaListUl,
  FaMusic,
} from "react-icons/fa";

interface DownloadTabProps {
  url: string;
  onUrlChange: (url: string) => void;
  loading: boolean;
  onFetch: () => void;
  error: string;
  queue: QueueItem[];
  onFormatChange: (queueId: string, format: string) => void;
  onAudioOnlyChange: (queueId: string, audioOnly: boolean) => void;
  onDownload: (queueId: string) => void;
  onDownloadAll: () => void;
  onCancel: (queueId: string) => void;
  onRemove: (queueId: string) => void;
  onRetry: (queueId: string) => void;
  onClearCompleted: () => void;
  isActive?: boolean;
  // New bulk action props
  onSetAllAudioOnly: (audioOnly: boolean) => void;
  onCancelAllFetching: () => void;
  onCancelAllDownloads: () => void;
  // Multi-select props
  selectedItems: Set<string>;
  onToggleSelection: (queueId: string) => void;
  onSelectAllReady: () => void;
  onClearSelection: () => void;
  onDownloadSelected: () => void;
  onRemoveSelected: () => void;
}

export function DownloadTab({
  url,
  onUrlChange,
  loading,
  onFetch,
  error,
  queue,
  onFormatChange,
  onAudioOnlyChange,
  onDownload,
  onDownloadAll,
  onCancel,
  onRemove,
  onRetry,
  onClearCompleted,
  isActive = true,
  onSetAllAudioOnly,
  onCancelAllFetching,
  onCancelAllDownloads,
  selectedItems,
  onToggleSelection,
  onSelectAllReady,
  onClearSelection,
  onDownloadSelected,
  onRemoveSelected,
}: DownloadTabProps) {
  const { t } = useTranslation();
  const hasQueueItems = queue.length > 0;
  const heroInputRef = useRef<HTMLInputElement>(null);
  const compactInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount and when tab becomes active
  useEffect(() => {
    if (isActive) {
      // Small delay to ensure DOM is ready after tab switch animation
      const timer = setTimeout(() => {
        if (hasQueueItems) {
          compactInputRef.current?.focus();
        } else {
          heroInputRef.current?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isActive, hasQueueItems]);

  // Global Ctrl+V handler to paste URL from clipboard
  useEffect(() => {
    const handlePaste = async (e: KeyboardEvent) => {
      // Only handle Ctrl+V when not already focused on an input
      if (
        e.ctrlKey &&
        e.key === "v" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        try {
          const text = await navigator.clipboard.readText();
          if (
            text &&
            (text.includes("youtube.com") || text.includes("youtu.be"))
          ) {
            e.preventDefault();
            onUrlChange(text.trim());
          }
        } catch {
          // Clipboard access denied - ignore silently
        }
      }
    };

    document.addEventListener("keydown", handlePaste);
    return () => document.removeEventListener("keydown", handlePaste);
  }, [onUrlChange]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] md:min-h-[calc(100vh-150px)]">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Hero Section - shown when queue is empty */}
        {!hasQueueItems && (
          <div className="flex-1 flex flex-col items-center justify-center py-6 md:py-12 lg:py-16">
            {/* Hero Content - Centered Two Column Layout */}
            <div className="w-full max-w-6xl px-4 md:px-6">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 lg:gap-16 mb-8 md:mb-12">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full scale-150" />
                    <img
                      src="./Logo/ysnag-logo.png"
                      alt="YSnag Logo"
                      className="relative w-28 h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 drop-shadow-2xl"
                    />
                  </div>
                </div>

                {/* Welcome Text */}
                <div className="text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent leading-tight">
                    {t("hero.title")}
                  </h1>
                  <p className="text-gray-400 text-sm md:text-base lg:text-lg max-w-xl leading-relaxed">
                    {t("hero.subtitle")}
                  </p>
                </div>
              </div>

              {/* URL Input Card */}
              <div className="w-full bg-gradient-to-b from-white/[0.08] to-white/[0.04] rounded-2xl p-5 md:p-6 border border-white/10 shadow-2xl shadow-black/20">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      <FaLink
                        className="w-4 h-4 md:w-5 md:h-5"
                        aria-hidden="true"
                      />
                    </div>
                    <input
                      ref={heroInputRef}
                      type="text"
                      value={url}
                      onChange={(e) => onUrlChange(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && !loading && onFetch()
                      }
                      placeholder={t("input.placeholder")}
                      className="w-full pl-11 md:pl-12 pr-4 py-3.5 md:py-4 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all text-white placeholder-gray-500 text-sm md:text-base"
                      aria-label={t("common.aria.youtubeUrl")}
                    />
                  </div>
                  <button
                    onClick={onFetch}
                    disabled={loading || !url.trim()}
                    className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-white/10 disabled:to-white/5 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer rounded-xl font-semibold transition-all shadow-lg shadow-red-500/25 disabled:shadow-none flex items-center justify-center gap-2 active:scale-[0.98] disabled:active:scale-100 text-sm md:text-base"
                    aria-busy={loading}
                  >
                    {loading ? (
                      <FaSpinner
                        className="animate-spin h-4 w-4 md:h-5 md:w-5"
                        aria-hidden="true"
                      />
                    ) : (
                      <>
                        <FaPlus
                          className="w-4 h-4 md:w-5 md:h-5"
                          aria-hidden="true"
                        />
                        <span>{t("input.addToQueue")}</span>
                      </>
                    )}
                  </button>
                </div>
                {loading && (
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    {t("input.fetchingInfo")}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FaTimes
                      className="w-4 h-4 text-red-400"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Feature Cards */}
              <div className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="group flex items-center gap-3 p-4 bg-gradient-to-br from-white/[0.05] to-transparent rounded-xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
                    <FaKeyboard
                      className="w-5 h-5 md:w-6 md:h-6 text-red-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-medium text-white">
                      {t("features.quickPaste.title")}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {t("features.quickPaste.description")}
                    </p>
                  </div>
                </div>
                <div className="group flex items-center gap-3 p-4 bg-gradient-to-br from-white/[0.05] to-transparent rounded-xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
                    <FaListUl
                      className="w-5 h-5 md:w-6 md:h-6 text-red-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-medium text-white">
                      {t("features.playlists.title")}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {t("features.playlists.description")}
                    </p>
                  </div>
                </div>
                <div className="group flex items-center gap-3 p-4 bg-gradient-to-br from-white/[0.05] to-transparent rounded-xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
                    <FaMusic
                      className="w-5 h-5 md:w-6 md:h-6 text-red-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-medium text-white">
                      {t("features.audioOnly.title")}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {t("features.audioOnly.description")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compact Input + Queue - shown when queue has items */}
        {hasQueueItems && (
          <div className="space-y-4 md:space-y-6 pb-20 md:pb-24">
            {/* Compact URL Input */}
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.04] rounded-xl md:rounded-2xl p-3 md:p-4 border border-white/10">
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <div className="flex-1 relative">
                  <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    <FaLink
                      className="w-3.5 h-3.5 md:w-4 md:h-4"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    ref={compactInputRef}
                    type="text"
                    value={url}
                    onChange={(e) => onUrlChange(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !loading && onFetch()
                    }
                    placeholder={t("input.placeholderCompact")}
                    className="w-full pl-9 md:pl-11 pr-3 md:pr-4 py-2.5 md:py-3 bg-black/30 border border-white/10 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all text-white placeholder-gray-500 text-xs md:text-sm"
                    aria-label={t("common.aria.youtubeUrl")}
                  />
                </div>
                <button
                  onClick={onFetch}
                  disabled={loading || !url.trim()}
                  className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-white/10 disabled:to-white/5 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer rounded-lg md:rounded-xl font-medium text-xs md:text-sm transition-all shadow-lg shadow-red-500/25 disabled:shadow-none flex items-center justify-center gap-1.5 md:gap-2 active:scale-[0.98] disabled:active:scale-100"
                  aria-busy={loading}
                >
                  {loading ? (
                    <FaSpinner
                      className="animate-spin h-3.5 w-3.5 md:h-4 md:w-4"
                      aria-hidden="true"
                    />
                  ) : (
                    <>
                      <FaPlus
                        className="w-3.5 h-3.5 md:w-4 md:h-4"
                        aria-hidden="true"
                      />
                      <span>{t("input.add")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FaTimes
                    className="w-4 h-4 text-red-400"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Download Queue */}
            <DownloadQueue
              queue={queue}
              onFormatChange={onFormatChange}
              onAudioOnlyChange={onAudioOnlyChange}
              onDownload={onDownload}
              onDownloadAll={onDownloadAll}
              onCancel={onCancel}
              onRemove={onRemove}
              onRetry={onRetry}
              onClearCompleted={onClearCompleted}
              onSetAllAudioOnly={onSetAllAudioOnly}
              onCancelAllFetching={onCancelAllFetching}
              onCancelAllDownloads={onCancelAllDownloads}
              selectedItems={selectedItems}
              onToggleSelection={onToggleSelection}
              onSelectAllReady={onSelectAllReady}
              onClearSelection={onClearSelection}
              onDownloadSelected={onDownloadSelected}
              onRemoveSelected={onRemoveSelected}
            />
          </div>
        )}
      </div>
    </div>
  );
}
