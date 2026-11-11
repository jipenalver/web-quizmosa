<script setup lang="ts">
import { computed } from 'vue'
import QueryState from '@/components/common/QueryState.vue'
import type { Participant } from '@/types/sessions'

const props = defineProps<{
  participants: Participant[]
  loading: boolean
  error: unknown
  canKick: boolean
  // Set on a pre-test, where each quizzer moves at their own pace.
  progressTotal?: number
}>()

const emit = defineEmits<{ kick: [participant: Participant]; retry: [] }>()

const progressText = (participant: Participant) => {
  if (participant.is_kicked) return 'Kicked'
  if (props.progressTotal === undefined) return undefined
  if (participant.finished_at) return 'Done'
  if (participant.questions_served === 0) return 'Not started'
  return `Question ${participant.questions_served} of ${props.progressTotal}`
}

const activeCount = computed(
  () => props.participants.filter((participant) => !participant.is_kicked).length,
)
</script>

<template>
  <v-card class="pa-6">
    <span class="text-label">Participants · {{ activeCount }}</span>

    <QueryState
      :empty="participants.length === 0"
      :error="error"
      :loading="loading"
      empty-text="They appear here as they join."
      empty-title="Nobody yet"
      @retry="emit('retry')"
    >
      <v-list class="mt-2" density="compact">
        <v-list-item
          v-for="participant in participants"
          :key="participant.id"
          :class="{ 'opacity-50': participant.is_kicked }"
          :subtitle="progressText(participant)"
          :title="participant.display_name"
        >
          <template v-if="canKick && !participant.is_kicked" #append>
            <v-btn
              :aria-label="`Kick ${participant.display_name}`"
              density="comfortable"
              icon="mdi-account-remove-outline"
              size="small"
              variant="text"
              @click="emit('kick', participant)"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>
    </QueryState>
  </v-card>
</template>
