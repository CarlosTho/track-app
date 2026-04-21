'use client'

import { useEffect } from 'react'
import {
  applyMelonTheme,
  isMelonThemeUnlocked,
  MELON_THEME_KEY,
  MELON_THEME_EVENT,
} from '@/lib/melonTheme'

export function MelonThemeManager() {
  useEffect(() => {
    applyMelonTheme(isMelonThemeUnlocked())

    const onStorage = (e: StorageEvent) => {
      if (e.key === MELON_THEME_KEY) applyMelonTheme(isMelonThemeUnlocked())
    }
    const onThemeEvent = () => applyMelonTheme(isMelonThemeUnlocked())

    window.addEventListener('storage', onStorage)
    window.addEventListener(MELON_THEME_EVENT, onThemeEvent)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(MELON_THEME_EVENT, onThemeEvent)
    }
  }, [])

  return null
}
