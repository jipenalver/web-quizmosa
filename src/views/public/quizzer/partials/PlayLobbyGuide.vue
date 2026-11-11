<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ selfPaced: boolean }>()

// Worded to hold for every kind: a pre-test never shows the correct answer.
const steps = computed(() =>
  props.selfPaced
    ? [
        {
          title: 'Wait for the host',
          text: 'A Start button appears here when the host opens the pre-test.',
        },
        {
          title: 'Tap your answer',
          text: 'Choose before the timer ends. Your first tap is final.',
        },
        {
          title: 'Go at your own pace',
          text: 'Tap Next question when you are ready. Each question has its own timer.',
        },
        {
          title: 'See your rank',
          text: 'Your rank shows when the host finishes the pre-test.',
        },
      ]
    : [
        {
          title: 'Watch this screen',
          text: 'Questions appear here when the host starts. Keep this page open.',
        },
        {
          title: 'Tap your answer',
          text: 'Choose before the timer ends. Your first tap is final.',
        },
        {
          title: 'Be quick',
          text: 'Correct answers earn more points the faster you tap. Wrong answers earn 0.',
        },
        {
          title: 'Check your points',
          text: 'Your points appear when the host reveals each question.',
        },
      ],
)
</script>

<template>
  <v-card class="pa-6">
    <span class="text-label">How to play</span>

    <ol class="guide-steps d-flex flex-column ga-4 mt-4">
      <li v-for="(step, index) in steps" :key="step.title" class="d-flex ga-4">
        <span class="text-title-medium font-weight-bold text-primary">{{ index + 1 }}</span>
        <div>
          <div class="text-title-small font-weight-bold">{{ step.title }}</div>
          <p class="text-body-medium text-muted">{{ step.text }}</p>
        </div>
      </li>
    </ol>
  </v-card>
</template>

<style scoped>
.guide-steps {
  list-style: none;
  padding: 0;
}
</style>
