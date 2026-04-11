// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { proxyRequestToUpstream } from './apiProxy'

describe('proxyRequestToUpstream', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('strips stale encoding headers when the upstream body is already decoded', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ name: 'JP', address: 'jp-xhttp.svc.plus' }]), {
        status: 200,
        headers: {
          'Content-Encoding': 'gzip',
          'Content-Length': '405',
          'Content-Type': 'application/json; charset=utf-8',
        },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await proxyRequestToUpstream(
      new NextRequest('https://console.svc.plus/api/agent/nodes', {
        headers: {
          host: 'console.svc.plus',
        },
      }),
      {
        upstreamBaseUrl: 'https://accounts.svc.plus',
        upstreamPathPrefix: '/api/agent',
      },
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://accounts.svc.plus/api/agent/nodes',
      expect.objectContaining({
        cache: 'no-store',
        method: 'GET',
        redirect: 'manual',
      }),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('content-encoding')).toBeNull()
    expect(response.headers.get('content-length')).toBeNull()
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8')
    await expect(response.json()).resolves.toEqual([{ name: 'JP', address: 'jp-xhttp.svc.plus' }])
  })
})
