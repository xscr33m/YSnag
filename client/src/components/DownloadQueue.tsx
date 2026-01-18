import { useTranslation } from "react-i18next";
import type { QueueItem } from "../types";
import { QueueItemCard } from "./QueueItemCard";
import {
  FaDownload,
  FaMusic,
  FaVideo,
  FaTimes,
  FaCheckSquare,
  FaSquare,
  FaTrash,
} from "react-icons/fa";

interface DownloadQueueProps {
  queue: QueueItem[];
  onFormatChange: (queueId: string, format: string) => void;
  onAudioOnlyChange: (queueId: string, audioOnly: boolean) => void;
  onDownload: (queueId: string) => void;
  onDownloadAll: () => void;
  onCancel: (queueId: string) => void;
  onRemove: (queueId: string) => void;
  onRetry: (queueId: string) => void;
  onClearCompleted: () => void;
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

export function DownloadQueue({
  queue,
  onFormatChange,
  onAudioOnlyChange,
  onDownload,
  onDownloadAll,
  onCancel,
  onRemove,
  onRetry,
  onClearCompleted,
  onSetAllAudioOnly,
  onCancelAllFetching,
  onCancelAllDownloads,
  selectedItems,
  onToggleSelection,
  onSelectAllReady,
  onClearSelection,
  onDownloadSelected,
  onRemoveSelected,
}: DownloadQueueProps) {
  const { t } = useTranslation();
  const hasItems = queue.length > 0;
  const completedCount = queue.filter(
    (item) => item.status === "complete" || item.status === "cancelled",
  ).length;
  const activeCount = queue.filter(
    (item) => item.status === "downloading",
  ).length;
  const readyCount = queue.filter((item) => item.status === "ready").length;
  const queuedCount = queue.filter((item) => item.status === "queued").length;
  const fetchingCount = queue.filter(
    (item) => item.status === "fetching",
  ).length;

  const hasSelection = selectedItems.size > 0;
  const selectableCount = queue.filter(
    (item) => item.status === "ready" || item.status === "queued",
  ).length;

  if (!hasItems) return null;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Queue header */}
      <div className="flex flex-col gap-2 md:gap-3">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <h3 className="text-base md:text-lg font-semibold">
              {t("queue.title")}
            </h3>
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs flex-wrap">
              {fetchingCount > 0 && (
                <span className="px-1.5 md:px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1">
                  <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                  {fetchingCount} {t("queue.fetching")}
                </span>
              )}
              {activeCount > 0 && (
                <span className="px-1.5 md:px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full flex items-center gap-1">
                  <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-red-500 rounded-full animate-pulse" />
                  {activeCount} {t("queue.downloading")}
                </span>
              )}
              {queuedCount > 0 && (
                <span className="px-1.5 md:px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                  {queuedCount} {t("queue.queued")}
                </span>
              )}
              {readyCount > 0 && (
                <span className="px-1.5 md:px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full">
                  {readyCount} {t("queue.ready")}
                </span>
              )}
              {completedCount > 0 && (
                <span className="px-1.5 md:px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                  {completedCount} {t("queue.done")}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {readyCount > 0 && activeCount === 0 && queuedCount === 0 && (
              <button
                onClick={onDownloadAll}
                className="px-3 md:px-4 py-1 md:py-1.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-md md:rounded-lg text-xs md:text-sm font-medium transition-all cursor-pointer active:scale-[0.98] flex items-center gap-1.5 md:gap-2"
              >
                <FaDownload
                  className="w-3.5 h-3.5 md:w-4 md:h-4"
                  aria-hidden="true"
                />
                {t("queue.downloadAll")} ({readyCount})
              </button>
            )}
            {completedCount > 0 && (
              <button
                onClick={onClearCompleted}
                className="text-[10px] md:text-xs text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                {t("queue.clearCompleted")}
              </button>
            )}
          </div>
        </div>

        {/* Bulk actions toolbar */}
        <div className="flex flex-wrap items-center gap-2 py-2 px-3 bg-white/5 rounded-lg border border-white/10">
          {/* Bulk format toggles */}
          {selectableCount > 0 && (
            <>
              <button
                onClick={() => onSetAllAudioOnly(true)}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                title={t("queue.setAllAudio")}
              >
                <FaMusic className="w-3 h-3" />
                {t("queue.allAudio")}
              </button>
              <button
                onClick={() => onSetAllAudioOnly(false)}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                title={t("queue.setAllVideo")}
              >
                <FaVideo className="w-3 h-3" />
                {t("queue.allVideo")}
              </button>

              <div className="w-px h-4 bg-white/10" />
            </>
          )}

          {/* Cancel buttons */}
          {fetchingCount > 0 && (
            <button
              onClick={onCancelAllFetching}
              className="px-2 py-1 text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FaTimes className="w-3 h-3" />
              {t("queue.cancelFetching")} ({fetchingCount})
            </button>
          )}
          {activeCount > 0 && (
            <button
              onClick={onCancelAllDownloads}
              className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FaTimes className="w-3 h-3" />
              {t("queue.cancelDownloads")} ({activeCount})
            </button>
          )}

          {/* Multi-select controls */}
          {selectableCount > 0 && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <button
                onClick={hasSelection ? onClearSelection : onSelectAllReady}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {hasSelection ? (
                  <>
                    <FaSquare className="w-3 h-3" />
                    {t("queue.deselectAll")}
                  </>
                ) : (
                  <>
                    <FaCheckSquare className="w-3 h-3" />
                    {t("queue.selectAll")}
                  </>
                )}
              </button>
            </>
          )}

          {/* Selected items actions */}
          {hasSelection && (
            <>
              <span className="text-xs text-gray-500">
                {selectedItems.size} {t("queue.selected")}
              </span>
              <button
                onClick={onDownloadSelected}
                className="px-2 py-1 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FaDownload className="w-3 h-3" />
                {t("queue.downloadSelected")}
              </button>
              <button
                onClick={onRemoveSelected}
                className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FaTrash className="w-3 h-3" />
                {t("queue.removeSelected")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Queue items */}
      <div className="space-y-2 md:space-y-3">
        {queue.map((item) => (
          <QueueItemCard
            key={item.queueId}
            item={item}
            onFormatChange={onFormatChange}
            onAudioOnlyChange={onAudioOnlyChange}
            onDownload={onDownload}
            onCancel={onCancel}
            onRemove={onRemove}
            onRetry={onRetry}
            isDownloadActive={activeCount > 0}
            isSelected={selectedItems.has(item.queueId)}
            onToggleSelection={onToggleSelection}
            showCheckbox={selectableCount > 0}
          />
        ))}
      </div>
    </div>
  );
}
