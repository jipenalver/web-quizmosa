<script setup lang="ts">
import { computed } from 'vue'
import type { ChoiceKey } from '@/types/common'
import type { PlayQuestion } from '@/types/play'
import { questionChoices } from '@/utils/helpers/questions'

const props = defineProps<{
  question: PlayQuestion
  selected: ChoiceKey | null
  disabled: boolean
}>()

const emit = defineEmits<{ answer: [choice: ChoiceKey] }>()

const choices = computed(() => questionChoices(props.question))

const onChoose = (choice: ChoiceKey) => {
  if (!props.disabled) emit('answer', choice)
}
</script>

<template>
  <div class="d-flex flex-column ga-3">
    <v-btn
      v-for="choice in choices"
      :key="choice.key"
      :color="selected === choice.key ? 'primary' : undefined"
      :disabled="disabled && selected !== choice.key"
      :readonly="disabled"
      :variant="selected === choice.key ? 'flat' : 'tonal'"
      block
      class="choice-button text-body-large"
      rounded="xl"
      @click="onChoose(choice.key)"
    >
      <span class="font-weight-bold mr-3">{{ choice.key }}</span>
      {{ choice.text }}
    </v-btn>
  </div>
</template>
