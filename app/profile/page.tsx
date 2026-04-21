'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail, User } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

function ProfileContent() {
  const { user, userDoc } = useAuth()

  const name =
    userDoc?.name?.trim() ||
    user?.displayName?.trim() ||
    user?.email?.split('@')[0] ||
    'User'
  const email = userDoc?.email?.trim() || user?.email || 'No email available'
  const photoUrl = userDoc?.photoUrl || user?.photoURL || undefined
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Your account details (read-only).</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={photoUrl} />
              <AvatarFallback className="bg-orange-100 text-xl font-semibold text-orange-600">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-bold text-gray-900">{name}</p>
              <p className="text-sm text-gray-500">{email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <User className="h-3.5 w-3.5" />
                Name
              </p>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                {name}
              </div>
            </div>
            <div>
              <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <Mail className="h-3.5 w-3.5" />
                Email
              </p>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                {email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  )
}
