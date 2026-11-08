<script setup lang="ts">
import type { QuestionnaireKind } from '@/types/common'
import { kindColors, kindLabels } from '@/utils/helpers/constants'

defineProps<{ kind: QuestionnaireKind }>()
</script>

<template>
  <v-chip :color="kindColors[kind]" size="small" variant="tonal">{{ kindLabels[kind] }}</v-chip>
</template>
