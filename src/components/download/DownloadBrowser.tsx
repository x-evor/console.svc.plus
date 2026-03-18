"use client";

import { useMemo, useState } from "react";

import CardGrid from "./CardGrid";
import { useLanguage } from "@i18n/LanguageProvider";
import { translations } from "@i18n/translations";
import { formatSegmentLabel, type DownloadSection } from "@lib/download-data";

interface DownloadBrowserProps {
  sectionsMap: Record<string, DownloadSection[]>;
}

export default function DownloadBrowser({ sectionsMap }: DownloadBrowserProps) {
  const { language } = useLanguage();
  const locale = language === "zh" ? "zh-CN" : "en-US";
  const t = translations[language].download.browser;

  const roots = useMemo(
    () =>
      Object.keys(sectionsMap).sort((a, b) =>
        formatSegmentLabel(a).localeCompare(formatSegmentLabel(b), locale),
      ),
    [sectionsMap, locale],
  );
  const [current, setCurrent] = useState<string>("all");

  const totalsByRoot = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const root of roots) {
      const entries = sectionsMap[root] ?? [];
      const hasChildren = entries.some((section) => section.key !== root);
      totals[root] = hasChildren
        ? entries.filter((section) => section.key !== root).length
        : entries.length;
    }
    return totals;
  }, [roots, sectionsMap]);

  const allSections = useMemo(
    () => roots.flatMap((root) => sectionsMap[root] ?? []),
    [roots, sectionsMap],
  );

  const rawSections =
    current === "all" ? allSections : (sectionsMap[current] ?? []);
  const sections =
    current === "all"
      ? rawSections
      : rawSections.some((section) => section.key !== current)
        ? rawSections.filter((section) => section.key !== current)
        : rawSections;

  const activeLabel =
    current === "all" ? t.allHeading : formatSegmentLabel(current);
  const description =
    current === "all"
      ? t.allDescription
      : t.collectionDescription.replace(
          "{{collection}}",
          formatSegmentLabel(current),
        );

  const itemCountTemplate =
    sections.length === 1 ? t.itemCount.singular : t.itemCount.plural;
  const itemCountLabel = itemCountTemplate.replace(
    "{{count}}",
    sections.length.toLocaleString(locale),
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:w-72">
        <div className="sticky top-24 rounded-[2rem] border border-slate-900/10 bg-white/92 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-subtle">
            {t.categoriesTitle}
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li key="all">
              <button
                type="button"
                onClick={() => setCurrent("all")}
                className={`flex w-full items-center justify-between rounded-[1.1rem] px-3 py-2.5 transition ${
                  current === "all"
                    ? "bg-[#f8f4ec] text-slate-900"
                    : "text-slate-600 hover:bg-[#fcfbf8]"
                }`}
              >
                <span>{t.allButton}</span>
                <span className="text-xs text-slate-500">
                  {allSections.length.toLocaleString(locale)}
                </span>
              </button>
            </li>
            {roots.map((root) => (
              <li key={root}>
                <button
                  type="button"
                  onClick={() => setCurrent(root)}
                  className={`flex w-full items-center justify-between rounded-[1.1rem] px-3 py-2.5 transition ${
                    current === root
                      ? "bg-[#f8f4ec] text-slate-900"
                      : "text-slate-600 hover:bg-[#fcfbf8]"
                  }`}
                >
                  <span>{formatSegmentLabel(root)}</span>
                  <span className="text-xs text-slate-500">
                    {(totalsByRoot[root] ?? 0).toLocaleString(locale)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="flex-1 space-y-5">
        <div className="rounded-[2rem] border border-slate-900/10 bg-white/92 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-text-subtle">
                {language === "zh" ? "目录视图" : "Collection view"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900">
                {activeLabel}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
            <span className="rounded-full border border-slate-900/10 bg-[#f8f4ec] px-3 py-1 text-xs font-semibold text-slate-700">
              {itemCountLabel}
            </span>
          </div>
        </div>

        {sections.length > 0 ? (
          <CardGrid sections={sections} />
        ) : (
          <div className="rounded-[1.8rem] border border-dashed border-slate-900/12 bg-white/80 p-10 text-center text-sm text-slate-500">
            {t.empty}
          </div>
        )}
      </section>
    </div>
  );
}
