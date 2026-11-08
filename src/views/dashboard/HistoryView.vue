<script setup lang="ts">
import { useRouter } from 'vue-router'
import KindChip from '@/components/common/KindChip.vue'
import QueryState from '@/components/common/QueryState.vue'
import StatusChip from '@/components/common/StatusChip.vue'
import type { HistoryRow } from '@/types/dashboard'
import { formatPercent } from '@/utils/helpers/charts'
import { kindOptions } from '@/utils/helpers/constants'
import { formatDate } from '@/utils/helpers/dates'
import HistoryCharts from './partials/HistoryCharts.vue'
import { useHistoryView } from './useHistoryView'

const router = useRouter()

const { historyQuery, kind, dateFrom, dateTo, runningHosts, rows } = useHistoryView()

const { isPending, error, refetch } = historyQuery

const headers = [
  { title: 'Date', key: 'ended_at' },
  { title: 'Join code', key: 'join_code' },
  { title: 'Questionnaire', key: 'questionnaire_name' },
  { title: 'Kind', key: 'kind' },
  { title: 'Participants', key: 'participant_count', align: 'end' as const },
  { title: 'Average score', key: 'average_score', align: 'end' as const },
  { title: 'Average accuracy', key: 'average_accuracy', align: 'end' as const },
]

const onOpenRow = (_event: Event, { item }: { item: HistoryRow }) => {
  router.push({ name: 'HostDetail', params: { id: item.session_id } })
}
</script>

<template>
  <v-container>
    <div class="mb-6">
      <span class="text-label">Overview</span>
      <h1 class="text-headline-medium font-weight-bold">Dashboard</h1>
    </div>

    <v-card v-if="runningHosts.length > 0" class="pa-6 mb-6">
      <span class="text-label">Running now</span>
      <v-list class="mt-2" density="compact">
        <v-list-item
          v-for="host in runningHosts"
          :key="host.id"
          :subtitle="host.join_code"
          :title="host.questionnaires?.name"
          :to="{ name: 'LiveHost', params: { id: host.id } }"
          rounded="lg"
        >
          <template #append><StatusChip :status="host.status" /></template>
        </v-list-item>
      </v-list>
    </v-card>

    <div class="d-flex flex-wrap ga-4 mb-2">
      <v-select
        v-model="kind"
        :items="kindOptions"
        clearable
        density="comfortable"
        label="Kind"
        style="max-width: 220px"
      ></v-select>
      <v-text-field
        v-model="dateFrom"
        density="comfortable"
        label="From"
        style="max-width: 200px"
        type="date"
      ></v-text-field>
      <v-text-field
        v-model="dateTo"
        density="comfortable"
        label="To"
        style="max-width: 200px"
        type="date"
      ></v-text-field>
    </div>

    <QueryState
      :empty="rows.length === 0"
      :error="error"
      :loading="isPending"
      empty-text="Finished hosts show up here."
      empty-title="No history to show"
      @retry="refetch()"
    >
      <HistoryCharts :rows="rows" />

      <v-card class="pa-2 mt-6">
        <v-data-table
          :headers="headers"
          :items="rows"
          hover
          item-value="session_id"
          @click:row="onOpenRow"
        >
          <template #[`item.ended_at`]="{ item }">{{ formatDate(item.ended_at) }}</template>
          <template #[`item.kind`]="{ item }"><KindChip :kind="item.kind" /></template>
          <template #[`item.average_accuracy`]="{ item }">
            {{ formatPercent(item.average_accuracy) }}
          </template>
        </v-data-table>
      </v-card>
    </QueryState>
  </v-container>
</template>
