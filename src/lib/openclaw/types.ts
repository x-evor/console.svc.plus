export type AssistantMode = 'ask' | 'craft' | 'plan'

export type ThinkingLevel = 'low' | 'medium' | 'high' | 'max'

export type GatewayTokenSource = 'env' | 'request' | 'vault' | 'none'

export type GatewayAgentSummary = {
  id: string
  name: string
  emoji?: string
  theme?: string
}

export type GatewaySessionSummary = {
  key: string
  displayName?: string
  updatedAtMs?: number
  derivedTitle?: string
  lastMessagePreview?: string
  model?: string
  thinkingLevel?: string
  abortedLastRun?: boolean
}

export type GatewayChatMessage = {
  id: string
  role: string
  text: string
  timestampMs?: number
  toolCallId?: string
  toolName?: string
  stopReason?: string
  pending?: boolean
  error?: boolean
}

export type GatewayChatAttachmentPayload = {
  type: 'image' | 'file'
  mimeType: string
  fileName: string
  content: string
}

export type OpenClawBootstrapResponse = {
  activeSessionKey: string
  mainSessionKey: string
  gatewayUrl: string
  tokenSource: GatewayTokenSource
  connectedAt: string
  agents: GatewayAgentSummary[]
  sessions: GatewaySessionSummary[]
  messages: GatewayChatMessage[]
  statusPayload: Record<string, unknown>
  healthPayload: Record<string, unknown>
}

export type OpenClawStreamEvent =
  | {
      type: 'ack'
      runId: string
      sessionKey: string
    }
  | {
      type: 'delta'
      text: string
    }
  | {
      type: 'final'
      state: 'final' | 'aborted' | 'error'
      messages: GatewayChatMessage[]
      sessions: GatewaySessionSummary[]
      errorMessage?: string
    }
  | {
      type: 'error'
      message: string
      code?: string
    }

export type IntegrationDefaults = {
  openclawUrl: string
  openclawTokenConfigured: boolean
  vaultUrl: string
  vaultNamespace: string
  vaultTokenConfigured: boolean
  vaultSecretPath: string
  vaultSecretKey: string
  apisixUrl: string
  apisixTokenConfigured: boolean
}

export function normalizeMainSessionKey(value?: string | null): string {
  const trimmed = value?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : 'main'
}

export function makeAgentSessionKey(agentId: string, baseKey: string): string {
  const normalizedBase = normalizeMainSessionKey(baseKey)
  const trimmedAgent = agentId.trim()
  return trimmedAgent.length > 0 ? `agent:${trimmedAgent}:${normalizedBase}` : normalizedBase
}

export function matchesSessionKey(incoming: string, current: string): boolean {
  const left = incoming.trim().toLowerCase()
  const right = current.trim().toLowerCase()

  if (left === right) {
    return true
  }

  return (
    (left === 'agent:main:main' && right === 'main') ||
    (left === 'main' && right === 'agent:main:main')
  )
}

export function extractMessageText(message: Record<string, unknown>): string {
  const directContent = message.content
  if (typeof directContent === 'string') {
    return directContent
  }

  if (!Array.isArray(directContent)) {
    return ''
  }

  const parts: string[] = []

  for (const part of directContent) {
    if (!part || typeof part !== 'object') {
      continue
    }

    const entry = part as Record<string, unknown>
    const inlineText =
      typeof entry.text === 'string'
        ? entry.text
        : typeof entry.thinking === 'string'
          ? entry.thinking
          : ''

    if (inlineText.trim().length > 0) {
      parts.push(inlineText.trim())
      continue
    }

    if (typeof entry.content === 'string' && entry.content.trim().length > 0) {
      parts.push(entry.content.trim())
    }
  }

  return parts.join('\n').trim()
}
