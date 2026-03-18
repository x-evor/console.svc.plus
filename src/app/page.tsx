"use client";

export const dynamic = "error";

import { useState } from "react";
import {
  AppWindow,
  ArrowRight,
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
import { useRouter } from "next/navigation";
import useSWR from "swr";

import type { IntegrationDefaults } from "@/lib/openclaw/types";
import { useUserStore } from "@/lib/userStore";
import { XWorkmateAssistantShell } from "@/components/xworkmate/XWorkmateAssistantShell";
import Footer from "../components/Footer";
import UnifiedNavigation from "../components/UnifiedNavigation";
import { useLanguage } from "../i18n/LanguageProvider";
import { translations } from "../i18n/translations";
import {
  DEFAULT_HOMEPAGE_VIDEO_SETTINGS,
  type ResolvedHomepageVideoResponse,
} from "../lib/home/homepageVideo";
import { useMoltbotStore } from "../lib/moltbotStore";
import { cn } from "../lib/utils";

const HOME_SECTION_CLASS =
  "rounded-[1.25rem] border border-slate-900/8 bg-white/92 shadow-[var(--shadow-md)] backdrop-blur-sm";
const HOME_SECTION_LABEL_CLASS =
  "text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-text-subtle flex items-center gap-2";
const HOME_LIST_CARD_CLASS =
  "rounded-[1rem] border border-slate-900/6 bg-white/90 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/95";
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
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0))]"
      />
      <UnifiedNavigation />

      <div
        className={cn(
          "relative flex flex-1 overflow-hidden",
          mode === "left-sidebar" && isOpen && "flex-row-reverse",
        )}
      >
        <div className="relative flex-1 overflow-y-auto">
          <div className="relative w-full px-2 pb-10 sm:px-3 sm:pb-12 lg:px-4">
            <main className="relative space-y-4 pt-4 sm:space-y-5 sm:pt-5">
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
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [heroPrompt, setHeroPrompt] = useState("");
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
  const homeStatsSWR = useSWR<HomeStatsResponse>(
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
  const entry =
    homepageVideoSWR.data?.resolved ??
    DEFAULT_HOMEPAGE_VIDEO_SETTINGS.defaultEntry;
  const stats = homeStatsSWR.data;
  const locale = isChinese ? "zh-CN" : "en-US";
  const compactFormatter = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const displayName =
    user?.name?.trim() ||
    user?.username?.trim() ||
    user?.email?.split("@")[0] ||
    (isChinese ? "朋友" : "there");
  const dailyVisitsValue =
    typeof stats?.visits?.daily === "number"
      ? compactFormatter.format(stats.visits.daily)
      : isChinese
        ? "同步中"
        : "Syncing";
  const registeredUsersValue =
    typeof stats?.registeredUsers === "number"
      ? compactFormatter.format(stats.registeredUsers)
      : isChinese
        ? "同步中"
        : "Syncing";

  const heroCopy = isChinese
    ? {
        eyebrow: "AI Native Workspace",
        subtitle: "从想法到上线，AI 自动完成构建、部署与优化。",
        demoLabel: "动态欢迎",
        greeting: "早上好",
        todayStatus: "今日状态",
        statusItems: [
          { label: "服务", value: "正常" },
          { label: "今日访问", value: dailyVisitsValue },
          { label: "注册用户", value: registeredUsersValue },
        ],
        prompt: "有什么想问的？",
        quickLinksLabel: "快速入口",
        quickLinks: ["常用工具", "最近使用", "产品演示"],
        helperNote: "个性化、状态感知、即时信息",
        sourceLink: "打开原始链接",
        maximizeLabel: "最大化到 XWorkmate",
      }
    : {
        eyebrow: "AI Native Workspace",
        subtitle:
          "From idea to launch, AI can assemble, deploy, and optimize the work.",
        demoLabel: "Dynamic welcome",
        greeting: "Good morning",
        todayStatus: "Today",
        statusItems: [
          { label: "Service", value: "Healthy" },
          { label: "Daily visits", value: dailyVisitsValue },
          { label: "Registered", value: registeredUsersValue },
        ],
        prompt: "What would you like to ask?",
        quickLinksLabel: "Quick access",
        quickLinks: ["Tools", "Recent", "Demo"],
        helperNote: "Personal, status-aware, and instantly actionable.",
        sourceLink: "Open source link",
        maximizeLabel: "Open in XWorkmate",
      };

  const openXWorkmate = () => {
    const query = heroPrompt.trim();
    router.push(
      query.length > 0
        ? `/xworkmate?prompt=${encodeURIComponent(query)}`
        : "/xworkmate",
    );
  };

  return (
    <section className="relative overflow-hidden rounded-[1.25rem] border border-slate-900/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] p-3.5 shadow-[var(--shadow-md)] sm:p-4 lg:p-5">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[5%] top-[3%] h-[16rem] w-[16rem] rounded-full bg-[radial-gradient(circle,rgba(51,102,255,0.15),transparent_60%)] blur-3xl" />
        <div className="absolute right-[8%] top-[5%] h-[14rem] w-[14rem] rounded-full bg-[radial-gradient(circle,rgba(76,139,245,0.12),transparent_65%)] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[20rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,255,255,0)_75%)]" />
      </div>

      <div className="relative space-y-4">
        <div className="overflow-hidden rounded-[1.1rem] border border-slate-900/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] shadow-[var(--shadow-md)] backdrop-blur-sm">
          <div className="border-b border-slate-900/10 px-5 py-3.5 sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={HOME_SECTION_LABEL_CLASS}>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {heroCopy.demoLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-4.5">
            <div className="rounded-[1rem] border border-slate-900/8 bg-slate-50/85 p-4 shadow-[var(--shadow-soft)]">
              <div className="max-w-[40rem] space-y-5 font-[ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace] text-[15px] leading-8 text-slate-700">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[1.05rem] text-slate-800">
                    <span aria-hidden>{isChinese ? "☀️" : "☀"}</span>
                    <span>
                      {heroCopy.greeting}, {displayName}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-slate-800">
                    {heroCopy.todayStatus}:
                  </p>
                  <div className="space-y-0.5">
                    {heroCopy.statusItems.map((item) => (
                      <p key={item.label} className="text-slate-700">
                        ├ {item.label}:{" "}
                        <span className="font-semibold text-slate-900">
                          {item.value}
                        </span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="rounded-[0.9rem] border border-slate-900/15 bg-white/86 p-3 shadow-[var(--shadow-sm)]">
                  <textarea
                    value={heroPrompt}
                    onChange={(event) => setHeroPrompt(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        (event.metaKey || event.ctrlKey) &&
                        event.key === "Enter"
                      ) {
                        event.preventDefault();
                        openXWorkmate();
                      }
                    }}
                    placeholder={heroCopy.prompt}
                    className="min-h-[120px] w-full resize-none bg-transparent px-1 py-1 text-[1rem] leading-8 text-slate-700 outline-none placeholder:text-slate-500"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-900/10 pt-3">
                    <div className="text-xs text-slate-500">
                      {isChinese
                        ? "输入一句话，进入完整工作台继续对话。"
                        : "Start here, then continue in the full workspace."}
                    </div>
                    <button
                      type="button"
                      onClick={openXWorkmate}
                      className="tactile-button tactile-button-primary px-4 py-2 text-sm"
                    >
                      {heroCopy.maximizeLabel}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-slate-700">
                  <span className="font-medium">
                    {heroCopy.quickLinksLabel}:
                  </span>
                  {heroCopy.quickLinks.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setHeroPrompt(item)}
                      className="rounded-[10px] border border-slate-900/10 bg-white/82 px-3 py-1 text-[13px] text-slate-700"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <p className={HOME_SECTION_LABEL_CLASS}>{heroCopy.eyebrow}</p>
              <p className="max-w-3xl text-[1rem] leading-[1.75] text-text-muted sm:text-[1.05rem]">
                {heroCopy.subtitle}
              </p>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                <a
                  href={entry.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="tactile-button tactile-button-subtle px-3.5 py-2 text-slate-700 hover:text-primary"
                >
                  {heroCopy.sourceLink}
                </a>
                <div className="text-sm leading-6 text-text-subtle">
                  {heroCopy.helperNote}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1120px]">
          <div className="overflow-hidden rounded-[1.1rem] border border-slate-900/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] shadow-[var(--shadow-md)] backdrop-blur-sm">
            <div className="border-b border-slate-900/10 px-5 py-3.5 sm:px-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={HOME_SECTION_LABEL_CLASS}>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    {isChinese ? "X 助手" : "X Assistant"}
                  </p>
                </div>
                <span className="hidden rounded-[14px] border border-slate-900/8 bg-white/88 px-3.5 py-1.5 text-xs font-semibold text-slate-600 sm:inline-flex shadow-sm">
                  {isChinese ? "对话即入口" : "Prompt-first"}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-4.5">
              <XWorkmateAssistantShell
                mode="hero"
                isChinese={isChinese}
                prompt={heroPrompt}
                onPromptChange={setHeroPrompt}
                connected={Boolean(
                  (
                    assistantDefaultsSWR.data ?? EMPTY_ASSISTANT_DEFAULTS
                  ).openclawUrl.trim(),
                )}
                endpointLabel={
                  (assistantDefaultsSWR.data ?? EMPTY_ASSISTANT_DEFAULTS)
                    .openclawUrl
                }
                showConnectionStatus={false}
                secondaryActionLabel={heroCopy.maximizeLabel}
                onExpand={(nextPrompt) => {
                  const query = nextPrompt?.trim();
                  router.push(
                    query
                      ? `/xworkmate?prompt=${encodeURIComponent(query)}`
                      : "/xworkmate",
                  );
                }}
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
    <section className={cn(HOME_SECTION_CLASS, "space-y-4.5 p-5 lg:p-6")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={HOME_SECTION_LABEL_CLASS}>
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {language === "zh" ? "平台统计" : "Platform pulse"}
          </p>
          <p className="mt-2 text-sm leading-[1.6] text-text-muted">
            {language === "zh"
              ? "实时追踪关键数据，洞察平台活力。"
              : "Real-time insights into platform vitality and growth."}
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-[14px] border border-slate-900/8 bg-white/88 px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
          {language === "zh" ? "每小时更新" : "Updated hourly"}
        </span>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {displayStats.map((stat, index: number) => (
          <div
            key={index}
            className="group rounded-[1rem] border border-slate-900/8 bg-white/85 px-4 py-4.5 transition-all duration-300 hover:bg-white/95 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="editorial-display text-[2.4rem] leading-none text-slate-950 sm:text-[2.8rem] group-hover:text-primary transition-colors duration-300">
              {stat.value}
            </div>
            <p className="mt-3 text-sm leading-[1.6] text-slate-600 group-hover:text-slate-700 transition-colors duration-300">
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
    <section className={cn(HOME_SECTION_CLASS, "space-y-4.5 p-5 lg:p-6")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={HOME_SECTION_LABEL_CLASS}>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t.shortcuts.title}
          </p>
          <p className="mt-2 text-sm leading-[1.6] text-text-muted">
            {t.shortcuts.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 text-xs font-semibold">
          <button
            type="button"
            className="tactile-button tactile-button-primary px-4.5 py-2.5"
          >
            {t.shortcuts.buttons.start}
          </button>
          <button
            type="button"
            className="tactile-button tactile-button-soft px-4.5 py-2.5 text-slate-700 hover:text-primary"
          >
            {t.shortcuts.buttons.docs}
          </button>
          <button
            type="button"
            className="tactile-button tactile-button-soft px-4.5 py-2.5 text-slate-700 hover:text-primary"
          >
            {t.shortcuts.buttons.guides}
          </button>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {shortcutItems.map((item, index: number) => {
          const Icon = getIcon(item.title, Sparkles);
          return (
            <a
              key={index}
              href={item.href}
              className={cn(
                HOME_LIST_CARD_CLASS,
                "group flex items-start gap-3.5 p-4.5",
              )}
            >
              <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-primary/10 to-accent/10 text-primary group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300">
                <Icon className="h-5.5 w-5.5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="text-base font-semibold leading-7 text-slate-900 group-hover:text-primary transition-colors duration-300">
                  {item.title}
                </div>
                <p className="text-sm leading-6 text-slate-600 group-hover:text-slate-700 transition-colors duration-300">
                  {item.description}
                </p>
              </div>
              <ArrowRight
                className="ml-auto h-4.5 w-4.5 text-slate-500 transition-all duration-300 group-hover:text-primary group-hover:translate-x-0.5"
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
