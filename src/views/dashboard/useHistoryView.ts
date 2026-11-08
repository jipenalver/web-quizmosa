import { computed, ref } from 'vue'
import { useHistoryQuery } from '@/stores/dashboard'
import { useSessionsQuery } from '@/stores/sessions'
import type { QuestionnaireKind } from '@/types/common'

export function useHistoryView() {
  const historyQuery = useHistoryQuery()
  const sessionsQuery = useSessionsQuery()

  // States
  const kind = ref<QuestionnaireKind | null>(null)
  const dateFrom = ref('')
  const dateTo = ref('')

  const runningHosts = computed(() =>
    (sessionsQuery.data.value ?? []).filter((session) => session.status !== 'finished'),
  )

  // get_history has no join code, but the sessions list is already loaded for this page.
  const joinCodes = computed(
    () =>
      new Map((sessionsQuery.data.value ?? []).map((session) => [session.id, session.join_code])),
  )

  const rows = computed(() => {
    const from = dateFrom.value ? new Date(`${dateFrom.value}T00:00:00`).getTime() : -Infinity
    const to = dateTo.value ? new Date(`${dateTo.value}T23:59:59.999`).getTime() : Infinity

    return (historyQuery.data.value ?? [])
      .filter((row) => {
        const endedAt = new Date(row.ended_at).getTime()
        return (!kind.value || row.kind === kind.value) && endedAt >= from && endedAt <= to
      })
      .map((row) => ({ ...row, join_code: joinCodes.value.get(row.session_id) ?? '–' }))
  })

  // Expose State and Actions
  return { historyQuery, sessionsQuery, kind, dateFrom, dateTo, runningHosts, rows }
}
