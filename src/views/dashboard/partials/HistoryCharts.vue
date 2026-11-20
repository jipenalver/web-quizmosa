<script setup lang="ts">
import { computed } from 'vue'
import type { ApexOptions } from 'apexcharts'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import AppChart from '@/components/common/AppChart.vue'
import type { SessionKind } from '@/types/common'
import type { HistoryRow } from '@/types/dashboard'
import { countAxis } from '@/utils/helpers/charts'
import { kindChartColors, kindLabels } from '@/utils/helpers/constants'
import { formatDate } from '@/utils/helpers/dates'

const props = defineProps<{ rows: HistoryRow[] }>()

const theme = useTheme()
const router = useRouter()

const kinds: SessionKind[] = ['pretest', 'posttest']

const palette = computed(() => kindChartColors[theme.global.current.value.dark ? 'dark' : 'light'])

const oldestFirst = computed(() => [...props.rows].reverse())

// One group per questionnaire, keyed by id because names are not unique.
const questionnaires = computed(() => [
  ...new Map(oldestFirst.value.map((row) => [row.questionnaire_id, row.questionnaire_name])),
])

// Both series always exist, so a kind keeps its color when a filter empties the other.
// A questionnaire hosted more than once as the same kind shows the mean over everyone in those
// hosts, so a small latecomer host does not count as much as a full room.
const scoreSeries = computed(() =>
  kinds.map((kind) => ({
    name: kindLabels[kind],
    data: questionnaires.value.map(([id]) => {
      const hosts = props.rows.filter((row) => row.questionnaire_id === id && row.kind === kind)
      if (hosts.length === 0) return null
      const people = hosts.reduce((sum, row) => sum + row.participant_count, 0)
      const points = hosts.reduce((sum, row) => sum + row.average_score * row.participant_count, 0)
      return people > 0 ? Number((points / people).toFixed(1)) : 0
    }),
  })),
)

const scoreOptions = computed<ApexOptions>(() => ({
  chart: {
    // Clicking a questionnaire's bars opens its pre-test vs post-test comparison.
    events: {
      dataPointSelection: (_event, _chart, options) => {
        const questionnaire = questionnaires.value[options?.dataPointIndex ?? -1]
        if (questionnaire) {
          router.push({ name: 'QuestionnaireComparison', params: { id: questionnaire[0] } })
        }
      },
    },
  },
  states: { active: { filter: { type: 'none' } } },
  colors: kinds.map((kind) => palette.value[kind]),
  plotOptions: {
    bar: { borderRadius: 4, borderRadiusApplication: 'end', columnWidth: '60%' },
  },
  xaxis: { categories: questionnaires.value.map(([, name]) => name) },
  yaxis: { min: 0, labels: { formatter: (value) => String(Math.round(value)) } },
  legend: { position: 'top', horizontalAlign: 'left', showForNullSeries: true },
  tooltip: { y: { formatter: (value) => (value === null ? '–' : String(Math.round(value))) } },
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
  colors: ['#E0441D'], // brand primary, the same in both themes
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
      <v-card class="pa-4 h-100">
        <span class="text-label">Average score, pre-test vs post-test</span>
        <AppChart
          :options="scoreOptions"
          :series="scoreSeries"
          label="Bar chart of average score per questionnaire, a pre-test bar next to a post-test bar. The table below has the same data."
          type="bar"
        />
        <div v-if="questionnaires.length > 0" class="d-flex flex-wrap align-center ga-2 mt-2">
          <span class="text-body-small text-muted">Compare participants:</span>
          <v-chip
            v-for="[id, name] in questionnaires"
            :key="id"
            :to="{ name: 'QuestionnaireComparison', params: { id } }"
            size="small"
            variant="tonal"
          >
            {{ name }}
          </v-chip>
        </div>
      </v-card>
    </v-col>

    <v-col cols="12" md="5">
      <v-card class="pa-4 h-100">
        <span class="text-label">Participants per host</span>
        <!-- Taller than the default 280 by the chip row under the score chart, so the charts line up. -->
        <AppChart
          :height="314"
          :options="participantOptions"
          :series="participantSeries"
          label="Bar chart of participants per host. The table below has the same data."
          type="bar"
        />
      </v-card>
    </v-col>
  </v-row>
</template>
