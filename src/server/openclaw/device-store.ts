import 'server-only'

import { createHash, createPrivateKey, generateKeyPairSync, sign as signPayload } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

type StoredDeviceIdentity = {
  deviceId: string
  publicKeyBase64Url: string
  privateKeyBase64Url: string
  createdAtMs: number
}

const OPENCLAW_STATE_DIR = path.join(process.cwd(), '.console-state', 'openclaw')
const DEVICE_IDENTITY_FILE = path.join(OPENCLAW_STATE_DIR, 'gateway-device-identity.json')
let deviceIdentityPromise: Promise<StoredDeviceIdentity> | null = null
let memoryDeviceIdentity: StoredDeviceIdentity | null = null
const memoryDeviceTokens = new Map<string, string>()

function asStoredDeviceIdentity(value: unknown): StoredDeviceIdentity | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const entry = value as Record<string, unknown>
  const deviceId = typeof entry.deviceId === 'string' ? entry.deviceId.trim() : ''
  const publicKeyBase64Url =
    typeof entry.publicKeyBase64Url === 'string' ? entry.publicKeyBase64Url.trim() : ''
  const privateKeyBase64Url =
    typeof entry.privateKeyBase64Url === 'string' ? entry.privateKeyBase64Url.trim() : ''
  const createdAtMs =
    typeof entry.createdAtMs === 'number' && Number.isFinite(entry.createdAtMs)
      ? entry.createdAtMs
      : Date.now()

  if (!deviceId || !publicKeyBase64Url || !privateKeyBase64Url) {
    return null
  }

  return {
    deviceId,
    publicKeyBase64Url,
    privateKeyBase64Url,
    createdAtMs,
  }
}

function normalizeMetadataForAuth(value?: string): string {
  return value?.trim().toLowerCase() ?? ''
}

function deriveDeviceId(publicKeyBase64Url: string): string {
  const publicKeyBytes = Buffer.from(publicKeyBase64Url, 'base64url')
  return createHash('sha256').update(publicKeyBytes).digest('hex')
}

function deviceTokenFile(deviceId: string, role = 'operator'): string {
  const safeRole = role.trim() || 'operator'
  return path.join(OPENCLAW_STATE_DIR, `gateway-device-token.${deviceId}.${safeRole}.txt`)
}

async function ensureStateDirectory(): Promise<void> {
  await mkdir(OPENCLAW_STATE_DIR, { recursive: true })
}

async function writeIdentity(identity: StoredDeviceIdentity): Promise<void> {
  await ensureStateDirectory()
  await writeFile(DEVICE_IDENTITY_FILE, `${JSON.stringify(identity, null, 2)}\n`, 'utf8')
}

export async function loadOrCreateOpenClawDeviceIdentity(): Promise<StoredDeviceIdentity> {
  if (memoryDeviceIdentity) {
    return memoryDeviceIdentity
  }

  if (!deviceIdentityPromise) {
    deviceIdentityPromise = (async () => {
      try {
        const raw = await readFile(DEVICE_IDENTITY_FILE, 'utf8')
        const parsed = asStoredDeviceIdentity(JSON.parse(raw))
        if (parsed) {
          memoryDeviceIdentity = parsed
          return parsed
        }
      } catch {
        // Fall through to generating a new identity.
      }

      const { publicKey, privateKey } = generateKeyPairSync('ed25519')
      const publicJwk = publicKey.export({ format: 'jwk' }) as { x?: string }
      const privateJwk = privateKey.export({ format: 'jwk' }) as { d?: string }

      if (!publicJwk.x || !privateJwk.d) {
        throw new Error('Failed to generate OpenClaw device identity.')
      }

      const identity: StoredDeviceIdentity = {
        deviceId: deriveDeviceId(publicJwk.x),
        publicKeyBase64Url: publicJwk.x,
        privateKeyBase64Url: privateJwk.d,
        createdAtMs: Date.now(),
      }

      memoryDeviceIdentity = identity

      try {
        await writeIdentity(identity)
      } catch {
        // Serverless/preview runtimes may not allow persistent filesystem writes.
        // Keep an in-memory identity so pairing can still proceed for the current instance.
      }

      return identity
    })()
  }

  try {
    return await deviceIdentityPromise
  } catch (error) {
    deviceIdentityPromise = null
    throw error
  }
}

export async function loadOpenClawDeviceToken(params: {
  deviceId: string
  role?: string
}): Promise<string> {
  const memoryToken = memoryDeviceTokens.get(`${params.deviceId}:${params.role?.trim() || 'operator'}`)
  if (memoryToken) {
    return memoryToken
  }

  try {
    const value = await readFile(deviceTokenFile(params.deviceId, params.role), 'utf8')
    return value.trim()
  } catch {
    return ''
  }
}

export async function saveOpenClawDeviceToken(params: {
  deviceId: string
  role?: string
  token: string
}): Promise<void> {
  const key = `${params.deviceId}:${params.role?.trim() || 'operator'}`
  memoryDeviceTokens.set(key, params.token.trim())

  try {
    await ensureStateDirectory()
    await writeFile(deviceTokenFile(params.deviceId, params.role), `${params.token.trim()}\n`, 'utf8')
  } catch {
    // Keep the token in memory when the runtime does not permit filesystem writes.
  }
}

export async function clearOpenClawDeviceToken(params: {
  deviceId: string
  role?: string
}): Promise<void> {
  memoryDeviceTokens.delete(`${params.deviceId}:${params.role?.trim() || 'operator'}`)

  try {
    await rm(deviceTokenFile(params.deviceId, params.role), { force: true })
  } catch {
    // Ignore missing files.
  }
}

export function buildOpenClawDeviceAuthPayloadV3(params: {
  deviceId: string
  clientId: string
  clientMode: string
  role: string
  scopes: string[]
  signedAtMs: number
  token: string
  nonce: string
  platform: string
  deviceFamily: string
}): string {
  return [
    'v3',
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    params.scopes.join(','),
    String(params.signedAtMs),
    params.token,
    params.nonce,
    normalizeMetadataForAuth(params.platform),
    normalizeMetadataForAuth(params.deviceFamily),
  ].join('|')
}

export function signOpenClawDevicePayload(params: {
  identity: StoredDeviceIdentity
  payload: string
}): string {
  const privateKey = createPrivateKey({
    format: 'jwk',
    key: {
      kty: 'OKP',
      crv: 'Ed25519',
      x: params.identity.publicKeyBase64Url,
      d: params.identity.privateKeyBase64Url,
    },
  })

  return signPayload(null, Buffer.from(params.payload, 'utf8'), privateKey).toString('base64url')
}
