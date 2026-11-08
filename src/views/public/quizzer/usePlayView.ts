import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  useFinalLeaderboardQuery,
  useMyAnswerQuery,
  usePlayParticipantQuery,
  usePlayQuestionQuery,
  usePlayRealtime,
  usePlaySessionQuery,
  useRevealQuery,
  useSubmitAnswer,
} from '@/stores/quizzers'
import { useCountdown } from '@/stores/sessions'
import type { ChoiceKey } from '@/types/common'
import { handleFormError } from '@/utils/helpers/forms'

export function usePlayView() {
  const route = useRoute()
  const code = String(route.params.code).toUpperCase()

  const sessionQuery = usePlaySessionQuery(code)

  // Kept after a kick, when the session can no longer be read.
  const sessionId = ref<number | undefined>()
  watch(
    sessionQuery.data,
    (session) => {
      if (session) sessionId.value = session.id
    },
    { immediate: true },
  )

  const session = sessionQuery.data
  const status = computed(() => session.value?.status)
  const questionId = computed(() => session.value?.current_question_id ?? null)
  const isReveal = computed(() => status.value === 'reveal')
  const isFinished = computed(() => status.value === 'finished')

  const participantQuery = usePlayParticipantQuery(code, sessionId)
  const questionQuery = usePlayQuestionQuery(code, questionId)
  const answerQuery = useMyAnswerQuery(code, sessionId, questionId)
  const revealQuery = useRevealQuery(code, sessionId, questionId, isReveal)
  const leaderboardQuery = useFinalLeaderboardQuery(code, sessionId, isFinished)
  const submitAnswer = useSubmitAnswer(code)

  const participant = participantQuery.data
  const participantId = computed(() => participant.value?.id)

  usePlayRealtime(code, sessionId, participantId)

  const { seconds, percent, isOver } = useCountdown(
    () => session.value?.question_started_at,
    () => session.value?.question_ends_at,
  )

  // States
  const notice = ref('')

  const isNoticeOpen = computed({
    get: () => notice.value !== '',
    set: (open) => {
      if (!open) notice.value = ''
    },
  })

  const myAnswer = computed(() => answerQuery.data.value ?? null)

  const myResult = computed(() =>
    leaderboardQuery.data.value?.find((row) => row.participant_id === participantId.value),
  )

  const screen = computed(() => {
    if (participant.value?.is_kicked) return 'kicked'
    if (sessionQuery.isPending.value) return 'loading'
    if (sessionQuery.isError.value) return 'error'
    if (!session.value) return 'missing'
    if (status.value === 'lobby') return 'lobby'
    if (status.value === 'finished') return 'finished'
    if (status.value === 'reveal') return 'reveal'
    if (myAnswer.value) return 'locked'
    return isOver.value ? 'timeup' : 'question'
  })

  // Actions
  const onAnswer = async (choice: ChoiceKey) => {
    const id = questionId.value
    if (sessionId.value === undefined || id === null || submitAnswer.isPending.value) return

    try {
      const isSaved = await submitAnswer.mutateAsync({
        sessionId: sessionId.value,
        questionId: id,
        choice,
      })
      if (!isSaved) notice.value = 'You already answered this question.'
    } catch (error) {
      notice.value = handleFormError(error).message
    }
  }

  // Expose State and Actions
  return {
    code,
    sessionQuery,
    participant,
    questionQuery,
    revealQuery,
    leaderboardQuery,
    submitAnswer,
    screen,
    myAnswer,
    myResult,
    seconds,
    percent,
    notice,
    isNoticeOpen,
    onAnswer,
  }
}
