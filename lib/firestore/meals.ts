import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Meal } from '@/lib/types'
import { easternDateString } from '@/lib/easternTime'

export async function logMeal(data: Omit<Meal, 'id' | 'createdAt'>): Promise<Meal> {
  const ref = doc(collection(db, 'meals'))
  const raw: Meal = {
    ...data,
    id: ref.id,
    createdAt: new Date().toISOString(),
  }
  // Strip undefined fields — Firestore rejects them
  const meal = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined)
  ) as Meal
  await setDoc(ref, meal)
  return meal
}

export async function deleteMeal(mealId: string): Promise<void> {
  await deleteDoc(doc(db, 'meals', mealId))
}

export async function updateMeal(
  mealId: string,
  data: Partial<Pick<Meal, 'description' | 'isCompliant'>>
): Promise<void> {
  await updateDoc(doc(db, 'meals', mealId), data)
}

export function subscribeTodaysMeals(
  challengeId: string,
  userId: string,
  callback: (meals: Meal[]) => void
): () => void {
  const today = easternDateString()
  const q = query(
    collection(db, 'meals'),
    where('challengeId', '==', challengeId),
    where('userId', '==', userId),
    where('date', '==', today)
  )
  return onSnapshot(q, (snap) => {
    const meals = snap.docs.map((d) => d.data() as Meal)
    meals.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    callback(meals)
  }, (err) => {
    console.error('subscribeTodaysMeals error:', err)
  })
}

export function subscribeRecentFeed(
  challengeId: string,
  callback: (meals: Meal[]) => void
): () => void {
  const q = query(
    collection(db, 'meals'),
    where('challengeId', '==', challengeId)
  )
  return onSnapshot(q, (snap) => {
    const meals = snap.docs.map((d) => d.data() as Meal)
    meals.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    callback(meals.slice(0, 20))
  }, (err) => {
    console.error('subscribeRecentFeed error:', err)
  })
}

export async function getMealsForDateRange(
  challengeId: string,
  userId: string,
  startDate: string,
  endDate: string
): Promise<Meal[]> {
  const q = query(
    collection(db, 'meals'),
    where('challengeId', '==', challengeId),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  const meals = snap.docs
    .map((d) => d.data() as Meal)
    .filter((m) => m.date >= startDate && m.date <= endDate)
  meals.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
  return meals
}

export function subscribeMealsForDateRange(
  challengeId: string,
  userId: string,
  startDate: string,
  endDate: string,
  callback: (meals: Meal[]) => void
): () => void {
  const q = query(
    collection(db, 'meals'),
    where('challengeId', '==', challengeId),
    where('userId', '==', userId)
  )

  return onSnapshot(
    q,
    (snap) => {
      const meals = snap.docs
        .map((d) => d.data() as Meal)
        .filter((m) => m.date >= startDate && m.date <= endDate)
      meals.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
      callback(meals)
    },
    (err) => {
      console.error('subscribeMealsForDateRange error:', err)
    }
  )
}
