<script setup lang="ts">
import KindChip from '@/components/common/KindChip.vue'
import QueryState from '@/components/common/QueryState.vue'
import type { ParticipantOverviewRow } from '@/types/dashboard'
import { kindOptions } from '@/utils/helpers/constants'
import { formatDate } from '@/utils/helpers/dates'
import { useParticipantsView } from './useParticipantsView'

const { participantsQuery, search, kind, sessionId, hostOptions, rows } = useParticipantsView()

const { data, isPending, error, refetch } = participantsQuery

const headers = [
  { title: 'Display name', key: 'display_name' },
  { title: 'Full name', key: 'full_name' },
  { title: 'Host', key: 'join_code' },
  { title: 'Questionnaire', key: 'questionnaire_name' },
  { title: 'Kind', key: 'kind' },
  {
    title: 'Score',
    key: 'score',
    align: 'end' as const,
    // Ties go to the faster player, as on the leaderboard. Descending puts the best first.
    sortRaw: (a: ParticipantOverviewRow, b: ParticipantOverviewRow) =>
      a.score - b.score || b.total_correct_ms - a.total_correct_ms,
  },
  { title: 'Joined', key: 'joined_at' },
]
</script>

<template>
  <v-container>
    <div class="mb-6">
      <span class="text-label">Everyone who joined</span>
      <h1 class="text-headline-medium font-weight-bold">Participants</h1>
    </div>

    <div class="d-flex flex-wrap ga-4 mb-2">
      <v-text-field
        v-model="search"
        clearable
        density="comfortable"
        label="Search"
        prepend-inner-icon="mdi-magnify"
        style="max-width: 320px"
      ></v-text-field>
      <v-select
        v-model="kind"
        :items="kindOptions"
        clearable
        density="comfortable"
        label="Kind"
        style="max-width: 220px"
      ></v-select>
      <v-select
        v-model="sessionId"
        :items="hostOptions"
        clearable
        density="comfortable"
        label="Host"
        style="max-width: 320px"
      ></v-select>
    </div>

    <v-card class="pa-2">
      <QueryState
        :empty="data?.length === 0"
        :error="error"
        :loading="isPending"
        empty-text="People appear here after they join a host."
        empty-title="No participants yet"
        @retry="refetch()"
      >
        <v-data-table :headers="headers" :items="rows" :search="search" item-value="participant_id">
          <template #[`item.display_name`]="{ item }">
            {{ item.display_name }}
            <v-chip v-if="item.is_kicked" class="ml-2" size="x-small" variant="tonal"
              >Kicked</v-chip
            >
          </template>
          <template #[`item.kind`]="{ item }"><KindChip :kind="item.kind" /></template>
          <template #[`item.joined_at`]="{ item }">{{ formatDate(item.joined_at) }}</template>
        </v-data-table>
      </QueryState>
    </v-card>
  </v-container>
</template>
