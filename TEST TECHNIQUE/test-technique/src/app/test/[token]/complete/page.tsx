'use client'

import { useEffect, useState, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { TestSession } from '@/lib/supabase'

export default function CompletePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [session, setSession] = useState<TestSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/sessions?token=${token}`)
      .then(res => res.json())
      .then(data => {
        setSession(data.session)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ia-cream">
        <Loader2 className="h-8 w-8 animate-spin text-ia-teal" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ia-cream flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-none shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-ia-teal rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl text-ia-dark font-heading">Test terminé !</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Merci {session?.candidate_name?.split(' ')[0]} pour votre participation.
          </p>
          <p className="text-gray-600">
            Vos réponses ont bien été enregistrées. Notre équipe les examinera dans les plus brefs délais.
          </p>
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Vous recevrez un retour par email à l&apos;adresse :
            </p>
            <p className="font-medium text-ia-teal">{session?.candidate_email}</p>
          </div>
          <div className="pt-6">
            <p className="text-sm text-gray-500">
              Intelligence Academy - Recrutement Formateurs
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
