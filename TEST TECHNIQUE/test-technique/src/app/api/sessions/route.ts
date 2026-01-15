import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// Créer une nouvelle session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { candidate_name, candidate_email } = body

    if (!candidate_name || !candidate_email) {
      return NextResponse.json(
        { error: 'Nom et email requis' },
        { status: 400 }
      )
    }

    // Générer un token unique
    const token = crypto.randomBytes(16).toString('hex')

    const { data, error } = await supabase
      .from('test_sessions')
      .insert({
        token,
        candidate_name,
        candidate_email
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur création session:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ session: data, token })
  } catch (error) {
    console.error('Erreur API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Récupérer toutes les sessions (admin)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  try {
    if (token) {
      // Récupérer une session spécifique par token
      const { data, error } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('token', token)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: 'Session non trouvée' },
          { status: 404 }
        )
      }

      // Récupérer les réponses
      const { data: responses } = await supabase
        .from('responses')
        .select('*')
        .eq('session_id', data.id)
        .order('question_number')

      return NextResponse.json({ session: data, responses: responses || [] })
    }

    // Liste toutes les sessions
    const { data, error } = await supabase
      .from('test_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des sessions' },
        { status: 500 }
      )
    }

    // Pour chaque session, compter les réponses
    const sessionsWithCount = await Promise.all(
      (data || []).map(async (session) => {
        const { count } = await supabase
          .from('responses')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id)

        return {
          ...session,
          responses_count: count || 0
        }
      })
    )

    return NextResponse.json({ sessions: sessionsWithCount })
  } catch (error) {
    console.error('Erreur API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Supprimer une session
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'ID requis' },
      { status: 400 }
    )
  }

  try {
    const { error } = await supabase
      .from('test_sessions')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
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
