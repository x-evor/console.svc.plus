"use client";

import { Boxes, Files, FolderTree } from "lucide-react";

import { useLanguage } from "@i18n/LanguageProvider";
import { translations } from "@i18n/translations";

type DownloadSummaryProps = {
  topLevelCount: number;
  totalCollections: number;
  totalFiles: number;
};

export default function DownloadSummary({
  topLevelCount,
  totalCollections,
  totalFiles,
}: DownloadSummaryProps) {
  const { language } = useLanguage();
  const isChinese = language === "zh";
  const locale = isChinese ? "zh-CN" : "en-US";
  const t = translations[language].download.home;
  const stats = [
    { label: t.stats.categories, value: topLevelCount, icon: FolderTree },
    { label: t.stats.collections, value: totalCollections, icon: Boxes },
    { label: t.stats.files, value: totalFiles, icon: Files },
  ];

  return (
    <section className="rounded-[2.4rem] border border-slate-900/10 bg-[linear-gradient(180deg,#ffffff,#faf7f2)] p-6 shadow-[0_22px_50px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div className="space-y-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-text-subtle">
            {isChinese ? "下载中心" : "Download library"}
          </p>
          <h1
            className={
              isChinese
                ? "text-[2.7rem] font-semibold leading-[0.9] tracking-[-0.08em] text-heading sm:text-[3.4rem]"
                : "editorial-display text-[2.9rem] leading-[0.9] tracking-[-0.06em] text-heading sm:text-[3.6rem]"
            }
          >
            {t.title}
          </h1>
          <p className="max-w-2xl text-[1rem] leading-8 text-text-muted sm:text-[1.05rem]">
            {t.description}
          </p>
        </div>

        <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-slate-900/10 bg-white/85 p-4"
              >
                <div className="flex items-center gap-2 text-slate-600">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                  <dt className="text-sm font-medium">{item.label}</dt>
                </div>
                <dd className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-slate-900">
                  {item.value.toLocaleString(locale)}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
