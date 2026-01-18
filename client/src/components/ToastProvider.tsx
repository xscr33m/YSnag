import { createContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";

// Toast types
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Export context for useToast hook
export { ToastContext };

// Generate unique ID
const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

// Toast icons and colors
const toastConfig: Record<
  ToastType,
  {
    icon: typeof FaCheckCircle;
    bgColor: string;
    borderColor: string;
    textColor: string;
  }
> = {
  success: {
    icon: FaCheckCircle,
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    textColor: "text-emerald-400",
  },
  error: {
    icon: FaExclamationCircle,
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    textColor: "text-red-400",
  },
  warning: {
    icon: FaExclamationTriangle,
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
  },
  info: {
    icon: FaInfoCircle,
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
  },
};

// Single Toast Component
function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const duration = toast.duration ?? 5000;
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border backdrop-blur-md rounded-xl shadow-lg overflow-hidden animate-in slide-in-from-right-5 fade-in duration-300`}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={`w-6 h-6 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}
        >
          <Icon className={`w-4 h-4 ${config.textColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.textColor}`}>
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-xs text-gray-400 mt-0.5">{toast.message}</p>
          )}
          {toast.action && (
            <div className="mt-2">
              {toast.action.href ? (
                <a
                  href={toast.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.textColor} hover:underline`}
                  onClick={() => onRemove(toast.id)}
                >
                  {toast.action.label}
                  <svg
                    className="w-3 h-3"
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
              ) : toast.action.onClick ? (
                <button
                  onClick={() => {
                    toast.action?.onClick?.();
                    onRemove(toast.id);
                  }}
                  className={`text-xs font-medium ${config.textColor} hover:underline cursor-pointer`}
                >
                  {toast.action.label}
                </button>
              ) : null}
            </div>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer flex-shrink-0"
          aria-label="Dismiss"
        >
          <FaTimes className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-black/20">
        <div
          className={`h-full ${config.textColor.replace(
            "text-",
            "bg-",
          )} animate-shrink-width`}
          style={{
            animation: `shrink-width ${
              toast.duration ?? 5000
            }ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

// Toast Provider Component
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const newToast: Toast = {
      ...toast,
      id: generateId(),
    };
    setToasts((prev) => [...prev, newToast].slice(-5)); // Keep max 5 toasts
  }, []);

  const success = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "success", title, message });
    },
    [addToast],
  );

  const error = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "error", title, message, duration: 8000 }); // Errors stay longer
    },
    [addToast],
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "warning", title, message, duration: 6000 });
    },
    [addToast],
  );

  const info = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "info", title, message });
    },
    [addToast],
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
