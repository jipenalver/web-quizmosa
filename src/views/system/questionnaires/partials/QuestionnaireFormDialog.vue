<script setup lang="ts">
import { useRules } from 'vuetify'
import type { QuestionnaireWithCounts } from '@/types/questionnaires'
import { kindOptions, secondsMax, secondsMin } from '@/utils/helpers/constants'
import { useQuestionnaireFormDialog } from './useQuestionnaireFormDialog'

const isOpen = defineModel<boolean>({ required: true })

const props = defineProps<{ questionnaire: QuestionnaireWithCounts | null }>()

const rules = useRules()

const { formData, formAction, refVForm, isEditing, isKindLocked, onFormSubmit } =
  useQuestionnaireFormDialog(isOpen, () => props.questionnaire)

const secondsRule = (value: string) =>
  (Number.isInteger(Number(value)) && Number(value) >= secondsMin && Number(value) <= secondsMax) ||
  `Enter a whole number from ${secondsMin} to ${secondsMax}`
</script>

<template>
  <v-dialog v-model="isOpen" max-width="480">
    <v-card class="pa-2" :title="isEditing ? 'Edit questionnaire' : 'New questionnaire'">
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

          <v-text-field
            v-model="formData.name"
            :rules="[rules.required('Name is required')]"
            class="mb-2"
            label="Name"
          ></v-text-field>

          <v-select
            v-model="formData.kind"
            :disabled="isKindLocked"
            :hint="isKindLocked ? 'Kind is locked because this questionnaire has hosts.' : ''"
            :items="kindOptions"
            class="mb-2"
            label="Kind"
            persistent-hint
          ></v-select>

          <v-text-field
            v-model="formData.seconds"
            :rules="[secondsRule]"
            label="Seconds per question"
            type="number"
          ></v-text-field>
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
