'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { applyMelonTheme } from '@/lib/melonTheme'

export function MelonThemeManager() {
  const { user, userDoc, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    const enabled = !!(user && userDoc?.uiTheme === 'melon')
    applyMelonTheme(enabled)
  }, [loading, user, userDoc?.uiTheme])

  return null
}
