'use client'

import { type ChangeEvent, type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import html2canvas from 'html2canvas'
import { marked } from 'marked'
import {
  Bot,
  BrainCircuit,
  Camera,
  ChevronRight,
  Link2,
  Loader2,
  Paperclip,
  RefreshCw,
  SendHorizonal,
  Settings2,
  Sparkles,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'
import {
  makeAgentSessionKey,
  type GatewayAgentSummary,
  type GatewayChatAttachmentPayload,
  type GatewayChatMessage,
  type GatewaySessionSummary,
  type IntegrationDefaults,
  type OpenClawBootstrapResponse,
  type OpenClawStreamEvent,
} from '@/lib/openclaw/types'
import { useOpenClawConsoleStore } from '@/state/openclawConsoleStore'

type OpenClawAssistantPaneProps = {
  defaults: IntegrationDefaults
  initialQuestion?: string
  initialQuestionKey?: number
  variant?: 'page' | 'sidebar'
}

type ComposerAttachment = GatewayChatAttachmentPayload & {
  id: string
  size: number
  previewUrl?: string
}

type ConnectionState = 'idle' | 'connecting' | 'ready' | 'error'

const QUICK_ACTIONS = ['写代码', '分析日志', '梳理方案', '排查部署', '生成步骤']
const THINKING_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'max', label: 'Max' },
] as const
const MODE_OPTIONS = [
  { value: 'ask', label: 'Ask' },
  { value: 'craft', label: 'Craft' },
  { value: 'plan', label: 'Plan' },
] as const

function renderMarkdown(value: string): string {
  return DOMPurify.sanitize(marked.parse(value) as string)
}

function randomId(): string {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (const value of bytes) {
    binary += String.fromCharCode(value)
  }
  return window.btoa(binary)
}

function formatTimestamp(value?: number): string {
  if (!value) {
    return ''
  }

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(value))
  } catch {
    return ''
  }
}

function composePrompt(params: {
  mode: 'ask' | 'craft' | 'plan'
  prompt: string
  attachments: ComposerAttachment[]
}): string {
  const attachmentBlock = params.attachments.length
    ? `Attached files:\n${params.attachments.map((item) => `- ${item.fileName}`).join('\n')}\n\n`
    : ''

  switch (params.mode) {
    case 'craft':
      return `${attachmentBlock}Craft a polished result for this request:\n${params.prompt}`
    case 'plan':
      return `${attachmentBlock}Create a clear execution plan for this task:\n${params.prompt}`
    default:
      return `${attachmentBlock}${params.prompt}`
  }
}

function pickAutoAgent(agents: GatewayAgentSummary[], prompt: string): GatewayAgentSummary | undefined {
  const input = prompt.toLowerCase()

  const findByName = (name: string) =>
    agents.find((agent) => agent.name.toLowerCase().includes(name) || agent.id.toLowerCase().includes(name))

  if (
    input.includes('browser') ||
    input.includes('website') ||
    input.includes('网页') ||
    input.includes('抓取')
  ) {
    return findByName('browser')
  }

  if (
    input.includes('research') ||
    input.includes('analysis') ||
    input.includes('compare') ||
    input.includes('分析') ||
    input.includes('调研')
  ) {
    return findByName('research')
  }

  if (
    input.includes('code') ||
    input.includes('deploy') ||
    input.includes('log') ||
    input.includes('bug') ||
    input.includes('代码') ||
    input.includes('部署') ||
    input.includes('日志')
  ) {
    return findByName('coding')
  }

  return findByName('coding') ?? findByName('research') ?? findByName('browser')
}

async function fileToAttachment(file: File): Promise<ComposerAttachment> {
  const arrayBuffer = await file.arrayBuffer()
  const content = arrayBufferToBase64(arrayBuffer)

  return {
    id: randomId(),
    type: file.type.startsWith('image/') ? 'image' : 'file',
    mimeType: file.type || 'application/octet-stream',
    fileName: file.name,
    content,
    size: file.size,
    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
  }
}

export function OpenClawAssistantPane({
  defaults,
  initialQuestion,
  initialQuestionKey,
  variant = 'page',
}: OpenClawAssistantPaneProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const bootstrappedRef = useRef(false)
  const lastInitialQuestionKeyRef = useRef<number | null>(null)

  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [gatewayStatus, setGatewayStatus] = useState<Record<string, unknown>>({})
  const [gatewayHealth, setGatewayHealth] = useState<Record<string, unknown>>({})
  const [gatewayTokenSource, setGatewayTokenSource] = useState<'env' | 'request' | 'none'>('none')
  const [mainSessionKey, setMainSessionKey] = useState('main')
  const [messages, setMessages] = useState<GatewayChatMessage[]>([])
  const [sessions, setSessions] = useState<GatewaySessionSummary[]>([])
  const [agents, setAgents] = useState<GatewayAgentSummary[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [composerValue, setComposerValue] = useState(initialQuestion ?? '')
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)

  const defaultsLoaded = useOpenClawConsoleStore((state) => state.defaultsLoaded)
  const applyDefaults = useOpenClawConsoleStore((state) => state.applyDefaults)
  const openclawUrl = useOpenClawConsoleStore((state) => state.openclawUrl)
  const openclawToken = useOpenClawConsoleStore((state) => state.openclawToken)
  const assistantMode = useOpenClawConsoleStore((state) => state.assistantMode)
  const thinking = useOpenClawConsoleStore((state) => state.thinking)
  const selectedAgentId = useOpenClawConsoleStore((state) => state.selectedAgentId)
  const selectedSessionKey = useOpenClawConsoleStore((state) => state.selectedSessionKey)
  const setAssistantMode = useOpenClawConsoleStore((state) => state.setAssistantMode)
  const setThinking = useOpenClawConsoleStore((state) => state.setThinking)
  const setSelectedAgentId = useOpenClawConsoleStore((state) => state.setSelectedAgentId)
  const setSelectedSessionKey = useOpenClawConsoleStore((state) => state.setSelectedSessionKey)

  const compact = variant === 'sidebar'

  useEffect(() => {
    applyDefaults(defaults)
  }, [applyDefaults, defaults])

  const activeSession = useMemo(
    () => sessions.find((session) => session.key === selectedSessionKey),
    [selectedSessionKey, sessions],
  )

  const healthBadge = useMemo(() => {
    const serverHealth = gatewayHealth.status
    const connectionSummary = gatewayStatus.connection

    if (typeof serverHealth === 'string' && serverHealth.trim().length > 0) {
      return serverHealth
    }

    if (typeof connectionSummary === 'string' && connectionSummary.trim().length > 0) {
      return connectionSummary
    }

    switch (connectionState) {
      case 'ready':
        return 'online'
      case 'connecting':
        return 'connecting'
      case 'error':
        return 'error'
      default:
        return 'offline'
    }
  }, [connectionState, gatewayHealth.status, gatewayStatus.connection])

  const renderedMessages = useMemo(
    () =>
      messages.map((message) => ({
        ...message,
        html: renderMarkdown(message.text || ''),
      })),
    [messages],
  )

  const connectGateway = useCallback(async (nextSessionKey?: string, nextAgentId?: string): Promise<void> => {
    if (!openclawUrl.trim()) {
      setConnectionState('error')
      setErrorMessage('未配置 OpenClaw gateway 地址，请先到接口集成页面填写。')
      return
    }

    setConnectionState('connecting')
    setErrorMessage('')

    try {
      const response = await fetch('/api/openclaw/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bootstrap',
          gatewayUrl: openclawUrl,
          gatewayToken: openclawToken,
          agentId: nextAgentId ?? selectedAgentId,
          sessionKey: nextSessionKey ?? selectedSessionKey,
        }),
      })

      const payload = (await response.json()) as OpenClawBootstrapResponse | { error?: string }

      if (!response.ok || 'error' in payload) {
        throw new Error((payload as { error?: string }).error || 'Failed to bootstrap assistant.')
      }

      const data = payload as OpenClawBootstrapResponse

      setConnectionState('ready')
      setAgents(data.agents)
      setSessions(data.sessions)
      setMessages(data.messages)
      setGatewayStatus(data.statusPayload)
      setGatewayHealth(data.healthPayload)
      setGatewayTokenSource(data.tokenSource)
      setMainSessionKey(data.mainSessionKey)
      setSelectedSessionKey(data.activeSessionKey)
      setStreamingText('')
    } catch (error) {
      setConnectionState('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect to OpenClaw gateway.')
    }
  }, [openclawToken, openclawUrl, selectedAgentId, selectedSessionKey, setSelectedSessionKey])

  async function addFiles(files: FileList | File[]): Promise<void> {
    const nextAttachments = await Promise.all(Array.from(files).map((file) => fileToAttachment(file)))
    setAttachments((current) => [...current, ...nextAttachments])
  }

  async function capturePage(): Promise<void> {
    setIsCapturing(true)
    setErrorMessage('')

    try {
      const canvas = await html2canvas(document.body, {
        backgroundColor: null,
        scale: Math.min(window.devicePixelRatio || 1, 2),
        logging: false,
        useCORS: true,
      })

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 0.95)
      })

      if (!blob) {
        throw new Error('截图生成失败。')
      }

      const attachment = await fileToAttachment(
        new File([blob], `console-capture-${Date.now()}.png`, { type: 'image/png' }),
      )

      setAttachments((current) => [...current, attachment])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to capture screenshot.')
    } finally {
      setIsCapturing(false)
    }
  }

  const sendMessage = useCallback(async (promptOverride?: string): Promise<void> => {
    const rawPrompt = (promptOverride ?? composerValue).trim()
    if (!rawPrompt && attachments.length === 0) {
      return
    }

    const autoAgent = pickAutoAgent(agents, rawPrompt)
    const effectiveAgentId = selectedAgentId || autoAgent?.id || ''
    const effectiveSessionKey =
      selectedSessionKey ||
      makeAgentSessionKey(effectiveAgentId, mainSessionKey)

    const prompt = composePrompt({
      mode: assistantMode,
      prompt: rawPrompt || 'See attached.',
      attachments,
    })

    setErrorMessage('')
    setIsSending(true)
    setStreamingText('')
    setMessages((current) => [
      ...current,
      {
        id: randomId(),
        role: 'user',
        text: rawPrompt || 'See attached.',
        timestampMs: Date.now(),
      },
    ])
    setComposerValue('')

    if (effectiveAgentId && effectiveAgentId !== selectedAgentId) {
      setSelectedAgentId(effectiveAgentId)
    }

    if (effectiveSessionKey !== selectedSessionKey) {
      setSelectedSessionKey(effectiveSessionKey)
    }

    try {
      const response = await fetch('/api/openclaw/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          gatewayUrl: openclawUrl,
          gatewayToken: openclawToken,
          agentId: effectiveAgentId,
          sessionKey: effectiveSessionKey,
          message: prompt,
          thinking,
          attachments,
        }),
      })

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => ({ error: 'Failed to send message.' }))
        throw new Error(payload.error || 'Failed to send message.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) {
            continue
          }

          const event = JSON.parse(trimmed) as OpenClawStreamEvent

          if (event.type === 'delta') {
            setStreamingText(event.text)
            continue
          }

          if (event.type === 'final') {
            setMessages(event.messages)
            setSessions(event.sessions)
            setStreamingText('')
            setSelectedSessionKey(effectiveSessionKey)
            if (event.errorMessage) {
              setErrorMessage(event.errorMessage)
            }
            continue
          }

          if (event.type === 'error') {
            setErrorMessage(event.message)
          }
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message.')
      setStreamingText('')
    } finally {
      setAttachments([])
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }, [
    agents,
    assistantMode,
    attachments,
    composerValue,
    mainSessionKey,
    openclawToken,
    openclawUrl,
    selectedAgentId,
    selectedSessionKey,
    setSelectedAgentId,
    setSelectedSessionKey,
    thinking,
  ])

  useEffect(() => {
    if (!defaultsLoaded || bootstrappedRef.current) {
      return
    }

    if (!openclawUrl.trim()) {
      return
    }

    bootstrappedRef.current = true
    void connectGateway()
  }, [connectGateway, defaultsLoaded, openclawUrl])

  useEffect(() => {
    if (!initialQuestion || connectionState !== 'ready') {
      return
    }

    const resolvedKey = initialQuestionKey ?? 1
    if (lastInitialQuestionKeyRef.current === resolvedKey) {
      return
    }

    lastInitialQuestionKeyRef.current = resolvedKey
    setComposerValue(initialQuestion)
    void sendMessage(initialQuestion)
  }, [connectionState, initialQuestion, initialQuestionKey, sendMessage])

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  async function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    if (!event.target.files?.length) {
      return
    }
    await addFiles(event.target.files)
    event.target.value = ''
  }

  const containerClassName = cn(
    'flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-md)]',
    compact ? 'rounded-none border-0 shadow-none' : '',
  )

  return (
    <div className={containerClassName}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.log,.txt,.md,.json,.yaml,.yml,.pdf"
        multiple
        className="hidden"
        onChange={(event) => {
          void handleAttachmentChange(event)
        }}
      />

      <div className="flex flex-wrap items-center gap-3 border-b border-[color:var(--color-surface-border)] px-4 py-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-text-subtle)]">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              connectionState === 'ready'
                ? 'bg-emerald-500'
                : connectionState === 'connecting'
                  ? 'bg-amber-400'
                  : connectionState === 'error'
                    ? 'bg-rose-500'
                    : 'bg-[var(--color-text-subtle)]/40',
            )}
          />
          {healthBadge}
          <span className="text-[var(--color-text-subtle)]/60">·</span>
          {gatewayTokenSource === 'env' ? 'env token' : gatewayTokenSource === 'request' ? 'session token' : 'no token'}
        </div>

        <div className="min-w-[180px] flex-1">
          <select
            value={selectedAgentId}
            onChange={(event) => {
              setSelectedAgentId(event.target.value)
              setSelectedSessionKey('')
              void connectGateway('', event.target.value)
            }}
            className="w-full rounded-full border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[color:var(--color-primary)]"
          >
            <option value="">Main agent</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.emoji ? `${agent.emoji} ` : ''}
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            void connectGateway()
          }}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] transition hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)]"
        >
          {connectionState === 'connecting' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Reconnect
        </button>

        <button
          type="button"
          onClick={() => router.push('/panel/api')}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-primary-border)] bg-[var(--color-primary-muted)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] transition hover:opacity-90"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Integrations
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-[color:var(--color-surface-border)] px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {sessions.slice(0, compact ? 4 : 8).map((session) => (
              <button
                key={session.key}
                type="button"
                onClick={() => {
                  setSelectedSessionKey(session.key)
                  void connectGateway(session.key)
                }}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition',
                  session.key === selectedSessionKey
                    ? 'border-[color:var(--color-primary)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                    : 'border-[color:var(--color-surface-border)] bg-[var(--color-surface)] text-[var(--color-text-subtle)] hover:border-[color:var(--color-primary-border)]',
                )}
              >
                <Bot className="h-3.5 w-3.5" />
                <span>{session.derivedTitle || session.displayName || session.key}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!openclawUrl.trim() ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 rounded-[var(--radius-2xl)] border border-dashed border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)]/40 px-6 text-center">
              <Sparkles className="h-8 w-8 text-[var(--color-primary)]" />
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-[var(--color-heading)]">配置 OpenClaw gateway</h3>
                <p className="text-sm text-[var(--color-text-subtle)]">
                  当前没有可用的 OpenClaw 地址。先到集成页填写 gateway / vault / APISIX，再回来启动助手。
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/panel/api')}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
              >
                打开接口集成
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : renderedMessages.length === 0 && !streamingText ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 rounded-[var(--radius-2xl)] border border-dashed border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)]/40 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-[var(--color-heading)]">OpenClaw Assistant</h3>
                <p className="text-sm text-[var(--color-text-subtle)]">
                  侧栏模式与主页布局保持不变，消息将直接送到 OpenClaw gateway。你可以上传文件、贴图，或直接截当前页给助手分析。
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => {
                      setComposerValue(action)
                      textareaRef.current?.focus()
                    }}
                    className="rounded-full border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-subtle)] transition hover:border-[color:var(--color-primary-border)] hover:text-[var(--color-primary)]"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {renderedMessages.map((message) => {
                const isUser = message.role === 'user'
                return (
                  <div
                    key={message.id}
                    className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[88%] rounded-[var(--radius-xl)] px-4 py-3 shadow-[var(--shadow-sm)]',
                        isUser
                          ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                          : 'border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] text-[var(--color-text)]',
                      )}
                    >
                      <div
                        className={cn(
                          'prose prose-sm max-w-none break-words whitespace-pre-wrap',
                          isUser ? 'prose-invert' : '',
                        )}
                        dangerouslySetInnerHTML={{ __html: message.html }}
                      />
                      {message.timestampMs ? (
                        <p className={cn('mt-2 text-[11px]', isUser ? 'text-white/70' : 'text-[var(--color-text-subtle)]')}>
                          {formatTimestamp(message.timestampMs)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )
              })}

              {streamingText ? (
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-[var(--radius-xl)] border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] shadow-[var(--shadow-sm)]">
                    <div
                      className="prose prose-sm max-w-none break-words whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingText) }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="border-t border-[color:var(--color-surface-border)] px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAssistantMode(option.value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  assistantMode === option.value
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'border border-[color:var(--color-surface-border)] text-[var(--color-text-subtle)] hover:border-[color:var(--color-primary-border)]',
                )}
              >
                {option.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text-subtle)]">
              <BrainCircuit className="h-3.5 w-3.5" />
              <select
                value={thinking}
                onChange={(event) => setThinking(event.target.value as typeof thinking)}
                className="bg-transparent text-xs outline-none"
              >
                {THINKING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {attachments.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-xs text-[var(--color-text)]"
                >
                  {attachment.type === 'image' ? <Camera className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
                  <span>{attachment.fileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachments((current) => current.filter((item) => item.id !== attachment.id))
                    }}
                    className="text-[var(--color-text-subtle)] transition hover:text-[var(--color-text)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-3 rounded-[var(--radius-xl)] border border-[color:var(--color-danger-border)] bg-[var(--color-danger-muted)]/40 px-3 py-2 text-sm text-[var(--color-danger-foreground)]">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-3 rounded-[var(--radius-2xl)] border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)]">
            <textarea
              ref={textareaRef}
              rows={compact ? 4 : 5}
              value={composerValue}
              placeholder="向 OpenClaw 助手描述任务，或先截个图再发。"
              onChange={(event) => setComposerValue(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              onPaste={(event) => {
                const clipboardFiles = Array.from(event.clipboardData.files)
                if (clipboardFiles.length > 0) {
                  event.preventDefault()
                  void addFiles(clipboardFiles)
                }
              }}
              className="w-full resize-none bg-transparent text-sm leading-6 text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-subtle)]/70"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)]"
              >
                <Paperclip className="h-3.5 w-3.5" />
                附件
              </button>

              <button
                type="button"
                onClick={() => {
                  void capturePage()
                }}
                disabled={isCapturing}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCapturing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                当前页截图
              </button>

              <div className="ml-auto flex items-center gap-2 text-xs text-[var(--color-text-subtle)]">
                <Link2 className="h-3.5 w-3.5" />
                <span>{activeSession?.derivedTitle || activeSession?.displayName || selectedSessionKey || 'main'}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  void sendMessage()
                }}
                disabled={isSending || (!composerValue.trim() && attachments.length === 0)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
