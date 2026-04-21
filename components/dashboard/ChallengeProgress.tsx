'use client'

import { useState, useEffect } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import {
  APP_TIMEZONE,
  challengeDayProgress,
  eachChallengeDayYmd,
} from '@/lib/easternTime'
import type { Challenge } from '@/lib/types'
import { getChallengeEndAt, getChallengeStartAt } from '@/lib/firestore/challenges'

interface ChallengeProgressProps {
  challenge: Challenge
}

export function ChallengeProgress({ challenge }: ChallengeProgressProps) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // tick forces re-render for live clock
  const now = new Date()
  void tick

  const startAt = getChallengeStartAt(challenge)
  const endAt = getChallengeEndAt(challenge)

  const { startDate: startYmd, endDate: endYmd } = challenge
  const { currentDay, totalDays, todayYmd } = challengeDayProgress(startYmd, endYmd, now)
  const dayYmds = eachChallengeDayYmd(startYmd, endYmd)

  const clock = formatInTimeZone(now, APP_TIMEZONE, 'h:mm:ss a')
  const createdLabel = formatInTimeZone(startAt, APP_TIMEZONE, 'MMM d, yyyy · h:mm a')
  const completeLabel = formatInTimeZone(endAt, APP_TIMEZONE, 'MMM d, yyyy · h:mm a')

  const msRemaining = Math.max(endAt.getTime() - now.getTime(), 0)
  const msTotal = Math.max(endAt.getTime() - startAt.getTime(), 1)
  const msElapsed = Math.min(Math.max(now.getTime() - startAt.getTime(), 0), msTotal)
  const progressPct = (msElapsed / msTotal) * 100
  const totalSeconds = Math.floor(msRemaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const exactCountdown =
    msRemaining === 0
      ? 'Complete!'
      : `${days}d ${hours.toString().padStart(2, '0')}h ${minutes
          .toString()
          .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s left`

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900">
            Day {currentDay} of {totalDays}
          </h2>
          <p className="text-sm font-semibold text-gray-600 mt-0.5">
            {formatInTimeZone(new Date(startYmd + 'T12:00:00.000Z'), APP_TIMEZONE, 'MMM d')} —{' '}
            {formatInTimeZone(new Date(endYmd + 'T12:00:00.000Z'), APP_TIMEZONE, 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-gray-500 mt-2">Created: {createdLabel} ET</p>
          <p className="text-xs text-gray-500">Completes: {completeLabel} ET</p>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <p className="text-lg font-mono font-semibold text-gray-900 tabular-nums">{clock}</p>
          <p className="text-xs text-gray-400">Eastern Time</p>
          <p className="text-xs font-semibold text-orange-600 mt-1">{exactCountdown}</p>
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
        <div
          className="bg-orange-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {dayYmds.map((dayYmd, i) => {
          const dayNum = i + 1
          const isToday = dayYmd === todayYmd
          const isPast = dayYmd < todayYmd
          const weekday = formatInTimeZone(new Date(dayYmd + 'T12:00:00.000Z'), APP_TIMEZONE, 'EEE')

          return (
            <div
              key={dayYmd}
              className={`
                relative flex flex-col items-center justify-center rounded-lg py-1 sm:py-1.5 text-[10px] sm:text-xs transition-all min-w-0
                ${isToday
                  ? 'bg-orange-500 text-white ring-2 ring-orange-300 ring-offset-1 shadow-sm'
                  : isPast
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-50 text-gray-400'
                }
              `}
            >
              <span className="font-bold text-xs sm:text-sm tabular-nums">{dayNum}</span>
              <span
                className={`text-[9px] sm:text-[10px] leading-none mt-0.5 truncate max-w-full ${
                  isToday ? 'text-orange-100' : isPast ? 'text-green-600' : 'text-gray-300'
                }`}
              >
                {weekday}
              </span>
              {isPast && (
                <span className="absolute -top-0.5 -right-0.5 text-[10px] text-green-600" aria-hidden>
                  ✓
                </span>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-gray-400 mt-3">
        {msRemaining === 0
          ? 'Challenge complete!'
          : totalDays - currentDay === 0
          ? 'Last day — finish strong!'
          : `${totalDays - currentDay} day${totalDays - currentDay === 1 ? '' : 's'} left`}
      </p>
    </div>
  )
}
