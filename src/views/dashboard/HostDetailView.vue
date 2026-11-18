<script setup lang="ts">
import { computed, nextTick } from 'vue'
import type { ApexOptions } from 'apexcharts'
import { RouterLink } from 'vue-router'
import { useTheme } from 'vuetify'
import AppChart from '@/components/common/AppChart.vue'
import KindChip from '@/components/common/KindChip.vue'
import QueryState from '@/components/common/QueryState.vue'
import { countAxis, formatPercent, scoreBins } from '@/utils/helpers/charts'
import { formatDate } from '@/utils/helpers/dates'
import { questionChoices } from '@/utils/helpers/questions'
import { useHostDetailView } from './useHostDetailView'

const { sessionQuery, reportQuery, summary, questionById } = useHostDetailView()

const { data: session } = sessionQuery
const { data: report, isPending, error, refetch } = reportQuery

const questions = computed(() => report.value?.questions ?? [])

const theme = useTheme()

// The browser's print dialog saves the PDF. The report always prints in the light theme,
// and the document title becomes the suggested file name.
const onExportPdf = async () => {
  const previousTheme = theme.global.name.value
  const previousTitle = document.title

  theme.change('light')
  document.title = [session.value?.questionnaires?.name, session.value?.join_code]
    .filter(Boolean)
    .join(' · ')
  await nextTick()
  // Let the charts redraw in the light colors before the page is captured.
  await new Promise((resolve) => setTimeout(resolve, 300))

  window.print()

  document.title = previousTitle
  theme.change(previousTheme)
}

// Report rows with the choices and the correct key, once the questions have loaded.
const questionRows = computed(() =>
  questions.value.map((question) => {
    const full = questionById.value.get(question.question_id)
    return {
      ...question,
      choices: full ? questionChoices(full) : [],
      correct: full?.question_keys?.correct_choice ?? null,
    }
  }),
)

// Unanswered questions have null accuracy and response time, so null sorts as the lowest.
const nullableSort = (a: number | null, b: number | null) => (a ?? -1) - (b ?? -1)

const questionHeaders = [
  { title: 'Question', key: 'prompt', sortable: false },
  { title: 'Answered', key: 'answered', align: 'end' as const },
  { title: 'Accuracy', key: 'accuracy', align: 'end' as const, sort: nullableSort },
  {
    title: 'Average response',
    key: 'average_response_ms',
    align: 'end' as const,
    sort: nullableSort,
  },
]

const barOptions = (formatter: (value: number) => string): ApexOptions => ({
  colors: ['#E0441D'],
  plotOptions: {
    bar: { borderRadius: 4, borderRadiusApplication: 'end', columnWidth: '50%' },
  },
  yaxis: { min: 0, forceNiceScale: true, labels: { formatter } },
  tooltip: { y: { formatter } },
  legend: { show: false },
})

const scoreSeries = computed(() => [
  { name: 'Participants', data: scoreBins(report.value?.scores ?? []) },
])

const scoreOptions = computed<ApexOptions>(() => ({
  ...barOptions((value) => String(Math.round(value))),
  yaxis: countAxis(Math.max(0, ...scoreSeries.value[0]!.data.map((bin) => bin.y))),
}))

const accuracySeries = computed(() => [
  {
    name: 'Accuracy',
    data: questions.value.map((question) => ({
      x: `Q${question.position}`,
      y: Math.round((question.accuracy ?? 0) * 100),
    })),
  },
])

const responseSeries = computed(() => [
  {
    name: 'Average response',
    data: questions.value.map((question) => ({
      x: `Q${question.position}`,
      y: Number(((question.average_response_ms ?? 0) / 1000).toFixed(1)),
    })),
  },
])
</script>

<template>
  <v-container>
    <RouterLink :to="{ name: 'Dashboard' }" class="text-body-medium text-muted d-print-none">
      Back to dashboard
    </RouterLink>

    <div v-if="session" class="d-flex flex-wrap align-start justify-space-between ga-4 mt-2 mb-6">
      <div>
        <h1 class="text-headline-medium font-weight-bold">{{ session.questionnaires?.name }}</h1>
        <div class="d-flex align-center ga-3 mt-1">
          <KindChip :kind="session.kind" />
          <span v-if="session.ended_at" class="text-body-medium text-muted">
            {{ formatDate(session.ended_at) }}
          </span>
        </div>
      </div>

      <v-btn
        :disabled="isPending || questions.length === 0"
        class="d-print-none"
        prepend-icon="mdi-file-pdf-box"
        variant="tonal"
        @click="onExportPdf"
      >
        Export PDF
      </v-btn>
    </div>

    <QueryState
      :empty="questions.length === 0"
      :error="error"
      :loading="isPending"
      empty-title="No results yet"
      @retry="refetch()"
    >
      <v-row v-if="summary">
        <v-col cols="12" sm="4">
          <v-card class="pa-6">
            <span class="text-label">Participants</span>
            <div class="text-display-small font-weight-bold">{{ summary.participant_count }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card class="pa-6">
            <span class="text-label">Average score</span>
            <div class="text-display-small font-weight-bold">{{ summary.average_score }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card class="pa-6">
            <span class="text-label">Average accuracy</span>
            <div class="text-display-small font-weight-bold">
              {{ formatPercent(summary.average_accuracy) }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="4">
          <v-card class="pa-4">
            <span class="text-label">Score distribution</span>
            <AppChart
              :options="scoreOptions"
              :series="scoreSeries"
              label="Bar chart of how many participants scored in each range."
              type="bar"
            />
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="pa-4">
            <span class="text-label">Accuracy per question</span>
            <AppChart
              :options="barOptions((value) => `${Math.round(value)}%`)"
              :series="accuracySeries"
              label="Bar chart of accuracy per question. The table below has the same data."
              type="bar"
            />
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="pa-4">
            <span class="text-label">Average response time</span>
            <AppChart
              :options="barOptions((value) => `${value.toFixed(1)}s`)"
              :series="responseSeries"
              label="Bar chart of average response time per question. The table below has the same data."
              type="bar"
            />
          </v-card>
        </v-col>
      </v-row>

      <v-card class="pa-2 mt-6">
        <v-data-table
          :headers="questionHeaders"
          :items="questionRows"
          :items-per-page="-1"
          hide-default-footer
          item-value="question_id"
        >
          <template #[`item.prompt`]="{ item }">
            <div class="py-3">
              <div class="font-weight-bold">Q{{ item.position }}. {{ item.prompt }}</div>
              <div
                v-for="choice in item.choices"
                :key="choice.key"
                :class="choice.key === item.correct ? 'text-success font-weight-bold' : 'text-muted'"
                class="text-body-medium mt-1"
              >
                {{ choice.key }}. {{ choice.text }}
                <v-icon v-if="choice.key === item.correct" icon="mdi-check" size="small"></v-icon>
              </div>
            </div>
          </template>
          <template #[`item.accuracy`]="{ item }">{{ formatPercent(item.accuracy) }}</template>
          <template #[`item.average_response_ms`]="{ item }">
            <span class="text-no-wrap">
              {{
                item.average_response_ms === null
                  ? '–'
                  : `${(item.average_response_ms / 1000).toFixed(1)}s`
              }}
            </span>
          </template>
        </v-data-table>
      </v-card>
    </QueryState>
  </v-container>
</template>
