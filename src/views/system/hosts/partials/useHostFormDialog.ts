import { computed, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import type { VForm } from 'vuetify/components'
import { useQuestionnairesQuery } from '@/stores/questionnaires'
import { useCreateSession } from '@/stores/sessions'
import type { SessionKind } from '@/types/common'
import { formActionDefault } from '@/utils/helpers/constants'
import { handleFormError } from '@/utils/helpers/forms'

export function useHostFormDialog(isOpen: Ref<boolean>) {
  const router = useRouter()

  const questionnairesQuery = useQuestionnairesQuery()
  const createSession = useCreateSession()

  // States
  const questionnaireId = ref<number | null>(null)
  const kind = ref<SessionKind | null>(null)
  // Post-tests only. Pre-tests are always self-paced, which the server enforces.
  const selfPaced = ref(false)
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref<VForm | null>(null)

  // Only questionnaires with questions can be hosted.
  const questionnaireOptions = computed(() =>
    (questionnairesQuery.data.value ?? [])
      .filter((questionnaire) => (questionnaire.questions[0]?.count ?? 0) > 0)
      .map((questionnaire) => ({
        title: questionnaire.name,
        value: questionnaire.id,
      })),
  )

  watch(isOpen, (open) => {
    if (!open) return

    questionnaireId.value = null
    kind.value = null
    selfPaced.value = false
    formAction.value = { ...formActionDefault }
  })

  // Actions
  const onSubmit = async () => {
    if (questionnaireId.value === null || kind.value === null) return

    formAction.value = { ...formActionDefault, formProcess: true }

    try {
      const id = await createSession.mutateAsync({
        questionnaireId: questionnaireId.value,
        kind: kind.value,
        selfPaced: kind.value === 'posttest' && selfPaced.value,
      })
      isOpen.value = false
      router.push({ name: 'HostControl', params: { id } })
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
  return {
    questionnairesQuery,
    questionnaireId,
    kind,
    selfPaced,
    questionnaireOptions,
    formAction,
    refVForm,
    onFormSubmit,
  }
}
