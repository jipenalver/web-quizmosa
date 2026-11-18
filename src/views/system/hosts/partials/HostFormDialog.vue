<script setup lang="ts">
import { useRules } from 'vuetify'
import { kindOptions } from '@/utils/helpers/constants'
import { useHostFormDialog } from './useHostFormDialog'

const isOpen = defineModel<boolean>({ required: true })

const rules = useRules()

const {
  questionnairesQuery,
  questionnaireId,
  kind,
  questionnaireOptions,
  formAction,
  refVForm,
  onFormSubmit,
} = useHostFormDialog(isOpen)
</script>

<template>
  <v-dialog v-model="isOpen" max-width="480">
    <v-card class="pa-2" title="New host">
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

          <v-select
            v-model="questionnaireId"
            :items="questionnaireOptions"
            :loading="questionnairesQuery.isPending.value"
            :rules="[rules.required('Choose a questionnaire')]"
            label="Questionnaire"
            class="mb-2"
            no-data-text="No questionnaires with questions yet"
          ></v-select>

          <v-select
            v-model="kind"
            :items="kindOptions"
            :rules="[rules.required('Choose a kind')]"
            hint="Pre-tests are self-paced. Post-tests are run question by question."
            label="Kind"
            persistent-hint
          ></v-select>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isOpen = false">Cancel</v-btn>
          <v-btn :loading="formAction.formProcess" color="primary" type="submit" variant="flat">
            Create
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
