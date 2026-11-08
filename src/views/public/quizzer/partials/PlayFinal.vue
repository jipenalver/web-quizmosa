<script setup lang="ts">
import type { LeaderboardRow } from '@/types/dashboard'

defineProps<{
  result: LeaderboardRow | undefined
  players: number
  loading: boolean
}>()
</script>

<template>
  <div v-if="loading" class="d-flex justify-center pa-12">
    <v-progress-circular color="primary" indeterminate></v-progress-circular>
  </div>

  <v-card v-else class="pa-8 text-center">
    <span class="text-label">Final rank</span>

    <template v-if="result">
      <div class="text-display-large font-weight-bold text-primary mt-2">#{{ result.rank }}</div>
      <p class="text-body-medium text-muted">out of {{ players }}</p>
      <p class="text-title-large font-weight-bold mt-4">{{ result.score }} points</p>
      <p class="text-body-medium text-muted">{{ result.correct_count }} correct</p>
    </template>

    <p v-else class="text-body-large mt-2">The quiz has ended.</p>
  </v-card>
</template>
