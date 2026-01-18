import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  FaTimes,
  FaBalanceScale,
  FaShieldAlt,
  FaFileContract,
  FaInfoCircle,
} from "react-icons/fa";
import { APP_VERSION, APP_AUTHOR_FULL } from "../config";

type LegalTab = "disclaimer" | "privacy" | "terms";

// Duration to show the hint text on initial load
const HINT_DISPLAY_DURATION = 10000;

export function FloatingLegal() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState<LegalTab>("disclaimer");
  const popupRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();

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

  const tabs: {
    id: LegalTab;
    icon: typeof FaBalanceScale;
    labelKey: string;
  }[] = [
    { id: "disclaimer", icon: FaInfoCircle, labelKey: "legal.tabs.disclaimer" },
    { id: "privacy", icon: FaShieldAlt, labelKey: "legal.tabs.privacy" },
    { id: "terms", icon: FaFileContract, labelKey: "legal.tabs.terms" },
  ];

  const showText = showHint || isHovered;

  return (
    <div className="fixed bottom-4 right-4 z-50" ref={popupRef}>
      {/* Floating Legal Button with integrated hint */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative h-10 md:h-12 min-w-10 md:min-w-12 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 backdrop-blur-sm shadow-lg shadow-red-500/10 transition-all duration-300 ease-in-out cursor-pointer active:scale-95 flex items-center justify-center overflow-hidden"
        aria-label={t("legal.aria.openLegal")}
        aria-expanded={isOpen}
      >
        {/* Hint Text Container - animated width, appears to the left */}
        <div
          className={`hidden md:grid transition-all duration-300 ease-in-out ${
            showText
              ? "grid-cols-[1fr] opacity-100 pl-4 -mr-3 md:-mr-4"
              : "grid-cols-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <span className="block text-xs font-medium whitespace-nowrap text-red-300 mr-2">
              {t("legal.hint")}
            </span>
          </div>
        </div>

        {/* Icon - always centered */}
        <FaBalanceScale className="w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0 mx-3 md:mx-4" />
      </button>

      {/* Fullscreen Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] bg-[#1a1a1a] rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-transparent flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/20">
                  <FaBalanceScale className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-white">
                    {t("legal.title")}
                  </h2>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    YSnag v{APP_VERSION}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                aria-label={t("common.close")}
              >
                <FaTimes className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 flex-shrink-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      // Reset scroll position when switching tabs
                      contentRef.current?.scrollTo({
                        top: 0,
                        behavior: "instant",
                      });
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "text-red-400 bg-red-500/10 border-b-2 border-red-500"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{t(tab.labelKey)}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
              {activeTab === "disclaimer" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Developer / Contact */}
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.disclaimer.developer")}
                    </h3>
                    <div className="bg-black/30 rounded-xl p-4 space-y-2">
                      <p className="text-sm text-white font-medium">
                        xscr33mLabs
                      </p>
                      <a
                        className="text-sm text-gray-500 hover:text-gray-300 hover:underline transition-colors"
                        href="https://xscr33mlabs.com/contact"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("legal.disclaimer.contact")}: xscr33mlabs.com
                      </a>
                    </div>
                  </div>

                  {/* Liability Disclaimer */}
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.disclaimer.liability")}
                    </h3>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {t("legal.disclaimer.liabilityText")}
                      </p>
                    </div>
                  </div>

                  {/* No Warranty */}
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.disclaimer.noWarranty")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t("legal.disclaimer.noWarrantyText")}
                    </p>
                  </div>

                  {/* User Responsibility */}
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.disclaimer.userResponsibility")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t("legal.disclaimer.userResponsibilityText")}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "privacy" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.privacy.title")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t("legal.privacy.intro")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.privacy.dataCollection")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t("legal.privacy.dataCollectionText")}
                    </p>
                    <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside ml-2">
                      <li>{t("legal.privacy.noTracking")}</li>
                      <li>{t("legal.privacy.localStorage")}</li>
                      <li>{t("legal.privacy.noThirdParty")}</li>
                      <li>{t("legal.privacy.noServerStorage")}</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.privacy.localProcessing")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t("legal.privacy.localProcessingText")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.privacy.cookies")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t("legal.privacy.cookiesText")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.privacy.thirdPartyServices")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t("legal.privacy.thirdPartyServicesText")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.privacy.yourRights")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t("legal.privacy.yourRightsText")}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "terms" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.terms.title")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t("legal.terms.intro")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.terms.scope")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t("legal.terms.scopeText")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.terms.usage")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-2">
                      {t("legal.terms.usageIntro")}
                    </p>
                    <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside ml-2">
                      <li>{t("legal.terms.personalUse")}</li>
                      <li>{t("legal.terms.copyrightRespect")}</li>
                      <li>{t("legal.terms.noCommercial")}</li>
                      <li>{t("legal.terms.legalCompliance")}</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.terms.userResponsibility")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t("legal.terms.userResponsibilityText")}
                    </p>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
                    <h3 className="text-base font-semibold text-red-400">
                      {t("legal.terms.disclaimer")}
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {t("legal.terms.disclaimerText")}
                    </p>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 space-y-3">
                    <h3 className="text-base font-semibold text-yellow-400">
                      {t("legal.terms.liability")}
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {t("legal.terms.liabilityText")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.terms.intellectualProperty")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t("legal.terms.intellectualPropertyText")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.terms.termination")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t("legal.terms.terminationText")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">
                      {t("legal.terms.governingLaw")}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t("legal.terms.governingLawText")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-t border-white/10 bg-black/20 flex-shrink-0">
              <p className="text-[10px] sm:text-xs text-gray-500 text-center">
                © {currentYear} {APP_AUTHOR_FULL} • YSnag v{APP_VERSION}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
