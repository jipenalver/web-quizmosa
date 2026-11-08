<script setup lang="ts">
import { computed } from 'vue'
import type { ApexOptions } from 'apexcharts'
import { useTheme } from 'vuetify'
import AppChart from '@/components/common/AppChart.vue'
import type { QuestionnaireKind } from '@/types/common'
import type { HistoryRow } from '@/types/dashboard'
import { countAxis } from '@/utils/helpers/charts'
import { kindChartColors, kindLabels } from '@/utils/helpers/constants'
import { formatDate } from '@/utils/helpers/dates'

const props = defineProps<{ rows: HistoryRow[] }>()

const theme = useTheme()

const kinds: QuestionnaireKind[] = ['standard', 'pretest', 'posttest']

const palette = computed(() => kindChartColors[theme.global.current.value.dark ? 'dark' : 'light'])

const oldestFirst = computed(() => [...props.rows].reverse())

// All three series always exist, so a kind keeps its color when a filter empties another.
const scoreSeries = computed(() =>
  kinds.map((kind) => ({
    name: kindLabels[kind],
    data: oldestFirst.value
      .filter((row) => row.kind === kind)
      .map((row) => ({ x: new Date(row.ended_at).getTime(), y: row.average_score })),
  })),
)

const scoreOptions = computed<ApexOptions>(() => ({
  colors: kinds.map((kind) => palette.value[kind]),
  stroke: { curve: 'straight', width: 2 },
  markers: { size: 5, strokeWidth: 2, hover: { size: 7 } },
  xaxis: { type: 'datetime', labels: { datetimeUTC: false } },
  yaxis: { min: 0, labels: { formatter: (value) => String(Math.round(value)) } },
  legend: { position: 'top', horizontalAlign: 'left', showForNullSeries: true },
  tooltip: { x: { format: 'dd MMM yyyy' } },
}))

const participantSeries = computed(() => [
  {
    name: 'Participants',
    data: oldestFirst.value.map((row) => ({
      x: `${formatDate(row.ended_at)} · ${row.questionnaire_name}`,
      y: row.participant_count,
    })),
  },
])

const participantOptions = computed<ApexOptions>(() => ({
  colors: [palette.value.standard],
  plotOptions: {
    bar: { borderRadius: 4, borderRadiusApplication: 'end', columnWidth: '50%' },
  },
  xaxis: { labels: { show: false }, axisTicks: { show: false } },
  yaxis: countAxis(Math.max(...props.rows.map((row) => row.participant_count))),
  legend: { show: false },
}))
</script>

<template>
  <v-row>
    <v-col cols="12" md="7">
      <v-card class="pa-4">
        <span class="text-label">Average score over time</span>
        <AppChart
          :options="scoreOptions"
          :series="scoreSeries"
          label="Line chart of average score per host over time, one line per kind. The table below has the same data."
          type="line"
        />
      </v-card>
    </v-col>

    <v-col cols="12" md="5">
      <v-card class="pa-4">
        <span class="text-label">Participants per host</span>
        <AppChart
          :options="participantOptions"
          :series="participantSeries"
          label="Bar chart of participants per host. The table below has the same data."
          type="bar"
        />
      </v-card>
    </v-col>
  </v-row>
</template>
