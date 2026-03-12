'use client'

import { Bot } from 'lucide-react'
import { useMoltbotStore } from '@lib/moltbotStore'
import { useAccess } from '@lib/accessControl'
import { cn } from '@lib/utils'
import { useLanguage } from '../i18n/LanguageProvider'
import { translations } from '../i18n/translations'

type AskAIButtonProps = {
  variant?: 'floating' | 'navbar'
}

export function AskAIButton({ variant = 'floating' }: AskAIButtonProps) {
  const { isOpen, isMinimized, toggleOpen } = useMoltbotStore()
  const { allowed, isLoading } = useAccess({ allowGuests: true })
  const { language } = useLanguage()
  const isFloating = variant === 'floating'
  const isNavbar = variant === 'navbar'

  if (!allowed && !isLoading) {
    return null
  }

  const handleOpen = () => {
    toggleOpen()
  }

  const buttonClassName = cn(
    isFloating
      ? "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary/80 text-white shadow-lg transition hover:bg-primary-hover"
      : "flex h-10 w-10 items-center justify-center rounded-full border border-surface-border text-text-muted transition hover:border-primary-muted hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background",
    isFloating && isMinimized ? 'h-12 w-12 justify-center' : isFloating ? 'px-4 py-3' : ''
  )

  const showTrigger = isFloating ? !isOpen : true

  return (
    <>
      {showTrigger ? (
        <button type="button" onClick={handleOpen} className={buttonClassName} aria-expanded={isOpen} aria-label={translations[language].chat}>
          <Bot className="h-4 w-4" />
          {!isNavbar && (!isMinimized || !isFloating) && <span className="text-sm">{translations[language].chat}</span>}
        </button>
      ) : null}
    </>
  )
}
