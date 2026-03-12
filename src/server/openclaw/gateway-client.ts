import 'server-only'

import { randomUUID } from 'node:crypto'

import {
  extractMessageText,
  normalizeMainSessionKey,
  type GatewayAgentSummary,
  type GatewayChatAttachmentPayload,
  type GatewayChatMessage,
  type GatewaySessionSummary,
} from '@/lib/openclaw/types'

const OPENCLAW_PROTOCOL_VERSION = 3
const DEFAULT_OPERATOR_SCOPES = [
  'operator.admin',
  'operator.read',
  'operator.write',
  'operator.approvals',
  'operator.pairing',
] as const

type PendingRequest = {
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
  timeout: NodeJS.Timeout
}

type GatewayEventFrame = {
  type: 'event'
  event: string
  seq?: number
  payload?: unknown
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function boolValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function toText(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  if (value instanceof ArrayBuffer) {
    return Buffer.from(value).toString('utf8')
  }

  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('utf8')
  }

  if (value instanceof Blob) {
    return ''
  }

  return String(value ?? '')
}

function randomId(): string {
  return `${Date.now().toString(16)}-${randomUUID().slice(0, 8)}`
}

function resolveGatewayUrl(urlRaw: string): string {
  const trimmed = urlRaw.trim()
  const url = new URL(trimmed.includes('://') ? trimmed : `wss://${trimmed}`)

  if (url.protocol === 'http:') {
    url.protocol = 'ws:'
  } else if (url.protocol === 'https:') {
    url.protocol = 'wss:'
  }

  if (!url.port) {
    url.port = url.protocol === 'wss:' ? '443' : '80'
  }

  return url.toString()
}

export class OpenClawGatewayError extends Error {
  readonly code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'OpenClawGatewayError'
    this.code = code
  }
}

export class OpenClawGatewayClient {
  private socket: WebSocket | null = null
  private pending = new Map<string, PendingRequest>()
  private listeners = new Set<(event: GatewayEventFrame) => void>()
  private handleMessageRef = (event: MessageEvent) => {
    void this.handleMessage(event)
  }
  private handleCloseRef = () => {
    this.failPending(new OpenClawGatewayError('Gateway connection closed', 'SOCKET_CLOSED'))
  }
  private handleErrorRef = () => {
    this.failPending(new OpenClawGatewayError('Gateway transport error', 'SOCKET_ERROR'))
  }

  async connect(params: {
    gatewayUrl: string
    gatewayToken: string
    clientId?: string
    clientLabel?: string
  }): Promise<{ mainSessionKey: string }> {
    const url = resolveGatewayUrl(params.gatewayUrl)
    const socket = new WebSocket(url)
    this.socket = socket

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new OpenClawGatewayError('Gateway open timeout', 'OPEN_TIMEOUT'))
      }, 8000)

      socket.addEventListener(
        'open',
        () => {
          clearTimeout(timeout)
          resolve()
        },
        { once: true },
      )

      socket.addEventListener(
        'error',
        () => {
          clearTimeout(timeout)
          reject(new OpenClawGatewayError('Gateway open failed', 'OPEN_FAILED'))
        },
        { once: true },
      )
    })

    socket.addEventListener('message', this.handleMessageRef)
    socket.addEventListener('close', this.handleCloseRef)
    socket.addEventListener('error', this.handleErrorRef)

    const payload = asRecord(
      await this.request('connect', {
        minProtocol: OPENCLAW_PROTOCOL_VERSION,
        maxProtocol: OPENCLAW_PROTOCOL_VERSION,
        client: {
          id: params.clientId ?? 'console-openclaw-proxy',
          displayName: params.clientLabel ?? 'console.svc.plus Assistant',
          version: '1.0.0',
          platform: 'node',
          mode: 'ui',
          instanceId: `console-${randomUUID().slice(0, 8)}`,
        },
        locale: 'zh-CN',
        userAgent: 'console.svc.plus/openclaw',
        role: 'operator',
        scopes: DEFAULT_OPERATOR_SCOPES,
        caps: ['tool-events'],
        ...(params.gatewayToken.trim()
          ? {
              auth: {
                token: params.gatewayToken.trim(),
              },
            }
          : {}),
      }, 12000),
    )

    const snapshot = asRecord(payload.snapshot)
    const sessionDefaults = asRecord(snapshot.sessionDefaults)

    return {
      mainSessionKey: normalizeMainSessionKey(stringValue(sessionDefaults.mainSessionKey)),
    }
  }

  onEvent(listener: (event: GatewayEventFrame) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  async request(method: string, params?: Record<string, unknown>, timeoutMs = 15000): Promise<unknown> {
    const socket = this.socket

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new OpenClawGatewayError('Gateway is offline', 'OFFLINE')
    }

    const id = randomId()
    const frame = {
      type: 'req',
      id,
      method,
      ...(params ? { params } : {}),
    }

    return new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        reject(new OpenClawGatewayError(`${method} timed out`, 'RPC_TIMEOUT'))
      }, timeoutMs)

      this.pending.set(id, { resolve, reject, timeout })
      socket.send(JSON.stringify(frame))
    })
  }

  async health(): Promise<Record<string, unknown>> {
    return asRecord(await this.request('health'))
  }

  async status(): Promise<Record<string, unknown>> {
    return asRecord(await this.request('status'))
  }

  async listAgents(): Promise<GatewayAgentSummary[]> {
    const payload = asRecord(await this.request('agents.list', {}, 15000))

    return asArray(payload.agents).map((item) => {
      const entry = asRecord(item)
      const identity = asRecord(entry.identity)

      return {
        id: stringValue(entry.id) ?? 'unknown',
        name: stringValue(entry.name) ?? stringValue(identity.name) ?? 'Agent',
        emoji: stringValue(identity.emoji),
        theme: stringValue(identity.theme),
      }
    })
  }

  async listSessions(agentId?: string, limit = 24): Promise<GatewaySessionSummary[]> {
    const payload = asRecord(
      await this.request(
        'sessions.list',
        {
          includeGlobal: true,
          includeUnknown: false,
          includeDerivedTitles: true,
          includeLastMessage: true,
          limit,
          ...(agentId?.trim() ? { agentId: agentId.trim() } : {}),
        },
        15000,
      ),
    )

    return asArray(payload.sessions).map((item) => {
      const entry = asRecord(item)
      return {
        key: stringValue(entry.key) ?? 'main',
        displayName: stringValue(entry.displayName) ?? stringValue(entry.label),
        updatedAtMs: numberValue(entry.updatedAt),
        derivedTitle: stringValue(entry.derivedTitle),
        lastMessagePreview: stringValue(entry.lastMessagePreview),
        model: stringValue(entry.model),
        thinkingLevel: stringValue(entry.thinkingLevel),
        abortedLastRun: boolValue(entry.abortedLastRun),
      }
    })
  }

  async loadHistory(sessionKey: string, limit = 120): Promise<GatewayChatMessage[]> {
    const payload = asRecord(
      await this.request(
        'chat.history',
        {
          sessionKey,
          limit,
        },
        15000,
      ),
    )

    return asArray(payload.messages).map((item) => {
      const entry = asRecord(item)
      return {
        id: stringValue(entry.id) ?? randomId(),
        role: stringValue(entry.role) ?? 'assistant',
        text: extractMessageText(entry),
        timestampMs: numberValue(entry.timestamp),
        toolCallId: stringValue(entry.toolCallId) ?? stringValue(entry.tool_call_id),
        toolName: stringValue(entry.toolName) ?? stringValue(entry.tool_name),
        stopReason: stringValue(entry.stopReason),
        pending: false,
        error: false,
      }
    })
  }

  async sendChat(params: {
    sessionKey: string
    message: string
    thinking: string
    attachments?: GatewayChatAttachmentPayload[]
  }): Promise<string> {
    const runId = randomId()

    const payload = asRecord(
      await this.request(
        'chat.send',
        {
          sessionKey: params.sessionKey,
          message: params.message,
          thinking: params.thinking,
          timeoutMs: 30000,
          idempotencyKey: runId,
          ...(params.attachments && params.attachments.length > 0
            ? {
                attachments: params.attachments,
              }
            : {}),
        },
        35000,
      ),
    )

    return stringValue(payload.runId) ?? runId
  }

  async close(): Promise<void> {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout)
    }
    this.pending.clear()

    const socket = this.socket
    this.socket = null

    if (!socket) {
      return
    }

    socket.removeEventListener('message', this.handleMessageRef)
    socket.removeEventListener('close', this.handleCloseRef)
    socket.removeEventListener('error', this.handleErrorRef)

    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close()
    }
  }

  private async handleMessage(event: MessageEvent): Promise<void> {
    const text = toText(event.data)
    let payload: Record<string, unknown>

    try {
      payload = JSON.parse(text) as Record<string, unknown>
    } catch {
      return
    }

    const type = stringValue(payload.type)

    if (type === 'event') {
      const frame = {
        type: 'event' as const,
        event: stringValue(payload.event) ?? '',
        seq: numberValue(payload.seq),
        payload: payload.payload,
      }

      for (const listener of this.listeners) {
        listener(frame)
      }
      return
    }

    if (type !== 'res') {
      return
    }

    const id = stringValue(payload.id)
    if (!id) {
      return
    }

    const pending = this.pending.get(id)
    if (!pending) {
      return
    }

    this.pending.delete(id)
    clearTimeout(pending.timeout)

    const ok = boolValue(payload.ok) ?? false

    if (!ok) {
      const error = asRecord(payload.error)
      pending.reject(
        new OpenClawGatewayError(
          stringValue(error.message) ?? 'Gateway request failed',
          stringValue(error.code),
        ),
      )
      return
    }

    pending.resolve(payload.payload)
  }

  private failPending(error: OpenClawGatewayError): void {
    for (const [id, pending] of this.pending.entries()) {
      clearTimeout(pending.timeout)
      pending.reject(error)
      this.pending.delete(id)
    }
  }
}
