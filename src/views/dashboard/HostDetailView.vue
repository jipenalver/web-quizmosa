<script setup lang="ts">
import { computed } from 'vue'
import type { ApexOptions } from 'apexcharts'
import { RouterLink } from 'vue-router'
import AppChart from '@/components/common/AppChart.vue'
import KindChip from '@/components/common/KindChip.vue'
import QueryState from '@/components/common/QueryState.vue'
import { countAxis, formatPercent, scoreBins } from '@/utils/helpers/charts'
import { formatDate } from '@/utils/helpers/dates'
import { useHostDetailView } from './useHostDetailView'

const { sessionQuery, reportQuery, summary } = useHostDetailView()

const { data: session } = sessionQuery
const { data: report, isPending, error, refetch } = reportQuery

const questions = computed(() => report.value?.questions ?? [])

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
    <RouterLink :to="{ name: 'Dashboard' }" class="text-body-medium text-muted">
      Back to dashboard
    </RouterLink>

    <div v-if="session" class="mt-2 mb-6">
      <h1 class="text-headline-medium font-weight-bold">{{ session.questionnaires?.name }}</h1>
      <div class="d-flex align-center ga-3 mt-1">
        <KindChip :kind="session.kind" />
        <span v-if="session.ended_at" class="text-body-medium text-muted">
          {{ formatDate(session.ended_at) }}
        </span>
      </div>
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
        <v-table>
          <thead>
            <tr>
              <th>Question</th>
              <th class="text-right">Answered</th>
              <th class="text-right">Accuracy</th>
              <th class="text-right">Average response</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="question in questions" :key="question.question_id">
              <td>Q{{ question.position }}. {{ question.prompt }}</td>
              <td class="text-right">{{ question.answered }}</td>
              <td class="text-right">{{ formatPercent(question.accuracy) }}</td>
              <td class="text-right text-no-wrap">
                {{
                  question.average_response_ms === null
                    ? '–'
                    : `${(question.average_response_ms / 1000).toFixed(1)}s`
                }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </QueryState>
  </v-container>
</template>
