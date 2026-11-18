<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  description: string
  winners: { key: string; name: string; value: string }[]
}>()

const heights = ['160px', '120px', '90px']

// Second, first, third, so the winner stands in the middle, like the big-screen podium.
const podium = computed(() =>
  [1, 0, 2].flatMap((place) => {
    const winner = props.winners[place]
    return winner ? [{ winner, place: place + 1, height: heights[place] }] : []
  }),
)
</script>

<template>
  <v-card class="pa-6 h-100">
    <span class="text-label">{{ description }}</span>
    <h2 class="text-title-large font-weight-bold mb-4">{{ title }}</h2>

    <div v-if="podium.length > 0" class="award-podium">
      <div
        v-for="{ winner, place, height } in podium"
        :key="winner.key"
        class="award-column d-flex flex-column justify-end"
      >
        <div class="font-weight-bold text-center text-truncate">{{ winner.name }}</div>
        <div class="text-body-medium text-muted text-center mb-2">{{ winner.value }}</div>
        <div
          :style="{ height }"
          class="award-block bg-primary d-flex align-start justify-center pt-3 font-weight-bold"
        >
          #{{ place }}
        </div>
      </div>
    </div>

    <p v-else class="text-body-medium text-muted">
      No winners yet. This needs participants who took both the pre-test and the post-test.
    </p>
  </v-card>
</template>

<style scoped>
.award-podium {
  align-items: flex-end;
  display: flex;
  gap: 16px;
  justify-content: center;
}

.award-column {
  flex: 1 1 0;
  max-width: 180px;
  min-width: 0;
}

.award-block {
  border-radius: 16px 16px 0 0;
  font-size: 1.75rem;
}
</style>
