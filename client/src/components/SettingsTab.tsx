import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Settings, CookieStatus } from "../types";
import { API_URL, SUPPORTED_BROWSERS, SUPPORTED_VIDEO_FORMATS } from "../types";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { ConfirmDialog } from "./ConfirmDialog";
import "flag-icons/css/flag-icons.min.css";
import {
  FaFolder,
  FaFolderOpen,
  FaGlobe,
  FaFirefox,
  FaChrome,
  FaEdge,
  FaOpera,
  FaSafari,
  FaLanguage,
  FaExclamationTriangle,
  FaBan,
  FaVideo,
  FaCheckCircle,
  FaSpinner,
  FaMagic,
  FaSync,
  FaTrash,
  FaDownload,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import { SiBrave } from "react-icons/si";
import type { IconType } from "react-icons";

const browserIcons: Record<string, IconType> = {
  firefox: FaFirefox,
  chrome: FaChrome,
  edge: FaEdge,
  opera: FaOpera,
  safari: FaSafari,
  brave: SiBrave,
  none: FaBan,
};

interface SettingsTabProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onOpenFolderPicker: () => void;
  cookieStatus: CookieStatus;
  onCheckCookies: (browser: string, forceRefresh?: boolean) => void;
}

export function SettingsTab({
  settings,
  onSettingsChange,
  onOpenFolderPicker,
  cookieStatus,
  onCheckCookies,
}: SettingsTabProps) {
  const { t, i18n } = useTranslation();
  const [isWindows] = useState(() =>
    navigator.userAgent.toLowerCase().includes("windows"),
  );
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const isElectron = !!window.electron?.isElectron;

  const updateBrowserSetting = async (browserValue: string) => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          browserForCookies: browserValue,
          browserAutoDetected: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onSettingsChange(data);
        onCheckCookies(browserValue, true);
      }
    } catch (err) {
      console.error("Failed to save browser setting:", err);
    }
  };

  const updateVideoFormat = async (formatValue: string) => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoFormat: formatValue }),
      });
      if (res.ok) {
        const data = await res.json();
        onSettingsChange(data);
      }
    } catch (err) {
      console.error("Failed to save video format setting:", err);
    }
  };

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem("ysnag-language", langCode);
    // Sync language to Electron main process for updater dialogs
    if (window.electron?.setLanguage) {
      window.electron.setLanguage(langCode);
    }
  };

  const openDownloadFolder = async () => {
    try {
      await fetch(`${API_URL}/api/open-folder`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to open folder:", err);
    }
  };

  const updateAutoCheckUpdates = async (enabled: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoCheckUpdates: enabled }),
      });
      if (res.ok) {
        const data = await res.json();
        onSettingsChange(data);
      }
    } catch (err) {
      console.error("Failed to save auto-check updates setting:", err);
    }
  };

  const checkForUpdates = async () => {
    if (!window.electron?.checkForUpdates) return;

    setIsCheckingUpdates(true);
    try {
      await window.electron.checkForUpdates();
    } catch (err) {
      console.error("Failed to check for updates:", err);
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 py-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            {t("settings.title")}
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            {t("settings.subtitle")}
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Download Location - Spans full width */}
        <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-xl border border-white/5 p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <FaFolder className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                {t("settings.downloadPath.label")}
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openDownloadFolder}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-all cursor-pointer active:scale-[0.98] flex items-center gap-2"
              >
                <FaFolderOpen className="w-3 h-3" />
                {t("settings.downloadPath.openFolder")}
              </button>
              <button
                onClick={onOpenFolderPicker}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-all cursor-pointer active:scale-[0.98]"
              >
                {t("settings.downloadPath.browse")}
              </button>
            </div>
          </div>

          <div className="bg-black/30 rounded-lg px-4 py-3">
            <p className="text-sm font-mono text-gray-300 truncate">
              {settings.downloadPath}
            </p>
          </div>
        </div>

        {/* Video Format */}
        <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <FaVideo className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              {t("settings.videoFormat.label")}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {SUPPORTED_VIDEO_FORMATS.map((format) => (
              <button
                key={format.value}
                onClick={() => updateVideoFormat(format.value)}
                aria-pressed={(settings.videoFormat || "mkv") === format.value}
                className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.98] ${
                  (settings.videoFormat || "mkv") === format.value
                    ? "bg-red-500/20 border-2 border-red-500 text-white"
                    : "bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                }`}
              >
                <span className="font-bold">{format.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <FaLanguage className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              {t("settings.language.label")}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                aria-pressed={
                  i18n.language === lang.code ||
                  i18n.language.startsWith(lang.code)
                }
                className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                  i18n.language === lang.code ||
                  i18n.language.startsWith(lang.code)
                    ? "bg-red-500/20 border-2 border-red-500 text-white"
                    : "bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                }`}
              >
                <span
                  className={`fi fi-${lang.countryCode} rounded-sm`}
                  style={{ fontSize: "1rem" }}
                />
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Browser Cookies - Spans full width on larger screens */}
        <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-xl border border-white/5 p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <FaGlobe className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {t("settings.browser.label")}
                </h3>
                <p className="text-[10px] text-gray-500">
                  {t("settings.browser.description")}
                </p>
              </div>
            </div>

            {/* Auto-detected badge */}
            {settings.browserAutoDetected &&
              settings.browserForCookies !== "none" && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded-full text-[10px] text-red-400">
                  <FaMagic className="w-2.5 h-2.5" />
                  <span>{t("settings.browser.autoDetected")}</span>
                </div>
              )}
          </div>

          {/* Browser Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-3">
            {SUPPORTED_BROWSERS.map((browser) => {
              const BrowserIcon = browserIcons[browser.icon] || FaGlobe;
              const isBlockedOnWindows =
                isWindows &&
                ["chrome", "chromium", "brave"].includes(browser.value);
              const isSelected = settings.browserForCookies === browser.value;

              return (
                <button
                  key={browser.value}
                  onClick={() =>
                    !isBlockedOnWindows && updateBrowserSetting(browser.value)
                  }
                  disabled={isBlockedOnWindows}
                  aria-pressed={isSelected}
                  title={
                    isBlockedOnWindows
                      ? t("settings.browser.windowsWarning.description")
                      : browser.label
                  }
                  className={`relative p-2.5 md:p-3 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                    isBlockedOnWindows
                      ? "bg-black/40 border border-red-500/20 text-gray-600 cursor-not-allowed opacity-40"
                      : isSelected
                        ? "bg-red-500/20 border-2 border-red-500 text-white cursor-pointer active:scale-[0.97]"
                        : "bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 cursor-pointer active:scale-[0.97]"
                  }`}
                >
                  <BrowserIcon className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-[9px] md:text-[10px] font-medium truncate max-w-full">
                    {browser.label}
                  </span>
                  {isBlockedOnWindows && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <FaBan className="w-2 h-2 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Cookie Status + Warnings */}
          <div className="space-y-2">
            {/* Windows Chrome/Brave Warning */}
            {isWindows &&
              ["chrome", "chromium", "brave"].includes(
                settings.browserForCookies,
              ) && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                  <FaExclamationTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-[10px] text-red-200">
                    <span className="font-semibold">
                      {t("settings.browser.windowsWarning.title")}
                    </span>
                    {" – "}
                    {t("settings.browser.windowsWarning.description")}
                  </div>
                </div>
              )}

            {/* Windows Edge Warning */}
            {isWindows && settings.browserForCookies === "edge" && (
              <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
                <FaExclamationTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-[10px] text-yellow-200">
                  <span className="font-semibold">
                    {t("settings.browser.windowsEdgeWarning.title")}
                  </span>
                  {" – "}
                  {t("settings.browser.windowsEdgeWarning.description")}
                </div>
              </div>
            )}

            {/* Cookie Status */}
            {settings.browserForCookies &&
              settings.browserForCookies !== "none" && (
                <div
                  className={`p-2.5 rounded-lg flex items-center gap-2 ${
                    cookieStatus.checking
                      ? "bg-gray-500/10 border border-gray-500/20"
                      : cookieStatus.hasCookies && !cookieStatus.needsLogin
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : cookieStatus.cookieError
                          ? "bg-red-500/10 border border-red-500/20"
                          : "bg-yellow-500/10 border border-yellow-500/20"
                  }`}
                >
                  {cookieStatus.checking ? (
                    <FaSpinner className="w-3.5 h-3.5 text-gray-400 animate-spin flex-shrink-0" />
                  ) : cookieStatus.hasCookies && !cookieStatus.needsLogin ? (
                    <FaCheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <FaExclamationTriangle
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        cookieStatus.cookieError
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    />
                  )}
                  <div
                    className={`flex-1 text-[10px] ${
                      cookieStatus.checking
                        ? "text-gray-300"
                        : cookieStatus.hasCookies && !cookieStatus.needsLogin
                          ? "text-emerald-200"
                          : cookieStatus.cookieError
                            ? "text-red-200"
                            : "text-yellow-200"
                    }`}
                  >
                    <span className="font-semibold">
                      {cookieStatus.checking
                        ? t("settings.browser.cookieStatus.checking")
                        : cookieStatus.hasCookies && !cookieStatus.needsLogin
                          ? t("settings.browser.cookieStatus.found")
                          : cookieStatus.cookieError
                            ? t("settings.browser.cookieStatus.error")
                            : t("settings.browser.cookieStatus.notLoggedIn")}
                    </span>
                    {" – "}
                    <span className="text-gray-400">
                      {cookieStatus.checking
                        ? t("settings.browser.cookieStatus.checkingDescription")
                        : cookieStatus.hasCookies && !cookieStatus.needsLogin
                          ? t("settings.browser.cookieStatus.foundDescription")
                          : cookieStatus.needsLogin
                            ? t(
                                "settings.browser.cookieStatus.notLoggedInDescription",
                              )
                            : cookieStatus.message}
                    </span>
                    {/* YouTube Login Link - show for needsLogin OR as helpful hint for cookieError */}
                    {!cookieStatus.checking &&
                      !cookieStatus.hasCookies &&
                      (cookieStatus.needsLogin || cookieStatus.cookieError) && (
                        <a
                          href="https://www.youtube.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`ml-2 hover:underline inline-flex items-center gap-1 ${
                            cookieStatus.cookieError
                              ? "text-red-400 hover:text-red-300"
                              : "text-yellow-400 hover:text-yellow-300"
                          }`}
                        >
                          {t("errors.openYouTube")}
                          <svg
                            className="w-2.5 h-2.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      )}
                  </div>
                  {!cookieStatus.checking && (
                    <button
                      onClick={() =>
                        onCheckCookies(settings.browserForCookies, true)
                      }
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                      title={t("settings.browser.cookieStatus.recheck")}
                    >
                      <FaSync className="w-3 h-3 text-gray-400 hover:text-white" />
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Updates - Only show in Electron */}
        {isElectron && (
          <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-xl border border-white/5 p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <FaDownload className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {t("settings.updates.label")}
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {t("settings.updates.description")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Auto-check toggle */}
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {settings.autoCheckUpdates !== false ? (
                    <FaToggleOn className="w-5 h-5 text-red-400" />
                  ) : (
                    <FaToggleOff className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <p className="text-sm text-white">
                      {t("settings.updates.autoCheck")}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {t("settings.updates.autoCheckDescription")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateAutoCheckUpdates(settings.autoCheckUpdates === false)
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.autoCheckUpdates !== false
                      ? "bg-red-500"
                      : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.autoCheckUpdates !== false
                        ? "translate-x-7"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Manual check button */}
              <button
                onClick={checkForUpdates}
                disabled={isCheckingUpdates}
                className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-all cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingUpdates ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    {t("settings.updates.checking")}
                  </>
                ) : (
                  <>
                    <FaSync className="w-4 h-4" />
                    {t("settings.updates.checkNow")}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Reset Settings */}
        <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-xl border border-white/5 p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <FaTrash className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {t("settings.reset.label")}
                </h3>
                <p className="text-[10px] text-gray-500">
                  {t("settings.reset.description")}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 transition-all cursor-pointer active:scale-[0.98] flex items-center gap-2"
            >
              <FaTrash className="w-3 h-3" />
              {t("settings.reset.button")}
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={async () => {
          setShowResetConfirm(false);
          try {
            // Reset server settings
            const res = await fetch(`${API_URL}/api/settings/reset`, {
              method: "POST",
            });
            if (res.ok) {
              const data = await res.json();
              onSettingsChange(data);
            }
            // Clear local storage
            localStorage.removeItem("ysnag-language");
            sessionStorage.clear();
            // Reset language to default
            i18n.changeLanguage("en");
            // Reload page to apply all changes
            window.location.reload();
          } catch (err) {
            console.error("Failed to reset settings:", err);
          }
        }}
        title={t("confirm.resetSettings.title")}
        message={t("confirm.resetSettings.message")}
        confirmText={t("confirm.resetSettings.confirm")}
        variant="danger"
      />
    </div>
  );
}
