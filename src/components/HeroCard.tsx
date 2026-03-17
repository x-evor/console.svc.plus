"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, QrCode, X } from "lucide-react";

import { useLanguage } from "../i18n/LanguageProvider";
import { cn } from "../lib/utils";

interface GuideStep {
  text: string;
  link?: { url: string; label: string };
  code?: string;
  image?: string;
}

interface HeroCardProps {
  icon: any;
  title: string;
  description: string;
  guide?: {
    title: string;
    steps: GuideStep[];
    dismiss: string;
  };
}

export function HeroCard({
  icon: Icon,
  title,
  description,
  guide,
}: HeroCardProps) {
  const [showGuide, setShowGuide] = useState(false);
  const hasGuide = Boolean(guide);
  const { language } = useLanguage();
  const isChinese = language === "zh";
  const guideLabel = isChinese ? "查看向导" : "View guide";
  const qrTitle = isChinese ? "VLESS 协议就绪" : "VLESS Protocol Ready";
  const qrDescription = isChinese
    ? "在控制台中扫码，即可快速完成连接。"
    : "Scan the QR code in the control panel to connect automatically.";

  function openGuide(): void {
    if (!hasGuide) {
      return;
    }
    setShowGuide(true);
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (!hasGuide) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setShowGuide(true);
    }
  }

  return (
    <>
      <div
        role={hasGuide ? "button" : undefined}
        tabIndex={hasGuide ? 0 : undefined}
        onClick={hasGuide ? openGuide : undefined}
        onKeyDown={handleCardKeyDown}
        className={cn(
          "group relative flex items-start gap-4 overflow-hidden rounded-[1.5rem] border border-slate-900/10 bg-[#fcfbf8] p-5 transition-all duration-200 sm:p-6",
          hasGuide
            ? "cursor-pointer hover:-translate-y-[1px] hover:border-primary/35 hover:bg-white"
            : "hover:-translate-y-[1px] hover:border-primary/25 hover:bg-white",
          showGuide ? "border-primary/40 bg-white" : "",
        )}
      >
        <div className="mt-1 rounded-full border border-slate-900/10 bg-white p-2.5 text-slate-700 group-hover:border-primary/30 group-hover:text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="space-y-2">
            <h3 className="text-[1.05rem] font-semibold leading-7 tracking-[-0.03em] text-slate-900">
              {title}
            </h3>
            <p className="text-sm leading-6 text-slate-600">{description}</p>
          </div>
          {hasGuide ? (
            <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              {guideLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>
      </div>

      {guide ? (
        <div
          className={cn(
            "fixed bottom-3 left-3 right-3 z-[100] transform overflow-hidden rounded-[1.75rem] border border-surface-border bg-surface shadow-2xl transition-transform duration-300 ease-in-out md:bottom-0 md:left-auto md:right-0 md:w-[400px] md:rounded-none md:border-l md:border-t-0",
            "top-[calc(var(--app-shell-nav-offset,64px)+0.75rem)] h-[calc(100vh-var(--app-shell-nav-offset,64px)-0.75rem)] md:top-[var(--app-shell-nav-offset,64px)] md:h-[calc(100vh-var(--app-shell-nav-offset,64px))]",
            showGuide
              ? "translate-y-0 md:translate-x-0"
              : "translate-y-full md:translate-x-full",
          )}
        >
          <div className="flex h-full flex-col overflow-y-auto p-5 sm:p-8">
            <div className="mb-6 flex items-center justify-between sm:mb-8">
              <h4 className="flex items-center gap-3 text-lg font-bold text-heading sm:text-xl">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                </span>
                {guide.title}
              </h4>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-full p-2 text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">{guide.dismiss}</span>
              </button>
            </div>

            <div className="flex-1 space-y-6 sm:space-y-8">
              {guide.steps.map((step, idx) => (
                <div key={idx} className="group/step relative pl-8">
                  {idx !== guide.steps.length - 1 ? (
                    <div className="absolute left-[11px] top-8 bottom-[-2rem] w-[2px] bg-surface-border transition-colors group-hover/step:bg-primary/20" />
                  ) : null}

                  <span
                    className={cn(
                      "absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ring-4 ring-surface transition-all duration-300",
                      "bg-surface-muted text-text-muted group-hover/step:scale-110 group-hover/step:bg-primary group-hover/step:text-white",
                    )}
                  >
                    {idx + 1}
                  </span>

                  <div className="space-y-3">
                    <p className="text-base leading-relaxed text-text">
                      {step.text}
                    </p>

                    {step.link ? (
                      <Link
                        href={step.link.url}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        {step.link.label}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : null}

                    {idx === 2 ? (
                      <div className="group/qr mt-4 cursor-crosshair rounded-xl border border-dashed border-surface-border bg-surface-muted/30 p-4 transition-all hover:border-primary/30 hover:bg-primary/5">
                        <div className="flex items-start gap-4">
                          <div className="rounded-lg bg-white p-2 shadow-sm">
                            <QrCode className="h-12 w-12 text-black" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-heading">
                              {qrTitle}
                            </p>
                            <p className="text-xs leading-relaxed text-text-muted">
                              {qrDescription}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto border-t border-surface-border pt-6">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full rounded-xl border border-surface-border py-3 text-sm font-medium text-text-muted transition-all hover:bg-surface-muted hover:text-text"
              >
                {guide.dismiss}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
