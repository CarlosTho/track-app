'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { MealForm } from '@/components/meals/MealForm'
import { isChallengeActiveNow } from '@/lib/firestore/challenges'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

function LogContent() {
  const { user } = useAuth()
  const { challenge, loading } = useChallenge()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!challenge || !isChallengeActiveNow(challenge)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No active challenge. Start one first!</p>
          <Link href="/invite">
            <Button className="bg-orange-500 hover:bg-orange-600">Start a Challenge</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-gray-500">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Log a Meal</h1>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <MealForm userId={user!.uid} challenge={challenge} />
      </div>
    </div>
  )
}

export default function LogPage() {
  return (
    <AuthGuard>
      <LogContent />
    </AuthGuard>
  )
}
