<script setup lang="ts">
import { computed } from 'vue'
import CountdownRing from '@/components/common/CountdownRing.vue'
import QuestionImage from '@/components/common/QuestionImage.vue'
import type { SessionStatus } from '@/types/common'
import type { QuestionWithKey } from '@/types/questionnaires'

const props = defineProps<{
  question: QuestionWithKey
  status: SessionStatus
  index: number
  total: number
  answered: number
  participants: number
  countdownSeconds: number
  countdownPercent: number
}>()

const choices = computed(() =>
  [
    { key: 'A', text: props.question.choice_a },
    { key: 'B', text: props.question.choice_b },
    { key: 'C', text: props.question.choice_c },
    { key: 'D', text: props.question.choice_d },
  ].filter((choice) => choice.text),
)

const isCorrect = (key: string) =>
  props.status === 'reveal' && props.question.question_keys?.correct_choice === key
</script>

<template>
  <v-card class="pa-6">
    <div class="d-flex align-start justify-space-between ga-4">
      <div style="min-width: 0">
        <span class="text-label">Question {{ index + 1 }} of {{ total }}</span>
        <h2 class="text-headline-small font-weight-bold mt-1">{{ question.prompt }}</h2>
      </div>

      <CountdownRing
        v-if="status === 'question'"
        :percent="countdownPercent"
        :seconds="countdownSeconds"
        :size="80"
      />
    </div>

    <QuestionImage
      v-if="question.image_path"
      :path="question.image_path"
      class="mt-4"
      height="200"
      style="max-width: 360px"
    />

    <div class="d-flex flex-column ga-2 mt-4">
      <v-chip
        v-for="choice in choices"
        :key="choice.key"
        :color="isCorrect(choice.key) ? 'success' : undefined"
        :prepend-icon="isCorrect(choice.key) ? 'mdi-check' : undefined"
        label
        variant="tonal"
      >
        {{ choice.key }}. {{ choice.text }}
      </v-chip>
    </div>

    <p class="text-title-medium font-weight-bold mt-4">
      {{ answered }} / {{ participants }} answered
    </p>
  </v-card>
</template>
