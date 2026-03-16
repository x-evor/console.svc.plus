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

  function handleMaximize(): void {
    onEnd();
    const query = initialQuestion?.text?.trim()
      ? `?q=${encodeURIComponent(initialQuestion.text.trim())}`
      : "";
    router.push(`/xworkmate${query}`);
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close assistant"
          onClick={onMinimize}
          className="fixed inset-0 z-[35] bg-black/18 backdrop-blur-sm md:hidden"
        />
      ) : null}

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[40] overflow-hidden border border-[color:var(--color-surface-border)] bg-[var(--color-background)]/96 shadow-2xl backdrop-blur transition-transform duration-300 ease-out md:left-auto md:right-0 md:w-[400px] md:border-l md:border-t-0 md:rounded-none",
          open
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-x-full",
          "rounded-t-[1.75rem] md:rounded-none",
          "top-[calc(var(--app-shell-nav-offset,64px)+0.75rem)] h-[calc(100vh-var(--app-shell-nav-offset,64px)-0.75rem)] md:top-[var(--app-shell-nav-offset,64px)] md:h-[calc(100vh-var(--app-shell-nav-offset,64px))]",
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--color-surface-border)] px-4 py-3 md:px-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
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
    </>
  );
}
