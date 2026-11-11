import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  useCountdown,
  useFinishSession,
  useKickParticipant,
  useOpenPretest,
  useParticipantsQuery,
  useReturnToLobby,
  useRevealQuestion,
  useSessionQuery,
  useSessionQuestionsQuery,
  useSessionRealtime,
  useSessionReportQuery,
  useStartQuestion,
} from '@/stores/sessions'
import type { Participant } from '@/types/sessions'
import { handleFormError } from '@/utils/helpers/forms'

export function useHostControlView() {
  const route = useRoute()
  const sessionId = Number(route.params.id)

  const sessionQuery = useSessionQuery(sessionId)
  const participantsQuery = useParticipantsQuery(sessionId)
  const reportQuery = useSessionReportQuery(sessionId)
  const questionsQuery = useSessionQuestionsQuery(() => sessionQuery.data.value?.questionnaire_id)

  const startQuestion = useStartQuestion(sessionId)
  const openPretest = useOpenPretest(sessionId)
  const revealQuestion = useRevealQuestion(sessionId)
  const finishSession = useFinishSession(sessionId)
  const returnToLobby = useReturnToLobby(sessionId)
  const kickParticipant = useKickParticipant(sessionId)

  useSessionRealtime(sessionId)

  // States
  const kicking = ref<Participant | null>(null)
  const isKickOpen = ref(false)
  const isFinishOpen = ref(false)
  const notice = ref('')

  const isNoticeOpen = computed({
    get: () => notice.value !== '',
    set: (open) => {
      if (!open) notice.value = ''
    },
  })

  const session = sessionQuery.data
  const isPretest = computed(() => session.value?.questionnaires?.kind === 'pretest')
  const questions = computed(() => questionsQuery.data.value ?? [])
  const reportQuestions = computed(() => reportQuery.data.value?.questions ?? [])

  const activeParticipants = computed(() =>
    (participantsQuery.data.value ?? []).filter((participant) => !participant.is_kicked),
  )

  const currentIndex = computed(() =>
    questions.value.findIndex((question) => question.id === session.value?.current_question_id),
  )

  const currentQuestion = computed(() => questions.value[currentIndex.value] ?? null)

  const answeredCount = (questionId: number) =>
    reportQuestions.value.find((question) => question.question_id === questionId)?.answered ?? 0

  // After returning to the lobby, carry on from the first question nobody has answered.
  const nextQuestion = computed(() => {
    if (currentQuestion.value) return questions.value[currentIndex.value + 1] ?? null
    return questions.value.find((question) => answeredCount(question.id) === 0) ?? null
  })

  const isBusy = computed(
    () =>
      startQuestion.isPending.value ||
      openPretest.isPending.value ||
      revealQuestion.isPending.value ||
      finishSession.isPending.value ||
      returnToLobby.isPending.value,
  )

  const { seconds: countdownSeconds, percent: countdownPercent } = useCountdown(
    () => session.value?.question_started_at,
    () => session.value?.question_ends_at,
  )

  // Actions
  const run = async (action: () => Promise<unknown>) => {
    try {
      await action()
    } catch (error) {
      notice.value = handleFormError(error).message
    }
  }

  const onStartNext = () => {
    const next = nextQuestion.value
    if (next) run(() => startQuestion.mutateAsync(next.id))
  }

  const onOpenPretest = () => run(() => openPretest.mutateAsync())

  const onReveal = () => run(() => revealQuestion.mutateAsync())

  const onReturnToLobby = () => run(() => returnToLobby.mutateAsync())

  const onConfirmFinish = async () => {
    await run(() => finishSession.mutateAsync())
    isFinishOpen.value = false
  }

  const onAskKick = (participant: Participant) => {
    kicking.value = participant
    isKickOpen.value = true
  }

  const onConfirmKick = async () => {
    const participant = kicking.value
    if (participant) await run(() => kickParticipant.mutateAsync(participant.id))
    isKickOpen.value = false
  }

  // Expose State and Actions
  return {
    sessionQuery,
    participantsQuery,
    finishSession,
    kickParticipant,
    session,
    isPretest,
    questions,
    activeParticipants,
    currentIndex,
    currentQuestion,
    nextQuestion,
    answeredCount,
    countdownSeconds,
    countdownPercent,
    isBusy,
    kicking,
    isKickOpen,
    isFinishOpen,
    notice,
    isNoticeOpen,
    onStartNext,
    onOpenPretest,
    onReveal,
    onReturnToLobby,
    onConfirmFinish,
    onAskKick,
    onConfirmKick,
  }
}
