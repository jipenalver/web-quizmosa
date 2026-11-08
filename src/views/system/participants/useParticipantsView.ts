import { computed, ref } from 'vue'
import { useParticipantsOverviewQuery } from '@/stores/dashboard'
import type { QuestionnaireKind } from '@/types/common'

export function useParticipantsView() {
  const participantsQuery = useParticipantsOverviewQuery()

  // States
  const search = ref('')
  const kind = ref<QuestionnaireKind | null>(null)
  const sessionId = ref<number | null>(null)

  const hostOptions = computed(() => {
    const hosts = new Map<number, string>()
    for (const row of participantsQuery.data.value ?? []) {
      hosts.set(row.session_id, `${row.join_code} · ${row.questionnaire_name}`)
    }
    return [...hosts].map(([value, title]) => ({ value, title }))
  })

  const rows = computed(() =>
    (participantsQuery.data.value ?? []).filter(
      (row) =>
        (!kind.value || row.kind === kind.value) &&
        (sessionId.value === null || row.session_id === sessionId.value),
    ),
  )

  // Expose State and Actions
  return { participantsQuery, search, kind, sessionId, hostOptions, rows }
}
