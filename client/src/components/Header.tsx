import { useTranslation } from "react-i18next";
import { useRef, useState, useEffect } from "react";
import type { Tab } from "../types";
import {
  FaDownload,
  FaHistory,
  FaCog,
  FaInfoCircle,
  FaQuestionCircle,
} from "react-icons/fa";
import type { IconType } from "react-icons";

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const tabs: { id: Tab; labelKey: string; icon: IconType }[] = [
    { id: "download", labelKey: "nav.download", icon: FaDownload },
    { id: "history", labelKey: "nav.history", icon: FaHistory },
    { id: "about", labelKey: "nav.about", icon: FaInfoCircle },
    { id: "info", labelKey: "nav.help", icon: FaQuestionCircle },
    { id: "settings", labelKey: "nav.settings", icon: FaCog },
  ];

  // Update sliding indicator position
  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return;
      const activeButton = navRef.current.querySelector(
        `[data-tab="${activeTab}"]`,
      ) as HTMLElement;
      if (activeButton) {
        const navRect = navRef.current.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        setIndicatorStyle({
          left: buttonRect.left - navRect.left,
          width: buttonRect.width,
        });
      }
    };

    updateIndicator();
    // Small delay to ensure text has rendered after language change
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener("resize", updateIndicator);
    return () => {
      window.removeEventListener("resize", updateIndicator);
      clearTimeout(timer);
    };
  }, [activeTab, i18n.language]);

  return (
    <header className="flex-shrink-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto px-3 py-2.5 md:px-4 md:py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <button
            onClick={() => onTabChange("download")}
            className="flex items-center gap-2.5 md:gap-3 cursor-pointer group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img
                src="./Logo/ysnag-logo.png"
                alt="YSnag Logo"
                className="relative w-9 h-9 md:w-11 md:h-11 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div className="text-left">
              <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {t("app.name")}
              </h1>
              <p className="text-[9px] md:text-[10px] text-gray-500 hidden sm:block tracking-wide">
                YouTube Downloader
              </p>
            </div>
          </button>

          {/* Navigation Tabs */}
          <nav
            ref={navRef}
            className="relative flex bg-white/[0.03] rounded-xl p-1 border border-white/5"
          >
            {/* Sliding Indicator */}
            <div
              className="absolute top-1 bottom-1 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg border border-red-500/30 shadow-lg shadow-red-500/10"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                transition:
                  "left 300ms cubic-bezier(0.4, 0, 0.2, 1), width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />

            {/* Tab Buttons */}
            {tabs.map((tab) => (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-pressed={activeTab === tab.id}
                className={`relative z-10 px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 md:gap-2 cursor-pointer ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <tab.icon
                  className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-200 ${
                    activeTab === tab.id ? "scale-110" : ""
                  }`}
                />
                <span className="hidden sm:inline">{t(tab.labelKey)}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
