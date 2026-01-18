import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { QueueItem } from "../types";
import { formatDuration, formatViews, formatFileSize, API_URL } from "../types";
import {
  FaSpinner,
  FaTimes,
  FaExclamationTriangle,
  FaCheck,
  FaClock,
  FaFolderOpen,
  FaRedo,
  FaPlayCircle,
  FaCheckSquare,
  FaSquare,
} from "react-icons/fa";

interface QueueItemCardProps {
  item: QueueItem;
  onFormatChange: (queueId: string, format: string) => void;
  onAudioOnlyChange: (queueId: string, audioOnly: boolean) => void;
  onDownload: (queueId: string) => void;
  onCancel: (queueId: string) => void;
  onRemove: (queueId: string) => void;
  onRetry?: (queueId: string) => void;
  isDownloadActive?: boolean;
  // Multi-select props
  isSelected?: boolean;
  onToggleSelection?: (queueId: string) => void;
  showCheckbox?: boolean;
}

export function QueueItemCard({
  item,
  onFormatChange,
  onAudioOnlyChange,
  onDownload,
  onCancel,
  onRemove,
  onRetry,
  isDownloadActive = false,
  isSelected = false,
  onToggleSelection,
  showCheckbox = false,
}: QueueItemCardProps) {
  const isActive = item.status === "downloading" || item.status === "fetching";
  const isComplete = item.status === "complete";
  const isError = item.status === "error";
  const isCancelled = item.status === "cancelled";
  const isReady = item.status === "ready";
  const isQueued = item.status === "queued";
  const [thumbnailError, setThumbnailError] = useState(false);
  const { t } = useTranslation();

  // Fetching state - Show skeleton with loading indicator
  if (item.status === "fetching") {
    return (
      <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.04] rounded-lg md:rounded-xl border border-white/10 p-3 md:p-4">
        <div className="flex items-start gap-3 md:gap-4">
          {/* Thumbnail skeleton with spinner overlay */}
          <div className="relative w-24 h-16 md:w-32 md:h-20 flex-shrink-0">
            <div className="absolute inset-0 skeleton rounded-md md:rounded-lg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <FaSpinner className="animate-spin h-5 w-5 md:h-6 md:w-6 text-gray-500" />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
            <p className="text-[10px] md:text-xs text-gray-500 mt-1">
              {t("queue.fetchingInfo")}
            </p>
          </div>

          <button
            onClick={() => onRemove(item.queueId)}
            className="p-1.5 md:p-2 hover:bg-white/10 rounded-md md:rounded-lg transition-colors cursor-pointer"
            aria-label={t("common.aria.removeFromQueue")}
          >
            <FaTimes className="w-4 h-4 md:w-5 md:h-5 text-gray-500 hover:text-red-400" />
          </button>
        </div>
      </div>
    );
  }

  // Error state (fetching failed)
  if (!item.videoInfo && isError) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg md:rounded-xl p-3 md:p-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-24 h-16 md:w-32 md:h-20 bg-red-500/10 rounded-md md:rounded-lg flex items-center justify-center">
            <FaExclamationTriangle className="w-6 h-6 md:w-8 md:h-8 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm text-red-300 truncate">
              {item.url}
            </p>
            <p className="text-[10px] md:text-xs text-red-400 mt-1">
              {item.error || t("queue.fetchFailed")}
            </p>
          </div>
          <button
            onClick={() => onRemove(item.queueId)}
            className="p-1.5 md:p-2 hover:bg-white/10 rounded-md md:rounded-lg transition-colors cursor-pointer"
            aria-label={t("common.aria.removeFromQueue")}
          >
            <FaTimes className="w-4 h-4 md:w-5 md:h-5 text-gray-500 hover:text-white" />
          </button>
        </div>
      </div>
    );
  }

  if (!item.videoInfo) return null;

  const { videoInfo } = item;

  return (
    <div
      className={`bg-gradient-to-b from-white/[0.08] to-white/[0.04] rounded-lg md:rounded-xl border transition-all ${
        isComplete
          ? "border-emerald-500/30 bg-emerald-500/5"
          : isError
            ? "border-red-500/30 bg-red-500/5"
            : isCancelled
              ? "border-yellow-500/30 bg-yellow-500/5"
              : "border-white/10"
      }`}
    >
      <div className="p-3 md:p-4">
        <div className="flex gap-3 md:gap-4">
          {/* Selection checkbox */}
          {showCheckbox && (isReady || isQueued) && onToggleSelection && (
            <button
              onClick={() => onToggleSelection(item.queueId)}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors cursor-pointer self-center"
              aria-label={
                isSelected ? t("common.aria.deselect") : t("common.aria.select")
              }
            >
              {isSelected ? (
                <FaCheckSquare className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
              ) : (
                <FaSquare className="w-4 h-4 md:w-5 md:h-5 text-gray-500 hover:text-gray-300" />
              )}
            </button>
          )}

          {/* Thumbnail */}
          <div className="relative flex-shrink-0">
            {thumbnailError ? (
              <div className="w-24 h-16 md:w-32 md:h-20 bg-white/5 rounded-md md:rounded-lg flex items-center justify-center">
                <FaPlayCircle className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
              </div>
            ) : (
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="w-24 h-16 md:w-32 md:h-20 object-cover rounded-md md:rounded-lg"
                onError={() => setThumbnailError(true)}
              />
            )}
            <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 bg-black/80 px-1 md:px-1.5 py-0.5 rounded text-[10px] md:text-xs">
              {formatDuration(videoInfo.duration)}
            </div>
            {isComplete && (
              <div className="absolute inset-0 bg-emerald-500/20 rounded-md md:rounded-lg flex items-center justify-center">
                <FaCheck className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-xs md:text-sm line-clamp-2 mb-0.5 md:mb-1">
              {videoInfo.title}
            </h4>
            <p className="text-gray-500 text-[10px] md:text-xs mb-1 md:mb-2">
              {videoInfo.uploader}
            </p>
            <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500">
              <span>
                {formatViews(videoInfo.viewCount)} {t("common.views")}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-end gap-1.5 md:gap-2 flex-shrink-0">
            {/* Remove button (always visible except during download) */}
            {!isActive && (
              <button
                onClick={() => onRemove(item.queueId)}
                className="p-1 md:p-1.5 hover:bg-white/10 rounded-md md:rounded-lg transition-colors cursor-pointer"
                aria-label={t("common.aria.removeFromQueue")}
              >
                <FaTimes className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500 hover:text-red-400" />
              </button>
            )}

            {/* Status badges */}
            {isQueued && (
              <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-gray-500/20 text-gray-400 rounded-md md:rounded-lg flex items-center gap-1">
                <FaClock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                {t("queue.status.queued")}
              </span>
            )}
            {isComplete && (
              <>
                <button
                  onClick={async () => {
                    try {
                      await fetch(`${API_URL}/api/open-folder`, {
                        method: "POST",
                      });
                    } catch (err) {
                      console.error("Failed to open folder:", err);
                    }
                  }}
                  className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-emerald-500/20 text-emerald-400 rounded-md md:rounded-lg flex items-center gap-1 md:gap-1.5 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                >
                  <FaFolderOpen className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  {t("queue.openFolder")}
                </button>
              </>
            )}
            {isCancelled && (
              <>
                {onRetry && (
                  <button
                    onClick={() => onRetry(item.queueId)}
                    className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-yellow-500/20 text-yellow-400 rounded-md md:rounded-lg flex items-center gap-1 md:gap-1.5 hover:bg-yellow-500/30 transition-colors cursor-pointer"
                  >
                    <FaRedo className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    {t("queue.retry")}
                  </button>
                )}
                <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-yellow-500/20 text-yellow-400 rounded-md md:rounded-lg">
                  {t("queue.status.cancelled")}
                </span>
              </>
            )}
            {isError && item.videoInfo && (
              <>
                {onRetry && (
                  <button
                    onClick={() => onRetry(item.queueId)}
                    className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-red-500/20 text-red-400 rounded-md md:rounded-lg flex items-center gap-1 md:gap-1.5 hover:bg-red-500/30 transition-colors cursor-pointer"
                  >
                    <FaRedo className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    {t("queue.retry")}
                  </button>
                )}
                <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-red-500/20 text-red-400 rounded-md md:rounded-lg">
                  {t("queue.status.error")}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Format options (only when ready) */}
        {isReady && (
          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/5 flex flex-wrap items-center gap-2 md:gap-3">
            {/* Audio/Video toggle */}
            <div
              className="flex bg-black/30 rounded-md md:rounded-lg p-0.5"
              role="radiogroup"
              aria-label={t("common.aria.formatType")}
            >
              <button
                onClick={() => onAudioOnlyChange(item.queueId, false)}
                aria-pressed={!item.audioOnly}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-sm md:rounded-md text-[10px] md:text-xs font-medium transition-all cursor-pointer ${
                  !item.audioOnly
                    ? "bg-red-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t("queue.video")}
              </button>
              <button
                onClick={() => onAudioOnlyChange(item.queueId, true)}
                aria-pressed={item.audioOnly}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-sm md:rounded-md text-[10px] md:text-xs font-medium transition-all cursor-pointer ${
                  item.audioOnly
                    ? "bg-red-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                MP3
              </button>
            </div>

            {/* Quality selector */}
            {!item.audioOnly && (
              <select
                value={item.selectedFormat}
                onChange={(e) => onFormatChange(item.queueId, e.target.value)}
                className="bg-black/30 border border-white/10 rounded-md md:rounded-lg px-1.5 md:px-2 py-1 md:py-1.5 text-[10px] md:text-xs focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                aria-label={t("common.aria.videoQuality")}
              >
                <option value="best">{t("queue.bestQuality")}</option>
                {videoInfo.formats.map((f) => (
                  <option key={f.formatId} value={f.formatId}>
                    {f.resolution} {f.fps > 30 ? `${f.fps}fps` : ""} (
                    {formatFileSize(f.filesize)})
                  </option>
                ))}
              </select>
            )}

            {/* Download button */}
            <button
              onClick={() => onDownload(item.queueId)}
              disabled={isDownloadActive}
              title={
                isDownloadActive
                  ? "Another download is in progress"
                  : "Start download"
              }
              className={`ml-auto px-3 md:px-4 py-1 md:py-1.5 rounded-md md:rounded-lg text-[10px] md:text-xs font-medium transition-all ${
                isDownloadActive
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 cursor-pointer active:scale-[0.98]"
              }`}
            >
              {t("queue.download")}
            </button>
          </div>
        )}

        {/* Progress bar (downloading) */}
        {item.status === "downloading" && (
          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/5">
            {/* Status message */}
            <p className="text-[10px] md:text-xs text-gray-400 mb-1.5 md:mb-2 break-words leading-relaxed">
              {item.statusMessage}
            </p>

            {/* Progress bar row */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex-1">
                <div className="h-1 md:h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>

              {/* Percentage */}
              <span className="text-white font-medium text-xs md:text-sm min-w-[2.5rem] md:min-w-[3rem] text-right">
                {Math.round(item.progress)}%
              </span>

              {/* Cancel button */}
              <button
                onClick={() => onCancel(item.queueId)}
                className="px-2 md:px-3 py-1 md:py-1.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 rounded-md md:rounded-lg text-[10px] md:text-xs text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                aria-label={t("queue.cancelDownload")}
              >
                {t("queue.cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Error message for download errors */}
        {isError && item.videoInfo && item.error && (
          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-red-500/20">
            <p className="text-[10px] md:text-xs text-red-400">{item.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
