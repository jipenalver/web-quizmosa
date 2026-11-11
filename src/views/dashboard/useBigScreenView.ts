import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAnswerCountsQuery, useLeaderboardQuery } from '@/stores/dashboard'
import {
  useCountdown,
  useParticipantsQuery,
  useSessionQuery,
  useSessionQuestionsQuery,
  useSessionRealtime,
} from '@/stores/sessions'

export function useBigScreenView() {
  const route = useRoute()
  const sessionId = Number(route.params.id)

  const sessionQuery = useSessionQuery(sessionId)
  const participantsQuery = useParticipantsQuery(sessionId)
  const leaderboardQuery = useLeaderboardQuery(sessionId)

  const session = sessionQuery.data
  const questionsQuery = useSessionQuestionsQuery(() => session.value?.questionnaire_id)

  useSessionRealtime(sessionId)

  const questions = computed(() => questionsQuery.data.value ?? [])

  const currentIndex = computed(() =>
    questions.value.findIndex((question) => question.id === session.value?.current_question_id),
  )
  const currentQuestion = computed(() => questions.value[currentIndex.value] ?? null)

  const isPretest = computed(() => session.value?.questionnaires?.kind === 'pretest')

  const countsQuery = useAnswerCountsQuery(sessionId, () => currentQuestion.value?.id ?? null)

  const answeredCount = computed(() =>
    Object.values(countsQuery.data.value ?? {}).reduce((total, count) => total + count, 0),
  )

  const activeParticipants = computed(() =>
    (participantsQuery.data.value ?? []).filter((person) => !person.is_kicked),
  )
  const participantCount = computed(() => activeParticipants.value.length)
  const doneCount = computed(
    () => activeParticipants.value.filter((person) => person.finished_at).length,
  )

  const { seconds, percent } = useCountdown(
    () => session.value?.question_started_at,
    () => session.value?.question_ends_at,
  )

  // Fullscreen needs a click, so it cannot start on its own when the page opens.
  const isFullscreen = ref(false)

  const syncFullscreen = () => {
    isFullscreen.value = document.fullscreenElement !== null
  }

  onMounted(() => document.addEventListener('fullscreenchange', syncFullscreen))
  onBeforeUnmount(() => document.removeEventListener('fullscreenchange', syncFullscreen))

  const onToggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen()
  }

  // Expose State and Actions
  return {
    sessionQuery,
    leaderboardQuery,
    countsQuery,
    session,
    questions,
    currentIndex,
    currentQuestion,
    isPretest,
    answeredCount,
    participantCount,
    doneCount,
    seconds,
    percent,
    isFullscreen,
    onToggleFullscreen,
  }
}
