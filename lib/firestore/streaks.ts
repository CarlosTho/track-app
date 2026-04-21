import { doc, getDoc, runTransaction } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Streak } from '@/lib/types'
import { differenceInCalendarDays, parseISO, format } from 'date-fns'

export async function getStreak(userId: string): Promise<Streak> {
  const ref = doc(db, 'streaks', userId)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    return { userId, currentStreak: 0, longestStreak: 0 }
  }
  return snap.data() as Streak
}

export async function updateStreak(userId: string, isCompliantToday: boolean): Promise<void> {
  const ref = doc(db, 'streaks', userId)
  const today = format(new Date(), 'yyyy-MM-dd')

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const current: Streak = snap.exists()
      ? (snap.data() as Streak)
      : { userId, currentStreak: 0, longestStreak: 0 }

    let newStreak: Streak

    if (!isCompliantToday) {
      newStreak = { ...current, currentStreak: 0 }
    } else {
      const lastDate = current.lastCompliantDate
      let dayDiff = 999
      if (lastDate) {
        dayDiff = differenceInCalendarDays(parseISO(today), parseISO(lastDate))
      }

      const newCurrent = dayDiff === 1 ? current.currentStreak + 1 : 1
      newStreak = {
        ...current,
        currentStreak: newCurrent,
        longestStreak: Math.max(current.longestStreak, newCurrent),
        lastCompliantDate: today,
      }
    }

    tx.set(ref, newStreak)
  })
}
