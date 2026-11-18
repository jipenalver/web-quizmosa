<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import QueryState from '@/components/common/QueryState.vue'
import { formatDate } from '@/utils/helpers/dates'
import QuestionnaireFormDialog from './partials/QuestionnaireFormDialog.vue'
import { useQuestionnairesView } from './useQuestionnairesView'

const {
  questionnairesQuery,
  deleteQuestionnaire,
  isFormOpen,
  editing,
  deleting,
  isDeleteOpen,
  notice,
  onCreate,
  onEdit,
  onAskDelete,
  onConfirmDelete,
} = useQuestionnairesView()

const { data: questionnaires, isPending, error, refetch } = questionnairesQuery

const isNoticeOpen = computed({
  get: () => notice.value !== '',
  set: (open) => {
    if (!open) notice.value = ''
  },
})
</script>

<template>
  <v-container>
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
      <div>
        <span class="text-label">Library</span>
        <h1 class="text-headline-medium font-weight-bold">Questionnaires</h1>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="onCreate">New questionnaire</v-btn>
    </div>

    <v-card class="pa-2">
      <QueryState
        :empty="questionnaires?.length === 0"
        :error="error"
        :loading="isPending"
        empty-text="Create your first questionnaire to start hosting."
        empty-title="No questionnaires yet"
        @retry="refetch()"
      >
        <v-table hover>
          <thead>
            <tr>
              <th>Name</th>
              <th class="text-right">Questions</th>
              <th class="text-right">Seconds</th>
              <th class="text-right">Hosts</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="questionnaire in questionnaires" :key="questionnaire.id">
              <td>
                <RouterLink
                  :to="{ name: 'QuestionnaireDetail', params: { id: questionnaire.id } }"
                  class="font-weight-bold text-primary text-decoration-none"
                >
                  {{ questionnaire.name }}
                </RouterLink>
              </td>
              <td class="text-right">{{ questionnaire.questions[0]?.count ?? 0 }}</td>
              <td class="text-right">{{ questionnaire.seconds_per_question }}</td>
              <td class="text-right">{{ questionnaire.sessions[0]?.count ?? 0 }}</td>
              <td>{{ formatDate(questionnaire.created_at) }}</td>
              <td class="text-right text-no-wrap">
                <v-btn
                  aria-label="Edit questionnaire"
                  density="comfortable"
                  icon="mdi-pencil-outline"
                  variant="text"
                  @click="onEdit(questionnaire)"
                ></v-btn>
                <v-btn
                  :disabled="(questionnaire.sessions[0]?.count ?? 0) > 0"
                  aria-label="Delete questionnaire"
                  density="comfortable"
                  icon="mdi-delete-outline"
                  variant="text"
                  @click="onAskDelete(questionnaire)"
                ></v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </QueryState>
    </v-card>

    <QuestionnaireFormDialog v-model="isFormOpen" :questionnaire="editing" />

    <ConfirmDialog
      v-model="isDeleteOpen"
      :loading="deleteQuestionnaire.isPending.value"
      :text="`Delete “${deleting?.name}” and all its questions? This cannot be undone.`"
      title="Delete questionnaire"
      @confirm="onConfirmDelete"
    />

    <v-snackbar v-model="isNoticeOpen" color="error">{{ notice }}</v-snackbar>
  </v-container>
</template>
