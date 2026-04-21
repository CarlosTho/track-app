'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MealTypeSelector } from './MealTypeSelector'
import { ComplianceToggle } from './ComplianceToggle'
import { logMeal } from '@/lib/firestore/meals'
import { updateStreak } from '@/lib/firestore/streaks'
import { getMealsForDateRange } from '@/lib/firestore/meals'
import { suggestCompliance } from '@/lib/rules-engine'
import type { Challenge, MealType } from '@/lib/types'
import { easternDateString } from '@/lib/easternTime'
import { toast } from 'sonner'

interface MealFormProps {
  userId: string
  challenge: Challenge
}

export function MealForm({ userId, challenge }: MealFormProps) {
  const router = useRouter()
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [description, setDescription] = useState('')
  const [isCompliant, setIsCompliant] = useState(true)
  const [notes, setNotes] = useState('')
  const [flags, setFlags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (description.length > 2) {
      const suggestion = suggestCompliance(description, challenge.rules)
      setFlags(suggestion.flags)
      setIsCompliant(suggestion.isCompliant)
    }
  }, [description, challenge.rules])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return

    setSubmitting(true)
    try {
      const today = easternDateString()
      await logMeal({
        userId,
        challengeId: challenge.id,
        date: today,
        mealType,
        description: description.trim(),
        isCompliant,
        notes: notes.trim() || undefined,
      })

      // Streak update is best-effort — don't block navigation if index not ready
      try {
        const todaysMeals = await getMealsForDateRange(challenge.id, userId, today, today)
        const allCompliant = todaysMeals.every((m) => m.isCompliant)
        await updateStreak(userId, allCompliant)
      } catch (streakErr) {
        console.warn('Streak update skipped:', streakErr)
      }

      toast.success('Meal logged!')
      router.push('/dashboard')
    } catch (err) {
      console.error('logMeal error:', err)
      toast.error('Failed to log meal. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <MealTypeSelector value={mealType} onChange={setMealType} />

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">What did you eat?</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Grilled chicken with rice and veggies"
          className="text-base"
          required
        />
      </div>

      <ComplianceToggle value={isCompliant} onChange={setIsCompliant} flags={flags} />

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes..."
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600"
        size="lg"
        disabled={submitting || !description.trim()}
      >
        {submitting ? 'Logging...' : 'Log Meal'}
      </Button>
    </form>
  )
}
