<script setup lang="ts">
import { computed } from 'vue'
import type { ChoiceKey } from '@/types/common'
import type { PlayQuestion, PlayReveal } from '@/types/play'
import { questionChoices } from '@/utils/helpers/questions'

const props = defineProps<{
  question: PlayQuestion
  reveal: PlayReveal | null
  myAnswer: ChoiceKey | null
  loading: boolean
}>()

const choices = computed(() => questionChoices(props.question))

// Pre-tests never receive a correct choice, so they get the plain "recorded" screen.
const isPretest = computed(() => props.reveal?.kind === 'pretest')

const headline = computed(() => {
  if (isPretest.value) return props.myAnswer ? 'Answer recorded' : 'No answer recorded'
  if (!props.reveal?.my_answer) return 'No answer'
  return props.reveal.my_answer.is_correct ? 'Correct!' : 'Not this time'
})

const choiceColor = (key: string) => {
  if (key === props.reveal?.correct_choice) return 'success'
  return key === props.reveal?.my_answer?.selected_choice ? 'error' : undefined
}
</script>

<template>
  <div v-if="loading" class="d-flex justify-center pa-6">
    <v-progress-circular color="primary" indeterminate></v-progress-circular>
  </div>

  <div v-else-if="reveal" class="d-flex flex-column ga-3">
    <v-card class="pa-6 text-center">
      <div class="text-headline-small font-weight-bold">{{ headline }}</div>
      <div v-if="reveal.my_answer" class="text-body-large mt-1">
        +{{ reveal.my_answer.points_awarded }} points
      </div>
      <div class="text-label mt-3">{{ reveal.points_so_far }} points so far</div>
    </v-card>

    <template v-if="!isPretest">
      <v-chip
        v-for="choice in choices"
        :key="choice.key"
        :color="choiceColor(choice.key)"
        :prepend-icon="choice.key === reveal.correct_choice ? 'mdi-check' : undefined"
        class="justify-start"
        label
        size="large"
        variant="tonal"
      >
        <span class="text-truncate">{{ choice.key }}. {{ choice.text }}</span>
        <template #append>
          <span class="ml-2 font-weight-bold">{{ reveal.counts?.[choice.key] ?? 0 }}</span>
        </template>
      </v-chip>
    </template>
  </div>

  <v-alert
    v-else
    text="The reveal is not available right now."
    type="info"
    variant="tonal"
  ></v-alert>
</template>
