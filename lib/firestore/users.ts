import { doc, getDoc, setDoc, deleteField } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { UserDoc } from '@/lib/types'

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>
}

export async function createUserDoc(uid: string, data: Omit<UserDoc, 'id' | 'createdAt'>): Promise<void> {
  const ref = doc(db, 'users', uid)
  await setDoc(ref, {
    ...stripUndefined(data as Record<string, unknown>),
    id: uid,
    createdAt: new Date().toISOString(),
  })
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as UserDoc
}

export async function updateUserDoc(uid: string, data: Partial<UserDoc>): Promise<void> {
  const ref = doc(db, 'users', uid)
  // Replace undefined values with deleteField() sentinel so Firestore removes those fields
  const sanitized = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === undefined ? deleteField() : v])
  )
  await setDoc(ref, sanitized, { merge: true })
}
