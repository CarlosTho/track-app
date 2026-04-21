import type { UserDoc } from '@/lib/types'

/** Label for UI when a profile has no display name in Firestore (uses email local-part). */
export function getUserDisplayName(user: UserDoc | null | undefined): string {
  if (!user) return 'Partner'
  const n = user.name?.trim()
  if (n) return n
  const email = user.email?.trim()
  if (email) {
    const local = email.split('@')[0]
    if (local) return local
  }
  return 'Partner'
}
