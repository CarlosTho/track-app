'use client'

import { useEffect, useState } from 'react'
import type { LoginStreak } from '@/lib/types'
import { recordLogin, subscribeLoginStreak } from '@/lib/firestore/loginStreak'

export function useLoginStreak(
  userId: string | undefined,
  challengeId: string | undefined,
  shouldRecordLogin: boolean = false
): LoginStreak | null {
  const [streak, setStreak] = useState<LoginStreak | null>(null)

  useEffect(() => {
    if (!userId) return
    if (shouldRecordLogin) {
      recordLogin(userId, challengeId).catch((err) => {
        console.warn('recordLogin failed:', err)
      })
    }
    const unsub = subscribeLoginStreak(userId, setStreak)
    return unsub
  }, [userId, challengeId, shouldRecordLogin])

  return streak
}
