'use client'

import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'
import type { UserDoc } from '@/lib/types'

export interface AuthContextValue {
  user: User | null
  userDoc: UserDoc | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
