import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  query,
  collection,
  where,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { InviteCode } from '@/lib/types'
import { addHours } from 'date-fns'
import { INVITE_CODE_LENGTH, normalizeInviteCode } from '@/lib/inviteCode'

const INVITE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function randomCode(): string {
  let code = ''
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    const idx = Math.floor(Math.random() * INVITE_CODE_ALPHABET.length)
    code += INVITE_CODE_ALPHABET[idx]
  }
  return code
}

export async function generateInviteCode(creatorId: string, challengeId: string): Promise<string> {
  let attempts = 0
  while (attempts < 3) {
    const code = randomCode()
    const ref = doc(db, 'inviteCodes', code)
    const existing = await getDoc(ref)

    if (!existing.exists()) {
      const inviteCode: InviteCode = {
        code,
        creatorId,
        challengeId,
        used: false,
        expiresAt: addHours(new Date(), 24).toISOString(),
      }
      await setDoc(ref, inviteCode)
      return code
    }
    attempts++
  }
  throw new Error('Failed to generate unique invite code')
}

export async function getActiveInviteCodeForUser(
  creatorId: string,
  challengeId: string
): Promise<string | null> {
  const q = query(
    collection(db, 'inviteCodes'),
    where('creatorId', '==', creatorId),
    where('used', '==', false)
  )
  const snap = await getDocs(q)
  const now = new Date()
  for (const d of snap.docs) {
    const data = d.data() as InviteCode
    if (data.challengeId !== challengeId) continue
    if (new Date(data.expiresAt) > now) return data.code
  }
  return null
}

export async function getInviteCode(code: string): Promise<InviteCode | null> {
  const normalized = normalizeInviteCode(code)
  if (normalized.length !== INVITE_CODE_LENGTH) return null
  const ref = doc(db, 'inviteCodes', normalized)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as InviteCode
}

export async function claimInviteCode(
  code: string,
  joiningUserId: string
): Promise<{ challengeId: string; creatorId: string }> {
  const normalized = normalizeInviteCode(code)
  if (normalized.length !== INVITE_CODE_LENGTH) {
    throw new Error('Enter a valid 6-character code')
  }
  const ref = doc(db, 'inviteCodes', normalized)

  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Invite code not found')

    const data = snap.data() as InviteCode
    if (new Date(data.expiresAt) < new Date()) throw new Error('Invite code expired')
    if (data.creatorId === joiningUserId) throw new Error('You cannot join your own challenge')
    // Invite codes are reusable for the challenge window.
    // Membership uniqueness is enforced by joinChallenge().
    return { challengeId: data.challengeId, creatorId: data.creatorId }
  })

  return result
}
