import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaPlay,
  FaDownload,
  FaChevronDown,
  FaYoutube,
  FaQuestionCircle,
  FaCog,
  FaKeyboard,
  FaLink,
  FaLightbulb,
} from "react-icons/fa";

interface FAQItemProps {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

function FAQItem({ question, answer, defaultOpen = false }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 md:py-4 flex items-center justify-between text-left cursor-pointer group"
      >
        <span className="text-xs md:text-sm font-medium text-gray-300 group-hover:text-white transition-colors pr-4">
          {question}
        </span>
        <FaChevronDown
          className={`w-3 h-3 md:w-4 md:h-4 text-gray-500 transition-transform flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="pb-3 md:pb-4 text-[11px] md:text-xs text-gray-500 leading-relaxed whitespace-pre-line">
          {answer}
        </div>
      )}
    </div>
  );
}

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

export function InfoTab() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: FaYoutube,
      title: t("info.howItWorks.steps.copy.title"),
      description: t("info.howItWorks.steps.copy.description"),
    },
    {
      icon: FaLink,
      title: t("info.howItWorks.steps.paste.title"),
      description: t("info.howItWorks.steps.paste.description"),
    },
    {
      icon: FaCog,
      title: t("info.howItWorks.steps.configure.title"),
      description: t("info.howItWorks.steps.configure.description"),
    },
    {
      icon: FaDownload,
      title: t("info.howItWorks.steps.download.title"),
      description: t("info.howItWorks.steps.download.description"),
    },
  ];

  const faqs = [
    {
      question: t("info.faq.items.formats.question"),
      answer: t("info.faq.items.formats.answer"),
    },
    {
      question: t("info.faq.items.ageRestricted.question"),
      answer: t("info.faq.items.ageRestricted.answer"),
    },
    {
      question: t("info.faq.items.playlists.question"),
      answer: t("info.faq.items.playlists.answer"),
    },
    {
      question: t("info.faq.items.storage.question"),
      answer: t("info.faq.items.storage.answer"),
    },
  ];

  const tips = [
    t("info.tips.items.ctrlV"),
    t("info.tips.items.dragDrop"),
    t("info.tips.items.queue"),
    t("info.tips.items.audioOnly"),
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 pb-20 md:pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 py-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            {t("info.title")}
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            {t("info.subtitle")}
          </p>
        </div>
      </div>

      {/* Quick Start - How It Works */}
      <CollapsibleSection
        title={t("info.howItWorks.title")}
        icon={<FaPlay className="w-3 h-3 md:w-4 md:h-4 text-red-400" />}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-black/20 rounded-xl p-4 border border-white/5 group hover:border-white/10 transition-all"
            >
              <div className="absolute -top-2 -left-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-500 flex items-center justify-center text-[10px] md:text-xs font-bold">
                {index + 1}
              </div>
              <div className="flex flex-col items-center text-center pt-2">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3 group-hover:bg-red-500/10 transition-colors">
                  <step.icon className="w-5 h-5 md:w-6 md:h-6 text-gray-400 group-hover:text-red-400 transition-colors" />
                </div>
                <h3 className="text-xs md:text-sm font-medium text-white mb-1">
                  {step.title}
                </h3>
                <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Quick Tips */}
      <CollapsibleSection
        title={t("info.tips.title")}
        icon={<FaLightbulb className="w-3 h-3 md:w-4 md:h-4 text-red-400" />}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5"
            >
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-red-400">
                  {index + 1}
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-300">{tip}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Keyboard Shortcuts */}
      <CollapsibleSection
        title={t("info.shortcuts.title")}
        icon={<FaKeyboard className="w-3 h-3 md:w-4 md:h-4 text-red-400" />}
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
            <span className="text-xs md:text-sm text-gray-300">
              {t("info.shortcuts.paste")}
            </span>
            <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] md:text-xs font-mono text-gray-400">
              Ctrl + V
            </kbd>
          </div>
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
            <span className="text-xs md:text-sm text-gray-300">
              {t("info.shortcuts.submit")}
            </span>
            <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] md:text-xs font-mono text-gray-400">
              Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
            <span className="text-xs md:text-sm text-gray-300">
              {t("info.shortcuts.closePopup")}
            </span>
            <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] md:text-xs font-mono text-gray-400">
              Escape
            </kbd>
          </div>
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
            <span className="text-xs md:text-sm text-gray-300">
              {t("info.shortcuts.showHelp")}
            </span>
            <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] md:text-xs font-mono text-gray-400">
              ?
            </kbd>
          </div>
        </div>
      </CollapsibleSection>

      {/* FAQ */}
      <CollapsibleSection
        title={t("info.faq.title")}
        icon={
          <FaQuestionCircle className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
        }
        defaultOpen={true}
      >
        <div className="divide-y divide-white/5">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              defaultOpen={index === 0}
            />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
