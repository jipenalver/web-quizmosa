import type { Database } from './database'

type Functions = Database['public']['Functions']

export type LeaderboardRow = Functions['get_leaderboard']['Returns'][number]
export type HistoryRow = Functions['get_history']['Returns'][number]
export type ParticipantOverviewRow = Functions['get_participants_overview']['Returns'][number]
// Generated types mark every returned column as non-null; one side is null for a person who took one test.
export type ComparisonRow = {
  pre_quizzer_id: number | null
  post_quizzer_id: number | null
  full_name: string
  alias: string | null
  pre_score: number | null
  pre_correct_ms: number | null
  post_score: number | null
  post_correct_ms: number | null
  matched_by_name: boolean
}
