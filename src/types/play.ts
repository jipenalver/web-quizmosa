import type { Tables } from './database'
import type { QuestionnaireKind } from './common'
import type { Question } from './questionnaires'
import type { Participant } from './sessions'

export type PlaySession = Pick<
  Tables<'sessions'>,
  'id' | 'status' | 'current_question_id' | 'question_started_at' | 'question_ends_at'
>
export type PlayParticipant = Pick<Participant, 'id' | 'display_name' | 'is_kicked'>
export type PlayQuestion = Pick<
  Question,
  'id' | 'prompt' | 'image_path' | 'choice_a' | 'choice_b' | 'choice_c' | 'choice_d'
>
// Pre-tests only carry kind and points_so_far. get_reveal returns null outside a reveal.
export type PlayReveal = {
  kind: QuestionnaireKind
  points_so_far: number
  correct_choice?: string
  my_answer?: {
    selected_choice: string
    is_correct: boolean
    points_awarded: number
  } | null
  counts?: Record<string, number>
}
// From get_my_progress. Only a pre-test uses the per-participant question and timer.
export type PlayProgress = {
  kind: QuestionnaireKind
  question_id: number | null
  question_started_at: string | null
  question_ends_at: string | null
  served: number
  total: number
  finished_at: string | null
}
