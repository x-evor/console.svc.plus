import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchAccountPolicy, fetchAccountUsageSummary } from './fetchAccountUsage'

describe('fetchAccountUsage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads the authoritative usage summary from the account api', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ accountUuid: 'acct-1', totalBytes: 384 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(fetchAccountUsageSummary()).resolves.toEqual({
      accountUuid: 'acct-1',
      totalBytes: 384,
    })
  })

  it('loads the authoritative policy snapshot from the account api', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ accountUuid: 'acct-1', preferredStrategy: 'ewma' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(fetchAccountPolicy()).resolves.toEqual({
      accountUuid: 'acct-1',
      preferredStrategy: 'ewma',
    })
  })
})
