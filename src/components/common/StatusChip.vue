<script setup lang="ts">
import type { SessionStatus } from '@/types/common'
import { statusColors, statusLabels } from '@/utils/helpers/constants'

defineProps<{ status: SessionStatus }>()
</script>

<template>
  <v-chip :color="statusColors[status]" size="small" variant="tonal">
    {{ statusLabels[status] }}
  </v-chip>
</template>
