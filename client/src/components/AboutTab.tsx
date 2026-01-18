import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FaChevronDown,
  FaVideo,
  FaMusic,
  FaFolder,
  FaCookie,
  FaListUl,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTerminal,
  FaGlobe,
  FaShieldAlt,
  FaLock,
  FaHdd,
  FaGithub,
  FaHeart,
  FaInfoCircle,
  FaNode,
  FaStar,
  FaRocket,
  FaBolt,
  FaCoffee,
} from "react-icons/fa";
import { APP_VERSION } from "../config";
import appLogo from "/Logo/ysnag-logo.png";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 md:px-5 py-3 md:py-4 flex items-center justify-between cursor-pointer group hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            {icon}
          </div>
          <h2 className="text-sm md:text-base font-semibold text-white">
            {title}
          </h2>
        </div>
        <FaChevronDown
          className={`w-3 h-3 md:w-4 md:h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 md:px-5 pt-2 md:pt-3 pb-4 md:pb-5">{children}</div>
      )}
    </section>
  );
}

export function AboutTab() {
  const { t } = useTranslation();
  const [appInfo, setAppInfo] = useState<{
    version: string;
    platform: string;
    electron: string;
    node: string;
  } | null>(null);

  useEffect(() => {
    if (window.electron?.getAppInfo) {
      window.electron.getAppInfo().then(setAppInfo);
    }
  }, []);

  const features = [
    {
      icon: FaVideo,
      title: t("about.features.quality.title"),
      description: t("about.features.quality.description"),
    },
    {
      icon: FaMusic,
      title: t("about.features.audio.title"),
      description: t("about.features.audio.description"),
    },
    {
      icon: FaListUl,
      title: t("about.features.playlists.title"),
      description: t("about.features.playlists.description"),
    },
    {
      icon: FaFolder,
      title: t("about.features.organize.title"),
      description: t("about.features.organize.description"),
    },
    {
      icon: FaCookie,
      title: t("about.features.cookies.title"),
      description: t("about.features.cookies.description"),
    },
  ];

  const requirements = [
    {
      icon: FaTerminal,
      name: "yt-dlp",
      description: t("about.requirements.ytdlp"),
      link: "https://github.com/yt-dlp/yt-dlp",
    },
    {
      icon: FaVideo,
      name: "FFmpeg",
      description: t("about.requirements.ffmpeg"),
      link: "https://ffmpeg.org/download.html",
    },
    {
      icon: FaNode,
      name: "Node.js",
      description: t("about.requirements.nodejs"),
      link: "https://nodejs.org/en/download/",
    },
    {
      icon: FaGlobe,
      name: "Internet Connection",
      description: t("about.requirements.internet"),
      link: "https://www.whatismyip.com/how-to-check-internet-connection/",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 pb-20 md:pb-24">
      {/* App Header - Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600/20 via-red-500/10 to-transparent border border-red-500/20">
        {/* Background glow effect */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative px-6 py-8 md:py-12 text-center">
          {/* Logo */}
          <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-red-600/20 rounded-3xl blur-xl" />
            <img
              src={appLogo}
              alt="YSnag Logo"
              className="relative w-full h-full object-contain drop-shadow-2xl"
            />
          </div>

          {/* App Name & Tagline */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            YSnag
          </h1>
          <p className="text-base md:text-lg text-gray-300 mb-4 font-medium">
            {t("about.subtitle")}
          </p>

          {/* Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full text-xs font-medium text-red-300">
              <FaStar className="w-3 h-3" />
              {t("about.highlights.powerful")}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs font-medium text-emerald-300">
              <FaRocket className="w-3 h-3" />
              {t("about.highlights.fast")}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs font-medium text-blue-300">
              <FaBolt className="w-3 h-3" />
              {t("about.highlights.private")}
            </span>
          </div>

          {/* Version Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-black/30 backdrop-blur-sm rounded-full border border-white/10">
            <span className="text-sm font-mono text-white">
              v{appInfo?.version || APP_VERSION}
            </span>
            {appInfo?.platform && (
              <>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-sm text-gray-400 capitalize">
                  {appInfo.platform}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <CollapsibleSection
        title={t("about.features.title")}
        icon={<FaBolt className="w-3 h-3 md:w-4 md:h-4 text-red-400" />}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-black/20 rounded-xl border border-white/5"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-medium text-white mb-0.5">
                  {feature.title}
                </h3>
                <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* System Requirements */}
      <CollapsibleSection
        title={t("about.requirements.title")}
        icon={<FaTerminal className="w-3 h-3 md:w-4 md:h-4 text-red-400" />}
        defaultOpen={false}
      >
        <div className="space-y-3">
          <p className="text-xs md:text-sm text-gray-400 mb-4">
            {t("about.requirements.description")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {requirements.map((req, index) => (
              <a
                key={index}
                href={req.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5 hover:border-red-500/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                  <req.icon className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white group-hover:text-red-400 transition-colors">
                    {req.name}
                  </h3>
                  <p className="text-[10px] md:text-xs text-gray-500">
                    {req.description}
                  </p>
                </div>
                <FaGlobe className="w-4 h-4 text-gray-600 group-hover:text-red-400 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Privacy & Security */}
      <CollapsibleSection
        title={t("about.privacy.title")}
        icon={<FaLock className="w-3 h-3 md:w-4 md:h-4 text-red-400" />}
        defaultOpen={false}
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
            <FaCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-emerald-300 mb-1">
                {t("about.privacy.local.title")}
              </h3>
              <p className="text-xs text-gray-500">
                {t("about.privacy.local.description")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
            <FaCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-emerald-300 mb-1">
                {t("about.privacy.noTracking.title")}
              </h3>
              <p className="text-xs text-gray-500">
                {t("about.privacy.noTracking.description")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
            <FaExclamationTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-300 mb-1">
                {t("about.privacy.cookies.title")}
              </h3>
              <p className="text-xs text-gray-500">
                {t("about.privacy.cookies.description")}
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Tech Info */}
      {appInfo && (
        <CollapsibleSection
          title={t("about.techInfo.title")}
          icon={<FaInfoCircle className="w-3 h-3 md:w-4 md:h-4 text-red-400" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-black/20 rounded-lg text-center">
              <p className="text-[10px] text-gray-500 mb-1">
                {t("about.techInfo.version")}
              </p>
              <p className="text-sm font-mono text-white">{appInfo.version}</p>
            </div>
            <div className="p-3 bg-black/20 rounded-lg text-center">
              <p className="text-[10px] text-gray-500 mb-1">
                {t("about.techInfo.platform")}
              </p>
              <p className="text-sm font-mono text-white capitalize">
                {appInfo.platform}
              </p>
            </div>
            <div className="p-3 bg-black/20 rounded-lg text-center">
              <p className="text-[10px] text-gray-500 mb-1">Electron</p>
              <p className="text-sm font-mono text-white">{appInfo.electron}</p>
            </div>
            <div className="p-3 bg-black/20 rounded-lg text-center">
              <p className="text-[10px] text-gray-500 mb-1">Node.js</p>
              <p className="text-sm font-mono text-white">{appInfo.node}</p>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Support / Donate */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative px-5 py-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <FaCoffee className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {t("about.support.title")}
          </h3>
          <p className="text-sm text-gray-400 mb-5 max-w-md mx-auto">
            {t("about.support.description")}
          </p>
          <a
            href="https://ko-fi.com/xscr33m"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-105 active:scale-100"
          >
            <FaCoffee className="w-4 h-4" />
            {t("about.support.button")}
          </a>
          <p className="text-xs text-gray-500 mt-4">
            {t("about.support.note")}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-[10px] md:text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <FaShieldAlt className="w-3 h-3" />
            <span>{t("about.badges.privacy")}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-700" />
          <div className="flex items-center gap-1.5">
            <FaLock className="w-3 h-3" />
            <span>{t("about.badges.local")}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-700" />
          <div className="flex items-center gap-1.5">
            <FaHdd className="w-3 h-3" />
            <span>{t("about.badges.noCloud")}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2">
          <a
            href="https://github.com/xscr33m/YSnag"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors"
          >
            <FaGithub className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <span className="text-gray-700">•</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>{t("about.madeWith")}</span>
            <FaHeart className="w-3 h-3 text-red-500" />
            <span>by xscr33mLabs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
