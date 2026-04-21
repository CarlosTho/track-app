'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { claimInviteCode } from '@/lib/firestore/inviteCodes'
import { normalizeInviteCode } from '@/lib/inviteCode'
import { joinChallenge } from '@/lib/firestore/challenges'
import { updateUserDoc } from '@/lib/firestore/users'
import { toast } from 'sonner'

interface JoinChallengeFormProps {
  userId: string
}

export function JoinChallengeForm({ userId }: JoinChallengeFormProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedCode = normalizeInviteCode(code)
    if (normalizedCode.length !== 6) return

    setLoading(true)
    try {
      const { challengeId, creatorId } = await claimInviteCode(normalizedCode, userId)
      await joinChallenge(challengeId, userId)
      await updateUserDoc(userId, { challengeId, partnerId: creatorId })

      toast.success("You've joined the challenge!")
      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid or expired code'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleJoin} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Enter Invite Code</label>
        <Input
          value={code}
          onChange={(e) => setCode(normalizeInviteCode(e.target.value).slice(0, 6))}
          placeholder="ABC123"
          maxLength={6}
          className="text-center text-2xl font-mono tracking-widest h-14"
          required
        />
        <p className="text-xs text-gray-400 text-center">6-character code from your partner</p>
      </div>
      <Button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600"
        size="lg"
        disabled={loading || code.length !== 6}
      >
        {loading ? 'Joining...' : 'Join Challenge'}
      </Button>
    </form>
  )
}
