'use client'

import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Streak } from '@/lib/types'

export function useStreak(userId: string | undefined) {
  const [streak, setStreak] = useState<Streak | null>(null)

  useEffect(() => {
    if (!userId) return
    const unsub = onSnapshot(doc(db, 'streaks', userId), (snap) => {
      if (snap.exists()) {
        setStreak(snap.data() as Streak)
      } else {
        setStreak({ userId, currentStreak: 0, longestStreak: 0 })
      }
    })
    return unsub
  }, [userId])

  return streak
}
