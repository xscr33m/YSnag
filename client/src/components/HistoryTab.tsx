import { useTranslation } from "react-i18next";
import type { HistoryItem } from "../types";
import { formatDuration, formatDate } from "../types";
import { FaClock, FaExternalLinkAlt, FaYoutube } from "react-icons/fa";

interface HistoryTabProps {
  history: HistoryItem[];
  onClearHistory: () => void;
}

export function HistoryTab({ history, onClearHistory }: HistoryTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">
            {t("history.title")}
          </h2>
          <p className="text-gray-500 text-xs md:text-sm mt-1">
            {history.length} {history.length === 1 ? "download" : "downloads"}{" "}
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-3 md:px-4 py-1.5 md:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-400 hover:text-white transition-all cursor-pointer active:scale-[0.98]"
          >
            {t("history.clearHistory")}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-10 md:py-16 bg-gradient-to-b from-white/[0.04] to-transparent rounded-xl md:rounded-2xl border border-white/5">
          <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-white/5 rounded-lg md:rounded-xl flex items-center justify-center">
            <FaClock className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
          </div>
          <h3 className="text-base md:text-lg font-medium text-gray-400 mb-1">
            {t("history.empty.title")}
          </h3>
          <p className="text-gray-600 text-xs md:text-sm">
            {t("history.empty.description")}
          </p>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-3">
          {history.map((item) => (
            <a
              key={item.id + item.downloadedAt}
              href={`https://www.youtube.com/watch?v=${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-lg md:rounded-xl border border-white/10 p-3 md:p-4 flex gap-3 md:gap-4 hover:bg-white/[0.08] transition-all group cursor-pointer block"
              title="Open on YouTube"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-24 h-16 md:w-32 md:h-20 object-cover rounded-md md:rounded-lg group-hover:ring-2 ring-red-500/50 transition-all"
                />
                <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 bg-black/80 px-1 md:px-1.5 py-0.5 rounded text-[10px] md:text-xs">
                  {formatDuration(item.duration)}
                </div>
                {/* YouTube overlay icon on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md md:rounded-lg">
                  <FaYoutube className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-xs md:text-sm line-clamp-2 mb-0.5 md:mb-1 group-hover:text-red-400 transition-colors">
                  {item.title}
                </h4>
                <p className="text-gray-500 text-[10px] md:text-xs mb-1 md:mb-2">
                  {item.uploader}
                </p>
                <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-gray-500">
                  <span
                    className={`px-1.5 md:px-2 py-0.5 rounded ${
                      item.audioOnly
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {item.audioOnly ? "MP3" : t("history.video")}
                  </span>
                  <span>{formatDate(item.downloadedAt)}</span>
                  <span className="ml-auto text-gray-600 group-hover:text-red-400 transition-colors flex items-center gap-1">
                    <FaExternalLinkAlt className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    <span className="hidden sm:inline">YouTube</span>
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
