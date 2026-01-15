'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuestionCard } from '@/components/QuestionCard'
import { questions, blocs, getLevelLabel, totalQuestions, totalPoints } from '@/lib/questions'
import { TestSession, Response } from '@/lib/supabase'
import { ArrowLeft, Loader2, Video, FileText, CheckCircle, XCircle, User, Mail, Calendar } from 'lucide-react'

export default function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const [session, setSession] = useState<TestSession | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [sessionId])

  const fetchData = async () => {
    try {
      // Récupérer la session
      const sessRes = await fetch(`/api/sessions`)
      const sessData = await sessRes.json()
      const sess = sessData.sessions?.find((s: TestSession) => s.id === sessionId)
      
      if (sess) {
        setSession(sess)
        // Récupérer les réponses
        const respRes = await fetch(`/api/responses?session_id=${sessionId}`)
        const respData = await respRes.json()
        setResponses(respData.responses || [])
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Session non trouvée</p>
            <Link href="/admin">
              <Button className="mt-4">Retour</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedQ = selectedQuestion ? questions.find(q => q.number === selectedQuestion) : null
  const selectedResponse = selectedQuestion ? responses.find(r => r.question_number === selectedQuestion) : null

  return (
    <div className="min-h-screen bg-ia-cream">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la liste
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Infos candidat + Navigation */}
          <div className="space-y-6">
            {/* Infos candidat */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-ia-dark">Candidat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="font-medium">{session.candidate_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">{session.candidate_email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">Créé le {formatDate(session.created_at)}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Progression</span>
                    <span className="font-medium text-ia-dark">{responses.length}/{totalQuestions}</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-ia-teal h-2 rounded-full transition-all"
                      style={{ width: `${(responses.length / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
                {session.completed_at && (
                  <Badge className="bg-ia-teal/10 text-ia-teal">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Test terminé
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Navigation par bloc */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-ia-dark">Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {blocs.map(bloc => (
                  <div key={bloc.number}>
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Bloc {bloc.number}: {bloc.title}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {bloc.questions.map(qNum => {
                        const hasResponse = responses.some(r => r.question_number === qNum)
                        const isSelected = selectedQuestion === qNum
                        const q = questions.find(q => q.number === qNum)
                        return (
                          <button
                            key={qNum}
                            onClick={() => setSelectedQuestion(qNum)}
                            className={`
                              w-8 h-8 rounded text-xs font-medium transition-colors
                              ${isSelected 
                                ? 'bg-ia-teal text-white' 
                                : hasResponse 
                                  ? 'bg-ia-teal/10 text-ia-teal' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }
                            `}
                            title={q?.title}
                          >
                            {qNum}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main content - Question + Réponse */}
          <div className="lg:col-span-2 space-y-6">
            {selectedQ ? (
              <>
                <QuestionCard question={selectedQ} showAnswer={true} />

                {/* Réponse du candidat */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {selectedQ.format === 'video' ? (
                        <Video className="h-5 w-5" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                      Réponse du candidat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedResponse ? (
                      <div className="space-y-4">
                        {selectedResponse.video_url && (
                          <video 
                            src={selectedResponse.video_url} 
                            controls 
                            className="w-full rounded-lg"
                          />
                        )}
                        {selectedResponse.text_response && (
                          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                            <p>{selectedResponse.text_response}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Répondu le {formatDate(selectedResponse.created_at)}
                          </span>
                          {selectedResponse.duration_seconds && (
                            <span>Durée: {selectedResponse.duration_seconds}s</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <XCircle className="h-5 w-5" />
                        <span>Pas de réponse enregistrée pour cette question</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation rapide */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedQuestion(prev => Math.max(1, (prev || 1) - 1))}
                    disabled={selectedQuestion === 1}
                  >
                    Question précédente
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedQuestion(prev => Math.min(totalQuestions, (prev || 0) + 1))}
                    disabled={selectedQuestion === totalQuestions}
                  >
                    Question suivante
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">
                    Sélectionnez une question dans le menu de gauche pour voir la réponse du candidat.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
