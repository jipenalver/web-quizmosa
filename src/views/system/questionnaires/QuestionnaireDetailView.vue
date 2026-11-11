<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import KindChip from '@/components/common/KindChip.vue'
import QueryState from '@/components/common/QueryState.vue'
import QuestionImage from '@/components/common/QuestionImage.vue'
import type { QuestionWithKey } from '@/types/questionnaires'
import { choiceKeys } from '@/utils/helpers/constants'
import QuestionFormDialog from './partials/QuestionFormDialog.vue'
import QuestionImportDialog from './partials/QuestionImportDialog.vue'
import { useQuestionnaireDetailView } from './useQuestionnaireDetailView'

const {
  questionnaireId,
  questionnaireQuery,
  questionsQuery,
  deleteQuestion,
  reorderQuestions,
  orderedQuestions,
  isQuestionFormOpen,
  isImportOpen,
  editing,
  isDeleteOpen,
  notice,
  isNoticeOpen,
  onCreate,
  onEdit,
  onAskDelete,
  onConfirmDelete,
  onReorder,
  onShuffle,
  onResetOrder,
} = useQuestionnaireDetailView()

const { data: questionnaire } = questionnaireQuery
const { isPending, error, refetch } = questionsQuery

const choiceText = (question: QuestionWithKey, key: (typeof choiceKeys)[number]) =>
  ({ A: question.choice_a, B: question.choice_b, C: question.choice_c, D: question.choice_d })[key]
</script>

<template>
  <v-container>
    <RouterLink :to="{ name: 'Questionnaires' }" class="text-body-medium text-muted">
      Back to questionnaires
    </RouterLink>

    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mt-2 mb-6">
      <div>
        <h1 class="text-headline-medium font-weight-bold">{{ questionnaire?.name }}</h1>
        <div v-if="questionnaire" class="d-flex align-center ga-3 mt-1">
          <KindChip :kind="questionnaire.kind" />
          <span class="text-body-medium text-muted">
            {{ questionnaire.seconds_per_question }} seconds per question
          </span>
        </div>
      </div>

      <div>
        <div class="d-flex ga-2">
          <v-btn prepend-icon="mdi-code-json" variant="tonal" @click="isImportOpen = true">
            Import JSON
          </v-btn>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="onCreate">New question</v-btn>
        </div>

        <div class="d-flex justify-end ga-2 mt-6">
          <v-btn
            :disabled="orderedQuestions.length < 2 || reorderQuestions.isPending.value"
            prepend-icon="mdi-restore"
            size="small"
            variant="text"
            @click="onResetOrder"
          >
            Reset
          </v-btn>
          <v-btn
            :disabled="orderedQuestions.length < 2"
            :loading="reorderQuestions.isPending.value"
            prepend-icon="mdi-shuffle-variant"
            size="small"
            variant="tonal"
            @click="onShuffle"
          >
            Shuffle
          </v-btn>
        </div>
      </div>
    </div>

    <QueryState
      :empty="orderedQuestions.length === 0"
      :error="error"
      :loading="isPending"
      empty-text="Add questions one by one, or import them from JSON."
      empty-title="No questions yet"
      @retry="refetch()"
    >
      <VueDraggable
        v-model="orderedQuestions"
        :animation="150"
        :disabled="reorderQuestions.isPending.value"
        class="d-flex flex-column ga-3"
        handle=".drag-handle"
        @end="onReorder"
      >
        <v-card v-for="(question, index) in orderedQuestions" :key="question.id" class="pa-4">
          <div class="d-flex align-start ga-3">
            <v-icon
              aria-label="Drag to reorder"
              class="drag-handle mt-1"
              icon="mdi-drag"
              style="cursor: grab"
            ></v-icon>

            <div class="flex-grow-1" style="min-width: 0">
              <div class="text-title-medium font-weight-bold">
                {{ index + 1 }}. {{ question.prompt }}
              </div>

              <QuestionImage
                v-if="question.image_path"
                :path="question.image_path"
                class="mt-3"
                height="120"
                style="max-width: 240px"
              />

              <div class="d-flex flex-wrap ga-2 mt-3">
                <template v-for="key in choiceKeys" :key="key">
                  <v-chip
                    v-if="choiceText(question, key)"
                    :color="question.question_keys?.correct_choice === key ? 'success' : undefined"
                    :prepend-icon="
                      question.question_keys?.correct_choice === key ? 'mdi-check' : undefined
                    "
                    size="small"
                    variant="tonal"
                  >
                    {{ key }}. {{ choiceText(question, key) }}
                  </v-chip>
                </template>
              </div>

              <div class="text-body-small text-muted mt-3">
                {{ question.points }} points
                <template v-if="question.seconds_override">
                  · {{ question.seconds_override }} seconds
                </template>
                <span v-if="!question.question_keys" class="text-error">· No correct answer</span>
              </div>
            </div>

            <div class="text-no-wrap">
              <v-btn
                aria-label="Edit question"
                density="comfortable"
                icon="mdi-pencil-outline"
                variant="text"
                @click="onEdit(question)"
              ></v-btn>
              <v-btn
                aria-label="Delete question"
                density="comfortable"
                icon="mdi-delete-outline"
                variant="text"
                @click="onAskDelete(question)"
              ></v-btn>
            </div>
          </div>
        </v-card>
      </VueDraggable>
    </QueryState>

    <QuestionFormDialog
      v-model="isQuestionFormOpen"
      :question="editing"
      :questionnaire-id="questionnaireId"
    />

    <QuestionImportDialog v-model="isImportOpen" :questionnaire-id="questionnaireId" />

    <ConfirmDialog
      v-model="isDeleteOpen"
      :loading="deleteQuestion.isPending.value"
      text="Delete this question? This cannot be undone."
      title="Delete question"
      @confirm="onConfirmDelete"
    />

    <v-snackbar v-model="isNoticeOpen" color="error">{{ notice }}</v-snackbar>
  </v-container>
</template>
