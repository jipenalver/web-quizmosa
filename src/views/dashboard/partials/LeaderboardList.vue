<script setup lang="ts">
import { computed } from 'vue'
import type { LeaderboardRow } from '@/types/dashboard'

const props = withDefaults(
  defineProps<{
    rows: LeaderboardRow[]
    limit?: number
    large?: boolean
  }>(),
  { limit: undefined, large: false },
)

const visibleRows = computed(() => props.rows.slice(0, props.limit))
</script>

<template>
  <TransitionGroup class="d-flex flex-column ga-2" name="rank" tag="div">
    <div
      v-for="row in visibleRows"
      :key="row.participant_id"
      :class="large ? 'text-headline-medium py-3' : 'text-body-large py-2'"
      class="d-flex align-center ga-4 px-4 bg-surface rounded-lg"
    >
      <span class="font-weight-bold text-primary" style="min-width: 2.5em">#{{ row.rank }}</span>
      <span class="flex-grow-1 text-truncate">{{ row.display_name }}</span>
      <span class="font-weight-bold">{{ row.score }}</span>
    </div>
  </TransitionGroup>
</template>
