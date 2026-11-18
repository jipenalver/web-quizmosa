<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import KindChip from '@/components/common/KindChip.vue'
import QueryState from '@/components/common/QueryState.vue'
import StatusChip from '@/components/common/StatusChip.vue'
import { useSessionsQuery } from '@/stores/sessions'
import { formatDate } from '@/utils/helpers/dates'
import HostFormDialog from './partials/HostFormDialog.vue'

const { data: sessions, isPending, error, refetch } = useSessionsQuery()

const isFormOpen = ref(false)
</script>

<template>
  <v-container>
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
      <div>
        <span class="text-label">Live quizzes</span>
        <h1 class="text-headline-medium font-weight-bold">Hosts</h1>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="isFormOpen = true">New host</v-btn>
    </div>

    <v-card class="pa-2">
      <QueryState
        :empty="sessions?.length === 0"
        :error="error"
        :loading="isPending"
        empty-text="Create a host from a questionnaire to get a join code."
        empty-title="No hosts yet"
        @retry="refetch()"
      >
        <v-table hover>
          <thead>
            <tr>
              <th>Join code</th>
              <th>Questionnaire</th>
              <th>Kind</th>
              <th>Status</th>
              <th class="text-right">Participants</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in sessions" :key="session.id">
              <td>
                <RouterLink
                  :to="{ name: 'HostControl', params: { id: session.id } }"
                  class="font-weight-bold text-primary text-decoration-none"
                >
                  {{ session.join_code }}
                </RouterLink>
              </td>
              <td>{{ session.questionnaires?.name }}</td>
              <td>
                <KindChip :kind="session.kind" />
              </td>
              <td><StatusChip :status="session.status" /></td>
              <td class="text-right">{{ session.participants[0]?.count ?? 0 }}</td>
              <td>{{ formatDate(session.created_at) }}</td>
            </tr>
          </tbody>
        </v-table>
      </QueryState>
    </v-card>

    <HostFormDialog v-model="isFormOpen" />
  </v-container>
</template>
