"use client";

export const dynamic = "error";

import {
  AppWindow,
  ArrowRight,
  BookOpen,
  Command,
  Layers,
  Link,
  Lock,
  MousePointerClick,
  Play,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
} from "lucide-react";
import useSWR from "swr";

import Footer from "../components/Footer";
import { HeroCard } from "../components/HeroCard";
import UnifiedNavigation from "../components/UnifiedNavigation";
import { useLanguage } from "../i18n/LanguageProvider";
import { translations } from "../i18n/translations";
import { useMoltbotStore } from "../lib/moltbotStore";
import { useUserStore } from "../lib/userStore";
import { cn } from "../lib/utils";

const HOME_SECTION_CLASS =
  "rounded-[2rem] border border-slate-900/10 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.05)]";
const HOME_SECTION_LABEL_CLASS =
  "text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-text-subtle";
const HOME_LIST_CARD_CLASS =
  "rounded-[1.5rem] border border-slate-900/10 bg-[#fcfbf8] transition duration-200";

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
              <NextStepsSection />
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
  const { user } = useUserStore();
  const { language } = useLanguage();
  const isChinese = language === "zh";
  const t = translations[language].marketing.home;

  return (
    <section className="relative overflow-hidden rounded-[2.75rem] border border-slate-900/10 bg-[linear-gradient(180deg,#ffffff,#faf7f2)] p-6 shadow-[0_24px_56px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[8%] h-[16rem] w-[16rem] rounded-full bg-[radial-gradient(circle,rgba(37,78,219,0.1),transparent_64%)] blur-3xl" />
        <div className="absolute left-[30%] top-[12%] h-[14rem] w-[14rem] rounded-full bg-[radial-gradient(circle,rgba(245,211,170,0.42),transparent_66%)] blur-3xl" />
        <div className="absolute right-[10%] top-[10%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.92),transparent_72%)]" />
        <div className="absolute inset-x-0 top-0 h-[18rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0)_72%)]" />
      </div>

      <div className="relative grid gap-8 lg:grid-cols-[0.96fr_1.04fr] lg:gap-12">
        <div className="flex flex-col justify-between gap-8">
          <div className="space-y-5">
            {t.hero.eyebrow ? (
              <p className={HOME_SECTION_LABEL_CLASS}>{t.hero.eyebrow}</p>
            ) : null}
            <h1
              className={cn(
                "max-w-[11ch] leading-[0.88] text-heading",
                isChinese
                  ? "text-[2.85rem] font-semibold tracking-[-0.08em] sm:text-[3.4rem] lg:text-[4.5rem]"
                  : "editorial-display text-[3.05rem] tracking-[-0.06em] sm:text-[3.6rem] lg:text-[4.8rem]",
              )}
            >
              {t.hero.title}
            </h1>
            <p className="max-w-xl text-[1rem] leading-8 text-text-muted sm:text-[1.05rem]">
              {t.hero.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {user ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-4 py-2 text-sm font-semibold text-success">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                {t.signedIn.replace("{{username}}", user.username)}
              </div>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary"
              >
                <PlusCircle className="h-4 w-4" />
                {t.heroButtons.create}
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              <Play className="h-4 w-4" />
              {t.heroButtons.playground}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-[#f8f4ec] px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-[#f2ebdd]"
            >
              <BookOpen className="h-4 w-4" />
              {t.heroButtons.tutorials}
            </button>
          </div>

          <div className="space-y-3 border-t border-slate-900/10 pt-5">
            <p className={HOME_SECTION_LABEL_CLASS}>{t.trustedBy}</p>
            <div className="flex flex-wrap gap-2">
              <LogoPill label="Next.js" />
              <LogoPill label="Go" />
              <LogoPill label="Vercel" />
              <LogoPill label="Cloud Run" />
              <LogoPill label="PostgreSQL" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:pl-4">
          <div className="flex flex-col gap-2 border-b border-slate-900/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={HOME_SECTION_LABEL_CLASS}>
                {isChinese ? "主要入口" : "Launch paths"}
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
                {isChinese
                  ? "从接入、托管到观测，保留原有入口，但改成更轻的阅读节奏。"
                  : "Keep the same entry points, but present them with a calmer editorial rhythm."}
              </p>
            </div>
            <span className="hidden rounded-full border border-slate-900/10 bg-white px-3 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
              {t.heroCards.length} {isChinese ? "个入口" : "entry paths"}
            </span>
          </div>

          <div className="space-y-3">
            {t.heroCards.map((card) => {
              const Icon = getIcon(card.title, PlusCircle);
              return (
                <HeroCard
                  key={card.title}
                  icon={Icon}
                  title={card.title}
                  description={card.description}
                  guide={card.guide}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function NextStepsSection() {
  const { language } = useLanguage();
  const t = translations[language].marketing.home;

  return (
    <section className={cn(HOME_SECTION_CLASS, "space-y-4 p-5 lg:p-7")}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={HOME_SECTION_LABEL_CLASS}>{t.nextSteps.title}</p>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            {language === "zh"
              ? "保留原有 onboarding 内容，但改成更轻、更整齐的起步列表。"
              : "Keep the same onboarding content, in a lighter and calmer starting list."}
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-slate-900/10 bg-[#f8f4ec] px-3 py-1 text-xs font-semibold text-slate-700">
          {t.nextSteps.badge}
        </span>
      </header>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {t.nextSteps.items.map((item, index: number) => {
          const Icon = getIcon(item.title, Users);
          return (
            <div
              key={index}
              className={cn(
                HOME_LIST_CARD_CLASS,
                "flex h-full flex-col justify-between gap-6 p-4 hover:-translate-y-[1px] hover:bg-white",
              )}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/[0.04] text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <span className="rounded-full border border-slate-900/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {item.status}
                  </span>
                </div>
                <p className="text-base font-semibold leading-7 text-slate-900">
                  {item.title}
                </p>
              </div>

              <button className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-hover">
                {t.nextSteps.learnMore}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          );
        })}
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

function LogoPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700">
      <div className="h-2 w-2 rounded-full bg-primary" />
      {label}
    </span>
  );
}
