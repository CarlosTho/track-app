'use client'

import { useState, useEffect, useRef } from 'react'
import { subscribeRecentFeed, deleteMeal, updateMeal } from '@/lib/firestore/meals'
import { getUserDoc } from '@/lib/firestore/users'
import type { Meal, UserDoc } from '@/lib/types'
import { getUserDisplayName } from '@/lib/userDisplay'
import { CheckCircle2, XCircle, Trash2, Pencil, X, Check } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { toZonedTime, format as formatTZ } from 'date-fns-tz'

const TIMEZONE = 'America/New_York'

function formatMealTime(isoString: string): string {
  const zoned = toZonedTime(parseISO(isoString), TIMEZONE)
  return formatTZ(zoned, 'h:mm a', { timeZone: TIMEZONE })
}
import { toast } from 'sonner'

interface FeedEntry {
  meal: Meal
  user: UserDoc | null
}

interface ActivityFeedProps {
  challengeId: string
  currentUserId: string
}

function Avatar({ user, isYou }: { user: UserDoc | null; isYou: boolean }) {
  const name = isYou ? 'You' : getUserDisplayName(user)
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (user?.photoUrl) {
    return (
      <img
        src={user.photoUrl}
        alt={name}
        className={`w-8 h-8 rounded-full object-cover ring-2 ${
          isYou ? 'ring-orange-400' : 'ring-blue-400'
        }`}
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
        isYou ? 'bg-orange-400' : 'bg-blue-400'
      }`}
    >
      {initials}
    </div>
  )
}

function FeedItem({ meal, user, currentUserId }: FeedEntry & { currentUserId: string }) {
  const [editing, setEditing] = useState(false)
  const [editDesc, setEditDesc] = useState(meal.description)
  const [editCompliant, setEditCompliant] = useState(meal.isCompliant)
  const [saving, setSaving] = useState(false)
  const isOwner = meal.userId === currentUserId

  const handleDelete = async () => {
    if (!confirm('Delete this meal log?')) return
    try {
      await deleteMeal(meal.id)
      toast.success('Meal deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleSave = async () => {
    if (!editDesc.trim()) return
    setSaving(true)
    try {
      await updateMeal(meal.id, {
        description: editDesc.trim(),
        isCompliant: editCompliant,
      })
      setEditing(false)
      toast.success('Meal updated')
    } catch {
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
        <Avatar user={user} isYou={isOwner} />
        <div className="flex-1 space-y-2">
          <input
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            autoFocus
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={editCompliant}
                onChange={(e) => setEditCompliant(e.target.checked)}
                className="accent-green-500"
              />
              <span className={editCompliant ? 'text-green-600' : 'text-red-500'}>
                {editCompliant ? 'Compliant' : 'Not compliant'}
              </span>
            </label>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editDesc.trim()}
                className="text-green-500 hover:text-green-600 p-1 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 group">
      <Avatar user={user} isYou={isOwner} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${isOwner ? 'text-orange-600' : 'text-blue-600'}`}>
            {isOwner ? 'You' : getUserDisplayName(user)}
          </span>
          <span className="text-xs text-gray-400">
            {formatMealTime(meal.createdAt)} · {formatDistanceToNow(parseISO(meal.createdAt), { addSuffix: true })}
          </span>
          {meal.isCompliant ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-red-500" />
          )}
        </div>
        <p className="text-sm text-gray-700 mt-0.5">
          <span className="text-gray-400 capitalize">{meal.mealType}:</span>{' '}
          {meal.description}
        </p>
        {meal.notes && (
          <p className="text-sm text-gray-600 mt-1 pl-2 border-l-2 border-orange-200 italic">
            &ldquo;{meal.notes}&rdquo;
          </p>
        )}
      </div>
      {isOwner && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { setEditDesc(meal.description); setEditCompliant(meal.isCompliant); setEditing(true) }}
            className="text-gray-300 hover:text-orange-400 p-1"
            aria-label="Edit meal"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-300 hover:text-red-400 p-1"
            aria-label="Delete meal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

export function ActivityFeed({ challengeId, currentUserId }: ActivityFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>([])
  const userCacheRef = useRef<Record<string, UserDoc | null>>({})
  const seenNoteMealsRef = useRef<Set<string>>(new Set())
  const initializedRef = useRef(false)

  useEffect(() => {
    const unsub = subscribeRecentFeed(challengeId, async (meals) => {
      const cache = userCacheRef.current
      for (const meal of meals) {
        if (!(meal.userId in cache)) {
          cache[meal.userId] = await getUserDoc(meal.userId)
        }
      }

      if (!initializedRef.current) {
        for (const meal of meals) {
          if (meal.notes) seenNoteMealsRef.current.add(meal.id)
        }
        initializedRef.current = true
      } else {
        for (const meal of meals) {
          if (
            meal.notes &&
            meal.userId !== currentUserId &&
            !seenNoteMealsRef.current.has(meal.id)
          ) {
            const partner = cache[meal.userId]
            const name = getUserDisplayName(partner)
            toast.message(`${name} left a note`, {
              description: `"${meal.notes}"`,
              duration: 6000,
            })
          }
          if (meal.notes) seenNoteMealsRef.current.add(meal.id)
        }
      }

      setEntries(meals.map((meal) => ({ meal, user: cache[meal.userId] ?? null })))
    })
    return unsub
  }, [challengeId, currentUserId])

  if (entries.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        No activity yet. Log your first meal!
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map(({ meal, user }) => (
        <FeedItem key={meal.id} meal={meal} user={user} currentUserId={currentUserId} />
      ))}
    </div>
  )
}
