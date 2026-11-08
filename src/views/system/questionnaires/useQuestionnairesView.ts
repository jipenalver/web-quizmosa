import { ref } from 'vue'
import { useDeleteQuestionnaire, useQuestionnairesQuery } from '@/stores/questionnaires'
import type { QuestionnaireWithCounts } from '@/types/questionnaires'
import { handleFormError } from '@/utils/helpers/forms'

export function useQuestionnairesView() {
  const questionnairesQuery = useQuestionnairesQuery()
  const deleteQuestionnaire = useDeleteQuestionnaire()

  // States
  const isFormOpen = ref(false)
  const editing = ref<QuestionnaireWithCounts | null>(null)
  const deleting = ref<QuestionnaireWithCounts | null>(null)
  const isDeleteOpen = ref(false)
  const notice = ref('')

  // Actions
  const onCreate = () => {
    editing.value = null
    isFormOpen.value = true
  }

  const onEdit = (questionnaire: QuestionnaireWithCounts) => {
    editing.value = questionnaire
    isFormOpen.value = true
  }

  const onAskDelete = (questionnaire: QuestionnaireWithCounts) => {
    deleting.value = questionnaire
    isDeleteOpen.value = true
  }

  const onConfirmDelete = async () => {
    if (!deleting.value) return

    try {
      await deleteQuestionnaire.mutateAsync(deleting.value.id)
    } catch (error) {
      notice.value = handleFormError(error).message
    } finally {
      isDeleteOpen.value = false
    }
  }

  // Expose State and Actions
  return {
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
  }
}
