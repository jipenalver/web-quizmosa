import type { Tables } from './database'
import type { Questionnaire } from './questionnaires'

export type Host = Tables<'hosts'>

export type HostSession = Tables<'sessions'> & {
  questionnaires: Pick<Questionnaire, 'name' | 'kind'> | null
}
export type HostSessionWithCounts = HostSession & {
  participants: { count: number }[]
}
export type Participant = Tables<'participants'>

export type SessionReportQuestion = {
  question_id: number
  position: number
  prompt: string
  answered: number
  correct: number
  accuracy: number | null
  average_response_ms: number | null
}
export type SessionReport = {
  scores: number[]
  questions: SessionReportQuestion[]
}
