'use client'

import { useState } from 'react'
import { SignInForm } from '@/components/auth/SignInForm'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

type AuthTab = 'signin' | 'signup'

export default function AuthPage() {
  const [tab, setTab] = useState<AuthTab>('signin')

  const isSignIn = tab === 'signin'
  const heading = isSignIn ? 'Welcome back' : 'Create your account'
  const subheading = isSignIn
    ? 'Sign in to continue your challenge'
    : 'Sign up to start your first challenge'

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-orange-500 font-bold text-2xl">
            <Flame className="w-7 h-7" />
            TrackPair
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6 sm:p-7">
          <div
            role="tablist"
            aria-label="Sign in or sign up"
            className="relative grid grid-cols-2 rounded-full bg-gray-100 p-1 mb-6"
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm transition-all duration-300 ease-out',
                isSignIn ? 'left-1' : 'left-[calc(50%+0rem)]'
              )}
            />
            <button
              type="button"
              role="tab"
              aria-selected={isSignIn}
              onClick={() => setTab('signin')}
              className={cn(
                'relative z-10 rounded-full py-2 text-sm font-semibold transition-colors',
                isSignIn ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isSignIn}
              onClick={() => setTab('signup')}
              className={cn(
                'relative z-10 rounded-full py-2 text-sm font-semibold transition-colors',
                !isSignIn ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Sign up
            </button>
          </div>

          <div className="mb-5">
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
              {heading}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{subheading}</p>
          </div>

          {isSignIn ? <SignInForm /> : <SignUpForm />}

          <div className="relative my-6">
            <div className="h-px bg-gray-200" />
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-400">
              or
            </span>
          </div>

          <GoogleSignInButton />

          <p className="text-center text-sm text-gray-500 mt-6">
            {isSignIn ? (
              <>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className="font-semibold text-orange-600 hover:text-orange-700"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className="font-semibold text-orange-600 hover:text-orange-700"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
