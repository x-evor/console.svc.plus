"use client";

import { useLanguage } from "@i18n/LanguageProvider";
import { translations } from "@i18n/translations";

export default function DownloadNotFound() {
  const { language } = useLanguage();
  const message = translations[language].download.listing.notFound;

  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-dashed border-slate-900/12 bg-white/80 p-10 text-center text-sm leading-6 text-slate-500 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
      {message}
    </div>
  );
}
