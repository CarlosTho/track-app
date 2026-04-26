'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Heart } from 'lucide-react'
import { MELON_WORD } from '@/lib/melonTheme'
import { useAuth } from '@/lib/hooks/useAuth'
import { updateUserDoc } from '@/lib/firestore/users'

export function SecretChallenge() {
  const { user, userDoc } = useAuth()
  const [value, setValue] = useState('')
  const [tries, setTries] = useState(0)
  const [showHearts, setShowHearts] = useState(false)
  const [saving, setSaving] = useState(false)
  const heartsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unlocked = userDoc?.uiTheme === 'melon'

  useEffect(() => {
    return () => {
      if (heartsTimer.current) clearTimeout(heartsTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!unlocked) return
    setValue('')
  }, [unlocked])

  const handleGuess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (unlocked || !user || saving) return
    setTries((t) => t + 1)
    if (value.trim().toLowerCase() === MELON_WORD) {
      setSaving(true)
      try {
        await updateUserDoc(user.uid, { uiTheme: 'melon' })
        setShowHearts(true)
        if (heartsTimer.current) clearTimeout(heartsTimer.current)
        heartsTimer.current = setTimeout(() => setShowHearts(false), 4500)
      } catch (err) {
        console.warn('Failed to save melon theme:', err)
      } finally {
        setSaving(false)
      }
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 relative overflow-hidden">
      {showHearts && (
        <div className="pointer-events-none fixed inset-0 z-[90]" aria-hidden>
          {Array.from({ length: 36 }).map((_, i) => {
            const hearts = ['❤️', '💖', '💕', '💗', '💘']
            return (
              <span
                key={i}
                className="tp-heart-rise"
                style={{
                  left: `${(i * 7.3) % 100}%`,
                  fontSize: `${22 + (i % 5) * 6}px`,
                  animationDelay: `${(i % 10) * 0.18}s`,
                  animationDuration: `${3.2 + (i % 6) * 0.35}s`,
                }}
              >
                {hearts[i % hearts.length]}
              </span>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
        <h3 className="font-semibold text-gray-900">Guess the word</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">(for a surprise)</p>

      {unlocked ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm font-medium text-pink-600 bg-pink-50 border border-pink-200 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Te amo, bebeshita 💖
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-pink-300 text-pink-600 hover:bg-pink-100"
            disabled={!user || saving}
            onClick={async () => {
              if (!user || saving) return
              setSaving(true)
              try {
                await updateUserDoc(user.uid, { uiTheme: 'orange' })
                setValue('')
              } catch (err) {
                console.warn('Failed to reset theme:', err)
              } finally {
                setSaving(false)
              }
            }}
          >
            Change it back
          </Button>
        </div>
      ) : (
        <form onSubmit={handleGuess} className="flex flex-col sm:flex-row gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your guess"
            className="sm:max-w-xs"
          />
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
            {saving ? 'Saving...' : 'Try'}
          </Button>
          <span className="text-xs text-gray-400 self-center">Unlimited tries {tries > 0 ? `· ${tries}` : ''}</span>
        </form>
      )}
    </div>
  )
}
