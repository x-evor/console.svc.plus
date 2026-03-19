'use client'

import { Bot } from 'lucide-react'
import { useMoltbotStore } from '@lib/moltbotStore'
import { useAccess } from '@lib/accessControl'
import { cn } from '@lib/utils'
import { useLanguage } from '../i18n/LanguageProvider'
import { translations } from '../i18n/translations'
import Draggable from 'react-draggable'
import { useRef, useState, useEffect } from 'react'

type AskAIButtonProps = {
  variant?: 'floating' | 'navbar'
}

export function AskAIButton({ variant = 'floating' }: AskAIButtonProps) {
  const { isOpen, isMinimized, toggleOpen } = useMoltbotStore()
  const { allowed, isLoading } = useAccess({ allowGuests: true })
  const { language } = useLanguage()
  const isFloating = variant === 'floating'
  const isNavbar = variant === 'navbar'

  const nodeRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!allowed && !isLoading) {
    return null
  }

  const handleOpen = () => {
    if (!isDragging) {
      toggleOpen()
    }
  }

  const isChinese = language === 'zh';

  const buttonClassName = cn(
    isFloating
      ? "flex items-center gap-2 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 ease-out border border-white/10 backdrop-blur-sm cursor-grab active:cursor-grabbing"
      : "flex h-10 w-10 items-center justify-center rounded-full border border-surface-border text-text-muted transition hover:border-primary-muted hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background",
    isFloating && isMinimized ? 'h-14 w-14 justify-center' : isFloating ? 'px-5 py-3.5' : ''
  )

  const showTrigger = isFloating ? !isOpen : true

  if (!showTrigger || !hasMounted) return null;

  const buttonContent = (
    <button
      type="button"
      onClick={handleOpen}
      className={buttonClassName}
      aria-expanded={isOpen}
      aria-label={isChinese ? "AI助手" : "AI Assistant"}
      style={isFloating ? { pointerEvents: isDragging ? 'none' : 'auto' } : undefined}
    >
      <Bot className={cn("h-5 w-5", isFloating && "drop-shadow-sm")} />
      {!isNavbar && (!isMinimized || !isFloating) && <span className="text-sm font-medium tracking-wide drop-shadow-sm">{isChinese ? "AI助手" : "AI Assistant"}</span>}
    </button>
  );

  if (isFloating) {
    return (
      <Draggable
        nodeRef={nodeRef}
        bounds="body"
        onDrag={() => setIsDragging(true)}
        onStop={() => {
          // small timeout to prevent click from firing right after drag
          setTimeout(() => setIsDragging(false), 50)
        }}
      >
        <div
          ref={nodeRef}
          className="fixed bottom-6 right-6 z-[100]"
        >
          {buttonContent}
        </div>
      </Draggable>
    )
  }

  return (
    <>
      {buttonContent}
    </>
  )
}
