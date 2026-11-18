<script setup lang="ts">
import type { SessionKind } from '@/types/common'
import { kindColors, kindLabels } from '@/utils/helpers/constants'

defineProps<{ kind: SessionKind }>()
</script>

<template>
  <v-chip :color="kindColors[kind]" size="small" variant="tonal">{{ kindLabels[kind] }}</v-chip>
</template>
