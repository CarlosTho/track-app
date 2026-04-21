'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createChallenge } from '@/lib/firestore/challenges'
import { generateInviteCode } from '@/lib/firestore/inviteCodes'
import { updateUserDoc } from '@/lib/firestore/users'
import type { Challenge } from '@/lib/types'
import { InviteCodeDisplay } from './InviteCodeDisplay'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CreateChallengeFormProps {
  userId: string
  onCreated: (challenge: Challenge) => void
}

const DURATION_OPTIONS = [7, 14, 30]

export function CreateChallengeForm({ userId, onCreated }: CreateChallengeFormProps) {
  const [noAddedSugar, setNoAddedSugar] = useState(true)
  const [noAddedSalt, setNoAddedSalt] = useState(false)
  const [duration, setDuration] = useState(14)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!noAddedSugar && !noAddedSalt) {
      toast.error('Pick at least one rule')
      return
    }
    setLoading(true)
    try {
      const challenge = await createChallenge(userId, { noAddedSugar, noAddedSalt }, duration)
      await updateUserDoc(userId, { challengeId: challenge.id })
      const code = await generateInviteCode(userId, challenge.id)
      setInviteCode(code)
      onCreated(challenge)
    } catch {
      toast.error('Failed to create challenge')
    } finally {
      setLoading(false)
    }
  }

  if (inviteCode) {
    return <InviteCodeDisplay code={inviteCode} />
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Challenge Rules</p>
        <label className={cn(
          'flex min-w-0 items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
          noAddedSugar ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
        )}>
          <input
            type="checkbox"
            checked={noAddedSugar}
            onChange={(e) => setNoAddedSugar(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">No Added Sugar</p>
            <p className="text-xs text-gray-500 break-words">No candy, soda, baked goods with added sugar</p>
          </div>
        </label>
        <label className={cn(
          'flex min-w-0 items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
          noAddedSalt ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
        )}>
          <input
            type="checkbox"
            checked={noAddedSalt}
            onChange={(e) => setNoAddedSalt(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">No Added Salt</p>
            <p className="text-xs text-gray-500 break-words">No chips, pretzels, heavily salted foods</p>
          </div>
        </label>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Duration</p>
        <div className="grid grid-cols-3 gap-2 min-w-0">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={cn(
                'min-w-0 py-3 rounded-lg border-2 text-sm font-medium transition-all',
                duration === d
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 text-gray-500 hover:border-orange-300'
              )}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleCreate}
        className="w-full bg-orange-500 hover:bg-orange-600"
        size="lg"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Challenge & Get Code'}
      </Button>
    </div>
  )
}
