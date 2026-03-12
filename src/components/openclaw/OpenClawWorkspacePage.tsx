'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Maximize2, PanelLeft, PanelRight, X } from 'lucide-react'

import Footer from '@components/Footer'
import { HeroSection, NextStepsSection, ShortcutsSection, StatsSection } from '@/app/page'
import { cn } from '@/lib/utils'
import type { IntegrationDefaults } from '@/lib/openclaw/types'

import { OpenClawAssistantPane } from './OpenClawAssistantPane'

type ChatLayoutMode = 'left' | 'right' | 'full'

type OpenClawWorkspacePageProps = {
  defaults: IntegrationDefaults
}

export function OpenClawWorkspacePage({ defaults }: OpenClawWorkspacePageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [layout, setLayout] = useState<ChatLayoutMode>('full')
  const initialQuestion = searchParams.get('q') ?? undefined

  const homeContent = (
    <main className="space-y-12 py-10">
      <HeroSection />
      <NextStepsSection />
      <StatsSection />
      <ShortcutsSection />
      <Footer />
    </main>
  )

  const assistantPane = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--color-surface-border)] px-5 py-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
            OpenClaw
          </p>
          <h1 className="text-lg font-semibold text-[var(--color-heading)]">AI Assistant Workspace</h1>
        </div>

        <div className="flex items-center gap-1 text-[var(--color-text-subtle)]">
          <button
            type="button"
            onClick={() => setLayout('left')}
            className={cn(
              'rounded-xl p-2 transition hover:bg-[var(--color-surface-muted)]',
              layout === 'left' ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]' : '',
            )}
            title="Sidebar Left"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setLayout('right')}
            className={cn(
              'rounded-xl p-2 transition hover:bg-[var(--color-surface-muted)]',
              layout === 'right' ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]' : '',
            )}
            title="Sidebar Right"
          >
            <PanelRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setLayout('full')}
            className={cn(
              'rounded-xl p-2 transition hover:bg-[var(--color-surface-muted)]',
              layout === 'full' ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]' : '',
            )}
            title="Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-xl p-2 transition hover:bg-[var(--color-danger-muted)]/40 hover:text-[var(--color-danger-foreground)]"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <OpenClawAssistantPane
          defaults={defaults}
          initialQuestion={initialQuestion}
          initialQuestionKey={initialQuestion ? 1 : undefined}
          variant="page"
        />
      </div>
    </div>
  )

  if (layout === 'full') {
    return <div className="h-full min-h-0">{assistantPane}</div>
  }

  return (
    <div className="flex h-full min-h-0 gap-4 overflow-hidden">
      {layout === 'left' ? <div className="w-[460px] shrink-0">{assistantPane}</div> : null}
      <div className="min-w-0 flex-1 overflow-y-auto">{homeContent}</div>
      {layout === 'right' ? <div className="w-[460px] shrink-0">{assistantPane}</div> : null}
    </div>
  )
}
