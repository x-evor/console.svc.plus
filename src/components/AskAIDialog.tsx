"use client";

import { Maximize2, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { OpenClawAssistantPane } from "@/components/openclaw/OpenClawAssistantPane";
import type { IntegrationDefaults } from "@/lib/openclaw/types";
import { cn } from "@/lib/utils";

export type InitialQuestionPayload = {
  key: number;
  text: string;
};

type AskAIDialogProps = {
  open: boolean;
  defaults?: IntegrationDefaults;
  onMinimize: () => void;
  onEnd: () => void;
  initialQuestion?: InitialQuestionPayload;
};

export function AskAIDialog({
  open,
  defaults,
  onMinimize,
  onEnd,
  initialQuestion,
}: AskAIDialogProps) {
  const router = useRouter();
  const resolvedDefaults: IntegrationDefaults = defaults ?? {
    openclawUrl: "",
    openclawTokenConfigured: false,
    vaultUrl: "",
    vaultNamespace: "",
    vaultTokenConfigured: false,
    vaultSecretPath: "",
    vaultSecretKey: "",
    apisixUrl: "",
    apisixTokenConfigured: false,
  };

  function handleMaximize(): void {
    onEnd();
    const query = initialQuestion?.text?.trim()
      ? `?q=${encodeURIComponent(initialQuestion.text.trim())}`
      : "";
    router.push(`/xworkmate${query}`);
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 right-0 z-[40] border-l border-[color:var(--color-surface-border)] bg-[var(--color-background)]/95 shadow-xl backdrop-blur",
      )}
      style={{
        width: "400px",
        top: "var(--app-shell-nav-offset, 64px)",
        height: "calc(100vh - var(--app-shell-nav-offset, 64px))",
        display: open ? "block" : "none",
      }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--color-surface-border)] px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
              XWorkmate
            </p>
            <h2 className="text-sm font-semibold text-[var(--color-heading)]">
              AI Assistant
            </h2>
          </div>

          <div className="flex items-center gap-1 text-[var(--color-text-subtle)]">
            <button
              type="button"
              onClick={handleMaximize}
              className="rounded-xl p-2 transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
              title="Open workspace"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onMinimize}
              className="rounded-xl p-2 transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
              title="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <OpenClawAssistantPane
            defaults={resolvedDefaults}
            initialQuestion={initialQuestion?.text}
            initialQuestionKey={initialQuestion?.key}
            variant="sidebar"
          />
        </div>
      </div>
    </div>
  );
}
