'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface InviteCodeDisplayProps {
  code: string
}

export function InviteCodeDisplay({ code }: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

      <Link href="/dashboard">
        <Button className="w-full bg-orange-500 hover:bg-orange-600">
          Go to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </div>
  )
}
