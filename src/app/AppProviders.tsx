"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "../components/theme";
import { LanguageProvider } from "../i18n/LanguageProvider";
import { AskAIDialog } from "../components/AskAIDialog";
import { useMoltbotStore } from "../lib/moltbotStore";
import { cn } from "../lib/utils";
import type { IntegrationDefaults } from "@/lib/openclaw/types";
import { useOpenClawConsoleStore } from "@/state/openclawConsoleStore";

export function AppProviders({
  children,
  assistantDefaults,
}: {
  children: ReactNode;
  assistantDefaults: IntegrationDefaults;
}) {
  const { isOpen, isMinimized, close, toggleOpen } = useMoltbotStore();
  const applyDefaults = useOpenClawConsoleStore((state) => state.applyDefaults);
  const pathname = usePathname();
  const isOpenClawWorkspace =
    pathname.startsWith("/xworkmate") ||
    pathname.startsWith("/services/openclaw");

  // Always reserve space if open and not minimized, since we only have "Float/Sidebar" mode now
  // and user wants it to NEVER cover the homepage.
  const reserveSpace = !isOpenClawWorkspace && isOpen && !isMinimized;

  useEffect(() => {
    applyDefaults(assistantDefaults);
  }, [applyDefaults, assistantDefaults]);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="flex flex-col min-h-screen">
          <div
            style={
              {
                "--assistant-reserve-offset": reserveSpace ? "400px" : "0px",
              } as React.CSSProperties
            }
            className={cn(
              "flex-1 flex flex-col relative w-full overflow-hidden transition-[padding] duration-300 ease-in-out",
              reserveSpace ? "pr-[400px]" : "",
            )}
          >
            <div className="flex-1 flex flex-col w-full relative">
              {children}
            </div>
            {!isOpenClawWorkspace ? (
              <AskAIDialog
                open={isOpen}
                defaults={assistantDefaults}
                onMinimize={toggleOpen}
                onEnd={close}
              />
            ) : null}
          </div>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
