'use client'

import type { VlessNode } from './vless'

const PRIMARY_ENDPOINT = '/api/agent-server/v1/nodes'
const FALLBACK_ENDPOINT = '/api/agent/nodes'

type AgentNodePayload = {
  nodes?: unknown
  message?: unknown
  error?: unknown
}

type AgentNodesError = Error & {
  status?: number
}

function extractMessage(payload: AgentNodePayload | null, status: number): string {
  if (payload && typeof payload.message === 'string' && payload.message.trim().length > 0) {
    return payload.message
  }
  if (payload && typeof payload.error === 'string' && payload.error.trim().length > 0) {
    return payload.error
  }
  return `Request failed (${status})`
}

async function requestAgentNodes(url: string): Promise<VlessNode[]> {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  })

  const payload = (await response.json().catch(() => null)) as AgentNodePayload | VlessNode[] | null

  if (!response.ok) {
    const error = new Error(extractMessage(Array.isArray(payload) ? null : payload, response.status)) as AgentNodesError
    error.status = response.status
    throw error
  }

  if (Array.isArray(payload)) {
    return payload as VlessNode[]
  }
  if (payload && Array.isArray((payload as AgentNodePayload).nodes)) {
    return (payload as { nodes: VlessNode[] }).nodes
  }

  throw new Error('unexpected_agent_nodes_payload')
}

function shouldFallback(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return true
  }
  if ((error as AgentNodesError).status && [404, 405, 502].includes((error as AgentNodesError).status as number)) {
    return true
  }
  return [
    'unexpected_agent_nodes_payload',
    'upstream_unreachable',
  ].includes(error.message)
}

export async function fetchAgentNodes(): Promise<VlessNode[]> {
  try {
    return await requestAgentNodes(PRIMARY_ENDPOINT)
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }
  }

  return requestAgentNodes(FALLBACK_ENDPOINT)
}
