import { computed, ref, watch, type Ref } from 'vue'
import type { VForm } from 'vuetify/components'
import { useSaveQuestionnaire } from '@/stores/questionnaires'
import type { QuestionnaireKind } from '@/types/common'
import type { QuestionnaireWithCounts } from '@/types/questionnaires'
import { formActionDefault } from '@/utils/helpers/constants'
import { handleFormError } from '@/utils/helpers/forms'

export function useQuestionnaireFormDialog(
  isOpen: Ref<boolean>,
  questionnaire: () => QuestionnaireWithCounts | null,
) {
  const saveQuestionnaire = useSaveQuestionnaire()

  // States
  const formDataDefault = {
    name: '',
    kind: 'standard' as QuestionnaireKind,
    seconds: '20',
  }
  const formData = ref({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref<VForm | null>(null)

  const isEditing = computed(() => questionnaire() !== null)
  // The database also blocks this, so past history keeps its kind.
  const isKindLocked = computed(() => (questionnaire()?.sessions[0]?.count ?? 0) > 0)

  watch(isOpen, (open) => {
    if (!open) return

    const current = questionnaire()
    formAction.value = { ...formActionDefault }
    formData.value = current
      ? {
          name: current.name,
          kind: current.kind,
          seconds: String(current.seconds_per_question),
        }
      : { ...formDataDefault }
  })

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    try {
      await saveQuestionnaire.mutateAsync({
        id: questionnaire()?.id ?? null,
        name: formData.value.name.trim(),
        kind: formData.value.kind,
        seconds_per_question: Number(formData.value.seconds),
      })
      isOpen.value = false
    } catch (error) {
      const { message, status } = handleFormError(error)
      formAction.value = {
        ...formActionDefault,
        formMessage: message,
        formStatus: status,
        formAlert: true,
      }
    } finally {
      formAction.value.formProcess = false
    }
  }

  // Trigger Validators
  const onFormSubmit = async () => {
    const result = await refVForm.value?.validate()
    if (result?.valid) onSubmit()
  }

  // Expose State and Actions
  return { formData, formAction, refVForm, isEditing, isKindLocked, onFormSubmit }
}
