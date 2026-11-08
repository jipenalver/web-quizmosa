import { computed, ref, watch, type Ref } from 'vue'
import type { VForm } from 'vuetify/components'
import { useSaveQuestion } from '@/stores/questionnaires'
import type { ChoiceKey } from '@/types/common'
import type { QuestionWithKey } from '@/types/questionnaires'
import { choiceKeys, formActionDefault, pointsDefault } from '@/utils/helpers/constants'
import { handleFormError } from '@/utils/helpers/forms'

export function useQuestionFormDialog(
  isOpen: Ref<boolean>,
  questionnaireId: number,
  question: () => QuestionWithKey | null,
) {
  const saveQuestion = useSaveQuestion()

  // States
  const formDataDefault = {
    prompt: '',
    choices: { A: '', B: '', C: '', D: '' } as Record<ChoiceKey, string>,
    correct: null as ChoiceKey | null,
    points: String(pointsDefault),
    seconds: '',
    imagePath: null as string | null,
    imageFile: null as File | null,
  }
  const formData = ref({ ...formDataDefault, choices: { ...formDataDefault.choices } })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref<VForm | null>(null)

  const isEditing = computed(() => question() !== null)

  const correctOptions = computed(() =>
    choiceKeys.filter((key) => formData.value.choices[key].trim() !== ''),
  )

  // Clearing the chosen answer's text must clear the answer too.
  watch(correctOptions, (options) => {
    const { correct } = formData.value
    if (correct && !options.includes(correct)) formData.value.correct = null
  })

  watch(isOpen, (open) => {
    if (!open) return

    const current = question()
    formAction.value = { ...formActionDefault }
    formData.value = current
      ? {
          prompt: current.prompt,
          choices: {
            A: current.choice_a,
            B: current.choice_b,
            C: current.choice_c ?? '',
            D: current.choice_d ?? '',
          },
          correct: (current.question_keys?.correct_choice as ChoiceKey | undefined) ?? null,
          points: String(current.points),
          seconds: current.seconds_override === null ? '' : String(current.seconds_override),
          imagePath: current.image_path,
          imageFile: null,
        }
      : { ...formDataDefault, choices: { ...formDataDefault.choices } }
  })

  // Actions
  const onRemoveImage = () => {
    formData.value.imagePath = null
    formData.value.imageFile = null
  }

  const onSubmit = async () => {
    const { prompt, choices, correct, points, seconds, imagePath, imageFile } = formData.value
    if (!correct) return

    formAction.value = { ...formActionDefault, formProcess: true }

    try {
      await saveQuestion.mutateAsync({
        id: question()?.id ?? null,
        questionnaireId,
        prompt,
        imagePath,
        previousImagePath: question()?.image_path ?? null,
        imageFile,
        choices,
        correct,
        points: Number(points),
        secondsOverride: seconds === '' ? null : Number(seconds),
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
  return {
    formData,
    formAction,
    refVForm,
    isEditing,
    correctOptions,
    onRemoveImage,
    onFormSubmit,
  }
}
