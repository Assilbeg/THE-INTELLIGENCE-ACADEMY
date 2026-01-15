import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('video') as File
    const sessionId = formData.get('session_id') as string
    const questionNumber = formData.get('question_number') as string
    const duration = formData.get('duration') as string

    if (!file || !sessionId || !questionNumber) {
      return NextResponse.json(
        { error: 'Fichier, session_id et question_number requis' },
        { status: 400 }
      )
    }

    // Convertir le File en ArrayBuffer puis en Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Déterminer le type de fichier et l'extension
    const isMP4 = file.type.includes('mp4') || file.name.endsWith('.mp4')
    const extension = isMP4 ? 'mp4' : 'webm'
    const contentType = isMP4 ? 'video/mp4' : 'video/webm'

    // Chemin du fichier dans le storage
    const filePath = `${sessionId}/${questionNumber}.${extension}`

    console.log('Upload fichier:', filePath, 'Type:', contentType, 'Taille:', buffer.length)

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('test-videos')
      .upload(filePath, buffer, {
        contentType,
        upsert: true
      })

    if (uploadError) {
      console.error('Erreur upload:', uploadError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload' },
        { status: 500 }
      )
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('test-videos')
      .getPublicUrl(filePath)

    // Enregistrer la réponse en base
    const { error: dbError } = await supabase
      .from('responses')
      .upsert({
        session_id: sessionId,
        question_number: parseInt(questionNumber),
        video_url: urlData.publicUrl,
        duration_seconds: duration ? parseInt(duration) : null
      }, {
        onConflict: 'session_id,question_number'
      })

    if (dbError) {
      console.error('Erreur DB:', dbError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement' },
        { status: 500 }
      )
    }

    // Mettre à jour current_question si nécessaire
    await supabase
      .from('test_sessions')
      .update({ 
        current_question: parseInt(questionNumber),
        started_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .is('started_at', null)

    return NextResponse.json({ 
      success: true, 
      video_url: urlData.publicUrl 
    })
  } catch (error) {
    console.error('Erreur API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
