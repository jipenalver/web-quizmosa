import type { Database } from './database'

type Functions = Database['public']['Functions']

export type LeaderboardRow = Functions['get_leaderboard']['Returns'][number]
export type HistoryRow = Functions['get_history']['Returns'][number]
export type ParticipantOverviewRow = Functions['get_participants_overview']['Returns'][number]
