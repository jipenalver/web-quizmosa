<script setup lang="ts">
import { computed } from 'vue'
import type { LeaderboardRow } from '@/types/dashboard'
import LeaderboardList from './LeaderboardList.vue'

const props = defineProps<{ rows: LeaderboardRow[] }>()

const heights = ['70%', '54%', '40%']

// Second, first, third, so the winner stands in the middle.
const podium = computed(() =>
  [1, 0, 2].flatMap((place) => {
    const row = props.rows[place]
    return row ? [{ row, height: heights[place] }] : []
  }),
)

const others = computed(() => props.rows.slice(3))
</script>

<template>
  <div :class="{ 'podium-layout--solo': others.length === 0 }" class="podium-layout">
    <div class="podium">
      <div
        v-for="{ row, height } in podium"
        :key="row.participant_id"
        class="podium-column d-flex flex-column justify-end"
      >
        <div class="podium-name font-weight-bold text-center text-truncate">
          {{ row.display_name }}
        </div>
        <div class="podium-score text-center mb-3">{{ row.score }}</div>
        <div
          :style="{ height }"
          class="podium-block bg-primary d-flex align-start justify-center pt-4 font-weight-bold"
        >
          #{{ row.rank }}
        </div>
      </div>
    </div>

    <LeaderboardList v-if="others.length > 0" :limit="7" :rows="others" large />
  </div>
</template>

<style scoped>
.podium-layout {
  display: grid;
  gap: 48px;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
}

.podium-layout--solo {
  grid-template-columns: minmax(0, 1fr);
}

.podium {
  align-items: flex-end;
  display: flex;
  gap: 24px;
  height: 100%;
  justify-content: center;
  min-height: 60vh;
}

.podium-column {
  flex: 1 1 0;
  height: 100%;
  max-width: 280px;
  min-width: 0;
}

.podium-name {
  font-size: clamp(1.5rem, 2.8vw, 3rem);
}

.podium-score {
  font-size: clamp(1.25rem, 2vw, 2rem);
}

.podium-block {
  border-radius: 24px 24px 0 0;
  font-size: clamp(2rem, 4vw, 4rem);
}
</style>
