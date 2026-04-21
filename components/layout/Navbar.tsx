'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Flame,
  LogOut,
  BarChart2,
  LayoutDashboard,
  UtensilsCrossed,
  House,
  Plus,
  User,
} from 'lucide-react'

export function Navbar() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (!user) return null
  if (pathname === '/') return null

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))

  return (
    <>
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-orange-500 text-lg select-none cursor-default">
            <Flame className="w-6 h-6" />
            TrackPair
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hidden sm:flex items-center gap-1 text-sm text-gray-600 hover:text-orange-500">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/log" className="hidden sm:flex items-center gap-1 text-sm text-gray-600 hover:text-orange-500">
              <UtensilsCrossed className="w-4 h-4" />
              Log Meal
            </Link>
            <Link href="/progress" className="hidden sm:flex items-center gap-1 text-sm text-gray-600 hover:text-orange-500">
              <BarChart2 className="w-4 h-4" />
              Progress
            </Link>
            <Link href="/profile" aria-label="Open profile">
              <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-transparent transition hover:ring-orange-200">
                <AvatarImage src={user.photoURL ?? undefined} />
                <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
                  {user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-500">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        <div className="relative mx-auto max-w-md px-3 pt-1.5">
          <div className="grid grid-cols-4 items-end text-[10px]">
            <Link
              href="/dashboard"
              className={`flex flex-col items-center gap-0.5 py-1.5 transition-colors ${
                isActive('/dashboard') ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              <House className="h-4 w-4" />
              Home
            </Link>

            <div className="flex justify-center">
              <Link
                href="/log"
                aria-label="Log meal"
                className="tp-fab-shadow mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white transition-transform active:scale-95"
              >
                <Plus className="h-6 w-6" />
              </Link>
            </div>

            <Link
              href="/progress"
              className={`flex flex-col items-center gap-0.5 py-1.5 transition-colors ${
                isActive('/progress') ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              <BarChart2 className="h-4 w-4" />
              Progress
            </Link>

            <Link
              href="/profile"
              className={`flex flex-col items-center gap-0.5 py-1.5 transition-colors ${
                isActive('/profile') ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
