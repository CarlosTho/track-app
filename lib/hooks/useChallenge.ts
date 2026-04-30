'use client'

import { useState, useEffect, useRef } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Challenge, UserDoc } from '@/lib/types'
import { useAuth } from './useAuth'
import { completeChallenge, getChallengeEndAt, isChallengeActiveNow } from '@/lib/firestore/challenges'
import { updateUserDoc } from '@/lib/firestore/users'

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
  const selfHealingRef = useRef(false)

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

    // setTimeout uses a 32-bit signed int for the delay (~24.85 days max).
    // Anything larger silently fires immediately, which would auto-complete
    // long (e.g. 30-day) challenges on page load. Chain timers below this cap.
    const MAX_TIMEOUT_MS = 2_147_483_647

    const runEnd = () => {
      // Defensive: never complete a challenge whose end time hasn't actually arrived.
      if (Date.now() < endAt.getTime()) {
        timerId = scheduleNext()
        return
      }
      if (autoEndingRef.current) return
      autoEndingRef.current = true
      completeChallenge(challenge.id)
        .catch((err) => {
          console.warn('auto completeChallenge failed:', err)
          autoEndingRef.current = false
        })
    }

    const scheduleNext = (): ReturnType<typeof setTimeout> | null => {
      const msLeft = endAt.getTime() - Date.now()
      if (msLeft <= 0) {
        runEnd()
        return null
      }
      const delay = Math.min(msLeft, MAX_TIMEOUT_MS)
      return setTimeout(() => {
        timerId = scheduleNext()
      }, delay)
    }

    let timerId = scheduleNext()
    return () => {
      if (timerId) clearTimeout(timerId)
    }
  }, [challenge])

  // Self-heal: if our user doc still points at a challenge that was cancelled
  // (or where we've been removed from the users array), clear our own
  // challengeId/partnerId so we get a clean slate. We can only mutate our
  // own user doc per Firestore rules, so each side heals itself.
  useEffect(() => {
    if (!userDoc?.id || !userDoc.challengeId || !challenge) return
    if (selfHealingRef.current) return

    const wasRemoved = !(challenge.users ?? []).includes(userDoc.id)
    const wasCancelled = challenge.status === 'cancelled'

    if (!wasCancelled && !wasRemoved) return

    selfHealingRef.current = true
    updateUserDoc(userDoc.id, { challengeId: undefined, partnerId: undefined })
      .catch((err) => {
        console.warn('self-heal clearChallengeId failed:', err)
        selfHealingRef.current = false
      })
  }, [challenge, userDoc?.id, userDoc?.challengeId])

  return {
    challenge,
    partner: partners[0] ?? null,
    partners,
    loading,
    hasActiveChallenge: !!(challenge && isChallengeActiveNow(challenge)),
  }
}
