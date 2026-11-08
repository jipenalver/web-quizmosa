import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/utils/supabase'
import { sessionKeys } from './sessions'
import type { ChoiceKey } from '@/types/common'
import type { HistoryRow, LeaderboardRow, ParticipantOverviewRow } from '@/types/dashboard'

export function useLeaderboardQuery(sessionId: number) {
  return useQuery({
    queryKey: sessionKeys.leaderboard(sessionId),
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const { data, error } = await supabase.rpc('get_leaderboard', { p_session_id: sessionId })
      if (error) throw error
      return data
    },
  })
}

export function useAnswerCountsQuery(
  sessionId: number,
  questionId: MaybeRefOrGetter<number | null>,
) {
  return useQuery({
    queryKey: computed(() => sessionKeys.answerCounts(sessionId, toValue(questionId))),
    enabled: computed(() => toValue(questionId) !== null),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('answers')
        .select('selected_choice, participants!inner(is_kicked)')
        .eq('session_id', sessionId)
        .eq('question_id', toValue(questionId) ?? 0)
        .eq('participants.is_kicked', false)
      if (error) throw error

      const counts: Partial<Record<ChoiceKey, number>> = {}
      for (const { selected_choice } of data) {
        const choice = selected_choice as ChoiceKey
        counts[choice] = (counts[choice] ?? 0) + 1
      }
      return counts
    },
  })
}

export function useHistoryQuery() {
  return useQuery({
    queryKey: ['history'],
    staleTime: 0,
    queryFn: async (): Promise<HistoryRow[]> => {
      const { data, error } = await supabase.rpc('get_history')
      if (error) throw error
      return data
    },
  })
}

export function useParticipantsOverviewQuery() {
  return useQuery({
    queryKey: ['participants-overview'],
    staleTime: 0,
    queryFn: async (): Promise<ParticipantOverviewRow[]> => {
      const { data, error } = await supabase.rpc('get_participants_overview')
      if (error) throw error
      return data
    },
  })
}
