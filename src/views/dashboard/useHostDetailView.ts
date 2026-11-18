import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHistoryQuery } from '@/stores/dashboard'
import { useSessionQuery, useSessionQuestionsQuery, useSessionReportQuery } from '@/stores/sessions'

export function useHostDetailView() {
  const route = useRoute()
  const sessionId = Number(route.params.id)

  const sessionQuery = useSessionQuery(sessionId)
  const reportQuery = useSessionReportQuery(sessionId)
  const historyQuery = useHistoryQuery()
  // The report has only the prompt; the choices and the key come from the questions.
  const questionsQuery = useSessionQuestionsQuery(() => sessionQuery.data.value?.questionnaire_id)

  const summary = computed(() =>
    historyQuery.data.value?.find((row) => row.session_id === sessionId),
  )

  const questionById = computed(
    () => new Map((questionsQuery.data.value ?? []).map((question) => [question.id, question])),
  )

  // Expose State and Actions
  return { sessionQuery, reportQuery, summary, questionById }
}
