export const dynamic = 'force-dynamic'

import type { NextRequest } from 'next/server'

import { createUpstreamProxyHandler } from '@lib/apiProxy'
import { getAccountSession } from '@server/account/session'
import { getAccountServiceBaseUrl } from '@server/serviceConfig'

const ADMIN_COLLECTOR_PREFIX = '/api/admin/collector'

const handler = createUpstreamProxyHandler({
  upstreamBaseUrl: getAccountServiceBaseUrl(),
  upstreamPathPrefix: ADMIN_COLLECTOR_PREFIX,
  getAdditionalHeaders: async (request) => {
    const session = await getAccountSession(request)
    if (!session.token) {
      return undefined
    }
    return {
      authorization: `Bearer ${session.token}`,
      'x-account-session': session.token,
    }
  },
})

export function GET(request: NextRequest) {
  return handler(request)
}
