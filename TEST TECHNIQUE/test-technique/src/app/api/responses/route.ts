import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Enregistrer une réponse texte
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, question_number, text_response } = body

    if (!session_id || !question_number) {
      return NextResponse.json(
        { error: 'session_id et question_number requis' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('responses')
      .upsert({
        session_id,
        question_number,
        text_response
      }, {
        onConflict: 'session_id,question_number'
      })

    if (error) {
      console.error('Erreur DB:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement' },
        { status: 500 }
      )
    }

    // Mettre à jour current_question si nécessaire
    await supabase
      .from('test_sessions')
      .update({ 
        current_question: question_number,
        started_at: new Date().toISOString()
      })
      .eq('id', session_id)
      .is('started_at', null)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Récupérer les réponses d'une session
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'session_id requis' },
      { status: 400 }
    )
  }

  try {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_number')

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération' },
        { status: 500 }
      )
    }

    return NextResponse.json({ responses: data || [] })
  } catch (error) {
    console.error('Erreur API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
