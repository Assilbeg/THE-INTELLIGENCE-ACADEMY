'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Video, Square, RotateCcw, Check, Loader2, Camera } from 'lucide-react'

interface VideoRecorderProps {
  onVideoRecorded: (blob: Blob) => void
  maxDuration?: number // en secondes
  disabled?: boolean
}

export function VideoRecorder({ onVideoRecorded, maxDuration = 90, disabled = false }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Demander l'accès à la webcam au montage
  useEffect(() => {
    requestPermission()
    return () => {
      stopStream()
    }
  }, [])

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
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

  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    chunksRef.current = []
    setRecordedBlob(null)
    setRecordedUrl(null)
    setElapsedTime(0)

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus'
    })

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setRecordedBlob(blob)
      setRecordedUrl(URL.createObjectURL(blob))
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start(1000) // chunk toutes les secondes
    setIsRecording(true)

    // Timer
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => {
        if (prev >= maxDuration - 1) {
          stopRecording()
          return prev
        }
        return prev + 1
      })
    }, 1000)
  }, [maxDuration])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  const resetRecording = () => {
    setRecordedBlob(null)
    setRecordedUrl(null)
    setElapsedTime(0)
    // Remettre la preview webcam
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }

  const confirmRecording = async () => {
    if (recordedBlob) {
      setIsUploading(true)
      try {
        await onVideoRecorded(recordedBlob)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (hasPermission === null) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-900 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-white mb-4" />
        <p className="text-white">Chargement de la caméra...</p>
      </div>
    )
  }

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-900 rounded-lg">
        <Camera className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-white text-center mb-4">
          Accès à la caméra refusé.<br />
          Veuillez autoriser l&apos;accès dans les paramètres de votre navigateur.
        </p>
        <Button onClick={requestPermission} variant="outline">
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Video preview / playback */}
      <div className="relative w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden">
        {recordedUrl ? (
          <video
            src={recordedUrl}
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        )}

        {/* Timer overlay */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="font-mono">{formatTime(elapsedTime)} / {formatTime(maxDuration)}</span>
          </div>
        )}

        {/* Progress bar */}
        {isRecording && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div 
              className="h-full bg-red-600 transition-all duration-1000"
              style={{ width: `${(elapsedTime / maxDuration) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {!recordedBlob ? (
          <>
            {!isRecording ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="bg-red-600 hover:bg-red-700"
                disabled={disabled}
              >
                <Video className="mr-2 h-5 w-5" />
                Démarrer l&apos;enregistrement
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
              >
                <Square className="mr-2 h-5 w-5" />
                Arrêter ({formatTime(maxDuration - elapsedTime)} restantes)
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              onClick={resetRecording}
              variant="outline"
              size="lg"
              disabled={isUploading}
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Recommencer
            </Button>
            <Button
              onClick={confirmRecording}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Valider et continuer
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Duration hint */}
      <p className="text-sm text-gray-500">
        Durée maximale : {formatTime(maxDuration)}
      </p>
    </div>
  )
}
