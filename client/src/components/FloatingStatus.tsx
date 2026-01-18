import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { API_URL } from "../types";
import { isElectron } from "../electron.d";
import {
  FaServer,
  FaDownload,
  FaSync,
  FaFilm,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
  FaNodeJs,
} from "react-icons/fa";

interface ServerStatus {
  online: boolean;
  ytdlpInstalled: boolean;
  ytdlpVersion: string | null;
  ffmpegInstalled: boolean;
  nodeInstalled: boolean;
  nodeVersion: string | null;
  checking: boolean;
}

// Retry configuration for slow systems
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const CHECK_INTERVAL = 60000;
const REQUEST_TIMEOUT = 10000;

// Duration to show the hint text on initial load
const HINT_DISPLAY_DURATION = 10000;

export function FloatingStatus() {
  const { t } = useTranslation();
  const [showHint, setShowHint] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [status, setStatus] = useState<ServerStatus>({
    online: false,
    ytdlpInstalled: false,
    ytdlpVersion: null,
    ffmpegInstalled: false,
    nodeInstalled: false,
    nodeVersion: null,
    checking: true,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState<string>("unknown");
  const retriesRef = useRef(0);
  const lastSuccessRef = useRef<ServerStatus | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const checkStatusWithRetry = async (isManual = false): Promise<void> => {
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
          nodeInstalled: data.nodeInstalled,
          nodeVersion: data.nodeVersion,
          checking: false,
        };
        setStatus(newStatus);
        lastSuccessRef.current = newStatus;
        retriesRef.current = 0;
      } else {
        throw new Error("Server returned non-OK status");
      }
    } catch {
      retriesRef.current++;

      if (retriesRef.current < MAX_RETRIES) {
        setTimeout(() => checkStatusWithRetry(), RETRY_DELAY);
        return;
      }

      if (lastSuccessRef.current && !isManual) {
        setStatus({ ...lastSuccessRef.current, checking: false });
      } else {
        setStatus({
          online: false,
          ytdlpInstalled: false,
          ytdlpVersion: null,
          ffmpegInstalled: false,
          nodeInstalled: false,
          nodeVersion: null,
          checking: false,
        });
      }
      retriesRef.current = 0;
    }
  };

  const checkStatus = () => checkStatusWithRetry(true);

  useEffect(() => {
    checkStatusWithRetry(true);
    const interval = setInterval(
      () => checkStatusWithRetry(false),
      CHECK_INTERVAL,
    );
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get platform info
  useEffect(() => {
    if (isElectron() && window.electron?.getPlatform) {
      window.electron.getPlatform().then((p) => setPlatform(p));
    }
  }, []);

  // Auto-hide hint after HINT_DISPLAY_DURATION
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), HINT_DISPLAY_DURATION);
    return () => clearTimeout(timer);
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Auto-open popup when there's an error (after initial check completes)
  useEffect(() => {
    const hasError =
      !status.checking &&
      (!status.online ||
        !status.ytdlpInstalled ||
        !status.ffmpegInstalled ||
        !status.nodeInstalled);
    if (hasError) {
      setIsOpen(true);
    }
  }, [
    status.checking,
    status.online,
    status.ytdlpInstalled,
    status.ffmpegInstalled,
    status.nodeInstalled,
  ]);

  const allGood =
    status.online &&
    status.ytdlpInstalled &&
    status.ffmpegInstalled &&
    status.nodeInstalled;
  const hasIssues =
    !status.online ||
    !status.ytdlpInstalled ||
    !status.ffmpegInstalled ||
    !status.nodeInstalled;

  const getStatusColor = () => {
    if (status.checking) return "bg-yellow-500";
    if (allGood) return "bg-emerald-500";
    return "bg-red-500";
  };

  const getButtonStyles = () => {
    if (status.checking) {
      return "bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20";
    }
    if (allGood) {
      return "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20";
    }
    return "bg-red-500/10 border-red-500/30 hover:bg-red-500/20";
  };

  // Get hint text based on status
  const getHintText = () => {
    if (status.checking) return t("status.hintChecking");
    if (allGood) return t("status.hintReady");
    return t("status.hintIssues");
  };

  const getTextColor = () => {
    if (status.checking) return "text-yellow-400";
    if (allGood) return "text-emerald-400";
    return "text-red-400";
  };

  const showText = showHint || isHovered;

  return (
    <div className="fixed bottom-4 left-4 z-50" ref={popupRef}>
      {/* Floating Button with integrated hint */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative h-10 md:h-12 min-w-10 md:min-w-12 rounded-xl border backdrop-blur-sm shadow-lg transition-all duration-300 ease-in-out cursor-pointer active:scale-95 flex items-center justify-center overflow-hidden ${getButtonStyles()}`}
        aria-label={t("common.aria.systemStatus")}
        aria-expanded={isOpen}
      >
        {/* Status Dot - always centered */}
        <div className="relative flex-shrink-0 mx-3 md:mx-4">
          <div
            className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${getStatusColor()} ${
              status.checking ? "animate-pulse" : ""
            }`}
          />
          {allGood && !status.checking && (
            <div
              className={`absolute inset-0 w-3 h-3 md:w-4 md:h-4 rounded-full ${getStatusColor()} animate-ping opacity-50`}
            />
          )}
        </div>

        {/* Hint Text Container - animated width, appears to the right */}
        <div
          className={`hidden md:grid transition-all duration-300 ease-in-out ${
            showText
              ? "grid-cols-[1fr] opacity-100 pr-4 -ml-3 md:-ml-4"
              : "grid-cols-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <span
              className={`block text-xs font-medium whitespace-nowrap ${getTextColor()} ml-2`}
            >
              {getHintText()}
            </span>
          </div>
        </div>
      </button>

      {/* Popup */}
      {isOpen && (
        <div className="absolute bottom-14 md:bottom-16 left-0 w-72 md:w-80 bg-[#1a1a1a]/95 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div
            className={`px-4 py-3 border-b border-white/10 flex items-center justify-between ${
              status.checking
                ? "bg-yellow-500/10"
                : allGood
                  ? "bg-emerald-500/10"
                  : "bg-red-500/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} ${
                  status.checking ? "animate-pulse" : ""
                }`}
              />
              <span
                className={`text-sm font-medium ${
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
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <FaTimes className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Server Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <FaServer className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-sm text-gray-300">
                  {t("status.backendServer")}
                </span>
              </div>
              <StatusBadge
                active={status.online}
                activeText={t("status.serverOnline")}
                inactiveText={t("status.serverOffline")}
              />
            </div>

            {/* yt-dlp Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <FaDownload className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-sm text-gray-300">yt-dlp</span>
              </div>
              <StatusBadge
                active={status.ytdlpInstalled}
                activeText={status.ytdlpVersion || t("status.ytdlpReady")}
                inactiveText={t("status.ytdlpNotFound")}
              />
            </div>

            {/* ffmpeg Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <FaFilm className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-sm text-gray-300">ffmpeg</span>
              </div>
              <StatusBadge
                active={status.ffmpegInstalled}
                activeText={t("status.ffmpegReady")}
                inactiveText={t("status.ffmpegNotFound")}
              />
            </div>

            {/* Node.js Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <FaNodeJs className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-sm text-gray-300">Node.js</span>
              </div>
              <StatusBadge
                active={status.nodeInstalled}
                activeText={status.nodeVersion || t("status.nodeReady")}
                inactiveText={t("status.nodeNotFound")}
              />
            </div>

            {/* Help text for issues */}
            {!status.online && (
              <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-300">
                  {t("status.serverOfflineHelp")}
                </p>
              </div>
            )}
            {status.online && !status.ytdlpInstalled && (
              <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-300">
                  {t("status.ytdlpNotInstalledHelp")}
                </p>
                {platform === "linux" ? (
                  <div className="mt-2 space-y-1">
                    <code className="block bg-black/30 px-1.5 py-0.5 rounded text-red-400 text-xs">
                      sudo pacman -S yt-dlp
                    </code>
                    <code className="block bg-black/30 px-1.5 py-0.5 rounded text-red-400 text-xs">
                      sudo apt install yt-dlp
                    </code>
                    <code className="block bg-black/30 px-1.5 py-0.5 rounded text-red-400 text-xs">
                      sudo dnf install yt-dlp
                    </code>
                  </div>
                ) : (
                  <code className="bg-black/30 px-1.5 py-0.5 rounded text-red-400">
                    winget install yt-dlp
                  </code>
                )}
              </div>
            )}
            {status.online && !status.ffmpegInstalled && (
              <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-300">
                  {t("status.ffmpegNotInstalledHelp")}
                </p>
                {platform === "linux" ? (
                  <div className="mt-2 space-y-1">
                    <code className="block bg-black/30 px-1.5 py-0.5 rounded text-red-400 text-xs">
                      sudo pacman -S ffmpeg
                    </code>
                    <code className="block bg-black/30 px-1.5 py-0.5 rounded text-red-400 text-xs">
                      sudo apt install ffmpeg
                    </code>
                    <code className="block bg-black/30 px-1.5 py-0.5 rounded text-red-400 text-xs">
                      sudo dnf install ffmpeg
                    </code>
                  </div>
                ) : (
                  <code className="bg-black/30 px-1.5 py-0.5 rounded text-red-400">
                    winget install ffmpeg
                  </code>
                )}
              </div>
            )}
            {status.online && !status.nodeInstalled && (
              <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-300">
                  {t("status.nodeNotInstalledHelp")}
                </p>
                {platform === "linux" ? (
                  <div className="mt-2 space-y-1">
                    <code className="block bg-black/30 px-1.5 py-0.5 rounded text-red-400 text-xs">
                      sudo pacman -S nodejs npm
                    </code>
                    <code className="block bg-black/30 px-1.5 py-0.5 rounded text-red-400 text-xs">
                      sudo apt install nodejs npm
                    </code>
                    <code className="block bg-black/30 px-1.5 py-0.5 rounded text-red-400 text-xs">
                      sudo dnf install nodejs npm
                    </code>
                  </div>
                ) : (
                  <code className="bg-black/30 px-1.5 py-0.5 rounded text-red-400">
                    winget install OpenJS.NodeJS.LTS
                  </code>
                )}
              </div>
            )}

            {/* Refresh Button */}
            {hasIssues && !status.checking && (
              <button
                onClick={checkStatus}
                className="w-full mt-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <FaSync className="w-3.5 h-3.5" />
                {t("status.refreshStatus")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for status badges
function StatusBadge({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1.5 ${
        active
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-red-500/20 text-red-400"
      }`}
    >
      {active ? (
        <FaCheckCircle className="w-3 h-3" />
      ) : (
        <FaExclamationCircle className="w-3 h-3" />
      )}
      {active ? activeText : inactiveText}
    </span>
  );
}
