'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, ArrowRight, Share2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface InviteCodeDisplayProps {
  code: string
}

const FALLBACK_APP_URL = 'https://track-app-sepia.vercel.app'

function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl) return envUrl
  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin
    }
  }
  return FALLBACK_APP_URL
}

export function InviteCodeDisplay({ code }: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    const url = getAppUrl()
    const shareText = `Join my TrackPair challenge! Use code ${code} at ${url}`

    setSharing(true)
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: 'TrackPair',
            text: `Join my TrackPair challenge! Use code ${code}`,
            url,
          })
          return
        } catch (err) {
          // User cancelled the share sheet — fail silently.
          if (err instanceof Error && err.name === 'AbortError') return
        }
      }

      try {
        await navigator.clipboard.writeText(shareText)
        toast.success('Invite copied. Paste it in Messages or anywhere.')
      } catch {
        toast.error('Could not share. Try the copy button instead.')
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="space-y-6 text-center">
      <div>
        <p className="text-sm text-gray-500 mb-2">Share this code with your partner</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-bold tracking-widest text-orange-500 font-mono">{code}</span>
          <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600 transition-colors">
            {copied ? <Check className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Expires in 24 hours</p>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p>Tell your partner to go to <strong>TrackPair</strong>, sign up, and enter this code on the invite page.</p>
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          variant="outline"
          className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {sharing ? 'Opening…' : 'Send App Link'}
        </Button>

        <Link href="/dashboard" className="block">
          <Button className="w-full bg-orange-500 hover:bg-orange-600">
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
