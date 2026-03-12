"use client";

import { useLanguage } from "@/i18n/LanguageProvider";

export function XWorkmateLoading() {
  const { language } = useLanguage();
  const isChinese = language === "zh";

  return (
    <div className="flex h-full items-center justify-center">
      {isChinese ? "正在加载 XWorkmate..." : "Loading XWorkmate..."}
    </div>
  );
}
