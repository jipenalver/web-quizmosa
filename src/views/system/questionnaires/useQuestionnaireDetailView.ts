import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  useDeleteQuestion,
  useQuestionnaireQuery,
  useQuestionsQuery,
  useReorderQuestions,
} from '@/stores/questionnaires'
import type { QuestionWithKey } from '@/types/questionnaires'
import { handleFormError } from '@/utils/helpers/forms'

export function useQuestionnaireDetailView() {
  const route = useRoute()
  const questionnaireId = Number(route.params.id)

  const questionnaireQuery = useQuestionnaireQuery(questionnaireId)
  const questionsQuery = useQuestionsQuery(questionnaireId)
  const deleteQuestion = useDeleteQuestion()
  const reorderQuestions = useReorderQuestions(questionnaireId)

  // States
  const orderedQuestions = ref<QuestionWithKey[]>([])
  const isQuestionFormOpen = ref(false)
  const isImportOpen = ref(false)
  const editing = ref<QuestionWithKey | null>(null)
  const deleting = ref<QuestionWithKey | null>(null)
  const isDeleteOpen = ref(false)
  const notice = ref('')

  const isNoticeOpen = computed({
    get: () => notice.value !== '',
    set: (open) => {
      if (!open) notice.value = ''
    },
  })

  // The drag list needs its own copy, because it reorders before the save finishes.
  watch(
    questionsQuery.data,
    (questions) => {
      orderedQuestions.value = questions ? [...questions] : []
    },
    { immediate: true },
  )

  // Actions
  const onCreate = () => {
    editing.value = null
    isQuestionFormOpen.value = true
  }

  const onEdit = (question: QuestionWithKey) => {
    editing.value = question
    isQuestionFormOpen.value = true
  }

  const onAskDelete = (question: QuestionWithKey) => {
    deleting.value = question
    isDeleteOpen.value = true
  }

  const onConfirmDelete = async () => {
    if (!deleting.value) return

    try {
      await deleteQuestion.mutateAsync(deleting.value)
    } catch (error) {
      notice.value = handleFormError(error).message
    } finally {
      isDeleteOpen.value = false
    }
  }

  const onReorder = async () => {
    try {
      await reorderQuestions.mutateAsync(orderedQuestions.value.map((question) => question.id))
    } catch (error) {
      notice.value = handleFormError(error).message
    }
  }

  // Expose State and Actions
  return {
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
  }
}
