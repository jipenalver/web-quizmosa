import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuestionnaireComparisonQuery } from '@/stores/dashboard'
import { useQuestionnaireQuery } from '@/stores/questionnaires'

export function useQuestionnaireComparisonView() {
  const route = useRoute()
  const questionnaireId = Number(route.params.id)

  const questionnaireQuery = useQuestionnaireQuery(questionnaireId)
  const comparisonQuery = useQuestionnaireComparisonQuery(questionnaireId)

  // Total and gap need both tests, so they stay null for someone who took only one.
  const rows = computed(() =>
    (comparisonQuery.data.value ?? []).map((row) => {
      const isComplete = row.pre_score !== null && row.post_score !== null
      return {
        ...row,
        key: `${row.pre_quizzer_id ?? '-'}:${row.post_quizzer_id ?? '-'}`,
        total: isComplete ? row.pre_score! + row.post_score! : null,
        gap: isComplete ? row.post_score! - row.pre_score! : null,
        totalMs: (row.pre_correct_ms ?? 0) + (row.post_correct_ms ?? 0),
      }
    }),
  )

  const complete = computed(() => rows.value.filter((row) => row.total !== null))

  // Ties go to the faster player, as on the leaderboard.
  const bestQuizmosa = computed(() =>
    [...complete.value].sort((a, b) => b.total! - a.total! || a.totalMs - b.totalMs).slice(0, 3),
  )

  // Raw points gained from pre-test to post-test. No gain, no award.
  const kalamboan = computed(() =>
    complete.value
      .filter((row) => row.gap! > 0)
      .sort((a, b) => b.gap! - a.gap! || a.totalMs - b.totalMs)
      .slice(0, 3),
  )

  // Expose State and Actions
  return { questionnaireQuery, comparisonQuery, rows, bestQuizmosa, kalamboan }
}
