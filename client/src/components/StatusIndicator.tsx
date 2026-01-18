import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { API_URL } from "../types";
import {
  FaServer,
  FaDownload,
  FaSync,
  FaChevronDown,
  FaFilm,
} from "react-icons/fa";

interface ServerStatus {
  online: boolean;
  ytdlpInstalled: boolean;
  ytdlpVersion: string | null;
  ffmpegInstalled: boolean;
  checking: boolean;
}

// Retry configuration for slow systems
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const CHECK_INTERVAL = 60000; // Check every 60 seconds instead of 30
const REQUEST_TIMEOUT = 10000; // 10 second timeout for slow systems

export function StatusIndicator() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ServerStatus>({
    online: false,
    ytdlpInstalled: false,
    ytdlpVersion: null,
    ffmpegInstalled: false,
    checking: true,
  });
  const [expanded, setExpanded] = useState(false);
  const retriesRef = useRef(0);
  const lastSuccessRef = useRef<ServerStatus | null>(null);

  const checkStatusWithRetry = useCallback(
    async (isManual = false): Promise<void> => {
      if (isManual) {
        retriesRef.current = 0;
      }

      setStatus((prev) => ({ ...prev, checking: true }));

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        const res = await fetch(`${API_URL}/api/status`, {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const newStatus = {
            online: true,
            ytdlpInstalled: data.ytdlpInstalled,
            ytdlpVersion: data.ytdlpVersion,
            ffmpegInstalled: data.ffmpegInstalled,
            checking: false,
          };
          setStatus(newStatus);
          lastSuccessRef.current = newStatus;
          retriesRef.current = 0;
        } else {
          throw new Error("Server returned non-OK status");
        }
      } catch {
        // On error, retry a few times before showing error state
        retriesRef.current++;

        if (retriesRef.current < MAX_RETRIES) {
          // Retry after delay
          setTimeout(() => checkStatusWithRetry(), RETRY_DELAY);
          return;
        }

        // After max retries, show error or use last known good state
        if (lastSuccessRef.current && !isManual) {
          // Keep last known good state for background checks
          setStatus({ ...lastSuccessRef.current, checking: false });
        } else {
          setStatus({
            online: false,
            ytdlpInstalled: false,
            ytdlpVersion: null,
            ffmpegInstalled: false,
            checking: false,
          });
        }
        retriesRef.current = 0;
      }
    },
    [],
  );

  const checkStatus = () => checkStatusWithRetry(true);

  useEffect(() => {
    // Initial check with retries
    checkStatusWithRetry(true);

    // Check status periodically (less frequently for slow systems)
    const interval = setInterval(
      () => checkStatusWithRetry(false),
      CHECK_INTERVAL,
    );
    return () => clearInterval(interval);
  }, [checkStatusWithRetry]);

  const allGood =
    status.online && status.ytdlpInstalled && status.ffmpegInstalled;
  const hasIssues =
    !status.online || !status.ytdlpInstalled || !status.ffmpegInstalled;

  return (
    <div className="mb-4 md:mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-2 md:p-3 rounded-lg md:rounded-xl border transition-all cursor-pointer ${
          status.checking
            ? "bg-yellow-500/5 border-yellow-500/20"
            : allGood
              ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
              : "bg-red-500/10 border-red-500/30 hover:bg-red-500/15"
        }`}
        aria-expanded={expanded}
        aria-label={t("common.aria.systemStatus")}
      >
        <div className="flex items-center gap-2 md:gap-3">
          {/* Status Indicator Dot */}
          <div className="relative">
            <div
              className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${
                status.checking
                  ? "bg-yellow-500 animate-pulse"
                  : allGood
                    ? "bg-emerald-500"
                    : "bg-red-500"
              }`}
            />
            {allGood && !status.checking && (
              <div className="absolute inset-0 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
            )}
          </div>

          <span
            className={`text-xs md:text-sm font-medium ${
              status.checking
                ? "text-yellow-400"
                : allGood
                  ? "text-emerald-400"
                  : "text-red-400"
            }`}
          >
            {status.checking
              ? t("status.checking")
              : allGood
                ? t("status.allOperational")
                : t("status.issuesDetected")}
          </span>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          {hasIssues && !status.checking && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                checkStatus();
              }}
              className="p-1 md:p-1.5 hover:bg-white/10 rounded-md md:rounded-lg transition-colors"
              aria-label={t("status.refreshStatus")}
            >
              <FaSync className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
            </button>
          )}
          <FaChevronDown
            className={`w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-1.5 md:mt-2 p-3 md:p-4 bg-white/[0.03] rounded-lg md:rounded-xl border border-white/5 space-y-2 md:space-y-3">
          {/* Server Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 md:gap-2">
              <FaServer className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
              <span className="text-xs md:text-sm text-gray-400">
                {t("status.backendServer")}
              </span>
            </div>
            <span
              className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded ${
                status.online
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {status.online
                ? t("status.serverOnline")
                : t("status.serverOffline")}
            </span>
          </div>

          {/* yt-dlp Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 md:gap-2">
              <FaDownload className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
              <span className="text-xs md:text-sm text-gray-400">yt-dlp</span>
            </div>
            <span
              className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded ${
                status.ytdlpInstalled
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {status.ytdlpInstalled
                ? status.ytdlpVersion || t("status.ytdlpReady")
                : t("status.ytdlpNotFound")}
            </span>
          </div>

          {/* ffmpeg Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 md:gap-2">
              <FaFilm className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
              <span className="text-xs md:text-sm text-gray-400">ffmpeg</span>
            </div>
            <span
              className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded ${
                status.ffmpegInstalled
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {status.ffmpegInstalled
                ? t("status.ffmpegReady")
                : t("status.ffmpegNotFound")}
            </span>
          </div>

          {/* Help text for issues */}
          {!status.online && (
            <p className="text-[10px] md:text-xs text-red-400/80 mt-1.5 md:mt-2 p-1.5 md:p-2 bg-red-500/10 rounded-md md:rounded-lg">
              {t("status.serverOfflineHelp")}{" "}
              <code className="bg-black/30 px-1 rounded">npm run dev</code>
            </p>
          )}
          {status.online && !status.ytdlpInstalled && (
            <p className="text-[10px] md:text-xs text-red-400/80 mt-1.5 md:mt-2 p-1.5 md:p-2 bg-red-500/10 rounded-md md:rounded-lg">
              {t("status.ytdlpNotInstalledHelp")}{" "}
              <code className="bg-black/30 px-1 rounded">npm run setup</code>{" "}
              {t("status.orInstallManually")}
            </p>
          )}
          {status.online && !status.ffmpegInstalled && (
            <p className="text-[10px] md:text-xs text-red-400/80 mt-1.5 md:mt-2 p-1.5 md:p-2 bg-red-500/10 rounded-md md:rounded-lg">
              {t("status.ffmpegNotInstalledHelp")}{" "}
              <code className="bg-black/30 px-1 rounded">npm run setup</code>{" "}
              {t("status.orInstallManually")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
