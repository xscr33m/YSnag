import type { VideoInfo, Settings } from "../types";
import { formatFileSize, formatDuration, formatViews } from "../types";

interface VideoPreviewProps {
  videoInfo: VideoInfo;
  settings: Settings;
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  audioOnly: boolean;
  onAudioOnlyChange: (audioOnly: boolean) => void;
  downloading: boolean;
  progress: number;
  statusMessage: string;
  downloadComplete: boolean;
  onDownload: () => void;
}

export function VideoPreview({
  videoInfo,
  settings,
  selectedFormat,
  onFormatChange,
  audioOnly,
  onAudioOnlyChange,
  downloading,
  progress,
  statusMessage,
  downloadComplete,
  onDownload,
}: VideoPreviewProps) {
  return (
    <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.04] rounded-2xl overflow-hidden border border-white/10">
      {/* Compact horizontal layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Left: Thumbnail (smaller) */}
        <div className="relative lg:w-72 flex-shrink-0">
          <img
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            className="w-full lg:h-full aspect-video lg:aspect-auto object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:bg-gradient-to-r" />
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs font-medium">
            {formatDuration(videoInfo.duration)}
          </div>
          <div className="absolute bottom-2 left-2">
            <span className="bg-red-600 text-xs font-bold px-2 py-0.5 rounded">
              {audioOnly ? "MP3" : "VIDEO"}
            </span>
          </div>
        </div>

        {/* Right: Details and Controls */}
        <div className="flex-1 p-4 lg:p-5 flex flex-col min-w-0">
          {/* Title and Meta */}
          <div className="mb-4">
            <h2 className="font-bold text-lg leading-tight line-clamp-2 mb-2">
              {videoInfo.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {videoInfo.uploader}
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                {formatViews(videoInfo.viewCount)} views
              </span>
            </div>
          </div>

          {/* Options Row */}
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Format Toggle */}
            <div
              className="flex bg-black/30 border border-white/10 rounded-lg p-0.5"
              role="radiogroup"
              aria-label="Download format"
            >
              <button
                onClick={() => onAudioOnlyChange(false)}
                disabled={downloading || downloadComplete}
                aria-pressed={!audioOnly}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                  !audioOnly
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Video
              </button>
              <button
                onClick={() => onAudioOnlyChange(true)}
                disabled={downloading || downloadComplete}
                aria-pressed={audioOnly}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                  audioOnly
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                MP3
              </button>
            </div>

            {/* Quality Selection */}
            <select
              value={selectedFormat}
              onChange={(e) => onFormatChange(e.target.value)}
              disabled={audioOnly || downloading || downloadComplete}
              aria-label="Video quality"
              className="px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="best">Best Quality</option>
              {videoInfo.formats.map((f) => (
                <option key={f.formatId} value={f.formatId}>
                  {f.resolution} {f.fps > 30 ? `${f.fps}fps` : ""} •{" "}
                  {formatFileSize(f.filesize)}
                </option>
              ))}
            </select>
          </div>

          {/* Progress Bar */}
          {downloading && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">Downloading...</span>
                <span className="text-red-400 font-medium">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5 truncate font-mono">
                {statusMessage}
              </p>
            </div>
          )}

          {/* Success Message */}
          {downloadComplete && !downloading && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-emerald-300 text-sm font-medium">
                  Download complete!
                </p>
                <p className="text-emerald-400/70 text-xs truncate">
                  Saved to {settings.downloadPath}
                </p>
              </div>
            </div>
          )}

          {/* Download Button - hidden after successful download */}
          {!downloadComplete && (
            <button
              onClick={onDownload}
              disabled={downloading}
              aria-busy={downloading}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed cursor-pointer rounded-xl font-semibold transition-all shadow-lg shadow-red-500/25 disabled:shadow-none flex items-center justify-center gap-2 mt-auto active:scale-[0.98]"
            >
              {downloading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>Download {audioOnly ? "MP3" : "Video"}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
