import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface TestSession {
  id: string
  token: string
  candidate_name: string
  candidate_email: string
  started_at: string | null
  completed_at: string | null
  current_question: number
  created_at: string
}

export interface Response {
  id: string
  session_id: string
  question_number: number
  video_url: string | null
  text_response: string | null
  duration_seconds: number | null
  created_at: string
}
