import { Suspense } from 'react'

import { OpenClawWorkspacePage } from '@/components/openclaw/OpenClawWorkspacePage'
import { getConsoleIntegrationDefaults } from '@/server/consoleIntegrations'

export const metadata = {
  title: 'OpenClaw Assistant',
  description: 'OpenClaw gateway assistant workspace',
}

export default function OpenClawPage() {
  const defaults = getConsoleIntegrationDefaults()

  return (
    <div className="h-[calc(100vh-var(--app-shell-nav-offset))] w-full p-4">
      <Suspense
        fallback={<div className="flex h-full items-center justify-center">Loading assistant...</div>}
      >
        <OpenClawWorkspacePage defaults={defaults} />
      </Suspense>
    </div>
  )
}
