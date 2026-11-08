<script setup lang="ts">
import { computed } from 'vue'
import type { ChoiceKey } from '@/types/common'

const props = defineProps<{
  choices: { key: ChoiceKey; text: string }[]
  counts: Partial<Record<ChoiceKey, number>>
  correct: string | null
}>()

const highest = computed(() => Math.max(1, ...Object.values(props.counts)))

const countOf = (key: ChoiceKey) => props.counts[key] ?? 0
</script>

<template>
  <div class="d-flex flex-column ga-5">
    <div v-for="choice in choices" :key="choice.key">
      <div class="d-flex align-center ga-3 distribution-label">
        <v-icon v-if="choice.key === correct" color="success" icon="mdi-check-circle"></v-icon>
        <span class="font-weight-bold">{{ choice.key }}</span>
        <span class="flex-grow-1 text-truncate">{{ choice.text }}</span>
        <span class="font-weight-bold">{{ countOf(choice.key) }}</span>
      </div>
      <div class="distribution-track mt-2">
        <div
          :class="choice.key === correct ? 'bg-primary' : 'distribution-bar'"
          :style="{ width: `${(countOf(choice.key) / highest) * 100}%` }"
          class="distribution-fill"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.distribution-label {
  font-size: clamp(1.25rem, 2.2vw, 2.25rem);
}

.distribution-track {
  background: rgb(var(--v-theme-surface));
  border-radius: 4px;
  height: 20px;
}

.distribution-fill {
  border-radius: 4px;
  height: 100%;
  transition: width 0.5s ease;
}

.distribution-bar {
  background: rgb(var(--v-theme-muted));
}

@media (prefers-reduced-motion: reduce) {
  .distribution-fill {
    transition: none;
  }
}
</style>
