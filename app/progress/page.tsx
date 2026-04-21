'use client'

import { useState, useEffect, useMemo } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { subscribeMealsForDateRange } from '@/lib/firestore/meals'
import { computeMealStreaks } from '@/lib/streaks'
import { CalendarHeatmap } from '@/components/progress/CalendarHeatmap'
import { StatsCard } from '@/components/progress/StatsCard'
import type { Meal } from '@/lib/types'
import { getUserDisplayName } from '@/lib/userDisplay'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Trophy, Flame } from 'lucide-react'
import { getMotivationalMessage } from '@/lib/motivation'
import { challengeDayProgress } from '@/lib/easternTime'
import { getChallengeEndAt, isChallengeTimeComplete } from '@/lib/firestore/challenges'

function CongratulationsScreen({
  myName,
  partnerName,
  myMeals,
  partnerMeals,
  myCompliance,
  partnerCompliance,
  myStreak,
  partnerStreak,
  totalDays,
}: {
  myName: string
  partnerName: string
  myMeals: Meal[]
  partnerMeals: Meal[]
  myCompliance: number
  partnerCompliance: number
  myStreak: number
  partnerStreak: number
  totalDays: number
}) {
  const winner =
    myCompliance > partnerCompliance
      ? myName
      : partnerCompliance > myCompliance
        ? partnerName
        : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      {/* Trophy */}
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
          <Trophy className="w-12 h-12 text-white" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Challenge Complete! 🎉</h1>
      <p className="text-gray-500 mb-8">
        {totalDays} days down. You both showed up and did the work.
      </p>

      {/* Winner banner */}
      {winner ? (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 mb-8 text-white">
          <p className="text-sm font-medium opacity-90">Winner</p>
          <p className="text-2xl font-bold">{winner} 🏆</p>
          <p className="text-sm opacity-80 mt-1">
            {winner === myName ? myCompliance : partnerCompliance}% compliance
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 mb-8 text-white">
          <p className="text-sm font-medium opacity-90">It&apos;s a tie!</p>
          <p className="text-2xl font-bold">You both win 🤝</p>
          <p className="text-sm opacity-80 mt-1">{myCompliance}% compliance each</p>
        </div>
      )}

      {/* Stats comparison */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { name: myName, meals: myMeals, compliance: myCompliance, streak: myStreak, isMe: true },
          { name: partnerName, meals: partnerMeals, compliance: partnerCompliance, streak: partnerStreak, isMe: false },
        ].map(({ name, meals, compliance, streak, isMe }) => (
          <div key={name} className={`bg-white rounded-2xl p-5 shadow-sm border ${isMe ? 'border-orange-200' : 'border-blue-200'}`}>
            <p className={`text-sm font-semibold mb-3 ${isMe ? 'text-orange-600' : 'text-blue-600'}`}>{name}</p>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-gray-900">{compliance}%</p>
                <p className="text-xs text-gray-400">Compliance</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{meals.length}</p>
                <p className="text-xs text-gray-400">Meals logged</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 text-orange-400" />{streak}
                </p>
                <p className="text-xs text-gray-400">Best streak</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/invite">
          <Button className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto">
            Rematch? 🔄
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" className="w-full sm:w-auto">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

function ProgressContent() {
  const { user, userDoc } = useAuth()
  const { challenge, partner, loading } = useChallenge()

  const [myMeals, setMyMeals] = useState<Meal[]>([])
  const [partnerMeals, setPartnerMeals] = useState<Meal[]>([])
  const [timeTick, setTimeTick] = useState(0)

  const myStreak = useMemo(
    () => (challenge ? computeMealStreaks(myMeals, challenge.startDate, challenge.endDate) : null),
    [myMeals, challenge?.startDate, challenge?.endDate]
  )
  const partnerStreak = useMemo(
    () => (challenge ? computeMealStreaks(partnerMeals, challenge.startDate, challenge.endDate) : null),
    [partnerMeals, challenge?.startDate, challenge?.endDate]
  )

  useEffect(() => {
    if (!challenge || !user) return
    return subscribeMealsForDateRange(
      challenge.id,
      user.uid,
      challenge.startDate,
      challenge.endDate,
      setMyMeals
    )
  }, [challenge, user])

  useEffect(() => {
    if (!challenge || !partner) return
    return subscribeMealsForDateRange(
      challenge.id,
      partner.id,
      challenge.startDate,
      challenge.endDate,
      setPartnerMeals
    )
  }, [challenge, partner])

  useEffect(() => {
    if (!challenge || challenge.status !== 'active') return
    const endAt = getChallengeEndAt(challenge)
    const msLeft = endAt.getTime() - Date.now()
    if (msLeft <= 0) return
    const timer = setTimeout(() => setTimeTick((t) => t + 1), msLeft + 10)
    return () => clearTimeout(timer)
  }, [challenge])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No active challenge yet.</p>
          <Link href="/invite">
            <Button className="bg-orange-500 hover:bg-orange-600">Start a Challenge</Button>
          </Link>
        </div>
      </div>
    )
  }

  const myName = userDoc?.name ?? user?.displayName ?? 'You'
  const partnerName = partner ? getUserDisplayName(partner) : 'Partner'

  const myCompliance = myMeals.length > 0
    ? Math.round((myMeals.filter((m) => m.isCompliant).length / myMeals.length) * 100)
    : 0
  const partnerCompliance = partnerMeals.length > 0
    ? Math.round((partnerMeals.filter((m) => m.isCompliant).length / partnerMeals.length) * 100)
    : 0

  const { totalDays, currentDay } = challengeDayProgress(challenge.startDate, challenge.endDate)
  void timeTick
  const isTimeComplete = challenge.status === 'active' && isChallengeTimeComplete(challenge)

  if (challenge.status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Challenge Ended</h2>
          <p className="text-gray-500 mb-6">This challenge was ended early.</p>
          <Link href="/invite">
            <Button className="bg-orange-500 hover:bg-orange-600">Start a New Challenge</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Show congratulations screen if challenge is completed
  if (challenge.status === 'completed' || isTimeComplete) {
    return (
      <CongratulationsScreen
        myName={myName}
        partnerName={partnerName}
        myMeals={myMeals}
        partnerMeals={partnerMeals}
        myCompliance={myCompliance}
        partnerCompliance={partnerCompliance}
        myStreak={myStreak?.longestStreak ?? 0}
        partnerStreak={partnerStreak?.longestStreak ?? 0}
        totalDays={totalDays}
      />
    )
  }

  const motivation = getMotivationalMessage(currentDay, totalDays, myCompliance)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Motivational banner */}
      <div className={`bg-gradient-to-r ${motivation.color} rounded-2xl p-5 mb-6 text-gray-900 shadow-sm`}>
        <div className="flex items-center gap-3">
          <div>
            <p className="font-bold text-lg leading-tight">{motivation.title}</p>
            <p className="text-sm opacity-90 mt-0.5">{motivation.subtitle}</p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-2xl font-bold">{myCompliance}%</p>
            <p className="text-xs opacity-80">your compliance</p>
          </div>
        </div>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-1">Progress</h1>
      <p className="text-sm text-gray-500 mb-6">{challenge.startDate} → {challenge.endDate}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatsCard
          name={myName}
          meals={myMeals}
          streak={myStreak}
          startDate={challenge.startDate}
          endDate={challenge.endDate}
        />
        {partner && (
          <StatsCard
            name={partnerName}
            meals={partnerMeals}
            streak={partnerStreak}
            startDate={challenge.startDate}
            endDate={challenge.endDate}
          />
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="font-semibold text-gray-900 mb-1">Your Calendar</h2>
        <p className="text-xs text-gray-400 mb-4">Green = fully compliant · Red = broke a rule · Gray = no logs</p>
        <CalendarHeatmap
          meals={myMeals}
          startDate={challenge.startDate}
          endDate={challenge.endDate}
        />
      </div>

      {partner && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-1">{partnerName}&apos;s Calendar</h2>
          <p className="text-xs text-gray-400 mb-4">Green = fully compliant · Red = broke a rule · Gray = no logs</p>
          <CalendarHeatmap
            meals={partnerMeals}
            startDate={challenge.startDate}
            endDate={challenge.endDate}
          />
        </div>
      )}
    </div>
  )
}

export default function ProgressPage() {
  return (
    <AuthGuard>
      <ProgressContent />
    </AuthGuard>
  )
}
