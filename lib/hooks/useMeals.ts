'use client'

import { useState, useEffect } from 'react'
import { subscribeTodaysMeals } from '@/lib/firestore/meals'
import type { Meal } from '@/lib/types'

export function useTodaysMeals(challengeId: string | undefined, userId: string | undefined) {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!challengeId || !userId) {
      setLoading(false)
      return
    }

    const unsub = subscribeTodaysMeals(challengeId, userId, (m) => {
      setMeals(m)
      setLoading(false)
    })

    return unsub
  }, [challengeId, userId])

  return { meals, loading }
}
