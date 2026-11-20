<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import KindChip from '@/components/common/KindChip.vue'
import QueryState from '@/components/common/QueryState.vue'
import StatusChip from '@/components/common/StatusChip.vue'
import { useDeleteSession, useSessionsQuery } from '@/stores/sessions'
import type { HostSessionWithCounts } from '@/types/sessions'
import { formatDate } from '@/utils/helpers/dates'
import { handleFormError } from '@/utils/helpers/forms'
import HostFormDialog from './partials/HostFormDialog.vue'

const { data: sessions, isPending, error, refetch } = useSessionsQuery()
const deleteSession = useDeleteSession()

const isFormOpen = ref(false)
const deleting = ref<HostSessionWithCounts | null>(null)
const isDeleteOpen = ref(false)
const notice = ref('')

const isNoticeOpen = computed({
  get: () => notice.value !== '',
  set: (open) => {
    if (!open) notice.value = ''
  },
})

// A live host has quizzers on their phones, so it must be finished (or still in the lobby) first.
const isLive = (session: HostSessionWithCounts) =>
  session.status === 'question' || session.status === 'reveal'

const onAskDelete = (session: HostSessionWithCounts) => {
  deleting.value = session
  isDeleteOpen.value = true
}

const onConfirmDelete = async () => {
  if (!deleting.value) return

  try {
    await deleteSession.mutateAsync(deleting.value.id)
  } catch (error) {
    notice.value = handleFormError(error).message
  } finally {
    isDeleteOpen.value = false
  }
}
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
              <th></th>
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
                <KindChip :kind="session.kind" :self-paced="session.is_self_paced" />
              </td>
              <td><StatusChip :status="session.status" /></td>
              <td class="text-right">{{ session.participants[0]?.count ?? 0 }}</td>
              <td>{{ formatDate(session.created_at) }}</td>
              <td class="text-right">
                <v-btn
                  :disabled="isLive(session)"
                  aria-label="Delete host"
                  density="comfortable"
                  icon="mdi-delete-outline"
                  variant="text"
                  @click="onAskDelete(session)"
                ></v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </QueryState>
    </v-card>

    <HostFormDialog v-model="isFormOpen" />

    <ConfirmDialog
      v-model="isDeleteOpen"
      :loading="deleteSession.isPending.value"
      :text="`Delete host ${deleting?.join_code} with its ${deleting?.participants[0]?.count ?? 0} participants and all their answers? This cannot be undone.`"
      title="Delete host"
      @confirm="onConfirmDelete"
    />

    <v-snackbar v-model="isNoticeOpen" color="error">{{ notice }}</v-snackbar>
  </v-container>
</template>
