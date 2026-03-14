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
import Footer from "../components/Footer";
import UnifiedNavigation from "../components/UnifiedNavigation";
import { useUserStore } from "../lib/userStore";
import { useLanguage } from "../i18n/LanguageProvider";
import { translations } from "../i18n/translations";
import { useMoltbotStore } from "../lib/moltbotStore";
import { cn } from "../lib/utils";
import { AskAIDialog } from "../components/AskAIDialog";
import { HeroCard } from "../components/HeroCard";
import useSWR from "swr";

const iconMap: Record<string, any> = {
  // English keys
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
  // Chinese keys
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
    <div className="min-h-screen bg-background text-text transition-colors duration-150 flex flex-col">
      <UnifiedNavigation />

      <div
        className={cn(
          "flex flex-1 relative overflow-hidden",
          mode === "left-sidebar" && isOpen && "flex-row-reverse",
        )}
      >
        <div className="flex-1 overflow-y-auto relative">
          <div className="relative mx-auto max-w-6xl px-6 pb-20">
            <div
              className="absolute inset-0 bg-gradient-app-from opacity-20 pointer-events-none"
              aria-hidden
            />
            <main className="relative space-y-12 pt-10">
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
  const t = translations[language].marketing.home;

  return (
    <section className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="flex flex-col justify-center space-y-8">
        <div className="space-y-4">
          {t.hero.eyebrow && (
            <p className="font-semibold uppercase tracking-wider text-text-subtle">
              {t.hero.eyebrow}
            </p>
          )}
          <h1 className="text-xl font-bold tracking-tight text-heading sm:text-3xl">
            {t.hero.title}
          </h1>
          <p className="text-base text-text-muted">{t.hero.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-1.5 text-sm font-medium text-success">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              {t.signedIn.replace("{{username}}", user.username)}
            </div>
          ) : (
            <button className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover">
              <PlusCircle className="h-4 w-4" />
              {t.heroButtons.create}
            </button>
          )}
          <button className="flex items-center gap-2 rounded-full border border-surface-border bg-surface px-6 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-hover">
            <Play className="h-4 w-4" />
            {t.heroButtons.playground}
          </button>
          <button className="flex items-center gap-2 rounded-full border border-surface-border bg-surface px-6 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-hover">
            <BookOpen className="h-4 w-4" />
            {t.heroButtons.tutorials}
          </button>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-text-muted">{t.trustedBy}</p>
          <div className="flex gap-2 flex-wrap">
            <LogoPill label="Next.js" />
            <LogoPill label="Go" />
            <LogoPill label="Vercel" />
            <LogoPill label="Cloud Run" />
            <LogoPill label="PostgreSQL" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 relative">
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
    </section>
  );
}

export function NextStepsSection() {
  const { language } = useLanguage();
  const t = translations[language].marketing.home;

  return (
    <section className="space-y-4">
      <header className="flex items-center gap-3 text-sm text-text-muted">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-subtle">
          {t.nextSteps.title}
        </p>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-primary">
          {t.nextSteps.badge}
        </span>
      </header>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {t.nextSteps.items.map((item, index: number) => {
          const Icon = getIcon(item.title, Users);
          return (
            <div
              key={index}
              className="flex items-start gap-3 rounded-xl border border-surface-border bg-surface p-4 shadow-lg shadow-shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-primary-muted">
                  <span className="rounded-full bg-primary/20 px-2 py-0.5">
                    {item.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-heading">
                  {item.title}
                </p>
                <button className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary-hover">
                  {t.nextSteps.learnMore}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
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
    <section className="rounded-2xl border border-surface-border bg-gradient-to-r from-surface-muted via-surface/0 to-surface-muted p-6 shadow-inner shadow-shadow-sm">
      <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {displayStats.map((stat, index: number) => (
          <div key={index} className="space-y-1 text-center md:text-left">
            <div className="text-3xl font-semibold text-heading">
              {stat.value}
            </div>
            <p className="text-sm text-text-muted">{stat.label}</p>
          </div>
        ))}
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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-subtle">
            {t.shortcuts.title}
          </p>
          <p className="text-sm text-text-muted">{t.shortcuts.subtitle}</p>
        </div>
        <div className="flex gap-2 text-xs font-semibold text-primary">
          <button className="rounded-full border border-surface-border bg-surface-muted px-3 py-1 transition hover:bg-surface-hover">
            {t.shortcuts.buttons.start}
          </button>
          <button className="rounded-full border border-surface-border bg-surface-muted px-3 py-1 transition hover:bg-surface-hover">
            {t.shortcuts.buttons.docs}
          </button>
          <button className="rounded-full border border-surface-border bg-surface-muted px-3 py-1 transition hover:bg-surface-hover">
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
              className="group flex items-start gap-3 rounded-xl border border-surface-border bg-surface p-4 transition hover:-translate-y-[1px] hover:border-primary/50 hover:bg-surface-hover"
            >
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-heading">
                  {item.title}
                </div>
                <p className="text-sm text-text-muted">{item.description}</p>
              </div>
              <ArrowRight
                className="ml-auto h-4 w-4 text-text-subtle transition group-hover:text-primary"
                aria-hidden
              />
            </a>
          );
        })}
      </div>
    </section>
  );
}

type LatestBlogPost = {
  slug: string;
  title: string;
  date?: string;
};

function LogoPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-muted px-3 py-1 text-xs font-semibold text-text">
      <div className="h-2 w-2 rounded-full bg-success" />
      {label}
    </span>
  );
}
