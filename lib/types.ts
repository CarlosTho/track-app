export interface UserDoc {
  id: string
  name: string
  email: string
  photoUrl?: string
  partnerId?: string
  challengeId?: string
  createdAt: string
}

export interface Challenge {
  id: string
  users: [string, string]
  durationDays?: number
  createdAt?: string
  startAt?: string
  endAt?: string
  completedAt?: string
  startDate: string
  endDate: string
  rules: {
    noAddedSugar: boolean
    noAddedSalt: boolean
  }
  status: 'active' | 'completed' | 'cancelled'
}

export interface InviteCode {
  code: string
  creatorId: string
  challengeId: string
  used: boolean
  claimedBy?: string
  expiresAt: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface Meal {
  id: string
  userId: string
  challengeId: string
  date: string
  mealType: MealType
  description: string
  isCompliant: boolean
  notes?: string
  photoUrl?: string
  createdAt: string
}

export interface Streak {
  userId: string
  currentStreak: number
  longestStreak: number
  lastCompliantDate?: string
}

export interface LoginStreak {
  userId: string
  currentStreak: number
  longestStreak: number
  lastLoginDate?: string
  challengeId?: string
}
