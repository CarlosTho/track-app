'use client'

import { useState, useEffect, useRef } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Challenge, UserDoc } from '@/lib/types'
import { useAuth } from './useAuth'
import { endChallenge, getChallengeEndAt, isChallengeActiveNow } from '@/lib/firestore/challenges'

interface UseChallengeReturn {
  challenge: Challenge | null
  partner: UserDoc | null
  loading: boolean
  hasActiveChallenge: boolean
}

export function useChallenge(): UseChallengeReturn {
  const { userDoc, loading: authLoading } = useAuth()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [partner, setPartner] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const autoEndingRef = useRef(false)

  useEffect(() => {
    // Wait until auth is fully resolved before deciding anything
    if (authLoading) return

    if (!userDoc?.challengeId || !userDoc.id) {
      setChallenge(null)
      setPartner(null)
      setLoading(false)
      return
    }

    let unsubPartner: (() => void) | null = null

    const unsubChallenge = onSnapshot(doc(db, 'challenges', userDoc.challengeId), (snap) => {
      if (!snap.exists()) {
        setChallenge(null)
        setPartner(null)
        setLoading(false)
        if (unsubPartner) { unsubPartner(); unsubPartner = null }
        return
      }

      const c = snap.data() as Challenge
      setChallenge(c)

      const partnerId = c.users.find((uid) => uid && uid !== userDoc.id)

      if (unsubPartner) { unsubPartner(); unsubPartner = null }

      if (!partnerId) {
        setPartner(null)
        setLoading(false)
        return
      }

      unsubPartner = onSnapshot(doc(db, 'users', partnerId), (userSnap) => {
        setPartner(userSnap.exists() ? (userSnap.data() as UserDoc) : null)
        setLoading(false)
      })
    })

    return () => {
      unsubChallenge()
      if (unsubPartner) unsubPartner()
    }
  }, [userDoc?.challengeId, userDoc?.id, authLoading])

  useEffect(() => {
    if (!challenge || challenge.status !== 'active') return
    const endAt = getChallengeEndAt(challenge)
    const msLeft = endAt.getTime() - Date.now()

    const runEnd = () => {
      if (autoEndingRef.current) return
      autoEndingRef.current = true
      endChallenge(challenge.id)
        .catch((err) => {
          console.warn('auto endChallenge failed:', err)
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
    partner,
    loading,
    hasActiveChallenge: !!(challenge && isChallengeActiveNow(challenge)),
  }
}
