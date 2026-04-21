'use client'

import { useState, useEffect, useMemo } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { useTodaysMeals } from '@/lib/hooks/useMeals'
import { subscribeMealsForDateRange } from '@/lib/firestore/meals'
import { computeMealStreaks } from '@/lib/streaks'
import type { Meal, UserDoc } from '@/lib/types'
import { UserColumn } from '@/components/dashboard/UserColumn'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { ChallengeProgress } from '@/components/dashboard/ChallengeProgress'
import { SecretChallenge } from '@/components/dashboard/SecretChallenge'
import { challengeDayProgress, easternFormat } from '@/lib/easternTime'
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
import { cancelChallenge, isChallengeActiveNow, isChallengeTimeComplete } from '@/lib/firestore/challenges'
import { resetLoginStreak } from '@/lib/firestore/loginStreak'
import { updateUserDoc } from '@/lib/firestore/users'
import { getUserDisplayName } from '@/lib/userDisplay'
import { useRouter } from 'next/navigation'
import { Copy, Check, X, Flame, Trophy } from 'lucide-react'
import { toast } from 'sonner'

const DAY_REMINDERS = [
  "You decided to start. That's already more than most people do.",
  "Yesterday wasn't a fluke. Prove it.",
  "Three days in is where most people quit. Don't be most people.",
  'Motivation got you started. Discipline takes it from here.',
  "You're not building a streak. You're building a person.",
  'Almost a week. The habit is starting to choose you back.',
  'One week down. You just proved to yourself that you can.',
  "The second week is where it gets real. You're ready.",
  "Show up even when it's boring. Especially when it's boring.",
  "Double digits. You're not trying anymore - you're doing.",
  'The version of you from Day 1 is watching. Make them proud.',
  "You're closer to the finish than the start. Don't coast.",
  'One day left. This is where legends are built, not born.',
  "You did it. Now the question is: what's next?",
] as const

function DashboardContent() {
  const { user, userDoc } = useAuth()
  const { challenge, partners, loading: challengeLoading } = useChallenge()
  const { meals: myMeals } = useTodaysMeals(challenge?.id, user?.uid)
  const [myAllMeals, setMyAllMeals] = useState<Meal[]>([])
  const [partnerMealsMap, setPartnerMealsMap] = useState<Record<string, Meal[]>>({})
  const [partnerAllMealsMap, setPartnerAllMealsMap] = useState<Record<string, Meal[]>>({})
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
    if (!challenge || partners.length === 0) {
      setPartnerMealsMap({})
      setPartnerAllMealsMap({})
      return
    }

    const unsubscribes = partners.map((member) =>
      subscribeMealsForDateRange(
        challenge.id,
        member.id,
        challenge.startDate,
        challenge.endDate,
        (meals) => {
          setPartnerAllMealsMap((prev) => ({ ...prev, [member.id]: meals }))
          const today = easternFormat(new Date(), 'yyyy-MM-dd')
          setPartnerMealsMap((prev) => ({ ...prev, [member.id]: meals.filter((m) => m.date === today) }))
        }
      )
    )

    return () => {
      unsubscribes.forEach((unsub) => unsub?.())
    }
  }, [challenge, partners])

  const myStreak = useMemo(
    () => (challenge ? computeMealStreaks(myAllMeals, challenge.startDate, challenge.endDate) : null),
    [myAllMeals, challenge?.startDate, challenge?.endDate]
  )
  const partnerStreakById = useMemo(() => {
    if (!challenge) return {}
    const entries = partners.map((member) => {
      const meals = partnerAllMealsMap[member.id] ?? []
      return [member.id, computeMealStreaks(meals, challenge.startDate, challenge.endDate)]
    })
    return Object.fromEntries(entries) as Record<string, ReturnType<typeof computeMealStreaks>>
  }, [partners, partnerAllMealsMap, challenge?.startDate, challenge?.endDate])
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [loadingCode, setLoadingCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [ending, setEnding] = useState(false)
  const [showCongratsPopup, setShowCongratsPopup] = useState(false)

  const handleEndChallenge = async () => {
    if (!confirm('End this challenge? All members will be able to start a new one.')) return
    if (!user || !challenge) return
    setEnding(true)
    try {
      await cancelChallenge(challenge.id)
      await resetLoginStreak(user.uid)
      await updateUserDoc(user.uid, { challengeId: undefined, partnerId: undefined })
      partners.forEach((member) => {
        if (member.id === user.uid) return
        // Firestore rules allow non-self writes for partnerId only.
        updateUserDoc(member.id, { partnerId: undefined }).catch((err) => {
          console.warn('Partner challenge cleanup failed:', err)
        })
      })
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
    challenge.status === 'completed' ||
    (challenge.status === 'active' && isChallengeTimeComplete(challenge))
  )
  const challengeEnded = challenge?.status === 'cancelled'

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
              {challengeCompleted ? 'Challenge Complete' : challengeEnded ? 'Challenge Ended' : 'No Active Challenge'}
            </h2>
            <p className="text-gray-500 mb-6">
              {challengeCompleted
                ? 'Nice work — your results are ready.'
                : challengeEnded
                  ? 'This challenge was ended early. Start a new one anytime.'
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
  const { currentDay } = challengeDayProgress(challenge.startDate, challenge.endDate)
  const reminderIndex = Math.max(0, Math.min(DAY_REMINDERS.length - 1, currentDay - 1))
  const dayReminder = DAY_REMINDERS[reminderIndex]

  const firstName = (userDoc?.name ?? user?.displayName ?? '').split(' ')[0]
  const streakCount = myStreak?.currentStreak ?? 0
  const partnerCount = partners.length
  const isChallengeCreator = challenge.users[0] === user?.uid
  const shouldPromptMealLog = myMeals.length === 0

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:py-6">
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
            <p className="hidden sm:block mt-2 mb-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[0.95rem] font-semibold text-orange-800">
              Reminder: {dayReminder}
            </p>
          </div>
          <div className="flex gap-2">
            {isChallengeCreator && (
              <Button variant="outline" size="sm" onClick={handleShareCode} disabled={loadingCode}>
                {loadingCode ? 'Loading...' : 'Share Code'}
              </Button>
            )}
            {isChallengeCreator && (
              <Button variant="outline" size="sm" onClick={handleEndChallenge} disabled={ending} className="text-red-500 border-red-200 hover:bg-red-50">
                {ending ? 'Ending...' : 'End Challenge'}
              </Button>
            )}
          </div>
        </div>
        <p className="sm:hidden mt-3 mb-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[0.95rem] font-semibold text-orange-800">
          Reminder: {dayReminder}
        </p>
      </div>

      <ChallengeProgress challenge={challenge} />
      <SecretChallenge />
      {shouldPromptMealLog && (
        <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700">
          Log in your meal to update your streak!
        </div>
      )}

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

        {partners.length > 0 ? (
          partners.map((member: UserDoc) => (
            <div key={member.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <UserColumn
                name={getUserDisplayName(member)}
                photoUrl={member.photoUrl}
                meals={partnerMealsMap[member.id] ?? []}
                streakCount={partnerStreakById[member.id]?.currentStreak ?? 0}
                isCurrentUser={false}
              />
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-gray-400 text-sm mb-4">Waiting for others to join...</p>
              <Button variant="outline" size="sm" onClick={handleShareCode} disabled={loadingCode}>
                {loadingCode ? 'Loading...' : 'Share Invite Code'}
              </Button>
            </div>
          </div>
        )}

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

      {partnerCount > 1 && (
        <p className="mt-4 text-xs text-gray-500">Active members: You + {partnerCount} others</p>
      )}

      <div className="md:hidden mt-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Activity Feed</h2>
        <ActivityFeed challengeId={challenge.id} currentUserId={user?.uid ?? ''} />
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
