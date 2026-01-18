import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";

export type ConfirmDialogVariant = "danger" | "warning" | "info";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
}

const variantConfig: Record<
  ConfirmDialogVariant,
  {
    iconBg: string;
    iconColor: string;
    buttonBg: string;
    buttonHover: string;
  }
> = {
  danger: {
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    buttonBg: "bg-gradient-to-r from-red-600 to-red-500",
    buttonHover: "hover:from-red-500 hover:to-red-400",
  },
  warning: {
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    buttonBg: "bg-gradient-to-r from-amber-600 to-amber-500",
    buttonHover: "hover:from-amber-500 hover:to-amber-400",
  },
  info: {
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    buttonBg: "bg-gradient-to-r from-blue-600 to-blue-500",
    buttonHover: "hover:from-blue-500 hover:to-blue-400",
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const config = variantConfig[variant];

  // Close on Escape, confirm on Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
      if (e.key === "Enter" && !isLoading) {
        e.preventDefault();
        onConfirm();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Focus confirm button when dialog opens
      setTimeout(() => confirmButtonRef.current?.focus(), 50);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onConfirm, isLoading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={isLoading ? undefined : onClose}
    >
      <div
        className="bg-gradient-to-b from-[#1a1a1a] to-[#141414] rounded-2xl border border-white/10 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <div
            className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center`}
          >
            <FaExclamationTriangle className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              aria-label={t("common.close")}
            >
              <FaTimes className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText || t("common.cancel")}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 ${config.buttonBg} ${config.buttonHover} rounded-lg text-sm font-medium transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isLoading && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {confirmText || t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
