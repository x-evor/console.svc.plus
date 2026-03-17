"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  AssistantMode,
  IntegrationDefaults,
  ThinkingLevel,
} from "@/lib/openclaw/types";

type OpenClawScopedSnapshot = {
  openclawUrl: string;
  openclawOrigin: string;
  openclawToken: string;
  vaultUrl: string;
  vaultNamespace: string;
  vaultToken: string;
  vaultSecretPath: string;
  vaultSecretKey: string;
  apisixUrl: string;
  apisixToken: string;
  assistantMode: AssistantMode;
  thinking: ThinkingLevel;
  selectedAgentId: string;
  selectedSessionKey: string;
};

type OpenClawConsoleState = OpenClawScopedSnapshot & {
  defaultsLoaded: boolean;
  scopeKey: string;
  scopedSessions: Record<string, OpenClawScopedSnapshot>;
  applyDefaults: (defaults: IntegrationDefaults) => void;
  setScope: (scopeKey: string, defaults?: IntegrationDefaults) => void;
  setOpenclawUrl: (value: string) => void;
  setOpenclawOrigin: (value: string) => void;
  setOpenclawToken: (value: string) => void;
  setVaultUrl: (value: string) => void;
  setVaultNamespace: (value: string) => void;
  setVaultToken: (value: string) => void;
  setVaultSecretPath: (value: string) => void;
  setVaultSecretKey: (value: string) => void;
  setApisixUrl: (value: string) => void;
  setApisixToken: (value: string) => void;
  setAssistantMode: (value: AssistantMode) => void;
  setThinking: (value: ThinkingLevel) => void;
  setSelectedAgentId: (value: string) => void;
  setSelectedSessionKey: (value: string) => void;
};

const DEFAULT_SCOPE_KEY = "global";

const EMPTY_SCOPE: OpenClawScopedSnapshot = {
  openclawUrl: "",
  openclawOrigin: "",
  openclawToken: "",
  vaultUrl: "",
  vaultNamespace: "",
  vaultToken: "",
  vaultSecretPath: "",
  vaultSecretKey: "",
  apisixUrl: "",
  apisixToken: "",
  assistantMode: "ask",
  thinking: "high",
  selectedAgentId: "",
  selectedSessionKey: "",
};

function normalizeScopeKey(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_SCOPE_KEY;
}

function buildScopedDefaults(
  defaults?: IntegrationDefaults,
): OpenClawScopedSnapshot {
  return {
    ...EMPTY_SCOPE,
    openclawUrl: defaults?.openclawUrl ?? "",
    openclawOrigin: defaults?.openclawOrigin ?? "",
    vaultUrl: defaults?.vaultUrl ?? "",
    vaultNamespace: defaults?.vaultNamespace ?? "",
    vaultSecretPath: defaults?.vaultSecretPath ?? "",
    vaultSecretKey: defaults?.vaultSecretKey ?? "",
    apisixUrl: defaults?.apisixUrl ?? "",
  };
}

function mergeScopeSnapshot(
  snapshot: OpenClawScopedSnapshot | undefined,
  defaults?: IntegrationDefaults,
): OpenClawScopedSnapshot {
  const base = buildScopedDefaults(defaults);
  if (!snapshot) {
    return base;
  }

  return {
    ...snapshot,
    openclawUrl: snapshot.openclawUrl || base.openclawUrl,
    openclawOrigin: snapshot.openclawOrigin || base.openclawOrigin,
    vaultUrl: snapshot.vaultUrl || base.vaultUrl,
    vaultNamespace: snapshot.vaultNamespace || base.vaultNamespace,
    vaultSecretPath: snapshot.vaultSecretPath || base.vaultSecretPath,
    vaultSecretKey: snapshot.vaultSecretKey || base.vaultSecretKey,
    apisixUrl: snapshot.apisixUrl || base.apisixUrl,
  };
}

function snapshotFromState(
  state: OpenClawConsoleState,
): OpenClawScopedSnapshot {
  return {
    openclawUrl: state.openclawUrl,
    openclawOrigin: state.openclawOrigin,
    openclawToken: state.openclawToken,
    vaultUrl: state.vaultUrl,
    vaultNamespace: state.vaultNamespace,
    vaultToken: state.vaultToken,
    vaultSecretPath: state.vaultSecretPath,
    vaultSecretKey: state.vaultSecretKey,
    apisixUrl: state.apisixUrl,
    apisixToken: state.apisixToken,
    assistantMode: state.assistantMode,
    thinking: state.thinking,
    selectedAgentId: state.selectedAgentId,
    selectedSessionKey: state.selectedSessionKey,
  };
}

export const useOpenClawConsoleStore = create<OpenClawConsoleState>()(
  persist(
    (set, get) => {
      const updateScopedSession = (
        partial: Partial<OpenClawScopedSnapshot>,
        options?: { defaultsLoaded?: boolean },
      ) => {
        const current = get();
        const scopeKey = normalizeScopeKey(current.scopeKey);
        const currentSnapshot = mergeScopeSnapshot(
          current.scopedSessions[scopeKey],
        );
        const nextSnapshot = {
          ...currentSnapshot,
          ...partial,
        };

        set({
          ...partial,
          defaultsLoaded:
            options?.defaultsLoaded !== undefined
              ? options.defaultsLoaded
              : current.defaultsLoaded,
          scopedSessions: {
            ...current.scopedSessions,
            [scopeKey]: nextSnapshot,
          },
        });
      };

      return {
        defaultsLoaded: false,
        scopeKey: DEFAULT_SCOPE_KEY,
        scopedSessions: {
          [DEFAULT_SCOPE_KEY]: EMPTY_SCOPE,
        },
        ...EMPTY_SCOPE,
        applyDefaults: (defaults) => {
          const current = get();
          const scopeKey = normalizeScopeKey(current.scopeKey);
          const nextSnapshot = mergeScopeSnapshot(
            current.scopedSessions[scopeKey],
            defaults,
          );
          set({
            defaultsLoaded: true,
            ...nextSnapshot,
            scopedSessions: {
              ...current.scopedSessions,
              [scopeKey]: nextSnapshot,
            },
          });
        },
        setScope: (scopeKey, defaults) => {
          const current = get();
          const normalizedScopeKey = normalizeScopeKey(scopeKey);
          const nextSnapshot = mergeScopeSnapshot(
            current.scopedSessions[normalizedScopeKey],
            defaults,
          );

          set({
            scopeKey: normalizedScopeKey,
            defaultsLoaded: current.defaultsLoaded || Boolean(defaults),
            ...nextSnapshot,
            scopedSessions: {
              ...current.scopedSessions,
              [normalizedScopeKey]: nextSnapshot,
            },
          });
        },
        setOpenclawUrl: (openclawUrl) => updateScopedSession({ openclawUrl }),
        setOpenclawOrigin: (openclawOrigin) =>
          updateScopedSession({ openclawOrigin }),
        setOpenclawToken: (openclawToken) =>
          updateScopedSession({ openclawToken }),
        setVaultUrl: (vaultUrl) => updateScopedSession({ vaultUrl }),
        setVaultNamespace: (vaultNamespace) =>
          updateScopedSession({ vaultNamespace }),
        setVaultToken: (vaultToken) => updateScopedSession({ vaultToken }),
        setVaultSecretPath: (vaultSecretPath) =>
          updateScopedSession({ vaultSecretPath }),
        setVaultSecretKey: (vaultSecretKey) =>
          updateScopedSession({ vaultSecretKey }),
        setApisixUrl: (apisixUrl) => updateScopedSession({ apisixUrl }),
        setApisixToken: (apisixToken) => updateScopedSession({ apisixToken }),
        setAssistantMode: (assistantMode) =>
          updateScopedSession({ assistantMode }),
        setThinking: (thinking) => updateScopedSession({ thinking }),
        setSelectedAgentId: (selectedAgentId) =>
          updateScopedSession({ selectedAgentId }),
        setSelectedSessionKey: (selectedSessionKey) =>
          updateScopedSession({ selectedSessionKey }),
      };
    },
    {
      name: "openclaw-console-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        scopeKey: state.scopeKey,
        scopedSessions: state.scopedSessions,
        defaultsLoaded: state.defaultsLoaded,
        ...snapshotFromState(state),
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as
          | Partial<OpenClawConsoleState>
          | undefined;
        const mergedState = {
          ...currentState,
          ...persisted,
        } as OpenClawConsoleState;

        const mergedScopeKey = normalizeScopeKey(mergedState.scopeKey);
        const hydratedSnapshot = mergeScopeSnapshot(
          mergedState.scopedSessions?.[mergedScopeKey] ??
            snapshotFromState(mergedState),
        );

        return {
          ...mergedState,
          scopeKey: mergedScopeKey,
          scopedSessions: {
            [DEFAULT_SCOPE_KEY]: EMPTY_SCOPE,
            ...(mergedState.scopedSessions ?? {}),
            [mergedScopeKey]: hydratedSnapshot,
          },
          ...hydratedSnapshot,
        };
      },
    },
  ),
);
