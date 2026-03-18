"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { translations } from "../i18n/translations";

export type ReleaseChannel = "stable" | "beta" | "develop";

type ReleaseChannelSelectorProps = {
  selected: ReleaseChannel[];
  onToggle: (channel: ReleaseChannel) => void;
  variant?: "default" | "compact" | "icon";
};

const CHANNEL_ORDER: ReleaseChannel[] = ["stable", "beta", "develop"];

export default function ReleaseChannelSelector({
  selected,
  onToggle,
  variant = "default",
}: ReleaseChannelSelectorProps) {
  const { language } = useLanguage();
  const labels = translations[language].nav.releaseChannels;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isCompact = variant === "compact";
  const isIcon = variant === "icon";
  const hasPreviewSelection = selected.some((channel) => channel !== "stable");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const selectedNames = CHANNEL_ORDER.filter((channel) =>
    selected.includes(channel),
  ).map((channel) => labels[channel].name);
  const summary =
    selectedNames.length > 0 ? selectedNames.join(" + ") : labels.stable.name;

  return (
    <div
      className={`relative ${isCompact || isIcon ? "group" : ""}`}
      ref={containerRef}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`tactile-button relative border border-surface-border bg-surface text-text shadow-[var(--shadow-soft)] ${
          isIcon
            ? "h-10 w-10 justify-center p-0"
            : isCompact
              ? "px-3 text-xs font-medium"
              : "w-full justify-between md:w-auto md:justify-start"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={labels.label}
      >
        {isIcon ? (
          <svg
            className="h-5 w-5 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 3v6.879L4.553 17.71A1.2 1.2 0 0 0 5.6 19.5h12.8a1.2 1.2 0 0 0 1.047-1.79L15 9.879V3"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 13h6m-6 3h6"
            />
          </svg>
        ) : (
          <>
            <span className={`font-medium ${isCompact ? "" : "text-text"}`}>
              {labels.label}
            </span>
            {!isCompact && (
              <span className="text-xs text-text-subtle">
                {labels.summaryPrefix}: {summary}
              </span>
            )}
            <svg
              className={`h-4 w-4 text-text-subtle transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </>
        )}
        {isIcon && hasPreviewSelection && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
        )}
      </button>
      {(isCompact || isIcon) && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden w-56 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs text-white opacity-0 shadow-[var(--shadow-md)] transition group-hover:block group-hover:opacity-100 group-focus-within:block group-focus-within:opacity-100">
          <div className="font-semibold">{labels.label}</div>
          <div className="mt-1 text-slate-200">
            {labels.summaryPrefix}: {summary}
          </div>
        </div>
      )}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-[14px] border border-surface-border bg-surface shadow-[var(--shadow-md)]">
          <ul
            className="py-2 text-sm text-text"
            role="listbox"
            aria-label={labels.label}
          >
            {CHANNEL_ORDER.map((channel) => {
              const channelLabels = labels[channel];
              const checked = selected.includes(channel);
              const isStable = channel === "stable";
              return (
                <li key={channel}>
                  <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 transition hover:bg-surface-muted">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-surface-border text-primary focus:ring-primary"
                      checked={checked}
                      onChange={() =>
                        !isStable ? onToggle(channel) : undefined
                      }
                      disabled={isStable}
                    />
                    <div>
                      <div className="font-medium text-text">
                        {channelLabels.name}
                      </div>
                      <p className="text-xs text-text-subtle">
                        {channelLabels.description}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
