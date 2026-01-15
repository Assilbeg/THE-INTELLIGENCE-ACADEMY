'use client'

import { useEffect, useState, useRef, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { questions, totalQuestions, getQuestionByNumber, getLevelLabel } from '@/lib/questions'
import { TestSession, Response } from '@/lib/supabase'
import { Loader2, Video, Square, Clock, ChevronRight, Camera } from 'lucide-react'

type Phase = 'intro' | 'reading' | 'recording' | 'uploading' | 'next'

export default function TestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  
  const [session, setSession] = useState<TestSession | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [currentQuestionNum, setCurrentQuestionNum] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Phases: intro -> reading (30s timer) -> recording -> uploading -> next
  const [phase, setPhase] = useState<Phase>('intro')
  const [countdown, setCountdown] = useState(30)
  const [recordingTime, setRecordingTime] = useState(0)
  
  // Video recording
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Refs pour éviter les problèmes de closure dans les callbacks
  const sessionRef = useRef<TestSession | null>(null)
  const currentQuestionNumRef = useRef(1)
  const recordingTimeRef = useRef(0)

  const currentQuestion = getQuestionByNumber(currentQuestionNum)
  const maxRecordingTime = currentQuestion ? Math.min(currentQuestion.duration * 2, 120) : 90

  // Synchroniser les refs avec les states
  useEffect(() => {
    sessionRef.current = session
  }, [session])
  
  useEffect(() => {
    currentQuestionNumRef.current = currentQuestionNum
  }, [currentQuestionNum])
  
  useEffect(() => {
    recordingTimeRef.current = recordingTime
  }, [recordingTime])

  useEffect(() => {
    fetchSession()
    return () => {
      stopStream()
    }
  }, [token])

  // Assigner le stream à l'élément video quand la phase change
  useEffect(() => {
    if ((phase === 'reading' || phase === 'recording') && videoRef.current && streamRef.current) {
      console.log('Assignation du stream à la vidéo, phase:', phase)
      videoRef.current.srcObject = streamRef.current
    }
  }, [phase])

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/sessions?token=${token}`)
      const data = await res.json()

      if (!res.ok) {
        setError('Lien invalide ou expiré')
        return
      }

      setSession(data.session)
      setResponses(data.responses || [])
      
      // Reprendre là où on en était
      if (data.responses && data.responses.length > 0) {
        const lastAnswered = Math.max(...data.responses.map((r: Response) => r.question_number))
        setCurrentQuestionNum(Math.min(lastAnswered + 1, totalQuestions))
      }
      
      // Demander accès caméra
      requestPermission()
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      })
      streamRef.current = stream
      setHasPermission(true)
    } catch (err) {
      console.error('Erreur accès caméra:', err)
      setHasPermission(false)
    }
  }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // Refs pour les callbacks afin d'éviter les problèmes de closure
  const startRecordingRef = useRef<() => void>(() => {})
  const stopRecordingRef = useRef<() => void>(() => {})

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('Arrêt de l\'enregistrement...')
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  // Mettre à jour la ref de stopRecording
  stopRecordingRef.current = stopRecording

  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      console.error('Pas de stream disponible pour l\'enregistrement')
      return
    }

    chunksRef.current = []
    setRecordingTime(0)
    setPhase('recording')

    // Détection du meilleur codec supporté (avec priorité iOS/Safari)
    const mimeTypes = [
      'video/mp4;codecs=h264,aac',      // iOS Safari préféré
      'video/mp4',                        // iOS Safari fallback
      'video/webm;codecs=vp9,opus',       // Chrome/Firefox moderne
      'video/webm;codecs=vp8,opus',       // Chrome/Firefox ancien
      'video/webm;codecs=h264,opus',      // Alternative
      'video/webm',                        // Fallback webm
    ]
    
    let mimeType = ''
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type
        break
      }
    }
    
    // Si aucun codec trouvé, essayer sans spécifier (le navigateur choisira)
    if (!mimeType) {
      console.warn('Aucun codec supporté trouvé, utilisation du défaut du navigateur')
    }
    
    console.log('Démarrage enregistrement avec codec:', mimeType || 'défaut navigateur')
    console.log('User Agent:', navigator.userAgent)

    // Configuration du MediaRecorder
    const options: MediaRecorderOptions = {}
    if (mimeType) {
      options.mimeType = mimeType
    }
    // Réduire le bitrate sur mobile pour des uploads plus rapides
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      options.videoBitsPerSecond = 1000000 // 1 Mbps sur mobile
    }

    const mediaRecorder = new MediaRecorder(streamRef.current, options)

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType.split(';')[0] })
      console.log('Enregistrement terminé, taille:', blob.size)
      handleUpload(blob)
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start(1000)

    // Timer d'enregistrement
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= maxRecordingTime - 1) {
          stopRecordingRef.current()
          return prev
        }
        return prev + 1
      })
    }, 1000)
  }, [maxRecordingTime])

  // Mettre à jour la ref de startRecording
  startRecordingRef.current = startRecording

  // Démarrer la phase de lecture avec countdown
  const startReading = useCallback(() => {
    setPhase('reading')
    setCountdown(30)
    
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Lancer automatiquement l'enregistrement
          clearInterval(timerRef.current!)
          timerRef.current = null
          // Utiliser la ref pour avoir toujours la dernière version
          startRecordingRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const handleUpload = async (blob: Blob) => {
    // Utiliser les refs pour avoir les valeurs actuelles (évite les problèmes de closure)
    const currentSession = sessionRef.current
    const questionNum = currentQuestionNumRef.current
    const duration = recordingTimeRef.current
    
    console.log('handleUpload appelé, session:', currentSession?.id, 'question:', questionNum, 'duration:', duration)
    console.log('Blob type:', blob.type, 'Blob size:', blob.size)
    
    if (!currentSession) {
      console.error('Pas de session!')
      setPhase('next')
      return
    }
    setPhase('uploading')

    // Déterminer l'extension en fonction du type de blob
    const extension = blob.type.includes('mp4') ? 'mp4' : 'webm'
    
    const formData = new FormData()
    formData.append('video', blob, `q${questionNum}.${extension}`)
    formData.append('session_id', currentSession.id)
    formData.append('question_number', questionNum.toString())
    formData.append('duration', duration.toString())

    // Fonction d'upload avec retry
    const uploadWithRetry = async (retries = 3): Promise<boolean> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`Envoi de la vidéo... (tentative ${attempt}/${retries})`)
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout
          
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)

          console.log('Réponse upload:', res.status)
          
          if (res.ok) {
            return true
          } else {
            const errorText = await res.text().catch(() => 'Erreur inconnue')
            console.error(`Erreur upload (tentative ${attempt}):`, res.status, errorText)
            if (attempt === retries) return false
          }
        } catch (err) {
          console.error(`Erreur réseau (tentative ${attempt}):`, err)
          if (attempt === retries) return false
          // Attendre un peu avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
      return false
    }

    const success = await uploadWithRetry()
    
    if (success) {
      setResponses(prev => [
        ...prev,
        {
          id: '',
          session_id: currentSession.id,
          question_number: questionNum,
          video_url: '',
          text_response: null,
          duration_seconds: duration,
          created_at: new Date().toISOString()
        }
      ])
    }
    
    // Toujours passer à la phase suivante, même en cas d'erreur
    setPhase('next')
  }

  const goToNextQuestion = () => {
    if (currentQuestionNum >= totalQuestions) {
      handleComplete()
    } else {
      setCurrentQuestionNum(prev => prev + 1)
      setPhase('intro')
      setCountdown(30)
      setRecordingTime(0)
    }
  }

  const handleComplete = async () => {
    if (!session) return

    try {
      await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id })
      })
      router.push(`/test/${token}/complete`)
    } catch (err) {
      console.error('Erreur:', err)
      router.push(`/test/${token}/complete`)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ia-cream">
        <Loader2 className="h-8 w-8 animate-spin text-ia-teal" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ia-cream p-4">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || 'Session introuvable'}</p>
          <p className="text-gray-500">Vérifiez que vous utilisez le bon lien.</p>
        </div>
      </div>
    )
  }

  if (session.completed_at) {
    router.push(`/test/${token}/complete`)
    return null
  }

  if (hasPermission === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ia-cream px-4 py-6">
        <div className="text-center max-w-sm">
          <Camera className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4 sm:mb-6" />
          <p className="text-ia-dark text-lg sm:text-xl mb-3 sm:mb-4 font-heading">Accès caméra requis</p>
          <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
            Veuillez autoriser l&apos;accès à votre caméra et microphone pour passer le test.
          </p>
          <Button onClick={requestPermission} className="bg-ia-teal hover:bg-ia-teal-light text-white text-base sm:text-lg px-12 py-6 sm:px-14 sm:py-7 rounded-full font-heading font-semibold">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ia-cream text-ia-dark flex flex-col">
      {/* Header minimaliste - fixe en haut */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ia-cream px-5 py-3.5 sm:py-4 border-b border-gray-200">
        <div className="flex items-center justify-start sm:justify-center">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-8 sm:h-9 md:h-10 w-auto mr-2.5 rounded-md"
          />
          <span className="font-heading font-semibold text-ia-teal text-xl sm:text-2xl md:text-2xl">intelligence academy</span>
        </div>
        <div className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 text-lg sm:text-xl text-gray-600 font-medium">
          {currentQuestionNum} / {totalQuestions}
        </div>
      </header>

      {/* Contenu principal - avec padding pour compenser header/footer fixes */}
      <main className="flex-1 flex items-center justify-center px-5 py-6 sm:p-6 pt-20 sm:pt-24 pb-20 sm:pb-24">
        {currentQuestion && (
          <div className="w-full max-w-4xl">
            
            {/* Phase INTRO - Bouton pour commencer */}
            {phase === 'intro' && (
              <div className="text-center animate-fade-in">
                <div className="mb-7 sm:mb-8">
                  <span className="inline-block bg-white/80 border border-gray-200 text-gray-600 text-base sm:text-lg uppercase tracking-wider font-body px-5 py-2 rounded-full">
                    Question {currentQuestionNum}
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-3 text-ia-teal font-heading leading-tight">
                    {currentQuestion.title}
                  </h2>
                  <p className="text-gray-600 text-lg sm:text-xl mt-3 font-body">
                    {getLevelLabel(currentQuestion.level)} • {currentQuestion.points} points
                  </p>
                </div>
                
                <Button 
                  onClick={startReading}
                  className="bg-ia-teal hover:bg-ia-teal-light text-white text-xl sm:text-2xl px-14 py-7 sm:px-16 sm:py-8 rounded-full font-heading font-semibold"
                >
                  <Video className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
                  Afficher la question
                </Button>
                
                <p className="text-gray-600 text-lg sm:text-xl mt-6 sm:mt-7 px-3">
                  Vous aurez 30 secondes pour lire la question avant l&apos;enregistrement automatique
                </p>
              </div>
            )}

            {/* Phase READING - Question avec timer */}
            {phase === 'reading' && (
              <div className="animate-fade-in">
                {/* Timer circulaire */}
                <div className="flex justify-center mb-5 sm:mb-6">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                      <circle
                        cx="48"
                        cy="48"
                        r="44"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="44"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={276.46}
                        strokeDashoffset={276.46 * (1 - countdown / 30)}
                        className="text-ia-teal transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-ia-teal">{countdown}</span>
                    </div>
                  </div>
                </div>

                {/* Question - non sélectionnable */}
                <div 
                  className="text-center select-none px-3"
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                >
                  <p className="text-gray-600 text-lg sm:text-xl mb-3 sm:mb-4">
                    Bloc {currentQuestion.bloc} • {currentQuestion.blocTitle}
                  </p>
                  <h1 className="text-2xl sm:text-2xl md:text-3xl lg:text-3xl font-semibold max-w-3xl mx-auto font-heading text-ia-dark" style={{ lineHeight: '1.4' }}>
                    {currentQuestion.question}
                  </h1>
                </div>

                {/* Preview webcam et bouton pour démarrer */}
                <div className="mt-7 sm:mt-8 md:mt-10 flex flex-col items-center gap-4 sm:gap-5">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-32 h-24 sm:w-40 sm:h-32 object-cover rounded-xl transform scale-x-[-1] opacity-50"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      // Annuler le timer de countdown
                      if (timerRef.current) {
                        clearInterval(timerRef.current)
                        timerRef.current = null
                      }
                      // Lancer directement l'enregistrement
                      startRecordingRef.current()
                    }}
                    className="bg-ia-teal hover:bg-ia-teal-light text-white text-lg sm:text-xl px-10 py-6 sm:px-12 sm:py-7 rounded-full font-heading font-semibold gap-3"
                  >
                    <Video className="h-5 w-5 sm:h-6 sm:w-6" />
                    Je suis prêt
                  </Button>
                  <p className="text-base sm:text-lg text-gray-600">
                    ou attendez la fin du compte à rebours
                  </p>
                </div>
              </div>
            )}

            {/* Phase RECORDING */}
            {phase === 'recording' && (
              <div className="animate-fade-in pb-20 sm:pb-0">
                {/* Question en haut - dans une tuile */}
                <div 
                  className="bg-white rounded-2xl sm:rounded-2xl shadow-sm border border-gray-100 px-5 py-4 sm:px-6 sm:py-5 mb-5 sm:mb-6 select-none mx-auto max-w-3xl"
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                  onCopy={(e) => e.preventDefault()}
                >
                  <p className="text-xl sm:text-xl md:text-2xl lg:text-2xl text-ia-dark text-center font-heading" style={{ lineHeight: '1.4' }}>
                    {currentQuestion.question}
                  </p>
                </div>

                {/* Vidéo + indicateur enregistrement */}
                <div className="relative max-w-sm sm:max-w-xl md:max-w-2xl mx-auto">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full aspect-[3/4] sm:aspect-video object-cover rounded-2xl sm:rounded-2xl transform scale-x-[-1]"
                  />
                  
                  {/* Badge REC */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 sm:gap-2 bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-full">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse" />
                    <span className="font-mono text-base sm:text-lg">REC</span>
                  </div>

                  {/* Timer */}
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2 sm:gap-2 bg-black/70 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-full">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="font-mono text-base sm:text-lg">{formatTime(recordingTime)} / {formatTime(maxRecordingTime)}</span>
                  </div>

                  {/* Barre de progression */}
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-300 rounded-b-2xl sm:rounded-b-2xl overflow-hidden">
                    <div 
                      className="h-full bg-red-600 transition-all duration-1000"
                      style={{ width: `${(recordingTime / maxRecordingTime) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Bouton stop - visible sur desktop */}
                <div className="hidden sm:block mt-6 sm:mt-7 md:mt-8 text-center">
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    className="text-lg sm:text-xl md:text-2xl px-10 py-6 sm:px-12 sm:py-7 md:px-14 rounded-full font-heading font-semibold gap-3"
                  >
                    <Square className="h-5 w-5 sm:h-6 sm:w-6" />
                    Terminer ma réponse
                  </Button>
                </div>
              </div>
            )}

            {/* Phase UPLOADING */}
            {phase === 'uploading' && (
              <div className="text-center animate-fade-in">
                <Loader2 className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 animate-spin mx-auto mb-6 sm:mb-7 text-ia-teal" />
                <p className="text-xl sm:text-2xl md:text-3xl">Envoi de votre réponse...</p>
                <p className="text-gray-600 text-lg sm:text-xl mt-3">Ne fermez pas cette page</p>
              </div>
            )}

            {/* Phase NEXT - Transition vers question suivante */}
            {phase === 'next' && (
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-ia-teal rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-7">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl mb-7 sm:mb-8 font-heading">Réponse enregistrée !</p>
                
                <Button
                  onClick={goToNextQuestion}
                  className="bg-ia-teal hover:bg-ia-teal-light text-white text-lg sm:text-xl md:text-2xl px-14 py-7 sm:px-16 sm:py-8 md:px-20 rounded-full font-heading font-semibold"
                >
                  {currentQuestionNum >= totalQuestions ? (
                    'Terminer le test'
                  ) : (
                    <>
                      Question suivante
                      <ChevronRight className="ml-3 h-6 w-6 sm:h-7 sm:w-7" />
                    </>
                  )}
                </Button>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer minimaliste avec progression - fixe en bas */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-ia-cream px-5 py-3 sm:py-4 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          {/* Bouton stop sur mobile pendant l'enregistrement */}
          {phase === 'recording' && (
            <div className="sm:hidden mb-3 text-center">
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="text-base px-8 py-5 rounded-full font-heading font-semibold gap-2 w-full max-w-xs"
              >
                <Square className="h-5 w-5" />
                Terminer ma réponse
              </Button>
            </div>
          )}
          <div className="flex gap-1.5 sm:gap-2">
            {Array.from({ length: totalQuestions }, (_, i) => (
              <div
                key={i}
                className={`h-2 sm:h-2.5 flex-1 rounded-full transition-colors ${
                  i < currentQuestionNum - 1 || (i === currentQuestionNum - 1 && phase === 'next')
                    ? 'bg-ia-teal'
                    : i === currentQuestionNum - 1
                    ? 'bg-ia-teal-light'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </footer>

      {/* Styles pour animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
