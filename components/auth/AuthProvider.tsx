'use client'

import { useState, useEffect, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { createUserDoc, getUserDoc } from '@/lib/firestore/users'
import { recordLogin } from '@/lib/firestore/loginStreak'
import { AuthContext, type AuthContextValue } from '@/lib/hooks/useAuth'
import type { UserDoc } from '@/lib/types'

const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null)
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Failed to set auth persistence:', err)
    })
  }, [])

  useEffect(() => {
    let unsubDoc: (() => void) | null = null

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (unsubDoc) { unsubDoc(); unsubDoc = null }

      if (firebaseUser) {
        unsubDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), async (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserDoc
            // Repair doc if name is missing (can happen from partial joins)
            if (!data.name && (firebaseUser.displayName || firebaseUser.email)) {
              await createUserDoc(firebaseUser.uid, {
                name: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
                email: firebaseUser.email ?? data.email ?? '',
                photoUrl: firebaseUser.photoURL ?? data.photoUrl ?? undefined,
              })
            } else {
              setUserDoc(data)
              setLoading(false)
            }
          } else {
            // Doc doesn't exist at all — create it
            await createUserDoc(firebaseUser.uid, {
              name: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
              email: firebaseUser.email ?? '',
              photoUrl: firebaseUser.photoURL ?? undefined,
            })
          }
        })
      } else {
        setUserDoc(null)
        setLoading(false)
      }
    })

    return () => {
      unsubAuth()
      if (unsubDoc) unsubDoc()
    }
  }, [])

  useEffect(() => {
    if (!user?.uid || !userDoc?.challengeId) return
    // Centralized daily streak recording: sign-in anywhere in-app counts.
    recordLogin(user.uid, userDoc.challengeId).catch((err) => {
      console.warn('recordLogin failed:', err)
    })
  }, [user?.uid, userDoc?.challengeId])

  const signIn = async (email: string, password: string) => {
    await setPersistence(auth, browserLocalPersistence)
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, name: string) => {
    await setPersistence(auth, browserLocalPersistence)
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    await createUserDoc(cred.user.uid, {
      name,
      email,
      photoUrl: cred.user.photoURL ?? undefined,
    })
    const doc = await getUserDoc(cred.user.uid)
    setUserDoc(doc)
  }

  const signInWithGoogle = async () => {
    await setPersistence(auth, browserLocalPersistence)
    const cred = await signInWithPopup(auth, googleProvider)
    const existing = await getUserDoc(cred.user.uid)
    if (!existing) {
      await createUserDoc(cred.user.uid, {
        name: cred.user.displayName ?? 'User',
        email: cred.user.email ?? '',
        photoUrl: cred.user.photoURL ?? undefined,
      })
      const doc = await getUserDoc(cred.user.uid)
      setUserDoc(doc)
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
