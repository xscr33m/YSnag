import { useState } from "react";
import { APP_VERSION, APP_AUTHOR_FULL } from "../config";
import { FaGlobe } from "react-icons/fa";

export function FloatingCopyright() {
  const currentYear = new Date().getFullYear();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <a
        href="https://xscr33mlabs.com"
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative h-10 md:h-12 px-4 md:px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-sm shadow-lg flex items-center justify-center text-xs md:text-sm text-gray-400 transition-all duration-300 cursor-pointer"
      >
        {/* Default content - always in DOM for size calculation */}
        <div
          className={`flex items-center gap-2 transition-all duration-300 ${
            isHovered ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
        >
          <span className="font-medium leading-none">
            © {currentYear} {APP_AUTHOR_FULL}
          </span>
          <span className="text-white/30 leading-none">|</span>
          <span className="text-red-400 font-mono leading-none">
            v{APP_VERSION}
          </span>
        </div>

        {/* Hover content - absolute positioned to not affect size */}
        <div
          className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${
            isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <FaGlobe className="w-4 h-4 text-red-400" />
          <span className="font-medium leading-none text-white">
            visit xscr33mLabs.com
          </span>
        </div>
      </a>
    </div>
  );
}
