import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaTimes, FaKeyboard } from "react-icons/fa";

interface ShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

export function ShortcutsDialog({ isOpen, onClose }: ShortcutsDialogProps) {
  const { t } = useTranslation();

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts: Shortcut[] = [
    { keys: ["Ctrl", "V"], description: t("shortcuts.paste") },
    { keys: ["Enter"], description: t("shortcuts.submit") },
    { keys: ["Esc"], description: t("shortcuts.close") },
    { keys: ["?"], description: t("shortcuts.showShortcuts") },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-[#1a1a1a] to-[#141414] rounded-2xl border border-white/10 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <FaKeyboard className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              {t("shortcuts.title")}
            </h3>
            <p className="text-sm text-gray-400">{t("shortcuts.subtitle")}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            aria-label={t("common.close")}
          >
            <FaTimes className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0"
            >
              <span className="text-sm text-gray-300">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex} className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded-md text-xs font-mono text-gray-300">
                      {key}
                    </kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="text-gray-500 text-xs">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <p className="text-xs text-gray-500 text-center">
            {t("shortcuts.hint")}
          </p>
        </div>
      </div>
    </div>
  );
}
