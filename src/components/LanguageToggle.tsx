"use client";

import { useLanguage } from "../i18n/LanguageProvider";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="tactile-control relative">
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as "en" | "zh")}
        aria-label="Language switcher"
        className="min-h-10 appearance-none bg-transparent py-2 pl-4 pr-10 text-sm font-medium text-text outline-none"
      >
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-subtle">
        <svg
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden="true"
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
