import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { FaExclamationTriangle, FaRedo, FaHome } from "react-icons/fa";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-gradient-to-b from-white/[0.08] to-white/[0.04] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <FaExclamationTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-red-400">
                  Something went wrong
                </h1>
                <p className="text-sm text-gray-400">
                  An unexpected error occurred
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-300 text-sm">
                The application encountered an error and couldn't recover
                automatically. You can try reloading the page or going back to
                the home screen.
              </p>

              {/* Error Details (collapsed by default in production) */}
              {this.state.error && (
                <details className="group">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 transition-colors">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-black/30 rounded-lg border border-white/5 overflow-auto max-h-40">
                    <code className="text-xs text-red-300 font-mono whitespace-pre-wrap">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack && (
                        <>
                          {"\n\nComponent Stack:"}
                          {this.state.errorInfo.componentStack}
                        </>
                      )}
                    </code>
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                >
                  <FaHome className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-xl font-medium transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 text-sm shadow-lg shadow-red-500/25"
                >
                  <FaRedo className="w-4 h-4" />
                  Reload App
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
