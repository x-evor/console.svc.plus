"use client";

export const dynamic = "error";

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
import useSWR from "swr";

import type { IntegrationDefaults } from "@/lib/openclaw/types";
import { GatewayHero } from "@/components/home/GatewayHero";
import Footer from "../components/Footer";
import UnifiedNavigation from "../components/UnifiedNavigation";
import { useLanguage } from "../i18n/LanguageProvider";
import { translations } from "../i18n/translations";
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
          <div className="relative w-full max-w-7xl mx-auto px-2 pb-10 sm:px-3 sm:pb-12 lg:px-4">
            <main className="relative space-y-6 pt-4 sm:space-y-8 sm:pt-6">
              <HeroSection />
              <StatsSection />
              <ShortcutsSection />
            </main>
            <div className="relative mt-12">
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const assistantDefaultsSWR = useSWR<IntegrationDefaults>(
    "/api/integrations/defaults",
    async (url: string) => {
      const response = await fetch(url, {
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to load integrations defaults: ${response.status}`);
      }
      return (await response.json()) as IntegrationDefaults;
    },
    {
      revalidateOnFocus: false,
    },
  );
  return <GatewayHero defaults={assistantDefaultsSWR.data ?? EMPTY_ASSISTANT_DEFAULTS} />;
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
