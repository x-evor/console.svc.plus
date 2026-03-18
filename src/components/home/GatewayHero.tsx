"use client";

import {
  ArrowRight,
  Cloud,
  Send,
  Sparkles,
  SunMedium,
  Workflow,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLanguage } from "@/i18n/LanguageProvider";
import type { IntegrationDefaults } from "@/lib/openclaw/types";
import { useUserStore } from "@/lib/userStore";
import { cn } from "@/lib/utils";
import {
  buildHomeGatewayHeroViewModel,
  type HomeGatewayStatusNode,
} from "@/components/home/gatewayHeroModel";
import { useGatewayHero } from "@/components/home/useGatewayHero";

function toneClasses(tone: HomeGatewayStatusNode["tone"]): string {
  if (tone === "healthy") {
    return "border-lime-300/70 bg-lime-50/90 text-lime-950";
  }
  if (tone === "warning") {
    return "border-amber-300/70 bg-amber-50/95 text-amber-950";
  }
  return "border-slate-200 bg-white/90 text-slate-900";
}

function resolveDisplayName(params: {
  isChinese: boolean;
  name?: string | null;
  username?: string | null;
  email?: string | null;
}): string {
  const rawCandidates = [
    params.name?.trim(),
    params.username?.trim(),
    params.email?.split("@")[0]?.trim(),
  ].filter(Boolean) as string[];
  const first = rawCandidates[0];

  if (!first) {
    return params.isChinese ? "游客" : "Guest";
  }

  if (first.toLowerCase() === "guest") {
    return params.isChinese ? "游客" : "Guest";
  }

  return first;
}

export function GatewayHero({
  defaults,
}: {
  defaults: IntegrationDefaults;
}) {
  const { language } = useLanguage();
  const isChinese = language === "zh";
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [prompt, setPrompt] = useState("");
  const { bootstrap, bootstrapError, bootstrapLoading, gatewayConfigured, sendPrompt, sendState } =
    useGatewayHero(defaults);

  const displayName = resolveDisplayName({
    isChinese,
    name: user?.name,
    username: user?.username,
    email: user?.email,
  });
  const model = buildHomeGatewayHeroViewModel({
    isChinese,
    displayName,
    bootstrap,
    bootstrapError,
    connected: gatewayConfigured && !bootstrapError,
  });
  const badgeClass =
    model.statusTone === "healthy"
      ? "bg-lime-400 text-lime-950 shadow-[0_0_30px_rgba(163,230,53,0.55)]"
      : model.statusTone === "warning"
        ? "bg-amber-300 text-amber-950"
        : "bg-slate-200 text-slate-700";
  const periodAccent =
    model.period === "morning"
      ? "from-lime-100/90 via-white to-sky-50"
      : model.period === "afternoon"
        ? "from-amber-50 via-white to-cyan-50"
        : model.period === "evening"
          ? "from-emerald-50 via-white to-slate-100"
          : "from-slate-100 via-white to-indigo-50";
  const responseText = sendState.responseText.trim();
  const sessionKey =
    sendState.activeSessionKey || bootstrap?.activeSessionKey || "";

  async function handleSend(): Promise<void> {
    if (!prompt.trim()) {
      return;
    }
    await sendPrompt(prompt);
  }

  function openWorkspace(): void {
    const query = new URLSearchParams();
    if (prompt.trim()) {
      query.set("prompt", prompt.trim());
    }
    if (sessionKey) {
      query.set("sessionKey", sessionKey);
    }
    const suffix = query.toString();
    router.push(suffix ? `/xworkmate?${suffix}` : "/xworkmate");
  }

  return (
    <section className="relative overflow-hidden rounded-[1.6rem] border border-lime-200/85 bg-white shadow-[0_24px_70px_rgba(143,214,38,0.12)]">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          periodAccent,
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(163,230,53,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(163,230,53,0.08)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40"
      />
      <div className="relative p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-200 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                <SunMedium className="h-3.5 w-3.5 text-lime-600" />
                {model.panelLabel}
              </div>
              <div className="space-y-1">
                <p className="text-[1.05rem] font-semibold text-slate-800">
                  {model.greeting}
                </p>
                <h1 className="text-[2rem] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[2.35rem]">
                  {model.headline}
                </h1>
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-[16px]">
                  {model.summary}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 self-start rounded-[1.2rem] border border-white/80 bg-white/85 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold",
                  badgeClass,
                )}
              >
                {model.statusTone === "healthy" ? "✓" : model.statusTone === "warning" ? "!" : "·"}
              </div>
              <div>
                <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {isChinese ? "首屏状态" : "Hero Status"}
                </div>
                <div className="mt-1 text-[1.6rem] font-semibold tracking-[-0.05em] text-slate-950">
                  {model.statusBadge}
                </div>
                <p className="mt-1 max-w-[18rem] text-sm leading-6 text-slate-600">
                  {model.statusDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            <div className="rounded-[1.35rem] border border-lime-200/80 bg-white/88 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-lime-400 shadow-[0_0_18px_rgba(163,230,53,0.9)]" />
                <div className="h-px flex-1 bg-lime-200" />
              </div>
              <div className="mt-5 space-y-5">
                {model.statusNodes.map((node) => (
                  <div key={node.key} className="flex items-center gap-4">
                    <div className="relative flex w-[9.5rem] items-center gap-3 text-[1rem] font-semibold text-slate-800">
                      <div className="h-3 w-3 rounded-full bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.75)]" />
                      <span>{node.label}</span>
                    </div>
                    <div className="h-10 w-px bg-slate-200" />
                    <div className={cn("min-w-0 rounded-full border px-4 py-2 text-lg font-semibold", toneClasses(node.tone))}>
                      {node.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Workflow className="h-4 w-4 text-slate-500" />
                    {isChinese ? "最近会话" : "Recent Sessions"}
                  </div>
                  <div className="mt-3 space-y-2">
                    {model.recentSessions.length > 0 ? (
                      model.recentSessions.map((session) => (
                        <div
                          key={session.key}
                          className="rounded-[0.9rem] border border-white bg-white/90 px-3 py-2 text-sm text-slate-700"
                        >
                          {session.derivedTitle ||
                            session.displayName ||
                            session.lastMessagePreview ||
                            session.key}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm leading-6 text-slate-500">
                        {isChinese
                          ? "当前还没有可展示的会话摘要。"
                          : "No recent session summary is available yet."}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Cloud className="h-4 w-4 text-slate-500" />
                    {isChinese ? "可用代理" : "Available Agents"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {model.featuredAgents.length > 0 ? (
                      model.featuredAgents.map((agent) => (
                        <div
                          key={agent.id}
                          className="inline-flex items-center gap-2 rounded-full border border-white bg-white/95 px-3 py-2 text-sm font-medium text-slate-700"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-lime-600" />
                          {agent.name}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm leading-6 text-slate-500">
                        {isChinese
                          ? "未从 Gateway 拉到代理摘要，先使用默认助手。"
                          : "No agent summary was returned yet, so the default assistant remains available."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-sky-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,247,255,0.95))] p-4 shadow-[0_22px_45px_rgba(96,165,250,0.14)]">
              <div className="rounded-[1.1rem] border border-white/80 bg-white/95 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder={
                    isChinese ? "有什么想问的？" : "What would you like to ask?"
                  }
                  className="min-h-[150px] w-full resize-none bg-transparent text-[1.05rem] leading-8 text-slate-700 outline-none placeholder:text-slate-400"
                />
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div className="text-xs leading-5 text-slate-500">
                    {gatewayConfigured
                      ? isChinese
                        ? "首页会直接通过 Gateway 发起首轮对话。"
                        : "The homepage sends the first live turn through the gateway."
                      : isChinese
                        ? "当前未配置 Gateway，可先跳到 XWorkmate。"
                        : "Gateway is not configured yet. You can continue in XWorkmate."}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={!prompt.trim() || sendState.isSending || !gatewayConfigured}
                    className="tactile-button tactile-button-primary min-h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {sendState.isSending
                      ? isChinese
                        ? "发送中"
                        : "Sending"
                      : isChinese
                        ? "发送"
                        : "Send"}
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-[1rem] border border-slate-200 bg-white/92 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-700">
                    {isChinese ? "快速入口" : "Quick Access"}
                  </div>
                  <button
                    type="button"
                    onClick={openWorkspace}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
                  >
                    {isChinese ? "继续到工作台" : "Continue in workspace"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {model.quickPrompts.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setPrompt(item)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-lime-300 hover:bg-lime-50"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[1rem] border border-slate-200 bg-white/92 p-4">
                <div className="text-sm font-semibold text-slate-700">
                  {isChinese ? "首轮演示结果" : "First Turn Demo"}
                </div>
                <div className="mt-3 min-h-[120px] rounded-[0.95rem] border border-dashed border-slate-200 bg-slate-50/75 p-4 text-sm leading-7 text-slate-600">
                  {sendState.errorMessage ? (
                    <p className="text-amber-700">{sendState.errorMessage}</p>
                  ) : responseText ? (
                    <p>{responseText}</p>
                  ) : bootstrapLoading ? (
                    <p>{isChinese ? "正在同步 Gateway 状态…" : "Syncing gateway state…"}</p>
                  ) : (
                    <p>
                      {isChinese
                        ? "发送一个 prompt，这里会显示首页首轮真实响应。"
                        : "Send a prompt to show the first live response directly on the homepage."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
