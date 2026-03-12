'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { AssistantMode, IntegrationDefaults, ThinkingLevel } from '@/lib/openclaw/types'

type OpenClawConsoleState = {
  defaultsLoaded: boolean
  openclawUrl: string
  openclawToken: string
  vaultUrl: string
  vaultNamespace: string
  vaultToken: string
  apisixUrl: string
  apisixToken: string
  assistantMode: AssistantMode
  thinking: ThinkingLevel
  selectedAgentId: string
  selectedSessionKey: string
  applyDefaults: (defaults: IntegrationDefaults) => void
  setOpenclawUrl: (value: string) => void
  setOpenclawToken: (value: string) => void
  setVaultUrl: (value: string) => void
  setVaultNamespace: (value: string) => void
  setVaultToken: (value: string) => void
  setApisixUrl: (value: string) => void
  setApisixToken: (value: string) => void
  setAssistantMode: (value: AssistantMode) => void
  setThinking: (value: ThinkingLevel) => void
  setSelectedAgentId: (value: string) => void
  setSelectedSessionKey: (value: string) => void
}

export const useOpenClawConsoleStore = create<OpenClawConsoleState>()(
  persist(
    (set, get) => ({
      defaultsLoaded: false,
      openclawUrl: '',
      openclawToken: '',
      vaultUrl: '',
      vaultNamespace: '',
      vaultToken: '',
      apisixUrl: '',
      apisixToken: '',
      assistantMode: 'ask',
      thinking: 'high',
      selectedAgentId: '',
      selectedSessionKey: '',
      applyDefaults: (defaults) => {
        const current = get()
        set({
          defaultsLoaded: true,
          openclawUrl: current.openclawUrl || defaults.openclawUrl,
          vaultUrl: current.vaultUrl || defaults.vaultUrl,
          vaultNamespace: current.vaultNamespace || defaults.vaultNamespace,
          apisixUrl: current.apisixUrl || defaults.apisixUrl,
        })
      },
      setOpenclawUrl: (openclawUrl) => set({ openclawUrl }),
      setOpenclawToken: (openclawToken) => set({ openclawToken }),
      setVaultUrl: (vaultUrl) => set({ vaultUrl }),
      setVaultNamespace: (vaultNamespace) => set({ vaultNamespace }),
      setVaultToken: (vaultToken) => set({ vaultToken }),
      setApisixUrl: (apisixUrl) => set({ apisixUrl }),
      setApisixToken: (apisixToken) => set({ apisixToken }),
      setAssistantMode: (assistantMode) => set({ assistantMode }),
      setThinking: (thinking) => set({ thinking }),
      setSelectedAgentId: (selectedAgentId) => set({ selectedAgentId }),
      setSelectedSessionKey: (selectedSessionKey) => set({ selectedSessionKey }),
    }),
    {
      name: 'openclaw-console-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        openclawUrl: state.openclawUrl,
        openclawToken: state.openclawToken,
        vaultUrl: state.vaultUrl,
        vaultNamespace: state.vaultNamespace,
        vaultToken: state.vaultToken,
        apisixUrl: state.apisixUrl,
        apisixToken: state.apisixToken,
        assistantMode: state.assistantMode,
        thinking: state.thinking,
        selectedAgentId: state.selectedAgentId,
        selectedSessionKey: state.selectedSessionKey,
      }),
    },
  ),
)
