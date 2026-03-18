"use client";

import { AlertTriangle, ArrowUpRight, Heart, Sparkles } from "lucide-react";

import {
  PublicPageIntro,
  PublicPageShell,
} from "@/components/public/PublicPageShell";
import { useLanguage } from "@/i18n/LanguageProvider";
import { translations } from "@/i18n/translations";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  const { language } = useLanguage();
  const isChinese = language === "zh";
  const t = translations[language].about;

  return (
    <PublicPageShell>
      <section className="rounded-[2.4rem] border border-slate-900/10 bg-[linear-gradient(180deg,#ffffff,#faf7f2)] p-6 shadow-[0_22px_50px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <PublicPageIntro
            eyebrow={isChinese ? "项目说明" : "Project note"}
            title={t.title}
            subtitle={t.subtitle}
            titleClassName={cn(
              isChinese
                ? "text-[2.7rem] tracking-[-0.08em] sm:text-[3.4rem]"
                : "editorial-display text-[2.9rem] tracking-[-0.06em] sm:text-[3.6rem]",
            )}
          />

          <div className="grid gap-3 rounded-[1.75rem] border border-slate-900/10 bg-white/85 p-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-text-subtle">
              {isChinese ? "维护方式" : "Maintenance"}
            </p>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900/[0.04] text-primary">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-sm leading-6 text-slate-600">
                {isChinese
                  ? "独立开发者维护，围绕 AI 服务、可观测性与云原生控制面持续演进。"
                  : "Maintained independently, evolving around AI services, observability, and cloud-native control planes."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-warning/25 bg-[#fffaf0] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)] lg:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div className="space-y-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-warning-foreground/70">
              {isChinese ? "免责声明" : "Disclaimer"}
            </p>
            <p className="text-sm leading-7 text-warning-foreground/85 whitespace-pre-wrap">
              {t.disclaimer}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-900/10 bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] lg:p-7">
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-text-subtle">
              {isChinese ? "致谢与驱动力" : "Acknowledgements"}
            </p>
            <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-heading sm:text-[2.35rem]">
              {t.acknowledgmentsTitle}
            </h2>
            <p className="max-w-3xl text-[1rem] leading-8 text-text-muted whitespace-pre-wrap">
              {t.acknowledgments}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {t.sections.map((section, index) => (
              <div
                key={`${section.title}-${index}`}
                className="flex h-full flex-col gap-4 rounded-[1.6rem] border border-slate-900/10 bg-[#fcfbf8] p-5 transition duration-200 hover:-translate-y-[1px] hover:bg-white"
              >
                <div className="space-y-3">
                  <div className="inline-flex w-fit rounded-full border border-slate-900/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {isChinese ? "章节" : "Section"} {index + 1}
                  </div>
                  <h3 className="text-[1.08rem] font-semibold leading-7 tracking-[-0.03em] text-slate-900">
                    {section.title}
                  </h3>
                </div>

                {section.content ? (
                  <p className="text-sm leading-7 text-slate-600 whitespace-pre-wrap">
                    {section.content}
                  </p>
                ) : null}

                {section.items ? (
                  <div className="grid gap-3">
                    {section.items.map((item) => (
                      <a
                        key={item.label}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-[1.25rem] border border-slate-900/10 bg-white/80 p-4 transition hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="font-semibold text-slate-900">
                              {item.label}
                            </p>
                            <p className="text-sm leading-6 text-slate-600">
                              {item.description}
                            </p>
                          </div>
                          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-primary" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : null}

                {section.links ? (
                  <div className="flex flex-wrap gap-2">
                    {section.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-primary/20 hover:text-primary"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,244,255,0.92))] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] lg:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart className="h-5 w-5" aria-hidden />
          </div>
          <div className="space-y-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-text-subtle">
              {isChinese ? "开源协作" : "Open source"}
            </p>
            <p className="max-w-4xl text-[1rem] leading-8 text-slate-700 whitespace-pre-wrap">
              {t.opensource}
            </p>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
