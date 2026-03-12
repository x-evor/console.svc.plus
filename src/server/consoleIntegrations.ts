import 'server-only'

import type { IntegrationDefaults } from '@/lib/openclaw/types'

const OPENCLAW_URL_KEYS = [
  'OPENCLAW_GATEWAY_REMOTE_URL',
  'OPENCLAW_GATEWAY_URL',
  'OPENCLAW_GATEWAY_WS_URL',
  'OPENCLAW_GATEWAY_ADDR',
] as const

const OPENCLAW_TOKEN_KEYS = ['OPENCLAW_GATEWAY_TOKEN'] as const

const APISIX_URL_KEYS = [
  'APISIX_AI_GATEWAY_URL',
  'AI_GATEWAY_URL',
  'AI_GATEWAY_BASE_URL',
  'API_GATEWAY_URL',
] as const

const APISIX_TOKEN_KEYS = ['AI_GATEWAY_ACCESS_TOKEN'] as const

const VAULT_URL_KEYS = ['VAULT_SERVER_URL', 'VAULT_ADDR', 'vault_addr'] as const
const VAULT_NAMESPACE_KEYS = ['VAULT_NAMESPACE'] as const
const VAULT_TOKEN_KEYS = ['VAULT_TOKEN', 'VAULT_SERVER_ROOT_ACCESS_TOKEN'] as const

function readEnvValue(...keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]
    if (typeof value !== 'string') {
      continue
    }

    const trimmed = value.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
  }

  return undefined
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function normalizeHttpUrl(value?: string): string {
  const raw = value?.trim() ?? ''
  if (raw.length === 0) {
    return ''
  }

  const prefixed = raw.includes('://') ? raw : `https://${raw}`

  try {
    return trimTrailingSlash(new URL(prefixed).toString())
  } catch {
    return trimTrailingSlash(prefixed)
  }
}

function normalizeWsUrl(value?: string): string {
  const raw = value?.trim() ?? ''
  if (raw.length === 0) {
    return ''
  }

  const prefixed = raw.includes('://') ? raw : `wss://${raw}`

  try {
    const url = new URL(prefixed)
    if (url.protocol === 'http:') {
      url.protocol = 'ws:'
    } else if (url.protocol === 'https:') {
      url.protocol = 'wss:'
    }
    return trimTrailingSlash(url.toString())
  } catch {
    return trimTrailingSlash(prefixed)
  }
}

export function getConsoleIntegrationDefaults(): IntegrationDefaults {
  return {
    openclawUrl: normalizeWsUrl(readEnvValue(...OPENCLAW_URL_KEYS)),
    openclawTokenConfigured: Boolean(readEnvValue(...OPENCLAW_TOKEN_KEYS)),
    vaultUrl: normalizeHttpUrl(readEnvValue(...VAULT_URL_KEYS)),
    vaultNamespace: readEnvValue(...VAULT_NAMESPACE_KEYS) ?? '',
    vaultTokenConfigured: Boolean(readEnvValue(...VAULT_TOKEN_KEYS)),
    apisixUrl: normalizeHttpUrl(readEnvValue(...APISIX_URL_KEYS)),
    apisixTokenConfigured: Boolean(readEnvValue(...APISIX_TOKEN_KEYS)),
  }
}

export function resolveOpenClawGatewayConfig(overrides?: {
  gatewayUrl?: string
  gatewayToken?: string
}): { gatewayUrl: string; gatewayToken: string; tokenSource: 'env' | 'request' | 'none' } {
  const requestUrl = normalizeWsUrl(overrides?.gatewayUrl)
  const envUrl = normalizeWsUrl(readEnvValue(...OPENCLAW_URL_KEYS))
  const requestToken = overrides?.gatewayToken?.trim() ?? ''
  const envToken = readEnvValue(...OPENCLAW_TOKEN_KEYS) ?? ''

  return {
    gatewayUrl: requestUrl || envUrl,
    gatewayToken: requestToken || envToken,
    tokenSource: requestToken ? 'request' : envToken ? 'env' : 'none',
  }
}

export function resolveApisixProbeConfig(overrides?: {
  apisixUrl?: string
  apisixToken?: string
}): { apisixUrl: string; apisixToken: string; tokenSource: 'env' | 'request' | 'none' } {
  const requestUrl = normalizeHttpUrl(overrides?.apisixUrl)
  const envUrl = normalizeHttpUrl(readEnvValue(...APISIX_URL_KEYS))
  const requestToken = overrides?.apisixToken?.trim() ?? ''
  const envToken = readEnvValue(...APISIX_TOKEN_KEYS) ?? ''

  return {
    apisixUrl: requestUrl || envUrl,
    apisixToken: requestToken || envToken,
    tokenSource: requestToken ? 'request' : envToken ? 'env' : 'none',
  }
}

export function resolveVaultProbeConfig(overrides?: {
  vaultUrl?: string
  vaultToken?: string
}): { vaultUrl: string; vaultToken: string; tokenSource: 'env' | 'request' | 'none' } {
  const requestUrl = normalizeHttpUrl(overrides?.vaultUrl)
  const envUrl = normalizeHttpUrl(readEnvValue(...VAULT_URL_KEYS))
  const requestToken = overrides?.vaultToken?.trim() ?? ''
  const envToken = readEnvValue(...VAULT_TOKEN_KEYS) ?? ''

  return {
    vaultUrl: requestUrl || envUrl,
    vaultToken: requestToken || envToken,
    tokenSource: requestToken ? 'request' : envToken ? 'env' : 'none',
  }
}
