"use client";

export const dynamic = "error";

import { useState } from "react";
import {
  AppWindow,
  ArrowRight,
  Bot,
  Command,
  Layers,
  Link,
  Lock,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
} from "lucide-react";
import useSWR from "swr";

import { OpenClawAssistantPane } from "@/components/openclaw/OpenClawAssistantPane";
import type { IntegrationDefaults } from "@/lib/openclaw/types";
import Footer from "../components/Footer";
import UnifiedNavigation from "../components/UnifiedNavigation";
import { useLanguage } from "../i18n/LanguageProvider";
import { translations } from "../i18n/translations";
import {
  DEFAULT_HOMEPAGE_VIDEO_SETTINGS,
  resolveHomepageVideoPresentation,
  type HomepageVideoPresentation,
  type ResolvedHomepageVideoResponse,
} from "../lib/home/homepageVideo";
import { useMoltbotStore } from "../lib/moltbotStore";
import { cn } from "../lib/utils";

const HOME_SECTION_CLASS =
  "rounded-[2rem] border border-slate-900/10 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.05)]";
const HOME_SECTION_LABEL_CLASS =
  "text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-text-subtle";
const HOME_LIST_CARD_CLASS =
  "rounded-[1.5rem] border border-slate-900/10 bg-[#fcfbf8] transition duration-200";
const EMPTY_ASSISTANT_DEFAULTS: IntegrationDefaults = {
  openclawUrl: "",
  openclawOrigin: "",
  openclawTokenConfigured: false,
  vaultUrl: "",
  vaultNamespace: "",
  vaultTokenConfigured: false,
  vaultSecretPath: "",
  vaultSecretKey: "",
  apisixUrl: "",
  apisixTokenConfigured: false,
};

const iconMap: Record<string, any> = {
  "Global Acceleration Network": Link,
  "Full-link SaaS Hosting": Layers,
  "AI-Driven Observability": Sparkles,
  "Add a new user to your project": Users,
  "Register a new application": AppWindow,
  "Deploy your application": Command,
  "Invite a user": MousePointerClick,
  "Get started": Sparkles,
  "Creating your application": AppWindow,
  "More about Authentication": ShieldCheck,
  "Understanding Authorization": Lock,
  "Machine-to-Machine": Layers,
  "Connect via CLI": Terminal,
  "REST & Admin APIs": Link,
  全球加速网络: Link,
  "全链路 SaaS 托管": Layers,
  "AI 驱动的可观测性": Sparkles,
  向项目添加新用户: Users,
  注册新应用程序: AppWindow,
  部署您的应用程序: Command,
  邀请用户: MousePointerClick,
  开始使用: Sparkles,
  创建您的应用程序: AppWindow,
  关于身份验证: ShieldCheck,
  了解授权: Lock,
  机器对机器: Layers,
  "通过 CLI 连接": Terminal,
};

const getIcon = (key: string, fallback: any) => iconMap[key] || fallback;

async function jsonFetcher<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : init?.headers),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    throw new Error(payload.error ?? payload.message ?? "请求失败");
  }

  return (await response.json()) as T;
}

export default function HomePage() {
  const { mode, isOpen } = useMoltbotStore();

  return (
    <div className="mobile-home-shell relative flex min-h-screen flex-col overflow-x-hidden bg-background text-text transition-colors duration-150">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.56),rgba(255,255,255,0))]"
      />
      <UnifiedNavigation />

      <div
        className={cn(
          "relative flex flex-1 overflow-hidden",
          mode === "left-sidebar" && isOpen && "flex-row-reverse",
        )}
      >
        <div className="relative flex-1 overflow-y-auto">
          <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
            <main className="relative space-y-6 pt-6 sm:space-y-8 sm:pt-10">
              <HeroSection />
              <StatsSection />
              <ShortcutsSection />
            </main>
            <div className="relative">
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const { language } = useLanguage();
  const isChinese = language === "zh";
  const [promptSeed, setPromptSeed] = useState("");
  const [promptSeedKey, setPromptSeedKey] = useState(0);
  const t = translations[language].marketing.home;
  const assistantDefaultsSWR = useSWR<IntegrationDefaults>(
    "/api/integrations/defaults",
    jsonFetcher,
    {
      revalidateOnFocus: false,
    },
  );
  const homepageVideoSWR = useSWR<ResolvedHomepageVideoResponse>(
    "/api/homepage-video",
    jsonFetcher,
    {
      fallbackData: {
        resolved: DEFAULT_HOMEPAGE_VIDEO_SETTINGS.defaultEntry,
      },
      revalidateOnFocus: false,
    },
  );
  const entry =
    homepageVideoSWR.data?.resolved ?? DEFAULT_HOMEPAGE_VIDEO_SETTINGS.defaultEntry;
  const presentation = resolveHomepageVideoPresentation(entry);

  const heroCopy = isChinese
    ? {
        eyebrow: "AI Native Workspace",
        title: "直接说出你的需求，剩下的交给 AI",
        subtitle: "从想法到上线，AI 自动完成构建、部署与优化。",
        demoLabel: "产品演示",
        demoHint:
          "这里展示当前域名对应的产品演示链接。主站默认走 YouTube，中国站可切到 Bilibili，也可以继续按域名覆盖。",
        startTitle: t.nextSteps.title,
        startHint: "保留原有 onboarding 内容，但改成更轻、更整齐的起步列表。",
        itemHint: "点击后填入右侧输入框，不会自动发送。",
        examples: [
          "帮我构建一个 SaaS 应用",
          "分析这个报错并给出修复建议",
          "生成一个 AI agent workflow",
          "帮我设计一个控制台首页",
        ],
      }
    : {
        eyebrow: "AI Native Workspace",
        title: "Describe what you need. Let AI handle the rest.",
        subtitle:
          "From idea to launch, AI can assemble, deploy, and optimize the work.",
        demoLabel: "Product demo",
        demoHint:
          "This section resolves the product demo for the current host. The default can use YouTube while regional hosts override it.",
        startTitle: t.nextSteps.title,
        startHint:
          "Keep the same onboarding content, in a lighter and calmer starting list.",
        itemHint: "Click to fill the composer on the right. It will not auto-submit.",
        examples: [
          "Help me build a SaaS app",
          "Analyze this error and suggest a fix",
          "Generate an AI agent workflow",
          "Design a console homepage",
        ],
      };

  return (
    <section className="relative overflow-hidden rounded-[2.75rem] border border-slate-900/10 bg-[linear-gradient(180deg,#ffffff,#faf7f2)] p-6 shadow-[0_24px_56px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[8%] h-[16rem] w-[16rem] rounded-full bg-[radial-gradient(circle,rgba(37,78,219,0.1),transparent_64%)] blur-3xl" />
        <div className="absolute left-[30%] top-[12%] h-[14rem] w-[14rem] rounded-full bg-[radial-gradient(circle,rgba(245,211,170,0.42),transparent_66%)] blur-3xl" />
        <div className="absolute right-[10%] top-[10%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.92),transparent_72%)]" />
        <div className="absolute inset-x-0 top-0 h-[18rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0)_72%)]" />
      </div>

      <div className="relative grid gap-8 lg:grid-cols-[0.96fr_1.04fr] lg:gap-12">
        <div className="flex flex-col gap-6 pt-2">
          <div className="overflow-hidden rounded-[2rem] border border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,246,251,0.96))] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-900/10 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={HOME_SECTION_LABEL_CLASS}>{heroCopy.demoLabel}</p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
                    {heroCopy.demoHint}
                  </p>
                </div>
                <span className="hidden rounded-full border border-slate-900/10 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
                  {entry.domain?.trim()
                    ? `${isChinese ? "当前域名" : "Host"}: ${entry.domain}`
                    : isChinese
                      ? "默认主站配置"
                      : "Default site config"}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <DemoVideoSurface presentation={presentation} isChinese={isChinese} />
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <a
                  href={entry.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-slate-900/10 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  {isChinese ? "打开原始链接" : "Open source link"}
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-3">
              <p className={HOME_SECTION_LABEL_CLASS}>{heroCopy.eyebrow}</p>
              <h1
                className={cn(
                  "max-w-[10ch] leading-[0.94] text-heading",
                  isChinese
                    ? "text-[3.05rem] font-semibold tracking-[-0.055em] sm:text-[3.6rem] lg:text-[4.2rem]"
                    : "editorial-display text-[3rem] tracking-[-0.05em] sm:text-[3.5rem] lg:text-[4.3rem]",
                )}
              >
                {heroCopy.title}
              </h1>
              <p className="max-w-xl text-[1rem] leading-8 text-text-muted sm:text-[1.08rem]">
                {heroCopy.subtitle}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {heroCopy.startTitle}
                  </h2>
                  <p className="text-xs text-slate-500">{heroCopy.startHint}</p>
                </div>
              </div>

              <div className="grid gap-3">
                {t.nextSteps.items.map((item, index: number) => {
                  const example = heroCopy.examples[index] ?? item.title;

                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => {
                        setPromptSeed(example);
                        setPromptSeedKey((current) => current + 1);
                      }}
                      className="group flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200/90 bg-white/88 px-4 py-3.5 text-left shadow-[0_10px_26px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-[#fbfaf7]"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex rounded-full border border-slate-900/10 bg-[#f8f4ec] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                            {item.status}
                          </span>
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {item.title}
                          </p>
                        </div>
                        <p className="text-xs leading-5 text-slate-500">
                          {heroCopy.itemHint}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-700" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:pl-4">
          <div className="overflow-hidden rounded-[2rem] border border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,248,251,0.98))] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-900/10 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={HOME_SECTION_LABEL_CLASS}>
                    {isChinese ? "X 助手" : "X Assistant"}
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
                    {isChinese
                      ? "首页只保留一个主路径：先提问，再由助手拆解任务、调用能力并推进执行。"
                      : "The homepage keeps one primary path: ask first, then let the assistant plan and execute."}
                  </p>
                </div>
                <span className="hidden rounded-full border border-slate-900/10 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
                  {isChinese ? "对话即入口" : "Prompt-first"}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <OpenClawAssistantPane
                defaults={assistantDefaultsSWR.data ?? EMPTY_ASSISTANT_DEFAULTS}
                initialQuestion={promptSeed}
                initialQuestionKey={promptSeedKey}
                autoSubmitInitialQuestion={false}
                variant="page"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StatsSection() {
  const { language } = useLanguage();
  const t = translations[language].marketing.home;
  const { data } = useSWR<HomeStatsResponse>(
    "/api/marketing/home-stats",
    async (url: string) => {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load home stats: ${response.status}`);
      }
      return (await response.json()) as HomeStatsResponse;
    },
    {
      refreshInterval: 60 * 60 * 1000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  const locale = language === "zh" ? "zh-CN" : "en-US";
  const numberFormatter = new Intl.NumberFormat(locale);
  const compactFormatter = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 2,
  });

  const registeredUsersValue =
    typeof data?.registeredUsers === "number"
      ? numberFormatter.format(data.registeredUsers)
      : (t.stats[0]?.value ?? "0+");

  const dailyVisits =
    typeof data?.visits?.daily === "number" ? data.visits.daily : null;
  const weeklyVisits =
    typeof data?.visits?.weekly === "number" ? data.visits.weekly : null;
  const monthlyVisits =
    typeof data?.visits?.monthly === "number" ? data.visits.monthly : null;

  const displayStats = [
    {
      value: registeredUsersValue,
      label: t.statsLabels.registeredUsers,
    },
    {
      value:
        typeof dailyVisits === "number"
          ? compactFormatter.format(dailyVisits)
          : (t.stats[1]?.value ?? "0+"),
      label: t.statsLabels.dailyVisits,
    },
    {
      value:
        typeof weeklyVisits === "number"
          ? compactFormatter.format(weeklyVisits)
          : "0+",
      label: t.statsLabels.weeklyVisits,
    },
    {
      value:
        typeof monthlyVisits === "number"
          ? compactFormatter.format(monthlyVisits)
          : "0+",
      label: t.statsLabels.monthlyVisits,
    },
    t.stats[2],
  ];

  return (
    <section className={cn(HOME_SECTION_CLASS, "space-y-5 p-5 lg:p-7")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={HOME_SECTION_LABEL_CLASS}>
            {language === "zh" ? "平台统计" : "Platform pulse"}
          </p>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            {language === "zh"
              ? "把关键数字收在同一条平静的视线上，不再单独做成重型数据舱。"
              : "Keep key numbers in the same calm visual rhythm instead of a separate heavy dashboard block."}
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-slate-900/10 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
          {language === "zh" ? "每小时更新" : "Updated hourly"}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        {displayStats.map((stat, index: number) => (
          <div
            key={index}
            className="rounded-[1.5rem] border border-slate-900/10 bg-[#fcfbf8] px-4 py-5"
          >
            <div className="editorial-display text-[2.2rem] leading-none text-slate-950 sm:text-[2.7rem]">
              {stat.value}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ShortcutsSection() {
  const { language } = useLanguage();
  const t = translations[language].marketing.home;
  const { data: latestBlogs } = useSWR<LatestBlogPost[]>(
    "/api/blogs/latest?limit=7",
    async (url: string) => {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load latest blogs: ${response.status}`);
      }
      return (await response.json()) as LatestBlogPost[];
    },
    {
      refreshInterval: 10 * 60 * 1000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  const shortcutItems =
    latestBlogs && latestBlogs.length > 0
      ? latestBlogs.map((post) => ({
          title: post.title,
          description: post.date
            ? new Date(post.date).toLocaleDateString(
                language === "zh" ? "zh-CN" : "en-US",
              )
            : t.shortcuts.subtitle,
          href: `/blogs/${post.slug}`,
        }))
      : t.shortcuts.items.map((item) => ({
          ...item,
          href: "#",
        }));

  return (
    <section className={cn(HOME_SECTION_CLASS, "space-y-4 p-5 lg:p-7")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={HOME_SECTION_LABEL_CLASS}>{t.shortcuts.title}</p>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            {t.shortcuts.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <button
            type="button"
            className="rounded-full border border-slate-900/10 bg-slate-950 px-3 py-2 text-white transition hover:bg-primary"
          >
            {t.shortcuts.buttons.start}
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-900/10 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-50"
          >
            {t.shortcuts.buttons.docs}
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-900/10 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-50"
          >
            {t.shortcuts.buttons.guides}
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {shortcutItems.map((item, index: number) => {
          const Icon = getIcon(item.title, Sparkles);
          return (
            <a
              key={index}
              href={item.href}
              className={cn(
                HOME_LIST_CARD_CLASS,
                "group flex items-start gap-3 p-4 hover:-translate-y-[1px] hover:bg-white",
              )}
            >
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900/[0.04] text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="text-base font-semibold leading-7 text-slate-900">
                  {item.title}
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
              <ArrowRight
                className="ml-auto h-4 w-4 text-slate-500 transition group-hover:text-primary"
                aria-hidden
              />
            </a>
          );
        })}
      </div>
    </section>
  );
}

type HomeStatsResponse = {
  registeredUsers: number | null;
  visits: {
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
  };
  updatedAt: string;
};

type LatestBlogPost = {
  slug: string;
  title: string;
  date?: string;
};

function DemoVideoSurface({
  presentation,
  isChinese,
}: {
  presentation: HomepageVideoPresentation;
  isChinese: boolean;
}) {
  const fallbackStyle =
    presentation.posterUrl && presentation.kind === "empty"
      ? {
          backgroundImage: `linear-gradient(180deg,rgba(15,23,42,0.16),rgba(15,23,42,0.42)), url(${presentation.posterUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : undefined;

  return (
    <div
      className={cn(
        "group relative aspect-video overflow-hidden rounded-[1.6rem] border border-slate-900/10 bg-[radial-gradient(circle_at_top_left,rgba(51,102,255,0.16),transparent_34%),linear-gradient(135deg,#0f172a,#172033_52%,#1f2d4d)]",
        presentation.kind !== "empty" && "bg-slate-950",
      )}
      style={fallbackStyle}
    >
      {presentation.kind === "embed" ? (
        <iframe
          src={presentation.src}
          title={isChinese ? "产品演示视频" : "Product demo video"}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : null}

      {presentation.kind === "direct" ? (
        <video
          className="h-full w-full object-cover"
          controls
          playsInline
          preload="metadata"
          poster={presentation.posterUrl || undefined}
        >
          <source src={presentation.src} />
        </video>
      ) : null}

      {presentation.kind === "empty" ? (
        <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            {isChinese ? "待接入视频" : "Awaiting media"}
          </div>
          <div className="max-w-lg space-y-2">
            <p className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
              {isChinese
                ? "这里会展示当前域名的视频演示"
                : "This area shows the domain-specific product demo"}
            </p>
            <p className="text-sm leading-6 text-white/72 sm:text-[0.95rem]">
              {isChinese
                ? "管理页可为不同域名配置不同链接。若链接不是可嵌入或直链格式，这里会保留为占位状态。"
                : "The admin page can assign a different link per host. Unsupported links remain in placeholder mode until a valid embed or direct video URL is provided."}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
