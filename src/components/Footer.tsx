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

  return (
    <footer className="mt-12 flex flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-surface-border bg-surface/88 px-6 py-4 text-sm text-text-muted shadow-[0_18px_40px_rgba(15,23,42,0.05)] lg:rounded-2xl lg:border-white/10 lg:bg-white/5 lg:text-slate-300 lg:shadow-none">
      <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex gap-4 order-2 sm:order-1">
          <Link
            href="/terms"
            className="transition-colors hover:text-text lg:hover:text-white"
          >
            {isChinese ? "服务条款" : "Terms of Service"}
          </Link>
          <Link
            href="/privacy"
            className="transition-colors hover:text-text lg:hover:text-white"
          >
            {isChinese ? "隐私政策" : "Privacy Policy"}
          </Link>
          <Link
            href="/support"
            className="transition-colors hover:text-text lg:hover:text-white"
          >
            {isChinese ? "联系我们" : "Contact Us"}
          </Link>
        </div>

        <div className="flex items-center justify-center gap-3 order-1 sm:order-2">
          {socials.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-surface-muted text-text transition hover:border-surface-border-strong hover:text-text lg:border-white/10 lg:bg-white/5 lg:text-white lg:hover:border-indigo-400/50 lg:hover:text-indigo-100"
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
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-surface-border bg-surface-muted text-text transition hover:border-surface-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 lg:border-white/10 lg:bg-white/5 lg:text-white lg:hover:border-indigo-400/50"
          >
            <span className="material-symbols-outlined text-xl">
              {view === "classic" ? "view_quilt" : "view_cozy"}
            </span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={isDark}
            aria-label={toggleLabel}
            title={toggleLabel}
            className="group relative flex h-10 w-20 items-center rounded-full border border-surface-border bg-surface-muted px-2 text-text transition hover:border-surface-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 lg:border-white/10 lg:bg-white/5 lg:text-white lg:hover:border-indigo-400/50"
          >
            <span className="relative z-10 flex w-full items-center justify-between text-text-subtle lg:text-slate-300">
              <Moon
                className={`h-4 w-4 transition-colors ${isDark ? "text-text" : "text-text-subtle lg:text-slate-500"}`}
                aria-hidden
              />
              <Sun
                className={`h-4 w-4 transition-colors ${isDark ? "text-text-subtle lg:text-slate-500" : "text-amber-500 lg:text-amber-300"}`}
                aria-hidden
              />
            </span>
            <span
              aria-hidden
              className={`absolute inset-y-1 left-1 h-8 w-8 rounded-full bg-background shadow-sm transition-transform duration-300 ease-out lg:bg-white/90 ${isDark ? "translate-x-0" : "translate-x-10"}`}
            />
          </button>
        </div>
      </div>
    </footer>
  );
}
