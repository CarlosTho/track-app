import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  runTransaction,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Challenge } from '@/lib/types'
import { addCalendarDays, easternDateString, diffCalendarDays } from '@/lib/easternTime'

const DAY_MS = 24 * 60 * 60 * 1000

function toValidDate(value: string | undefined): Date | null {
  if (!value) return null
  const dt = new Date(value)
  return Number.isNaN(dt.getTime()) ? null : dt
}

export function getChallengeStartAt(challenge: Challenge): Date {
  return (
    toValidDate(challenge.startAt) ??
    toValidDate(challenge.createdAt) ??
    // Legacy fallback: old challenges only had ymd fields.
    new Date(`${challenge.startDate}T00:00:00.000Z`)
  )
}

export function getChallengeEndAt(challenge: Challenge): Date {
  const explicit = toValidDate(challenge.endAt)
  if (explicit) return explicit

  const startAt = getChallengeStartAt(challenge)
  const durationDays = challenge.durationDays ?? (diffCalendarDays(challenge.endDate, challenge.startDate) + 1)
  return new Date(startAt.getTime() + durationDays * DAY_MS)
}

export function isChallengeTimeComplete(challenge: Challenge, now: Date = new Date()): boolean {
  return now.getTime() >= getChallengeEndAt(challenge).getTime()
}

export function isChallengeActiveNow(challenge: Challenge, now: Date = new Date()): boolean {
  return challenge.status === 'active' && !isChallengeTimeComplete(challenge, now)
}

export async function createChallenge(
  creatorId: string,
  rules: Challenge['rules'],
  durationDays: number
): Promise<Challenge> {
  const ref = doc(collection(db, 'challenges'))
  const now = new Date()
  const createdAt = now.toISOString()
  const startAt = createdAt
  const endAt = new Date(now.getTime() + durationDays * DAY_MS).toISOString()
  const startDate = easternDateString(now)
  const endDate = addCalendarDays(startDate, durationDays - 1)

  const challenge: Omit<Challenge, 'id'> & { id: string } = {
    id: ref.id,
    users: [creatorId],
    durationDays,
    createdAt,
    startAt,
    endAt,
    startDate,
    endDate,
    rules,
    status: 'active',
  }

  await setDoc(ref, challenge)
  return challenge
}

export async function getChallenge(challengeId: string): Promise<Challenge | null> {
  const ref = doc(db, 'challenges', challengeId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as Challenge
}

export async function joinChallenge(challengeId: string, userId: string): Promise<void> {
  const ref = doc(db, 'challenges', challengeId)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Challenge not found')

    const challenge = snap.data() as Challenge
    const currentUsers = (challenge.users ?? []).filter(Boolean)
    if (currentUsers.includes(userId)) return
    const creatorId = currentUsers[0]
    if (!creatorId) throw new Error('Challenge has no creator')
    const otherMembers = currentUsers.filter((uid) => uid !== creatorId && uid !== userId)
    // Keep creator first, put joiner in index 1 to satisfy current Firestore rules, preserve others after.
    const updatedUsers = [creatorId, userId, ...otherMembers]
    tx.update(ref, { users: updatedUsers })
  })
}

export async function completeChallenge(challengeId: string): Promise<void> {
  const ref = doc(db, 'challenges', challengeId)
  await updateDoc(ref, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  })
}

export async function cancelChallenge(challengeId: string): Promise<void> {
  const ref = doc(db, 'challenges', challengeId)
  await updateDoc(ref, {
    status: 'cancelled',
  })
}
