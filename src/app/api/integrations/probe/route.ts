import type { NextRequest } from 'next/server'

import {
  resolveApisixProbeConfig,
  resolveOpenClawGatewayConfig,
  resolveVaultProbeConfig,
} from '@/server/consoleIntegrations'
import { OpenClawGatewayClient, OpenClawGatewayError } from '@/server/openclaw/gateway-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ProbeBody = {
  target?: 'openclaw' | 'vault' | 'apisix'
  gatewayUrl?: string
  gatewayToken?: string
  vaultUrl?: string
  vaultNamespace?: string
  vaultToken?: string
  vaultSecretPath?: string
  vaultSecretKey?: string
  apisixUrl?: string
  apisixToken?: string
}

function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status })
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function gatewayErrorCode(error: OpenClawGatewayError | null): string | undefined {
  return error?.code ?? stringValue(asRecord(error?.details).code)
}

function formatGatewayError(error: OpenClawGatewayError | null, client: OpenClawGatewayClient): string {
  if (!error) {
    return 'Failed to probe OpenClaw gateway.'
  }

  const details = asRecord(error.details)
  const detailCode = gatewayErrorCode(error)
  if (detailCode === 'PAIRING_REQUIRED') {
    const requestId = stringValue(details.requestId)
    const reason = stringValue(details.reason)
    return [
      '需要先在 OpenClaw 网关审批该设备配对请求。',
      requestId ? `requestId: ${requestId}` : '',
      client.deviceId ? `deviceId: ${client.deviceId}` : '',
      reason ? `reason: ${reason}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return error.message
}

async function probeOpenClaw(body: ProbeBody): Promise<Response> {
  const config = await resolveOpenClawGatewayConfig({
    gatewayUrl: body.gatewayUrl,
    gatewayToken: body.gatewayToken,
    vaultUrl: body.vaultUrl,
    vaultToken: body.vaultToken,
    vaultNamespace: body.vaultNamespace,
    vaultSecretPath: body.vaultSecretPath,
    vaultSecretKey: body.vaultSecretKey,
  })

  if (!config.gatewayUrl) {
    return jsonError('OpenClaw gateway URL is not configured.', 400)
  }

  const client = new OpenClawGatewayClient()

  try {
    await client.connect({
      gatewayUrl: config.gatewayUrl,
      gatewayToken: config.gatewayToken,
      clientLabel: 'console.svc.plus Probe',
    })

    const [statusPayload, healthPayload] = await Promise.all([client.status(), client.health()])

    return Response.json({
      ok: true,
      target: 'openclaw',
      tokenSource: config.tokenSource,
      gatewayUrl: config.gatewayUrl,
      statusPayload,
      healthPayload,
    })
  } catch (error) {
    const gatewayError = error instanceof OpenClawGatewayError ? error : null
    return Response.json(
      {
        ok: false,
        target: 'openclaw',
        gatewayUrl: config.gatewayUrl,
        tokenSource: config.tokenSource,
        error: formatGatewayError(gatewayError, client),
        code: gatewayErrorCode(gatewayError),
        details: gatewayError?.details ?? null,
        deviceId: client.deviceId || undefined,
      },
      { status: 502 },
    )
  } finally {
    await client.close()
  }
}

async function probeVault(body: ProbeBody): Promise<Response> {
  const config = resolveVaultProbeConfig({
    vaultUrl: body.vaultUrl,
    vaultToken: body.vaultToken,
  })

  if (!config.vaultUrl) {
    return jsonError('Vault URL is not configured.', 400)
  }

  try {
    const response = await fetch(`${config.vaultUrl}/v1/sys/health`, {
      method: 'GET',
      headers: config.vaultToken
        ? {
            'X-Vault-Token': config.vaultToken,
          }
        : undefined,
      cache: 'no-store',
    })

    const text = await response.text()

    return Response.json({
      ok: response.ok,
      target: 'vault',
      vaultUrl: config.vaultUrl,
      tokenSource: config.tokenSource,
      status: response.status,
      body: text.slice(0, 2000),
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        target: 'vault',
        vaultUrl: config.vaultUrl,
        tokenSource: config.tokenSource,
        error: error instanceof Error ? error.message : 'Failed to probe Vault.',
      },
      { status: 502 },
    )
  }
}

async function probeApisix(body: ProbeBody): Promise<Response> {
  const config = await resolveApisixProbeConfig({
    apisixUrl: body.apisixUrl,
    apisixToken: body.apisixToken,
    vaultUrl: body.vaultUrl,
    vaultToken: body.vaultToken,
    vaultNamespace: body.vaultNamespace,
    vaultSecretPath: body.vaultSecretPath,
  })

  if (!config.apisixUrl) {
    return jsonError('APISIX AI gateway URL is not configured.', 400)
  }

  try {
    const response = await fetch(`${config.apisixUrl}/v1/models`, {
      method: 'GET',
      headers: config.apisixToken
        ? {
            Authorization: `Bearer ${config.apisixToken}`,
          }
        : undefined,
      cache: 'no-store',
    })

    const text = await response.text()

    return Response.json({
      ok: response.ok,
      target: 'apisix',
      apisixUrl: config.apisixUrl,
      tokenSource: config.tokenSource,
      status: response.status,
      body: text.slice(0, 2000),
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        target: 'apisix',
        apisixUrl: config.apisixUrl,
        tokenSource: config.tokenSource,
        error: error instanceof Error ? error.message : 'Failed to probe APISIX AI gateway.',
      },
      { status: 502 },
    )
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: ProbeBody

  try {
    body = (await request.json()) as ProbeBody
  } catch {
    return jsonError('Invalid JSON body.', 400)
  }

  switch (body.target) {
    case 'openclaw':
      return probeOpenClaw(body)
    case 'vault':
      return probeVault(body)
    case 'apisix':
      return probeApisix(body)
    default:
      return jsonError('Unsupported probe target.', 400)
  }
}
