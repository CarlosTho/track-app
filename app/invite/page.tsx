'use client'

import { useState } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/lib/hooks/useAuth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateChallengeForm } from '@/components/invite/CreateChallengeForm'
import { JoinChallengeForm } from '@/components/invite/JoinChallengeForm'
import type { Challenge } from '@/lib/types'

function InviteContent() {
  const { user } = useAuth()
  const [, setChallenge] = useState<Challenge | null>(null)

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-start sm:items-center justify-center px-4 pt-8 pb-28 sm:py-12">
      <div className="w-full max-w-lg min-w-0">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Start Your Challenge</h1>
          <p className="text-gray-500 text-sm mt-1">Create a new challenge or join your partner&apos;s</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Challenge Setup</CardTitle>
            <CardDescription>One person creates, the other joins with a code</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="create" className="flex-1">Create Challenge</TabsTrigger>
                <TabsTrigger value="join" className="flex-1">Join with Code</TabsTrigger>
              </TabsList>
              <TabsContent value="create">
                <CreateChallengeForm userId={user.uid} onCreated={setChallenge} />
              </TabsContent>
              <TabsContent value="join">
                <JoinChallengeForm userId={user.uid} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <AuthGuard>
      <InviteContent />
    </AuthGuard>
  )
}
