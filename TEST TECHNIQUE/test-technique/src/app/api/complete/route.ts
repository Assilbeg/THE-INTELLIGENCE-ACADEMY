import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Marquer une session comme terminée
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id requis' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('test_sessions')
      .update({ 
        completed_at: new Date().toISOString(),
        current_question: 36
      })
      .eq('id', session_id)

    if (error) {
      console.error('Erreur DB:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
