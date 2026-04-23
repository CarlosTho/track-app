'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MealTypeSelector } from './MealTypeSelector'
import { ComplianceToggle } from './ComplianceToggle'
import { logMeal } from '@/lib/firestore/meals'
import { updateStreak } from '@/lib/firestore/streaks'
import { getMealsForDateRange } from '@/lib/firestore/meals'
import { uploadMealPhoto } from '@/lib/firestore/mealPhotos'
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
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large (max 10MB)')
      return
    }
    setPhoto(file)
  }

  const clearPhoto = () => {
    setPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

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
      let photoUrl: string | undefined
      if (photo) {
        try {
          photoUrl = await uploadMealPhoto(userId, photo)
        } catch (uploadErr) {
          console.error('uploadMealPhoto error:', uploadErr)
          toast.error('Photo upload failed, logging meal without photo')
        }
      }
      await logMeal({
        userId,
        challengeId: challenge.id,
        date: today,
        mealType,
        description: description.trim(),
        isCompliant,
        notes: notes.trim() || undefined,
        photoUrl,
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

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Photo (optional)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
        {photoPreview ? (
          <div className="relative inline-block">
            <img
              src={photoPreview}
              alt="Meal preview"
              className="h-32 w-32 rounded-lg object-cover border border-gray-200"
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute -top-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-white shadow hover:bg-gray-900"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
          >
            <Camera className="h-4 w-4" />
            Add photo
          </button>
        )}
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
