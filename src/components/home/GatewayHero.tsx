"use client";

import {
  Search,
  ArrowRight,
  Cloud,
  Bell,
  Sun,
  Wrench,
  History,
  Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLanguage } from "@/i18n/LanguageProvider";
import type { IntegrationDefaults } from "@/lib/openclaw/types";
import { useUserStore } from "@/lib/userStore";
import { useGatewayHero } from "@/components/home/useGatewayHero";

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
  const { bootstrap, sendState } = useGatewayHero(defaults);

  const displayName = resolveDisplayName({
    isChinese,
    name: user?.name,
    username: user?.username,
    email: user?.email,
  });

  const sessionKey =
    sendState.activeSessionKey || bootstrap?.activeSessionKey || "";

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

  function handleInputSubmit() {
    if (!prompt.trim()) return;
    openWorkspace();
  }

  return (
    <section className="relative w-full overflow-hidden bg-[#fafafa] pt-12 pb-16 px-6 lg:px-12 font-sans rounded-3xl border border-gray-100 shadow-sm">
      <div
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-500 rounded-2xl shadow-sm">
              <Sun size={24} className="text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {isChinese ? "早上好，" : "Good morning, "}{displayName}
            </h1>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold tracking-wider text-gray-500 mb-1">
              SYSTEM STATUS
            </span>
            <div className="flex items-center gap-1.5 text-blue-500 font-bold text-sm tracking-wide">
              <span className="w-2 h-2 rounded-full bg-blue-500 opacity-50"></span>
              OPTIMIZED
            </div>
          </div>
        </div>

        {/* 3 Top Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Services Card */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="text-sm font-semibold text-gray-800 mb-4">
              Services
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-500 flex items-baseline gap-1 font-mono tracking-tight">
                Normal <span className="w-2 h-2 rounded-full bg-blue-500 mb-1"></span>
              </div>
              <div className="text-xs text-gray-400 mt-2 font-medium">
                All 12 microservices active
              </div>
            </div>
          </div>

          {/* Clusters Card */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-between relative">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-semibold text-gray-800">Clusters</div>
              <Cloud className="text-gray-400 w-5 h-5" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 tracking-tight">
                  4/4
                </span>
                <span className="text-xs font-semibold text-gray-400 tracking-wider">
                  ONLINE
                </span>
              </div>
              <div className="w-full h-1.5 bg-blue-100 rounded-full mt-3">
                <div className="w-full h-full bg-blue-300 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Alerts Card */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-between relative">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-semibold text-gray-800">Alerts</div>
              <Bell className="text-gray-400 w-5 h-5" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-300 tracking-tight">
                  0
                </span>
                <span className="text-xs font-semibold text-gray-400 tracking-wider">
                  CRITICAL
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-3 font-medium">
                Last check: 2 mins ago
              </div>
            </div>
          </div>
        </div>

        {/* Central Prompt Input Bar */}
        <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-2 flex items-center mb-10 transition-shadow focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="pl-4 pr-2 text-gray-400">
            <Search className="w-6 h-6" />
          </div>
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg text-gray-700 placeholder:text-gray-400 px-2 py-3"
            placeholder={
              isChinese ? "有什么想问的？" : "What would you like to ask?"
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleInputSubmit();
              }
            }}
          />
          <button
            className="w-12 h-12 bg-blue-500 hover:bg-blue-600 transition-colors rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-50 ml-2"
            onClick={handleInputSubmit}
            disabled={!prompt.trim()}
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Access */}
        <div className="flex flex-col items-center mb-12">
          <div className="text-xs font-semibold tracking-widest text-gray-400 mb-4 uppercase">
            Quick Access
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-600 px-5 py-2.5 rounded-full text-sm font-medium transition-colors">
              <Wrench className="w-4 h-4" />
              {isChinese ? "常用工具" : "Common Tools"}
            </button>
            <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 px-5 py-2.5 rounded-full text-sm font-medium border border-gray-100 shadow-sm transition-colors">
              <History className="w-4 h-4" />
              {isChinese ? "最近使用" : "Recent"}
            </button>
          </div>
        </div>

        {/* 2 Bottom Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Network Load Card */}
          <div className="bg-[#f5f5f7] rounded-[2rem] p-8 shadow-sm border border-gray-100 overflow-hidden relative min-h-[220px]">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Network Load
            </h3>
            <p className="text-sm text-gray-500">
              Real-time traffic distribution across global nodes.
            </p>

            {/* Bar Chart Mockup */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-6 gap-2 h-32">
              <div className="w-full bg-[#d0e1fd] rounded-t-full h-[30%]"></div>
              <div className="w-full bg-[#d0e1fd] rounded-t-full h-[50%]"></div>
              <div className="w-full bg-[#d0e1fd] rounded-t-full h-[65%]"></div>
              <div className="w-full bg-[#abc5fa] rounded-t-full h-[90%]"></div>
              <div className="w-full bg-[#d0e1fd] rounded-t-full h-[45%]"></div>
              <div className="w-full bg-[#d0e1fd] rounded-t-full h-[35%]"></div>
              <div className="w-full bg-[#d0e1fd] rounded-t-full h-[55%]"></div>
            </div>
          </div>

          {/* Global Mesh Card */}
          <div className="bg-[#111] rounded-[2rem] p-8 shadow-lg overflow-hidden relative min-h-[220px] text-white">
            {/* Background globe glow effect mockup */}
            <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-900/30 rounded-full blur-3xl"></div>
            <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-900/20 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="inline-block bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wider mb-4 uppercase">
                  Active Deployment
                </div>
                <h3 className="text-2xl font-bold text-white">Global Mesh</h3>
              </div>

              <div className="flex justify-between items-end mt-12">
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-gray-400 mb-1 uppercase">
                    Latency
                  </div>
                  <div className="text-xl font-bold">24ms</div>
                </div>
                <Globe className="w-6 h-6 text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
