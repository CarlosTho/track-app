'use client'

import { useState } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/lib/hooks/useAuth'
import { CreateChallengeForm } from '@/components/invite/CreateChallengeForm'
import { JoinChallengeForm } from '@/components/invite/JoinChallengeForm'
import type { Challenge } from '@/lib/types'
import { cn } from '@/lib/utils'

type InviteTab = 'create' | 'join'

function InviteContent() {
  const { user } = useAuth()
  const [, setChallenge] = useState<Challenge | null>(null)
  const [tab, setTab] = useState<InviteTab>('create')

  if (!user) return null

  const isCreate = tab === 'create'
  const heading = isCreate ? 'Create a challenge' : 'Join with a code'
  const subheading = isCreate
    ? 'Set the rules and invite someone to join'
    : 'Enter the 6-character code you received'

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-start sm:items-center justify-center px-4 pt-8 pb-28 sm:py-12">
      <div className="w-full max-w-lg min-w-0">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Start Your Challenge</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create a new challenge or join your partner&apos;s
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6 sm:p-7">
          <div
            role="tablist"
            aria-label="Create or join a challenge"
            className="relative grid grid-cols-2 rounded-full bg-gray-100 p-1 mb-6"
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm transition-all duration-300 ease-out',
                isCreate ? 'left-1' : 'left-[calc(50%+0rem)]'
              )}
            />
            <button
              type="button"
              role="tab"
              aria-selected={isCreate}
              onClick={() => setTab('create')}
              className={cn(
                'relative z-10 rounded-full py-2 text-sm font-semibold transition-colors',
                isCreate ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Create Challenge
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isCreate}
              onClick={() => setTab('join')}
              className={cn(
                'relative z-10 rounded-full py-2 text-sm font-semibold transition-colors',
                !isCreate ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Join with Code
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-gray-900 leading-tight">
              {heading}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{subheading}</p>
          </div>

          {isCreate ? (
            <CreateChallengeForm userId={user.uid} onCreated={setChallenge} />
          ) : (
            <JoinChallengeForm userId={user.uid} />
          )}
        </div>
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <AuthGuard>
      <InviteContent />
    </AuthGuard>
  )
}
