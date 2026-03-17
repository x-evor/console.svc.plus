"use client";
import { Github, Linkedin, Moon, Sun, Twitter } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../i18n/LanguageProvider";

import { useThemeStore } from "@components/theme";
import { useViewStore } from "./theme/viewStore";

export default function Footer() {
  const isDark = useThemeStore((state) => state.isDark);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const { view, setView } = useViewStore();
  const { language } = useLanguage();
  const isChinese = language === "zh";

  const socials = [
    {
      label: "GitHub",
      icon: Github,
      href: "https://github.com/Cloud-Neutral-Toolkit",
    },
    { label: "X", icon: Twitter, href: "https://x.com/Cloud_Neutral" },
    {
      label: "Linkedin",
      icon: Linkedin,
      href: "https://www.linkedin.com/in/haitaopan/",
    },
  ];

  const toggleLabel = isDark ? "切换为浅色主题" : "切换为深色主题";
  const viewToggleLabel =
    view === "classic" ? "Switch to Material View" : "Switch to Classic View";

  const handleViewToggle = () => {
    setView(view === "classic" ? "material" : "classic");
  };

  const footerClassName = isDark
    ? "border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.92))] text-slate-300 shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
    : "border-slate-200/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,247,252,0.95))] text-slate-600 shadow-[0_24px_60px_rgba(148,163,184,0.18)]";
  const linkClassName = isDark
    ? "transition-colors hover:text-white"
    : "transition-colors hover:text-slate-950";
  const iconButtonClassName = isDark
    ? "border-white/10 bg-white/5 text-white hover:border-indigo-400/50 hover:text-indigo-100"
    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950";
  const controlButtonClassName = isDark
    ? "border-white/10 bg-white/5 text-white hover:border-indigo-400/50 focus-visible:outline-indigo-500"
    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus-visible:outline-slate-400";
  const themeIconClassName = isDark ? "text-slate-300" : "text-slate-500";
  const moonClassName = isDark ? "text-white" : "text-slate-500";
  const sunClassName = isDark ? "text-slate-500" : "text-amber-500";
  const thumbClassName = isDark ? "bg-white" : "bg-slate-900";

  return (
    <footer
      className={`mt-12 flex flex-col items-center justify-center gap-4 rounded-[2rem] border px-6 py-5 text-sm ${footerClassName}`}
    >
      <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex gap-4 order-2 sm:order-1">
          <Link href="/terms" className={linkClassName}>
            {isChinese ? "服务条款" : "Terms of Service"}
          </Link>
          <Link href="/privacy" className={linkClassName}>
            {isChinese ? "隐私政策" : "Privacy Policy"}
          </Link>
          <Link href="/support" className={linkClassName}>
            {isChinese ? "联系我们" : "Contact Us"}
          </Link>
        </div>

        <div className="flex items-center justify-center gap-3 order-1 sm:order-2">
          {socials.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${iconButtonClassName}`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className="sr-only">{label}</span>
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4 order-3">
          <button
            data-testid="view-switcher"
            type="button"
            onClick={handleViewToggle}
            aria-label={viewToggleLabel}
            title={viewToggleLabel}
            className={`group flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${controlButtonClassName}`}
          >
            <span
              className={`material-symbols-outlined text-xl ${themeIconClassName}`}
            >
              {view === "classic" ? "view_quilt" : "view_cozy"}
            </span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={isDark}
            aria-label={toggleLabel}
            title={toggleLabel}
            className={`group relative flex h-10 w-20 items-center rounded-full border px-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${controlButtonClassName}`}
          >
            <span
              className={`relative z-10 flex w-full items-center justify-between ${themeIconClassName}`}
            >
              <Moon
                className={`h-4 w-4 transition-colors ${moonClassName}`}
                aria-hidden
              />
              <Sun
                className={`h-4 w-4 transition-colors ${sunClassName}`}
                aria-hidden
              />
            </span>
            <span
              aria-hidden
              className={`absolute inset-y-1 left-1 h-8 w-8 rounded-full shadow-sm transition-transform duration-300 ease-out ${thumbClassName} ${isDark ? "translate-x-0" : "translate-x-10"}`}
            />
          </button>
        </div>
      </div>
    </footer>
  );
}
