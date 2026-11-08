<script setup lang="ts">
import { useRules } from 'vuetify'
import QuestionImage from '@/components/common/QuestionImage.vue'
import type { QuestionWithKey } from '@/types/questionnaires'
import {
  choiceKeys,
  imageMaxBytes,
  imageTypes,
  secondsMax,
  secondsMin,
} from '@/utils/helpers/constants'
import { useQuestionFormDialog } from './useQuestionFormDialog'

const isOpen = defineModel<boolean>({ required: true })

const props = defineProps<{
  questionnaireId: number
  question: QuestionWithKey | null
}>()

const rules = useRules()

const { formData, formAction, refVForm, isEditing, correctOptions, onRemoveImage, onFormSubmit } =
  useQuestionFormDialog(isOpen, props.questionnaireId, () => props.question)

const pointsRule = (value: string) =>
  (value !== '' && Number.isInteger(Number(value)) && Number(value) >= 0) ||
  'Enter a whole number of 0 or more'

const secondsRule = (value: string) =>
  value === '' ||
  (Number.isInteger(Number(value)) && Number(value) >= secondsMin && Number(value) <= secondsMax) ||
  `Leave empty, or enter ${secondsMin} to ${secondsMax}`

const imageRule = (value: File | File[] | null | undefined) => {
  const file = Array.isArray(value) ? value[0] : value
  if (!file) return true
  if (!imageTypes.includes(file.type)) return 'Use a PNG, JPEG, WebP or GIF image'
  return file.size <= imageMaxBytes || 'Images can be up to 5 MB'
}

const choiceRules = (key: string) =>
  key === 'A' || key === 'B' ? [rules.required(`Choice ${key} is required`)] : []
</script>

<template>
  <v-dialog v-model="isOpen" max-width="640">
    <v-card class="pa-2" :title="isEditing ? 'Edit question' : 'New question'">
      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-alert
            v-if="formAction.formAlert"
            :text="formAction.formMessage"
            class="mb-4"
            density="compact"
            type="error"
            variant="tonal"
          ></v-alert>

          <v-textarea
            v-model="formData.prompt"
            :rules="[rules.required('Prompt is required')]"
            auto-grow
            class="mb-2"
            label="Prompt"
            rows="2"
          ></v-textarea>

          <div v-if="formData.imagePath && !formData.imageFile" class="mb-4">
            <QuestionImage :path="formData.imagePath" class="mb-2" />
            <v-btn prepend-icon="mdi-close" size="small" variant="text" @click="onRemoveImage">
              Remove image
            </v-btn>
          </div>

          <v-file-input
            v-model="formData.imageFile"
            :rules="[imageRule]"
            accept="image/png,image/jpeg,image/webp,image/gif"
            class="mb-2"
            label="Image (optional)"
            prepend-icon=""
            prepend-inner-icon="mdi-image-outline"
          ></v-file-input>

          <v-text-field
            v-for="key in choiceKeys"
            :key="key"
            v-model="formData.choices[key]"
            :label="`Choice ${key}${key === 'C' || key === 'D' ? ' (optional)' : ''}`"
            :rules="choiceRules(key)"
            class="mb-2"
          ></v-text-field>

          <v-select
            v-model="formData.correct"
            :items="correctOptions"
            :rules="[rules.required('Choose the correct answer')]"
            class="mb-2"
            label="Correct answer"
          ></v-select>

          <div class="d-flex ga-4">
            <v-text-field
              v-model="formData.points"
              :rules="[pointsRule]"
              label="Points"
              type="number"
            ></v-text-field>
            <v-text-field
              v-model="formData.seconds"
              :rules="[secondsRule]"
              label="Seconds (optional)"
              type="number"
            ></v-text-field>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isOpen = false">Cancel</v-btn>
          <v-btn :loading="formAction.formProcess" color="primary" type="submit" variant="flat">
            Save
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
