<script setup lang="ts">
import { computed } from 'vue'
import QueryState from '@/components/common/QueryState.vue'
import type { Participant } from '@/types/sessions'

const props = defineProps<{
  participants: Participant[]
  loading: boolean
  error: unknown
  canKick: boolean
}>()

const emit = defineEmits<{ kick: [participant: Participant]; retry: [] }>()

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
          :subtitle="participant.is_kicked ? 'Kicked' : undefined"
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
