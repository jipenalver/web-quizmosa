<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import KindChip from '@/components/common/KindChip.vue'
import QueryState from '@/components/common/QueryState.vue'
import StatusChip from '@/components/common/StatusChip.vue'
import { useLeaderboardQuery } from '@/stores/dashboard'
import { useSessionQuery, useSessionRealtime } from '@/stores/sessions'
import LeaderboardList from './partials/LeaderboardList.vue'

const route = useRoute()
const sessionId = Number(route.params.id)

const { data: session } = useSessionQuery(sessionId)
const { data: leaderboard, isPending, error, refetch } = useLeaderboardQuery(sessionId)

useSessionRealtime(sessionId)
</script>

<template>
  <v-container>
    <RouterLink :to="{ name: 'Dashboard' }" class="text-body-medium text-muted">
      Back to dashboard
    </RouterLink>

    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mt-2 mb-6">
      <div v-if="session">
        <h1 class="text-headline-medium font-weight-bold">{{ session.questionnaires?.name }}</h1>
        <div class="d-flex align-center ga-2 mt-1">
          <KindChip :kind="session.kind" />
          <StatusChip :status="session.status" />
        </div>
      </div>

      <div class="d-flex flex-wrap ga-2">
        <v-btn
          :to="{ name: 'HostControl', params: { id: sessionId } }"
          prepend-icon="mdi-tune"
          variant="tonal"
        >
          Control panel
        </v-btn>
        <v-btn
          :to="{ name: 'BigScreen', params: { id: sessionId } }"
          color="primary"
          prepend-icon="mdi-projector-screen-outline"
          target="_blank"
        >
          Open big screen
        </v-btn>
      </div>
    </div>

    <QueryState
      :empty="leaderboard?.length === 0"
      :error="error"
      :loading="isPending"
      empty-text="Rankings appear once participants join."
      empty-title="Nobody on the board yet"
      @retry="refetch()"
    >
      <LeaderboardList v-if="leaderboard" :rows="leaderboard" />
    </QueryState>
  </v-container>
</template>
