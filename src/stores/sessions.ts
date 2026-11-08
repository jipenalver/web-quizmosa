import { computed, onScopeDispose, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, type QueryKey } from '@tanstack/vue-query'
import { queryClient } from '@/utils/queryClient'
import { supabase } from '@/utils/supabase'
import { questionnaireKeys } from './questionnaires'
import type { QuestionWithKey } from '@/types/questionnaires'
import type { HostSession, HostSessionWithCounts, Participant, SessionReport } from '@/types/sessions'

export const sessionKeys = {
  all: ['sessions'] as const,
  detail: (id: number) => ['sessions', id] as const,
  participants: (id: number) => ['sessions', id, 'participants'] as const,
  report: (id: number) => ['sessions', id, 'report'] as const,
  leaderboard: (id: number) => ['sessions', id, 'leaderboard'] as const,
  answerCounts: (id: number, questionId?: number | null) =>
    questionId === undefined
      ? (['sessions', id, 'answer-counts'] as const)
      : (['sessions', id, 'answer-counts', questionId] as const),
}

// Hosts (sessions)
export function useSessionsQuery() {
  return useQuery({
    queryKey: sessionKeys.all,
    queryFn: async (): Promise<HostSessionWithCounts[]> => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, questionnaires(name, kind), participants(count)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useSessionQuery(id: number) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: async (): Promise<HostSession> => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, questionnaires(name, kind)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useParticipantsQuery(sessionId: number) {
  return useQuery({
    queryKey: sessionKeys.participants(sessionId),
    queryFn: async (): Promise<Participant[]> => {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at')
      if (error) throw error
      return data
    },
  })
}

// Per-question answer counts. An RPC, so it is not cut off by the API's row limit.
export function useSessionReportQuery(sessionId: number) {
  return useQuery({
    queryKey: sessionKeys.report(sessionId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_session_report', {
        p_session_id: sessionId,
      })
      if (error) throw error
      return data as unknown as SessionReport
    },
  })
}

export function useSessionQuestionsQuery(questionnaireId: MaybeRefOrGetter<number | undefined>) {
  return useQuery({
    queryKey: computed(() => questionnaireKeys.questions(toValue(questionnaireId) ?? 0)),
    enabled: computed(() => toValue(questionnaireId) !== undefined),
    queryFn: async (): Promise<QuestionWithKey[]> => {
      const { data, error } = await supabase
        .from('questions')
        .select('*, question_keys(correct_choice)')
        .eq('questionnaire_id', toValue(questionnaireId) ?? 0)
        .order('position')
      if (error) throw error
      return data
    },
  })
}

export function useCreateSession() {
  return useMutation({
    mutationFn: async (questionnaireId: number) => {
      const { data, error } = await supabase.rpc('create_session', {
        p_questionnaire_id: questionnaireId,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.all })
    },
  })
}

// Host controls. All of them change the session row, so they share one refresh.
function useSessionControl<T>(sessionId: number, run: (input: T) => Promise<void>) {
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) })
    },
  })
}

export function useStartQuestion(sessionId: number) {
  return useSessionControl(sessionId, async (questionId: number) => {
    const { error } = await supabase.rpc('start_question', {
      p_session_id: sessionId,
      p_question_id: questionId,
    })
    if (error) throw error
  })
}

export function useRevealQuestion(sessionId: number) {
  return useSessionControl<void>(sessionId, async () => {
    const { error } = await supabase.rpc('reveal_question', { p_session_id: sessionId })
    if (error) throw error
  })
}

export function useFinishSession(sessionId: number) {
  return useSessionControl<void>(sessionId, async () => {
    const { error } = await supabase.rpc('finish_session', { p_session_id: sessionId })
    if (error) throw error
  })
}

export function useReturnToLobby(sessionId: number) {
  return useSessionControl<void>(sessionId, async () => {
    const { error } = await supabase.rpc('return_to_lobby', { p_session_id: sessionId })
    if (error) throw error
  })
}

export function useKickParticipant(sessionId: number) {
  return useMutation({
    mutationFn: async (participantId: number) => {
      const { error } = await supabase
        .from('participants')
        .update({ is_kicked: true })
        .eq('id', participantId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.participants(sessionId) })
      queryClient.invalidateQueries({ queryKey: sessionKeys.report(sessionId) })
      queryClient.invalidateQueries({ queryKey: sessionKeys.leaderboard(sessionId) })
    },
  })
}

// Realtime only invalidates caches. A room answering at once sends a burst of events,
// so each key refreshes once per short window instead of once per event.
export function useSessionRealtime(sessionId: number) {
  const pending = new Map<string, ReturnType<typeof setTimeout>>()

  const invalidate = (queryKey: QueryKey) => {
    const id = JSON.stringify(queryKey)
    if (pending.has(id)) return

    pending.set(
      id,
      setTimeout(() => {
        pending.delete(id)
        queryClient.invalidateQueries({ queryKey })
      }, 300),
    )
  }

  const filter = `session_id=eq.${sessionId}`

  // Changes made before the channel is ready are never delivered, so read once it is.
  const catchUp = () => {
    invalidate(sessionKeys.detail(sessionId))
    invalidate(sessionKeys.participants(sessionId))
    invalidate(sessionKeys.report(sessionId))
    invalidate(sessionKeys.leaderboard(sessionId))
    invalidate(sessionKeys.answerCounts(sessionId))
  }

  const channel = supabase
    .channel(`host-session-${sessionId}`)
    .on('system', {}, catchUp)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
      () => invalidate(sessionKeys.detail(sessionId)),
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter }, () => {
      invalidate(sessionKeys.participants(sessionId))
      invalidate(sessionKeys.report(sessionId))
      invalidate(sessionKeys.leaderboard(sessionId))
      invalidate(sessionKeys.answerCounts(sessionId))
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'answers', filter }, () => {
      invalidate(sessionKeys.report(sessionId))
      invalidate(sessionKeys.leaderboard(sessionId))
      invalidate(sessionKeys.answerCounts(sessionId))
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') catchUp()
    })

  onScopeDispose(() => {
    pending.forEach((timer) => clearTimeout(timer))
    supabase.removeChannel(channel)
  })
}

// Server clock. The countdown is display-only and always derives from question_ends_at.
export function useServerClockOffset() {
  return useQuery({
    queryKey: ['server-clock-offset'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const sentAt = Date.now()
      const { data, error } = await supabase.rpc('server_now')
      if (error) throw error
      return new Date(data).getTime() - (sentAt + Date.now()) / 2
    },
  })
}

export function useCountdown(
  startedAt: MaybeRefOrGetter<string | null | undefined>,
  endsAt: MaybeRefOrGetter<string | null | undefined>,
) {
  const { data: offset } = useServerClockOffset()

  const now = ref(Date.now())
  const ticker = setInterval(() => {
    now.value = Date.now()
  }, 200)
  onScopeDispose(() => clearInterval(ticker))

  const remainingMs = computed(() => {
    const ends = toValue(endsAt)
    if (!ends) return 0
    return Math.max(0, new Date(ends).getTime() - (now.value + (offset.value ?? 0)))
  })

  const totalMs = computed(() => {
    const starts = toValue(startedAt)
    const ends = toValue(endsAt)
    if (!starts || !ends) return 0
    return new Date(ends).getTime() - new Date(starts).getTime()
  })

  const seconds = computed(() => Math.ceil(remainingMs.value / 1000))
  const percent = computed(() =>
    totalMs.value > 0 ? (remainingMs.value / totalMs.value) * 100 : 0,
  )
  const isOver = computed(() => remainingMs.value === 0)

  return { seconds, percent, isOver }
}
