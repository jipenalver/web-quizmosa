import { computed, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { queryClient } from '@/utils/queryClient'
import { supabase } from '@/utils/supabase'
import type { ChoiceKey } from '@/types/common'
import type { LeaderboardRow } from '@/types/dashboard'
import type {
  PlayParticipant,
  PlayProgress,
  PlayQuestion,
  PlayReveal,
  PlaySession,
} from '@/types/play'

export const playKeys = {
  session: (code: string) => ['play', code, 'session'] as const,
  participant: (code: string) => ['play', code, 'participant'] as const,
  question: (code: string, questionId?: number | null) =>
    ['play', code, 'question', questionId] as const,
  answer: (code: string, questionId?: number | null) =>
    ['play', code, 'answer', questionId] as const,
  reveal: (code: string, questionId?: number | null) =>
    ['play', code, 'reveal', questionId] as const,
  leaderboard: (code: string) => ['play', code, 'leaderboard'] as const,
  progress: (code: string) => ['play', code, 'progress'] as const,
}

// Profile and joining. The app only asks whether a profile exists, and never reads quizzers.
export async function hasQuizzerProfile() {
  const { data, error } = await supabase.rpc('my_quizzer_id')
  if (error) throw error
  return data !== null
}

export function useCreateQuizzer() {
  return useMutation({
    mutationFn: async (profile: { user_id: string; full_name: string; alias: string | null }) => {
      const { error } = await supabase.from('quizzers').insert(profile)
      if (error) throw error
    },
  })
}

export function useJoinSession() {
  return useMutation({
    mutationFn: async ({ code, displayName }: { code: string; displayName: string }) => {
      const { data, error } = await supabase.rpc('join_session', {
        p_code: code,
        p_display_name: displayName,
      })
      if (error) throw error
      return data
    },
  })
}

// Play
export function usePlaySessionQuery(code: string) {
  return useQuery({
    queryKey: playKeys.session(code),
    // Realtime can drop while a phone sleeps, so these catch it up.
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<PlaySession | null> => {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, status, current_question_id, question_started_at, question_ends_at')
        .eq('join_code', code)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function usePlayParticipantQuery(code: string, sessionId: Ref<number | undefined>) {
  return useQuery({
    queryKey: playKeys.participant(code),
    enabled: computed(() => sessionId.value !== undefined),
    queryFn: async (): Promise<PlayParticipant | null> => {
      const { data, error } = await supabase
        .from('participants')
        .select('id, display_name, is_kicked')
        .eq('session_id', sessionId.value ?? 0)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useMyProgressQuery(code: string, sessionId: Ref<number | undefined>) {
  return useQuery({
    queryKey: playKeys.progress(code),
    enabled: computed(() => sessionId.value !== undefined),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_progress', {
        p_session_id: sessionId.value ?? 0,
      })
      if (error) throw error
      return data as unknown as PlayProgress | null
    },
  })
}

// Pre-test only: the server hands out the next question and starts this quizzer's timer.
export function useNextQuestion(code: string) {
  return useMutation({
    mutationFn: async (sessionId: number) => {
      const { error } = await supabase.rpc('next_question', { p_session_id: sessionId })
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: playKeys.progress(code) }),
  })
}

export function usePlayQuestionQuery(code: string, questionId: MaybeRefOrGetter<number | null>) {
  return useQuery({
    queryKey: computed(() => playKeys.question(code, toValue(questionId))),
    enabled: computed(() => toValue(questionId) !== null),
    queryFn: async (): Promise<PlayQuestion | null> => {
      const { data, error } = await supabase
        .from('questions')
        .select('id, prompt, image_path, choice_a, choice_b, choice_c, choice_d')
        .eq('id', toValue(questionId) ?? 0)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useMyAnswerQuery(
  code: string,
  sessionId: Ref<number | undefined>,
  questionId: MaybeRefOrGetter<number | null>,
) {
  return useQuery({
    queryKey: computed(() => playKeys.answer(code, toValue(questionId))),
    enabled: computed(() => sessionId.value !== undefined && toValue(questionId) !== null),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_answer', {
        p_session_id: sessionId.value ?? 0,
        p_question_id: toValue(questionId) ?? 0,
      })
      if (error) throw error
      return data as ChoiceKey | null
    },
  })
}

export function useRevealQuery(
  code: string,
  sessionId: Ref<number | undefined>,
  questionId: MaybeRefOrGetter<number | null>,
  isReveal: MaybeRefOrGetter<boolean>,
) {
  return useQuery({
    queryKey: computed(() => playKeys.reveal(code, toValue(questionId))),
    enabled: computed(() => toValue(isReveal) && toValue(questionId) !== null),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_reveal', {
        p_session_id: sessionId.value ?? 0,
        p_question_id: toValue(questionId) ?? 0,
      })
      if (error) throw error
      return data as unknown as PlayReveal | null
    },
  })
}

export function useFinalLeaderboardQuery(
  code: string,
  sessionId: Ref<number | undefined>,
  isFinished: MaybeRefOrGetter<boolean>,
) {
  return useQuery({
    queryKey: playKeys.leaderboard(code),
    enabled: computed(() => toValue(isFinished) && sessionId.value !== undefined),
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const { data, error } = await supabase.rpc('get_leaderboard', {
        p_session_id: sessionId.value ?? 0,
      })
      if (error) throw error
      return data
    },
  })
}

export function useSubmitAnswer(code: string) {
  return useMutation({
    mutationFn: async (input: { sessionId: number; questionId: number; choice: ChoiceKey }) => {
      const { data, error } = await supabase.rpc('submit_answer', {
        p_session_id: input.sessionId,
        p_question_id: input.questionId,
        p_choice: input.choice,
      })
      if (error) throw error
      return data
    },
    onSettled: (_data, _error, input) =>
      queryClient.invalidateQueries({ queryKey: playKeys.answer(code, input.questionId) }),
  })
}

export function usePlayRealtime(
  code: string,
  sessionId: Ref<number | undefined>,
  participantId: Ref<number | undefined>,
) {
  watch(
    [sessionId, participantId],
    ([session, participant], _previous, onCleanup) => {
      if (session === undefined || participant === undefined) return

      // Changes made before the channel is ready are never delivered, so read once it is.
      // This also covers reconnecting after a phone wakes.
      const catchUp = () => {
        queryClient.invalidateQueries({ queryKey: playKeys.session(code) })
        queryClient.invalidateQueries({ queryKey: playKeys.participant(code) })
        queryClient.invalidateQueries({ queryKey: playKeys.progress(code) })
      }

      const channel = supabase
        .channel(`play-${session}-${participant}`)
        .on('system', {}, catchUp)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${session}` },
          () => queryClient.invalidateQueries({ queryKey: playKeys.session(code) }),
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'participants',
            filter: `id=eq.${participant}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: playKeys.participant(code) })
            queryClient.invalidateQueries({ queryKey: playKeys.progress(code) })
          },
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') catchUp()
        })

      onCleanup(() => supabase.removeChannel(channel))
    },
    { immediate: true },
  )
}
