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

const APISIX_TOKEN_KEYS = ['AI_GATEWAY_ACCESS_TOKEN', 'AI_GATEWAY_API_KEY'] as const

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
    openclawOrigin: '',
    openclawTokenConfigured: Boolean(readEnvValue(...OPENCLAW_TOKEN_KEYS)),
    vaultUrl: normalizeHttpUrl(readEnvValue(...VAULT_URL_KEYS)),
    vaultNamespace: readEnvValue(...VAULT_NAMESPACE_KEYS) ?? '',
    vaultTokenConfigured: Boolean(readEnvValue(...VAULT_TOKEN_KEYS)),
    vaultSecretPath: '',
    vaultSecretKey: '',
    apisixUrl: normalizeHttpUrl(readEnvValue(...APISIX_URL_KEYS)),
    apisixTokenConfigured: Boolean(readEnvValue(...APISIX_TOKEN_KEYS)),
  }
}

function normalizeSecretPath(value?: string): string {
  return value?.trim().replace(/^\/+|\/+$/g, '') ?? ''
}

function buildVaultReadUrl(baseUrl: string, secretPath: string): string {
  const normalizedBase = normalizeHttpUrl(baseUrl)
  const normalizedPath = normalizeSecretPath(secretPath)

  if (!normalizedBase || !normalizedPath) {
    return ''
  }

  if (normalizedPath.startsWith('v1/')) {
    return `${normalizedBase}/${normalizedPath}`
  }

  const segments = normalizedPath.split('/').filter(Boolean)
  if (segments.length === 1) {
    return `${normalizedBase}/v1/kv/data/${segments[0]}`
  }

  const [mount, ...rest] = segments
  if (rest[0] === 'data') {
    return `${normalizedBase}/v1/${segments.join('/')}`
  }

  return `${normalizedBase}/v1/${mount}/data/${rest.join('/')}`
}

async function readVaultSecret(params: {
  vaultUrl: string
  vaultToken: string
  vaultNamespace?: string
  secretPath: string
}): Promise<Record<string, unknown>> {
  const url = buildVaultReadUrl(params.vaultUrl, params.secretPath)
  if (!url || !params.vaultToken.trim()) {
    return {}
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Vault-Token': params.vaultToken.trim(),
      ...(params.vaultNamespace?.trim()
        ? {
            'X-Vault-Namespace': params.vaultNamespace.trim(),
          }
        : {}),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    return {}
  }

  const payload = (await response.json()) as Record<string, unknown>
  const data = payload.data as Record<string, unknown> | undefined
  const kvV2Data = data?.data

  if (kvV2Data && typeof kvV2Data === 'object' && !Array.isArray(kvV2Data)) {
    return kvV2Data as Record<string, unknown>
  }

  return data && typeof data === 'object' && !Array.isArray(data) ? data : {}
}

async function resolveVaultBackedToken(params: {
  requestToken?: string
  envToken?: string
  vaultUrl?: string
  vaultToken?: string
  vaultNamespace?: string
  vaultSecretPath?: string
  vaultSecretKey?: string
  fallbackKeys: string[]
}): Promise<{ token: string; tokenSource: 'env' | 'request' | 'vault' | 'none' }> {
  const requestToken = params.requestToken?.trim() ?? ''
  if (requestToken) {
    return { token: requestToken, tokenSource: 'request' }
  }

  const envToken = params.envToken?.trim() ?? ''
  if (envToken) {
    return { token: envToken, tokenSource: 'env' }
  }

  const secretPath = normalizeSecretPath(params.vaultSecretPath)
  if (!secretPath) {
    return { token: '', tokenSource: 'none' }
  }

  const secret = await readVaultSecret({
    vaultUrl: params.vaultUrl ?? '',
    vaultToken: params.vaultToken ?? '',
    vaultNamespace: params.vaultNamespace,
    secretPath,
  })

  const candidateKeys = [
    params.vaultSecretKey?.trim(),
    ...params.fallbackKeys,
    'token',
  ].filter((value): value is string => Boolean(value && value.trim().length > 0))

  for (const key of candidateKeys) {
    const value = secret[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return { token: value.trim(), tokenSource: 'vault' }
    }
  }

  return { token: '', tokenSource: 'none' }
}

export async function resolveOpenClawGatewayConfig(overrides?: {
  gatewayUrl?: string
  gatewayToken?: string
  vaultUrl?: string
  vaultToken?: string
  vaultNamespace?: string
  vaultSecretPath?: string
  vaultSecretKey?: string
}): Promise<{ gatewayUrl: string; gatewayToken: string; tokenSource: 'env' | 'request' | 'vault' | 'none' }> {
  const requestUrl = normalizeWsUrl(overrides?.gatewayUrl)
  const envUrl = normalizeWsUrl(readEnvValue(...OPENCLAW_URL_KEYS))
  const resolvedToken = await resolveVaultBackedToken({
    requestToken: overrides?.gatewayToken,
    envToken: readEnvValue(...OPENCLAW_TOKEN_KEYS) ?? '',
    vaultUrl: overrides?.vaultUrl ?? readEnvValue(...VAULT_URL_KEYS) ?? '',
    vaultToken: overrides?.vaultToken ?? readEnvValue(...VAULT_TOKEN_KEYS) ?? '',
    vaultNamespace: overrides?.vaultNamespace ?? readEnvValue(...VAULT_NAMESPACE_KEYS) ?? '',
    vaultSecretPath: overrides?.vaultSecretPath,
    vaultSecretKey: overrides?.vaultSecretKey,
    fallbackKeys: ['OPENCLAW_GATEWAY_TOKEN'],
  })

  return {
    gatewayUrl: requestUrl || envUrl,
    gatewayToken: resolvedToken.token,
    tokenSource: resolvedToken.tokenSource,
  }
}

export async function resolveApisixProbeConfig(overrides?: {
  apisixUrl?: string
  apisixToken?: string
  vaultUrl?: string
  vaultToken?: string
  vaultNamespace?: string
  vaultSecretPath?: string
}): Promise<{ apisixUrl: string; apisixToken: string; tokenSource: 'env' | 'request' | 'vault' | 'none' }> {
  const requestUrl = normalizeHttpUrl(overrides?.apisixUrl)
  const envUrl = normalizeHttpUrl(readEnvValue(...APISIX_URL_KEYS))
  const resolvedToken = await resolveVaultBackedToken({
    requestToken: overrides?.apisixToken,
    envToken: readEnvValue(...APISIX_TOKEN_KEYS) ?? '',
    vaultUrl: overrides?.vaultUrl ?? readEnvValue(...VAULT_URL_KEYS) ?? '',
    vaultToken: overrides?.vaultToken ?? readEnvValue(...VAULT_TOKEN_KEYS) ?? '',
    vaultNamespace: overrides?.vaultNamespace ?? readEnvValue(...VAULT_NAMESPACE_KEYS) ?? '',
    vaultSecretPath: overrides?.vaultSecretPath,
    fallbackKeys: ['AI_GATEWAY_ACCESS_TOKEN', 'AI_GATEWAY_API_KEY', 'APISIX_AI_GATEWAY_TOKEN'],
  })

  return {
    apisixUrl: requestUrl || envUrl,
    apisixToken: resolvedToken.token,
    tokenSource: resolvedToken.tokenSource,
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
