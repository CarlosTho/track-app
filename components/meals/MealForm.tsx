'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X, ImagePlus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MealTypeSelector } from './MealTypeSelector'
import { ComplianceToggle } from './ComplianceToggle'
import { logMeal } from '@/lib/firestore/meals'
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
  const libraryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

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
    if (libraryInputRef.current) libraryInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
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
    if (!photo) {
      toast.error('Please add a photo of your meal')
      return
    }

    setSubmitting(true)
    try {
      const today = easternDateString()
      let photoUrl: string
      try {
        photoUrl = await uploadMealPhoto(userId, photo)
      } catch (uploadErr) {
        console.error('uploadMealPhoto error:', uploadErr)
        toast.error('Photo upload failed. Please try again.')
        setSubmitting(false)
        return
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
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-medium text-gray-700">
            Photo <span className="text-red-500">*</span>
          </label>
          <span className="text-xs font-semibold text-orange-600">Required</span>
        </div>

        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          className="hidden"
        />

        {photoPreview ? (
          <div className="space-y-2">
            <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 aspect-[4/3]">
              <img
                src={photoPreview}
                alt="Meal preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute top-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/75 active:scale-95"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/55 to-transparent p-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-white/90 truncate">
                  {photo?.name ?? 'Selected photo'}
                </p>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-sm hover:bg-white active:scale-95"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => libraryInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-sm hover:bg-white active:scale-95"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Change
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-orange-400 hover:bg-orange-50 active:scale-[0.98]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                <Camera className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600">
                Take Photo
              </span>
            </button>
            <button
              type="button"
              onClick={() => libraryInputRef.current?.click()}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-orange-400 hover:bg-orange-50 active:scale-[0.98]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                <ImagePlus className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600">
                Upload
              </span>
            </button>
          </div>
        )}
        <p className="text-xs text-gray-400">JPG, PNG, or HEIC · up to 10MB</p>
      </div>

      <Button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600"
        size="lg"
        disabled={submitting || !description.trim() || !photo}
      >
        {submitting ? 'Logging...' : 'Log Meal'}
      </Button>
    </form>
  )
}
