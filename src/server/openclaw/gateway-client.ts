import 'server-only'

import { randomUUID } from 'node:crypto'
import WebSocket from 'ws'

import {
  extractMessageText,
  normalizeMainSessionKey,
  type GatewayAgentSummary,
  type GatewayChatAttachmentPayload,
  type GatewayChatMessage,
  type GatewaySessionSummary,
} from '@/lib/openclaw/types'
import {
  buildOpenClawDeviceAuthPayloadV3,
  clearOpenClawDeviceToken,
  loadOpenClawDeviceToken,
  loadOrCreateOpenClawDeviceIdentity,
  saveOpenClawDeviceToken,
  signOpenClawDevicePayload,
} from '@/server/openclaw/device-store'

const OPENCLAW_PROTOCOL_VERSION = 3
const OPENCLAW_CLIENT_IDS = {
  assistant: 'webchat-ui',
} as const
const OPENCLAW_CLIENT_MODES = {
  assistant: 'ui',
} as const
const OPENCLAW_CLIENT_PLATFORM = 'web'
const OPENCLAW_CLIENT_DEVICE_FAMILY = 'console'
const OPENCLAW_CLIENT_MODEL = 'nextjs'
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

type GatewaySocket = WebSocket

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
  readonly details?: Record<string, unknown>

  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'OpenClawGatewayError'
    this.code = code
    this.details = details
  }
}

export class OpenClawGatewayClient {
  private socket: GatewaySocket | null = null
  private currentDeviceId = ''
  private connectChallengeNonce: string | null = null
  private pending = new Map<string, PendingRequest>()
  private listeners = new Set<(event: GatewayEventFrame) => void>()
  private handleMessageRef = (data: unknown) => {
    void this.handleMessage(data)
  }
  private handleCloseRef = () => {
    this.failPending(new OpenClawGatewayError('Gateway connection closed', 'SOCKET_CLOSED'))
  }
  private handleErrorRef = () => {
    this.failPending(new OpenClawGatewayError('Gateway transport error', 'SOCKET_ERROR'))
  }

  async connect(params: {
    gatewayUrl: string
    gatewayOrigin?: string
    gatewayToken: string
    clientId?: string
    clientMode?: string
    clientLabel?: string
  }): Promise<{ mainSessionKey: string; deviceId: string }> {
    return this.connectWithRetry(params, true)
  }

  private async connectWithRetry(
    params: {
      gatewayUrl: string
      gatewayOrigin?: string
      gatewayToken: string
      clientId?: string
      clientMode?: string
      clientLabel?: string
    },
    allowSharedTokenFallback: boolean,
  ): Promise<{ mainSessionKey: string; deviceId: string }> {
    const url = resolveGatewayUrl(params.gatewayUrl)
    const origin = params.gatewayOrigin?.trim()
    const socket = new WebSocket(url, {
      ...(origin
        ? {
            headers: {
              Origin: origin,
            },
          }
        : {}),
    })
    this.socket = socket
    this.connectChallengeNonce = null

    socket.on('message', this.handleMessageRef)
    socket.on('close', this.handleCloseRef)
    socket.on('error', this.handleErrorRef)

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new OpenClawGatewayError('Gateway open timeout', 'OPEN_TIMEOUT'))
      }, 8000)

      socket.once('open', () => {
        clearTimeout(timeout)
        resolve()
      })

      socket.once('error', () => {
        clearTimeout(timeout)
        reject(new OpenClawGatewayError('Gateway open failed', 'OPEN_FAILED'))
      })
    })

    const clientId = params.clientId ?? OPENCLAW_CLIENT_IDS.assistant
    const clientMode = params.clientMode ?? OPENCLAW_CLIENT_MODES.assistant
    const identity = await loadOrCreateOpenClawDeviceIdentity()
    this.currentDeviceId = identity.deviceId
    const storedDeviceToken = await loadOpenClawDeviceToken({
      deviceId: identity.deviceId,
      role: 'operator',
    })
    const sharedGatewayToken = params.gatewayToken.trim()
    const usingDeviceToken = Boolean(storedDeviceToken)
    const authToken = usingDeviceToken ? storedDeviceToken : sharedGatewayToken

    try {
      const nonce = await this.waitForConnectChallenge(socket)

      const signedAtMs = Date.now()
      const signaturePayload = buildOpenClawDeviceAuthPayloadV3({
        deviceId: identity.deviceId,
        clientId,
        clientMode,
        role: 'operator',
        scopes: [...DEFAULT_OPERATOR_SCOPES],
        signedAtMs,
        token: authToken,
        nonce,
        platform: OPENCLAW_CLIENT_PLATFORM,
        deviceFamily: OPENCLAW_CLIENT_DEVICE_FAMILY,
      })

      const payload = asRecord(
        await this.request('connect', {
          minProtocol: OPENCLAW_PROTOCOL_VERSION,
          maxProtocol: OPENCLAW_PROTOCOL_VERSION,
          client: {
            id: clientId,
            displayName: params.clientLabel ?? 'console.svc.plus Assistant',
            version: '1.0.0',
            platform: OPENCLAW_CLIENT_PLATFORM,
            deviceFamily: OPENCLAW_CLIENT_DEVICE_FAMILY,
            modelIdentifier: OPENCLAW_CLIENT_MODEL,
            mode: clientMode,
            instanceId: `${clientId}-${identity.deviceId.slice(0, 8)}`,
          },
          locale: 'zh-CN',
          userAgent: 'console.svc.plus/openclaw',
          role: 'operator',
          scopes: DEFAULT_OPERATOR_SCOPES,
          caps: ['tool-events'],
          commands: [],
          permissions: {},
          ...(authToken
            ? {
                auth: {
                  ...(usingDeviceToken ? { deviceToken: authToken } : { token: authToken }),
                },
              }
            : {}),
          device: {
            id: identity.deviceId,
            publicKey: identity.publicKeyBase64Url,
            signature: signOpenClawDevicePayload({
              identity,
              payload: signaturePayload,
            }),
            signedAt: signedAtMs,
            nonce,
          },
        }, 12000),
      )

      const snapshot = asRecord(payload.snapshot)
      const sessionDefaults = asRecord(snapshot.sessionDefaults)
      const auth = asRecord(payload.auth)
      const returnedDeviceToken = stringValue(auth.deviceToken)

      if (returnedDeviceToken) {
        await saveOpenClawDeviceToken({
          deviceId: identity.deviceId,
          role: stringValue(auth.role) ?? 'operator',
          token: returnedDeviceToken,
        })
      }

      return {
        mainSessionKey: normalizeMainSessionKey(stringValue(sessionDefaults.mainSessionKey)),
        deviceId: identity.deviceId,
      }
    } catch (error) {
      const gatewayError = error instanceof OpenClawGatewayError ? error : null
      const detailCode = stringValue(asRecord(gatewayError?.details).code)

      if (storedDeviceToken && detailCode === 'AUTH_DEVICE_TOKEN_MISMATCH') {
        await clearOpenClawDeviceToken({
          deviceId: identity.deviceId,
          role: 'operator',
        })
      }

      const shouldRetryWithSharedToken =
        allowSharedTokenFallback &&
        Boolean(sharedGatewayToken) &&
        Boolean(storedDeviceToken) &&
        detailCode === 'AUTH_DEVICE_TOKEN_MISMATCH'

      if (shouldRetryWithSharedToken) {
        await clearOpenClawDeviceToken({
          deviceId: identity.deviceId,
          role: 'operator',
        })
        await this.close()
        return this.connectWithRetry(params, false)
      }

      throw error
    }
  }

  get deviceId(): string {
    return this.currentDeviceId
  }

  private async waitForConnectChallenge(socket: GatewaySocket): Promise<string> {
    if (this.connectChallengeNonce) {
      return this.connectChallengeNonce
    }

    return await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup()
        reject(new OpenClawGatewayError('Gateway connect challenge timeout', 'CHALLENGE_TIMEOUT'))
      }, 4000)

      const stopListening = this.onEvent((event) => {
        if (event.event !== 'connect.challenge') {
          return
        }

        const payload = asRecord(event.payload)
        const nonce = stringValue(payload.nonce)
        if (!nonce) {
          cleanup()
          reject(
            new OpenClawGatewayError('Gateway connect challenge missing nonce', 'CHALLENGE_NONCE'),
          )
          return
        }

        this.connectChallengeNonce = nonce
        cleanup()
        resolve(nonce)
      })

      const onClose = () => {
        cleanup()
        reject(new OpenClawGatewayError('Gateway closed before connect challenge', 'SOCKET_CLOSED'))
      }

      const onError = () => {
        cleanup()
        reject(new OpenClawGatewayError('Gateway error before connect challenge', 'SOCKET_ERROR'))
      }

      const cleanup = () => {
        clearTimeout(timeout)
        stopListening()
        socket.off('close', onClose)
        socket.off('error', onError)
      }

      socket.once('close', onClose)
      socket.once('error', onError)
    })
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

    socket.off('message', this.handleMessageRef)
    socket.off('close', this.handleCloseRef)
    socket.off('error', this.handleErrorRef)

    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close()
    }
  }

  private async handleMessage(data: unknown): Promise<void> {
    const text = toText(data)
    let payload: Record<string, unknown>

    try {
      payload = JSON.parse(text) as Record<string, unknown>
    } catch {
      return
    }

    const type = stringValue(payload.type)

    if (type === 'event') {
      const eventName = stringValue(payload.event) ?? ''
      if (eventName === 'connect.challenge') {
        const challengePayload = asRecord(payload.payload)
        const nonce = stringValue(challengePayload.nonce)
        if (nonce) {
          this.connectChallengeNonce = nonce
        }
      }

      const frame = {
        type: 'event' as const,
        event: eventName,
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
          asRecord(error.details),
        ),
      )
      return
    }

    pending.resolve(payload.payload)
  }

  private failPending(error: OpenClawGatewayError): void {
    this.connectChallengeNonce = null
    for (const [id, pending] of this.pending.entries()) {
      clearTimeout(pending.timeout)
      pending.reject(error)
      this.pending.delete(id)
    }
  }
}
