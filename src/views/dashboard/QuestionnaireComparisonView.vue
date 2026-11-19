<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import QueryState from '@/components/common/QueryState.vue'
import { useExportPdf } from '@/utils/helpers/print'
import AwardPodium from './partials/AwardPodium.vue'
import { useQuestionnaireComparisonView } from './useQuestionnaireComparisonView'

const { questionnaireQuery, comparisonQuery, rows, bestQuizmosa, kalamboan } =
  useQuestionnaireComparisonView()

const { data: questionnaire } = questionnaireQuery
const { data, isPending, error, refetch } = comparisonQuery

type Row = (typeof rows.value)[number]

// Score first, then the faster correct-answer time, as on the leaderboard; descending puts the
// best first. A missing test sorts as the lowest score.
const byScoreThenSpeed =
  (score: (row: Row) => number | null, ms: (row: Row) => number | null) => (a: Row, b: Row) => {
    const scoreA = score(a) ?? -Infinity
    const scoreB = score(b) ?? -Infinity
    return (scoreA === scoreB ? 0 : scoreA - scoreB) || (ms(b) ?? 0) - (ms(a) ?? 0)
  }

const headers = [
  { title: 'Participant', key: 'full_name' },
  {
    title: 'Pre-test',
    key: 'pre_score',
    align: 'end' as const,
    sortRaw: byScoreThenSpeed(
      (row) => row.pre_score,
      (row) => row.pre_correct_ms,
    ),
  },
  {
    title: 'Post-test',
    key: 'post_score',
    align: 'end' as const,
    sortRaw: byScoreThenSpeed(
      (row) => row.post_score,
      (row) => row.post_correct_ms,
    ),
  },
  {
    title: 'Total',
    key: 'total',
    align: 'end' as const,
    sortRaw: byScoreThenSpeed(
      (row) => row.total,
      (row) => row.totalMs,
    ),
  },
  {
    title: 'Gap',
    key: 'gap',
    align: 'end' as const,
    sortRaw: byScoreThenSpeed(
      (row) => row.gap,
      (row) => row.totalMs,
    ),
  },
]

const itemsPerPage = ref(10)
const exportPdf = useExportPdf()

// The PDF holds every participant, not just the current table page.
const onExportPdf = () =>
  exportPdf(`${questionnaire.value?.name ?? 'Questionnaire'} · Pre-test vs post-test`, () => {
    const previous = itemsPerPage.value
    itemsPerPage.value = -1
    return () => (itemsPerPage.value = previous)
  })

const formatGap = (gap: number) => (gap > 0 ? `+${gap}` : String(gap))
const getGap = (item: unknown) => (item as Row).gap

const bestWinners = computed(() =>
  bestQuizmosa.value.map((row) => ({
    key: row.key,
    name: row.full_name,
    value: `${row.total} points`,
  })),
)

const kalamboanWinners = computed(() =>
  kalamboan.value.map((row) => ({
    key: row.key,
    name: row.full_name,
    value: `${formatGap(row.gap!)} points`,
  })),
)
</script>

<template>
  <v-container>
    <RouterLink :to="{ name: 'Dashboard' }" class="text-body-medium text-muted d-print-none">
      Back to dashboard
    </RouterLink>

    <div class="d-flex flex-wrap align-start justify-space-between ga-4 mt-2 mb-6">
      <div>
        <span class="text-label">Pre-test vs post-test</span>
        <h1 class="text-headline-medium font-weight-bold">{{ questionnaire?.name }}</h1>
      </div>

      <v-btn
        :disabled="isPending || rows.length === 0"
        class="d-print-none"
        prepend-icon="mdi-file-pdf-box"
        variant="tonal"
        @click="onExportPdf"
      >
        Export PDF
      </v-btn>
    </div>

    <QueryState
      :empty="data?.length === 0"
      :error="error"
      :loading="isPending"
      empty-text="Participants appear here once a pre-test or post-test of this questionnaire has finished."
      empty-title="No finished hosts yet"
      @retry="refetch()"
    >
      <v-row>
        <v-col class="print-full-width" cols="12" md="6">
          <AwardPodium
            :winners="bestWinners"
            description="Highest pre-test plus post-test score"
            title="Best Quizmosa Award"
          />
        </v-col>
        <v-col class="print-full-width" cols="12" md="6">
          <AwardPodium
            :winners="kalamboanWinners"
            description="Biggest gain from pre-test to post-test"
            title="Kalamboan Award"
          />
        </v-col>
      </v-row>

      <v-card class="pa-2 mt-6">
        <v-data-table
          v-model:items-per-page="itemsPerPage"
          :headers="headers"
          :items="rows"
          :sort-by="[{ key: 'total', order: 'desc' }]"
          item-value="key"
        >
          <template #[`item.full_name`]="{ item }">
            <div class="py-2">
              <div class="font-weight-bold">{{ item.full_name }}</div>
              <div v-if="item.alias || item.matched_by_name" class="text-body-small text-muted">
                {{ item.alias }}
                <v-chip v-if="item.matched_by_name" class="ml-1" size="x-small" variant="tonal">
                  Matched by name
                </v-chip>
              </div>
            </div>
          </template>
          <template #[`item.pre_score`]="{ item }">{{ item.pre_score ?? '–' }}</template>
          <template #[`item.post_score`]="{ item }">{{ item.post_score ?? '–' }}</template>
          <template #[`item.total`]="{ item }">{{ item.total ?? '–' }}</template>
          <template #[`item.gap`]="{ item }">
            <span
              :class="{
                'text-success': getGap(item) !== null && getGap(item)! > 0,
                'text-error': getGap(item) !== null && getGap(item)! < 0,
              }"
            >
              {{ item.gap === null ? '–' : formatGap(item.gap) }}
            </span>
          </template>
        </v-data-table>
      </v-card>
    </QueryState>
  </v-container>
</template>
