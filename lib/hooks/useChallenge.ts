'use client'

import { useState, useEffect, useRef } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Challenge, UserDoc } from '@/lib/types'
import { useAuth } from './useAuth'
import { completeChallenge, getChallengeEndAt, isChallengeActiveNow } from '@/lib/firestore/challenges'

interface UseChallengeReturn {
  challenge: Challenge | null
  partner: UserDoc | null
  partners: UserDoc[]
  loading: boolean
  hasActiveChallenge: boolean
}

export function useChallenge(): UseChallengeReturn {
  const { userDoc, loading: authLoading } = useAuth()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [partners, setPartners] = useState<UserDoc[]>([])
  const [loading, setLoading] = useState(true)
  const autoEndingRef = useRef(false)

  useEffect(() => {
    // Wait until auth is fully resolved before deciding anything
    if (authLoading) return

    if (!userDoc?.challengeId || !userDoc.id) {
      setChallenge(null)
      setPartners([])
      setLoading(false)
      return
    }

    let partnerUnsubs: Array<() => void> = []

    const unsubChallenge = onSnapshot(doc(db, 'challenges', userDoc.challengeId), (snap) => {
      if (!snap.exists()) {
        setChallenge(null)
        setPartners([])
        setLoading(false)
        partnerUnsubs.forEach((u) => u())
        partnerUnsubs = []
        return
      }

      const c = snap.data() as Challenge
      setChallenge(c)

      const partnerIds = (c.users ?? []).filter((uid) => uid && uid !== userDoc.id)
      partnerUnsubs.forEach((u) => u())
      partnerUnsubs = []
      setPartners([])

      if (partnerIds.length === 0) {
        setLoading(false)
        return
      }

      const partnersById = new Map<string, UserDoc>()
      partnerIds.forEach((partnerId) => {
        const unsub = onSnapshot(doc(db, 'users', partnerId), (userSnap) => {
          if (userSnap.exists()) {
            partnersById.set(partnerId, userSnap.data() as UserDoc)
          } else {
            partnersById.delete(partnerId)
          }
          setPartners(partnerIds.map((id) => partnersById.get(id)).filter(Boolean) as UserDoc[])
          setLoading(false)
        })
        partnerUnsubs.push(unsub)
      })
    })

    return () => {
      unsubChallenge()
      partnerUnsubs.forEach((u) => u())
    }
  }, [userDoc?.challengeId, userDoc?.id, authLoading])

  useEffect(() => {
    if (!challenge || challenge.status !== 'active') return
    const endAt = getChallengeEndAt(challenge)
    const msLeft = endAt.getTime() - Date.now()

    const runEnd = () => {
      if (autoEndingRef.current) return
      autoEndingRef.current = true
      completeChallenge(challenge.id)
        .catch((err) => {
          console.warn('auto completeChallenge failed:', err)
          autoEndingRef.current = false
        })
    }

    if (msLeft <= 0) {
      runEnd()
      return
    }

    const timer = setTimeout(runEnd, msLeft)
    return () => clearTimeout(timer)
  }, [challenge])

  return {
    challenge,
    partner: partners[0] ?? null,
    partners,
    loading,
    hasActiveChallenge: !!(challenge && isChallengeActiveNow(challenge)),
  }
}
