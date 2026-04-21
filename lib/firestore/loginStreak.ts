import { doc, getDoc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { LoginStreak } from '@/lib/types'
import { easternDateString, diffCalendarDays } from '@/lib/easternTime'

export async function recordLogin(
  userId: string,
  challengeId: string | undefined
): Promise<void> {
  if (!challengeId) return

  const ref = doc(db, 'loginStreaks', userId)
  const today = easternDateString()

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const current: LoginStreak = snap.exists()
      ? (snap.data() as LoginStreak)
      : { userId, currentStreak: 0, longestStreak: 0 }

    const challengeChanged = current.challengeId !== challengeId

    if (!challengeChanged && current.lastLoginDate === today) return

    const dayDiff = !challengeChanged && current.lastLoginDate
      ? diffCalendarDays(today, current.lastLoginDate)
      : Infinity

    const newCurrent = dayDiff === 1 ? current.currentStreak + 1 : 1

    const next: LoginStreak = {
      userId,
      currentStreak: newCurrent,
      longestStreak: Math.max(current.longestStreak, newCurrent),
      lastLoginDate: today,
      challengeId,
    }

    tx.set(ref, next)
  })
}

export async function resetLoginStreak(userId: string): Promise<void> {
  const ref = doc(db, 'loginStreaks', userId)
  const snap = await getDoc(ref)
  const prev = snap.exists() ? (snap.data() as LoginStreak) : null
  const next: LoginStreak = {
    userId,
    currentStreak: 0,
    longestStreak: prev?.longestStreak ?? 0,
  }
  await setDoc(ref, next)
}

export function subscribeLoginStreak(
  userId: string,
  callback: (streak: LoginStreak) => void
): () => void {
  const ref = doc(db, 'loginStreaks', userId)
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as LoginStreak)
    } else {
      callback({ userId, currentStreak: 0, longestStreak: 0 })
    }
  })
}
