'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { extendChallenge } from '@/lib/firestore/challenges'
import { addCalendarDays, diffCalendarDays, easternFormat } from '@/lib/easternTime'
import type { Challenge } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const DURATION_OPTIONS = [7, 14, 30] as const

interface ExtendChallengeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenge: Challenge
}

export function ExtendChallengeDialog({ open, onOpenChange, challenge }: ExtendChallengeDialogProps) {
  const currentDuration =
    challenge.durationDays ?? diffCalendarDays(challenge.endDate, challenge.startDate) + 1

  const availableOptions = useMemo(
    () => DURATION_OPTIONS.filter((d) => d > currentDuration),
    [currentDuration]
  )

  const [selected, setSelected] = useState<number | null>(availableOptions[0] ?? null)
  const [saving, setSaving] = useState(false)

  const handleConfirm = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await extendChallenge(challenge.id, selected)
      toast.success(`Challenge extended to ${selected} days`)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to extend challenge:', err)
      const message = err instanceof Error ? err.message : 'Could not extend challenge'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const previewEndDate = selected
    ? addCalendarDays(challenge.startDate, selected - 1)
    : challenge.endDate

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Extend challenge</DialogTitle>
          <DialogDescription>
            Add more days without resetting your progress. Your start date, streaks, and logged
            meals all stay the same.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
            Currently: {currentDuration} days · ends{' '}
            {easternFormat(new Date(challenge.endDate + 'T12:00:00.000Z'), 'MMM d, yyyy')}
          </div>

          {availableOptions.length === 0 ? (
            <p className="text-sm text-gray-500">
              You&apos;re already on the longest available duration ({currentDuration} days).
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">New total length</p>
              <div className="grid grid-cols-3 gap-2">
                {availableOptions.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelected(d)}
                    className={cn(
                      'min-w-0 py-3 rounded-lg border-2 text-sm font-medium transition-all',
                      selected === d
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-500 hover:border-orange-300'
                    )}
                  >
                    <div className="font-semibold">{d} days</div>
                    <div className="text-[10px] font-normal text-gray-400">
                      +{d - currentDuration} more
                    </div>
                  </button>
                ))}
              </div>

              {selected && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  New end date:{' '}
                  <span className="font-semibold text-gray-900">
                    {easternFormat(new Date(previewEndDate + 'T12:00:00.000Z'), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            onClick={handleConfirm}
            disabled={saving || availableOptions.length === 0 || !selected}
          >
            {saving ? 'Extending...' : 'Extend Challenge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
