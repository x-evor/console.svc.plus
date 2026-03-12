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
  vaultToken?: string
  apisixUrl?: string
  apisixToken?: string
}

function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status })
}

async function probeOpenClaw(body: ProbeBody): Promise<Response> {
  const config = resolveOpenClawGatewayConfig({
    gatewayUrl: body.gatewayUrl,
    gatewayToken: body.gatewayToken,
  })

  if (!config.gatewayUrl) {
    return jsonError('OpenClaw gateway URL is not configured.', 400)
  }

  const client = new OpenClawGatewayClient()

  try {
    await client.connect({
      gatewayUrl: config.gatewayUrl,
      gatewayToken: config.gatewayToken,
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
        error: gatewayError?.message ?? 'Failed to probe OpenClaw gateway.',
        code: gatewayError?.code,
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
  const config = resolveApisixProbeConfig({
    apisixUrl: body.apisixUrl,
    apisixToken: body.apisixToken,
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
