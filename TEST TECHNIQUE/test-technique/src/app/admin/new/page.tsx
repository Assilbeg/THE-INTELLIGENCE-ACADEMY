'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Copy, CheckCircle, Loader2, Send } from 'lucide-react'

export default function NewCandidatePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: name,
          candidate_email: email
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création')
        return
      }

      const link = `${window.location.origin}/test/${data.token}`
      setGeneratedLink(link)
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const sendEmail = () => {
    if (generatedLink) {
      const subject = encodeURIComponent('Test Technique - Intelligence Academy')
      const body = encodeURIComponent(
        `Bonjour ${name.split(' ')[0]},\n\n` +
        `Vous êtes invité(e) à passer le test technique pour rejoindre notre équipe de formateurs.\n\n` +
        `Cliquez sur le lien ci-dessous pour commencer :\n${generatedLink}\n\n` +
        `Durée estimée : 35-45 minutes\n` +
        `Nombre de questions : 36\n\n` +
        `Assurez-vous d'avoir :\n` +
        `- Une webcam fonctionnelle\n` +
        `- Un micro fonctionnel\n` +
        `- Un environnement calme\n\n` +
        `Bonne chance !\n\n` +
        `L'équipe Intelligence Academy`
      )
      window.open(`mailto:${email}?subject=${subject}&body=${body}`)
    }
  }

  const reset = () => {
    setName('')
    setEmail('')
    setGeneratedLink(null)
    setCopied(false)
  }

  return (
    <div className="min-h-screen bg-ia-cream p-4">
      <div className="max-w-lg mx-auto">
        <Link href="/admin">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-ia-dark">Nouveau candidat</CardTitle>
            <CardDescription>
              Créez un lien unique pour le test technique
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!generatedLink ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    placeholder="Jean Dupont"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jean@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-ia-teal hover:bg-ia-teal-light" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    'Générer le lien'
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <Alert className="bg-ia-teal/10 border-ia-teal/20">
                  <CheckCircle className="h-4 w-4 text-ia-teal" />
                  <AlertDescription className="text-ia-teal">
                    Lien créé avec succès pour <strong>{name}</strong>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Lien du test</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={generatedLink} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button onClick={copyLink} variant="outline">
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={sendEmail} className="w-full bg-ia-teal hover:bg-ia-teal-light">
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer par email
                  </Button>
                  <Button onClick={reset} variant="outline" className="w-full">
                    Créer un autre candidat
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
