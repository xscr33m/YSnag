import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FolderBrowser } from "../types";
import { API_URL } from "../types";
import {
  FaArrowLeft,
  FaFolder,
  FaFolderOpen,
  FaFolderPlus,
  FaTimes,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";

interface FolderPickerProps {
  folderBrowser: FolderBrowser;
  onBrowse: (path: string) => void;
  onSelect: (path: string) => void;
  onClose: () => void;
}

export function FolderPicker({
  folderBrowser,
  onBrowse,
  onSelect,
  onClose,
}: FolderPickerProps) {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [createError, setCreateError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsLoading(true);
    setCreateError("");

    try {
      const res = await fetch(`${API_URL}/api/create-folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentPath: folderBrowser.current,
          folderName: newFolderName.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewFolderName("");
        setIsCreating(false);
        // Navigate to the newly created folder
        onBrowse(data.path);
      } else {
        const error = await res.json();
        setCreateError(error.error || t("folderPicker.createError"));
      }
    } catch {
      setCreateError(t("folderPicker.createError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg max-h-[70vh] bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <FaFolderOpen className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {t("folderPicker.title")}
              </h2>
              <p className="text-xs text-gray-500">
                {t("folderPicker.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label={t("common.close")}
          >
            <FaTimes className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Current Path */}
        <div className="px-5 py-3 border-b border-white/5 bg-black/20 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">
              {t("folderPicker.currentPath")}
            </p>
            <p className="text-sm text-gray-300 font-mono truncate">
              {folderBrowser.current}
            </p>
          </div>
          <button
            onClick={() => {
              setIsCreating(true);
              setCreateError("");
            }}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all cursor-pointer flex-shrink-0"
            title={t("folderPicker.newFolder")}
          >
            <FaFolderPlus className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Create Folder Input */}
        {isCreating && (
          <div className="px-5 py-3 border-b border-white/5 bg-emerald-500/5">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading) handleCreateFolder();
                    if (e.key === "Escape") {
                      setIsCreating(false);
                      setNewFolderName("");
                      setCreateError("");
                    }
                  }}
                  placeholder={t("folderPicker.folderNamePlaceholder")}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isLoading}
                className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FaCheck className="w-3.5 h-3.5" />
                )}
                {t("folderPicker.create")}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewFolderName("");
                  setCreateError("");
                }}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                {t("common.cancel")}
              </button>
            </div>
            {createError && (
              <p className="text-xs text-red-400 mt-2">{createError}</p>
            )}
          </div>
        )}

        {/* Folder List */}
        <div className="flex-1 overflow-y-auto p-3">
          {folderBrowser.current !== folderBrowser.parent && (
            <button
              onClick={() => onBrowse(folderBrowser.parent)}
              className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl flex items-center gap-3 text-gray-400 hover:text-white transition-all cursor-pointer active:scale-[0.99] group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                <FaArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">
                {t("folderPicker.parentFolder")}
              </span>
            </button>
          )}
          {folderBrowser.folders.map((folder) => (
            <button
              key={folder.path}
              onClick={() => onBrowse(folder.path)}
              className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl flex items-center gap-3 transition-all cursor-pointer active:scale-[0.99] group"
            >
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 flex items-center justify-center transition-colors">
                <FaFolder className="w-4 h-4 text-yellow-500" />
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white truncate transition-colors">
                {folder.name}
              </span>
            </button>
          ))}
          {folderBrowser.folders.length === 0 && !isCreating && (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-3 bg-white/5 rounded-xl flex items-center justify-center">
                <FaFolder className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-sm text-gray-500">
                {t("folderPicker.noSubfolders")}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 flex gap-3 flex-shrink-0 bg-black/20">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-all cursor-pointer active:scale-[0.98]"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={() => onSelect(folderBrowser.current)}
            className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-500/25 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <FaCheck className="w-3.5 h-3.5" />
            {t("folderPicker.selectFolder")}
          </button>
        </div>
      </div>
    </div>
  );
}
