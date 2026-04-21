'use client'

import { useState, useEffect, useMemo } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { useTodaysMeals } from '@/lib/hooks/useMeals'
import { subscribeMealsForDateRange } from '@/lib/firestore/meals'
import { computeMealStreaks } from '@/lib/streaks'
import type { Meal } from '@/lib/types'
import { UserColumn } from '@/components/dashboard/UserColumn'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { ChallengeProgress } from '@/components/dashboard/ChallengeProgress'
import { SecretChallenge } from '@/components/dashboard/SecretChallenge'
import { easternFormat } from '@/lib/easternTime'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getActiveInviteCodeForUser, generateInviteCode } from '@/lib/firestore/inviteCodes'
import { endChallenge, isChallengeActiveNow, isChallengeTimeComplete } from '@/lib/firestore/challenges'
import { resetLoginStreak } from '@/lib/firestore/loginStreak'
import { updateUserDoc } from '@/lib/firestore/users'
import { getUserDisplayName } from '@/lib/userDisplay'
import { useRouter } from 'next/navigation'
import { Copy, Check, X, Flame, Trophy } from 'lucide-react'
import { toast } from 'sonner'

function DashboardContent() {
  const { user, userDoc } = useAuth()
  const { challenge, partner, loading: challengeLoading } = useChallenge()
  const { meals: myMeals } = useTodaysMeals(challenge?.id, user?.uid)
  const { meals: partnerMeals } = useTodaysMeals(challenge?.id, partner?.id)
  const [myAllMeals, setMyAllMeals] = useState<Meal[]>([])
  const [partnerAllMeals, setPartnerAllMeals] = useState<Meal[]>([])
  const router = useRouter()

  useEffect(() => {
    if (!challenge || !user) return
    return subscribeMealsForDateRange(
      challenge.id,
      user.uid,
      challenge.startDate,
      challenge.endDate,
      setMyAllMeals
    )
  }, [challenge, user])

  useEffect(() => {
    if (!challenge || !partner) return
    return subscribeMealsForDateRange(
      challenge.id,
      partner.id,
      challenge.startDate,
      challenge.endDate,
      setPartnerAllMeals
    )
  }, [challenge, partner])

  const myStreak = useMemo(
    () => (challenge ? computeMealStreaks(myAllMeals, challenge.startDate, challenge.endDate) : null),
    [myAllMeals, challenge?.startDate, challenge?.endDate]
  )
  const partnerStreak = useMemo(
    () => (challenge ? computeMealStreaks(partnerAllMeals, challenge.startDate, challenge.endDate) : null),
    [partnerAllMeals, challenge?.startDate, challenge?.endDate]
  )
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [loadingCode, setLoadingCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [ending, setEnding] = useState(false)
  const [showCongratsPopup, setShowCongratsPopup] = useState(false)

  const handleEndChallenge = async () => {
    if (!confirm('End this challenge? Both users will be able to start a new one.')) return
    if (!user || !challenge) return
    setEnding(true)
    try {
      await endChallenge(challenge.id)
      await resetLoginStreak(user.uid)
      await updateUserDoc(user.uid, { challengeId: undefined, partnerId: undefined })
      if (partner?.id && partner.id !== user.uid) {
        // Partner cleanup is best-effort because some Firestore rulesets only allow self-updates.
        updateUserDoc(partner.id, { challengeId: undefined, partnerId: undefined }).catch((err) => {
          console.warn('Partner challenge cleanup failed:', err)
        })
      }
      toast.success('Challenge ended.')
      router.push('/invite')
    } catch (err) {
      console.error('Failed to end challenge:', err)
      toast.error('Could not end challenge. Please try again.')
    } finally {
      setEnding(false)
    }
  }

  const handleShareCode = async () => {
    if (!user || !challenge) return
    setLoadingCode(true)
    try {
      let code = await getActiveInviteCodeForUser(user.uid, challenge.id)
      if (!code) code = await generateInviteCode(user.uid, challenge.id)
      setInviteCode(code)
      setShowCodeModal(true)
    } finally {
      setLoadingCode(false)
    }
  }

  const handleCopy = async () => {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const challengeCompleted = !!challenge && (
    challenge.status === 'completed' || isChallengeTimeComplete(challenge)
  )

  useEffect(() => {
    if (!challengeCompleted || !challenge || typeof window === 'undefined') return
    const seenKey = `trackpair.challengeCompletedSeen.${challenge.id}`
    if (localStorage.getItem(seenKey) === '1') return
    localStorage.setItem(seenKey, '1')
    setShowCongratsPopup(true)
  }, [challengeCompleted, challenge])

  const completionPopup = challengeCompleted ? (
    <Dialog open={showCongratsPopup} onOpenChange={setShowCongratsPopup}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-md" showCloseButton={true}>
        <DialogHeader>
          <div className="mx-auto mb-1 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-center">Congratulations 🎉</DialogTitle>
          <DialogDescription className="text-center">
            You hit your goal. Tap below to see your results and winner summary.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Link href="/progress" className="w-full sm:w-auto">
            <Button className="w-full bg-orange-500 hover:bg-orange-600">
              View Results
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null

  if (challengeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!challenge || !isChallengeActiveNow(challenge)) {
    return (
      <>
        {completionPopup}
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {challengeCompleted ? 'Challenge Complete' : 'No Active Challenge'}
            </h2>
            <p className="text-gray-500 mb-6">
              {challengeCompleted
                ? 'Nice work — your results are ready.'
                : 'Start a challenge with a partner to see your dashboard.'}
            </p>
            {challengeCompleted ? (
              <Link href="/progress">
                <Button className="bg-orange-500 hover:bg-orange-600">See Results</Button>
              </Link>
            ) : (
              <Link href="/invite">
                <Button className="bg-orange-500 hover:bg-orange-600">Start a Challenge</Button>
              </Link>
            )}
          </div>
        </div>
      </>
    )
  }

  const rulesText = [
    challenge.rules.noAddedSugar && 'No added sugar',
    challenge.rules.noAddedSalt && 'No added salt',
  ]
    .filter(Boolean)
    .join(' · ')

  const greeting = (() => {
    const hour = Number(easternFormat(new Date(), 'H'))
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const firstName = (userDoc?.name ?? user?.displayName ?? '').split(' ')[0]
  const streakCount = myStreak?.currentStreak ?? 0
  const partnerStreakCount = partnerStreak?.currentStreak ?? 0
  const isChallengeCreator = challenge.users[0] === user?.uid
  const shouldPromptMealLog = myMeals.length === 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {completionPopup}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-1">The Challenge</p>
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <h2 className="text-2xl font-extrabold text-gray-900">{rulesText}</h2>
          <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-600 rounded-full px-3 py-1">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-bold">{streakCount}</span>
            <span className="text-xs font-medium">day{streakCount === 1 ? '' : 's'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-extrabold">
              <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">{greeting},</span>{' '}
              <span className="text-gray-900">{firstName}!</span>
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-0.5">
              Today — {easternFormat(new Date(), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            {isChallengeCreator && (
              <Button variant="outline" size="sm" onClick={handleShareCode} disabled={loadingCode}>
                {loadingCode ? 'Loading...' : 'Share Code'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleEndChallenge} disabled={ending} className="text-red-500 border-red-200 hover:bg-red-50">
              {ending ? 'Ending...' : 'End Challenge'}
            </Button>
            <Link href="/log">
              <Button className="bg-orange-500 hover:bg-orange-600">+ Log Meal</Button>
            </Link>
          </div>
        </div>
      </div>

      <ChallengeProgress challenge={challenge} />
      <SecretChallenge />
      {shouldPromptMealLog && (
        <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700">
          Log in your meal to update your streak!
        </div>
      )}
      {/* Mobile-first placement so feed is visible sooner */}
      <div className="md:hidden mb-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Activity Feed</h2>
        <ActivityFeed challengeId={challenge.id} currentUserId={user?.uid ?? ''} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <UserColumn
            name={userDoc?.name ?? user?.displayName ?? 'You'}
            photoUrl={userDoc?.photoUrl ?? user?.photoURL ?? undefined}
            meals={myMeals}
            streakCount={streakCount}
            isCurrentUser={true}
          />
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {partner ? (
            <UserColumn
              name={getUserDisplayName(partner)}
              photoUrl={partner.photoUrl}
              meals={partnerMeals}
              streakCount={partnerStreakCount}
              isCurrentUser={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-gray-400 text-sm mb-4">Waiting for your partner to join...</p>
              <Button variant="outline" size="sm" onClick={handleShareCode} disabled={loadingCode}>
                {loadingCode ? 'Loading...' : 'Share Invite Code'}
              </Button>
            </div>
          )}
        </div>

      {showCodeModal && inviteCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Your Invite Code</h3>
              <button onClick={() => setShowCodeModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Share this code with your partner so they can join your challenge.</p>
            <div className="flex items-center justify-center gap-3 bg-orange-50 rounded-xl p-4 mb-4">
              <span className="text-4xl font-bold tracking-widest text-orange-500 font-mono">{inviteCode}</span>
              <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600">
                {copied ? <Check className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center">Expires in 24 hours</p>
          </div>
        </div>
      )}
      </div>

      <div className="hidden md:block mt-8 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Activity Feed</h2>
        <ActivityFeed challengeId={challenge.id} currentUserId={user?.uid ?? ''} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
