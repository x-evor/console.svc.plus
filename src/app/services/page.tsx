"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookText,
  Bot,
  Box,
  CloudCog,
  Database,
  FileEdit,
  Gauge,
  MessageCircle,
  Network,
} from "lucide-react";
import Footer from "../../components/Footer";
import UnifiedNavigation from "../../components/UnifiedNavigation";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useViewStore } from "../../components/theme/viewStore";
import Material3Layout from "./Material3Layout";

const placeholderCount = 1;
type ServiceCardData = {
  key: string;
  name: string;
  description: string;
  href: string;
  icon: any;
  external?: boolean;
};

const ServiceCard = ({
  service,
  view,
  isChinese,
}: {
  service: ServiceCardData;
  view: "classic" | "material";
  isChinese: boolean;
}) => {
  const isMaterial = view === "material";

  const cardContent = (
    <div
      className={`group flex h-full flex-col justify-between rounded-xl p-5 transition ${isMaterial
        ? "border border-surface-border bg-surface hover:-translate-y-[1px] hover:border-primary/50 hover:bg-background-muted"
        : "border border-white/10 bg-white/5 hover:-translate-y-[1px] hover:border-indigo-400/50 hover:bg-slate-900/60"
        }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${isMaterial
            ? "bg-primary/15 text-primary"
            : "bg-indigo-500/15 text-indigo-200"
            }`}
        >
          <service.icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="space-y-1">
          <div
            className={`text-sm font-semibold ${isMaterial ? "text-heading" : "text-white"}`}
          >
            {service.name}
          </div>
          <p
            className={`text-sm ${isMaterial ? "text-text-muted" : "text-slate-300"}`}
          >
            {service.description}
          </p>
        </div>
      </div>
      <span
        className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold transition ${isMaterial
          ? "text-primary group-hover:text-primary-hover"
          : "text-indigo-200 group-hover:text-white"
          }`}
      >
        {isChinese ? "打开" : "Open"}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </span>
    </div>
  );

  if (service.external) {
    return (
      <a
        href={service.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link href={service.href} className="block">
      {cardContent}
    </Link>
  );
};

const PlaceholderCard = ({
  view,
  isChinese,
}: {
  view: "classic" | "material";
  isChinese: boolean;
}) => {
  const isMaterial = view === "material";
  const placeholderLabel = isChinese
    ? "更多服务即将上线"
    : "More services coming soon";
  const placeholderDescription = isChinese
    ? "预留卡片位置，持续扩充入口。"
    : "Reserved slots for new service entries.";

  return (
    <div
      className={`flex h-full flex-col justify-between rounded-xl border border-dashed p-5 ${isMaterial
        ? "border-surface-border-strong bg-surface text-text-muted"
        : "border-white/15 bg-white/5 text-slate-300"
        }`}
    >
      <div className="space-y-2">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full border border-dashed text-sm ${isMaterial
            ? "border-surface-border-strong text-text-subtle"
            : "border-white/20 text-slate-400"
            }`}
        >
          <Box className="h-4 w-4" aria-hidden />
        </div>
        <div
          className={`text-sm font-semibold ${isMaterial ? "text-heading" : "text-white/80"}`}
        >
          {placeholderLabel}
        </div>
        <p
          className={`text-sm ${isMaterial ? "text-text-subtle" : "text-slate-400"}`}
        >
          {placeholderDescription}
        </p>
      </div>
      <span
        className={`mt-4 text-xs font-semibold ${isMaterial ? "text-text-subtle" : "text-slate-400"}`}
      >
        {isChinese ? "敬请期待" : "Stay tuned"}
      </span>
    </div>
  );
};

const ServiceGrid = ({
  view,
  services,
  isChinese,
}: {
  view: "classic" | "material";
  services: ServiceCardData[];
  isChinese: boolean;
}) => {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {services.map((service) => (
        <ServiceCard
          key={service.key}
          service={service}
          view={view}
          isChinese={isChinese}
        />
      ))}
      {Array.from({ length: placeholderCount }).map((_, index) => (
        <PlaceholderCard
          key={`placeholder-${index}`}
          view={view}
          isChinese={isChinese}
        />
      ))}
    </section>
  );
};

const ClawdbotLogo = (props: any) => (
  <img
    src="https://mintcdn.com/clawdhub/4rYvG-uuZrMK_URE/assets/pixel-lobster.svg?fit=max&auto=format&n=4rYvG-uuZrMK_URE&q=85&s=da2032e9eac3b5d9bfe7eb96ca6a8a26"
    alt="Clawdbot"
    {...props}
  />
);

export default function ServicesPage() {
  const { view, isHydrated } = useViewStore();
  const { language } = useLanguage();
  const isChinese = language === "zh";

  const services: ServiceCardData[] = [
    {
      key: "editor",
      name: isChinese ? "编辑器" : "Editor",
      description: isChinese
        ? "Markdown 发布与排版的在线编辑器。"
        : "Markdown publishing and layout editor.",
      href: "https://markdown-publisher.svc.plus",
      icon: FileEdit,
      external: true,
    },
    {
      key: "wechat-to-markdown",
      name: isChinese ? "微信转 Markdown" : "WeChat to Markdown",
      description: isChinese
        ? "一键将公众号内容转换为 Markdown。"
        : "Convert WeChat articles into Markdown.",
      href: "https://wechat-to-markdown.svc.plus",
      icon: MessageCircle,
      external: true,
    },
    {
      key: "page-reading",
      name: isChinese ? "Page Reading Agent" : "Page Reading Agent",
      description: isChinese
        ? "智能网页阅读与分析服务。"
        : "Intelligent web page reading and analysis service.",
      href: "https://page-reading.svc.plus",
      icon: Bot,
      external: true,
    },
    {
      key: "artifact",
      name: isChinese ? "制品 / 镜像" : "Artifact / Mirror",
      description: isChinese
        ? "获取核心制品、镜像与下载资源。"
        : "Get core artifacts, mirrors, and downloads.",
      href: "/download",
      icon: Box,
    },
    {
      key: "cloudIac",
      name: isChinese ? "云 IaC 目录" : "Cloud IaC Catalog",
      description: isChinese
        ? "浏览云基础设施目录与自动化蓝图。"
        : "Browse cloud IaC catalog and automation blueprints.",
      href: "/cloud_iac",
      icon: CloudCog,
    },
    {
      key: "insight",
      name: isChinese ? "监控与观测" : "Monitoring & Observability",
      description: isChinese
        ? "基础设施、数据库与应用系统的全栈可观测性工作台。"
        : "Full-stack observability workbench for infrastructure, databases, and apps.",
      href: "https://observability.svc.plus/grafana/",
      icon: Gauge,
      external: true,
    },
    {
      key: "ai-gateway",
      name: isChinese ? "AI 网关" : "AI Gateway",
      description: isChinese
        ? "Litellm 驱动的 LLM API 统一管理与路由。"
        : "Unified LLM API management and routing powered by Litellm.",
      href: "https://ai-gateway.svc.plus",
      icon: Network,
      external: true,
    },
    {
      key: "docs",
      name: isChinese ? "文档 / 解决方案" : "Docs / Solutions",
      description: isChinese
        ? "阅读文档、方案与产品指南。"
        : "Read documentation, solutions, and guides.",
      href: "/docs",
      icon: BookText,
    },
    {
      key: "x-scope-hub",
      name: isChinese ? "XScopeHub MCP" : "XScopeHub MCP",
      description: isChinese
        ? "模块化 MCP 服务驱动的可观测性中心。"
        : "Modular MCP server powering observability hub.",
      href: "https://x-scope-hub-svc-plus-266500572462.asia-northeast1.run.app",
      icon: Database,
      external: true,
    },
    {
      key: "x-cloud-flow",
      name: isChinese ? "XCloudFlow" : "XCloudFlow",
      description: isChinese
        ? "多云基础设施、配置编排与边缘执行流水线。"
        : "Multi-cloud infrastructure and edge execution flow.",
      href: "https://x-cloud-flow-svc-plus-266500572462.asia-northeast1.run.app",
      icon: Network,
      external: true,
    },
    {
      key: "moltbot",
      name: isChinese ? "OpenClaw 助手" : "OpenClaw Assistant",
      description: isChinese
        ? "OpenClaw gateway 驱动的原生 AI 助手工作区。"
        : "Native AI assistant workspace powered by OpenClaw gateway.",
      href: "/services/openclaw",
      icon: ClawdbotLogo,
    },
  ];

  if (!isHydrated) {
    return null;
  }

  if (view === "material") {
    return (
      <Material3Layout>
        <div className="mb-10">
          <h2 className="text-heading text-4xl font-black tracking-tight mb-2">
            Service Overview
          </h2>
          <p className="text-text-muted text-lg max-w-2xl">
            Real-time metrics and system health for your current production
            environment.
          </p>
        </div>
        <ServiceGrid
          view="material"
          services={services}
          isChinese={isChinese}
        />
      </Material3Layout>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_80%_0,rgba(168,85,247,0.15),transparent_30%),radial-gradient(circle_at_50%_60%,rgba(52,211,153,0.08),transparent_35%)]"
        aria-hidden
      />
      <div className="relative w-full px-8 pb-20">
        <UnifiedNavigation />
        <main className="space-y-10 pt-10">
          <header className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              {isChinese ? "更多服务" : "More services"}
            </p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              {isChinese
                ? "扩展服务与工具箱"
                : "Extended Services & Toolbox"}
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              {isChinese
                ? "汇聚开发辅助、运维监控与核心制品，构建无缝衔接的云原生工作台。"
                : "A unified hub for development aids, operations monitoring, and core artifacts."}
            </p>
          </header>
          <ServiceGrid
            view="classic"
            services={services}
            isChinese={isChinese}
          />
        </main>
        <Footer />
      </div>
    </div>
  );
}
